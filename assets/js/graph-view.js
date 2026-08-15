/**
 * Knowledge Graph — Simple D3.js force-directed graph
 */
(function () {
  "use strict";

  var wrap = document.getElementById("graph-wrap");
  var canvas = document.getElementById("graph-canvas");
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext("2d");

  var W, H, dpr;
  var simulation;
  var graphNodes = [], graphLinks = [];
  var transform = { x: 0, y: 0, k: 1 };
  var hoveredNode = null, selectedNode = null;
  var draggingNode = null;
  var highlightedSet = new Set();
  var activeCategories = new Set();
  var openBtn = document.getElementById("graph-open-btn");
  var tooltipEl = null;
  var gFuse = null;

  var COLORS = {
    hub: "#F5A623", page: "#30d158", tag: "#af52de",
    paper: "#14B8A6", journal: "#64d2ff", book: "#ffd60a", patent: "#F97316",
    keynote: "#ff6482", course: "#00c7be", pkm: "#ac8e68", business: "#8e8e93"
  };

  var isDark = matchMedia("(prefers-color-scheme:dark)").matches;
  var BG = isDark ? "#0d1117" : "#f8f9fa";
  var TEXT = isDark ? "#f5f5f7" : "#1d1d1f";
  var TEXT_DIM = isDark ? "rgba(245,245,247,0.3)" : "rgba(29,29,31,0.3)";
  var EDGE_COLOR = isDark ? "rgba(139,148,158,0.3)" : "rgba(100,116,139,0.25)";

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
  }

  function nodeR(d) {
    return Math.sqrt((d.connections || 0) + 1) * 2.5 + 3;
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    var active = selectedNode || hoveredNode;
    var connected = new Set();
    if (active) {
      graphLinks.forEach(function (l) {
        if (l.source === active || l.target === active) {
          connected.add(l.source);
          connected.add(l.target);
        }
      });
    }

    // Draw edges
    graphLinks.forEach(function (l) {
      var s = l.source, t = l.target;
      if (!s || !t || !s.x || !t.x) return;
      var sCat = s.category || "page";
      var tCat = t.category || "page";
      if (!activeCategories.has(sCat) || !activeCategories.has(tCat)) return;

      var isHL = active && (s === active || t === active);
      var isDim = active && !isHL;
      var isSearch = highlightedSet.has(s.index) || highlightedSet.has(t.index);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);

      if (isSearch) {
        ctx.strokeStyle = "#F5A623";
        ctx.lineWidth = 2.5 / transform.k;
        ctx.globalAlpha = 1;
      } else if (isHL) {
        ctx.strokeStyle = "#F5A623";
        ctx.lineWidth = 2 / transform.k;
        ctx.globalAlpha = 0.9;
      } else if (isDim) {
        ctx.strokeStyle = EDGE_COLOR;
        ctx.lineWidth = 0.3 / transform.k;
        ctx.globalAlpha = 0.15;
      } else {
        ctx.strokeStyle = EDGE_COLOR;
        ctx.lineWidth = 0.8 / transform.k;
        ctx.globalAlpha = 0.5;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category)) return;
      if (typeof n.x !== "number" || typeof n.y !== "number") return;

      var r = nodeR(n);
      var isSel = selectedNode === n;
      var isHov = hoveredNode === n;
      var isConn = active && connected.has(n);
      var isDim = active && !isSel && !isHov && !isConn;
      var isSearch = highlightedSet.has(n.index);

      var fill = COLORS[n.category] || "#8e8e93";
      var drawR = isSel ? r + 3 : isHov ? r + 2 : isSearch ? r + 2 : r;

      // Glow
      if (isSel || isHov || isSearch) {
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR + 8, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      // Node
      ctx.globalAlpha = isDim ? 0.1 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = isSel ? "#ff9500" : isHov ? "#F5A623" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = (isSel ? 2.5 : isHov ? 2 : 0.5) / Math.max(transform.k, 0.5);
      ctx.stroke();

      // Label
      var showLabel = isSel || isHov || isConn || isSearch;
      if (!showLabel && !active) {
        var maxLen = transform.k < 0.3 ? 0 : transform.k < 0.6 ? 4 : transform.k < 1 ? 10 : 999;
        if (maxLen > 0) showLabel = true;
        else return;
      }

      var label = n.label || n.id;
      if (!isSel && !isHov && !isConn && !isSearch && !active) {
        var ml = transform.k < 0.3 ? 0 : transform.k < 0.6 ? 4 : transform.k < 1 ? 10 : 999;
        if (ml > 0 && label.length > ml) label = label.substring(0, ml - 1) + "…";
      }

      ctx.globalAlpha = isDim ? 0.1 : (isSel || isHov || isConn || isSearch) ? 1 : 0.45;
      ctx.fillStyle = isSel ? "#ff9500" : TEXT;
      ctx.font = ((isSel || isHov) ? "600 " : "400 ") + Math.max(8, 10 / Math.max(transform.k, 0.5)) + "px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, n.x, n.y + drawR + 10 / Math.max(transform.k, 0.5));
      ctx.globalAlpha = 1;
    });

    ctx.restore();
    ctx.restore();
    drawMinimap();
  }

  function drawMinimap() {
    var mw = 80, mh = 50, mx = W - mw - 8, my = H - mh - 8;
    if (graphNodes.length === 0) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = isDark ? "rgba(22,27,34,0.8)" : "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 4);
    ctx.fill();

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category) || typeof n.x !== "number") return;
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });
    if (minX >= maxX) { minX -= 100; maxX += 100; }
    if (minY >= maxY) { minY -= 100; maxY += 100; }
    var p = 20; minX -= p; maxX += p; minY -= p; maxY += p;

    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category) || typeof n.x !== "number") return;
      var nx = mx + ((n.x - minX) / (maxX - minX)) * mw;
      var ny = my + ((n.y - minY) / (maxY - minY)) * mh;
      ctx.beginPath();
      ctx.arc(nx, ny, 1, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.category] || "#8e8e93";
      ctx.fill();
    });
    ctx.restore();
  }

  function hitTest(px, py) {
    var mx = (px - transform.x) / transform.k;
    var my = (py - transform.y) / transform.k;
    for (var i = graphNodes.length - 1; i >= 0; i--) {
      var n = graphNodes[i];
      if (!activeCategories.has(n.category) || typeof n.x !== "number") continue;
      var dx = mx - n.x, dy = my - n.y;
      var r = nodeR(n) + 6;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  function showTooltip(node, px, py) {
    if (!tooltipEl) { tooltipEl = document.createElement("div"); tooltipEl.className = "graph-tooltip"; wrap.appendChild(tooltipEl); }
    var c = COLORS[node.category] || "#8e8e93";
    tooltipEl.innerHTML = '<div class="gt-title">' + (node.label || node.id) + '</div><div class="gt-cat" style="color:' + c + '">' + (node.category || "") + '</div>';
    tooltipEl.style.left = Math.min(px, W - 180) + "px";
    tooltipEl.style.top = (py - 50) + "px";
    tooltipEl.style.display = "block";
  }

  function hideTooltip() { if (tooltipEl) tooltipEl.style.display = "none"; }

  function isClickablePage(n) {
    if (!n || !n.url) return false;
    if (n.category !== "hub" && n.category !== "page") return false;
    if (/^\/view\//.test(n.url)) return false;
    return true;
  }

  function selectNode(n) {
    if (selectedNode === n) { selectedNode = null; hideOpenButton(); }
    else { selectedNode = n; showOpenButton(n); }
  }

  function showOpenButton(n) {
    if (!openBtn || !n || !n.url) { hideOpenButton(); return; }
    openBtn.innerHTML = (n.label || n.id) + " → Open";
    openBtn.href = n.url;
    openBtn.style.display = "inline-flex";
  }

  function hideOpenButton() { if (openBtn) openBtn.style.display = "none"; }

  function updateTabs() {
    document.querySelectorAll(".graph-tab").forEach(function (tab) {
      var cat = tab.dataset.tab;
      tab.classList.toggle("active", cat === "all" ? activeCategories.size === Object.keys(COLORS).length : activeCategories.size === 1 && activeCategories.has(cat));
    });
  }

  // Tab clicks
  document.addEventListener("click", function (e) {
    var tab = e.target.closest(".graph-tab");
    if (!tab) return;
    var cat = tab.dataset.tab;
    activeCategories = cat === "all" ? new Set(Object.keys(COLORS)) : new Set([cat]);
    updateTabs();
    render();
  });

  function setup(data) {
    var KIND_TO_CATEGORY = { moc: "hub", note: "page", tag: "tag", code: "page" };
    graphNodes = (data.nodes || []).map(function (n, i) {
      if (!n.category && n.kind) n.category = KIND_TO_CATEGORY[n.kind] || "page";
      if (!n.category) n.category = "page";
      n.index = i;
      n.connections = 0;
      return n;
    });
    var links = data.links || [];
    var idSet = new Set(graphNodes.map(function (n) { return n.id; }));

    graphLinks = [];
    links.forEach(function (l) {
      var s = typeof l.source === "string" ? l.source : (typeof l.source === "object" ? l.source.id : null);
      var t = typeof l.target === "string" ? l.target : (typeof l.target === "object" ? l.target.id : null);
      if (s && t && s !== t && idSet.has(s) && idSet.has(t)) {
        graphLinks.push({ source: s, target: t, strength: l.strength || l.weight || 0.5 });
      }
    });

    // Count connections per node
    graphLinks.forEach(function (l) {
      var sId = typeof l.source === "object" ? l.source.id : l.source;
      var tId = typeof l.target === "object" ? l.target.id : l.target;
      graphNodes.forEach(function (n) {
        if (n.id === sId || n.id === tId) n.connections++;
      });
    });

    activeCategories = new Set(Object.keys(COLORS));
    updateTabs();

    // D3 force simulation
    simulation = d3.forceSimulation(graphNodes)
      .force("link", d3.forceLink(graphLinks).id(function (d) { return d.id; }).distance(80).strength(function (d) { return (d.strength || 0.5) * 0.4; }))
      .force("charge", d3.forceManyBody().strength(-150).distanceMax(350))
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.06))
      .force("collide", d3.forceCollide().radius(function (d) { return nodeR(d) + 3; }).strength(0.8))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(H / 2).strength(0.04))
      .alphaDecay(0.025)
      .on("tick", render);

    // D3 zoom
    var zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 6])
      .on("zoom", function (e) { transform = e.transform; render(); });
    d3.select(canvas).call(zoomBehavior);

    // D3 drag
    var dragBehavior = d3.drag()
      .on("start", function (e, d) {
        if (!e.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
        draggingNode = d;
      })
      .on("drag", function (e, d) {
        var rect = wrap.getBoundingClientRect();
        var p = transform.invert([e.sourceEvent.clientX - rect.left, e.sourceEvent.clientY - rect.top]);
        d.fx = p[0]; d.fy = p[1];
      })
      .on("end", function (e, d) {
        if (!e.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
        draggingNode = null;
      });
    d3.select(canvas).call(dragBehavior);

    // Mouse events
    d3.select(canvas)
      .on("mousemove", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit !== hoveredNode) {
          hoveredNode = hit;
          canvas.style.cursor = hit ? (isClickablePage(hit) ? "pointer" : "default") : "grab";
          if (hit) showTooltip(hit, e.clientX - rect.left, e.clientY - rect.top);
          else hideTooltip();
          render();
        }
      })
      .on("click", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit && isClickablePage(hit)) {
          window.location.href = hit.url;
        } else if (hit) {
          selectNode(hit);
        } else {
          selectedNode = null; hideOpenButton(); render();
        }
      })
      .on("dblclick", function (e) {
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit && isClickablePage(hit)) window.location.href = hit.url;
      });

    // Touch
    canvas.addEventListener("touchend", function (e) {
      if (e.changedTouches.length === 1) {
        var t = e.changedTouches[0];
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(t.clientX - rect.left, t.clientY - rect.top);
        if (hit && isClickablePage(hit)) {
          window.location.href = hit.url;
        } else if (hit) {
          selectNode(hit); render();
        }
      }
    });

    // Stats
    var stat = document.getElementById("graph-stats");
    if (stat) stat.textContent = graphNodes.length + " pages · " + graphLinks.length + " connections";

    render();
  }

  // Controls
  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    selectedNode = null; hoveredNode = null; highlightedSet.clear();
    hideOpenButton(); hideTooltip();
    simulation.alpha(1).restart();
  });

  var freezeBtn = document.getElementById("graph-freeze");
  if (freezeBtn) freezeBtn.addEventListener("click", function () {
    if (simulation.alpha() > 0) { simulation.stop(); freezeBtn.textContent = "Unfreeze"; }
    else { simulation.alpha(0.3).restart(); freezeBtn.textContent = "Freeze"; }
  });

  // Search — built dynamically from graph nodes
  var CONTENT_INDEX = [];

  function buildSearchIndex() {
    CONTENT_INDEX = graphNodes.map(function (n) {
      return { id: n.id, title: n.label || n.id };
    });
  }

  function initSearch() {
    buildSearchIndex();
    gFuse = new Fuse(CONTENT_INDEX, { keys: [{ name: "title", weight: 2 }], threshold: 0.4, minMatchCharLength: 2 });
    var input = document.getElementById("graph-search-input");
    var countEl = document.getElementById("graph-search-results");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q || q.length < 2 || !gFuse) { highlightedSet.clear(); countEl.textContent = ""; render(); return; }
      var results = gFuse.search(q);
      if (results.length === 0) { highlightedSet.clear(); countEl.textContent = "No matches"; render(); return; }
      highlightedSet.clear();
      results.forEach(function (r) {
        graphNodes.forEach(function (n, i) { if (n.id === r.item.id) highlightedSet.add(i); });
      });
      countEl.textContent = results.length + " highlighted";
      render();
    });
  }

  // Init
  resize();
  window.addEventListener("resize", function () {
    resize();
    if (simulation) {
      simulation.force("center", d3.forceCenter(W / 2, H / 2));
      simulation.force("x", d3.forceX(W / 2).strength(0.04));
      simulation.force("y", d3.forceY(H / 2).strength(0.04));
      render();
    }
  });

  var graphUrl = (wrap && wrap.dataset.graph) || "/assets/graph.json";
  fetch(graphUrl)
    .then(function (r) { if (!r.ok) throw new Error("no graph"); return r.json(); })
    .then(function (data) { setup(data); initSearch(); })
    .catch(function (e) { console.error("Graph load error:", e); var s = document.getElementById("graph-stats"); if (s) s.textContent = "Graph data missing"; });
})();
