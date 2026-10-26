import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, scoreVideo, rankVideos, apiError, searchVideoIds, QuotaError, KeyError } from '../youtube.js';

const track = { title: 'Love Dive', artist: 'IVE', country: 'kr' };
const video = (id, title, channelTitle) => ({ id: { videoId: id }, snippet: { title, channelTitle } });

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

test('classifies quota and key errors', () => {
  assert.ok(apiError(403, { error: { errors: [{ reason: 'quotaExceeded' }] } }) instanceof QuotaError);
  assert.ok(apiError(400, { error: { message: 'API key not valid' } }) instanceof KeyError);
  assert.ok(apiError(403, { error: { errors: [{ reason: 'ipRefererBlocked' }] } }) instanceof KeyError);
  assert.ok(!(apiError(500, null) instanceof KeyError));
});

test('searchVideoIds returns at most three ranked ids and sends the documented filters', async () => {
  let url;
  const fetcher = async requested => {
    url = new URL(requested);
    return { ok: true, json: async () => ({ items: ['a', 'b', 'c', 'd', 'e'].map(id => video(id, 'Love Dive', 'IVE')) }) };
  };
  const ids = await searchVideoIds(track, 'KEY', fetcher);
  assert.deepEqual(ids, ['a', 'b', 'c']);
  assert.equal(url.searchParams.get('videoEmbeddable'), 'true');
  assert.equal(url.searchParams.get('videoCategoryId'), '10');
  assert.equal(url.searchParams.get('q'), 'IVE Love Dive official audio');
  assert.equal(url.searchParams.get('regionCode'), 'KR');
});

test('searchVideoIds surfaces quota exhaustion', async () => {
  const fetcher = async () => ({ ok: false, status: 403, json: async () => ({ error: { errors: [{ reason: 'quotaExceeded' }] } }) });
  await assert.rejects(searchVideoIds(track, 'KEY', fetcher), QuotaError);
});
