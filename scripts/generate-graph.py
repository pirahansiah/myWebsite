#!/usr/bin/env python3
"""
Auto-generate graph.json from Jekyll content files.
Run this after adding/modifying pages in contents/.
Output: assets/graph.json
"""
import os, json, re
from pathlib import Path
from collections import defaultdict

CONTENTS = Path("/Volumes/4tb/myWebsite/contents")
OUTPUT = Path("/Volumes/4tb/myWebsite/assets/graph.json")

HUBS = {
    "Product": "/contents/public/product/",
    "Research": "/contents/public/research/",
    "Solutions": "/contents/public/solutions/",
    "Content Hub": "/contents/public/",
    "Wiki": "/contents/wiki/",
    "Portfolio": "/contents/pkm/use-cases/",
}

HUB_CATEGORIES = {
    "Product": ["cv", "ai", "cuda"],
    "Research": ["paper", "journal", "book", "patent", "keynote"],
    "Solutions": ["course"],
    "Content Hub": ["business"],
    "Wiki": [],
    "Portfolio": ["pkm"],
}

CATEGORY_COLORS = {
    "hub": "#0a84ff", "page": "#30d158", "tag": "#af52de",
    "paper": "#5ac8fa", "journal": "#64d2ff", "book": "#ffd60a",
    "patent": "#ff375f", "keynote": "#ff6482", "course": "#00c7be",
    "pkm": "#ac8e68", "business": "#8e8e93",
}

def parse_frontmatter(text):
    """Extract YAML frontmatter from markdown."""
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.DOTALL)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).split('\n'):
        line = line.strip()
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip()
            if val.startswith('[') and val.endswith(']'):
                val = [v.strip().strip('"').strip("'") for v in val[1:-1].split(',') if v.strip()]
            elif val.startswith('"') and val.endswith('"'):
                val = val[1:-1]
            elif val.startswith("'") and val.endswith("'"):
                val = val[1:-1]
            fm[key] = val
    return fm

def detect_category(url):
    """Detect category from URL path."""
    if '/publications/Papers/' in url: return 'paper'
    if '/publications/Journals/' in url: return 'journal'
    if '/publications/Books/' in url: return 'book'
    if '/publications/Patents/' in url: return 'patent'
    if '/publications/Keynotes/' in url: return 'keynote'
    if '/ai2026/' in url: return 'course'
    if '/public/cv/' in url: return 'page'
    if '/public/ai-llm/' in url: return 'page'
    if '/public/cuda-gpu/' in url: return 'page'
    if '/pkm/' in url: return 'pkm'
    if '/public/' in url: return 'business'
    return 'page'

def make_id(url):
    """Create node ID from URL."""
    slug = url.replace('/contents/', '').replace('/', '-').strip('-')
    return slug

def main():
    nodes = []
    links = []
    page_tags = defaultdict(list)  # tag → [node_ids]
    hub_nodes = {}

    # Create hub nodes
    for name, url in HUBS.items():
        nid = "hub-" + name.lower().replace(' ', '-')
        hub_nodes[name] = nid
        nodes.append({
            "id": nid,
            "label": name,
            "url": url,
            "category": "hub",
            "size": 5
        })

    # Scan all .md files
    for md_file in sorted(CONTENTS.rglob("*.md")):
        if md_file.name in ('README.md', 'wiki.md', 'sitemap.md', 'menus.md', 'whyNot.md'):
            continue
        if '.git' in str(md_file):
            continue

        rel = md_file.relative_to(CONTENTS)
        url = "/contents/" + str(rel).replace('.md', '/')
        if md_file.name == 'index.md':
            url = "/contents/" + str(rel.parent) + "/"

        text = md_file.read_text(errors='ignore')
        fm = parse_frontmatter(text)

        title = fm.get('title', '')
        if not title:
            title = rel.stem.replace('-', ' ').replace('_', ' ').title()

        cat = detect_category(url)
        tags = fm.get('tags', [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]

        nid = make_id(url)
        nodes.append({
            "id": nid,
            "label": title,
            "url": url,
            "category": cat,
            "size": 4,
            "tags": tags
        })

        # Track tags
        for tag in tags:
            page_tags[tag].append(nid)

    # Create tag nodes and edges
    tag_nodes = {}
    for tag, page_ids in page_tags.items():
        if len(page_ids) < 2:
            continue  # Skip tags with only 1 page
        tid = "tag-" + tag.lower().replace(' ', '-')
        tag_nodes[tag] = tid
        nodes.append({
            "id": tid,
            "label": "#" + tag,
            "url": "",
            "category": "tag",
            "size": min(3 + len(page_ids), 6)
        })
        # Connect pages to tag
        for pid in page_ids:
            links.append({"source": pid, "target": tid, "strength": 0.5})

    # Hub → category connections
    cat_nodes = defaultdict(list)
    for n in nodes:
        if n['category'] != 'hub' and n['category'] != 'tag':
            cat_nodes[n['category']].append(n['id'])

    for hub_name, hub_cats in HUB_CATEGORIES.items():
        hid = hub_nodes[hub_name]
        for cat in hub_cats:
            for nid in cat_nodes.get(cat, []):
                links.append({"source": hid, "target": nid, "strength": 1.0})

    # Same-directory connections (strength 0.3)
    dir_nodes = defaultdict(list)
    for n in nodes:
        if n['category'] in ('hub', 'tag'):
            continue
        parts = n['url'].split('/')
        if len(parts) > 3:
            d = '/'.join(parts[:4])
            dir_nodes[d].append(n['id'])

    seen_pairs = set()
    for d, nids in dir_nodes.items():
        for i in range(len(nids)):
            for j in range(i+1, len(nids)):
                pair = tuple(sorted([nids[i], nids[j]]))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    links.append({"source": nids[i], "target": nids[j], "strength": 0.3})

    # Shared-tag connections (strength 0.2) — pages that share 2+ tags
    tag_page_map = defaultdict(set)
    for n in nodes:
        if 'tags' in n:
            for t in n['tags']:
                tag_page_map[t].add(n['id'])

    for tag, pids in tag_page_map.items():
        pid_list = sorted(pids)
        for i in range(len(pid_list)):
            for j in range(i+1, len(pid_list)):
                pair = tuple([pid_list[i], pid_list[j]])
                if pair not in seen_pairs:
                    # Check if they share at least 2 tags
                    shared = 0
                    n1_tags = set()
                    n2_tags = set()
                    for n in nodes:
                        if n['id'] == pid_list[i] and 'tags' in n:
                            n1_tags = set(n['tags'])
                        if n['id'] == pid_list[j] and 'tags' in n:
                            n2_tags = set(n['tags'])
                    shared = len(n1_tags & n2_tags)
                    if shared >= 2:
                        seen_pairs.add(pair)
                        links.append({"source": pid_list[i], "target": pid_list[j], "strength": 0.2})

    # Output
    graph = {"nodes": nodes, "links": links}
    OUTPUT.write_text(json.dumps(graph, indent=2, ensure_ascii=False))
    print(f"Generated {OUTPUT}")
    print(f"  Nodes: {len(nodes)} ({len([n for n in nodes if n['category']=='hub'])} hubs, {len([n for n in nodes if n['category']=='tag'])} tags, {len([n for n in nodes if n['category'] not in ('hub','tag')])} pages)")
    print(f"  Links: {len(links)}")

if __name__ == '__main__':
    main()
