import { safeImage } from './lib.js';
import { Player } from './player.js?v=23';
import { Preview, findPreview } from './preview.js?v=20';
import { cacheGet, cacheSet, lookupKey } from './cache.js?v=20';
import { getKey, searchVideoIds, KeyError, QuotaError } from './youtube.js?v=21';

const PREVIEW_MESSAGE = '30-second preview';

// States: idle | loading | playing | paused | error. Modes: preview | full. One track plays at a time.
export class Playback {
  /**
   * hooks: onChange({state, mode, track, message}), onProgress(seconds, duration), onEnded(track),
   * onPrevious(), onNext(), toast(text), askKey(problem) -> Promise<boolean>
   */
  constructor(hooks) {
    this.hooks = hooks;
    this.state = 'idle';
    this.mode = null;
    this.track = null;
    this.token = 0;
    this.timer = 0;
    this.pending = new Map();
    this.player = new Player((type, detail) => this.onVideo(type, detail));
    this.preview = new Preview({
      playing: () => this.set('playing', `${PREVIEW_MESSAGE} playing`),
      paused: () => this.set('paused', 'Paused'),
      buffering: () => this.set('loading', 'Loading…'),
      ended: () => this.finish('The preview has ended.'),
      error: () => this.fail('The preview could not be played.'),
      progress: (seconds, duration) => this.hooks.onProgress(seconds, Number.isFinite(duration) ? duration : 30),
    });
    this.bindMediaSession();
  }

  set(state, message = '') {
    this.state = state;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = state === 'playing' ? 'playing' : state === 'paused' ? 'paused' : 'none';
    this.hooks.onChange({ state, mode: this.mode, track: this.track, message });
  }

  halt() {
    this.token += 1;
    clearInterval(this.timer);
    this.preview.stop();
    this.player.stop();
    this.hooks.onProgress(0, 0);
  }

  stop(message = 'Playback stopped.') {
    this.halt();
    this.mode = null;
    this.track = null;
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = null;
    this.set('idle', message);
  }

  fail(message) {
    this.halt();
    this.set('error', message);
  }

  finish(message) {
    const ended = this.track;
    this.halt();
    this.mode = null;
    this.track = null;
    this.set('idle', message);
    this.hooks.onEnded(ended);
  }

  async play(track, mode = 'preview', options = {}) {
    this.halt();
    this.preview.unlock();
    const token = this.token;
    this.track = track;
    this.mode = mode;
    this.showMetadata(track);
    if (!navigator.onLine) {
      this.set('error', 'Playback is unavailable offline. Please check your connection.');
      return;
    }
    if (mode === 'full') await this.startFull(track, token, options);
    else await this.startPreview(track, token, { allowFull: true, prompt: options.prompt });
  }

  async startPreview(track, token, { allowFull = false, prompt } = {}) {
    this.mode = 'preview';
    this.set('loading', `Loading ${PREVIEW_MESSAGE}…`);
    let url = null;
    try {
      url = await findPreview(track);
    } catch {
      if (token === this.token) {
        this.hooks.toast('Could not load the preview. Please check your network.');
        this.fail('Could not load the preview.');
      }
      return;
    }
    if (token !== this.token) return;
    if (!url) {
      if (allowFull) {
        this.hooks.toast('This track has no preview, so switching to full-track playback.');
        await this.play(track, 'full', { prompt });
      } else {
        this.fail('This track has no playable preview.');
      }
      return;
    }
    try {
      await this.preview.start(url);
    } catch (error) {
      if (token !== this.token || error?.name === 'AbortError') return;
      this.set('paused', 'Press play to start.');
    }
  }

  async startFull(track, token, options) {
    this.set('loading', 'Preparing full-track playback…');
    const manual = this.player.mapping(track);
    if (!manual.youtube && manual.spotify) {
      await this.player.playSpotify(manual.spotify);
      return;
    }
    let ids = manual.youtube ? [manual.youtube] : null;
    if (!ids) {
      try {
        ids = await this.lookupIds(track, token, options);
      } catch (error) {
        if (token !== this.token) return;
        const text = error instanceof QuotaError
          ? "Today's YouTube search quota is used up, so playing the 30-second preview."
          : error instanceof KeyError
            ? 'The YouTube API key cannot be used, so playing the 30-second preview.'
            : 'YouTube search failed, so playing the 30-second preview.';
        this.hooks.toast(text);
        await this.startPreview(track, token);
        return;
      }
      if (token !== this.token) return;
      if (!ids) {
        this.hooks.toast('No API key, so playing the 30-second preview.');
        await this.startPreview(track, token);
        return;
      }
      if (!ids.length) {
        this.hooks.toast('No playable YouTube video found, so playing the preview.');
        await this.startPreview(track, token);
        return;
      }
    }
    this.set('loading', 'Loading the YouTube player…');
    this.player.playYoutube(ids);
  }

  // Returns video ids, or null when the user declined to provide an API key.
  async lookupIds(track, token, options) {
    const name = lookupKey('youtube', track);
    const cached = await cacheGet(name);
    if (cached?.ids?.length) return cached.ids;
    let problem = '';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (token !== this.token) return null;
      if (!getKey() || problem) {
        const mayAsk = options.prompt !== false || problem;
        if (!mayAsk || !(await this.hooks.askKey(problem)) || !getKey()) return null;
      }
      try {
        const ids = await this.dedupe(name, () => searchVideoIds(track, getKey()));
        if (ids.length) await cacheSet(name, { ids });
        return ids;
      } catch (error) {
        if (!(error instanceof KeyError)) throw error;
        problem = error.message;
      }
    }
    throw new KeyError(problem);
  }

  dedupe(name, task) {
    if (!this.pending.has(name)) this.pending.set(name, task().finally(() => this.pending.delete(name)));
    return this.pending.get(name);
  }

  onVideo(type) {
    if (this.mode !== 'full') return;
    const track = this.track;
    const token = this.token;
    switch (type) {
      case 'playing':
        this.set('playing', 'YouTube · Playing full track');
        clearInterval(this.timer);
        this.timer = setInterval(() => {
          const { current, duration } = this.player.position();
          this.hooks.onProgress(current, duration);
        }, 500);
        break;
      case 'paused': this.set('paused', 'Paused'); break;
      case 'buffering': this.set('loading', 'Loading…'); break;
      case 'blocked': this.set('paused', 'Press the play button inside the video.'); break;
      case 'muted': this.hooks.toast('Playing without sound. Please unmute the video.'); this.set('playing', 'YouTube · Playing muted'); break;
      case 'retry':
        this.hooks.toast('This video cannot be played, so trying another candidate.');
        this.set('loading', 'Loading another video…');
        break;
      case 'ended': this.finish('Playback has ended.'); break;
      case 'exhausted':
      case 'failed':
        clearInterval(this.timer);
        this.hooks.toast('The YouTube video cannot be played, so switching to the 30-second preview.');
        this.startPreview(track, token);
        break;
    }
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  pause() {
    if (this.mode === 'preview') this.preview.pause();
    else this.player.pause();
  }

  resume() {
    if (this.mode === 'preview') this.preview.resume().catch(() => {});
    else this.player.resume();
  }

  showMetadata(track) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.countryName ? `Orbitone · ${track.countryName}` : 'Orbitone',
      artwork: [{ src: new URL(safeImage(track.artwork), location.href).href, sizes: '600x600' }],
    });
  }

  bindMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const bind = (action, handler) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ } };
    bind('play', () => this.resume());
    bind('pause', () => this.pause());
    bind('stop', () => this.stop());
    bind('previoustrack', () => this.hooks.onPrevious());
    bind('nexttrack', () => this.hooks.onNext());
  }
}
