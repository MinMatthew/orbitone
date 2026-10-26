import { getJSON } from './lib.js';
import { cacheGet, cacheSet, lookupKey } from './cache.js?v=20';
import { normalize } from './youtube.js?v=20';

const ITUNES = 'https://itunes.apple.com';

function silentWavURL() {
  const bytes = new Uint8Array(44);
  const view = new DataView(bytes.buffer);
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, 'data'); view.setUint32(40, 0, true);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

function bestMatch(results, track) {
  const playable = results.filter(result => result.previewUrl);
  const title = normalize(track.title);
  return playable.find(result => normalize(result.trackName) === title)
    ?? playable.find(result => normalize(result.trackName).includes(title))
    ?? playable[0];
}

export async function findPreview(track) {
  const key = lookupKey('preview', track);
  const cached = await cacheGet(key);
  if (cached?.url) return cached.url;
  const country = (track.country || 'us').toUpperCase();
  let url = null;
  if (/^\d+$/.test(String(track.id))) {
    const data = await getJSON(`${ITUNES}/lookup?${new URLSearchParams({ id: track.id, country })}`, 8000);
    url = data.results?.find(result => result.previewUrl)?.previewUrl ?? null;
  }
  if (!url) {
    const query = new URLSearchParams({ term: `${track.artist} ${track.title}`, entity: 'song', country, limit: '5' });
    const data = await getJSON(`${ITUNES}/search?${query}`, 8000);
    url = bestMatch(data.results ?? [], track)?.previewUrl ?? null;
  }
  if (url) await cacheSet(key, { url });
  return url;
}

export class Preview {
  constructor(events) {
    this.live = false;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.setAttribute('playsinline', '');
    // `live` filters out events from the silent unlock clip and from stop().
    const on = (name, handler) => this.audio.addEventListener(name, () => { if (this.live) handler(); });
    on('playing', () => events.playing());
    on('pause', () => { if (!this.audio.ended) events.paused(); });
    on('waiting', () => events.buffering());
    on('ended', () => events.ended());
    on('error', () => events.error());
    on('timeupdate', () => events.progress(this.audio.currentTime, this.audio.duration));
  }

  // iOS only allows audio.play() that starts inside a tap, so the element is unlocked synchronously there.
  unlock() {
    this.live = false;
    this.audio.src = silentWavURL();
    this.audio.play().catch(() => {});
  }

  async start(url) {
    this.audio.src = url;
    this.live = true;
    await this.audio.play();
  }

  pause() { this.audio.pause(); }
  resume() { return this.audio.play(); }

  stop() {
    this.live = false;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}
