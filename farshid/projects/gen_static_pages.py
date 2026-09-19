#!/usr/bin/env python3
"""Write the site's machine-readable indexes from the markdown sources.

Every page on pirahansiah.com is ONE file: a markdown file in farshid/content/.
The browser app (farshid/app.js + md.js) renders it client-side, and the same .md
file is what a crawler, an answer engine or a language model reads. There is no
build step and no generated HTML twin to keep in sync (the per-page HTML pages
were removed on the owner's request in Sep 2026 — see farshid/README.md).

What this script writes, all at the repository root:
  llms.txt        the LLM index: one line per page, grouped by section
  llms-full.txt   the same list plus the full text of every page in one file
  sitemap.xml     the same page list, for search engines
  farshid/permalinks.js   every page's front-matter permalink -> its app route,
                          which is what root 404.html resolves permanent links with

Run after adding or editing content:  python3 farshid/projects/gen_static_pages.py
"""
import os, re, sys, json, html, subprocess, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))          # .../myWebsite/farshid
SITE = os.path.abspath(os.path.join(ROOT, '..'))          # .../myWebsite
CONTENT = os.path.join(ROOT, 'content')
PROJECTS = os.path.join(ROOT, 'projects')
ORIGIN = 'https://pirahansiah.com'
SPA = ORIGIN + '/farshid/content/index.html'              # the interactive app entry
LLMS_SECTIONS = ['Site', 'Publications', 'Notes & Guides', 'Courses', 'Talks & Presentations', 'Projects']

# Hand-written pages that are not markdown (small apps, not content pages).
STANDALONE = [('/farshid/content/index.html', 'daily', '1.0'),
              ('/farshid/content/swarm.html', 'monthly', '0.5')]


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


def title_of(slug, body, meta=None):
    if meta and meta.get('title'):
        return ' '.join(meta['title'].split())
    m = re.search(r'^#\s+(.+)$', body, re.M)
    if not m:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S)
    if m:
        t = re.sub(r'<[^>]+>', '', m.group(1))
        t = re.sub(r'[*_`]', '', t)
        t = re.sub(r'[\U0001F000-\U0001FAFF\u2190-\u21FF\u2600-\u27BF\uFE0F]', ' ', t)  # body may keep emoji, metadata must not
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
    if slug.startswith(('books-', 'journals-', 'papers-', 'patents-', 'keynotes-')):
        return 'Publications'
    if slug == 'computer-vision':
        return 'Publications'
    if slug.startswith('course-'):
        return 'Courses'
    if slug.startswith('note-'):
        return 'Notes & Guides'
    if slug.startswith(('slides-', 'presentation')):
        return 'Talks & Presentations'
    if slug == 'research-tools':
        return 'Talks & Presentations'
    if slug in ('atlas', 'contact', 'privacy'):
        return 'Site'
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


def build_pages():
    """One entry per markdown page. The page URL is the markdown file itself."""
    pages = []
    for name in sorted(f for f in os.listdir(CONTENT) if f.endswith('.md')):
        slug = name[:-3]
        src = os.path.join(CONTENT, name)
        _meta, body = split_front_matter(open(src, encoding='utf-8').read())
        title = title_of(slug, body, _meta)
        description = truncate(first_paragraph(body, _meta)) or \
            f'{title} — Dr. Farshid Pirahansiah, computer vision and edge AI engineer.'
        pages.append({'slug': slug, 'route': slug, 'permalink': _meta.get('permalink', ''),
                      'title': title, 'description': description, 'path': src,
                      'url': f'{ORIGIN}/farshid/content/{slug}.md', 'md': f'/farshid/content/{slug}.md',
                      'section': section_of(slug),
                      'modified': date_modified(os.path.relpath(src, SITE))})
    return pages


def build_projects():
    """Each project README.md is a page too (its source of truth is on GitHub as well)."""
    out = []
    if not os.path.isdir(PROJECTS):
        return out
    for d in sorted(os.listdir(PROJECTS)):
        readme = os.path.join(PROJECTS, d, 'README.md')
        if not os.path.isfile(readme):
            continue
        meta, body = split_front_matter(open(readme, encoding='utf-8').read())
        title = title_of(d, body, meta)
        description = truncate(first_paragraph(body, meta)) or f'{title} — project by Dr. Farshid Pirahansiah.'
        out.append({'slug': 'project-' + d, 'route': f'projects/{d}/README',
                    'permalink': meta.get('permalink', ''),
                    'title': title, 'description': description, 'path': readme,
                    'url': f'{ORIGIN}/farshid/projects/{d}/README.md',
                    'md': f'/farshid/projects/{d}/README.md', 'section': 'Projects',
                    'modified': date_modified(os.path.relpath(readme, SITE))})
    return out


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
        'Every page is a markdown file: the links below go straight to it (markdown is the full, '
        'final text — there is no separate HTML edition). The browser app renders the same files at '
        f'{SPA}#content/<name>. Contact: info@pirahansiah.com · Full text of the whole site: /llms-full.txt',
        '',
    ]
    for sec in LLMS_SECTIONS:
        items = by.get(sec) or []
        if not items:
            continue
        lines += [f'## {sec}', '']
        lines += [f"- [{p['title']}]({p['url']}): {p['description']}" for p in items]
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
            _meta, raw = split_front_matter(open(p['path'], encoding='utf-8').read())
            raw = re.sub(r'<script\b.*?</script>', '', raw, flags=re.S | re.I)
            full += [f"## {p['title']}", f"URL: {p['url']}", '', raw.strip(), '', '---', '']
    open(os.path.join(SITE, 'llms-full.txt'), 'w', encoding='utf-8').write('\n'.join(full))


def write_permalinks(pages):
    """permalink -> page slug, for the URL router in 404.html."""
    rows = []
    for pg in pages:
        perm = (pg.get('permalink') or '').strip('/')
        if perm:
            rows.append((perm, pg.get('route') or pg['slug']))
    rows.sort()
    out = ['/* generated by gen_static_pages.py — page permalinks -> app route */',
           'window.PERMALINKS = {']
    out.append(',\n'.join('  %s: %s' % (json.dumps(k), json.dumps(v)) for k, v in rows))
    out.append('};')
    open(os.path.join(ROOT, 'permalinks.js'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    return len(rows)


def write_sitemap(pages):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<!-- One URL per page. Pages are markdown files; the browser app renders them. -->',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, freq, prio in STANDALONE:
        out.append(f'  <url><loc>{ORIGIN}{loc}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>')
    for p in sorted(pages, key=lambda x: x['slug']):
        out.append(f"  <url><loc>{p['url']}</loc><lastmod>{p['modified']}</lastmod>"
                   f"<changefreq>monthly</changefreq><priority>0.7</priority></url>")
    out += ['</urlset>', '']
    open(os.path.join(SITE, 'sitemap.xml'), 'w', encoding='utf-8').write('\n'.join(out))


def main():  # noqa: C901
    if not os.path.isdir(CONTENT):
        sys.exit('missing content dir: ' + CONTENT)
    pages = build_pages() + build_projects()
    write_llms(pages)
    write_sitemap(pages)
    n = write_permalinks(pages)
    print(f'indexes: {len(pages)} markdown pages '
          f'({sum(1 for p in pages if p["section"] == "Projects")} projects) '
          f'-> llms.txt, llms-full.txt, sitemap.xml, {n} permalinks')


if __name__ == '__main__':
    main()
