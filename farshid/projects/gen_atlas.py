#!/usr/bin/env python3
"""Regenerate atlas.md from the site's content/ directory, grouped by type.
Run: python3 gen_atlas.py  (writes atlas.md next to content/)"""
import html, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CONTENT = os.path.join(ROOT, 'content')
PROJ = os.path.join(ROOT, 'projects')

def clean_title(t):
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'[*_`~]', '', t)          # markdown emphasis must not leak into the index
    return ' '.join(html.unescape(t).split())


def title(slug, body):
    m = re.search(r'^#\s+(.+)$', body, re.M)
    if m: return clean_title(m.group(1))
    # fall back to heading inside markdown (for md-with-html like slides)
    m2 = re.search(r'<h1[^>]*>(.*?)</h1>', body)
    if m2: return clean_title(m2.group(1))
    return ' '.join(w.capitalize() for w in slug.replace('-',' ').split())

def load(folder):
    out=[]
    if not os.path.isdir(folder): return out
    for f in sorted(os.listdir(folder)):
        if not f.endswith('.md'): continue
        slug=f[:-3]
        body=open(os.path.join(folder,f),encoding='utf-8').read()
        out.append((slug, title(slug,body)))
    return out

entries = load(CONTENT)

def group(slug):
    if slug in ('qr','atlas','contact','privacy'): return None,None  # handled in Site Pages / Connect & Share
    if slug in ('research-tools','slides-token-optimization','keynotes-llm-cv'):
        return 'Talks, Presentations & Keynotes',None
    if slug.startswith('presentation-') or slug=='presentation':
        return 'Talks, Presentations & Keynotes',None
    if slug.startswith('books-'): return 'Publications','Book Chapters'
    if slug.startswith('journals-'): return 'Publications','Journal Articles'
    if slug.startswith('papers-'): return 'Publications','Conference Papers'
    if slug.startswith('patents-'): return 'Publications','Patents'
    if slug.startswith('keynotes-'): return 'Publications','Keynotes'
    if slug=='computer-vision': return 'Publications','Profile'
    if slug.startswith('course-'): return 'Courses',None
    if slug.startswith('note-'): return 'Notes & Guides',None
    if slug.startswith('slides-'): return 'Talks, Presentations & Keynotes',None
    return 'Notes & Guides',None

buckets = {}  # (section, subgroup) -> list
for slug,t in entries:
    sec, sub = group(slug)
    if sec is None: continue
    buckets.setdefault((sec,sub), []).append((slug,t))

SECTIONS = ['Publications','Courses','Notes & Guides','Talks, Presentations & Keynotes','Site Pages','Projects']

# Links inside atlas.md point at the canonical static pages (#content/<slug>), NOT raw .md paths:
# markdown is rendered client-side only, so a raw .md URL shows the source file when
# opened in a new tab, opened from a search result, or clicked from outside the app.
def content_url(slug):
    # Canonical static page: crawlers (and no-JS fetches) cannot follow hash routes.
    return f'/farshid/content/{slug}.html'

# publication subgroup order
PUBSUB = ['Book Chapters','Journal Articles','Conference Papers','Patents','Keynotes','Profile']

def slugify(s):
    s = re.sub(r'&[a-z]+;', '', s)
    s = re.sub(r'[^A-Za-z0-9\s-]', '', s).strip().lower()
    return re.sub(r'\s+', '-', s)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def render():
    # Body is emitted as HTML: the index is set in dense multi-column lists with its own
    # compact rhythm, which markdown lists cannot express. Section ids are spelled out
    # because the toc extension only ids markdown headings, and other pages deep-link here.
    L = ['# Atlas', '',
         'The single index of everything on pirahansiah.com — every publication, course, '
         'note, talk and project on one page.', '']

    # ---- collect the item groups first, so the jump bar can carry real counts
    groups = []          # (section, section_id, [(sub_label, sub_id, [(slug, title)])])
    for sec in SECTIONS:
        if sec == 'Site Pages':
            groups.append(('Site Pages', 'site-pages', [(None, None, site_pages_items())]))
            continue
        if sec == 'Projects':
            groups.append(('Projects', 'projects', [(None, None, project_items())]))
            continue
        subs = [s for (s_s, s) in buckets if s_s == sec]
        if sec == 'Publications':
            subs = [s for s in PUBSUB if (sec, s) in buckets]
        if not subs:
            continue
        blocks = []
        if sec == 'Talks, Presentations & Keynotes':
            blocks.append(('Presentations & Slide Decks', 'presentations-slide-decks', deck_items()))
        for sub in subs:
            items = sorted(buckets[(sec, sub)], key=lambda x: x[1].lower())
            blocks.append((sub, slugify(sub) if sub else None, items))
        groups.append((sec, slugify(sec), blocks))

    # ---- jump bar: one row, section name + count
    L.append('<nav class="atlas-jump" aria-label="Atlas sections">')
    for sec, sid, blocks in groups:
        n = sum(len(items) for _, _, items in blocks)
        L.append(f'  <a href="#{sid}">{esc(sec)} <span>{n}</span></a>')
    L.append('</nav>')
    L.append('')

    # ---- sections
    for sec, sid, blocks in groups:
        L.append(f'<section class="atlas-sec" id="{sid}">')
        L.append(f'  <h2>{esc(sec)}</h2>')
        for sub, subid, items in blocks:
            if sub:
                L.append(f'  <h3 class="atlas-sub" id="{subid}">{esc(sub)} <span class="atlas-count">{len(items)}</span></h3>')
            L.append('  <ul class="atlas-list">')
            for slug, t in items:
                L.append(f'    <li><a href="{entry_url(slug)}">{esc(t)}</a></li>')
            L.append('  </ul>')
        L.append('</section>')
        L.append('')
    L.append('<p class="atlas-note">Generated index — every page is a file under <code>content/</code>.</p>')
    return '\n'.join(L)


def entry_url(slug):
    """Canonical static page for a slug (raw .md would show source to crawlers)."""
    if slug.startswith('/'):        # already a site path (swarm.html, qrcode.html, index.html)
        return slug
    return f'/farshid/content/{slug}.html'


def site_pages_items():
    return [
        ('/farshid/content/index.html', 'Home — about & overview'),
        ('/farshid/content/atlas.html', 'Atlas — this index'),
        ('/farshid/content/swarm.html', 'Search Swarm — one search for the whole knowledge base'),
        ('/farshid/content/qrcode.html', 'Scan & Share — all links + QR codes'),
        ('/farshid/content/contact.html', 'Contact'),
        ('/farshid/content/privacy.html', 'Privacy'),
    ]


def deck_items():
    return [(s, t) for s, t in [
        ('presentation-research-tools', 'The New Era of Research Tools'),
        ('presentation', 'Hermes Agent for Research Assistance'),
        ('presentation-cv', 'Hermes Agent for Big Computer Vision Projects'),
        ('presentation-updates', 'Hermes Agent — Recent Updates & Complete Feature Guide'),
        ('presentation-llm-optimization', 'New LLM Optimization Methods — Run Local & Fast'),
    ]]


def project_items():
    out = []
    if os.path.isdir(PROJ):
        for d in sorted(os.listdir(PROJ)):
            p = os.path.join(PROJ, d)
            if not os.path.isdir(p):
                continue
            label = d
            rm = os.path.join(p, 'README.md')
            if os.path.exists(rm):
                rb = open(rm, encoding='utf-8').read()
                m = re.search(r'^#\s+(.+)$', rb, re.M)
                if m:
                    label = ' '.join(m.group(1).split())
            out.append((f'/farshid/projects/{d}/', label + ' — ' + d if label != d else d))
    return out

out=render()
open(os.path.join(ROOT,'content','atlas.md'),'w',encoding='utf-8').write(out)
print('atlas.md written,', sum(len(v) for v in buckets.values()), 'content pages grouped by type')