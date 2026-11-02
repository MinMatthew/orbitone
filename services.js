const STORE_KEY = 'orbitone-service';

// YouTube plays inside the app; the others open the track in their own app.
export const SERVICES = {
  youtube: { label: 'YouTube' },
  spotify: { label: 'Spotify' },
  apple: { label: 'Apple Music' },
};

export function getService() {
  try {
    const value = localStorage.getItem(STORE_KEY);
    return Object.hasOwn(SERVICES, value) ? value : 'youtube';
  } catch { return 'youtube'; }
}

export function setService(value) {
  if (!Object.hasOwn(SERVICES, value)) return;
  try { localStorage.setItem(STORE_KEY, value); } catch { /* Storage unavailable: the choice only lasts for this page view. */ }
}

const isAppleLink = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['music.apple.com', 'itunes.apple.com'].includes(url.hostname);
  } catch { return false; }
};

// Opens the song itself when it is known, otherwise a search for it.
export function serviceLink(service, track, mapping = {}) {
  const query = encodeURIComponent(`${track.artist} ${track.title}`);
  if (service === 'spotify') {
    return /^[A-Za-z0-9]{22}$/.test(mapping.spotify ?? '')
      ? `https://open.spotify.com/track/${mapping.spotify}`
      : `https://open.spotify.com/search/${query}`;
  }
  if (service === 'apple') {
    return isAppleLink(track.url)
      ? track.url
      : `https://music.apple.com/${/^[a-z]{2}$/i.test(track.country ?? '') ? track.country.toLowerCase() : 'us'}/search?term=${query}`;
  }
  return '';
}

// Returns false when the browser blocked the new window.
export function openLink(url) {
  const opened = window.open(url, '_blank');
  if (!opened) return false;
  try { opened.opener = null; } catch { /* cross-origin window */ }
  return true;
}
