/**
 * Knowledge Graph v2 — Interactive force-directed graph with:
 * - Zoom/pan (mouse wheel + drag)
 * - Category filtering
 * - Hover tooltips
 * - Click to open
 * - Search highlighting
 * - Mini-map
 * - Mobile touch support
 */
(function () {
  "use strict";

  var canvas = document.getElementById("graph-canvas");
  var wrap = document.getElementById("graph-wrap");
  if (!canvas || !wrap) return;

  var ctx = canvas.getContext("2d");
  var nodes = [], links = [], simNodes = [];
  var dragging = null, hovered = null, selected = null;
  var panX = 0, panY = 0, zoom = 1;
  var lastPanX = 0, lastPanY = 0, lastZoom = 1;
  var isPanning = false, panStartX = 0, panStartY = 0;
  var mouseDownX = 0, mouseDownY = 0;
  var frozen = false;
  var highlightedNodes = new Set();
  var activeCategories = new Set();
  var tooltip = null;
  var animFrame = null;

  var STORAGE_KEY = "graph_v2_" + (wrap.dataset.graph || "default");
  var openBtn = document.getElementById("graph-open-btn");

  var CATEGORY_COLORS = {
    hub: "#0a84ff",
    cv: "#30d158",
    ai: "#bf5af2",
    cuda: "#ff9f0a",
    paper: "#5ac8fa",
    journal: "#64d2ff",
    book: "#ffd60a",
    patent: "#ff375f",
    keynote: "#ff6482",
    course: "#00c7be",
    pkm: "#ac8e68",
    business: "#8e8e93"
  };

  var isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var colors = {
    text: isDark ? "#f5f5f7" : "#1d1d1f",
    textMuted: isDark ? "rgba(245,245,247,0.4)" : "rgba(29,29,31,0.4)",
    link: isDark ? "rgba(180,180,190,0.12)" : "rgba(120,120,128,0.15)",
    linkHL: "#0a84ff",
    dim: isDark ? "rgba(180,180,190,0.05)" : "rgba(120,120,128,0.06)",
    highlight: "#0a84ff",
    selected: "#ff9500",
    bg: isDark ? "#000" : "#fff"
  };

  function showOpenButton(node) {
    if (!openBtn || !node) { hideOpenButton(); return; }
    var url = node.url || null;
    if (!url) { hideOpenButton(); return; }
    openBtn.innerHTML = node.label + " → Open";
    openBtn.href = url;
    openBtn.style.display = "inline-flex";
  }

  function hideOpenButton() {
    if (openBtn) openBtn.style.display = "none";
  }

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loadPositions() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  }

  function savePositions() {
    var pos = {};
    for (var i = 0; i < simNodes.length; i++) {
      pos[simNodes[i].id] = { x: simNodes[i].x, y: simNodes[i].y };
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch (e) {}
  }

  function countConnections(idx) {
    var c = 0;
    for (var i = 0; i < links.length; i++) {
      if (links[i].source === idx || links[i].target === idx) c++;
    }
    return c;
  }

  function getConnected(node) {
    var result = {};
    if (!node) return result;
    var idx = simNodes.indexOf(node);
    for (var i = 0; i < links.length; i++) {
      if (links[i].source === idx) result[links[i].target] = true;
      if (links[i].target === idx) result[links[i].source] = true;
    }
    return result;
  }

  function initSimulation(data) {
    nodes = data.nodes || [];
    links = data.links || [];
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    var saved = loadPositions();
    var idxMap = {};

    simNodes = nodes.map(function (n, i) {
      idxMap[n.id] = i;
      var sx = saved[n.id];
      var baseR = (n.size || 1) * 3 + 4;
      if (sx && sx.x && sx.y) {
        return { id: n.id, label: n.label, url: n.url, category: n.category || "note", x: sx.x, y: sx.y, vx: 0, vy: 0, r: baseR, connections: 0, baseR: baseR };
      }
      var angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      var radius = Math.min(w, h) * 0.30;
      return { id: n.id, label: n.label, url: n.url, category: n.category || "note", x: w / 2 + Math.cos(angle) * radius, y: h / 2 + Math.sin(angle) * radius, vx: 0, vy: 0, r: baseR, connections: 0, baseR: baseR };
    });

    for (var i = 0; i < simNodes.length; i++) {
      simNodes[i].connections = countConnections(i);
      simNodes[i].r = simNodes[i].baseR + Math.min(simNodes[i].connections * 0.5, 6);
    }

    var resolved = [];
    for (var i = 0; i < links.length; i++) {
      var s = idxMap[links[i].source];
      var t = idxMap[links[i].target];
      if (s !== undefined && t !== undefined) {
        resolved.push({ source: s, target: t, strength: links[i].strength || 0.5 });
      }
    }
    links = resolved;

    activeCategories = new Set(Object.keys(CATEGORY_COLORS));
    updateFilterButtons();
  }

  function tick() {
    if (frozen) return;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    var cx = w / 2 + panX;
    var cy = h / 2 + panY;

    for (var i = 0; i < simNodes.length; i++) {
      if (simNodes[i] === dragging) continue;
      simNodes[i].vx += (cx - simNodes[i].x) * 0.0005;
      simNodes[i].vy += (cy - simNodes[i].y) * 0.0005;
    }

    for (var i = 0; i < simNodes.length; i++) {
      for (var j = i + 1; j < simNodes.length; j++) {
        var dx = simNodes[i].x - simNodes[j].x;
        var dy = simNodes[i].y - simNodes[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var force = 400 / (dist * dist);
        simNodes[i].vx += (dx / dist) * force;
        simNodes[i].vy += (dy / dist) * force;
        simNodes[j].vx -= (dx / dist) * force;
        simNodes[j].vy -= (dy / dist) * force;
      }
    }

    for (var i = 0; i < links.length; i++) {
      var a = simNodes[links[i].source];
      var b = simNodes[links[i].target];
      if (!a || !b) continue;
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var targetDist = 80 + (1 - links[i].strength) * 60;
      var force = (dist - targetDist) * 0.015 * links[i].strength;
      a.vx += (dx / dist) * force;
      a.vy += (dy / dist) * force;
      b.vx -= (dx / dist) * force;
      b.vy -= (dy / dist) * force;
    }

    for (var i = 0; i < simNodes.length; i++) {
      if (dragging === simNodes[i]) continue;
      simNodes[i].vx *= 0.85;
      simNodes[i].vy *= 0.85;
      simNodes[i].x += simNodes[i].vx;
      simNodes[i].y += simNodes[i].vy;
    }
  }

  function isNodeVisible(n) {
    return activeCategories.has(n.category);
  }

  function draw() {
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2 + panX, -w / 2 + panY);

    var activeNode = selected || hovered;
    var connectedTo = getConnected(activeNode);

    for (var i = 0; i < links.length; i++) {
      var a = simNodes[links[i].source];
      var b = simNodes[links[i].target];
      if (!a || !b) continue;
      if (!isNodeVisible(a) || !isNodeVisible(b)) continue;
      var isHL = activeNode && (a === activeNode || b === activeNode);
      var isDim = activeNode && !isHL;
      var isHighlighed = highlightedNodes.size > 0 && (highlightedNodes.has(i) || highlightedNodes.has(links[i].source) || highlightedNodes.has(links[i].target));

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      if (isHighlighed) {
        ctx.strokeStyle = colors.highlight;
        ctx.lineWidth = 2;
      } else if (isHL) {
        ctx.strokeStyle = colors.linkHL;
        ctx.lineWidth = 2;
      } else if (isDim) {
        ctx.strokeStyle = colors.dim;
        ctx.lineWidth = 0.3;
      } else {
        ctx.strokeStyle = colors.link;
        ctx.lineWidth = 0.6;
      }
      ctx.stroke();
    }

    for (var i = 0; i < simNodes.length; i++) {
      var n = simNodes[i];
      if (!isNodeVisible(n)) continue;

      var isSel = selected === n;
      var isHov = hovered === n;
      var isConn = activeNode && connectedTo[i];
      var isDim = activeNode && !isSel && !isHov && !isConn;
      var isHighlighted = highlightedNodes.has(i);
      var fill = CATEGORY_COLORS[n.category] || "#8e8e93";
      if (isSel) fill = colors.selected;
      var alpha = isDim ? 0.12 : isSel || isHov ? 1 : 0.85;
      var nodeR = isSel ? n.r + 3 : isHov ? n.r + 2 : isHighlighted ? n.r + 2 : n.r;

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = isSel ? colors.selected : isHov ? colors.highlight : "rgba(255,255,255,0.4)";
      ctx.lineWidth = isSel ? 2.5 : isHov ? 2 : 0.5;
      ctx.stroke();

      if (isSel || isHov || isConn || isHighlighted) {
        ctx.fillStyle = colors.text;
        ctx.font = (isSel || isHov ? "700" : "600") + " 11px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y + nodeR + 12);
      } else if (!activeNode) {
        var maxLen = zoom < 0.4 ? 0 : zoom < 0.7 ? 3 : zoom < 1.0 ? 8 : zoom < 1.5 ? 15 : 999;
        if (maxLen > 0 && n.label.length > 0) {
          var displayLabel = n.label.length > maxLen ? n.label.substring(0, maxLen - 1) + "…" : n.label;
          var fontSize = zoom < 0.7 ? 7 : zoom < 1.0 ? 8 : 9;
          ctx.fillStyle = colors.textMuted;
          ctx.globalAlpha = zoom < 0.7 ? 0.35 : 0.5;
          ctx.font = "500 " + fontSize + "px system-ui";
          ctx.textAlign = "center";
          ctx.fillText(displayLabel, n.x, n.y + nodeR + 10);
        }
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    drawMinimap();
  }

  function drawMinimap() {
    var mw = 120, mh = 80;
    var mx = wrap.clientWidth - mw - 10;
    var my = wrap.clientHeight - mh - 10;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = isDark ? "rgba(30,30,30,0.8)" : "rgba(240,240,240,0.8)";
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 6);
    ctx.fill();
    ctx.stroke();

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < simNodes.length; i++) {
      if (!isNodeVisible(simNodes[i])) continue;
      if (simNodes[i].x < minX) minX = simNodes[i].x;
      if (simNodes[i].x > maxX) maxX = simNodes[i].x;
      if (simNodes[i].y < minY) minY = simNodes[i].y;
      if (simNodes[i].y > maxY) maxY = simNodes[i].y;
    }
    if (minX === maxX) { minX -= 50; maxX += 50; }
    if (minY === maxY) { minY -= 50; maxY += 50; }
    var padX = (maxX - minX) * 0.1;
    var padY = (maxY - minY) * 0.1;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;

    for (var i = 0; i < simNodes.length; i++) {
      var n = simNodes[i];
      if (!isNodeVisible(n)) continue;
      var nx = mx + ((n.x - minX) / (maxX - minX)) * mw;
      var ny = my + ((n.y - minY) / (maxY - minY)) * mh;
      ctx.beginPath();
      ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = CATEGORY_COLORS[n.category] || "#8e8e93";
      ctx.fill();
    }

    var vw = wrap.clientWidth / zoom;
    var vh = wrap.clientHeight / zoom;
    var vcx = wrap.clientWidth / 2 - panX;
    var vcy = wrap.clientHeight / 2 - panY;
    var vx = mx + ((vcx - vw / 2 - minX) / (maxX - minX)) * mw;
    var vy = my + ((vcy - vh / 2 - minY) / (maxY - minY)) * mh;
    var vww = (vw / (maxX - minX)) * mw;
    var vhh = (vh / (maxY - minY)) * mh;
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx, vy, vww, vhh);

    ctx.restore();
  }

  function loop() {
    tick();
    draw();
    animFrame = requestAnimationFrame(loop);
  }

  function screenPos(e) {
    var rect = canvas.getBoundingClientRect();
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    var cx = (e.clientX - rect.left - w / 2) / zoom + w / 2 - panX;
    var cy = (e.clientY - rect.top - h / 2) / zoom + h / 2 - panY;
    return { x: cx, y: cy };
  }

  function hitTest(pos) {
    for (var i = simNodes.length - 1; i >= 0; i--) {
      var n = simNodes[i];
      if (!isNodeVisible(n)) continue;
      var dx = pos.x - n.x;
      var dy = pos.y - n.y;
      if (dx * dx + dy * dy <= (n.r + 8) * (n.r + 8)) return n;
    }
    return null;
  }

  function selectNode(node) {
    if (selected === node) {
      selected = null;
      hideOpenButton();
    } else {
      selected = node;
      showOpenButton(node);
    }
  }

  function showTooltip(node, x, y) {
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "graph-tooltip";
      wrap.appendChild(tooltip);
    }
    tooltip.innerHTML = '<div class="gt-title">' + node.label + '</div><div class="gt-cat">' + (node.category || "") + '</div><div class="gt-hint">Tap to select · Double-tap to open</div>';
    tooltip.style.left = x + "px";
    tooltip.style.top = (y - 60) + "px";
    tooltip.style.display = "block";
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = "none";
  }

  canvas.addEventListener("mousedown", function (e) {
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    var pos = screenPos(e);
    var hit = hitTest(pos);
    if (hit) {
      dragging = hit;
      hit.vx = hit.vy = 0;
      frozen = true;
      canvas.style.cursor = "grabbing";
    } else {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      lastPanX = panX;
      lastPanY = panY;
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (dragging) {
      var pos = screenPos(e);
      dragging.x = pos.x;
      dragging.y = pos.y;
      dragging.vx = dragging.vy = 0;
      return;
    }
    if (isPanning) {
      var dx = (e.clientX - panStartX) / zoom;
      var dy = (e.clientY - panStartY) / zoom;
      panX = lastPanX + dx;
      panY = lastPanY + dy;
      return;
    }
    var pos = screenPos(e);
    var hit = hitTest(pos);
    if (hit !== hovered) {
      hovered = hit;
      canvas.style.cursor = hit ? "pointer" : "grab";
      if (hit) {
        var rect = canvas.getBoundingClientRect();
        showTooltip(hit, e.clientX - rect.left, e.clientY - rect.top);
      } else {
        hideTooltip();
      }
    }
  });

  window.addEventListener("mouseup", function (e) {
    var movedX = Math.abs(e.clientX - mouseDownX);
    var movedY = Math.abs(e.clientY - mouseDownY);
    var didDrag = movedX > 5 || movedY > 5;

    if (dragging) {
      if (didDrag) {
        savePositions();
      } else {
        selectNode(dragging);
      }
      dragging = null;
    } else if (isPanning && !didDrag) {
      var pos = screenPos(e);
      var hit = hitTest(pos);
      if (hit) {
        selectNode(hit);
      } else {
        selected = null;
        hideOpenButton();
      }
    }

    isPanning = false;
    frozen = false;
    canvas.style.cursor = hovered ? "pointer" : "grab";
  });

  canvas.addEventListener("dblclick", function (e) {
    var pos = screenPos(e);
    var hit = hitTest(pos);
    if (hit && hit.url) {
      window.location.href = hit.url;
    }
  });

  canvas.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    mouseDownX = touch.clientX;
    mouseDownY = touch.clientY;
    var rect = canvas.getBoundingClientRect();
    var pos = screenPos(touch);
    var hit = hitTest(pos);
    if (hit) {
      dragging = hit;
      hit.vx = hit.vy = 0;
      frozen = true;
    } else {
      isPanning = true;
      panStartX = touch.clientX;
      panStartY = touch.clientY;
      lastPanX = panX;
      lastPanY = panY;
      lastZoom = zoom;
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener("touchmove", function (e) {
    if (e.touches.length !== 1) return;
    var touch = e.touches[0];
    e.preventDefault();
    if (dragging) {
      var pos = screenPos(touch);
      dragging.x = pos.x;
      dragging.y = pos.y;
      dragging.vx = dragging.vy = 0;
    } else if (isPanning) {
      var dx = (touch.clientX - panStartX) / zoom;
      var dy = (touch.clientY - panStartY) / zoom;
      panX = lastPanX + dx;
      panY = lastPanY + dy;
    }
  }, { passive: false });

  canvas.addEventListener("touchend", function (e) {
    var movedX = Math.abs((e.changedTouches[0] || {}).clientX - mouseDownX);
    var movedY = Math.abs((e.changedTouches[0] || {}).clientY - mouseDownY);
    var didDrag = movedX > 10 || movedY > 10;

    if (dragging) {
      if (!didDrag) {
        selectNode(dragging);
      } else {
        savePositions();
      }
      dragging = null;
    }
    isPanning = false;
    frozen = false;
  });

  canvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newZoom = Math.max(0.2, Math.min(5, zoom * delta));
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    panX = mx - (mx - w / 2 - panX) * (newZoom / zoom);
    panY = my - (my - h / 2 - panY) * (newZoom / zoom);
    zoom = newZoom;
  }, { passive: false });

  window.addEventListener("resize", function () {
    resize();
  });

  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      panX = panY = 0;
      zoom = 1;
      selected = null;
      highlightedNodes.clear();
      hideOpenButton();
      hideTooltip();
      frozen = false;
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      initSimulation({ nodes: nodes, links: links });
    });
  }

  var freezeBtn = document.getElementById("graph-freeze");
  if (freezeBtn) {
    freezeBtn.addEventListener("click", function () {
      frozen = !frozen;
      freezeBtn.textContent = frozen ? "Unfreeze" : "Freeze";
    });
  }

  function updateFilterButtons() {
    var btns = document.querySelectorAll(".graph-filter-btn");
    btns.forEach(function (btn) {
      var cat = btn.dataset.category;
      if (cat === "all") {
        btn.classList.toggle("active", activeCategories.size === Object.keys(CATEGORY_COLORS).length);
      } else {
        btn.classList.toggle("active", activeCategories.has(cat));
      }
    });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".graph-filter-btn");
    if (!btn) return;
    var cat = btn.dataset.category;
    if (cat === "all") {
      if (activeCategories.size === Object.keys(CATEGORY_COLORS).length) {
        activeCategories.clear();
      } else {
        activeCategories = new Set(Object.keys(CATEGORY_COLORS));
      }
    } else {
      if (activeCategories.has(cat)) {
        activeCategories.delete(cat);
      } else {
        activeCategories.add(cat);
      }
    }
    updateFilterButtons();
  });

  var searchInput = document.getElementById("graph-search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchInput.value = "";
        highlightedNodes.clear();
        var r = document.getElementById("graph-search-results");
        if (r) r.classList.remove("show");
      }
    });
  }

  window.graphHighlightNodes = function (nodeIds) {
    highlightedNodes = new Set();
    nodeIds.forEach(function (id) {
      for (var i = 0; i < simNodes.length; i++) {
        if (simNodes[i].id === id || simNodes[i].label.toLowerCase().indexOf(id.toLowerCase()) !== -1) {
          highlightedNodes.add(i);
        }
      }
    });
  };

  window.graphClearHighlight = function () {
    highlightedNodes.clear();
  };

  var graphFile = wrap.dataset.graph || "/assets/graph.json";
  fetch(graphFile)
    .then(function (r) { if (!r.ok) throw new Error("no graph"); return r.json(); })
    .then(function (data) {
      resize();
      initSimulation(data);
      loop();
      var stat = document.getElementById("graph-stats");
      if (stat) {
        var cats = {};
        data.nodes.forEach(function (n) { cats[n.category] = (cats[n.category] || 0) + 1; });
        stat.textContent = data.nodes.length + " pages · " + data.links.length + " connections · " + Object.keys(cats).length + " categories";
      }
    })
    .catch(function () {
      var stat = document.getElementById("graph-stats");
      if (stat) stat.textContent = "Graph data missing";
    });
})();
