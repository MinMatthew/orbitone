// Collects exact YouTube video ids for the charts in charts/<cc>.json and writes them back into those files.
//
// Runs once a day in GitHub Actions. Links live in data/youtube-links.json, keyed by Apple track id, so a song that
// charts in many countries is searched once. The search API costs 100 quota units a call, so each run spends at most
// YOUTUBE_DAILY_SEARCHES (default 95) searches' worth of units and keeps every stored link when the budget runs out.
//
// Bootstrap: the searched depth grows by one rank per day (rank 1 first, then 1-2, 1-3 ... up to 25), countries are
// served round-robin. Maintenance: once depth is 25 only new, missing or stale songs are searched.
// Node 20+, no dependencies.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHARTS = path.join(ROOT, 'charts');
const STORE = path.join(ROOT, 'data', 'youtube-links.json');

export const MAX_DEPTH = 25;
export const SEARCH_COST = 100;
export const VERIFY_COST = 1;
const RETRY_NONE_DAYS = 7;
const REVALIDATE_DAYS = 30;
const TOUCH_DAYS = 7;
const PRUNE_DAYS = 100;
const MAX_VERIFY_CALLS = 20;
const PENALIZED = ['live', 'cover', 'reaction', 'remix', 'karaoke', 'instrumental'];
const QUOTA_REASONS = ['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded'];

export class QuotaError extends Error {}

// ---- Scoring (picks the official-looking upload) ----

export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/\s*[(\[]\s*(?:feat|ft|featuring|with)\b[^)\]]*[)\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasWord(text, word) {
  return new RegExp(`(?:^|[^a-z])${word}(?:[^a-z]|$)`).test(text);
}

export function scoreVideo(item, track) {
  const title = String(item.snippet?.title ?? '').toLowerCase();
  const channel = String(item.snippet?.channelTitle ?? '').toLowerCase();
  const original = String(track.title ?? '').toLowerCase();
  const artist = normalize(track.artist).split(/\s*(?:,|&|\bfeat\b|\bx\b)\s*/)[0];
  let score = 0;
  let penalized = false;
  for (const word of PENALIZED) {
    if (hasWord(title, word) && !hasWord(original, word)) { score -= 20; penalized = true; }
  }
  if (artist && channel.includes(artist)) score += 3;
  if (/\btopic\b/.test(channel)) score += 3;
  if (channel.includes('vevo')) score += 3;
  if (channel.includes('official')) score += 2;
  if (title.includes(normalize(track.title))) score += 1;
  return { score, penalized };
}

export function rankVideos(items, track) {
  const scored = items
    .filter(item => item.id?.videoId)
    .map(item => ({ item, ...scoreVideo(item, track) }))
    .sort((a, b) => b.score - a.score);
  const clean = scored.filter(entry => !entry.penalized);
  return (clean.length ? clean : scored).map(entry => entry.item);
}

// ---- Dates (the quota resets at midnight Pacific time, so every day key uses that zone) ----

export function pacificDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

// ---- Planning ----

// Rank-major, then round-robin over countries starting at `cursor`, so a budget that ends mid-rank never starves
// the same countries every day. `charts` is { cc: [{ id, title, artist }] } in rank order.
export function planQueue({ charts, links, today, started, cursor = 0 }) {
  const codes = Object.keys(charts).sort();
  const first = codes.length ? cursor % codes.length : 0;
  const order = [...codes.slice(first), ...codes.slice(0, first)];
  const depth = Math.min(MAX_DEPTH, Math.max(0, daysBetween(started, today)) + 1);
  const queue = [];
  const queued = new Set();
  for (let rank = 1; rank <= depth; rank += 1) {
    for (const country of order) {
      const row = charts[country][rank - 1];
      if (!row || queued.has(row.id)) continue;
      const entry = links[row.id];
      const retry = entry && entry.v === null && daysBetween(entry.c, today) >= RETRY_NONE_DAYS;
      if (entry && !retry) continue;
      queued.add(row.id);
      queue.push({ id: row.id, title: row.title, artist: row.artist, country, rank });
    }
  }
  return { queue, depth, codes };
}

// Songs whose stored link has not been checked for a while; one cheap videos.list call covers 50 of them.
export function dueForVerify(links, today, limit = MAX_VERIFY_CALLS * 50) {
  return Object.entries(links)
    .filter(([, entry]) => entry.v && daysBetween(entry.c, today) >= REVALIDATE_DAYS)
    .map(([id]) => id)
    .slice(0, limit);
}

// Marks songs as seen, drops links nobody has charted for PRUNE_DAYS. Mutates `links`; returns how many were pruned.
export function refreshSeen(links, charts, today) {
  const present = new Set(Object.values(charts).flat().map(row => row.id));
  let pruned = 0;
  for (const [id, entry] of Object.entries(links)) {
    if (present.has(id)) {
      if (daysBetween(entry.s, today) >= TOUCH_DAYS) entry.s = today;
    } else if (daysBetween(entry.s, today) > PRUNE_DAYS) {
      delete links[id];
      pruned += 1;
    }
  }
  return pruned;
}

// Writes the exact ids into a chart's rows (and removes stale ones). Returns true when something changed.
export function applyLinks(chart, links) {
  let changed = false;
  for (const row of chart.feed?.results ?? []) {
    const video = links[row.id]?.v ?? null;
    if (video && row.youtube !== video) { row.youtube = video; changed = true; }
    else if (!video && 'youtube' in row) { delete row.youtube; changed = true; }
  }
  return changed;
}

// ---- Storage ----

export function emptyStore(today) {
  return { state: { started: today, cursor: 0, usage: { day: today, units: 0 } }, links: {} };
}

export async function loadStore(today) {
  try {
    const store = JSON.parse(await readFile(STORE, 'utf8'));
    if (store?.state && store.links && typeof store.links === 'object') return store;
  } catch { /* first run or unreadable file: start over */ }
  return emptyStore(today);
}

// One song per line keeps daily diffs small.
export function serialize(store) {
  const lines = Object.keys(store.links).sort().map(id => `${JSON.stringify(id)}:${JSON.stringify(store.links[id])}`);
  return `{"state":${JSON.stringify(store.state)},"links":{\n${lines.join(',\n')}\n}}\n`;
}

async function loadCharts() {
  const charts = {};
  const files = (await readdir(CHARTS)).filter(name => /^[a-z]{2}\.json$/.test(name)).sort();
  for (const name of files) {
    try {
      const data = JSON.parse(await readFile(path.join(CHARTS, name), 'utf8'));
      const rows = (data.feed?.results ?? []).slice(0, MAX_DEPTH).map(item => ({ id: String(item.id), title: item.name, artist: item.artistName }));
      if (rows.length) charts[name.slice(0, 2)] = rows;
    } catch { /* skip a broken file; the hourly job rewrites it */ }
  }
  return charts;
}

async function writeCharts(links) {
  const files = (await readdir(CHARTS)).filter(name => /^[a-z]{2}\.json$/.test(name));
  let written = 0;
  for (const name of files) {
    const file = path.join(CHARTS, name);
    let chart;
    try { chart = JSON.parse(await readFile(file, 'utf8')); } catch { continue; }
    if (!applyLinks(chart, links)) continue;
    await writeFile(file, JSON.stringify(chart));
    written += 1;
  }
  return written;
}

// ---- YouTube Data API (key goes in a header so it never shows up in a URL or an error message) ----

async function call(endpoint, params, key, fetcher = fetch) {
  const response = await fetcher(`https://www.googleapis.com/youtube/v3/${endpoint}?${new URLSearchParams(params)}`, { headers: { 'x-goog-api-key': key } });
  if (response.ok) return response.json();
  const body = await response.json().catch(() => null);
  const reason = body?.error?.errors?.[0]?.reason || body?.error?.status || '';
  if (QUOTA_REASONS.includes(reason)) throw new QuotaError(reason);
  throw Object.assign(new Error(`YouTube ${endpoint} failed: HTTP ${response.status} ${reason}`.trim()), { status: response.status });
}

export async function searchBest(track, key, fetcher = fetch) {
  const params = {
    part: 'snippet', type: 'video', videoCategoryId: '10', videoEmbeddable: 'true', maxResults: '5',
    q: `${track.artist} ${track.title} official audio`,
    fields: 'items(id/videoId,snippet(title,channelTitle))',
  };
  if (/^[a-z]{2}$/i.test(track.country ?? '')) params.regionCode = track.country.toUpperCase();
  const data = await call('search', params, key, fetcher);
  return rankVideos(data.items ?? [], track)[0]?.id.videoId ?? null;
}

// Returns the ids that can no longer be played in an embed.
export async function findBroken(ids, key, fetcher = fetch) {
  const data = await call('videos', { part: 'status', id: ids.join(','), fields: 'items(id,status(embeddable,privacyStatus,uploadStatus))' }, key, fetcher);
  const good = new Set((data.items ?? [])
    .filter(item => item.status?.embeddable && item.status.privacyStatus === 'public' && item.status.uploadStatus === 'processed')
    .map(item => item.id));
  return ids.filter(id => !good.has(id));
}

// ---- Run ----

export async function run({ key = process.env.YOUTUBE_API_KEY, dryRun = false, fetcher = fetch, now = new Date(), log = console.log } = {}) {
  const today = pacificDay(now);
  const budget = (Number(process.env.YOUTUBE_DAILY_SEARCHES) || 95) * SEARCH_COST;
  const store = await loadStore(today);
  const { state, links } = store;
  const charts = await loadCharts();
  if (state.usage?.day !== today) state.usage = { day: today, units: 0 };

  const pruned = refreshSeen(links, charts, today);
  const spend = units => { state.usage.units += units; };
  const room = cost => state.usage.units + cost <= budget;
  let verified = 0;
  let dropped = 0;
  let found = 0;
  let missing = 0;
  let stopped = '';

  if (dryRun) {
    const plan = planQueue({ charts, links, today, started: state.started, cursor: state.cursor });
    log(`dry run: depth ${plan.depth}, ${plan.queue.length} songs waiting, ${Math.floor(budget / SEARCH_COST)} searches allowed`);
  } else if (!key) {
    stopped = 'YOUTUBE_API_KEY is not set; only merging stored links';
  } else {
    try {
      const due = dueForVerify(links, today);
      for (let i = 0; i < due.length && room(VERIFY_COST); i += 50) {
        const batch = due.slice(i, i + 50);
        const broken = await findBroken(batch, key, fetcher);
        spend(VERIFY_COST);
        for (const id of batch) {
          if (broken.includes(id)) { delete links[id]; dropped += 1; } else links[id].c = today;
        }
        verified += batch.length;
      }

      const { queue, codes } = planQueue({ charts, links, today, started: state.started, cursor: state.cursor });
      let last = null;
      let failures = 0;
      for (const track of queue) {
        if (!room(SEARCH_COST)) { stopped = 'daily budget reached'; break; }
        let video;
        try {
          video = await searchBest(track, key, fetcher);
        } catch (error) {
          // A rejected key or request is a setup problem; only server and network hiccups are worth skipping.
          if (error instanceof QuotaError || error.status < 500) throw error;
          log(`skip ${track.id}: ${error.message}`);
          failures += 1;
          if (failures >= 5) { stopped = 'YouTube unavailable'; break; }
          continue;
        }
        failures = 0;
        spend(SEARCH_COST);
        links[track.id] = { v: video, c: today, s: today };
        if (video) found += 1; else missing += 1;
        last = track.country;
      }
      if (last) state.cursor = (codes.indexOf(last) + 1) % codes.length;
    } catch (error) {
      if (!(error instanceof QuotaError)) {
        await save(store, links, dryRun);
        throw error;
      }
      stopped = `quota exhausted (${error.message}); stored links kept`;
    }
  }

  const written = await save(store, links, dryRun);
  const total = new Set(Object.values(charts).flat().map(row => row.id));
  const covered = [...total].filter(id => links[id]).length;
  log(`searched=${found + missing} found=${found} none=${missing} verified=${verified} dropped=${dropped} pruned=${pruned} units=${state.usage.units}/${budget} covered=${covered}/${total.size} chartsUpdated=${written}${stopped ? ` (${stopped})` : ''}`);
  return { found, missing, verified, dropped, pruned, covered, total: total.size, written, stopped };
}

async function save(store, links, dryRun) {
  if (dryRun) return 0;
  await mkdir(path.dirname(STORE), { recursive: true });
  const text = serialize(store);
  let old = '';
  try { old = await readFile(STORE, 'utf8'); } catch { /* first run */ }
  if (text !== old) await writeFile(STORE, text);
  return writeCharts(links);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run({ dryRun: process.argv.includes('--dry-run') }).catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}
