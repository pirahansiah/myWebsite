#!/usr/bin/env python3
"""Generate crawler-readable static HTML pages from content/*.md.

Why: the site rendered every page client-side from raw .md. An LLM/answer-engine
crawler (or any no-JS fetch) therefore saw either a 10 KB JS shell or the raw
markdown source: no title, no description, no canonical, no structured data.

This script renders each markdown page into a real HTML document that shares the
site chrome and design system, and emits the machine-readable entry points:
  content/<slug>.html   one canonical page per markdown source
  llms.txt              curated index for LLMs (llmstxt.org convention)
  llms-full.txt         the same index plus the full text of every page
  sitemap.xml           canonical HTML URLs only

Run after adding/editing content:  python3 farshid/projects/gen_static_pages.py
"""
import os, re, sys, json, html, subprocess, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))          # .../myWebsite/farshid
SITE = os.path.abspath(os.path.join(ROOT, '..'))          # .../myWebsite
CONTENT = os.path.join(ROOT, 'content')
ORIGIN = 'https://pirahansiah.com'
SPA = ORIGIN + '/farshid/content/index.html'              # interactive app entry

# qr.md is the markdown twin of the standalone qrcode.html — one indexable URL is enough.
SKIP = {'qr'}

NAV = [('Home', '/farshid/content/index.html'),
       ('Atlas', '/farshid/content/atlas.html'),
       ('Search Swarm', '/farshid/content/swarm.html')]


def split_front_matter(body):
    """Jekyll/Google-Sites exports start with a YAML block; it is metadata, not content."""
    m = re.match(r'\s*---\s*\n(.*?)\n---\s*\n?', body, re.S)
    if not m:
        return {}, body
    meta = {}
    for line in m.group(1).split('\n'):
        mm = re.match(r'^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$', line)
        if mm:
            meta[mm.group(1).lower()] = mm.group(2).strip().strip('"\'')
    return meta, body[m.end():]


def literal_emphasis(html_in):
    """`**bold**` inside a raw-HTML block is not parsed by markdown — render it instead of leaking asterisks."""
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html_in, flags=re.S)


def _norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s)).lower()).strip()


def strip_leading_title(rendered, title):
    """Drop the body's opening heading when it only repeats the page title (already an h1).

    Looks only at the very top of the document: some pages open with a figure or a
    `<div>`, and deep inside a slide deck a matching heading must be left alone.
    """
    m = re.search(r'<h[12][^>]*>(.*?)</h[12]>', rendered[:600], re.S)
    if not m:
        return rendered
    body_head, t = _norm(m.group(1)), _norm(title)
    if body_head and body_head == t:
        return rendered[:m.start()] + rendered[m.end():]
    return rendered


def title_of(slug, body, meta=None):
    if meta and meta.get('title'):
        return ' '.join(meta['title'].split())
    m = re.search(r'^#\s+(.+)$', body, re.M)
    if not m:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S)
    if m:
        t = re.sub(r'<[^>]+>', '', m.group(1))
        t = re.sub(r'[*_`]', '', t)
        t = re.sub(r'[\U0001F000-\U0001FAFF\u2190-\u21FF\u2600-\u27BF\uFE0F]', ' ', t)  # emoji: body may keep them, metadata must not
        return ' '.join(html.unescape(t).split())
    return ' '.join(w.capitalize() for w in slug.replace('-', ' ').split())


def first_paragraph(body, meta=None):
    """Plain-text summary from the first real paragraph (HTML or markdown)."""
    if meta and meta.get('description'):
        return ' '.join(meta['description'].split())
    for block in re.split(r'\n\s*\n', body):
        b = block.strip()
        if not b or b.startswith(('#', '<style', '<script', '<div', '<nav', '<table', '- ', '* ', '|', '>')):
            continue
        if b.startswith('<'):
            m = re.search(r'<p[^>]*>(.*?)</p>', b, re.S)
            if not m:
                continue
            b = m.group(1)
        text = re.sub(r'!\[[^\]]*\]\([^)]*\)', '', b)          # images
        text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)    # links keep their text
        text = re.sub(r'<[^>]+>', '', text)
        text = re.sub(r'[*_`>]', '', text)
        text = html.unescape(text)
        text = ' '.join(text.split())
        if len(text) > 40:
            return text
    return ''


def truncate(text, limit=155):
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(' ', 1)[0].rstrip(' ,;:.—-')
    return cut + '…'


def section_of(slug):
    if slug.startswith('books-'): return 'Publications'
    if slug.startswith(('journals-', 'papers-', 'patents-', 'keynotes-')): return 'Publications'
    if slug == 'computer-vision': return 'Publications'
    if slug.startswith('course-'): return 'Courses'
    if slug.startswith('note-'): return 'Notes & Guides'
    if slug.startswith('slides-') or slug.startswith('presentation'): return 'Talks & Presentations'
    if slug in ('research-tools',): return 'Talks & Presentations'
    if slug in ('atlas', 'contact', 'privacy'): return 'Site'
    return 'Notes & Guides'


def date_modified(rel_path):
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', rel_path],
                             cwd=SITE, capture_output=True, text=True, timeout=20)
        d = out.stdout.strip()
        if re.match(r'^\d{4}-\d{2}-\d{2}$', d):
            return d
    except Exception:
        pass
    return datetime.date.today().isoformat()


_SLUGS = set()
LEGACY_SEGMENT_PREFIXES = ['course-', 'note-', 'journals-', 'papers-', 'books-', 'talk-']

# Hand-checked targets for legacy paths whose intent is section-level (they point at
# the Atlas index) or abbreviated (/notes/courses/fsdl/ = full-stack deep learning).
LEGACY_ALIASES = {
    '/notes/':                      '/farshid/content/atlas.html#site-pages',
    '/notes/sitemap/':              '/farshid/content/atlas.html',
    '/notes/docs/':                 '/farshid/content/atlas.html#notes-guides',
    '/notes/docs/links/':           '/farshid/content/atlas.html#site-pages',
    '/notes/docs/resources/':       '/farshid/content/atlas.html#notes-guides',
    '/notes/docs/dev-tools/':       '/farshid/content/atlas.html#notes-guides',
    '/notes/docs/shell-vim/':       '/farshid/content/atlas.html#notes-guides',
    '/notes/docs/optimization/':    '/farshid/content/note-optimization-guide.html',
    '/notes/docs/llm/local-llm-optimization/': '/farshid/content/note-optimization-guide.html',
    '/notes/docs/cv/3d/':           '/farshid/content/note-3d-vision.html',
    '/notes/docs/research/':        '/farshid/content/research-tools.html',
    '/notes/courses/':              '/farshid/content/atlas.html#courses',
    '/notes/courses/book-summary/': '/farshid/content/atlas.html#book-chapters',
    '/notes/courses/fsdl/':         '/farshid/content/course-full-stack-dl.html',
    '/notes/courses/fsdl-2022/':    '/farshid/content/course-full-stack-dl-2022.html',
    '/notes/courses/tf-deploy/':    '/farshid/content/course-tensorflow-deploy.html',
    '/notes/courses/ml-spec/':      '/farshid/content/course-ml-specialization.html',
    '/notes/courses/parallel/':     '/farshid/content/course-parallel-computing.html',
    '/notes/pubs/':                 '/farshid/content/atlas.html#publications',
    '/notes/pubs/books/':           '/farshid/content/atlas.html#book-chapters',
    '/notes/pubs/journals/':        '/farshid/content/atlas.html#journal-articles',
    '/notes/pubs/papers/':          '/farshid/content/atlas.html#conference-papers',
    '/notes/pubs/patents/':         '/farshid/content/atlas.html#patents',
    '/notes/pubs/cv/':              '/farshid/content/atlas.html#publications',
    '/notes/pubs/keynotes/llm-cv/': '/farshid/content/keynotes-llm-cv.html',
    '/notes/pkm/':                  '/farshid/content/atlas.html#notes-guides',
    '/notes/pkm/TOC/':              '/farshid/content/atlas.html#notes-guides',
    '/notes/pkm/links/':            '/farshid/content/atlas.html#notes-guides',
    '/notes/pkm/proof/':            '/farshid/content/atlas.html#notes-guides',
}


def resolve_legacy(href):
    """Map a Google-Sites-era path (/notes/docs/cv/optical-flow/) onto the page that
    exists today. Rewrites only when exactly one slug matches — never a guess."""
    parts = [p for p in href.strip('/').split('/') if p]
    if not parts or not _SLUGS:
        return None
    seg = parts[-1].lower()
    cands = {seg} | {pre + seg for pre in LEGACY_SEGMENT_PREFIXES}
    hits = [s for s in _SLUGS if s.lower() in cands]
    if len(hits) == 1:
        return hits[0]
    toks = [t for t in re.split(r'[-_]+', seg) if len(t) > 2]
    hits = [s for s in _SLUGS if toks and all(t in s.lower() for t in toks)]
    return hits[0] if len(hits) == 1 else None


def rewrite_links(fragment):
    """Point in-page links at the canonical static pages, so crawlers can follow them.

    Matches `href=` attributes explicitly. (Pairing bare quotes across the whole
    fragment drifts on apostrophes in prose and silently skips links.)"""
    def repl(m):
        quote, h_raw = m.group('q'), m.group('h')
        h = h_raw.strip()
        if re.match(r'^(https?:)?//|^mailto:|^tel:|^data:', h):
            return m.group(0)
        # #content/slug or #content/slug:anchor  ->  /farshid/content/slug.html#anchor
        mm = re.match(r'^#?/?content/([A-Za-z0-9._-]+?)(?:\.md)?(?::([A-Za-z0-9._-]+))?$', h)
        if mm:
            return f'href={quote}/farshid/content/{mm.group(1)}.html' + (f'#{mm.group(2)}' if mm.group(2) else '') + quote
        if h in ('#atlas', '/farshid/content/atlas.md', 'atlas.md'):
            return f'href={quote}/farshid/content/atlas.html{quote}'
        if h in ('#home', '/'):
            return m.group(0)
        # /farshid/content/<slug>.md  or  <slug>.md (relative)
        mm = re.match(r'^(?:/farshid/content/|/content/|\./)?([A-Za-z0-9._-]+)\.md(?:#(.+))?$', h)
        if mm:
            return f'href={quote}/farshid/content/{mm.group(1)}.html' + (f'#{mm.group(2)}' if mm.group(2) else '') + quote
        # hand-checked aliases for Google-Sites-era section roots and acronyms
        path, _, frag = h.partition('#')
        if path in LEGACY_ALIASES:
            target = LEGACY_ALIASES[path]
            return f'href={quote}{target}{("#" + frag) if frag else ""}{quote}'
        # legacy Google-Sites paths (/notes/docs/cv/optical-flow/) -> the page that exists
        if path.startswith('/') and not path.startswith('//'):
            target = resolve_legacy(path)
            if target:
                return f'href={quote}/farshid/content/{target}.html' + (f'#{frag}' if frag else '') + quote
        # in-page hash to a heading on the same deck/section: leave alone
        return m.group(0)
    return re.sub(r'href=(?P<q>["\'])(?P<h>[^"\']+)(?P=q)', repl, fragment)


BOILER_HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
'<meta name="theme-color" content="#EEF0F4">
<title>{title} · Farshid Pirahansiah</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<link rel="alternate" type="text/markdown" href="{md}" title="Markdown source">
<link rel="icon" href="/farshid/favicon.png">
<link rel="stylesheet" href="/farshid/style.css">
<meta property="og:site_name" content="Farshid Pirahansiah">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta name="twitter:card" content="summary">
<meta name="author" content="Dr. Farshid Pirahansiah">
<link rel="llms" href="/llms.txt">
<script type="application/ld+json">{jsonld}</script>
</head>'''

BOILER_HEAD_STYLE = '<style>\n{extra}\n</style>'


def nav_html(active):
    out = ['<header class="topbar"><div class="topbar-inner">',
           f'<a class="brand" href="/farshid/content/index.html">Dr. Farshid Pirahansiah</a>',
           '<nav class="nav" aria-label="Primary">']
    for label, href in NAV:
        cls = 'nav-item active' if label == active else 'nav-item'
        out.append(f'<a class="{cls}" href="{href}">{label}</a>')
    out.append('</nav></div></header>')
    return '\n'.join(out)


def footer_html():
    return ('<footer class="footer">\n  <div class="footer-inner">\n'
            '    <div class="footer-brand">Dr. Farshid Pirahansiah</div>\n'
            '    <div class="footer-links">\n'
            '      <a href="/farshid/content/index.html">Home</a>\n'
            '      <a href="/farshid/content/atlas.html">Atlas</a>\n'
            '      <a href="/farshid/content/swarm.html">Search Swarm</a>\n'
            '      <a href="/farshid/content/qrcode.html">Scan &amp; Share</a>\n'
            '    </div>\n'
            '    <div class="footer-note">Edge AI &middot; computer vision &middot; &copy; <span data-year>2026</span></div>\n'
            '  </div>\n</footer>\n'
            '<script>document.querySelectorAll(\'[data-year]\').forEach(function(e){ e.textContent=new Date().getFullYear(); });</script>')


def jsonld_for(slug, title, description, canonical, modified):
    person = {
        "@type": "Person",
        "@id": ORIGIN + "/#person",
        "name": "Dr. Farshid Pirahansiah",
        "url": ORIGIN + "/",
        "jobTitle": "Computer Vision & Edge AI Engineer",
        "email": "info@pirahansiah.com",
        "knowsAbout": ["Computer Vision", "Edge AI", "Model Optimization", "On-device LLMs",
                       "GPU Acceleration", "Image Processing"],
        "sameAs": ["https://www.linkedin.com/in/pirahansiah/",
                   "https://github.com/pirahansiah",
                   "https://scholar.google.com/citations?user=GvCEy4QAAAAJ&hl=en",
                   "https://x.com/pirahansiah"],
    }
    article = {
        "@type": "Article",
        "@id": canonical + "#article",
        "url": canonical,
        "name": title,
        "headline": title,
        "description": description,
        "inLanguage": "en",
        "dateModified": modified,
        "author": {"@id": ORIGIN + "/#person"},
        "publisher": {"@id": ORIGIN + "/#person"},
        "isPartOf": {"@id": ORIGIN + "/#website"},
        "mainEntityOfPage": {"@id": canonical},
    }
    if slug.startswith(('journals-', 'papers-', 'books-')):
        article["@type"] = "ScholarlyArticle"
    site = {"@type": "WebSite", "@id": ORIGIN + "/#website", "url": ORIGIN + "/",
            "name": "Farshid Pirahansiah", "inLanguage": "en",
            "publisher": {"@id": ORIGIN + "/#person"}}
    crumbs = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": ORIGIN + "/farshid/content/index.html"},
            {"@type": "ListItem", "position": 2, "name": "Atlas", "item": ORIGIN + "/farshid/content/atlas.html"},
            {"@type": "ListItem", "position": 3, "name": title, "item": canonical},
        ],
    }
    return json.dumps({"@context": "https://schema.org", "@graph": [person, site, article, crumbs]},
                      ensure_ascii=False, separators=(',', ':'))


def slugify(text):
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', text.lower()))


def build_pages(md_files):
    import markdown
    _SLUGS.clear()
    _SLUGS.update(n[:-3] for n in md_files if n[:-3] not in SKIP)   # only slugs that get a page
    pages = []
    for name in md_files:
        slug = name[:-3]
        if slug in SKIP:
            continue
        src_path = os.path.join(CONTENT, name)
        body = open(src_path, encoding='utf-8').read()
        meta, body = split_front_matter(body)
        title = title_of(slug, body, meta)
        description = truncate(first_paragraph(body, meta)) or f'{title} — Dr. Farshid Pirahansiah, computer vision and edge AI engineer.'

        md = markdown.Markdown(extensions=['extra', 'sane_lists', 'toc'])
        rendered = md.convert(body)
        # the page already has one h1 (the title); body headings drop a level so agents
        # and screen readers get a single, honest outline
        rendered = strip_leading_title(re.sub(r'<(/?)h1([^>]*)>', r'<\1h2\2>', rendered), title)
        # interactive pages keep their own standalone HTML twin; never ship their scripts here
        rendered = re.sub(r'<script\b.*?</script>', '', rendered, flags=re.S | re.I)
        rendered = literal_emphasis(rendered)
        rendered = rewrite_links(rendered)

        canonical = f'{ORIGIN}/farshid/content/{slug}.html'
        modified = date_modified(os.path.relpath(src_path, SITE))
        is_deck = 'presentation-panel' in body

        head_extra = []
        if is_deck:
            head_extra.append('.deck-invite{margin:0 0 26px;padding:18px 20px;border:1px solid var(--rule);'
                              'border-radius:14px;background:var(--surface-2)}'
                              '.deck-invite p{margin:0 0 12px;color:var(--ink-2);font-size:15px}')
        head = BOILER_HEAD.format(title=html.escape(title), description=html.escape(description, quote=True),
                                  canonical=canonical, md=f'/farshid/content/{slug}.md',
                                  jsonld=jsonld_for(slug, title, description, canonical, modified))
        if head_extra:
            head += '\n' + BOILER_HEAD_STYLE.format(extra='\n'.join(head_extra))

        crumbs = ('<nav class="crumbs" aria-label="Breadcrumb">'
                  f'<a href="/farshid/content/index.html">Home</a><span>/</span>'
                  f'<a href="/farshid/content/atlas.html">Atlas</a><span>/</span>'
                  f'<a href="/farshid/content/atlas.html#{slugify(section_of(slug))}">{html.escape(section_of(slug))}</a>'
                  '</nav>')

        invite = ''
        if is_deck:
            invite = ('<div class="deck-invite"><p>Slide deck — this page holds the full text of every slide. '
                      f'<a href="/farshid/content/index.html#content/{slug}">Open it as a presentation</a>.</p></div>')

        doc = '\n'.join([
            head,
            '<body>',
            nav_html(''),
            '<main class="wrap">',
            crumbs,
            '<article class="article">',
            f'<h1>{html.escape(title)}</h1>',
            invite,
            rendered,
            '</article>',
            '<p class="page-foot">'
            f'Source: <a href="/farshid/content/{slug}.md">content/{slug}.md</a> · '
            'Last modified ' + modified + ' · '
            '<a href="/farshid/content/atlas.html">All pages</a></p>',
            '</main>',
            footer_html(),
            '</body>',
            '</html>',
            '',
        ])
        open(os.path.join(CONTENT, slug + '.html'), 'w', encoding='utf-8').write(doc)
        pages.append({'slug': slug, 'title': title, 'description': description, 'path': src_path,
                      'url': canonical, 'section': section_of(slug), 'modified': modified})
    return pages


LLMS_SECTIONS = ['Site', 'Publications', 'Notes & Guides', 'Courses', 'Talks & Presentations', 'Projects']


def write_llms(pages):
    by = {s: [] for s in LLMS_SECTIONS}
    for p in sorted(pages, key=lambda x: (x['section'], x['title'].lower())):
        by.setdefault(p['section'], []).append(p)
    lines = [
        '# Farshid Pirahansiah',
        '',
        '> Dr. Farshid Pirahansiah — computer vision and edge AI engineer. 21 publications, 3 patents, '
        '12+ years turning computer-vision and deep-learning research into production systems for edge and cloud.',
        '',
        'Every page below is a static HTML document; the markdown source is linked from each page '
        '(`<link rel="alternate" type="text/markdown">`). Cite the canonical URL shown in the link. '
        'Contact: info@pirahansiah.com · Full text of the whole site: /llms-full.txt',
        '',
    ]
    for sec in LLMS_SECTIONS:
        items = by.get(sec) or []
        if not items:
            continue
        lines.append(f'## {sec}')
        lines.append('')
        for p in items:
            lines.append(f"- [{p['title']}]({p['url']}): {p['description']}")
        lines.append('')
    open(os.path.join(SITE, 'llms.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    full = ['# Farshid Pirahansiah — full site text', '',
            f'Generated {datetime.date.today().isoformat()} from the markdown sources of {ORIGIN}.',
            'Each section is one page, in the order of the Atlas.', '']
    for sec in LLMS_SECTIONS:
        items = by.get(sec) or []
        if not items:
            continue
        full += [f'# {sec}', '']
        for p in items:
            raw = open(p['path'], encoding='utf-8').read()
            _meta, raw = split_front_matter(raw)
            raw = re.sub(r'<script\b.*?</script>', '', raw, flags=re.S | re.I)
            full += [f"## {p['title']}", f"URL: {p['url']}", '', raw.strip(), '', '---', '']
    open(os.path.join(SITE, 'llms-full.txt'), 'w', encoding='utf-8').write('\n'.join(full))


def write_sitemap(pages):
    fixed = [('/farshid/content/index.html', 'daily', '1.0'),
             ('/farshid/content/atlas.html', 'weekly', '0.9'),
             ('/farshid/content/qrcode.html', 'monthly', '0.6'),
             ('/farshid/content/swarm.html', 'monthly', '0.5')]
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<!-- Canonical HTML pages. Markdown sources are linked from each page and are not listed here. -->',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, freq, prio in fixed:
        out.append(f'  <url><loc>{ORIGIN}{loc}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>')
    for p in sorted(pages, key=lambda x: x['slug']):
        if p['slug'] in ('atlas',):
            continue
        out.append(f"  <url><loc>{p['url']}</loc><lastmod>{p['modified']}</lastmod><priority>0.7</priority></url>")
    out.append('</urlset>')
    out.append('')
    open(os.path.join(SITE, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(out))


def build_project_pages():
    """projects/<dir>/README.md -> projects/<dir>/index.html (a real URL for each project)."""
    proj = os.path.join(ROOT, 'projects')
    made = []
    if not os.path.isdir(proj):
        return made
    import markdown
    for d in sorted(os.listdir(proj)):
        readme = os.path.join(proj, d, 'README.md')
        if not os.path.isfile(readme):
            continue
        body = open(readme, encoding='utf-8').read()
        meta, body = split_front_matter(body)
        title = title_of(d, body, meta)
        description = truncate(first_paragraph(body, meta)) or f'{title} — project by Dr. Farshid Pirahansiah.'
        rendered = markdown.Markdown(extensions=['extra', 'sane_lists', 'toc']).convert(body)
        rendered = strip_leading_title(re.sub(r'<(/?)h1([^>]*)>', r'<\1h2\2>', rendered), title)
        rendered = rewrite_links(re.sub(r'<script\b.*?</script>', '', rendered, flags=re.S | re.I))
        canonical = f'{ORIGIN}/farshid/projects/{d}/'
        head = BOILER_HEAD.format(title=html.escape(title), description=html.escape(description, quote=True),
                                  canonical=canonical, md=f'/farshid/projects/{d}/README.md',
                                  jsonld=jsonld_for(d, title, description, canonical, date_modified(os.path.relpath(readme, SITE))))
        doc = '\n'.join([head, '<body>', nav_html(''), '<main class="wrap">',
                         '<nav class="crumbs" aria-label="Breadcrumb">'
                         '<a href="/farshid/content/index.html">Home</a><span>/</span>'
                         '<a href="/farshid/content/atlas.html">Atlas</a><span>/</span>Projects</nav>',
                         '<article class="article">',
                         f'<h1>{html.escape(title)}</h1>',
                         rendered, '</article>',
                         f'<p class="page-foot">Source: <a href="/farshid/projects/{d}/README.md">projects/{d}/README.md</a>'
                         ' · <a href="/farshid/content/atlas.html">All pages</a></p>',
                         '</main>', footer_html(), '</body>', '</html>', ''])
        open(os.path.join(proj, d, 'index.html'), 'w', encoding='utf-8').write(doc)
        made.append({'slug': 'project-' + d, 'title': title, 'description': description, 'path': readme,
                     'url': canonical, 'section': 'Projects', 'modified': date_modified(os.path.relpath(readme, SITE))})
    return made


def main():
    if not os.path.isdir(CONTENT):
        sys.exit('missing content dir: ' + CONTENT)
    md_files = sorted(f for f in os.listdir(CONTENT) if f.endswith('.md'))
    pages = build_pages(md_files)
    projects = build_project_pages()
    all_pages = pages + projects
    write_llms(all_pages)
    write_sitemap(all_pages)
    print(f'static pages: {len(pages)} content pages, {len(projects)} project pages')
    print('llms.txt, llms-full.txt, sitemap.xml written')


if __name__ == '__main__':
    main()
