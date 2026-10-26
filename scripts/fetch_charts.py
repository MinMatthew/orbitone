"""Download Apple Music top-25 charts for every country in data.js into charts/<cc>.json.

Static hosting cannot call Apple's chart API from the browser (no CORS), so a scheduled job stores
the result next to the site. Standard library only.
"""
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "charts"
URL = "https://rss.marketingtools.apple.com/api/v2/{cc}/music/most-played/25/songs.json"
KEEP = ("id", "name", "artistName", "artworkUrl100", "url")


def country_codes():
    text = (ROOT / "data.js").read_text(encoding="utf-8")
    return re.findall(r"\['([a-z]{2})','\d{3}'", text)


def fetch(cc):
    request = Request(URL.format(cc=cc), headers={"User-Agent": "Orbitone-charts/1.0"})
    with urlopen(request, timeout=20) as response:
        data = json.loads(response.read(2_000_000))
    feed = data.get("feed", {})
    results = feed.get("results")
    if not results:
        raise ValueError("empty chart")
    trimmed = []
    for item in results:
        row = {key: item[key] for key in KEEP if key in item}
        row["genres"] = [{"genreId": g.get("genreId"), "name": g.get("name")} for g in item.get("genres", [])]
        trimmed.append(row)
    return {"feed": {"updated": feed.get("updated"), "results": trimmed}}


def load(cc):
    last = None
    for attempt in range(3):
        try:
            return cc, fetch(cc), None
        except Exception as error:  # network or provider hiccup: retry, then keep the previous file
            last = error
            time.sleep(1.5 * (attempt + 1))
    return cc, None, last


def main():
    OUT.mkdir(exist_ok=True)
    codes = country_codes()
    if not codes:
        sys.exit("no country codes found in data.js")
    written = unchanged = 0
    failed = []
    # Apple's endpoint answers in seconds; a small pool keeps the whole run well under a minute.
    with ThreadPoolExecutor(max_workers=8) as pool:
        for cc, chart, error in pool.map(load, codes):
            if chart is None:
                failed.append(f"{cc} ({error})")
                continue
            path = OUT / f"{cc}.json"
            # `updated` changes on every request; only rewrite when the ranking itself changed.
            if path.exists():
                old = json.loads(path.read_text(encoding="utf-8"))
                if old.get("feed", {}).get("results") == chart["feed"]["results"]:
                    unchanged += 1
                    continue
            path.write_text(json.dumps(chart, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            written += 1
    print(f"countries={len(codes)} written={written} unchanged={unchanged} failed={len(failed)}")
    for line in failed:
        print("  failed:", line)
    if len(failed) > len(codes) // 2:
        sys.exit("too many countries failed")


if __name__ == "__main__":
    main()
