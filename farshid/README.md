# pirahansiah.com

A static, markdown-first personal site for Dr. Farshid Pirahansiah. GitHub Pages serves the `main` branch root as-is (`.nojekyll`); there is no Jekyll site build or runtime framework. Small Python scripts regenerate the search and catalog indexes when pages or downloads change.

**One file per page.** All public markdown pages are flat in `farshid/content/`. Page images live beside the markdown; sitewide images and fonts are in `farshid/assets/`; downloadable documents are in `farshid/downloads/`. The browser app renders each page directly from its source file.

- **readers** — the app shell fetches the `.md` and renders it (`#content/<slug>`,
  or the `/<slug>.md` URL, which routes into the app).
- **crawlers, LLM/answer engines, no-JS fetches** — they read the `.md` file
  directly; GitHub Pages serves it as `text/markdown`, which is the full text with
  no chrome. `/llms.txt` (every page + one-line summary), `/llms-full.txt` (the
  whole site in one file) and `/sitemap.xml` list those same markdown URLs.

Standalone HTML is used for the app shell, search, QR route shim, redirect stubs, and interactive tools. Scripts inside markdown are stripped, so interactive pages remain standalone `.html` files.

## Structure

GitHub Pages serves this repository from the `main` branch root, so the deployment shell and required metadata stay at the repository root: `index.html`, `404.html`, `.nojekyll`, `CNAME`, `robots.txt`, `sitemap.xml`, and the generated `llms*.txt` files. Moving those into `farshid/` would break the current Pages deployment.

- `farshid/content/` — the homepage, all public markdown pages, and page-specific images; one flat source directory. `atlas.md` is the index and `swarm.html` is the standalone search tool.
- `farshid/assets/` — sitewide profile/favicon images and self-hosted Ubuntu Sans fonts.
- `farshid/downloads/` — downloadable documents, scripts, archives, and their store-listing source text.
- `farshid/app.js`, `md.js`, `style.css`, `deck.css`, and `search-index.js` — app shell, markdown renderer, hash router, design system, deck styles, and generated search data.
- `farshid/permalinks.js` and `page-aliases.js` — generated URL maps used by root `404.html`.
- `farshid/qr/index.html` — the QR-route shim; `/qr/` remains the public short route to the QR page.
- `farshid/projects/` — generators and independent source projects. These retain their own subfolders where their build assets need them.

## Page front matter

Every markdown page opens with its page header — the wording comes from the matching note in the local PKM vault (`farshid/pkm`):

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

Inside markdown, link the target's markdown file — absolute (`/farshid/content/localAI.md`)
or relative to the page you are on (`localAI.md`). The app turns it into an in-app
route, so it renders without a reload, and a plain reader or crawler still follows
the file. A link without `.md` also works, but only through the URL router, so
prefer the `.md` form inside pages.

## Permanent links (short URLs)

* **`/qr/`** — a permanent short route to the `#content/qr` hub (noindex, OpenGraph card). The root 404 shim redirects it in the browser; the QR content can change without changing the printed code.
* **Every front-matter `permalink` resolves.** `farshid/permalinks.js` (generated)
  maps both the permalink and the page's real file path → page route; root
  `404.html` resolves either in the browser. So `/notes/pubs/10-years/`,
  `/notes/wiki/`, `/projects/rag/`, `/farshid/content/localAI`
  and the rest open the right page (HTTP 404 → instant redirect; only the `.md`
  URLs are 200, which is what `sitemap.xml` and `llms.txt` list). Moving a page to
  another folder keeps its permalink working — re-run the generators.
* **`farshid/page-aliases.js`** (generated from the vault) adds ~170 older
  `/notes/<section>/<note>/` aliases, so links written years ago — the ones inside
  the pages themselves — land on the page that now serves that content.

## Design system

The site is themed as the Ubuntu desktop brought to the web — Yaru / GNOME chrome
on the Ubuntu 26.10 desktop, wallpaper included — and the reading surface fills the
display instead of sitting in a narrow centred column.

- **The page is a window, not a document.** `body::before` paints the Ubuntu 26.10
  "Stonking Stingray" wallpaper (aubergine `#4d1436` with a lit fold `#7b4465` and a
  folded dark corner `#2c0b1e`; sampled from the release artwork, colours only — the
  stingray is Canonical's) as a fixed layer, `body` is padded by `--inset` /
  `--inset-top`, and everything else lives in `.app-window`: a rounded, shadowed,
  at-least-one-screen-tall surface. The header bar is the window's header bar and
  rises to the top of the display on scroll. A deck (`body.deck-mode`) drops the
  frame and the wallpaper and owns the screen.

- **Tokens** live at the top of `farshid/style.css`: `--canvas` `#fafafa`, surfaces
  `#fff`/`#f6f5f4`/`#ebebeb`, ink `#1d1d1d`/`#5c5c5c`, `--accent` `#e95420` (Yaru
  orange), `--accent-ink` `#b8410f` for link text, `--accent-fill` `#cc400b` behind
  white labels, `--radius` 12px. A `prefers-color-scheme: dark` block swaps in the
  Yaru dark set (`#242424` canvas). Decks stay white/black in both.
- **Type**: Ubuntu Sans (self-hosted) with `Ubuntu`/system fallbacks, Ubuntu Sans Mono for code; body text scales with the viewport and is 18px on phone-sized screens, with larger touch targets for controls.
- **Width**: nothing caps the layout — `--maxw` is `100%` and the gutter is
  `clamp(18px, 2.2vw, 52px)`. Prose paragraphs cap at `120ch` for readability;
  above 1620px a long prose page (`article.prose-cols`, 3 columns above 2400px)
  splits into columns, with code, tables, images and headings spanning the full
  width so nothing breaks across columns. Pages that ship their own layout (atlas
  index, decks, QR grid, games, wiki) stay single-column — `app.js` decides by
  looking for those panels in the rendered markdown.
- **Chrome**: the top bar is a GNOME header bar (translucent, hairline, flat pill
  nav), rows are boxed GNOME-style rows, cards are Yaru cards (12px, hairline, one
  soft shadow), buttons come in Yaru "suggested" and "normal" flavours. Browser
  surfaces (selection, caret, focus ring, scrollbar, `accent-color`) are themed too.
- Aesthetic rules that stay true across edits: flat surfaces (no gradients), no
  gradient text, no emoji standing in for icons, one `<h1>` per page, hairline
  rules instead of heavy borders, no animation of layout properties.

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
