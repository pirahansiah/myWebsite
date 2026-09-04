/**
 * Knowledge Graph — Obsidian-style explorer.
 * Click a TOPIC chip -> related pages highlight in the graph + list in the side panel.
 * Click a PAGE (in graph or panel) -> opens in an in-page reader (graph stays visible).
 * Back / Forward buttons walk the navigation trail. Esc clears the topic filter.
 *
 * Data model (from assets/graph.json):
 *   nodes: {id, label, url, kind: "moc"|"note"|"asset"|"tag", raw?}
 *   links: {source, target, kind: "link"|"mdlink"|"wiki"|"moc"|"tag"}
 *   topic (tag) nodes carry kind:"tag"; tag-links (kind:"tag") connect a page<->topic.
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
  var highlightedSet = new Set();      // node indices highlighted by search
  var selectionNeighbors = new Set();   // node ids directly related to the selected node
  var activeCategories = new Set();
  var tooltipEl = null;
  var gFuse = null;

  // navigation history (pages opened in the reader)
  var history = [];        // array of {id,url,label}
  var histIndex = -1;      // current position in history

  var COLORS = {
    hub: "#22D3EE", page: "#30d158", tag: "#af52de",
    paper: "#06B6D4", journal: "#64d2ff", book: "#ffd60a", patent: "#0284C7",
    keynote: "#ff6482", course: "#00c7be", pkm: "#ac8e68", business: "#8e8e93"
  };
  var CAT_LABEL = { hub: "Hub", page: "Page", tag: "Topic", asset: "Asset" };

  var isDark = matchMedia("(prefers-color-scheme:dark)").matches;
  var BG = isDark ? "#0d1117" : "#f8f9fa";
  var TEXT = isDark ? "#f5f5f7" : "#1d1d1f";
  var EDGE_COLOR = isDark ? "rgba(139,148,158,0.28)" : "rgba(100,116,139,0.20)";

  /* Topic stop-list: structural / self-name tags that are not real content
     keywords (e.g. #about, #Topics, #papers, #publications, #courses, brand
     / person-name tags). These clutter the explorer with menu/index-style
     labels instead of meaningful hashtags. */
  var TOPIC_STOPS = new Set([
    "about", "aboutme", "index", "menu", "menus", "toc", "readme", "navigation",
    "sidebar", "home", "tags", "topic", "topics", "main", "root", "hub",
    "papers", "paper", "publications", "publication", "books", "book", "journals",
    "journal", "conference-papers", "keynotes", "keynote", "courses", "course",
    "workshops--events", "workshops", "projects", "project", "github-projects-portfolio",
    "products--tools", "hardware--platforms", "technical-content", "ai-resources",
    "ai-community", "tech-education", "professional-development", "knowledge-management",
    "innovation", "summit", "stackdeeplearning", "ai--llm", "computer-vision-edge-ai",
    "farshid", "pirahansiah", "drfarshidpirahansiah", "farshidpirahansiah", "tiziran"
  ]);
  function isStopTopic(label) {
    if (!label) return true;
    var s = label.toLowerCase().replace(/^#/, "").replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return TOPIC_STOPS.has(s);
  }

  /* ---------- geometry ---------- */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = wrap.clientWidth; H = wrap.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
  }
  function nodeR(d) {
    if (d.category === "asset") return 2.5;
    return Math.sqrt((d.connections || 0) + 1) * 2.4 + 3;
  }

  /* ---------- highlight / selection model ----------
     Single click  -> SELECT a node + highlight its neighbourhood (the "main idea"
                      and everything relevant to it). No navigation.
     Double click  -> OPEN the selected node (pages/hubs open in the reader;
                      topics stay focused and list related pages).
     Click empty   -> clear selection.
  */
  function isDimmedByFilter(n) {
    if (!selectedNode) return false;
    // show only the selected node + its directly-relevant neighbours
    return !selectionNeighbors.has(n.id);
  }
  function isClickablePage(n) {
    if (!n || !n.url) return false;
    if (n.category !== "hub" && n.category !== "page") return false;
    if (/^\/view\//.test(n.url)) return false;
    return true;
  }
  // Direct neighbours of any node (used as the "relevant to the main idea only" set)
  function computeNeighbors(nodeId) {
    var set = new Set([nodeId]);
    graphLinks.forEach(function (l) {
      var s = l.source, t = l.target;
      if (s === nodeId) set.add(t);
      else if (t === nodeId) set.add(s);
    });
    return set;
  }
  // For a topic, prefer the topic->page relationships for a tighter cluster
  function computeTopicNeighbors(topicId) {
    var set = new Set([topicId]);
    graphLinks.forEach(function (l) {
      if (l.kind !== "tag" && l.kind !== "cooccur") return;
      var s = l.source, t = l.target;
      if (s === topicId) set.add(t);
      else if (t === topicId) set.add(s);
    });
    // fallback: if the topic has no tag-links (e.g. hashtags graph), use all links
    if (set.size <= 1) return computeNeighbors(topicId);
    return set;
  }

  /* ---------- render ---------- */
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
        if (l.source === active || l.target === active) { connected.add(l.source); connected.add(l.target); }
      });
    }

    graphLinks.forEach(function (l) {
      var s = l.source, t = l.target;
      if (!s || !t || typeof s.x !== "number" || typeof t.x !== "number") return;
      if (!activeCategories.has(s.category) || !activeCategories.has(t.category)) return;
      if (isDimmedByFilter(s) || isDimmedByFilter(t)) return;

      var isHL = active && (s === active || t === active);
      var isSelEdge = selectedNode && (selectionNeighbors.has(s.id) && selectionNeighbors.has(t.id)) && (s.id === selectedNode.id || t.id === selectedNode.id);
      var isSearch = highlightedSet.has(s.index) || highlightedSet.has(t.index);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
      if (isSelEdge) {
        ctx.strokeStyle = "#22D3EE"; ctx.lineWidth = 1.8 / transform.k; ctx.globalAlpha = 0.85;
      } else if (isHL) {
        ctx.strokeStyle = "#22D3EE"; ctx.lineWidth = 1.6 / transform.k; ctx.globalAlpha = 0.9;
      } else if (isSearch) {
        ctx.strokeStyle = "#ff9500"; ctx.lineWidth = 2 / transform.k; ctx.globalAlpha = 1;
      } else if (active || selectedNode) {
        ctx.strokeStyle = EDGE_COLOR; ctx.lineWidth = 0.4 / transform.k; ctx.globalAlpha = 0.12;
      } else {
        ctx.strokeStyle = EDGE_COLOR; ctx.lineWidth = 0.7 / transform.k; ctx.globalAlpha = 0.45;
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    });

    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category)) return;
      if (typeof n.x !== "number" || typeof n.y !== "number") return;
      if (isDimmedByFilter(n)) return;

      var r = nodeR(n);
      var isSel = selectedNode === n;
      var isHov = hoveredNode === n;
      var isConn = active && connected.has(n);
      var isSelNode = selectedNode && selectionNeighbors.has(n.id);
      var isSearch = highlightedSet.has(n.index);

      var fill = COLORS[n.category] || "#8e8e93";
      var isDim = active && !isSel && !isHov && !isConn;

      if (isSel || isHov || isSearch || isSelNode) {
        ctx.globalAlpha = 0.22; ctx.beginPath();
        ctx.arc(n.x, n.y, r + 9, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
      }

      ctx.globalAlpha = isDim ? 0.12 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isSel ? r + 3 : isHov ? r + 2 : isSelNode ? r + 1.5 : r, 0, Math.PI * 2);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = isSel ? "#ff9500" : isSelNode ? "#22D3EE" : isHov ? "#22D3EE" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = (isSel ? 2.5 : isSelNode ? 2 : isHov ? 2 : 0.5) / Math.max(transform.k, 0.5);
      ctx.stroke();

      var showLabel = isSel || isHov || isConn || isSearch || isSelNode || (!active && !selectedNode && transform.k > 0.55);
      if (showLabel) {
        var label = n.label || n.id;
        if (!isSel && !isHov && !isConn && !isSearch && !isSelNode && label.length > 22) label = label.substring(0, 20) + "…";
        ctx.globalAlpha = isDim ? 0.12 : (isSel || isHov || isSelNode || isSearch) ? 1 : 0.45;
        ctx.fillStyle = isSelNode ? "#22D3EE" : (isSel ? "#ff9500" : TEXT);
        ctx.font = ((isSel || isHov || isSelNode) ? "600 " : "400 ") + Math.max(8, 10 / Math.max(transform.k, 0.5)) + "px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, n.x, n.y + r + 10 / Math.max(transform.k, 0.5));
      }
      ctx.globalAlpha = 1;
    });

    ctx.restore();
    ctx.restore();
    drawMinimap();
  }

  function drawMinimap() {
    var mw = 84, mh = 52, mx = W - mw - 8, my = H - mh - 8;
    if (graphNodes.length === 0) return;
    ctx.save(); ctx.scale(dpr, dpr);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = isDark ? "rgba(22,27,34,0.85)" : "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 4); ctx.fill();
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category) || isDimmedByFilter(n) || typeof n.x !== "number") return;
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });
    if (minX >= maxX) { minX -= 100; maxX += 100; }
    if (minY >= maxY) { minY -= 100; maxY += 100; }
    var p = 20; minX -= p; maxX += p; minY -= p; maxY += p;
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category) || isDimmedByFilter(n) || typeof n.x !== "number") return;
      var nx = mx + ((n.x - minX) / (maxX - minX)) * mw;
      var ny = my + ((n.y - minY) / (maxY - minY)) * mh;
      ctx.beginPath(); ctx.arc(nx, ny, 1, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.category] || "#8e8e93"; ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- hit test / tooltip ---------- */
  function hitTest(px, py) {
    var mx = (px - transform.x) / transform.k;
    var my = (py - transform.y) / transform.k;
    for (var i = graphNodes.length - 1; i >= 0; i--) {
      var n = graphNodes[i];
      if (!activeCategories.has(n.category) || isDimmedByFilter(n) || typeof n.x !== "number") continue;
      var dx = mx - n.x, dy = my - n.y, r = nodeR(n) + 6;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }
  function showTooltip(node, px, py) {
    if (!tooltipEl) { tooltipEl = document.createElement("div"); tooltipEl.className = "graph-tooltip"; wrap.appendChild(tooltipEl); }
    var c = COLORS[node.category] || "#8e8e93";
    var action = node.category === "tag" ? "Click to select · double-click to open" : (isClickablePage(node) ? "Click to select · double-click to open" : "Click to select");
    tooltipEl.innerHTML = '<div class="gt-title">' + (node.label || node.id) + '</div>' +
      '<div class="gt-cat" style="color:' + c + '">' + (CAT_LABEL[node.category] || node.category) +
      (action ? ' · <span class="gt-action">' + action + '</span>' : '') + '</div>';
    tooltipEl.style.left = Math.min(px, W - 200) + "px";
    tooltipEl.style.top = (py - 52) + "px";
    tooltipEl.style.display = "block";
  }
  function hideTooltip() { if (tooltipEl) tooltipEl.style.display = "none"; }

  /* ---------- selection (single click = select + highlight; the "main idea") ---------- */
  function selectNode(node) {
    if (selectedNode === node) { clearSelection(); return; }   // click again to clear
    selectedNode = node;
    selectionNeighbors = (node.category === "tag") ? computeTopicNeighbors(node.id) : computeNeighbors(node.id);
    updateTopicBar();
    // topic selection also lists related pages in the side panel (optional, relevant view)
    if (node.category === "tag") renderTopicPanel(node.id);
    else renderTopicPanel(null);
    var hint = document.getElementById("graph-tag-hint");
    if (hint) {
      hint.style.display = "block";
      hint.innerHTML = "Selected <strong>" + (node.label || node.id) + "</strong> — showing only what's relevant. Double-click to open · Esc to clear.";
    }
    render();
  }
  function clearSelection() {
    selectedNode = null; selectionNeighbors = new Set();
    updateTopicBar();
    renderTopicPanel(null);
    var hint = document.getElementById("graph-tag-hint");
    if (hint) hint.style.display = "none";
    render();
  }
  function nodeById(id) {
    for (var i = 0; i < graphNodes.length; i++) if (graphNodes[i].id === id) return graphNodes[i];
    return null;
  }

  /* ---------- topic bar (chips) ---------- */
  var TOPIC_LIMIT = 26;
  function buildTopicBar() {
    var bar = document.getElementById("graph-topics");
    if (!bar) return;
    var topics = graphNodes.filter(function (n) { return n.category === "tag" && !isStopTopic(n.label); })
      .sort(function (a, b) { return (b.connections || 0) - (a.connections || 0); });
    // de-dup by label (some tags may repeat)
    var seen = {}, uniq = [];
    topics.forEach(function (t) { if (!seen[t.label]) { seen[t.label] = 1; uniq.push(t); } });
    var top = uniq.slice(0, TOPIC_LIMIT);
    bar.innerHTML = "";
    top.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "graph-topic-chip";
      b.textContent = t.label;
      b.dataset.id = t.id;
      b.addEventListener("click", function () { selectNode(t); });
      bar.appendChild(b);
    });
    var more = uniq.length - top.length;
    if (more > 0) {
      var m = document.createElement("span");
      m.className = "graph-topic-more";
      m.textContent = "+" + more + " more topics below";
      bar.appendChild(m);
    }
    // also a full list in panel header search
    updateTopicBar();
  }
  function updateTopicBar() {
    var bar = document.getElementById("graph-topics");
    if (!bar) return;
    bar.querySelectorAll(".graph-topic-chip").forEach(function (c) {
      c.classList.toggle("active", !!selectedNode && c.dataset.id === selectedNode.id);
    });
  }

  /* ---------- side panel: related pages (or topics) ---------- */
  function renderTopicPanel(topicId) {
    var panel = document.getElementById("graph-panel");
    var title = document.getElementById("graph-panel-title");
    var list = document.getElementById("graph-panel-list");
    if (!panel || !list) return;
    if (!topicId) { panel.classList.remove("open"); return; }
    panel.classList.add("open");
    var t = nodeById(topicId);
    if (title) title.textContent = (t ? t.label : "Topic") + " — related";

    // pages related to this topic
    var ids = [];
    selectionNeighbors.forEach(function (id) {
      if (id === topicId) return;
      var n = nodeById(id);
      if (n && (n.category === "page" || n.category === "hub")) ids.push(n);
    });
    var isTopicsOnly = ids.length === 0;
    if (isTopicsOnly) {
      // hashtags graph: neighbors are other tags
      selectionNeighbors.forEach(function (id) {
        if (id === topicId) return;
        var n = nodeById(id);
        if (n) ids.push(n);
      });
    }
    ids.sort(function (a, b) { return (b.connections || 0) - (a.connections || 0); });

    list.innerHTML = "";
    ids.forEach(function (n) {
      var li = document.createElement("button");
      li.type = "button";
      li.className = "graph-panel-item";
      li.innerHTML = '<span class="gpi-dot" style="background:' + (COLORS[n.category] || "#8e8e93") + '"></span>' +
        '<span class="gpi-label">' + (n.label || n.id) + '</span>';
      li.addEventListener("click", function () {
        if (n.category === "tag") selectNode(n);
        else openPage(n);
      });
      list.appendChild(li);
    });
    if (ids.length === 0) {
      var empty = document.createElement("div");
      empty.className = "graph-panel-empty";
      empty.textContent = "No related items.";
      list.appendChild(empty);
    }
  }

  /* ---------- in-page reader + history ---------- */
  function openPage(node) {
    if (!node || !isClickablePage(node)) return;
    // build a history entry
    var entry = { id: node.id, url: node.url, label: node.label || node.id };
    // if we're already at the end, push; else truncate forward branch
    if (histIndex < history.length - 1) history = history.slice(0, histIndex + 1);
    // avoid duplicate consecutive
    if (!history.length || history[history.length - 1].id !== entry.id) {
      history.push(entry);
      histIndex = history.length - 1;
    } else {
      histIndex = history.length - 1;
    }
    selectedNode = node;
    render();
    loadReader(entry);
    updateHistoryUI();
  }
  function goHistory(delta) {
    var ni = histIndex + delta;
    if (ni < 0 || ni >= history.length) return;
    histIndex = ni;
    var e = history[ni];
    var node = nodeById(e.id) || { id: e.id, url: e.url, label: e.label, category: "page" };
    selectedNode = node;
    render();
    loadReader(e);
    updateHistoryUI();
  }
  function updateHistoryUI() {
    var back = document.getElementById("graph-back");
    var fwd = document.getElementById("graph-forward");
    var crumb = document.getElementById("graph-crumb");
    if (back) back.disabled = histIndex <= 0;
    if (fwd) fwd.disabled = histIndex >= history.length - 1;
    if (crumb) {
      if (history.length) {
        crumb.innerHTML = history.map(function (e, i) {
          var cls = "graph-crumb-item" + (i === histIndex ? " active" : "");
          return '<button type="button" class="' + cls + '" data-i="' + i + '">' + (e.label || e.id) + '</button>';
        }).join('<span class="graph-crumb-sep">›</span>');
        crumb.querySelectorAll(".graph-crumb-item").forEach(function (b) {
          b.addEventListener("click", function () { goHistory(parseInt(b.dataset.i, 10) - histIndex); });
        });
      } else crumb.innerHTML = "";
    }
  }
  function loadReader(entry) {
    var reader = document.getElementById("graph-reader");
    if (!reader) return;
    reader.classList.add("open");
    reader.innerHTML = '<div class="graph-reader-head">' +
      '<div class="graph-reader-title">' + (entry.label || entry.id) + '</div>' +
      '<div class="graph-reader-actions">' +
      '<a class="graph-reader-btn" href="' + entry.url + '" target="_blank" rel="noopener">↗ Open full page</a>' +
      '<button type="button" class="graph-reader-btn" id="graph-reader-close">Close</button>' +
      '</div></div>' +
      '<iframe class="graph-reader-frame" src="' + entry.url + '" loading="lazy"></iframe>';
    document.getElementById("graph-reader-close").addEventListener("click", function () {
      reader.classList.remove("open"); reader.innerHTML = "";
      selectedNode = null; render();
    });
  }

  /* ---------- tabs / category filter ---------- */
  function selectCategory(cat) {
    activeCategories = cat === "all" ? new Set(Object.keys(COLORS)) : new Set([cat]);
    document.querySelectorAll(".graph-tab").forEach(function (tab) {
      var c = tab.dataset.tab;
      tab.classList.toggle("active", c === "all" ? activeCategories.size === Object.keys(COLORS).length : activeCategories.size === 1 && activeCategories.has(c));
    });
    render();
  }
  document.addEventListener("click", function (e) {
    var tab = e.target.closest(".graph-tab");
    if (!tab) return;
    selectCategory(tab.dataset.tab);
  });

  /* ---------- setup ---------- */
  function setup(data) {
    var KIND_TO_CATEGORY = { moc: "hub", note: "page", tag: "tag", asset: "asset", code: "page" };
    graphNodes = (data.nodes || []).map(function (n, i) {
      if (!n.category && n.kind) n.category = KIND_TO_CATEGORY[n.kind] || "page";
      if (!n.category) n.category = "page";
      n.index = i; n.connections = 0;
      return n;
    });
    var links = data.links || [];
    var idSet = new Set(graphNodes.map(function (n) { return n.id; }));

    graphLinks = [];
    links.forEach(function (l) {
      var s = typeof l.source === "string" ? l.source : (typeof l.source === "object" ? l.source.id : null);
      var t = typeof l.target === "string" ? l.target : (typeof l.target === "object" ? l.target.id : null);
      if (s && t && s !== t && idSet.has(s) && idSet.has(t)) {
        graphLinks.push({ source: s, target: t, kind: l.kind || l.type || "link", strength: l.strength || l.weight || 0.5 });
      }
    });
    graphLinks.forEach(function (l) {
      var sId = typeof l.source === "object" ? l.source.id : l.source;
      var tId = typeof l.target === "object" ? l.target.id : l.target;
      graphNodes.forEach(function (n) { if (n.id === sId || n.id === tId) n.connections++; });
    });

    activeCategories = new Set(Object.keys(COLORS));
    buildTopicBar();

    simulation = d3.forceSimulation(graphNodes)
      .force("link", d3.forceLink(graphLinks).id(function (d) { return d.id; }).distance(85).strength(function (d) { return (d.strength || 0.5) * 0.35; }))
      .force("charge", d3.forceManyBody().strength(-160).distanceMax(380))
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.06))
      .force("collide", d3.forceCollide().radius(function (d) { return nodeR(d) + 4; }).strength(0.8))
      .force("x", d3.forceX(W / 2).strength(0.04))
      .force("y", d3.forceY(W / 2).strength(0.04))
      .alphaDecay(0.022)
      .on("tick", render);

    d3.select(canvas).call(d3.zoom().scaleExtent([0.1, 6]).on("zoom", function (e) { transform = e.transform; render(); }));

    var dragBehavior = d3.drag()
      .on("start", function (e, d) { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; draggingNode = d; })
      .on("drag", function (e, d) { var rect = wrap.getBoundingClientRect(); var p = transform.invert([e.sourceEvent.clientX - rect.left, e.sourceEvent.clientY - rect.top]); d.fx = p[0]; d.fy = p[1]; })
      .on("end", function (e, d) { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; draggingNode = null; });
    d3.select(canvas).call(dragBehavior);

    d3.select(canvas)
      .on("mousemove", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit !== hoveredNode) {
          hoveredNode = hit;
          canvas.style.cursor = hit ? (isClickablePage(hit) ? "pointer" : "default") : "grab";
          if (hit) showTooltip(hit, e.clientX - rect.left, e.clientY - rect.top); else hideTooltip();
          render();
        }
      })
      .on("click", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (!hit) { clearSelection(); return; }
        if (hit.category === "tag" && isStopTopic(hit.label)) { clearSelection(); return; }
        // single click = SELECT + HIGHLIGHT only (no navigation)
        selectNode(hit);
      })
      .on("dblclick", function (e) {
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (!hit) return;
        // double click = OPEN the selected/hovered node
        if (isClickablePage(hit)) openPage(hit);
        else if (hit.category === "tag" && !isStopTopic(hit.label)) selectNode(hit);
      });

    canvas.addEventListener("touchend", function (e) {
      if (e.changedTouches.length !== 1) return;
      var t = e.changedTouches[0];
      var rect = wrap.getBoundingClientRect();
      var hit = hitTest(t.clientX - rect.left, t.clientY - rect.top);
      if (!hit) { clearSelection(); return; }
      if (hit.category === "tag") { if (isStopTopic(hit.label)) { clearSelection(); } else { selectNode(hit); } }
      else if (isClickablePage(hit)) selectNode(hit);
      else { selectNode(hit); }
    });

    d3.select(window).on("keydown", function (e) {
      if (e && e.key === "Escape") { clearSelection(); }
      if (e && e.key === "Backspace" && history.length && histIndex > 0 && document.activeElement === document.body) { e.preventDefault(); goHistory(-1); }
    });

    // reader close on Esc handled above via clearSelection; ensure reader close button wired in loadReader
    var stat = document.getElementById("graph-stats");
    if (stat) stat.textContent = graphNodes.filter(function (n) { return n.category !== "asset"; }).length + " pages · " + (graphNodes.filter(function (n) { return n.category === "tag"; }).length) + " topics · " + graphLinks.length + " links";

    initSearch();
    render();
  }

  /* ---------- search ---------- */
  var gFuse2 = null;
  function initSearch() {
    gFuse2 = new Fuse(graphNodes.map(function (n) { return { id: n.id, title: n.label || n.id }; }), { keys: [{ name: "title", weight: 2 }], threshold: 0.4, minMatchCharLength: 2 });
    var input = document.getElementById("graph-search-input");
    var countEl = document.getElementById("graph-search-results");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q || q.length < 2 || !gFuse2) { highlightedSet.clear(); countEl.textContent = ""; render(); return; }
      var results = gFuse2.search(q);
      if (results.length === 0) { highlightedSet.clear(); countEl.textContent = "No matches"; render(); return; }
      highlightedSet.clear();
      results.forEach(function (r) { graphNodes.forEach(function (n, i) { if (n.id === r.item.id) highlightedSet.add(i); }); });
      countEl.textContent = results.length + " highlighted";
      render();
    });
  }

  /* ---------- init ---------- */
  resize();
  window.addEventListener("resize", function () {
    resize();
    if (simulation) {
      simulation.force("center", d3.forceCenter(W / 2, H / 2));
      simulation.force("x", d3.forceX(W / 2).strength(0.04));
      simulation.force("y", d3.forceY(W / 2).strength(0.04));
      render();
    }
  });

  // controls
  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    selectedNode = null; hoveredNode = null; highlightedSet.clear(); clearSelection();
    simulation.alpha(1).restart();
  });
  var freezeBtn = document.getElementById("graph-freeze");
  if (freezeBtn) freezeBtn.addEventListener("click", function () {
    if (simulation.alpha() > 0) { simulation.stop(); freezeBtn.textContent = "Unfreeze"; }
    else { simulation.alpha(0.3).restart(); freezeBtn.textContent = "Freeze"; }
  });
  var backBtn = document.getElementById("graph-back");
  if (backBtn) backBtn.addEventListener("click", function () { goHistory(-1); });
  var fwdBtn = document.getElementById("graph-forward");
  if (fwdBtn) fwdBtn.addEventListener("click", function () { goHistory(1); });

  var graphUrl = (wrap && wrap.dataset.graph) || "/assets/graph.json";
  fetch(graphUrl)
    .then(function (r) { if (!r.ok) throw new Error("no graph"); return r.json(); })
    .then(function (data) { setup(data); })
    .catch(function (e) { console.error("Graph load error:", e); var s = document.getElementById("graph-stats"); if (s) s.textContent = "Graph data missing"; });
})();
