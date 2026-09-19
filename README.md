# pirahansiah.com

A pure static, markdown-first personal site for Dr. Farshid Pirahansiah.
No build step, no dependencies, no submodules — every page is a plain Markdown
file rendered in the browser. GitHub Pages serves it directly from the `main`
branch root (pinned static by `.nojekyll`).

## Structure

- `index.html` — the home page (About, publications, patents) + thin shell that
  loads the current `.md` by hash and renders it. Also carries Google Analytics
  (GA4) and AdSense tracking.
- `atlas.md` — the single index for the whole site. One file to navigate everything.
- `farshid/` — all the standalone source folders:
  - `farshid/qr/` — the permanent QR / Scan & Share page
  - `farshid/search/` — full-text search page
  - `farshid/swarm/` — animated Search Swarm page
  - `farshid/notes/slides/research-tools/` — talks & keynotes hub
  - `farshid/projects/` — one folder per project (README lives with each)
  - `farshid/scripts/` — generators (`gen_atlas.py`, `gen_search_index.py`)
- `content/` — every publication, course, note, and talk as flat `.md` files.
- `assets/` — shared CSS, JS (a dependency-free markdown renderer, hash router,
  search index), and images (including `assets/qr/`).
- Root redirect stubs (`qr/`, `search/`, `swarm/`, `notes/`, `projects/`) forward
  old permanent URLs to their `farshid/` locations so bookmarks and QR codes
  keep working.

## How it works

`index.html` reads the URL hash (e.g. `#content/course-ros`), fetches that
markdown file, and renders it client-side with the bundled `assets/js/md.js`
renderer. No network, no server, no build. Internal `.md` links navigate within
the page; everything else opens in a new tab.

## Editing / adding content

Drop any `.md` file into `content/`, then run `python3 farshid/scripts/gen_atlas.py`
to regenerate `atlas.md`, and `python3 farshid/scripts/gen_search_index.py` to
rebuild `assets/js/search-index.js`. HTML is allowed inside markdown for
styling and images. Done — push to `main`.

## Deploy

Push to `main`. GitHub Pages (already configured `build_type: legacy` from
`main`/root) serves the files as-is; `.nojekyll` keeps it from running Jekyll.
CDN cache is ~2 minutes, so content takes a short while to appear after a push.