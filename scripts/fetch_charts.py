"""Download Apple Music top-25 charts for every country in data.js into charts/<cc>.json.

Static hosting cannot call Apple's chart API from the browser (no CORS), so a scheduled job stores
the result next to the site. It also writes charts/index.json (country -> available/unavailable/unknown).
Standard library only.
"""
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "charts"
URL = "https://rss.marketingtools.apple.com/api/v2/{cc}/music/most-played/25/songs.json"
ITUNES_URL = "https://itunes.apple.com/{cc}/rss/topsongs/limit=25/json"
KEEP = ("id", "name", "artistName", "artworkUrl100", "url")


def country_codes():
    text = (ROOT / "data.js").read_text(encoding="utf-8")
    return re.findall(r"\['([a-z]{2})','\d{3}'", text)


def get_json(url):
    """Returns (data, http_status). Retries only on timeouts/5xx; 4xx means the storefront has no chart."""
    last = 0
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "Orbitone-charts/1.0"})
            with urlopen(request, timeout=15) as response:
                return json.loads(response.read(2_000_000)), 200
        except HTTPError as error:
            if error.code < 500:
                return None, error.code
            last = error.code
        except Exception:  # timeout or malformed body: provider hiccup
            last = 0
        time.sleep(2 * (attempt + 1))
    return None, last


def from_apple(data):
    feed = data.get("feed", {})
    results = feed.get("results")
    if not results:
        return None
    rows = []
    for item in results:
        row = {key: item[key] for key in KEEP if key in item}
        row["genres"] = [{"genreId": g.get("genreId"), "name": g.get("name")} for g in item.get("genres", [])]
        rows.append(row)
    return {"feed": {"updated": feed.get("updated"), "results": rows}}


def from_itunes(data):
    feed = data.get("feed", {})
    entries = feed.get("entry")
    if not entries:
        return None
    rows = []
    for item in entries:
        try:
            genre = item.get("category", {}).get("attributes", {})
            rows.append({
                "id": item["id"]["attributes"]["im:id"],
                "name": item["im:name"]["label"],
                "artistName": item["im:artist"]["label"],
                "artworkUrl100": item["im:image"][-1]["label"],
                "url": item["id"]["label"],
                "genres": [{"genreId": genre.get("im:id"), "name": genre.get("label")}] if genre else [],
            })
        except (KeyError, IndexError, TypeError):
            continue
    if not rows:
        return None
    return {"source": "itunes", "feed": {"updated": feed.get("updated", {}).get("label"), "results": rows}}


def load(cc):
    """Returns (cc, chart or None, storefront_missing)."""
    data, _ = get_json(URL.format(cc=cc))
    chart = from_apple(data) if data else None
    if chart:
        return cc, chart, False
    # iTunes' feed has fewer countries but covers a few that Apple's newer feed misses; HTTP 400 there means no storefront.
    data, itunes_status = get_json(ITUNES_URL.format(cc=cc))
    chart = from_itunes(data) if data else None
    if chart:
        return cc, chart, False
    return cc, None, itunes_status == 400


def main():
    OUT.mkdir(exist_ok=True)
    codes = country_codes()
    if not codes:
        sys.exit("no country codes found in data.js")
    written = unchanged = 0
    failed = []
    statuses = {}
    # Apple's endpoint answers 5xx when hit with many parallel requests, so keep the pool small.
    with ThreadPoolExecutor(max_workers=4) as pool:
        for cc, chart, missing in pool.map(load, codes):
            path = OUT / f"{cc}.json"
            if chart is None:
                failed.append(cc)
                # Keep the previous snapshot; only mark a country unavailable when it never had one.
                statuses[cc] = "available" if path.exists() else ("unavailable" if missing else "unknown")
                continue
            statuses[cc] = "available"
            # `updated` changes on every request; only rewrite when the ranking itself changed.
            if path.exists():
                old = json.loads(path.read_text(encoding="utf-8"))
                if old.get("feed", {}).get("results") == chart["feed"]["results"]:
                    unchanged += 1
                    continue
            path.write_text(json.dumps(chart, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            written += 1
    text = json.dumps({"countries": dict(sorted(statuses.items()))}, ensure_ascii=False, separators=(",", ":"))
    index_path = OUT / "index.json"
    if not index_path.exists() or index_path.read_text(encoding="utf-8") != text:
        index_path.write_text(text, encoding="utf-8")
    print(f"countries={len(codes)} written={written} unchanged={unchanged} failed={len(failed)}")
    for cc in failed:
        print(f"  failed: {cc} -> {statuses[cc]}")
    if len(failed) > len(codes) // 2:
        sys.exit("too many countries failed")


if __name__ == "__main__":
    main()
