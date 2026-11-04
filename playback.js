import { safeImage } from './lib.js?v=5';
import { t } from './i18n.js?v=7';
import { Player } from './player.js?v=24';
import { Preview, findPreview } from './preview.js?v=21';
import { cacheGet, cacheSet, lookupKey } from './cache.js?v=21';
import { getKey, searchVideoIds, KeyError, QuotaError } from './youtube.js?v=22';
import { SERVICES, serviceLink, openLink } from './services.js?v=1';

// States: idle | loading | playing | paused | error. Modes: preview | full. One track plays at a time.
export class Playback {
  /**
   * hooks: onChange({state, mode, track, message}), onProgress(seconds, duration), onEnded(track),
   * onPrevious(), onNext(), toast(text), askKey(problem) -> Promise<boolean>, service() -> 'youtube' | 'spotify' | 'apple'
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
      playing: () => this.set('playing', t('ui.previewPlaying')),
      paused: () => this.set('paused', t('ui.paused')),
      buffering: () => this.set('loading', t('ui.loading')),
      ended: () => this.finish(t('ui.previewEnded')),
      error: () => this.fail(t('ui.previewError')),
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

  stop(message = t('ui.stopped')) {
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
    if (mode === 'full' && this.hooks.service() !== 'youtube') {
      this.openExternal(track);
      return;
    }
    this.preview.unlock();
    const token = this.token;
    this.track = track;
    this.mode = mode;
    this.showMetadata(track);
    if (!navigator.onLine) {
      this.set('error', t('ui.offlineUnavailable'));
      return;
    }
    if (mode === 'full') await this.startFull(track, token, options);
    else await this.startPreview(track, token, { allowFull: true, prompt: options.prompt });
  }

  // Must run synchronously inside the tap so the browser lets the other app open.
  openExternal(track) {
    const service = this.hooks.service();
    const { label } = SERVICES[service];
    this.mode = null;
    this.track = null;
    if (openLink(serviceLink(service, track, this.player.mapping(track)))) this.stop(t('ui.opened', { service: label }));
    else this.fail(t('ui.openFailed', { service: label }));
  }

  async startPreview(track, token, { allowFull = false, prompt } = {}) {
    this.mode = 'preview';
    this.set('loading', t('ui.loadingPreview'));
    let url = null;
    try {
      url = await findPreview(track);
    } catch {
      if (token === this.token) {
        this.hooks.toast(t('ui.previewLoadToast'));
        this.fail(t('ui.previewLoadFail'));
      }
      return;
    }
    if (token !== this.token) return;
    if (!url) {
      if (allowFull) {
        this.hooks.toast(t('ui.noPreviewSwitch'));
        await this.play(track, 'full', { prompt });
      } else {
        this.fail(t('ui.noPreview'));
      }
      return;
    }
    try {
      await this.preview.start(url);
    } catch (error) {
      if (token !== this.token || error?.name === 'AbortError') return;
      this.set('paused', t('ui.pressPlay'));
    }
  }

  async startFull(track, token, options) {
    this.set('loading', t('ui.preparingFull'));
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
          ? t('ui.quotaOut')
          : error instanceof KeyError
            ? t('ui.keyUnusable')
            : t('ui.searchFailedPreview');
        this.hooks.toast(text);
        await this.startPreview(track, token);
        return;
      }
      if (token !== this.token) return;
      if (!ids) {
        this.hooks.toast(t('ui.noKeyPreview'));
        await this.startPreview(track, token);
        return;
      }
      if (!ids.length) {
        this.hooks.toast(t('ui.noVideoPreview'));
        await this.startPreview(track, token);
        return;
      }
    }
    this.set('loading', t('ui.loadingYoutube'));
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
        this.set('playing', t('ui.ytPlaying'));
        clearInterval(this.timer);
        this.timer = setInterval(() => {
          const { current, duration } = this.player.position();
          this.hooks.onProgress(current, duration);
        }, 500);
        break;
      case 'paused': this.set('paused', t('ui.paused')); break;
      case 'buffering': this.set('loading', t('ui.loading')); break;
      case 'blocked': this.set('paused', t('ui.pressInVideo')); break;
      case 'muted': this.hooks.toast(t('ui.muted')); this.set('playing', t('ui.ytMuted')); break;
      case 'retry':
        this.hooks.toast(t('ui.retry'));
        this.set('loading', t('ui.loadingAnother'));
        break;
      case 'ended': this.finish(t('ui.ended')); break;
      case 'exhausted':
      case 'failed':
        clearInterval(this.timer);
        this.hooks.toast(t('ui.ytFailedPreview'));
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
