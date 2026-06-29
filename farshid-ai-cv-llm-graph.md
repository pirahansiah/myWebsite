---
layout: farshid_default
title: Knowledge Graph
permalink: /graph/
extra_css: graph.css
---

<div class="graph-page">
  <div class="graph-header">
    <h1>Knowledge Graph</h1>
    <a id="graph-open-btn" class="liquid-glass-item graph-open-btn" href="#" style="display:none"></a>
    <span class="graph-stats" id="graph-stats">Loading…</span>
    <div class="graph-controls">
      <button type="button" id="graph-freeze" class="liquid-glass-item">Freeze</button>
      <button type="button" id="graph-reset" class="liquid-glass-item">Reset</button>
      <a href="{{ '/graph-tags/' | relative_url }}" class="liquid-glass-item">Hashtags</a>
      <a href="{{ '/search/' | relative_url }}" class="liquid-glass-item">&#128269; Search</a>
      <a href="{{ '/' | relative_url }}" class="liquid-glass-item">Home</a>
    </div>
  </div>

  <div class="graph-tabs">
    <button class="graph-tab active" data-tab="all">All</button>
    <button class="graph-tab" data-tab="page"><span class="dot" style="background:#30d158"></span>Pages</button>
    <button class="graph-tab" data-tab="tag"><span class="dot" style="background:#af52de"></span>Tags</button>
    <button class="graph-tab" data-tab="hub"><span class="dot" style="background:#0a84ff"></span>Hub</button>
    <button class="graph-tab" data-tab="paper"><span class="dot" style="background:#5ac8fa"></span>Papers</button>
    <button class="graph-tab" data-tab="journal"><span class="dot" style="background:#64d2ff"></span>Journals</button>
    <button class="graph-tab" data-tab="book"><span class="dot" style="background:#ffd60a"></span>Books</button>
    <button class="graph-tab" data-tab="patent"><span class="dot" style="background:#ff375f"></span>Patents</button>
    <button class="graph-tab" data-tab="course"><span class="dot" style="background:#00c7be"></span>Courses</button>
  </div>

  <div class="graph-search-wrap">
    <div class="graph-search-box">
      <input type="text" id="graph-search-input" placeholder="Search to highlight nodes..." oninput="graphSearch(this.value)">
      <span class="graph-search-icon">&#128269;</span>
    </div>
    <span id="graph-search-results" class="graph-search-count"></span>
  </div>

  <p class="graph-hint">Scroll to zoom · Drag to pan · Tap node to select · Double-tap to open</p>
  <div id="graph-wrap" class="liquid-glass">
    <canvas id="graph-canvas" aria-label="Interactive knowledge graph"></canvas>
  </div>
  <div class="graph-bottom-bar">
    <div class="graph-legend">
      <span class="legend-hub">Hub</span>
      <span class="legend-cv">CV</span>
      <span class="legend-ai">AI/LLM</span>
      <span class="legend-cuda">CUDA/GPU</span>
      <span class="legend-paper">Papers</span>
      <span class="legend-journal">Journals</span>
      <span class="legend-book">Books</span>
      <span class="legend-patent">Patents</span>
      <span class="legend-keynote">Keynotes</span>
      <span class="legend-course">Courses</span>
      <span class="legend-pkm">PKM</span>
      <span class="legend-business">Business</span>
    </div>
  </div>
</div>

<style>
  .graph-search-wrap { max-width: 500px; margin: 8px auto; }
  .graph-search-box { position: relative; }
  .graph-search-box input {
    width: 100%; padding: 10px 36px 10px 14px; font-size: 14px;
    border: 1px solid var(--glass-border); border-radius: 10px;
    background: var(--glass-bg); color: var(--text); outline: none;
    box-sizing: border-box;
  }
  .graph-search-box input:focus { border-color: #0a84ff; }
  .graph-search-box input::placeholder { color: var(--text-muted); }
  .graph-search-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; pointer-events: none; }
  .graph-search-count {
    display: block;
    font-size: 0.75rem;
    color: #0a84ff;
    margin-top: 4px;
    text-align: center;
    min-height: 1em;
  }
</style>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>


<script src="{{ '/assets/js/graph-view.js' | relative_url }}" defer></script>
