"""Vercel Python function. Fixed-host proxy; no credentials required."""
import json
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen


def fetch_chart(country):
    if not re.fullmatch(r"[a-z]{2}", country):
        raise ValueError("Expected a two-letter country code")
    url = f"https://rss.marketingtools.apple.com/api/v2/{country}/music/most-played/25/songs.json"
    request = Request(url, headers={"User-Agent": "Orbitone/1.0"})
    with urlopen(request, timeout=6) as response:
        body = response.read(2_000_000)
    data = json.loads(body)
    if not data.get("feed", {}).get("results"):
        raise ValueError("No chart available")
    return body


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        country = parse_qs(urlsplit(self.path).query).get("country", ["kr"])[0]
        try:
            body = fetch_chart(country)
            status = 200
        except ValueError:
            body, status = b'{"error":"Invalid country or unavailable chart"}', 400
        except Exception:
            body, status = b'{"error":"Chart provider unavailable"}', 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "public, s-maxage=900, max-age=60" if status == 200 else "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
