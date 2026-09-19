# pirahansiah.com

A pure static, markdown-first personal site for Dr. Farshid Pirahansiah.
No build step, no dependencies, no submodules — every page is a plain Markdown
file rendered in the browser. GitHub Pages serves it directly from the `main`
branch root (pinned static by `.nojekyll`).

## Structure

- `atlas.md` — the single index for the whole site. One file to navigate everything.
- `content/` — every publication, course, note, and talk as flat `.md` files.
- `projects/` — one folder per project (source, docs, scripts live together).
- `assets/` — shared CSS, JS (a dependency-free markdown renderer), and images.
- `index.html` — thin shell that loads the current `.md` by hash and renders it.

## How it works

`index.html` reads the URL hash (e.g. `#content/course-ros`), fetches that
markdown file, and renders it client-side with the bundled `assets/js/md.js`
renderer. No network, no server, no build. Internal `.md` links navigate within
the page; everything else opens in a new tab.

## Editing / adding content

Drop any `.md` file into `content/`, add one link to it in `atlas.md` (and, if
you want it in the top nav, update `assets/js/manifest.js`). HTML is allowed
inside markdown for styling and images. Done — push to `main`.

## Deploy

Push to `main`. GitHub Pages (already configured `build_type: legacy` from
`main`/root) serves the files as-is; `.nojekyll` keeps it from running Jekyll.