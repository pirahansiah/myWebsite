#!/usr/bin/env python3
"""Render every markdown page to a static HTML page crawlers and answer engines can read.

Why this exists
---------------
The site's human layer is a client-rendered app: `farshid/app.js` fetches a `.md`
file and renders it in the browser. A crawler that does not run JavaScript (GPTBot,
ClaudeBot, PerplexityBot, CCBot, Bingbot without render, ...) therefore sees NOTHING
on a clean page URL — and nothing on the app's own routes either, because the clean
URLs are answered by `404.html` (HTTP 404 + `noindex`). `GPTBot`/`CCBot` also treat a
bare `text/markdown` response as source code more often than as an article.

So each page gets a second, generated representation: a complete static HTML page at
its canonical URL, with the full text, headings that carry ids, internal links
rewritten to other static pages, OpenGraph/Twitter cards and JSON-LD.

    farshid/content/<slug>.md   ->  farshid/content/<slug>/index.html
    farshid/projects/<name>/README.md -> farshid/projects/<name>/README.html

**The markdown file stays the only source.** Nothing here is meant to be edited by
hand: the twin carries a "generated" banner and is rewritten on every run. Edits go
to the `.md`, then:

    python3 farshid/projects/gen_front_matter.py   # page headers
    python3 farshid/projects/gen_atlas.py          # atlas.md
    python3 farshid/projects/gen_search_index.py   # search-index.js
    python3 farshid/projects/gen_static_pages.py   # llms.txt, llms-full.txt, sitemap.xml, permalinks.js
    python3 farshid/projects/gen_page_html.py      # the static HTML page per markdown page + feed.xml

Requires: python3 -m pip install markdown
"""
import os
import re
import sys
import json
import html as html_mod
import subprocess
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_static_pages as gsp  # noqa: E402  (reuses page discovery + front matter parsing)

import markdown  # noqa: E402
from string import Template  # noqa: E402

ORIGIN = gsp.ORIGIN
ROOT = gsp.ROOT
SITE = gsp.SITE
CONTENT = gsp.CONTENT

PERSON_ID = ORIGIN + '/#person'
SITE_ID = ORIGIN + '/#website'
FOR_AI = ORIGIN + '/farshid/content/for-ai/'
LICENSE = ORIGIN + '/ai.txt'
PROFILE_IMG = ORIGIN + '/farshid/assets/profile.jpg'

# section -> schema.org type of the page itself
LD_TYPE = {
    'Publications': 'ScholarlyArticle',
    'Notes & Guides': 'TechArticle',
    'Courses': 'Course',
    'Mentoring & Coaching': 'TechArticle',
    'Talks & Presentations': 'PresentationDigitalDocument',
    'Projects': 'SoftwareSourceCode',
    'Site': 'WebPage',
}


def ld_type(slug, section):
    if slug.startswith('books-'):
        return 'Chapter'
    if slug.startswith('patents-'):
        return 'CreativeWork'
    if slug.startswith('keynotes-'):
        return 'PresentationDigitalDocument'
    return LD_TYPE.get(section, 'TechArticle')


def html_url(p):
    """The canonical URL of a page's static HTML rendering."""
    if p['route'].startswith('projects/'):
        return f"{ORIGIN}/{p['md'].lstrip('/')[:-3]}.html"
    return f"{ORIGIN}/farshid/content/{p['slug']}/"


def out_path(p):
    rel = p['md'].lstrip('/')                       # farshid/content/x.md | farshid/projects/n/README.md
    if p['route'].startswith('projects/'):
        return os.path.join(SITE, rel[:-3] + '.html')
    return os.path.join(CONTENT, p['slug'], 'index.html')


def date_created(rel_path):
    try:
        out = subprocess.run(['git', 'log', '--diff-filter=A', '--format=%cs', '--', rel_path],
                             cwd=SITE, capture_output=True, text=True, timeout=20)
        dates = [d for d in out.stdout.split() if re.match(r'^\d{4}-\d{2}-\d{2}$', d)]
        if dates:
            return sorted(dates)[0]
    except Exception:
        pass
    return None


# ---------------------------------------------------------------- markdown -> html

MD = markdown.Markdown(extensions=['tables', 'fenced_code', 'sane_lists', 'md_in_html',
                                   'toc', 'footnotes', 'def_list', 'abbr'],
                       output_format='html')


def strip_scripts(text):
    """Inline <script> in a .md never runs through the app (innerHTML), and its body
    would otherwise land in the page text as source code. Drop it, keep <style>."""
    return re.sub(r'<script\b.*?</script>', '', text, flags=re.S | re.I)


def link_targets(pages):
    """Map every URL form the corpus links with onto the static page it should open."""
    by_slug, by_perm, by_md = {}, {}, {}
    for p in pages:
        canon = html_url(p)
        by_slug[p['slug']] = canon
        md = p['md'].lstrip('/')
        by_md[md.lower()] = canon
        if md.endswith('.md'):
            by_md[md[:-3].lower()] = canon          # the extension-less form
        perm = (p.get('permalink') or '').strip().lower()
        if perm:
            by_perm[perm.strip('/')] = canon
            by_perm[perm.strip('/').split('/')[-1]] = canon
    return by_slug, by_perm, by_md


def rewrite_links(body, targets):
    by_slug, by_perm, by_md = targets

    def canon(path):
        """Canonical static URL for an internal link path, or None."""
        raw = path.strip()
        if not raw or raw.startswith(('mailto:', 'tel:', '#')):
            return None
        # same-origin absolute links (https://pirahansiah.com/farshid/content/x.md) are internal too
        for prefix in (ORIGIN, ORIGIN.replace('https://', 'http://'),
                       'https://www.pirahansiah.com', 'http://www.pirahansiah.com'):
            if raw.startswith(prefix + '/'):
                raw = raw[len(prefix):]
                break
        if raw.startswith(('//', 'http://', 'https://')):
            return None
        clean = raw.split('?')[0]
        key = clean.lstrip('/').lower()
        key_noext = re.sub(r'\.md$', '', key)
        for k in (key, key_noext, 'farshid/content/' + key, 'farshid/content/' + key_noext):
            if k in by_md:
                return by_md[k]
        perm = key.strip('/')
        if perm in by_perm:
            return by_perm[perm]
        # a relative link (localAI.md) points at a content page
        base = key.split('/')[-1]
        if base in by_slug:
            return by_slug[base]
        if base + '.md' in by_md:
            return by_md[base + '.md']
        return None

    def repl(m):
        attr, val = m.group(1), html_mod.unescape(m.group(2))
        path, _, frag = val.partition('#')
        new = canon(path)
        if new is None:
            return m.group(0)
        out = new + (('#' + frag) if frag else '')
        return f'{attr}="{html_mod.escape(out, quote=True)}"'

    body = re.sub(r'(href)="([^"]*)"', repl, body)
    # images: absolute URLs so feeds, OpenGraph and mirrors resolve them
    body = re.sub(r'(<img[^>]*\ssrc)="(/[^"]*)"',
                  lambda m: f'{m.group(1)}="{ORIGIN}{html_mod.escape(m.group(2))}"', body)
    return body


def render(p):
    raw = open(p['path'], encoding='utf-8').read()
    _meta, body_md = gsp.split_front_matter(raw)
    MD.reset()
    body = MD.convert(strip_scripts(body_md))
    body = rewrite_links(body, TARGETS)
    if not re.search(r'<h1\b', body, re.I):
        body = f'<h1>{html_mod.escape(p["title"])}</h1>\n' + body
    # a page that ships its own panels keeps one full-width flow (same rule as app.js)
    panel = re.search(r'class="[^"]*\b(hero|atlas-list|presentation-panel|wiki-cols|wiki-wrap|'
                      r'qr-grid|sitemap-grid|game-page|sga-wrap|crypto-panel|mm-hero|swarm-studio|'
                      r'send-panel)\b', body)
    return body, ('' if panel else ' prose-cols')


def first_image(body):
    m = re.search(r'<img[^>]*\ssrc="([^"]+)"', body)
    if not m:
        return PROFILE_IMG
    src = m.group(1)
    return src if src.startswith('http') else ORIGIN + src


# ------------------------------------------------------------------------- head/shell

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#4d1436" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#3d1030" media="(prefers-color-scheme: dark)">
<title>$title — Farshid Pirahansiah</title>
<meta name="description" content="$desc">
<meta name="author" content="Dr. Farshid Pirahansiah">
<link rel="canonical" href="$canon">
<link rel="alternate" type="text/markdown" href="$mdurl" title="Markdown source of this page">
<link rel="alternate" type="text/plain" href="/ai.txt" title="AI usage permissions">
<link rel="alternate" type="application/rss+xml" href="/feed.xml" title="pirahansiah.com — updated pages">
<link rel="icon" href="/farshid/assets/favicon.png">
<link rel="stylesheet" href="/farshid/style.css">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:site_name" content="Farshid Pirahansiah">
<meta property="og:type" content="article">
<meta property="og:url" content="$canon">
<meta property="og:title" content="$title">
<meta property="og:description" content="$desc">
<meta property="og:image" content="$image">
<meta property="og:locale" content="en">
<meta property="article:author" content="Dr. Farshid Pirahansiah">
<meta property="article:modified_time" content="$modified">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="$title">
<meta name="twitter:description" content="$desc">
<meta name="twitter:image" content="$image">
<script type="application/ld+json">
$ld
</script>
<!-- Google tag (gtag.js) GA4 with Consent Mode v2 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2L49VVJP3B"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied'
  });
  gtag('js', new Date());
  gtag('config', 'G-2L49VVJP3B');
</script>
<!-- Microsoft Clarity (session replay + dead clicks) -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "ylg7k9stm7");
</script>
</head>
<body>
<!-- generated by farshid/projects/gen_page_html.py — do not edit: the source of this page is
     $mdurl (markdown) and the site is rendered from it. Edit the markdown and regenerate. -->
<div class="app-window">
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="/farshid/content/index.html">Dr. Farshid Pirahansiah</a>
    <nav id="nav" class="nav" aria-label="Primary">
      <a class="nav-item" href="/farshid/content/index.html">Home</a>
      <a class="nav-item" href="/farshid/content/atlas/">Atlas</a>
      <a class="nav-item" href="/farshid/content/swarm.html">Search Swarm</a>
    </nav>
    <button id="nav-toggle" class="nav-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2.5 6h13M2.5 12h13"/></svg></button>
  </div>
</header>

<div id="gdpr-banner" class="gdpr-banner">
  <span>Cookies support analytics and personalized ads. Accept, or only necessary storage is used.</span>
  <div class="gdpr-actions">
    <button id="gdpr-decline" type="button" class="ghost">Decline</button>
    <button id="gdpr-accept" type="button">Accept</button>
  </div>
</div>

<main>
<div id="content" class="wrap">
<article class="article$panel">
$body
<hr>
<p class="page-source"><em>Source:</em> Pirahansiah, F. &ldquo;$title_esc&rdquo;. pirahansiah.com, updated $modified.
Canonical URL <a href="$canon">$canon</a> &middot; markdown source <a href="$mdurl">$mdfile</a> &middot;
<a href="/farshid/content/for-ai/">how to cite, quote and link this site</a>.</p>
</article>
</div>
</main>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-links">
      <a href="/farshid/content/index.html">Home</a>
      <a href="/farshid/content/atlas/">Atlas</a>
      <a href="/farshid/content/swarm.html">Search Swarm</a>
      <a href="/farshid/content/for-ai/">For AI &amp; LLMs</a>
    </div>
    <div class="footer-note">Edge AI &middot; computer vision &middot; &copy; <span data-year>2026</span></div>
  </div>
</footer>
</div><!-- /.app-window -->
<script src="/farshid/md.js"></script>
<script src="/farshid/app.js"></script>
<script>document.querySelectorAll('[data-year]').forEach(function(e){ e.textContent=new Date().getFullYear(); });</script>
<script>
  (function(){
    var banner=document.getElementById('gdpr-banner');
    var accept=document.getElementById('gdpr-accept');
    var decline=document.getElementById('gdpr-decline');
    function closeSheet(){ if(banner) banner.classList.remove('active'); document.body.classList.remove('has-consent-sheet'); }
    if(localStorage.getItem('gdpr_consent')){ closeSheet(); }
    else { if(banner) banner.classList.add('active'); document.body.classList.add('has-consent-sheet'); }
    if(accept) accept.addEventListener('click', function(){
      localStorage.setItem('gdpr_consent','granted'); closeSheet();
      if(window.gtag) gtag('consent','update',{
        'ad_storage':'granted','ad_user_data':'granted','ad_personalization':'granted','analytics_storage':'granted'
      });
    });
    if(decline) decline.addEventListener('click', function(){
      localStorage.setItem('gdpr_consent','denied'); closeSheet();
      if(window.gtag) gtag('consent','update',{
        'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied'
      });
    });
  })();
</script>
</body>
</html>
"""

PERSON_LD = {
    '@type': 'Person', '@id': PERSON_ID, 'name': 'Dr. Farshid Pirahansiah',
    'honorificPrefix': 'Dr.', 'alternateName': 'Farshid PirahanSiah',
    'url': ORIGIN + '/', 'jobTitle': 'Computer Vision & Edge AI Mentor and Consultant',
    'image': PROFILE_IMG,
    'sameAs': ['https://www.linkedin.com/in/pirahansiah/', 'https://github.com/pirahansiah',
               'https://scholar.google.com/citations?user=GvCEy4QAAAAJ&hl=en',
               'https://x.com/pirahansiah',
               'https://www.youtube.com/@computervisiondeeplearning',
               'https://podcasters.spotify.com/pod/show/pirahansiah'],
}

WEBSITE_LD = {
    '@type': 'WebSite', '@id': SITE_ID, 'url': ORIGIN + '/', 'name': 'Farshid Pirahansiah',
    'inLanguage': 'en', 'usageInfo': FOR_AI, 'license': LICENSE,
    'citation': 'Pirahansiah, F. (2026). pirahansiah.com — computer vision and edge AI knowledge base. '
                'https://pirahansiah.com/',
    'mainEntity': {'@id': PERSON_ID}, 'publisher': {'@id': PERSON_ID},
}


def json_ld(p, canon, mdurl, image, body):
    created = p.get('created') or p['modified']
    node = {
        '@type': ld_type(p['slug'], p['section']),
        '@id': canon + '#page',
        'url': canon,
        'name': p['title'],
        'headline': p['title'],
        'description': p['description'],
        'inLanguage': 'en',
        'isPartOf': {'@id': SITE_ID},
        'mainEntityOfPage': {'@id': canon + '#page'},
        'author': {'@id': PERSON_ID},
        'publisher': {'@id': PERSON_ID},
        'datePublished': created,
        'dateModified': p['modified'],
        'license': LICENSE,
        'usageInfo': FOR_AI,
        'isAccessibleForFree': True,
        'image': image,
    }
    if p.get('tags'):
        node['keywords'] = p['tags']
    if re.search(r'presentation-panel', body):
        node['about'] = {'@type': 'Thing', 'name': 'Presentation'}
    # the page's own headings, so an engine can cite the section it quotes
    node['hasPart'] = [
        {'@type': 'WebPageElement', 'name': html_mod.unescape(re.sub(r'<[^>]+>', '', t)),
         'url': canon + '#' + i}
        for i, t in re.findall(r'<h2[^>]*\sid="([^"]+)"[^>]*>(.*?)</h2>', body)[:25]
    ] or None
    node = {k: v for k, v in node.items() if v not in (None, [], '')}

    crumbs = [{'@type': 'ListItem', 'position': 1, 'name': 'Home',
               'item': ORIGIN + '/farshid/content/index.html'},
              {'@type': 'ListItem', 'position': 2, 'name': 'Atlas',
               'item': ORIGIN + '/farshid/content/atlas/'},
              {'@type': 'ListItem', 'position': 3, 'name': p['title'], 'item': canon}]
    graph = [PERSON_LD, WEBSITE_LD, node,
             {'@type': 'BreadcrumbList', '@id': canon + '#breadcrumb', 'itemListElement': crumbs}]
    text = json.dumps({'@context': 'https://schema.org', '@graph': graph},
                      ensure_ascii=False, indent=1)
    return text.replace('</', '<\\/')


def write_page(p, body, panel):
    canon = html_url(p)
    mdurl = ORIGIN + p['md']
    image = first_image(body)
    title_esc = html_mod.escape(p['title'])
    path = out_path(p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page = Template(HEAD).substitute(
        title=title_esc,
        desc=html_mod.escape(p['description'], quote=True),
        canon=canon,
        mdurl=mdurl,
        mdfile=os.path.basename(p['md']),
        image=html_mod.escape(image, quote=True),
        modified=p['modified'],
        panel=panel,
        body=body,
        title_esc=title_esc,
        ld=json_ld(p, canon, mdurl, image, body),
    )
    open(path, 'w', encoding='utf-8').write(page)
    return path, len(page)


def write_feed(pages):
    """RSS of the most recently updated pages — a stable, subscribeable signal for
    search engines, aggregators and answer-engine refreshers."""
    items = sorted(pages, key=lambda p: p['modified'], reverse=True)[:25]
    now = datetime.datetime.now(datetime.timezone.utc)
    build = now.strftime('%a, %d %b %Y %H:%M:%S +0000')
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
           '<channel>',
           f'<title>Dr. Farshid Pirahansiah — computer vision &amp; edge AI</title>',
           f'<link>{ORIGIN}/</link>',
           f'<description>New and updated pages on pirahansiah.com: computer vision, edge AI, '
           f'GPU and on-device model engineering, publications and notes.</description>',
           '<language>en</language>',
           f'<lastBuildDate>{build}</lastBuildDate>',
           f'<atom:link href="{ORIGIN}/feed.xml" rel="self" type="application/rss+xml"/>',
           f'<copyright>Dr. Farshid Pirahansiah — attribution required, see {LICENSE}</copyright>']
    for p in items:
        canon = html_url(p)
        try:
            dt = datetime.datetime.strptime(p['modified'], '%Y-%m-%d').replace(
                hour=9, tzinfo=datetime.timezone.utc)
            pub = dt.strftime('%a, %d %b %Y %H:%M:%S +0000')
        except ValueError:
            pub = build
        out += ['<item>',
                f'<title>{html_mod.escape(p["title"])}</title>',
                f'<link>{canon}</link>',
                f'<guid isPermaLink="true">{canon}</guid>',
                f'<pubDate>{pub}</pubDate>',
                f'<description>{html_mod.escape(p["description"])}</description>',
                f'<author>info@pirahansiah.com (Dr. Farshid Pirahansiah)</author>',
                f'<category>{html_mod.escape(p["section"])}</category>',
                '</item>']
    out += ['</channel>', '</rss>', '']
    open(os.path.join(SITE, 'feed.xml'), 'w', encoding='utf-8').write('\n'.join(out))
    return len(items)


def main():
    pages = gsp.build_pages() + gsp.build_projects()
    global TARGETS
    TARGETS = link_targets(pages)
    written, total, skipped = 0, 0, []
    for p in pages:
        path = out_path(p)
        # a project README.html that is gitignored would never deploy — leave it alone
        ignored = subprocess.run(['git', 'check-ignore', '-q', os.path.relpath(path, SITE)],
                                 cwd=SITE, capture_output=True, text=True).returncode == 0
        if ignored:
            skipped.append(p['slug'])
            continue
        meta, body_md = gsp.split_front_matter(open(p['path'], encoding='utf-8').read())
        p['tags'] = [t.strip() for t in re.findall(r'[A-Za-z0-9+#.-]+', meta.get('tags', '').strip('[]'))]
        p['created'] = date_created(os.path.relpath(p['path'], SITE))
        body, panel = render(p)
        _, size = write_page(p, body, panel)
        written += 1
        total += size
    n_feed = write_feed(pages)
    print(f'static pages: {written} written ({total/1024:.0f} KB), feed.xml with {n_feed} items'
          + (f', skipped (gitignored): {", ".join(skipped)}' if skipped else ''))


if __name__ == '__main__':
    main()
