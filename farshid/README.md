# pirahansiah.com

A static, markdown-only personal site for Dr. Farshid Pirahansiah. No build step,
no dependencies, no submodules. GitHub Pages serves the `main` branch root as-is
(pinned static by `.nojekyll` — Pages does not convert markdown, so every page is
exactly one file).

**One file per page.** Each page is a single markdown file in `farshid/content/`.
Nothing is duplicated: the browser app renders the same file a crawler reads.

- **readers** — the app shell fetches the `.md` and renders it (`#content/<slug>`,
  or the `/<slug>.md` URL, which routes into the app).
- **crawlers, LLM/answer engines, no-JS fetches** — they read the `.md` file
  directly; GitHub Pages serves it as `text/markdown`, which is the full text with
  no chrome. `/llms.txt` (every page + one-line summary), `/llms-full.txt` (the
  whole site in one file) and `/sitemap.xml` list those same markdown URLs.

Only five `.html` files exist, and each one is a program rather than a page:
`content/index.html` (the app shell / home), `content/swarm.html` (search),
`404.html` (routes old links into the app), and two redirect stubs
(`index.html`, `farshid/index.html`). Interactive pages cannot live in markdown:
scripts inside markdown are stripped, so anything with a `<script>` stays a
standalone `.html`.

## Structure

- `index.html` (root) — resolves the apex to the home page (canonical + refresh).
- `404.html` (root) — old `.md`/`.html`/Google-Sites URLs redirect to the right
  rendered page (every link shared before Sep 2026 was a `.html` URL).
- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt` — generated entry points.
- `farshid/` — the ENTIRE site lives here:
  - `farshid/index.html` — resolves `/farshid/` to the home page.
  - `farshid/content/index.html` — the home page (About, publications, patents,
    services) and the app shell that renders `#content/<slug>` routes. Carries GA4 +
    AdSense.
  - `farshid/app.js`, `farshid/md.js`, `farshid/style.css`, `farshid/deck.css`,
    `farshid/search-index.js` — engine (markdown renderer, hash router, Reveal deck
    boot, search index, design system).
  - `farshid/content/` — every publication, course, note and talk as flat `.md`
    files, with images/mp3s/mindmaps colocated beside them; `atlas.md` is the index
    of everything; `swarm.html` is the standalone search tool.
  - `farshid/projects/` — the generators and the projects they index (each project
    is a `README.md`, read through the app).

## How it works

The home shell reads the URL hash (e.g. `#content/course-ros`), fetches that
markdown file and renders it with the bundled `farshid/md.js`. In-app links point
at the `.md` files, so the app routes between pages without a reload. Deck pages
(markdown carrying `.presentation-panel` + Reveal `<section>`s) boot Reveal
full-screen on the same route.

## Editing / adding content

Drop a `.md` file into `farshid/content/` (images next to it), then run all three
generators:

```bash
python3 farshid/projects/gen_atlas.py          # farshid/content/atlas.md
python3 farshid/projects/gen_search_index.py   # farshid/search-index.js
python3 farshid/projects/gen_static_pages.py   # llms.txt, llms-full.txt, sitemap.xml
```

`gen_atlas.py` and `gen_static_pages.py` need `python3 -m pip install markdown`.
HTML is allowed inside markdown for styling; scripts are stripped, so interactive
pages belong in a standalone `.html`. Done — push to `main`.

## Deploy

Push to `main`. GitHub Pages (`build_type: legacy` from `main`/root) serves the
files as-is; `.nojekyll` keeps Jekyll out. CDN cache is ~2 minutes.

## History: why `content/*.html` is gone

Until Sep 2026 every page was written twice — a `.md` source plus a generated
`.html` twin (title, canonical, OpenGraph, JSON-LD, nav, footer) for crawlers and
for clean shareable URLs. Two files per page caused real confusion (edits landing
in the copy that is not the source), and Pages cannot generate the twin without a
build, so the twins were deleted and both readers and crawlers now use the
markdown file. `/farshid/content/<name>.html` links shared earlier still work:
they hit `404.html`, which sends the browser to `#content/<name>`.
