---
layout: farshid_default
title: Hashtag Graph
permalink: /graph-tags/
extra_css: graph.css
---

<div class="graph-page" data-graph="/assets/graph-hashtags.json">
  <div class="graph-header">
    <h1>Hashtag Graph</h1>
    <span class="graph-stats" id="graph-stats">Loading…</span>
    <div class="graph-controls">
      <button type="button" id="graph-freeze" class="liquid-glass-item">Freeze</button>
      <button type="button" id="graph-reset" class="liquid-glass-item">Reset</button>
      <a href="{{ '/graph/' | relative_url }}" class="liquid-glass-item">Full Graph</a>
      <a href="{{ '/' | relative_url }}" class="liquid-glass-item">Home</a>
    </div>
  </div>
  <p class="graph-hint">Tags that appear together in the same file are connected</p>
  <div id="graph-wrap" class="liquid-glass">
    <canvas id="graph-canvas" aria-label="Interactive hashtag graph"></canvas>
  </div>
  <div class="graph-bottom-bar">
    <a id="graph-open-btn" class="liquid-glass-item graph-open-btn" href="#" style="display:none"></a>
    <div class="graph-legend">
      <span class="legend-note">File</span>
      <span class="legend-tag">Hashtag</span>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/graph-view.js' | relative_url }}" defer></script>
