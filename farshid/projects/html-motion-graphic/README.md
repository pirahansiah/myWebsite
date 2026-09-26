# HTML motion graphic

A standalone, dependency-free motion graphic index for the pages on pirahansiah.com. The SVG constellation, topic filters, search, selected-page inspector, and complete linked index all use the same sitemap-derived catalog.

## Open

Open `index.html` directly in a browser. No server or build step is required. The project keeps its fonts and catalog beside the page so the local file works without network access; links open the rendered pages on the canonical website.

## Refresh the page index

When the source site's sitemap or page titles change, run from this directory:

```sh
python3 build_catalog.py
```

The script reads the neighboring website's `sitemap.xml` and markdown titles and rewrites only `catalog.js` in this directory. It does not modify the website. This script assumes the project remains at `farshid/projects/html-motion-graphic/` inside the site repository.

The Ubuntu Sans font files are copied under the Ubuntu Font Licence; the licence is included in `assets/`.
