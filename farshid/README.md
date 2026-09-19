# pirahansiah.com

A pure static, markdown-first personal site for Dr. Farshid Pirahansiah.
No build step, no dependencies, no submodules — every page is a plain Markdown
file rendered in the browser. GitHub Pages serves it directly from the `main`
branch root (pinned static by `.nojekyll`).

## Structure

- `index.html` (root) — redirect stubs to `/farshid/`; GitHub Pages plumbing.
- `404.html` (root) — unknown URLs go to the Atlas.
- `farshid/` — the ENTIRE site lives here:
  - `farshid/index.html` — the home page (About, publications, patents) + thin
    shell that loads the current `.md` by hash and renders it. Carries GA4 +
    AdSense.
  - `farshid/app.js`, `farshid/md.js`, `farshid/style.css`, `farshid/search-index.js`
    — engine (dependency-free markdown renderer, hash router, search index, CSS).
  - `farshid/atlas.md` — the single index for the whole site.
  - `farshid/content/` — every publication, course, note, and talk as flat `.md`
    files, with their images/mp3s/mindmaps colocated right beside them.
  - `farshid/qr/` — the permanent QR / Scan & Share page.
  - `farshid/swarm/` — animated Search Swarm page.
  - `farshid/scripts/` — generators (`gen_atlas.py`, `gen_search_index.py`).

## How it works

`farshid/index.html` reads the URL hash (e.g. `#content/course-ros`), fetches that
markdown file, and renders it client-side with the bundled `farshid/md.js`
renderer. No network, no server, no build. Internal `.md` links navigate within
the page; everything else opens in a new tab.

## Editing / adding content

Drop any `.md` file into `farshid/content/` (images/mp3s next to it), then run
`python3 farshid/scripts/gen_atlas.py` to regenerate `farshid/atlas.md`, and
`python3 farshid/scripts/gen_search_index.py` to rebuild `farshid/search-index.js`.
HTML is allowed inside markdown for styling and images. Done — push to `main`.

## Deploy

Push to `main`. GitHub Pages (already configured `build_type: legacy` from
`main`/root) serves the files as-is; `.nojekyll` keeps it from running Jekyll.
CDN cache is ~2 minutes, so content takes a short while to appear after a push.