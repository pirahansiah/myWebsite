#!/usr/bin/env python3
"""Regenerate atlas.md from the site's content/ directory, grouped by type.
Run: python3 gen_atlas.py  (writes atlas.md next to content/)"""
import os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
CONTENT = os.path.join(ROOT, 'content')
PROJ = os.path.join(ROOT, 'projects')

def title(slug, body):
    m = re.search(r'^#\s+(.+)$', body, re.M)
    if m: return ' '.join(m.group(1).split())
    # fall back to heading inside markdown (for md-with-html like slides)
    m2 = re.search(r'<h1[^>]*>(.*?)</h1>', body)
    if m2: return ' '.join(re.sub('<[^>]+>','',m2.group(1)).split())
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
    if slug=='qr': return 'Connect & Share',None
    if slug in ('research-tools','slides-token-optimization','keynotes-llm-cv'):
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
    buckets.setdefault((sec,sub), []).append((slug,t))

SECTIONS = ['Publications','Courses','Notes & Guides','Talks, Presentations & Keynotes','Site Pages','Connect & Share','Projects']

# publication subgroup order
PUBSUB = ['Book Chapters','Journal Articles','Conference Papers','Patents','Keynotes','Profile']

def render():
    L=['# Atlas','','The single index of everything on pirahansiah.com. Every publication, course, note, talk, and project lives here. Pick a section.','']
    for sec in SECTIONS:
        if sec=='Site Pages':
            L.append('## Site Pages'); L.append('')
            L.append('- [**🏠 Home — about &amp; overview**](/farshid/)')
            L.append('- [**🕸️ Search Swarm — one search for the whole knowledge base**](/farshid/swarm/)')
            L.append('- [**🔗 Scan &amp; Share — all links + QR codes**](/farshid/qr/)')
            L.append('- [**🗂️ Atlas — this index**](/farshid/atlas.md)')
            L.append('- [**Talk: Reducing Token Usage in AI-Assisted Development**](/farshid/content/slides-token-optimization.md)')
            L.append('- [**Keynote: LLMs Meet Computer Vision**](/farshid/content/keynotes-llm-cv.md)')
            L.append('- [**Research Tools — talks &amp; keynotes hub**](/farshid/notes/slides/research-tools/)')
            L.append('- [Contact](/farshid/contact.md)')
            L.append('- [Privacy](/farshid/privacy.md)')
            L.append('')
            continue
        if sec=='Connect & Share':
            items=sorted(buckets.get(('Connect & Share',None),[]), key=lambda x:x[1].lower())
            L.append('## Connect & Share'); L.append('')
            L.append('- [**🕸️ Search Swarm — one search for the whole knowledge base**](/farshid/swarm/)')
            L.append('- [**🔗 Scan &amp; Share — all links + QR codes**](/farshid/qr/)')
            L.append('')
            rest = [x for x in items if x[0]!='qr']
            for slug,t in rest:
                L.append(f'- [{t}](/farshid/content/{slug}.md)')
            L.append('')
            continue
        if sec=='Projects':
            L.append('## Projects'); L.append('')
            L.append('Source code and scripts live under `projects/`. Each project has its own folder with its own README.')
            L.append('')
            if os.path.isdir(PROJ):
                for d in sorted(os.listdir(PROJ)):
                    p=os.path.join(PROJ,d)
                    if os.path.isdir(p):
                        rm=os.path.join(p,'README.md')
                        label=d
                        if os.path.exists(rm):
                            rb=open(rm,encoding='utf-8').read()
                            m=re.search(r'^#\s+(.+)$',rb,re.M)
                            if m: label=' '.join(m.group(1).split())
                        L.append(f'- [{label}](/farshid/projects/{d}/README.md)')
            L.append(''); continue
        # collect subgroups for this section
        subs=[s for (s_s,s) in buckets if s_s==sec]
        if sec=='Publications':
            subs=[s for s in PUBSUB if (sec,s) in buckets]
        if not subs: continue
        L.append(f'## {sec}'); L.append('')
        if sec=='Talks, Presentations & Keynotes':
            L.append('### Presentations &amp; Slide Decks'); L.append('')
            L.append('- [**The New Era of Research Tools**](/farshid/notes/slides/research-tools.html)')
            L.append('- [**Hermes Agent for Research Assistance**](/farshid/notes/slides/presentation.html)')
            L.append('- [**Hermes Agent for Big Computer Vision Projects**](/farshid/notes/slides/presentation-cv.html)')
            L.append('- [**Hermes Agent — Recent Updates &amp; Complete Feature Guide**](/farshid/notes/slides/presentation-updates.html)')
            L.append('- [**New LLM Optimization Methods — Run Local &amp; Fast**](/farshid/notes/slides/llm-optimization.html)')
            L.append('')
        for sub in subs:
            items=sorted(buckets[(sec,sub)], key=lambda x:x[1].lower())
            if sub:
                L.append(f'### {sub}'); L.append('')
            for slug,t in items:
                if slug=='research-tools':
                    L.append('- [**Research Tools — talks &amp; keynotes hub**](/farshid/notes/slides/research-tools/)')
                else:
                    L.append(f'- [{t}](/farshid/content/{slug}.md)')
            L.append('')
    L.append('---'); L.append('')
    L.append('*Generated index — every page is a plain Markdown file under `content/`.*')
    return '\n'.join(L)

out=render()
open(os.path.join(ROOT,'atlas.md'),'w',encoding='utf-8').write(out)
print('atlas.md written,', sum(len(v) for v in buckets.values()), 'content pages grouped by type')