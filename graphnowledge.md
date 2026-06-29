---
layout: farshid_default
title: Knowledge Graph — Files & Architecture
---

# Knowledge Graph — All Files & Code

## Core Files

| File | Purpose |
|------|---------|
| `farshid-ai-cv-llm-graph.md` | Main graph page (`/graph/`) — D3.js force-directed knowledge graph |
| `farshid-ai-cv-llm-graph-tags.md` | Hashtag graph page (`/graph-tags/`) — tag co-occurrence graph |
| `assets/js/graph-view.js` | D3.js graph engine — force simulation, zoom, drag, rendering |
| `assets/css/graph.css` | Graph page styles — filters, tooltips, minimap, mobile |
| `assets/graph.json` | Main graph data — 79 nodes, 144 edges, 12 categories |
| `assets/graph-hashtags.json` | Hashtag graph data — tags and co-occurrence edges |

## Layout References

| File | Line | Purpose |
|------|------|---------|
| `_layouts/farshid_default.html` | 124 | Bottom toolbar "Graph" link |
| `_layouts/farshid_page.html` | 90 | Bottom toolbar "Graph" link |
| `_layouts/farshid_base.html` | 40 | Bottom toolbar "Graph" link |
| `_layouts/farshid_atlas.html` | 41 | "Knowledge Graph" nav link |

## Related Pages

| File | Purpose |
|------|---------|
| `contents/pkm/graph.html` | Standalone mini graph (6 nodes, hardcoded) |
| `contents/pkm/graph.json` | PKM graph data |

## Architecture

```
farshid-ai-cv-llm-graph.md
  ├── loads: d3.v7.min.js (CDN)
  ├── loads: fuse.js (CDN)
  ├── loads: assets/js/graph-view.js
  ├── loads: assets/css/graph.css
  ├── loads: assets/graph.json
  └── inline: CONTENT_INDEX (search), graphSearch(), filter buttons

graph-view.js
  ├── d3.forceSimulation (center, charge, link, collide, x, y)
  ├── d3.zoom (pan/zoom with extent)
  ├── d3.drag (node repositioning)
  ├── Canvas rendering (curved edges, glow, labels)
  ├── Category filtering
  ├── Search highlighting
  └── Mini-map
```

## Node Categories & Colors

| Category | Color | Count |
|----------|-------|-------|
| hub | #0a84ff (blue) | 6 |
| cv | #30d158 (green) | 5 |
| ai | #bf5af2 (purple) | 4 |
| cuda | #ff9f0a (orange) | 4 |
| paper | #5ac8fa (light blue) | 10 |
| journal | #64d2ff (cyan) | 6 |
| book | #ffd60a (yellow) | 7 |
| patent | #ff375f (red) | 3 |
| keynote | #ff6482 (pink) | 1 |
| course | #00c7be (teal) | 17 |
| pkm | #ac8e68 (brown) | 3 |
| business | #8e8e93 (gray) | 12 |

## Edge Types

| Strength | Meaning |
|----------|---------|
| 1.0 | Direct parent-child (Hub → Category) |
| 0.8 | Strong topic match |
| 0.5 | Related content |
| 0.3 | Weak but notable connection |

## Interaction Features

- **Zoom**: Mouse wheel (0.1x – 6x)
- **Pan**: Click+drag on background
- **Select node**: Click/tap (shows glow + full label)
- **Open page**: Double-click/tap
- **Drag node**: Click+drag on node
- **Filter**: Category toggle buttons
- **Search**: Fuse.js fuzzy search, highlights nodes
- **Minimap**: Bottom-right corner, shows viewport
- **Labels**: Zoom-dependent (none → 3 chars → 8 → 15 → full)
