#!/usr/bin/env python3
"""One-shot + repeatable: give every page its front matter.

Every page file carries the site's Jekyll-era header so the page has a stable
title, a permanent link and a description — the fields the PKM vault uses:

    ---
    layout: farshid_default
    title: "..."
    permalink: /notes/pubs/10-years/
    description: "..."
    ---

Values are taken, in order of authority:
  1. front matter the page already has (never overwritten)
  2. the matching note in the PKM vault (../PKM) — title / description / permalink
  3. the page itself — first heading, share-line blurb, first paragraph
  4. the legacy URL the page was exported from (its original permalink)

Run:  python3 farshid/projects/gen_front_matter.py [--check]
      --check  report what would change, write nothing
"""

import glob
import io
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))          # repo root
CONTENT = os.path.join(ROOT, 'farshid', 'content')
PROJECTS = os.path.join(ROOT, 'farshid', 'projects')
VAULT = os.path.normpath(os.path.join(ROOT, '..', 'PKM'))

LAYOUT = 'farshid_default'
CANON = ('layout', 'title', 'permalink', 'description', 'sitemap', 'noindex')

# site slug prefix -> vault folder it came from
PREFIX = [('papers-', 'pubs/papers/'), ('journals-', 'pubs/journals/'), ('books-', 'pubs/books/'),
          ('patents-', 'pubs/patents/'), ('keynotes-', 'pubs/keynotes/'), ('course-', 'courses/'),
          ('note-', 'docs/'), ('presentation-', 'slides/'), ('slides-', 'slides/')]

# slug -> vault note, where the names genuinely differ (checked by hand)
ALIAS = {
    'computer-vision':               'pubs/cv.md',
    'note-computer-vision-overview': 'docs/cv/index.md',
    'course-full-stack-dl':          'courses/fsdl.md',
    'course-full-stack-dl-2022':     'courses/fsdl-2022.md',
    'course-ml-specialization':      'courses/ml-spec.md',
    'course-parallel-computing':     'courses/parallel.md',
    'course-tensorflow-deploy':      'courses/tf-deploy.md',
    'journals-3d-slam-humanoid':     'pubs/journals/slam-humanoid.md',
    'note-3d-vision':                'docs/cv/3d.md',
    'note-coaching-roadmap':         'docs/coaching.md',
    'note-developer-tools':          'docs/dev-tools.md',
    'note-linkedin-2024':            'docs/linkedin.md',
    'note-llm-agents':               'docs/llm/agents.md',
    'note-llm-avatar':               'docs/llm/avatar.md',
    'note-llm-blog':                 'docs/llm/blog.md',
    'note-optimization-guide':       'docs/optimization/index.md',
    'note-prompt-templates':         'docs/prompts/index.md',
    'note-python-configuration':     'docs/python/index.md',
    'note-seo-for-llms':             'docs/seo/index.md',
    'note-startup-guide':            'docs/startup.md',
    'papers-license-plate-recognition': 'pubs/papers/license-plate.md',
}

# pages with no vault note: permanent link by hand
PERMALINK = {
    'atlas':        '/atlas/',
    'contact':      '/contact/',
    'privacy':      '/privacy/',
    'menus':        '/notes/sitemap/',
    'wiki':         '/notes/wiki/',
    'qr':           '/qr/',
    'presentation': '/notes/slides/presentation/',
    'slides-token-optimization': '/notes/slides/token-optimization/',
    'contact-index': '/contact/',
    'research-tools': '/notes/slides/',          # the talks hub was /notes/slides/
}

# offline / private pages: keep them out of the sitemap and out of search engines
NOINDEX = set()

SECTION_OF_PREFIX = {
    'papers-': 'notes/pubs/papers', 'journals-': 'notes/pubs/journals', 'books-': 'notes/pubs/books',
    'patents-': 'notes/pubs/patents', 'keynotes-': 'notes/pubs/keynotes', 'course-': 'notes/courses',
    'note-': 'notes/docs', 'presentation-': 'notes/slides', 'slides-': 'notes/slides',
}


def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def read(path):
    return io.open(path, encoding='utf-8', errors='ignore').read()


def front_matter(text):
    """Return (raw_block_lines, body) — block includes the --- fences."""
    if not text.startswith('---'):
        return None, text
    m = re.match(r'^---[ \t]*\n(.*?)\n---[ \t]*\n', text, re.S)
    if not m:
        return None, text
    return m.group(1).split('\n'), text[m.end():]


def pairs(lines):
    """key -> value for simple `key: value` lines (indented values are skipped)."""
    out = {}
    for line in lines:
        m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(.*)$', line)
        if m and m.group(2).strip():
            out[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return out


def unquote(v):
    v = (v or '').strip()
    if v.startswith('>-'):        # folded/literal block scalars
        v = v[2:].strip()
    return v.strip('"').strip("'").strip()


class Vault:
    def __init__(self, root):
        self.notes = {}
        self.by_base = {}
        self.by_title = {}
        for p in glob.glob(os.path.join(root, '**', '*.md'), recursive=True):
            if os.sep + '.git' + os.sep in p:
                continue
            rel = os.path.relpath(p, root).replace(os.sep, '/')
            text = read(p)
            lines, body = front_matter(text)
            fm = pairs(lines) if lines else {}
            self.notes[rel] = {'fm': fm, 'title': unquote(fm.get('title')),
                               'description': unquote(fm.get('description')),
                               'permalink': unquote(fm.get('permalink')),
                               'tags': fm.get('tags'), 'extra_css': fm.get('extra_css'),
                               'hashtags': fm.get('hashtags'), 'markmap': fm.get('markmap'),
                               'sitemap': fm.get('sitemap'), 'noindex': fm.get('noindex')}
            base = os.path.basename(p)[:-3]
            self.by_base.setdefault(base, []).append(rel)
            if self.notes[rel]['title']:
                self.by_title.setdefault(norm(self.notes[rel]['title']), []).append(rel)

    def find(self, slug, title=None):
        if slug in ALIAS and ALIAS[slug] in self.notes:
            return ALIAS[slug]
        key = slug
        for pre, folder in PREFIX:
            if slug.startswith(pre):
                key = slug[len(pre):]
                cand = folder + key + '.md'
                if cand in self.notes:
                    return cand
                break
        for name in (slug, key, norm(key)):
            if name in self.by_base and len(self.by_base[name]) == 1:
                return self.by_base[name][0]
        for nm in (title, key):
            if nm and norm(nm) in self.by_title and len(self.by_title[norm(nm)]) == 1:
                return self.by_title[norm(nm)][0]
        for rel in self.notes:                       # last resort: basename contains the key
            if norm(os.path.basename(rel)[:-3]) == norm(key):
                return rel
        return None


def legacy_url(body):
    """The URL the page was exported from (`> **Title** — blurb — https://…`)."""
    for m in re.finditer(r'https?://(?:www\.)?pirahansiah\.com(/[^\s)"]*)', body[:4000]):
        path = m.group(1).rstrip('/') + '/'
        if path.startswith('/notes/') and ' ' not in path and '_' not in path:
            return path
    return None


def heading(body):
    m = re.search(r'^#\s+(.+)$', body, re.M)
    return unquote(m.group(1)) if m else None


def share_blurb(body):
    """`> **Title** — blurb — URL` at the top of an exported page."""
    m = re.search(r'^>\s*\*\*(.+?)\*\*\s*(?:—|-)\s*(.+?)\s*(?:—|-)\s*https?://', body, re.M)
    return unquote(m.group(2)) if m else None


def first_paragraph(body):
    for block in re.split(r'\n\s*\n', body):
        b = block.strip()
        if not b or b.startswith(('#', '>', '<', '|', '-', '*', '!', '[', '---', '{{')):
            continue
        b = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', b)
        b = re.sub(r'[*_`]', '', b)
        if len(b) >= 12:
            return re.sub(r'\s+', ' ', b)[:200]
    return None


def permalink_for(slug, own_, body, project=False):
    if own_.get('permalink'):
        return own_['permalink']
    if project:
        return f'/projects/{slug}/'
    if slug in PERMALINK:
        return PERMALINK[slug]
    legacy = legacy_url(body)
    if legacy:
        return legacy
    folder = 'notes'
    name = slug
    for pre, sec in SECTION_OF_PREFIX.items():
        if slug.startswith(pre):
            folder, name = sec, slug[len(pre):]
            break
    return f'/{folder}/{name}/'


def clean(s):
    s = re.sub(r'[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F]', '', s or '')
    s = re.sub(r'\*\*|__|`', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def yaml_str(s):
    return '"' + re.sub(r'(?<!\\)"', r'\\"', clean(s)) + '"'


def build_block(slug, path, vault, project=False):
    text = read(path)
    lines, body = front_matter(text)
    own_ = pairs(lines) if lines else {}
    note = vault.notes.get(vault.find(slug, own_.get('title')) or '', {})

    title = (unquote(own_.get('title')) or note.get('title') or heading(body)
             or slug.replace('-', ' ').title())
    description = unquote(own_.get('description')) or note.get('description') or share_blurb(body) or first_paragraph(body) or ''
    permalink = permalink_for(slug, own_, body, project)

    kept = []
    if lines:
        drop = set(CANON)
        for line in lines:
            m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*):', line)
            if m and m.group(1) in drop:
                continue
            kept.append(line)
        # a dropped key may own indented continuation lines
        out, skip_indent = [], False
        for line in lines:
            m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*):', line)
            if m:
                skip_indent = m.group(1) in CANON
                if not skip_indent:
                    out.append(line)
            elif skip_indent and (line.startswith((' ', '\t')) or not line.strip()):
                continue                      # continuation of a dropped key
            else:
                skip_indent = False
                out.append(line)
        kept = [l for l in out if l.strip()]

    block = [f'layout: {LAYOUT}', f'title: {yaml_str(title)}', f'permalink: {permalink}',
             f'description: {yaml_str(description)}']
    if slug in NOINDEX:
        block.append('sitemap: false')
        block.append('noindex: true')
    block += kept
    return block, body, (title, permalink, description)


def write_page(path, block, body):
    io.open(path, 'w', encoding='utf-8').write('---\n' + '\n'.join(block) + '\n---\n\n' + body.lstrip('\n'))


def write_aliases(pairs, valid):
    """Legacy /notes/<dir>/<name>/ URLs (what the page bodies link to, and what the PKM
    vault called every note) -> the page that now serves that content."""
    alias = {}
    for slug, rel in pairs:
        if not rel:
            continue
        stem = rel[:-3]                                    # docs/cuda/numba
        if os.path.basename(stem) == 'index':
            continue                                       # section index: no site page to point at
        alias['notes/' + stem] = slug
        alias.setdefault(stem, slug)                       # the vault's own path, too
    lines = ['/* generated by gen_front_matter.py — legacy /notes/... URLs -> page routes. */',
             '(function(){ var P = window.PERMALINKS = window.PERMALINKS || {};',
             '  var A = {']
    items = sorted((k, v) for k, v in alias.items() if v)
    lines.append(',\n'.join(f'    {k!r}: {v!r}' for k, v in items).replace("'", '"'))
    lines += ['  };', '  for (var k in A) if (!(k in P)) P[k] = A[k];', '})();']
    out = os.path.join(ROOT, 'farshid', 'page-aliases.js')
    io.open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    return len(items)


def main():
    check = '--check' in sys.argv
    vault = Vault(VAULT)
    if not vault.notes:
        print(f'no vault notes found at {VAULT}')
        return 1

    pairs = []
    pages = sorted(glob.glob(os.path.join(CONTENT, '*.md')))
    pages += sorted(glob.glob(os.path.join(PROJECTS, '*', 'README.md')))
    changed = 0
    for path in pages:
        slug = os.path.basename(os.path.dirname(path)) if path.endswith('README.md') else os.path.basename(path)[:-3]
        is_project = path.endswith('README.md')
        block, body, (title, permalink, description) = build_block(slug, path, vault, is_project)
        pairs.append((slug, None if is_project else vault.find(slug, title)))
        old = front_matter(read(path))[0]
        if old == block:
            continue
        changed += 1
        note = vault.notes.get(vault.find(slug), {})
        src = 'vault' if note else 'page'
        print(f'{"would write" if check else "written  "} {slug:34s} {permalink:42s} [{src}] {title[:44]}')
        if not check:
            write_page(path, block, body)
    valid = {s for s, _ in pairs}
    n = write_aliases([(s, r) for s, r in pairs if r], valid)
    if check:
        print(f'\n{changed} page(s) to update of {len(pages)}; {n} legacy aliases')
    else:
        print(f'\n{changed} page(s) updated of {len(pages)}; {n} legacy aliases -> farshid/page-aliases.js')
    return 0


if __name__ == '__main__':
    sys.exit(main())
