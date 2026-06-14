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
      <a href="{{ '/' | relative_url }}" class="liquid-glass-item">Home</a>
    </div>
  </div>
  <p class="graph-hint">Concept Maps · Tap a node to select · tap again to deselect</p>
  <div id="graph-wrap" class="liquid-glass">
    <canvas id="graph-canvas" aria-label="Interactive knowledge graph"></canvas>
  </div>
  <div class="graph-bottom-bar">
    <div class="graph-legend">
      <span class="legend-moc">Section</span>
      <span class="legend-note">Note</span>
      <span class="legend-tag">Hashtag</span>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/graph-view.js' | relative_url }}" defer></script>
