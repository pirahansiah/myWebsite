#!/usr/bin/env python3
"""
AI Knowledge Graph — Extract entities & relationships from text using local LLM.
Uses Ollama + Qwen 3.5 for extraction, NetworkX for graph, and renders to JSON/HTML.

Usage:
    python aiGraph.py --text "Farshid works at AI with OpenCV and CUDA"
    python aiGraph.py --file notes.md
    python aiGraph.py --file notes.md --export graph.html
    python aiGraph.py --file notes.md --export graph.json
    python aiGraph.py --interactive
"""

import argparse
import json
import os
import re
import sys
import textwrap
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

try:
    import networkx as nx
except ImportError:
    print("Install networkx: pip install networkx")
    sys.exit(1)


# ─── Config ─────────────────────────────────────────────────────
OLLAMA_URL = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
MODEL = os.environ.get("GRAPH_MODEL", "qwen2.5-coder:7b")
DATA_DIR = Path(__file__).parent.parent.parent / "pkm"
DATA_DIR.mkdir(exist_ok=True)


# ─── LLM Extraction ────────────────────────────────────────────
EXTRACT_PROMPT_TEMPLATE = """\
Extract entities and relationships from this text as JSON.

Format:
{"entities":[{"id":"name","type":"person|org|tool|concept|project","description":"brief"}],"relationships":[{"source":"a","target":"b","type":"uses|works_at|created_by|part_of","description":"brief"}]}

Text:
%s

JSON:"""


def query_ollama(prompt: str, model: str = MODEL) -> str:
    """Query local Ollama API."""
    url = f"{OLLAMA_URL}/api/generate"
    payload = {"model": model, "prompt": prompt, "stream": False, "options": {"num_predict": 1000}}

    try:
        resp = requests.post(url, json=payload, timeout=300)
        resp.raise_for_status()
        return resp.json().get("response", "")
    except requests.ConnectionError:
        print(f"Error: Cannot connect to Ollama at {OLLAMA_URL}")
        print("Start Ollama: ollama serve")
        sys.exit(1)
    except Exception as e:
        print(f"Error querying Ollama: {e}")
        sys.exit(1)


def extract_graph_from_text(text: str) -> dict:
    """Use LLM to extract entities and relationships from text."""
    prompt = EXTRACT_PROMPT_TEMPLATE % text[:1500]  # keep short for speed
    print(f"  Extracting with {MODEL}...")
    response = query_ollama(prompt)

    # Parse JSON from response (handle markdown code blocks)
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response, re.DOTALL)
    if json_match:
        response = json_match.group(1)
    else:
        # Try to find raw JSON
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if json_match:
            response = json_match.group(0)

    try:
        data = json.loads(response)
    except json.JSONDecodeError as e:
        print(f"  Warning: Could not parse LLM response as JSON: {e}")
        print(f"  Raw response: {response[:200]}...")
        return {"entities": [], "relationships": []}

    return {
        "entities": data.get("entities", []),
        "relationships": data.get("relationships", []),
    }


# ─── Graph Operations ──────────────────────────────────────────
class KnowledgeGraph:
    """In-memory knowledge graph with persistence."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.entity_types = {}
        self.entity_desc = {}

    def add_entity(self, eid: str, etype: str = "concept", desc: str = ""):
        eid = eid.strip().lower().replace(" ", "_")
        self.graph.add_node(eid, type=etype, description=desc)
        self.entity_types[eid] = etype
        self.entity_desc[eid] = desc

    def add_relationship(self, source: str, target: str, rtype: str = "related_to", desc: str = ""):
        source = source.strip().lower().replace(" ", "_")
        target = target.strip().lower().replace(" ", "_")
        if source not in self.graph:
            self.add_entity(source)
        if target not in self.graph:
            self.add_entity(target)
        self.graph.add_edge(source, target, type=rtype, description=desc)

    def ingest(self, data: dict):
        """Add extracted entities and relationships."""
        for ent in data.get("entities", []):
            self.add_entity(ent["id"], ent.get("type", "concept"), ent.get("description", ""))
        for rel in data.get("relationships", []):
            self.add_relationship(rel["source"], rel["target"], rel.get("type", "related_to"), rel.get("description", ""))

    def merge(self, other: "KnowledgeGraph"):
        """Merge another graph into this one."""
        for node, attrs in other.graph.nodes(data=True):
            if node not in self.graph:
                self.add_entity(node, attrs.get("type", "concept"), attrs.get("description", ""))
        for src, tgt, attrs in other.graph.edges(data=True):
            self.add_relationship(src, tgt, attrs.get("type", "related_to"), attrs.get("description", ""))

    def stats(self) -> dict:
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "components": nx.number_weakly_connected_components(self.graph),
        }

    def top_nodes(self, n: int = 10) -> list:
        """Return top n nodes by degree centrality."""
        centrality = nx.degree_centrality(self.graph)
        sorted_nodes = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:n]
        return [(node, round(score, 3), self.entity_types.get(node, "?")) for node, score in sorted_nodes]

    def save(self, path: Path = None):
        path = path or DATA_DIR / "graph.json"
        data = nx.node_link_data(self.graph)
        data["metadata"] = {"entity_types": self.entity_types, "descriptions": self.entity_desc}
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  Saved graph ({self.stats()['nodes']} nodes, {self.stats()['edges']} edges) → {path}")

    def load(self, path: Path = None):
        path = path or DATA_DIR / "graph.json"
        if not path.exists():
            return
        with open(path) as f:
            data = json.load(f)
        self.graph = nx.node_link_graph(data, directed=True)
        meta = data.get("metadata", {})
        self.entity_types = meta.get("entity_types", {})
        self.entity_desc = meta.get("descriptions", {})
        print(f"  Loaded graph ({self.stats()['nodes']} nodes, {self.stats()['edges']} edges) ← {path}")


# ─── Export ─────────────────────────────────────────────────────
HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Knowledge Graph</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, system-ui, sans-serif; }
  #graph { width: 100vw; height: 100vh; }
  .info { position: fixed; top: 16px; left: 16px; background: rgba(22,27,34,0.9);
          border: 1px solid #30363d; border-radius: 12px; padding: 16px; max-width: 320px;
          backdrop-filter: blur(8px); z-index: 10; }
  .info h2 { font-size: 14px; color: #58a6ff; margin-bottom: 8px; }
  .info p { font-size: 12px; line-height: 1.5; }
  .legend { position: fixed; bottom: 16px; left: 16px; display: flex; gap: 12px; }
  .legend span { font-size: 11px; display: flex; align-items: center; gap: 4px; }
  .legend .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
</style>
</head>
<body>
<div class="info">
  <h2>AI Knowledge Graph</h2>
  <p>Nodes: __NODES__ | Edges: __EDGES__</p>
  <p>Drag to pan, scroll to zoom, click node for details.</p>
</div>
<div class="legend">
  <span><span class="dot" style="background:#58a6ff"></span> Person</span>
  <span><span class="dot" style="background:#3fb950"></span> Org</span>
  <span><span class="dot" style="background:#d2a8ff"></span> Tool</span>
  <span><span class="dot" style="background:#f0883e"></span> Concept</span>
  <span><span class="dot" style="background:#f778ba"></span> Project</span>
</div>
<canvas id="graph"></canvas>
<script>
const DATA = __GRAPH_DATA__;

const COLORS = {{ person:"#58a6ff", org:"#3fb950", tool:"#d2a8ff", concept:"#f0883e",
                  project:"#f778ba", location:"#ffa657", default:"#8b949e" }};
const canvas = document.getElementById("graph");
const ctx = canvas.getContext("2d");
let W, H, panX=0, panY=0, zoom=1, drag=null, hovered=null, selected=null;

function resize() {{ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }}
window.addEventListener("resize", resize); resize();

const nodes = DATA.nodes.map((n,i) => {{
  const angle = (2*Math.PI*i)/DATA.nodes.length;
  const r = 200 + Math.random()*150;
  return {{ ...n, x: Math.cos(angle)*r, y: Math.sin(angle)*r, vx:0, vy:0,
            color: COLORS[n.type]||COLORS.default }};
}});

const nodeMap = {{}};
nodes.forEach(n => nodeMap[n.id] = n);

const links = DATA.links.map(l => ({{ source: nodeMap[l.source], target: nodeMap[l.target], type: l.type }}))
                       .filter(l => l.source && l.target);

function simulate() {{
  for (let i=0; i<50; i++) {{
    nodes.forEach(n => {{ n.vx=0; n.vy=0; }});
    // repulsion
    for (let a=0; a<nodes.length; a++) {{
      for (let b=a+1; b<nodes.length; b++) {{
        let dx=nodes[b].x-nodes[a].x, dy=nodes[b].y-nodes[a].y;
        let d=Math.sqrt(dx*dx+dy*dy)||1, f=3000/(d*d);
        nodes[a].vx-=dx/d*f; nodes[a].vy-=dy/d*f;
        nodes[b].vx+=dx/d*f; nodes[b].vy+=dy/d*f;
      }}
    }}
    // attraction
    links.forEach(l => {{
      let dx=l.target.x-l.source.x, dy=l.target.y-l.source.y;
      let d=Math.sqrt(dx*dx+dy*dy)||1, f=(d-100)*0.01;
      l.source.vx+=dx/d*f; l.source.vy+=dy/d*f;
      l.target.vx-=dx/d*f; l.target.vy-=dy/d*f;
    }});
    // center gravity
    nodes.forEach(n => {{ n.vx-=n.x*0.001; n.vy-=n.y*0.001; }});
    // apply
    nodes.forEach(n => {{ n.x+=n.vx*0.3; n.y+=n.vy*0.3; }});
  }}
}}
simulate();

function draw() {{
  ctx.clearRect(0,0,W,H);
  ctx.save(); ctx.translate(W/2+panX, H/2+panY); ctx.scale(zoom, zoom);
  // edges
  ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
  links.forEach(l => {{
    ctx.beginPath(); ctx.moveTo(l.source.x, l.source.y); ctx.lineTo(l.target.x, l.target.y);
    ctx.strokeStyle = l.type==="related_to" ? "#30363d" : "#58a6ff"; ctx.stroke();
  }});
  ctx.globalAlpha = 1;
  // nodes
  nodes.forEach(n => {{
    const r = n===hovered||n===selected ? 8 : 6;
    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2*Math.PI);
    ctx.fillStyle = n.color; ctx.fill();
    if (n===selected) {{ ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.stroke(); }}
    ctx.fillStyle = "#c9d1d9"; ctx.font = "10px system-ui"; ctx.textAlign="center";
    ctx.fillText(n.id.replace(/_/g," "), n.x, n.y - r - 4);
  }});
  ctx.restore();
  requestAnimationFrame(draw);
}}
draw();

canvas.addEventListener("mousedown", e => {{ drag = {{x:e.clientX-panX, y:e.clientY-panY}}; }});
canvas.addEventListener("mousemove", e => {{
  if (drag) {{ panX=e.clientX-drag.x; panY=e.clientY-drag.y; return; }}
  const mx=(e.clientX-W/2-panX)/zoom, my=(e.clientY-H/2-panY)/zoom;
  hovered = nodes.find(n => Math.hypot(n.x-mx, n.y-my) < 10) || null;
  canvas.style.cursor = hovered ? "pointer" : "default";
}});
canvas.addEventListener("mouseup", () => {{ drag=null; }});
canvas.addEventListener("click", e => {{
  if (!hovered) {{ selected=null; return; }}
  selected = hovered;
  const info = document.querySelector(".info");
  info.innerHTML = `<h2>${{selected.id.replace(/_/g," ")}}</h2>
    <p><b>Type:</b> ${{selected.type}}</p>
    <p><b>Description:</b> ${{selected.description||"N/A"}}</p>
    <p><b>Degree:</b> ${{links.filter(l=>l.source===selected||l.target===selected).length}}</p>`;
}});
canvas.addEventListener("wheel", e => {{ e.preventDefault(); zoom *= e.deltaY>0?0.9:1.1; zoom=Math.max(0.1,Math.min(5,zoom)); }});
</script>
</body>
</html>"""


def export_json(kg: KnowledgeGraph, path: Path):
    """Export graph as JSON."""
    kg.save(path)


def export_html(kg: KnowledgeGraph, path: Path):
    """Export interactive HTML visualization."""
    graph_data = nx.node_link_data(kg.graph)
    stats = kg.stats()
    html = HTML_TEMPLATE.replace("__NODES__", str(stats["nodes"])).replace("__EDGES__", str(stats["edges"])).replace("__GRAPH_DATA__", json.dumps(graph_data))
    with open(path, "w") as f:
        f.write(html)
    print(f"  Exported HTML → {path}")


# ─── Pipeline ───────────────────────────────────────────────────
def process_text(text: str, kg: KnowledgeGraph):
    """Extract graph from text and merge into existing graph."""
    data = extract_graph_from_text(text)
    print(f"  Found {len(data['entities'])} entities, {len(data['relationships'])} relationships")
    kg.ingest(data)
    return data


def process_file(filepath: str, kg: KnowledgeGraph):
    """Process a markdown/text file, splitting into chunks if needed."""
    text = Path(filepath).read_text(errors="replace")
    # Split into chunks of ~3000 chars for LLM context
    chunks = textwrap.wrap(text, 3000, break_long_words=False, break_on_hyphens=False)
    print(f"  Processing {filepath} ({len(text)} chars, {len(chunks)} chunks)...")

    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i+1}/{len(chunks)}...")
        process_text(chunk, kg)


def process_contents_dir(kg: KnowledgeGraph):
    """Process all text files in reddit/ directory."""
    contents_dir = Path(__file__).parent.parent.parent  # reddit/
    extensions = {".md", ".py", ".sh", ".html", ".yml", ".yaml", ".json", ".txt", ".js", ".css"}
    files = [f for f in contents_dir.rglob("*") if f.suffix.lower() in extensions and not f.name.startswith(".")]
    print(f"  Found {len(files)} files in reddit/")

    for i, f in enumerate(files):
        print(f"\n  [{i+1}/{len(files)}] {f.name}")
        process_file(str(f), kg)
        # Save after each file so progress is not lost
        kg.save()


# ─── Interactive Mode ───────────────────────────────────────────
def interactive_mode(kg: KnowledgeGraph):
    """Interactive REPL for querying and updating the graph."""
    print("\n  AI Knowledge Graph — Interactive Mode")
    print("  Commands: add, query, stats, top, save, load, export, quit\n")

    while True:
        try:
            cmd = input("graph> ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not cmd:
            continue
        elif cmd in ("quit", "exit", "q"):
            break
        elif cmd == "stats":
            s = kg.stats()
            print(f"  Nodes: {s['nodes']} | Edges: {s['edges']} | Components: {s['components']}")
        elif cmd == "top":
            for name, score, etype in kg.top_nodes(10):
                print(f"  {name:30s} centrality={score:.3f}  type={etype}")
        elif cmd == "save":
            kg.save()
        elif cmd == "load":
            kg.load()
        elif cmd.startswith("add "):
            text = cmd[4:]
            process_text(text, kg)
        elif cmd.startswith("query "):
            query = cmd[6:].lower()
            matches = [n for n in kg.graph.nodes if query in n]
            for m in matches:
                neighbors = list(kg.graph.neighbors(m))
                predecessors = list(kg.graph.predecessors(m))
                print(f"  {m} (type={kg.entity_types.get(m, '?')})")
                if neighbors:
                    print(f"    → connects to: {', '.join(neighbors)}")
                if predecessors:
                    print(f"    ← referenced by: {', '.join(predecessors)}")
        elif cmd.startswith("export "):
            fmt = cmd[7:].strip()
            if fmt == "html":
                export_html(kg, DATA_DIR / "graph.html")
            elif fmt == "json":
                export_json(kg, DATA_DIR / "graph.json")
            else:
                print("  Usage: export html | export json")
        else:
            print(f"  Unknown command: {cmd}")


# ─── CLI ────────────────────────────────────────────────────────
def main():
    global MODEL

    parser = argparse.ArgumentParser(description="AI Knowledge Graph — Extract & visualize knowledge from text")
    parser.add_argument("--text", "-t", help="Text to extract from")
    parser.add_argument("--file", "-f", help="File to process")
    parser.add_argument("--contents", action="store_true", default=True, help="Process all files in reddit/ (default)")
    parser.add_argument("--export", "-e", choices=["html", "json"], default="html", help="Export format (default: html)")
    parser.add_argument("--interactive", "-i", action="store_true", help="Interactive REPL mode")
    parser.add_argument("--model", "-m", default=MODEL, help=f"Ollama model (default: {MODEL})")
    args = parser.parse_args()

    MODEL = args.model

    print(f"\n  AI Knowledge Graph — Model: {MODEL}")

    kg = KnowledgeGraph()
    kg.load()  # load existing graph if available

    if args.interactive:
        interactive_mode(kg)
    elif args.text:
        process_text(args.text, kg)
    elif args.file:
        process_file(args.file, kg)
    else:
        process_contents_dir(kg)

    # Stats
    s = kg.stats()
    print(f"\n  Graph: {s['nodes']} nodes, {s['edges']} edges, {s['components']} components")

    # Top entities
    if s["nodes"] > 0:
        print("\n  Top entities:")
        for name, score, etype in kg.top_nodes(10):
            print(f"    {name:30s}  {score:.3f}  ({etype})")

    # Export
    if args.export == "html":
        export_html(kg, DATA_DIR / "graph.html")
    elif args.export == "json":
        export_json(kg, DATA_DIR / "graph.json")

    # Always save
    kg.save()


if __name__ == "__main__":
    main()
