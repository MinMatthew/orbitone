import { safeImage } from './lib.js';
import { Player } from './player.js?v=22';
import { Preview, findPreview } from './preview.js?v=20';
import { cacheGet, cacheSet, lookupKey } from './cache.js?v=20';
import { getKey, searchVideoIds, KeyError, QuotaError } from './youtube.js?v=20';

const PREVIEW_MESSAGE = '30초 미리듣기';

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
      playing: () => this.set('playing', `${PREVIEW_MESSAGE} 재생 중`),
      paused: () => this.set('paused', '일시정지'),
      buffering: () => this.set('loading', '불러오는 중…'),
      ended: () => this.finish('미리듣기가 끝났습니다.'),
      error: () => this.fail('미리듣기를 재생할 수 없습니다.'),
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

  stop(message = '재생이 정지되었습니다.') {
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
      this.set('error', '오프라인에서는 재생할 수 없습니다. 연결을 확인해 주세요.');
      return;
    }
    if (mode === 'full') await this.startFull(track, token, options);
    else await this.startPreview(track, token, { allowFull: true, prompt: options.prompt });
  }

  async startPreview(track, token, { allowFull = false, prompt } = {}) {
    this.mode = 'preview';
    this.set('loading', `${PREVIEW_MESSAGE}을 불러오는 중…`);
    let url = null;
    try {
      url = await findPreview(track);
    } catch {
      if (token === this.token) {
        this.hooks.toast('미리듣기를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
        this.fail('미리듣기를 불러오지 못했습니다.');
      }
      return;
    }
    if (token !== this.token) return;
    if (!url) {
      if (allowFull) {
        this.hooks.toast('미리듣기가 없는 곡이라 전곡 듣기로 전환합니다.');
        await this.play(track, 'full', { prompt });
      } else {
        this.fail('이 곡은 재생할 수 있는 미리듣기가 없습니다.');
      }
      return;
    }
    try {
      await this.preview.start(url);
    } catch (error) {
      if (token !== this.token || error?.name === 'AbortError') return;
      this.set('paused', '재생 버튼을 눌러 시작해 주세요.');
    }
  }

  async startFull(track, token, options) {
    this.set('loading', '전곡 듣기를 준비하는 중…');
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
          ? '오늘 YouTube 검색 한도를 모두 사용해 30초 미리듣기로 재생합니다.'
          : error instanceof KeyError
            ? 'YouTube API 키를 사용할 수 없어 30초 미리듣기로 재생합니다.'
            : 'YouTube 검색에 실패해 30초 미리듣기로 재생합니다.';
        this.hooks.toast(text);
        await this.startPreview(track, token);
        return;
      }
      if (token !== this.token) return;
      if (!ids) {
        this.hooks.toast('API 키가 없어 30초 미리듣기로 재생합니다.');
        await this.startPreview(track, token);
        return;
      }
      if (!ids.length) {
        this.hooks.toast('재생 가능한 YouTube 영상을 찾지 못해 미리듣기로 재생합니다.');
        await this.startPreview(track, token);
        return;
      }
    }
    this.set('loading', 'YouTube 플레이어를 불러오는 중…');
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
        this.set('playing', 'YouTube · 전곡 듣기 재생 중');
        clearInterval(this.timer);
        this.timer = setInterval(() => {
          const { current, duration } = this.player.position();
          this.hooks.onProgress(current, duration);
        }, 500);
        break;
      case 'paused': this.set('paused', '일시정지'); break;
      case 'buffering': this.set('loading', '불러오는 중…'); break;
      case 'blocked': this.set('paused', '영상 안의 재생 버튼을 눌러주세요.'); break;
      case 'muted': this.hooks.toast('소리가 꺼진 채 재생 중입니다. 영상의 음소거를 해제해 주세요.'); this.set('playing', 'YouTube · 음소거 재생 중'); break;
      case 'retry':
        this.hooks.toast('이 영상은 재생할 수 없어 다른 후보를 시도합니다.');
        this.set('loading', '다른 영상을 불러오는 중…');
        break;
      case 'ended': this.finish('재생이 끝났습니다.'); break;
      case 'exhausted':
      case 'failed':
        clearInterval(this.timer);
        this.hooks.toast('YouTube 영상을 재생할 수 없어 30초 미리듣기로 전환합니다.');
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
