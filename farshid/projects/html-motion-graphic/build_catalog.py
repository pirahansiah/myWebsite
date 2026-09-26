#!/usr/bin/env python3
"""Rebuild catalog.js from the neighboring website's canonical sitemap."""
from __future__ import annotations

import html
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from urllib.parse import quote

PROJECT = Path(__file__).resolve().parent
SITE_ROOT = PROJECT.parents[2]
SITEMAP = SITE_ROOT / "sitemap.xml"
ORIGIN = "https://pirahansiah.com"
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def category_for(path: str) -> str:
    name = Path(path).name.lower()
    if path.endswith(".html"):
        return "Site & tools"
    if "/projects/" in path:
        return "Projects"
    if "/expert-coaching-resources/" in path:
        return "Coaching resources"
    if name.startswith(("books-", "journals-", "papers-", "patents-")) or name == "conference-paper.md":
        return "Research & publications"
    if name.startswith("course-"):
        return "Courses"
    if name.startswith(("presentation", "keynotes", "slides")):
        return "Talks & presentations"
    if name.startswith(("note-", "prompts.md", "optimization-index.md", "wiki.md")):
        return "Notes & guides"
    return "Site & services"


def title_for(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix.lower() == ".md":
        front = re.search(r"^---\s*\n(.*?)\n---", text, re.S)
        if front:
            match = re.search(r"^title:\s*(.*?)\s*$", front.group(1), re.M)
            if match:
                value = match.group(1).strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    value = value[1:-1]
                return html.unescape(value).strip()
        heading = re.search(r"^#\s+(.+)$", text, re.M)
        if heading:
            return html.unescape(heading.group(1).strip())
    else:
        match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
        if match:
            return html.unescape(re.sub(r"\s+", " ", match.group(1))).strip()
    return path.stem.replace("-", " ").title()


def rendered_url(site_path: str) -> str:
    if site_path.endswith("/farshid/content/index.html"):
        return f"{ORIGIN}/farshid/content/index.html"
    if site_path.endswith("/farshid/content/swarm.html"):
        return f"{ORIGIN}/farshid/content/swarm.html"
    if site_path.endswith(".md"):
        route = site_path.removeprefix("/farshid/")[:-3]
        return f"{ORIGIN}/farshid/content/index.html#{quote(route, safe='/-_') }"
    return f"{ORIGIN}{site_path}"


def main() -> None:
    tree = ET.parse(SITEMAP)
    urls = [node.text for node in tree.iter(NS + "loc") if node.text]
    pages = []
    for url in urls:
        site_path = "/" + url.split("pirahansiah.com/", 1)[1]
        source_path = SITE_ROOT / site_path.lstrip("/")
        if not source_path.is_file():
            raise FileNotFoundError(f"Sitemap entry has no source: {source_path}")
        title = title_for(source_path)
        pages.append({
            "id": re.sub(r"[^a-z0-9]+", "-", site_path.lower()).strip("-"),
            "title": title,
            "category": category_for(site_path),
            "href": rendered_url(site_path),
            "source": f"{ORIGIN}{site_path}",
        })
    pages.sort(key=lambda page: (page["category"].casefold(), page["title"].casefold(), page["source"]))
    unique_pages = []
    seen_pages = set()
    for page in pages:
        key = (page["category"], page["title"], page["source"])
        if key in seen_pages:
            continue
        seen_pages.add(key)
        unique_pages.append(page)
    pages = unique_pages
    output = "window.SITE_CATALOG = " + json.dumps(pages, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (PROJECT / "catalog.js").write_text(output, encoding="utf-8")
    totals = Counter(page["category"] for page in pages)
    print(f"Wrote {len(pages)} pages to catalog.js from {SITEMAP}")
    for category, count in sorted(totals.items()):
        print(f"  {category}: {count}")


if __name__ == "__main__":
    main()
