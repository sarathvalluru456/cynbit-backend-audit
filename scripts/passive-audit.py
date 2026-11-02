#!/usr/bin/env python3
"""Small passive collector for the public Cynbit pages.

Safety properties:
- fixed allowlist of public URLs
- GET only
- no form submission, POST, auth, hidden-path discovery, or concurrency
- one request per URL with a short timeout
"""
import argparse
import json
import re
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

URLS = [
    "https://www.cynbit.in/",
    "https://www.cynbit.in/contact",
    "https://www.cynbit.in/services",
    "https://www.cynbit.in/privacy",
    "https://www.cynbit.in/terms",
    "https://www.cynbit.in/cookies",
    "https://www.cynbit.in/robots.txt",
    "https://www.cynbit.in/sitemap.xml",
]
HEADER_NAMES = [
    "server", "content-type", "cache-control", "strict-transport-security",
    "content-security-policy", "x-frame-options", "permissions-policy",
    "referrer-policy", "x-content-type-options", "etag", "vary",
]


def inspect(url: str) -> dict:
    response = requests.get(
        url,
        timeout=15,
        allow_redirects=True,
        headers={"User-Agent": "cynbit-passive-audit/1.0"},
    )
    item = {
        "url": url,
        "final_url": response.url,
        "status": response.status_code,
        "bytes": len(response.content),
        "headers": {k: response.headers[k] for k in HEADER_NAMES if k in response.headers},
    }
    if "text/html" in response.headers.get("content-type", ""):
        soup = BeautifulSoup(response.text, "html.parser")
        item["forms"] = []
        for form in soup.find_all("form"):
            item["forms"].append({
                "action": form.get("action"),
                "method": form.get("method"),
                "fields": [x.get("name") for x in form.find_all(["input", "textarea", "select"]) if x.get("name")],
            })
        scripts = [urljoin(response.url, x.get("src")) for x in soup.find_all("script") if x.get("src")]
        item["script_count"] = len(scripts)
        item["next_static_scripts"] = [x for x in scripts if "/_next/static/" in x]
        item["server_action_hints"] = sorted(set(re.findall(r'createServerReference\([^)]*?"([A-Za-z0-9_-]+)"', response.text)))
    return item


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="evidence/latest.json")
    args = parser.parse_args()
    data = {"collected_at": datetime.now(timezone.utc).isoformat(), "mode": "passive-get-only", "pages": []}
    for url in URLS:
        try:
            data["pages"].append(inspect(url))
        except requests.RequestException as exc:
            data["pages"].append({"url": url, "error": type(exc).__name__})
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")
    print(f"wrote {args.output}")


if __name__ == "__main__":
    main()
