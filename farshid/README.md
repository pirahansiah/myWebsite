# pirahansiah.com

A static, markdown-first personal site for Dr. Farshid Pirahansiah. No build step,
no dependencies, no submodules. GitHub Pages serves the `main` branch root as-is
(pinned static by `.nojekyll`).

Every page exists twice, on purpose:

1. **`content/<slug>.html`** — a real, server-rendered HTML page with `<title>`,
   description, canonical URL, OpenGraph and JSON-LD, plus `<link rel="alternate"
   type="text/markdown">` pointing at the source `.md`. This is what crawlers,
   LLM/answer engines and no-JS fetches read, and what internal links point at.
2. **`content/<slug>.md`** — the source, rendered in the browser by the hash-route
   app (`#content/<slug>`). Same look; needed for the search index and the deck
   pages.

`/llms.txt` (every page + one-line summary), `/llms-full.txt` (full text of the
site) and `/sitemap.xml` are generated from the same pass.

## Structure

- `index.html` (root) — resolves the apex to the home page (canonical + refresh).
- `404.html` (root) — unknown/legacy URLs redirect to the right rendered page.
- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` — generated entry points.
- `farshid/` — the ENTIRE site lives here:
  - `farshid/index.html` — resolves `/farshid/` to the home page.
  - `farshid/content/index.html` — the home page (About, publications, patents,
    services) and the app shell that renders `#content/<slug>` routes. Carries GA4 +
    AdSense.
  - `farshid/app.js`, `farshid/md.js`, `farshid/style.css`, `farshid/search-index.js`
    — engine (markdown renderer, hash router, search index, design system).
  - `farshid/content/` — every publication, course, note and talk as flat `.md`
    files, with images/mp3s/mindmaps colocated beside them; `atlas.md` is the
    index of everything; `qrcode.html` and `swarm.html` are standalone tools.
  - `farshid/projects/` — the generators and the projects they index.

## How it works

The home shell reads the URL hash (e.g. `#content/course-ros`), fetches that
markdown file and renders it with the bundled `farshid/md.js`. Static pages are
plain HTML with the same CSS, so both surfaces look identical. Internal links point
at the canonical `.html` pages; only the deck (Reveal) routes need the app.

## Editing / adding content

Drop a `.md` file into `farshid/content/` (images next to it), then run all three
generators:

```bash
python3 farshid/projects/gen_atlas.py          # farshid/content/atlas.md
python3 farshid/projects/gen_search_index.py   # farshid/search-index.js
python3 farshid/projects/gen_static_pages.py   # content/*.html, llms*.txt, sitemap.xml
```

`gen_static_pages.py` needs `python3 -m pip install markdown`. HTML is allowed
inside markdown for styling; scripts inside markdown do not run on the static
pages (they are stripped there), so interactive pages belong in a standalone
`.html` file. Done — push to `main`.

## Deploy

Push to `main`. GitHub Pages (`build_type: legacy` from `main`/root) serves the
files as-is; `.nojekyll` keeps Jekyll out. CDN cache is ~2 minutes.
