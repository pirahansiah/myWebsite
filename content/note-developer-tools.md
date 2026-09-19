Curated developer tools, shell essentials, Docker tips, and GitHub tricks.

## Recommended Tools

- [NeoHtop](https://github.com/Abdenasser/neohtop) — Modern htop alternative
- [Cap](https://github.com/CapSoftware/Cap) — Open source Loom alternative for screen recordings
- [RustDesk](https://rustdesk.com/) — Open source remote desktop
- [Helix Editor](https://github.com/helix-editor/helix) — Post-modern modal editor
- [Blender MCP](https://github.com/ahujasid/blender-mcp) — Blender + MCP integration
- [RX Resume](https://rxresu.me/) — Resume builder
- [Practical Computer Vision](https://github.com/andandandand/practical-computer-vision) — CV learning resources
- [CUDA Codes](https://github.com/Maharshi-Pandya/cudacodes) — CUDA flash attention algorithms
- [Intel RealSense HDR](https://dev.intelrealsense.com/docs/high-dynamic-range-with-stereoscopic-depth-cameras) — HDR depth cameras
- [Apple ML-GBC](https://github.com/apple/ml-gbc) — Apple ML framework
- [Python CLI](https://github.com/mohsen12999/my-python-cli) — Python CLI tool
- [Data Structures for Image Processing](https://newsletter.francofernando.com/p/data-structures-for-image-processing) — Newsletter

---

## Shell Essentials

### Echo & Variables
- `echo "value is $foo"` → value is bar (variable expanded)
- `echo 'value is $foo'` → value is $foo (literal)
- `foo=bar` — no space around `=`
- `$PATH` — environment variable
- `cd -` — go to previous directory

### Navigation
- `/` — root directory
- `~` — home folder
- `.` — current folder
- `..` — parent folder
- Absolute path starts with `/`, relative path starts with `folder/file`

### Shortcuts
- `Ctrl+L` — clear terminal
- `Ctrl+R` — reverse search history
- `!!` — repeat last command

### Pipes & Redirection
- `;` — run commands sequentially
- `&&` — run next only if previous succeeded
- `|` — pipe output to next command
- `>>` — append to file
- `#` — root/sudo prompt

### Useful Commands
- `xdg-open file` — open with default app
- `ulimit -a` — show memory limits
- `htop` — process monitor
- `tldr` — simplified man pages
- `locate` / `ripgrep (rg)` / `fzf` / `broot` / `nnn` — search & file managers

### Custom Functions
```bash
mcd () {
    mkdir -p "$1"
    cd "$1"
}
source mcd.sh
```

### Python One-Liner
```python
#!/usr/bin/env python
import sys
for arg in reversed(sys.argv[1:]):
    print(arg)
```

---

## Vim Quick Reference

| Key | Action |
|-----|--------|
| `i` | Enter insert mode |
| `Esc` | Exit insert mode |
| `r` | Replace character |
| `k` | Move up |
| `s-v` | Visual line select |
| `c-v` | Visual block select |
| `:` | Command mode |

---

## Docker Tips

### Shrink WSL Disk
```bash
wsl --shutdown
diskpart
select disk file="C:\Users\[USER]\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
compact disk
```

---

## GitHub Tips

### Quick Access
- Press `.` on any GitHub repo to open web-based VS Code editor

### GitIngest
Turn any GitHub repo into readable text for LLMs. Replace "hub" with "ingest" in the URL:
- Repo: `https://github.com/user/repo`
- Ingest: `https://gitingest.com/user/repo`

### PR Code Review
Add `.diff` to the end of any PR URL to see raw changes. Paste into ChatGPT/Grok for AI code review:
- PR: `https://github.com/user/repo/pull/42`
- Diff: `https://github.com/user/repo/pull/42.diff`

### GitSummarize
Replace "hub" with "summarize" in any GitHub URL for AI-powered documentation:
- Repo: `https://github.com/user/repo`
- Summary: `https://gitsummarize.com/user/repo`