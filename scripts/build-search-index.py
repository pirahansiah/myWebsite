#!/usr/bin/env python3
import os, json, re
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
base = root_dir / "contents" / "pkm"
index = []

for path in sorted(base.rglob("*.md")):
    if path.name.startswith("._"):
        continue
    try:
        content = path.read_text(errors="replace")
        title = path.stem
        m = re.search(r"^title:\s*(.+)", content, re.MULTILINE)
        if m:
            title = m.group(1).strip().strip('"')
        body = re.sub(r"^---.*?---", "", content, flags=re.DOTALL).strip()
        body = re.sub(r"[#*>\[\]()!`~]", " ", body)
        body = re.sub(r"\s+", " ", body).strip()
        rel = path.relative_to(root_dir)
        url = "/" + str(rel).replace(".md", "")
        index.append({"title": title, "url": url, "body": body[:500]})
    except Exception:
        pass

out = root_dir / "assets" / "search-index.json"
with open(out, "w") as f:
    json.dump(index, f, indent=2)
print(f"Indexed {len(index)} files")
