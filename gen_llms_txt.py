#!/usr/bin/env python3
"""Generate llms.txt + llm-full.txt for pirahansiah.com from source pages.

llms.txt   : the llms.txt standard (llmstxt.org) — a single curated,
             human+LLM-readable index of the whole site, grouped by topic,
             every entry a Markdown link so LLMs can traverse the knowledge graph.
llm-full.txt: every page's full cleaned text (for RAG / full ingestion).

Run: python3 gen_llms_txt.py   (writes both to repo root)
Idempotent: regenerates from current source each run.
"""
import os, re, glob, datetime

ROOT = "/Users/farshid/Library/CloudStorage/Dropbox/2026/site/myWebsite"
SITE = "https://pirahansiah.com"
TODAY = datetime.date.today().isoformat()

# Map raw first-path-segment -> human section label
SECTION_LABELS = {
    "docs":    "Documentation & Technical Notes",
    "pubs":    "Publications (Papers, Journals, Books, Patents, Keynotes)",
    "courses": "Courses & Learning Paths",
    "site":    "Site Tools & Interfaces",
    "pkm":     "Knowledge Base / Portfolio",
    "slides":  "Presentations",
    "tools":   "Utilities",
    "root":    "Top-Level Pages",
}
SKIP_RELS = {"notes/README.md", "notes/index.md"}  # internal vault index pages
SKIP_TITLES = {"Page Not Found"}

def strip_front_matter(t):
    return re.sub(r"^---\s*\n.*?\n---\s*\n", "", t, flags=re.S)

def clean_body(t):
    t = strip_front_matter(t)
    # remove the share-line blockquote (> **Title** — desc — URL)
    t = re.sub(r"^> \*\*.*$", "", t, flags=re.M)
    # remove html comments / enhanced markers
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    # remove style/script blocks entirely
    t = re.sub(r"<style[^>]*>.*?</style>", "", t, flags=re.S)
    t = re.sub(r"<script[^>]*>.*?</script>", "", t, flags=re.S)
    # remove markdown image/audio/html embeds, keep alt text
    t = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"<audio[^>]*>.*?</audio>", "", t, flags=re.S)
    t = re.sub(r"<[^>]+>", "", t)
    # collapse wikilinks [[x|y]] -> y , [[x]] -> x
    t = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", t)
    t = re.sub(r"\[\[([^\]]+)\]\]", r"\1", t)
    # remove markmap fenced blocks
    t = re.sub(r"```markmap.*?```", "", t, flags=re.S)
    t = re.sub(r"```.*?```", "", t, flags=re.S)
    # blank-line cleanup
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def get_pages():
    pages = []
    for f in glob.glob(os.path.join(ROOT, "**", "*.md"), recursive=True):
        rel = os.path.relpath(f, ROOT)
        if rel.startswith(("_site", ".git", ".jekyll-cache")) or "/.git/" in rel:
            continue
        if rel.split("/")[-1] in ("README.md",):
            continue
        t = open(f, encoding="utf-8", errors="replace").read()
        fm = re.match(r"^---\s*\n(.*?)\n---\s*\n", t, re.S)
        if not fm:
            continue
        block = fm.group(1)
        tm = re.search(r'^title\s*:\s*"?([^"\n]+)"?', block, re.M)
        dm = re.search(r'^description\s*:\s*"?([^"\n]+)"?', block, re.M)
        pm = re.search(r'^permalink\s*:\s*(\S+)', block, re.M)
        title = tm.group(1).strip() if tm else None
        if not title or title in SKIP_TITLES:
            continue
        desc = dm.group(1).strip() if dm else ""
        if pm:
            url = pm.group(1)
            if not url.startswith("/"):
                url = "/" + url
        else:
            path = re.sub(r"\.md$", "", rel)
            url = "/" + path + "/"
        # homepage normalization: /index/ -> /
        if url.rstrip("/").endswith("/index"):
            url = "/"
        raw_sec = rel.split("/")[1] if rel.startswith("notes/") else (
            rel.split("/")[0] if "/" in rel else "root")
        if rel in SKIP_RELS or raw_sec == "assets":
            continue
        pages.append({
            "title": title, "desc": desc, "url": SITE + url,
            "section": SECTION_LABELS.get(raw_sec, raw_sec),
        })
    # de-dup by url
    seen = {}
    for p in pages:
        seen[p["url"]] = p
    return list(seen.values())

def build_llms_txt(pages):
    by_sec = {}
    for p in pages:
        by_sec.setdefault(p["section"], []).append(p)
    L = []
    L.append(f"# pirahansiah.com — Dr. Farshid Pirahansiah")
    L.append("")
    L.append("> Embedded Computer Vision & Edge AI Engineer. Computer vision, deep learning, "
             "CUDA, LLM integration, model optimization and deployment on Jetson, Hailo, and "
             "Raspberry Pi. This file is a machine-readable index of the entire knowledge base; "
             "every entry links to a full page so LLMs can traverse the site's knowledge graph.")
    L.append("")
    L.append(f"Last updated: {TODAY}")
    L.append("")
    L.append("## Main topics")
    L.append("")
    L.append("- [Computer Vision & AI Engineering](https://pirahansiah.com/) — homepage & profile")
    L.append("- [Knowledge Graph](https://pirahansiah.com/graph/) — interactive map of how all notes connect")
    L.append("- [Search](https://pirahansiah.com/search/) — full-text search across the site")
    L.append("- [Agent Swarm](https://pirahansiah.com/swarm/) — multi-agent research over the whole site")
    L.append("- [In-browser LLM (WebGPU)](https://pirahansiah.com/webgpu-llm/) — local RAG over all pages")
    L.append("")
    order = ["Top-Level Pages", "Documentation & Technical Notes",
             "Publications (Papers, Journals, Books, Patents, Keynotes)",
             "Courses & Learning Paths", "Knowledge Base / Portfolio",
             "Presentations", "Utilities", "Site Tools & Interfaces"]
    secs = sorted(by_sec.keys(), key=lambda s: (order.index(s) if s in order else 99))
    for sec in secs:
        items = sorted(by_sec[sec], key=lambda p: p["title"].lower())
        L.append(f"## {sec}")
        L.append("")
        for p in items:
            line = f"- [{p['title']}]({p['url']})"
            if p["desc"]:
                line += f" — {p['desc']}"
            L.append(line)
        L.append("")
    L.append("## Optional")
    L.append("")
    L.append(f"- [Full text of every page (RAG corpus)]({SITE}/llm-full.txt) — complete cleaned "
             "Markdown of all pages for retrieval-augmented generation and full ingestion.")
    L.append("")
    return "\n".join(L)

def build_llm_full(pages):
    parts = []
    parts.append(f"# pirahansiah.com — Full page text (RAG corpus)\n")
    parts.append(f"Generated: {TODAY}\n")
    for p in sorted(pages, key=lambda x: x["url"]):
        f = None
        # find source file
        for cand in glob.glob(os.path.join(ROOT, "**", "*.md"), recursive=True):
            rel = os.path.relpath(cand, ROOT)
            if rel.startswith(("_site", ".git")):
                continue
            t = open(cand, encoding="utf-8", errors="replace").read()
            pm = re.search(r'^permalink\s*:\s*(\S+)', t, re.M)
            if pm and (SITE + pm.group(1).lstrip("/")) == p["url"]:
                f = cand; break
            # match by path
            path = re.sub(r"\.md$", "", rel)
            if (SITE + "/" + path + "/") == p["url"]:
                f = cand; break
        if not f:
            continue
        body = clean_body(open(f, encoding="utf-8", errors="replace").read())
        parts.append(f"\n{'='*80}\nURL: {p['url']}\nTITLE: {p['title']}")
        if p["desc"]:
            parts.append(f"DESCRIPTION: {p['desc']}")
        parts.append("-"*80)
        parts.append(body)
        parts.append("")
    return "\n".join(parts)

if __name__ == "__main__":
    pages = get_pages()
    lt = build_llms_txt(pages)
    lf = build_llm_full(pages)
    open(os.path.join(ROOT, "llms.txt"), "w", encoding="utf-8").write(lt)
    open(os.path.join(ROOT, "llm-full.txt"), "w", encoding="utf-8").write(lf)
    print(f"Pages indexed: {len(pages)}")
    print(f"llms.txt: {len(lt)} chars")
    print(f"llm-full.txt: {len(lf)} chars")
