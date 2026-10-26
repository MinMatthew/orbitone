import { normalize } from './youtube.js?v=20';

const DB_NAME = 'orbitone-lookups';
const STORE = 'lookups';
const TTL = 7 * 24 * 60 * 60 * 1000;
let opened = null;

function open() {
  opened ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { opened = null; reject(request.error); };
  });
  return opened;
}

export const lookupKey = (kind, track) => `${kind}:${normalize(track.artist)}|${normalize(track.title)}`;

// Cache failures (private mode, quota) must never block playback.
export async function cacheGet(key) {
  try {
    const db = await open();
    return await new Promise(resolve => {
      const request = db.transaction(STORE).objectStore(STORE).get(key);
      request.onsuccess = () => {
        const hit = request.result;
        resolve(hit && Date.now() - hit.savedAt < TTL ? hit.value : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function cacheSet(key, value) {
  try {
    const db = await open();
    await new Promise(resolve => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put({ value, savedAt: Date.now() }, key);
      transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
    });
  } catch { /* ignore */ }
}
