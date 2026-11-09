import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../cache.js';
import { youtubeSearchUrl, serviceLink } from '../services.js';
import {
  scoreVideo, rankVideos, searchBest, findBroken, QuotaError, planQueue, dueForVerify, refreshSeen, applyLinks, serialize,
  pacificDay, daysBetween, progressOf, bootstrapDone, progressFile,
} from '../scripts/youtube_links.mjs';

const track = { title: 'Love Dive', artist: 'IVE', country: 'kr' };
const video = (id, title, channelTitle) => ({ id: { videoId: id }, snippet: { title, channelTitle } });
const row = id => ({ id, title: `Song ${id}`, artist: `Artist ${id}` });

test('normalize lowercases, trims and drops feat. in brackets', () => {
  assert.equal(normalize('  Hello   World (feat. Someone) '), 'hello world');
  assert.equal(normalize('Song [ft. A & B]'), 'song');
  assert.equal(normalize('Song (Live Version)'), 'song (live version)');
});

test('penalizes live/cover words unless the original title has them', () => {
  assert.ok(scoreVideo(video('a', 'Love Dive (Live)', 'IVE'), track).penalized);
  assert.ok(!scoreVideo(video('b', 'Live Forever (Live)', 'Oasis'), { title: 'Live Forever', artist: 'Oasis' }).penalized);
});

test('prefers official and topic channels, drops penalized when alternatives exist', () => {
  const ranked = rankVideos([
    video('cover', 'Love Dive cover', 'someone'),
    video('plain', 'Love Dive', 'random channel'),
    video('topic', 'Love Dive', 'IVE - Topic'),
  ], track);
  assert.deepEqual(ranked.map(item => item.id.videoId), ['topic', 'plain']);
});

test('keeps penalized videos only when nothing else is left', () => {
  const ranked = rankVideos([video('x', 'Love Dive remix', 'dj')], track);
  assert.equal(ranked.length, 1);
});

test('searchBest returns the top ranked id, sends the filters and keeps the key in a header', async () => {
  let url;
  let init;
  const fetcher = async (requested, options) => {
    url = new URL(requested);
    init = options;
    return { ok: true, json: async () => ({ items: [video('plain', 'Love Dive', 'random'), video('topic', 'Love Dive', 'IVE - Topic')] }) };
  };
  assert.equal(await searchBest(track, 'KEY', fetcher), 'topic');
  assert.equal(url.searchParams.get('videoEmbeddable'), 'true');
  assert.equal(url.searchParams.get('videoCategoryId'), '10');
  assert.equal(url.searchParams.get('q'), 'IVE Love Dive official audio');
  assert.equal(url.searchParams.get('regionCode'), 'KR');
  assert.equal(url.searchParams.has('key'), false);
  assert.equal(init.headers['x-goog-api-key'], 'KEY');
});

test('searchBest returns null without results and surfaces quota exhaustion', async () => {
  assert.equal(await searchBest(track, 'KEY', async () => ({ ok: true, json: async () => ({ items: [] }) })), null);
  const exhausted = async () => ({ ok: false, status: 403, json: async () => ({ error: { errors: [{ reason: 'quotaExceeded' }] } }) });
  await assert.rejects(searchBest(track, 'KEY', exhausted), QuotaError);
  const rejected = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'API key not valid' } }) });
  await assert.rejects(searchBest(track, 'KEY', rejected), error => error.status === 400);
});

test('findBroken flags missing, private and non-embeddable videos', async () => {
  const ok = { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' };
  const fetcher = async () => ({
    ok: true,
    json: async () => ({ items: [{ id: 'good', status: ok }, { id: 'locked', status: { ...ok, embeddable: false } }, { id: 'hidden', status: { ...ok, privacyStatus: 'private' } }] }),
  });
  assert.deepEqual(await findBroken(['good', 'locked', 'hidden', 'gone'], 'KEY', fetcher), ['locked', 'hidden', 'gone']);
});

test('day helpers use the Pacific calendar day', () => {
  assert.equal(pacificDay(new Date('2026-11-05T05:00:00Z')), '2026-11-04');
  assert.equal(pacificDay(new Date('2026-11-05T09:00:00Z')), '2026-11-05');
  assert.equal(daysBetween('2026-11-05', '2026-12-05'), 30);
});

test('planQueue starts with rank 1 and grows one rank per day', () => {
  const charts = { kr: [row('1'), row('2'), row('3')], us: [row('4'), row('5'), row('6')] };
  const day = today => planQueue({ charts, links: {}, today, started: '2026-11-05' });
  assert.deepEqual(day('2026-11-05').queue.map(item => item.id), ['1', '4']);
  assert.deepEqual(day('2026-11-06').queue.map(item => item.id), ['1', '4', '2', '5']);
  assert.equal(day('2026-11-06').depth, 2);
  assert.equal(planQueue({ charts, links: {}, today: '2027-01-01', started: '2026-11-05' }).depth, 25);
});

test('planQueue searches a song shared by several countries once and skips stored links', () => {
  const charts = { kr: [row('1'), row('2')], us: [row('1'), row('3')], jp: [row('9'), row('2')] };
  const links = { 9: { v: 'abcdefghijk', c: '2026-11-05', s: '2026-11-05' } };
  const { queue } = planQueue({ charts, links, today: '2026-11-06', started: '2026-11-05' });
  assert.deepEqual(queue.map(item => item.id), ['1', '2', '3']);
});

test('planQueue rotates countries from the cursor so none is starved', () => {
  const charts = { aa: [row('1')], bb: [row('2')], cc: [row('3')] };
  const ids = cursor => planQueue({ charts, links: {}, today: '2026-11-05', started: '2026-11-05', cursor }).queue.map(item => item.id);
  assert.deepEqual(ids(0), ['1', '2', '3']);
  assert.deepEqual(ids(2), ['3', '1', '2']);
});

test('maintenance only queues new songs and misses that are due for a retry', () => {
  const charts = { kr: [row('1'), row('2'), row('3')] };
  const links = {
    1: { v: 'abcdefghijk', c: '2026-11-05', s: '2026-11-05' },
    2: { v: null, c: '2026-11-05', s: '2026-11-05' },
  };
  const plan = today => planQueue({ charts, links, today, started: '2026-10-01' }).queue.map(item => item.id);
  assert.deepEqual(plan('2026-11-06'), ['3']);
  assert.deepEqual(plan('2026-11-13'), ['2', '3']);
});

test('dueForVerify picks links not checked for 30 days', () => {
  const links = {
    1: { v: 'aaaaaaaaaaa', c: '2026-10-01', s: '2026-11-01' },
    2: { v: 'bbbbbbbbbbb', c: '2026-11-04', s: '2026-11-04' },
    3: { v: null, c: '2026-09-01', s: '2026-11-01' },
  };
  assert.deepEqual(dueForVerify(links, '2026-11-05'), ['1']);
});

test('refreshSeen touches songs weekly and prunes songs absent for over 100 days', () => {
  const links = {
    1: { v: 'aaaaaaaaaaa', c: '2026-11-01', s: '2026-10-20' },
    2: { v: 'bbbbbbbbbbb', c: '2026-11-01', s: '2026-11-04' },
    3: { v: 'ccccccccccc', c: '2026-06-01', s: '2026-07-01' },
    4: { v: 'ddddddddddd', c: '2026-10-01', s: '2026-10-01' },
  };
  const pruned = refreshSeen(links, { kr: [row('1'), row('2')] }, '2026-11-05');
  assert.equal(pruned, 1);
  assert.deepEqual(Object.keys(links), ['1', '2', '4']);
  assert.equal(links[1].s, '2026-11-05');
  assert.equal(links[2].s, '2026-11-04');
});

test('applyLinks adds, replaces and removes the youtube field', () => {
  const chart = { feed: { results: [{ id: '1' }, { id: '2', youtube: 'old' }, { id: '3', youtube: 'stale' }] } };
  const links = { 1: { v: 'aaaaaaaaaaa' }, 2: { v: 'bbbbbbbbbbb' }, 3: { v: null } };
  assert.equal(applyLinks(chart, links), true);
  assert.deepEqual(chart.feed.results, [{ id: '1', youtube: 'aaaaaaaaaaa' }, { id: '2', youtube: 'bbbbbbbbbbb' }, { id: '3' }]);
  assert.equal(applyLinks(chart, links), false);
});

test('serialize writes one link per line and round-trips', () => {
  const store = { state: { started: '2026-11-05', cursor: 2, usage: { day: '2026-11-05', units: 100 } }, links: { 2: { v: null, c: 'd', s: 'd' }, 1: { v: 'aaaaaaaaaaa', c: 'd', s: 'd' } } };
  const text = serialize(store);
  assert.equal(text.split('\n').length, 5);
  assert.deepEqual(JSON.parse(text), store);
});

test('youtubeSearchUrl searches for the artist and title', () => {
  const url = new URL(youtubeSearchUrl({ artist: 'IVE', title: 'Love Dive' }));
  assert.equal(url.hostname, 'www.youtube.com');
  assert.equal(url.searchParams.get('search_query'), 'IVE Love Dive official audio');
  assert.equal(serviceLink('youtube', { artist: 'IVE', title: 'Love Dive' }), url.href);
});

test('progressOf counts chart rows with a video and songs already searched', () => {
  const charts = { kr: [row('1'), row('2')], us: [row('1'), row('3')] };
  const links = { 1: { v: 'aaaaaaaaaaa' }, 2: { v: null } };
  assert.deepEqual(progressOf(charts, links), { rows: 4, linked: 2, songs: 3, covered: 2 });
});

test('bootstrap is done only at full depth with every song searched', () => {
  assert.equal(bootstrapDone({ songs: 3, covered: 3 }, 25), true);
  assert.equal(bootstrapDone({ songs: 3, covered: 3 }, 24), false);
  assert.equal(bootstrapDone({ songs: 3, covered: 2 }, 25), false);
});

test('progressFile reports the percentage of chart rows with a video', () => {
  assert.deepEqual(progressFile({ rows: 4275, linked: 1356, songs: 2175, covered: 400 }, {}, '2026-11-09'), { day: '2026-11-09', percent: 31.7, linked: 1356, total: 4275, done: false });
  assert.equal(progressFile({ rows: 0, linked: 0, songs: 0, covered: 0 }, { completed: '2026-11-29' }, '2026-11-29').done, true);
});
