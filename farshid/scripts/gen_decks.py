#!/usr/bin/env python3
"""Build standalone Reveal.js presentation pages from the deck .md sources."""
import re, os, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SLIDES_DIR = os.path.join(ROOT, 'notes', 'slides')

def build(deck_path):
    slug = os.path.splitext(os.path.basename(deck_path))[0] or 'deck'
    txt = open(deck_path, encoding='utf-8').read()

    # ---- title from the first markdown lead-in, else known lookup ----
    TITLES = {
        'research-tools': 'The New Era of Research Tools',
        'presentation': 'Hermes Agent for Research Assistance',
        'presentation-cv': 'Hermes Agent for Big Computer Vision Projects',
        'presentation-updates': 'Hermes Agent — Recent Updates & Complete Feature Guide',
        'llm-optimization': 'New LLM Optimization Methods — Run Local & Fast',
    }
    m = re.search(r'^\*\*(.+?)\*\*', txt)
    title = (m.group(1) if m else '').strip()
    if not title and slug in TITLES:
        title = TITLES[slug]
    if not title:
        title = slug.replace('-', ' ').title()
    if title.endswith(':'):
        title = title[:-1]

    # ---- split deck source: custom <style> (head) vs body markup ----
    style_m = re.search(r'<style>[\s\S]*?</style>', txt)
    custom_css = style_m.group(0) if style_m else ''
    body_m = re.search(r'<div class="presentation-panel">[\s\S]*</div>\s*</div>\s*</div>\s*$', txt)
    if not body_m:
        # fall back to everything after </style> (trim trailing <style> markers)
        body_m = re.search(r'<div class="presentation-panel">[\s\S]*$', txt)
    deck_body = body_m.group(0) if body_m else re.sub(r'^.*?</style>\s*', '', txt, flags=re.S)

    out = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#050b14">
<title>{title} — Slide Presentation · Dr. Farshid Pirahansiah</title>
<meta name="description" content="{title} — presentation deck by Dr. Farshid Pirahansiah (computer vision, edge AI, on-device LLMs).">
<link rel="icon" href="/farshid/assets/img/favicon.png">
<meta name="robots" content="index, follow">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2L49VVJP3B"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','G-2L49VVJP3B');</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/black.min.css">
{custom_css}
<style>
  html, body {{ background: #050b14 !important; overflow: hidden !important; margin:0 !important; }}
  body, .site-main {{ padding:0 !important; background:#050b14 !important; }}
  .presentation-panel {{ position:fixed; inset:0; width:100vw; height:100vh; background: radial-gradient(1200px 600px at 50% -10%, #0b1f3a 0%, #050b14 60%); overflow:hidden; }}
  .reveal, .reveal .slides {{ height:100%; width:100%; }}
</style>
</head>
<body>
<div id="topbar" style="position:fixed;top:0;left:0;right:0;z-index:998;display:flex;align-items:center;padding:12px 18px;color:#7d8aa0;font:600 13px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;pointer-events:none;">
  <a href="/farshid/" style="color:#7d8aa0;text-decoration:none;pointer-events:auto;opacity:.85" title="Home">Dr. Farshid Pirahansiah</a>
  <span style="margin:0 8px;opacity:.5">·</span>
  <a href="/farshid/index.html#atlas" style="color:#7d8aa0;text-decoration:none;pointer-events:auto;opacity:.85">Atlas</a>
</div>
{deck_body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.js"></script>
<script>
  function initReveal(){{
    var panel = document.querySelector('.presentation-panel');
    if (!panel || !window.Reveal) {{ setTimeout(initReveal, 120); return; }}
    var deck = new Reveal(panel, {{
      embedded: true, hash: true, center: true, touch: true,
      controls: true, progress: true, slideNumber: 'c/t',
      width: 1120, height: 760, margin: 0.06,
      minScale: 0.2, maxScale: 2.0
    }});
    deck.initialize();
    var rb = document.getElementById('restart-btn');
    if (rb) rb.addEventListener('click', function(e){{ e.stopPropagation(); deck.slide(0); }});
    panel.addEventListener('click', function(event){{
      if (event.target.closest('button, a, .controls, .progress, pre, code')) return;
      var rect = this.getBoundingClientRect();
      var x = event.clientX - rect.left;
      if (x < rect.width * 0.35) {{ deck.prev(); }} else if (x > rect.width * 0.65) {{ deck.next(); }}
    }});
  }}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initReveal);
  else initReveal();
</script>
</body>
</html>
""".format(title=title, custom_css=custom_css, deck_body=deck_body)

    out_path = os.path.join(SLIDES_DIR, slug + '.html')
    open(out_path, 'w', encoding='utf-8').write(out)
    return slug, title, out_path

if __name__ == '__main__':
    for f in sorted(glob.glob(os.path.join(SLIDES_DIR, '*.md'))):
        slug, title, p = build(f)
        print('built', os.path.relpath(p, ROOT), '|', title)