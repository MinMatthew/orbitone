// Client-side YouTube Data API access. The key is the user's own and stays on this device.
const KEY_NAME = 'orbitone-youtube-key';
const PENALIZED = ['live', 'cover', 'reaction', 'remix', 'karaoke', 'instrumental'];
const QUOTA_REASONS = ['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded'];

export class QuotaError extends Error {}
export class KeyError extends Error {}

export function getKey() {
  try { return localStorage.getItem(KEY_NAME) || ''; } catch { return ''; }
}

export function setKey(value) {
  try {
    if (value) localStorage.setItem(KEY_NAME, value);
    else localStorage.removeItem(KEY_NAME);
  } catch { /* Storage unavailable: the key only lives for this page view. */ }
}

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

export function apiError(status, body) {
  const reason = body?.error?.errors?.[0]?.reason || body?.error?.status || '';
  if (QUOTA_REASONS.includes(reason)) return new QuotaError(reason);
  if (status === 400 || status === 403) return new KeyError(body?.error?.message || reason || 'API 키를 확인해 주세요.');
  return new Error(`YouTube ${status}`);
}

export async function searchCandidates(track, key, fetcher = fetch) {
  const query = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoCategoryId: '10',
    videoEmbeddable: 'true',
    maxResults: '5',
    q: `${track.artist} ${track.title} official audio`,
    key,
  });
  if (/^[a-z]{2}$/i.test(track.country ?? '')) query.set('regionCode', track.country.toUpperCase());
  const response = await fetcher(`https://www.googleapis.com/youtube/v3/search?${query}`);
  if (!response.ok) throw apiError(response.status, await response.json().catch(() => null));
  const data = await response.json();
  return rankVideos(data.items ?? [], track).slice(0, 3);
}

export async function searchVideoIds(track, key, fetcher = fetch) {
  return (await searchCandidates(track, key, fetcher)).map(item => item.id.videoId);
}
