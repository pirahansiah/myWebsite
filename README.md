# pirahansiah.com — Dr. Farshid Pirahansiah

A pure static (no build, no dependencies) personal site served on GitHub Pages from the `main` branch root.

## Structure

```
assets/     shared CSS, JS, and images (avatar, favicon, content images)
content/    the knowledge base — baked static HTML (papers, journals, books,
            patents, keynotes, courses, notes, slides)
*.html      top-level pages: index, about, publications, courses, notes,
            slides, book, contact, privacy, 404
```

## Editing

Edit the top-level `.html` hub pages directly. Individual content pages under
`content/` were generated from the PKM markdown vault; regenerate by re-running
the one-time bake script (`/tmp/bake.py`) then `python3 assemble.py` in staging.

## Deploy

GitHub Pages serves from branch `main` at `/`. `.nojekyll` pins it to pure
static (no Jekyll build). Push to `main` and it goes live.