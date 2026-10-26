import { $, readStore, writeStore } from './lib.js';

let ytReady, spotifyReady;

function youtubeSDK() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  ytReady ??= new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { ytReady = null; reject(new Error('YouTube 연결 시간 초과')); }, 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timeout); resolve(window.YT); };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timeout); ytReady = null; reject(new Error('YouTube 연결 실패')); };
    document.head.append(script);
  });
  return ytReady;
}

function spotifySDK() {
  spotifyReady ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => { spotifyReady = null; reject(new Error('Spotify 연결 시간 초과')); }, 15000);
    window.onSpotifyIframeApiReady = api => { clearTimeout(timer); resolve(api); };
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.onerror = () => { clearTimeout(timer); spotifyReady = null; reject(new Error('Spotify 연결 실패')); };
    document.head.append(script);
  });
  return spotifyReady;
}

export function parseMediaURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('HTTPS 링크를 입력해 주세요.');
  let youtube;
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(url.hostname)) {
    youtube = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1];
  } else if (url.hostname === 'youtu.be') {
    youtube = url.pathname.slice(1);
  }
  if (youtube && /^[\w-]{11}$/.test(youtube)) return { youtube };
  const spotify = url.hostname === 'open.spotify.com' && url.pathname.match(/^(?:\/intl-[a-z]+)?\/track\/([A-Za-z0-9]{22})\/?$/)?.[1];
  if (spotify) return { spotify };
  throw new Error('YouTube 영상 또는 Spotify 곡 링크를 확인해 주세요.');
}

const PLACEHOLDER = '<div class="video-placeholder"><p>음악과 함께, 그 장면 속으로</p><small>전체 듣기를 누르면 YouTube 플레이어가 표시됩니다</small></div>';

// Video embeds only. `emit(type, detail)` reports: playing, paused, buffering, blocked, ended, retry, exhausted, failed.
export class Player {
  constructor(emit) {
    this.emit = emit;
    this.links = readStore('orbitone-links', {});
    this.token = 0;
    this.yt = null;
    this.sp = null;
  }

  mapping(track) {
    return { ...(track.youtube ? { youtube: track.youtube } : {}), ...this.links[track.id] };
  }

  connect(track, link) {
    this.links[track.id] = { ...this.links[track.id], ...link };
    writeStore('orbitone-links', this.links);
  }

  stop() {
    this.token += 1;
    for (const name of ['yt', 'sp']) {
      try { this[name]?.destroy(); } catch { /* player already gone */ }
      this[name] = null;
    }
    $('media-host').innerHTML = PLACEHOLDER;
  }

  pause() { this.yt?.pauseVideo?.(); this.sp?.pause?.(); }
  resume() { this.yt?.playVideo?.(); this.sp?.resume?.(); }

  position() {
    try { return { current: this.yt?.getCurrentTime?.() ?? 0, duration: this.yt?.getDuration?.() ?? 0 }; } catch { return { current: 0, duration: 0 }; }
  }

  async playYoutube(ids) {
    this.stop();
    const token = this.token;
    try {
      const YT = await youtubeSDK();
      if (token !== this.token) return;
      const mount = document.createElement('div');
      $('media-host').replaceChildren(mount);
      let index = 0;
      // 2 invalid id, 5 HTML5 error, 100 removed/private, 101/150 embedding disallowed: try the next candidate.
      const next = code => {
        index += 1;
        if (index < ids.length) { this.emit('retry', { code, index }); this.yt.loadVideoById(ids[index]); return; }
        this.stop();
        this.emit('exhausted', { code });
      };
      this.yt = new YT.Player(mount, {
        host: 'https://www.youtube-nocookie.com',
        width: '100%',
        height: '100%',
        videoId: ids[0],
        playerVars: { playsinline: 1, origin: location.origin, rel: 0 },
        events: {
          onReady: event => { if (token === this.token) event.target.playVideo(); },
          onStateChange: event => {
            if (token !== this.token) return;
            const state = YT.PlayerState;
            if (event.data === state.PLAYING) this.emit('playing');
            else if (event.data === state.PAUSED) this.emit('paused');
            else if (event.data === state.BUFFERING) this.emit('buffering');
            else if (event.data === state.ENDED) this.emit('ended');
          },
          onError: event => { if (token === this.token) next(event.data); },
          onAutoplayBlocked: () => { if (token === this.token) this.emit('blocked'); },
        },
      });
    } catch (error) {
      if (token !== this.token) return;
      this.stop();
      this.emit('failed', { message: error.message });
    }
  }

  async playSpotify(id) {
    this.stop();
    const token = this.token;
    try {
      const api = await spotifySDK();
      if (token !== this.token) return;
      const mount = document.createElement('div');
      $('media-host').replaceChildren(mount);
      api.createController(mount, { uri: `spotify:track:${id}`, width: '100%', height: 232 }, controller => {
        if (token !== this.token) { controller.destroy(); return; }
        this.sp = controller;
        controller.addListener('ready', () => { if (token === this.token) controller.play(); });
        controller.addListener('playback_update', event => {
          if (token === this.token) this.emit(event.data.isPaused ? 'paused' : 'playing');
        });
      });
    } catch (error) {
      if (token !== this.token) return;
      this.stop();
      this.emit('failed', { message: error.message });
    }
  }
}
