#!/usr/bin/env python3
"""Enhanced link checker for pirahansiah.com and tiziran.com.
Crawls all pages, checks internal + external links, finds fuzzy matches.
Also scans local markdown files for broken references.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
import re
import os
import sys
import time

TIMEOUT = 8
MAX_WORKERS = 10
SIMILARITY_THRESHOLD = 0.6

TARGET_DOMAINS = ["pirahansiah.com", "tiziran.com"]

def similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def is_similar_domain(url, targets, threshold=SIMILARITY_THRESHOLD):
    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace("www.", "")
    for t in targets:
        if t in domain or similarity(domain, t) > threshold:
            return True
    return False

def fetch_page(url):
    try:
        resp = requests.get(url, timeout=TIMEOUT, headers={
            "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)"
        })
        resp.raise_for_status()
        return resp
    except Exception as e:
        return None

def crawl_site(base_url, max_pages=500):
    visited = set()
    to_visit = [base_url]
    all_links = {}
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop(0)
        if url in visited:
            continue
        visited.add(url)

        resp = fetch_page(url)
        if resp is None:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")
        links = soup.find_all("a", href=True)
        all_links[url] = []

        for link in links:
            href = link["href"]
            text = link.get_text(strip=True)[:60]

            if href.startswith("#") or not href:
                continue

            full_url = urljoin(url, href)
            parsed = urlparse(full_url)

            if parsed.scheme not in ("http", "https"):
                continue

            all_links[url].append((full_url, text))

            if parsed.netloc == base_domain and full_url not in visited:
                to_visit.append(full_url)

        time.sleep(0.1)

    return all_links, visited

def check_url(url):
    try:
        res = requests.head(url, allow_redirects=True, timeout=TIMEOUT, headers={
            "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)"
        })
        if res.status_code >= 400:
            try:
                res2 = requests.get(url, allow_redirects=True, timeout=TIMEOUT, headers={
                    "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0)"
                })
                return res2.status_code
            except:
                return res.status_code
        return res.status_code
    except requests.exceptions.ConnectionError:
        return -1
    except requests.exceptions.Timeout:
        return -2
    except Exception as e:
        return -3

def scan_markdown_files(contents_dir):
    """Scan local markdown files for internal link references."""
    broken_local = []
    all_md_files = []

    for root, dirs, files in os.walk(contents_dir):
        dirs[:] = [d for d in dirs if d not in (".git", "_site", ".jekyll-cache")]
        for f in files:
            if f.endswith((".md", ".html")):
                all_md_files.append(os.path.join(root, f))

    for md_path in all_md_files:
        try:
            with open(md_path, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue

        links = re.findall(r'\[([^\]]*)\]\(([^)]+)\)', content)
        images = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', content)
        refs = links + images

        for text, href in refs:
            if href.startswith(("http://", "https://", "#", "mailto:")):
                continue

            file_dir = os.path.dirname(md_path)
            target = os.path.normpath(os.path.join(file_dir, href))

            if not os.path.exists(target):
                rel_path = os.path.relpath(md_path, contents_dir)
                broken_local.append({
                    "file": rel_path,
                    "link": href,
                    "text": text[:40],
                    "resolved": target,
                })

    return broken_local, all_md_files

def main():
    print("=" * 70)
    print("  ENHANCED LINK CHECKER — pirahansiah.com + tiziran.com")
    print("=" * 70)

    all_broken = []
    all_similar = []

    for domain in TARGET_DOMAINS:
        base = f"https://www.{domain}/"
        print(f"\n--- Crawling {base} ---")

        all_links, pages = crawl_site(base)
        print(f"  Crawled {len(pages)} pages, found {sum(len(v) for v in all_links.values())} links")

        url_list = []
        for page_url, links in all_links.items():
            for href, text in links:
                url_list.append((href, text, page_url))

        seen = set()
        unique_urls = []
        for href, text, src in url_list:
            if href not in seen:
                seen.add(href)
                unique_urls.append((href, text, src))

        print(f"  Checking {len(unique_urls)} unique URLs...")

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_map = {}
            for href, text, src in unique_urls:
                f = executor.submit(check_url, href)
                future_map[f] = (href, text, src)

            checked = 0
            for future in as_completed(future_map):
                href, text, src = future_map[future]
                status = future.result()
                checked += 1

                if checked % 50 == 0:
                    print(f"    ... checked {checked}/{len(unique_urls)}")

                if status < 0:
                    err_msgs = {-1: "Connection refused", -2: "Timeout", -3: "Error"}
                    all_broken.append({
                        "status": status,
                        "url": href,
                        "text": text,
                        "source": src,
                        "error": err_msgs.get(status, "Unknown"),
                    })
                    print(f"  [ERROR] {err_msgs.get(status, '?')}: {href} ({text})")
                elif status >= 400:
                    all_broken.append({
                        "status": status,
                        "url": href,
                        "text": text,
                        "source": src,
                        "error": f"HTTP {status}",
                    })
                    print(f"  [BROKEN] {status}: {href} ({text})")

                if is_similar_domain(href, TARGET_DOMAINS) and urlparse(href).netloc not in [f"www.{d}" for d in TARGET_DOMAINS]:
                    all_similar.append({"url": href, "text": text, "source": src})

    print(f"\n--- Local Markdown File Check ---")
    contents_dir = "/Volumes/4tb/2026-07/myWebsite/notes"
    broken_local, md_files = scan_markdown_files(contents_dir)
    print(f"  Scanned {len(md_files)} markdown/HTML files")

    if broken_local:
        for item in broken_local:
            print(f"  [LOCAL BROKEN] {item['file']}: [{item['text']}]({item['link']})")

    print("\n" + "=" * 70)
    print("  RESULTS SUMMARY")
    print("=" * 70)
    print(f"  Broken links (HTTP): {len(all_broken)}")
    print(f"  Broken local refs:   {len(broken_local)}")
    print(f"  Similar domains:     {len(all_similar)}")

    if all_broken:
        print(f"\n  --- Broken HTTP Links ---")
        for item in sorted(all_broken, key=lambda x: x["url"]):
            print(f"  [{item['status']}] {item['url']}")
            print(f"      Text: {item['text']}")
            print(f"      Source: {item['source']}")
            print(f"      Error: {item['error']}")

    if broken_local:
        print(f"\n  --- Broken Local References ---")
        for item in broken_local:
            print(f"  {item['file']}: {item['link']}")
            print(f"      Resolved to: {item['resolved']}")

    if all_similar:
        print(f"\n  --- Similar Domain Links ---")
        for item in all_similar:
            print(f"  {item['url']} (from {item['source']})")

    return all_broken, broken_local, all_similar

if __name__ == "__main__":
    main()
