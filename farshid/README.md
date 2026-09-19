# pirahansiah.com

A static, markdown-only personal site for Dr. Farshid Pirahansiah. No build step,
no dependencies, no submodules. GitHub Pages serves the `main` branch root as-is
(pinned static by `.nojekyll` — Pages does not convert markdown, so every page is
exactly one file).

**One file per page.** Each page is a single markdown file in `farshid/content/`
(or in another page folder — `farshid/expert-coaching-resources/` — the generators
read every folder listed in their `PAGE_DIRS`). Nothing is duplicated: the browser
app renders the same file a crawler reads.

- **readers** — the app shell fetches the `.md` and renders it (`#content/<slug>`,
  or the `/<slug>.md` URL, which routes into the app).
- **crawlers, LLM/answer engines, no-JS fetches** — they read the `.md` file
  directly; GitHub Pages serves it as `text/markdown`, which is the full text with
  no chrome. `/llms.txt` (every page + one-line summary), `/llms-full.txt` (the
  whole site in one file) and `/sitemap.xml` list those same markdown URLs.

Only six `.html` files exist, and each one is a program or a redirect stub
rather than a page: `content/index.html` (the app shell / home),
`content/swarm.html` (search), `404.html` (routes old links into the app), `qr/`
(the permanent short link, see below) and two stubs (`index.html`,
`farshid/index.html`). Interactive pages cannot live in markdown:
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
  - `farshid/permalinks.js`, `farshid/page-aliases.js` — generated URL maps
    (permalinks → page, legacy `/notes/...` → page) used by root `404.html`.
  - `qr/index.html` — the `/qr/` permanent short link.
  - `farshid/content/` — every publication, course, note and talk as flat `.md`
    files, with images/mp3s/mindmaps colocated beside them; `atlas.md` is the index
    of everything; `swarm.html` is the standalone search tool.
  - `farshid/expert-coaching-resources/` — a second page folder (same rules); list it
    in `PAGE_DIRS` when a new folder is added, or its pages drop out of the Atlas,
    the search index, `sitemap.xml`, `llms.txt` and the permalink map.
  - `farshid/projects/` — the generators and the projects they index (each project
    is a `README.md`, read through the app).

## Page front matter

Every page file opens with its page header — the wording comes from the matching
note in the PKM vault (`../PKM`):

```yaml
---
layout: farshid_default
title: "10 Years of CV Debugging Lessons"
permalink: /notes/pubs/10-years/
description: "Lessons learned from a decade of debugging computer vision systems."
---
```

* `title` / `description` — what the app puts in the browser tab and what the
  indexes (`llms.txt`, `search-index.js`, `atlas.md`) quote. The app prefers the
  front-matter title over the H1.
* `permalink` — the page's stable URL. Legacy `/notes/...` paths are used because
  those are the URLs the pages were exported from and are linked internally.
* `sitemap: false` + `noindex: true` — add to a page that should stay out of the
  indexes; no page needs it today.
* A header is never rendered: `farshid/md.js` strips front matter before markdown
  is converted.

`gen_front_matter.py` writes and maintains the headers (it is idempotent —
`--check` is a dry run). Run it before the other generators when pages change:

```bash
python3 farshid/projects/gen_front_matter.py   # page headers + farshid/page-aliases.js
```

## Linking between pages

Inside markdown, link the target's markdown file — absolute (`/farshid/expert-coaching-resources/localAI.md`)
or relative to the page you are on (`localAI.md`). The app turns it into an in-app
route, so it renders without a reload, and a plain reader or crawler still follows
the file. A link without `.md` also works, but only through the URL router, so
prefer the `.md` form inside pages.

## Permanent links (short URLs)

* **`/qr/`** — the QR hub, a real page (HTTP 200, `noindex`, OpenGraph card) that
  opens `#content/qr`. Put `/qr/` on a business card or behind a printed QR code:
  short, permanent, and the content behind it can change freely.
* **Every front-matter `permalink` resolves.** `farshid/permalinks.js` (generated)
  maps both the permalink and the page's real file path → page route; root
  `404.html` resolves either in the browser. So `/notes/pubs/10-years/`,
  `/notes/wiki/`, `/projects/rag/`, `/farshid/expert-coaching-resources/localAI`
  and the rest open the right page (HTTP 404 → instant redirect; only the `.md`
  URLs are 200, which is what `sitemap.xml` and `llms.txt` list). Moving a page to
  another folder keeps its permalink working — re-run the generators.
* **`farshid/page-aliases.js`** (generated from the vault) adds ~170 older
  `/notes/<section>/<note>/` aliases, so links written years ago — the ones inside
  the pages themselves — land on the page that now serves that content.

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
python3 farshid/projects/gen_front_matter.py   # page headers, page-aliases.js
python3 farshid/projects/gen_atlas.py          # farshid/content/atlas.md
python3 farshid/projects/gen_search_index.py   # farshid/search-index.js
python3 farshid/projects/gen_static_pages.py   # llms.txt, llms-full.txt, sitemap.xml, permalinks.js
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
