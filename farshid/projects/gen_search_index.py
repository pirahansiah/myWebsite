#!/usr/bin/env python3
"""Generate farshid/search-index.js from the page folders for client-side search.
Run: python3 farshid/projects/gen_search_index.py
Output: window.SEARCH_INDEX = [ {slug, title, text, tags, url}, ... ]

One entry per PAGE. Curated entries below (atlas, swarm, the deck titles) are merged into
the page they describe instead of being appended as a second row for the same page — the
index used to carry the QR page and every deck twice, so a search returned the same page
twice with different titles.

Text is plain prose: front matter, HTML tags and markdown syntax are removed before
indexing, because a page that renders with raw HTML (the QR hub) otherwise filled the
index with `class="qr-hero"` fragments.
"""
import os, re, json

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PAGE_DIRS = ['content', 'expert-coaching-resources']
CONTENT = os.path.join(ROOT, 'content')


def page_files():
    for d in PAGE_DIRS:
        full = os.path.join(ROOT, d)
        if not os.path.isdir(full):
            continue
        for f in sorted(os.listdir(full)):
            if f.endswith('.md'):
                yield d, f

def strip_front_matter(text):
    m = re.match(r'^---\s*\n.*?\n---\s*\n', text, re.S)
    return text[m.end():] if m else text

def front_matter_value(text, key):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', text, re.S)
    if not m:
        return ''
    v = re.search(r'^%s:\s*(.+)$' % key, m.group(1), re.M)
    return v.group(1).strip().strip('"\'') if v else ''

def plain(s):
    """HTML/entities -> words (used for titles and headings, which skip clean())."""
    s = re.sub(r'<[^>]+>', ' ', s)
    s = re.sub(r'&[a-zA-Z][a-zA-Z0-9]*;', ' ', s)   # named entities
    return ' '.join(s.split())

def clean(text):
    """markdown + HTML -> searchable words."""
    text = re.sub(r'```.*?```', ' ', text, flags=re.S)          # fenced code
    text = re.sub(r'(?is)<(script|style)\b.*?</\1>', ' ', text)  # page-local CSS
    text = re.sub(r'(?is)<!--.*?-->', ' ', text)
    text = re.sub(r'<[^>]+>', ' ', text)                         # every other tag
    text = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' ', text)            # images
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)         # links -> label
    text = re.sub(r'&[a-zA-Z][a-zA-Z0-9]*;', ' ', text)   # named entities
    text = re.sub(r'[#*_`>|]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


entries = {}          # slug -> entry, so a page can never appear twice
order = []
for folder, fn in page_files():
    slug = fn[:-3]
    raw = open(os.path.join(ROOT, folder, fn), encoding='utf-8').read()
    h1 = re.search(r'^#\s+(.+)$', raw, re.M) or re.search(r'(?is)<h1[^>]*>(.+?)</h1>', raw)
    title = front_matter_value(raw, 'title') or (' '.join(h1.group(1).split()) if h1 else '')
    title = plain(title) or slug
    heads = [plain(h) for h in re.findall(r'^#{2,3}\s+(.+)$', raw, re.M)]
    heads += [plain(h) for h in re.findall(r'(?is)<h[23][^>]*>(.+?)</h[23]>', raw)]
    tags = [h for h in heads if h][:6]
    # Index the headings first, then the prose: on a long page (the QR hub, the Atlas) a
    # plain head-of-file excerpt loses every card title, so "opencode" or "kraken" found
    # nothing even though the page lists them.
    text = ' '.join([title] + [h for h in heads if h]) + ' ' + clean(strip_front_matter(raw))
    entries[slug] = {
        'slug': slug,
        'title': title,
        'text': re.sub(r'\s+', ' ', text).strip()[:1800],
        'tags': tags,
        # the app route: '#content/<page>', and for a page in another folder its path
        'url': '/farshid/content/index.html#content/' + (slug if folder == 'content' else folder + '/' + slug),
    }
    order.append(slug)

# Curated titles/tags for pages whose own heading is a poor search label, plus the two
# standalone tools. Each one is merged into its page entry, never appended beside it.
CURATED = [
    {'slug': 'atlas', 'title': 'Atlas — index of everything',
     'tags': ['index', 'publications', 'courses', 'notes'], 'url': '/farshid/content/index.html#atlas'},
    # The hub lists ~28 destinations below the fold; keywords carry them so search finds
    # the page for a service name without indexing 400KB of card markup.
    {'slug': 'qr', 'title': 'QR Codes — Scan, Open, Copy',
     'tags': ['qr', 'links', 'social', 'referrals', 'referral', 'invite', 'crypto', 'address', 'tip jar',
              'opencode', 'trade republic', 'scalable capital', 'wise', 'etoro', 'kraken',
              'bitcoin', 'ethereum', 'solana', 'bnb', 'base'],
     'url': '/farshid/content/index.html#content/qr'},
    {'slug': 'presentation-research-tools', 'title': 'The New Era of Research Tools',
     'tags': ['presentation', 'research', 'agents']},
    {'slug': 'presentation', 'title': 'Hermes Agent for Research Assistance',
     'tags': ['presentation', 'hermes-agent', 'research', 'arxiv']},
    {'slug': 'presentation-cv', 'title': 'Hermes Agent for Big Computer Vision Projects',
     'tags': ['presentation', 'hermes-agent', 'computer-vision']},
    {'slug': 'presentation-updates', 'title': 'Hermes Agent — Recent Updates & Complete Feature Guide',
     'tags': ['presentation', 'hermes-agent', 'updates']},
    {'slug': 'presentation-llm-optimization', 'title': 'New LLM Optimization Methods — Run Local & Fast',
     'tags': ['presentation', 'llm', 'optimization', 'local']},
]
for c in CURATED:
    e = entries.get(c['slug'])
    if e:                                  # merge: curated labels, the page's own text
        e['title'] = c['title']
        e['tags'] = c['tags']
        if c.get('url'):
            e['url'] = c['url']
    else:
        entries[c['slug']] = {'slug': c['slug'], 'title': c['title'], 'text': ' '.join(c['tags']),
                              'tags': c['tags'], 'url': c.get('url', '/farshid/content/' + c['slug'] + '.md')}
        order.append(c['slug'])

entries['swarm-search'] = {
    'slug': 'swarm-search', 'title': 'Search Swarm — search the whole knowledge base',
    'text': 'search the entire knowledge base swarm search agents', 'tags': ['search', 'swarm'],
    'url': '/farshid/content/swarm.html',
}

rows = [entries[s] for s in order] + [entries['swarm-search']]
js = ('/* generated by farshid/projects/gen_search_index.py */\n'
      'window.SEARCH_INDEX=' + json.dumps(rows, ensure_ascii=False) + ';\n')
out = os.path.join(ROOT, 'search-index.js')  # engine files live at farshid/ root (assets/ removed)
open(out, 'w', encoding='utf-8').write(js)
print('wrote', out, len(rows), 'entries')
