#!/usr/bin/env python3
"""Regenerate atlas.md from the site's content/ directory, grouped by type.
Run: python3 gen_atlas.py  (writes atlas.md next to content/)"""
import html, os, re, subprocess
from urllib.parse import quote

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PAGE_DIRS = ['content', 'expert-coaching-resources']   # every page folder, indexed alike
CONTENT = os.path.join(ROOT, 'content')


def page_files():
    """(folder, filename) for each page file, stable order."""
    for d in PAGE_DIRS:
        full = os.path.join(ROOT, d)
        if not os.path.isdir(full):
            continue
        for f in sorted(os.listdir(full)):
            if f.endswith('.md'):
                yield d, f
PROJ = os.path.join(ROOT, 'projects')
PRODUCTS = os.path.join(ROOT, 'products')

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

def load():
    out=[]
    for d, f in page_files():
        slug=f[:-3]
        body=open(os.path.join(ROOT, d, f),encoding='utf-8').read()
        out.append((slug, title(slug,body), d + '/' + f))
    return out

entries = load()

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
for slug,t,rel in entries:
    sec, sub = group(slug)
    if sec is None: continue
    buckets.setdefault((sec,sub), []).append((f'/farshid/{rel}', t))

SECTIONS = ['Publications','Courses','Notes & Guides','Products','Talks, Presentations & Keynotes','Site Pages','Projects']

# Links point at the page files themselves: each page is one markdown file, which the
# browser app renders in place (and which a crawler or an LLM reads as the final text).
def content_url(rel):
    """The page's own file: the app renders it in place, a crawler reads it as text."""
    return f'/farshid/{rel}'

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
        if sec == 'Products':
            blocks = product_blocks()
            if blocks:
                groups.append(('Products', 'products', blocks))
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
            for item in items:
                url, t = item[0], item[1]
                meta = item[2] if len(item) > 2 else ''
                attrs = item[3] if len(item) > 3 else ''
                tail = f' <span class="atlas-count">{esc(meta)}</span>' if meta else ''
                L.append(f'    <li><a href="{url}"{attrs}>{esc(t)}</a>{tail}</li>')
            L.append('  </ul>')
        L.append('</section>')
        L.append('')
    L.append('<p class="atlas-note">Generated index — every page is one markdown file '
             'under <code>content/</code> or <code>expert-coaching-resources/</code>; the '
             'downloads are the files in <code>products/</code>.</p>')
    return '\n'.join(L)


def site_pages_items():
    return [
        ('/farshid/content/index.html', 'Home — about & overview'),
        ('/farshid/content/index.html#atlas', 'Atlas — this index'),
        ('/farshid/content/swarm.html', 'Search Swarm — one search for the whole knowledge base'),
        ('/farshid/content/qr.md', 'Scan & Share — all links + QR codes'),
        ('/farshid/content/contact.md', 'Contact'),
        ('/farshid/content/privacy.md', 'Privacy'),
    ]


def deck_items():
    return [(s, t) for s, t in [
        ('presentation-research-tools', 'The New Era of Research Tools'),
        ('presentation', 'Hermes Agent for Research Assistance'),
        ('presentation-cv', 'Hermes Agent for Big Computer Vision Projects'),
        ('presentation-updates', 'Hermes Agent — Recent Updates & Complete Feature Guide'),
        ('presentation-llm-optimization', 'New LLM Optimization Methods — Run Local & Fast'),
    ]]


def attr(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def human_size(n):
    if n >= 1024 * 1024: return f'{n / (1024 * 1024):.1f} MB'.replace('.0 MB', ' MB')
    return f'{max(1, round(n / 1024))} KB'


ABBR = {'3d': '3D', 'ai': 'AI', 'api': 'API', 'cli': 'CLI', 'coreml': 'CoreML', 'cpp': 'C++',
        'cuda': 'CUDA', 'cv': 'CV', 'dl': 'DL', 'gpu': 'GPU', 'ide': 'IDE', 'jit': 'JIT',
        'llm': 'LLMs', 'llms': 'LLMs', 'ml': 'ML', 'mlx': 'MLX', 'onnx': 'ONNX', 'openai': 'OpenAI',
        'pdf': 'PDF', 'pycuda': 'PyCUDA', 'rtx': 'RTX', 'seo': 'SEO', 'sql': 'SQL', 'vim': 'Vim',
        'vscode': 'VS Code'}


def pretty_name(f):
    stem = re.sub(r'\.[A-Za-z0-9]+$', '', f)
    words = []
    for w in stem.replace('_', '-').split('-'):
        if not w: continue
        words.append(ABBR.get(w.lower(), w.lower().capitalize()))
    return ' '.join(words)


# A download with no store listing keeps its filename; these are the ones worth naming.
NO_LISTING_TITLES = {
    'computer-vision-ai-engineers-guide.pdf': "Computer Vision & AI — A Practical Engineer's Guide",
    'etsy-listings.txt': 'Store listing copy (source text)',
    'local-llm-optimization-20260905.zip': 'Local LLM optimization — source archive (2026-09-05)',
    'optimize_local_llm.sh': 'optimize_local_llm.sh — local LLM tuning script',
    'OPTIMIZATION.md': 'OPTIMIZATION.md — local LLM optimization notes',
    'prompts.md': 'Prompt templates — source text',
}


def listing_entries():
    """The store copy this folder ships (etsy-listings.txt): TITLE / CATEGORY / DESCRIPTION."""
    out = []
    src = os.path.join(PRODUCTS, 'etsy-listings.txt')
    if not os.path.exists(src):
        return out
    raw = open(src, encoding='utf-8').read()
    for block in re.split(r'={20,}', raw):
        ti = re.search(r'^TITLE:\s*(.+)$', block, re.M)
        if not ti: continue
        ca = re.search(r'^CATEGORY:\s*(.+)$', block, re.M)
        de = re.search(r'^DESCRIPTION:\s*\n(.+)$', block, re.M)
        pg = re.search(r'PDF \((\d+) pages?\)', block)
        out.append({'title': ' '.join(ti.group(1).split()),
                    'cat': ' '.join(ca.group(1).split()) if ca else '',
                    'desc': ' '.join(de.group(1).split()) if de else '',
                    'pages': int(pg.group(1)) if pg else None})
    return out


def pdf_pages(path):
    try:
        out = subprocess.run(['pdfinfo', path], capture_output=True, text=True, timeout=20).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    m = re.search(r'^Pages:\s+(\d+)', out, re.M)
    return int(m.group(1)) if m else None


def product_blocks():
    """Every file in products/, grouped the way the store groups them.

    Titles come from the folder's own listing copy (etsy-listings.txt) matched to each PDF
    by filename tokens, with the page count as the tiebreak — 'computer-vision-ai-engineers-guide'
    and 'cv-coaching-roadmap' both answer to "Computer Vision", and only the page count
    (406 vs 4) tells them apart. A file with no listing keeps its filename, pretty-printed.
    PDF metadata is useless here: every one of them says "<slug>.html".
    """
    if not os.path.isdir(PRODUCTS):
        return []
    listings = listing_entries()
    files = sorted(f for f in os.listdir(PRODUCTS)
                   if os.path.isfile(os.path.join(PRODUCTS, f)) and not f.startswith('.'))
    info = {}
    for f in files:
        path = os.path.join(PRODUCTS, f)
        info[f] = {'path': path, 'pdf': f.lower().endswith('.pdf'),
                   'pages': pdf_pages(path) if f.lower().endswith('.pdf') else None,
                   'size': os.path.getsize(path)}

    # Score every (file, listing) pair, then take the best pairs first. Matching file by file
    # in name order lets a weak candidate steal a listing: 'computer-vision-ai-engineers-guide'
    # answers to "Computer Vision" from "Computer Vision Coaching Roadmap", and the roadmap then
    # has to take the optimization entry, displacing that one too.
    pairs = []
    for f in files:
        if not info[f]['pdf']: continue
        slug = re.sub(r'\.pdf$', '', f.lower()).split('-')
        for i, e in enumerate(listings):
            compact = re.sub(r'[^a-z0-9]', '', e['title'].lower())
            hits = sum(1 for s in slug if s in compact)
            if not hits: continue
            bonus = 5 if (e['pages'] is not None and e['pages'] == info[f]['pages']) else 0
            score = hits + bonus - 0.5 * (len(slug) - hits)
            if score > 0:
                pairs.append((score, hits, f, i))
    picked, taken_listing, taken_file = {}, set(), set()
    for score, hits, f, i in sorted(pairs, key=lambda x: (-x[0], -x[1], x[2])):
        if f in taken_file or i in taken_listing: continue
        picked[f] = listings[i]; taken_file.add(f); taken_listing.add(i)

    items = []          # (category, sort_title, url, title, meta, attrs, desc)
    for f in files:
        e = picked.get(f)
        url = '/farshid/products/' + quote(f)
        meta = ' · '.join([x for x in [f"{info[f]['pages']} pp" if info[f]['pages'] else '',
                                       human_size(info[f]['size'])] if x])
        attrs = ' target="_blank" rel="noopener"' if info[f]['pdf'] else ' download'
        if e:
            cat = e['cat'] or 'More downloads'
            items.append((cat, e['title'].lower(), url, e['title'], meta, attrs, e['desc']))
        else:
            title = NO_LISTING_TITLES.get(f) or pretty_name(f)
            items.append(('Books & guides' if info[f]['pdf'] else 'Source files', title.lower(), url,
                          title, meta, attrs,
                          f"The collected edition — every guide above in one PDF "
                          f"({info[f]['pages']} pages)." if info[f]['pdf'] else ''))

    cat_order = ['Books & guides', 'Computer Vision', 'CUDA & GPU', 'AI & LLMs', 'Optimization',
                 'Programming', 'Business', 'Research', 'More downloads', 'Source files']
    seen = [c for c in cat_order if any(i[0] == c for i in items)]
    seen += sorted({i[0] for i in items} - set(seen))
    blocks = []
    for cat in seen:
        rows = sorted([i for i in items if i[0] == cat], key=lambda i: i[1])
        blocks.append((cat, slugify(cat),
                       [(i[2], i[3], i[4], i[5] + (f' title="{attr(i[6])}"' if i[6] else ''))
                        for i in rows]))
    return blocks


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
            out.append((f'/farshid/projects/{d}/README.md', label + ' — ' + d if label != d else d))
    return out

HEADER = ('---\n'
          'layout: farshid_default\n'
          'title: "Atlas"\n'
          'permalink: /atlas/\n'
          'description: "The single index of everything on pirahansiah.com — every publication, '
          'course, note, talk and project on one page."\n'
          '---\n\n')

out = HEADER + render()
open(os.path.join(ROOT,'content','atlas.md'),'w',encoding='utf-8').write(out)
print('atlas.md written,', sum(len(v) for v in buckets.values()), 'content pages grouped by type')