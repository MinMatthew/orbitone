# Orbitone

A mobile-first PWA for discovering music by spinning a globe. Pick a country, see its Apple Music top 25, hear 30-second
previews or play the full track on YouTube, Spotify or Apple Music. It is a static site (GitHub Pages) with no backend:
GitHub Actions refresh the data files and commit them to the repository.

Live: https://minmatthew.github.io/orbitone/

## How the data flows

```
Apple Music RSS ──hourly──▶ scripts/fetch_charts.py ──▶ charts/<cc>.json   (overwritten, top 25 per country)
                                      ▲
                                      │ keeps the `youtube` ids already known
YouTube Data API ──daily──▶ scripts/youtube_links.mjs ──▶ data/youtube-links.json   (link store, never grows unbounded)
                                      └──────────────────▶ charts/<cc>.json  (adds `youtube` to each song)

Browser ──fetch──▶ charts/<cc>.json ──▶ song.youtube ? play it in the app : open a YouTube search
```

Listeners never need an API key. The app only reads `charts/<cc>.json`; old API keys saved by earlier versions are
removed from `localStorage` on start.

### Charts (hourly)

`.github/workflows/charts.yml` runs `scripts/fetch_charts.py` (Python standard library only). It overwrites
`charts/<cc>.json` for every country in `data.js` and `charts/index.json`, and keeps the `youtube` ids stored in
`data/youtube-links.json` so a refresh never drops them. Files are only rewritten when the ranking changes.

### YouTube links (daily)

`.github/workflows/youtube-links.yml` runs `scripts/youtube_links.mjs` (Node 20+, no dependencies) once a day.

- **Shared by song.** Links are keyed by Apple track id, so a song that charts in many countries is searched once and
  rank changes reuse the stored link.
- **Budget.** `search.list` costs 100 quota units per call. A run spends at most `YOUTUBE_DAILY_SEARCHES` searches
  (default 95, so 9,500 of the default 10,000 units) and tracks the spend per Pacific day, which is when the quota
  resets. When the budget or the quota runs out, stored links are kept and missing songs simply have no exact link yet.
- **Bootstrap.** The searched depth starts at rank 1 and grows by one rank per day until rank 25. Within a rank,
  countries are served round-robin from a saved cursor, so none is starved when the budget ends mid-rank.
- **Maintenance.** Once the depth is 25 only new songs, songs without a link (retried after 7 days) and links that
  have not been checked for 30 days are touched. Checking uses `videos.list` (1 unit per 50 videos); a video that is
  gone, private or no longer embeddable is dropped and searched again.
- **Bounded growth.** Charts are overwritten in place. A song that has not charted anywhere for 100 days is deleted
  from `data/youtube-links.json`, and the `s` (last seen) field is refreshed at most weekly to keep daily diffs small.
- **Fallback.** Songs without an exact link open a YouTube search (`youtubeSearchUrl` in `services.js`); if the browser
  blocks the new tab, the 30-second preview plays instead.

`data/youtube-links.json`:

```json
{"state":{"started":"2026-11-05","cursor":0,"usage":{"day":"2026-11-05","units":9500}},"links":{
"1234567890":{"v":"VIDEO_ID","c":"2026-11-05","s":"2026-11-05"}
}}
```

`v` is the video id (`null` when nothing suitable was found), `c` the day it was last checked, `s` the day the song
was last seen in a chart.

## Setup

1. Create a YouTube Data API v3 key in Google Cloud and restrict it to the YouTube Data API.
2. In the repository open **Settings → Secrets and variables → Actions → New repository secret** and add
   `YOUTUBE_API_KEY`. Never put the key in the code or in a commit.
3. Run **Actions → Update YouTube links → Run workflow** once, or wait for the daily schedule.
4. Without the secret the job still merges stored links; it just searches nothing.

## Local development

```sh
python3 server.py                 # http://127.0.0.1:5173 (npm start)
npm test                          # unit tests (Node 20+)
node scripts/youtube_links.mjs --dry-run   # shows today's plan without calling the API
YOUTUBE_API_KEY=... node scripts/youtube_links.mjs   # real run; changes data/ and charts/
python3 scripts/fetch_charts.py   # refresh the charts
```

## Releasing a change to the app shell

Module imports and `index.html` assets carry `?v=N`. After editing a shell file, bump its `?v=` everywhere it is
referenced (including the `FILES` list in `sw.js`) and bump `CACHE` in `sw.js`, so installed PWAs pick up the update.
`charts/` and `data/` are not cached by the service worker's shell list.
