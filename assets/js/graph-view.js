/**
 * Knowledge Graph — D3.js force-directed, Obsidian-style
 * Uses d3-force for physics, Canvas for rendering, d3-zoom for interaction
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
  var transform = d3.zoomIdentity;
  var hoveredNode = null, selectedNode = null;
  var draggingNode = null;
  var highlightedSet = new Set();
  var activeCategories = new Set();
  var openBtn = document.getElementById("graph-open-btn");
  var tooltipEl = null;

  var COLORS = {
    hub: "#0a84ff", cv: "#30d158", ai: "#bf5af2", cuda: "#ff9f0a",
    paper: "#5ac8fa", journal: "#64d2ff", book: "#ffd60a", patent: "#ff375f",
    keynote: "#ff6482", course: "#00c7be", pkm: "#ac8e68", business: "#8e8e93"
  };

  var isDark = matchMedia("(prefers-color-scheme:dark)").matches;
  var BG = isDark ? "#111" : "#f5f5f5";
  var TEXT = isDark ? "#f5f5f7" : "#1d1d1f";
  var TEXT_DIM = isDark ? "rgba(245,245,247,0.35)" : "rgba(29,29,31,0.35)";
  var EDGE = isDark ? "rgba(140,140,160,0.3)" : "rgba(100,100,120,0.25)";
  var EDGE_HL = "#0a84ff";

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
    var conns = d.connections || 0;
    return Math.sqrt(conns + 1) * 3 + 4;
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
      if (!s || !t) return;
      var srcCat = s.category || "note";
      var tgtCat = t.category || "note";
      if (!activeCategories.has(srcCat) || !activeCategories.has(tgtCat)) return;

      var isHL = active && (s === active || t === active);
      var isDim = active && !isHL;
      var isSearch = highlightedSet.has(s.index) || highlightedSet.has(t.index);

      ctx.beginPath();
      // Curved edges
      var mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      var dx = t.x - s.x, dy = t.y - s.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var curve = dist * 0.12;
      var nx = -dy / dist * curve, ny = dx / dist * curve;

      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(mx + nx, my + ny, t.x, t.y);

      if (isSearch) {
        ctx.strokeStyle = EDGE_HL;
        ctx.lineWidth = 2.5 / transform.k;
        ctx.globalAlpha = 1;
      } else if (isHL) {
        ctx.strokeStyle = EDGE_HL;
        ctx.lineWidth = 2 / transform.k;
        ctx.globalAlpha = 1;
      } else if (isDim) {
        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 0.4 / transform.k;
        ctx.globalAlpha = 0.3;
      } else {
        ctx.strokeStyle = EDGE;
        ctx.lineWidth = 0.8 / transform.k;
        ctx.globalAlpha = 0.6;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category)) return;
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
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, drawR + 10, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      // Node circle
      ctx.globalAlpha = isDim ? 0.08 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = isSel ? "#ff9500" : isHov ? "#0a84ff" : "rgba(255,255,255,0.25)";
      ctx.lineWidth = (isSel ? 3 : isHov ? 2.5 : 0.7) / transform.k;
      ctx.stroke();

      // Label
      var showLabel = isSel || isHov || isConn || isSearch;
      if (!showLabel && !active) {
        var maxLen = transform.k < 0.3 ? 0 : transform.k < 0.6 ? 3 : transform.k < 0.9 ? 8 : transform.k < 1.4 ? 15 : 999;
        if (maxLen > 0) showLabel = true;
      }

      if (showLabel) {
        var label = n.label;
        if (!isSel && !isHov && !isConn && !isSearch && !active) {
          var ml = transform.k < 0.3 ? 0 : transform.k < 0.6 ? 3 : transform.k < 0.9 ? 8 : transform.k < 1.4 ? 15 : 999;
          if (ml > 0 && label.length > ml) label = label.substring(0, ml - 1) + "…";
          if (ml === 0) return;
        }

        ctx.globalAlpha = isDim ? 0.08 : (isSel || isHov || isConn || isSearch) ? 1 : 0.5;
        ctx.fillStyle = isSel ? "#ff9500" : TEXT;
        ctx.font = ((isSel || isHov) ? "700 " : "500 ") + (10 / Math.max(transform.k, 0.5)) + "px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(label, n.x, n.y + drawR + 12 / transform.k);
      }
      ctx.globalAlpha = 1;
    });

    ctx.restore();
    ctx.restore();
    drawMinimap();
  }

  function drawMinimap() {
    var mw = 90, mh = 60, mx = W - mw - 8, my = H - mh - 8;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = isDark ? "rgba(30,30,30,0.8)" : "rgba(240,240,240,0.8)";
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 5);
    ctx.fill();

    if (graphNodes.length === 0) { ctx.restore(); return; }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category)) return;
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    });
    if (minX === maxX) { minX -= 100; maxX += 100; }
    if (minY === maxY) { minY -= 100; maxY += 100; }
    var p = 30; minX -= p; maxX += p; minY -= p; maxY += p;

    graphNodes.forEach(function (n) {
      if (!activeCategories.has(n.category)) return;
      var nx = mx + ((n.x - minX) / (maxX - minX)) * mw;
      var ny = my + ((n.y - minY) / (maxY - minY)) * mh;
      ctx.beginPath();
      ctx.arc(nx, ny, 1, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[n.category] || "#8e8e93";
      ctx.fill();
    });

    // Viewport box
    var vw = W / transform.k, vh = H / transform.k;
    var vcx = -transform.x / transform.k + W / (2 * transform.k);
    var vcy = -transform.y / transform.k + H / (2 * transform.k);
    var vx = mx + ((vcx - vw / 2 - minX) / (maxX - minX)) * mw;
    var vy = my + ((vcy - vh / 2 - minY) / (maxY - minY)) * mh;
    var vww = (vw / (maxX - minX)) * mw;
    var vhh = (vh / (maxY - minY)) * mh;
    ctx.strokeStyle = "#0a84ff";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, vww, vhh);
    ctx.restore();
  }

  // Hit test
  function hitTest(px, py) {
    var inverted = transform.invert([px, py]);
    var mx = inverted[0], my = inverted[1];
    for (var i = graphNodes.length - 1; i >= 0; i--) {
      var n = graphNodes[i];
      if (!activeCategories.has(n.category)) continue;
      var dx = mx - n.x, dy = my - n.y;
      var r = nodeR(n) + 6;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  }

  function showTooltip(node, px, py) {
    if (!tooltipEl) { tooltipEl = document.createElement("div"); tooltipEl.className = "graph-tooltip"; wrap.appendChild(tooltipEl); }
    var c = COLORS[node.category] || "#8e8e93";
    tooltipEl.innerHTML = '<div class="gt-title">' + node.label + '</div><div class="gt-cat" style="color:' + c + '">' + (node.category || "") + '</div>';
    tooltipEl.style.left = Math.min(px, W - 180) + "px";
    tooltipEl.style.top = (py - 50) + "px";
    tooltipEl.style.display = "block";
  }

  function hideTooltip() { if (tooltipEl) tooltipEl.style.display = "none"; }

  function selectNode(n) {
    if (selectedNode === n) { selectedNode = null; hideOpenButton(); }
    else { selectedNode = n; showOpenButton(n); }
  }

  function showOpenButton(n) {
    if (!openBtn || !n || !n.url) { hideOpenButton(); return; }
    openBtn.innerHTML = n.label + " → Open";
    openBtn.href = n.url;
    openBtn.style.display = "inline-flex";
  }

  function hideOpenButton() { if (openBtn) openBtn.style.display = "none"; }

  function updateFilterButtons() {
    document.querySelectorAll(".graph-filter-btn").forEach(function (btn) {
      var cat = btn.dataset.category;
      btn.classList.toggle("active", cat === "all" ? activeCategories.size === Object.keys(COLORS).length : activeCategories.has(cat));
    });
  }

  // Setup D3
  function setup(graphData) {
    graphNodes = graphData.nodes.map(function (n, i) {
      n.index = i;
      n.connections = 0;
      return n;
    });
    graphLinks = graphData.links.map(function (l) {
      return { source: l.source, target: l.target, strength: l.strength || 0.5 };
    });

    // Count connections
    var idxMap = {};
    graphNodes.forEach(function (n, i) { idxMap[n.id] = i; });
    var resolvedLinks = [];
    graphLinks.forEach(function (l) {
      var si = idxMap[l.source] !== undefined ? idxMap[l.source] : l.source;
      var ti = idxMap[l.target] !== undefined ? idxMap[l.target] : l.target;
      if (typeof si === "number" && typeof ti === "number") {
        resolvedLinks.push({ source: si, target: ti, strength: l.strength });
        graphNodes[si].connections++;
        graphNodes[ti].connections++;
      }
    });
    graphLinks = resolvedLinks;

    // Recalculate node radii
    graphNodes.forEach(function (n) { n.r = nodeR(n); });

    activeCategories = new Set(Object.keys(COLORS));
    updateFilterButtons();

    // D3 force simulation
    simulation = d3.forceSimulation(graphNodes)
      .force("link", d3.forceLink(graphLinks).id(function (d) { return d.index; }).distance(function (d) { return 80 + (1 - d.strength) * 60; }).strength(function (d) { return d.strength * 0.5; })
      .force("charge", d3.forceManyBody().strength(-200).distanceMax(400))
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force("collide", d3.forceCollide().radius(function (d) { return nodeR(d) + 4; }).strength(0.7))
      .force("x", d3.forceX(W / 2).strength(0.03))
      .force("y", d3.forceY(H / 2).strength(0.03))
      .alphaDecay(0.02)
      .on("tick", render);

    // D3 zoom
    var zoom = d3.zoom()
      .scaleExtent([0.1, 6])
      .on("zoom", function (e) {
        transform = e.transform;
        render();
      });

    d3.select(canvas).call(zoom);

    // Drag
    var drag = d3.drag()
      .on("start", function (e, d) {
        if (!e.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
        draggingNode = d;
      })
      .on("drag", function (e, d) {
        var p = transform.invert([e.sourceEvent.clientX - wrap.getBoundingClientRect().left, e.sourceEvent.clientY - wrap.getBoundingClientRect().top]);
        d.fx = p[0]; d.fy = p[1];
      })
      .on("end", function (e, d) {
        if (!e.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
        draggingNode = null;
      });

    d3.select(canvas).call(drag);

    // Click / hover
    d3.select(canvas)
      .on("mousemove", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var mx = e.clientX - rect.left, my = e.clientY - rect.top;
        var hit = hitTest(mx, my);
        if (hit !== hoveredNode) {
          hoveredNode = hit;
          canvas.style.cursor = hit ? "pointer" : "grab";
          if (hit) showTooltip(hit, mx, my); else hideTooltip();
          render();
        }
      })
      .on("click", function (e) {
        if (draggingNode) return;
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit) selectNode(hit); else { selectedNode = null; hideOpenButton(); render(); }
      })
      .on("dblclick", function (e) {
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        if (hit && hit.url) window.location.href = hit.url;
      });

    // Touch
    var touchStartTime = 0;
    canvas.addEventListener("touchstart", function (e) {
      touchStartTime = Date.now();
    }, { passive: true });

    canvas.addEventListener("touchend", function (e) {
      if (Date.now() - touchStartTime < 200 && e.changedTouches.length === 1) {
        var t = e.changedTouches[0];
        var rect = wrap.getBoundingClientRect();
        var hit = hitTest(t.clientX - rect.left, t.clientY - rect.top);
        if (hit) {
          if (selectedNode === hit) { window.location.href = hit.url; }
          else { selectNode(hit); render(); }
          e.preventDefault();
        }
      }
    });

    // Search
    window.graphHighlightNodes = function (ids) {
      highlightedSet.clear();
      ids.forEach(function (id) {
        graphNodes.forEach(function (n, i) {
          if (n.id === id || n.label.toLowerCase().indexOf(id.toLowerCase()) !== -1) highlightedSet.add(i);
        });
      });
      render();
    };
    window.graphClearHighlight = function () { highlightedSet.clear(); render(); };

    // Stats
    var stat = document.getElementById("graph-stats");
    if (stat) stat.textContent = graphNodes.length + " pages · " + graphLinks.length + " connections";

    // Initial render
    render();
  }

  // Filter buttons
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".graph-filter-btn");
    if (!btn) return;
    var cat = btn.dataset.category;
    if (cat === "all") {
      activeCategories = activeCategories.size === Object.keys(COLORS).length ? new Set() : new Set(Object.keys(COLORS));
    } else {
      activeCategories.has(cat) ? activeCategories.delete(cat) : activeCategories.add(cat);
    }
    updateFilterButtons();
    render();
  });

  // Reset / Freeze
  var resetBtn = document.getElementById("graph-reset");
  if (resetBtn) resetBtn.addEventListener("click", function () {
    selectedNode = null; hoveredNode = null; highlightedSet.clear();
    hideOpenButton(); hideTooltip();
    simulation.alpha(1).restart();
    render();
  });

  var freezeBtn = document.getElementById("graph-freeze");
  if (freezeBtn) freezeBtn.addEventListener("click", function () {
    if (simulation.alpha() > 0) { simulation.stop(); freezeBtn.textContent = "Unfreeze"; }
    else { simulation.alpha(0.3).restart(); freezeBtn.textContent = "Freeze"; }
  });

  // Search
  var gFuse;
  var CONTENT_INDEX = [
    {"id":"hub-product","title":"Product","url":"/contents/public/product/","category":"hub"},
    {"id":"hub-research","title":"Research","url":"/contents/public/research/","category":"hub"},
    {"id":"hub-solutions","title":"Solutions","url":"/contents/public/solutions/","category":"hub"},
    {"id":"hub-content","title":"Content Hub","url":"/contents/public/","category":"hub"},
    {"id":"hub-wiki","title":"Wiki","url":"/contents/wiki/","category":"hub"},
    {"id":"hub-portfolio","title":"Portfolio","url":"/contents/pkm/use-cases/","category":"hub"},
    {"id":"cv-3d","title":"3D Vision","url":"/contents/public/cv/3d/","category":"cv"},
    {"id":"cv-optical-flow","title":"Optical Flow","url":"/contents/public/cv/optical-flow/","category":"cv"},
    {"id":"cv-multi-camera","title":"Multi-Camera","url":"/contents/public/cv/multi-camera-systems/","category":"cv"},
    {"id":"cv-coaching","title":"CV Coaching","url":"/contents/public/coaching/","category":"cv"},
    {"id":"cv-overview","title":"CV Overview","url":"/contents/public/enter/","category":"cv"},
    {"id":"ai-llm-concepts","title":"LLM Concepts","url":"/contents/public/ai-llm/advanced-llm-concepts/","category":"ai"},
    {"id":"ai-agents","title":"AI Agents","url":"/contents/public/ai-llm/orchestrating-agents/","category":"ai"},
    {"id":"ai-blog","title":"AI Blog","url":"/contents/public/ai-llm/blog/","category":"ai"},
    {"id":"ai-avatar","title":"Avatar Generator","url":"/contents/public/ai-llm/avatar-generator/","category":"ai"},
    {"id":"cuda-numba","title":"Numba JIT","url":"/contents/public/cuda-gpu/numba-jit/","category":"cuda"},
    {"id":"cuda-pycuda","title":"PyCUDA","url":"/contents/public/cuda-gpu/pycuda-kernels/","category":"cuda"},
    {"id":"cuda-vscode","title":"CUDA VS Code","url":"/contents/public/cuda-gpu/vscode-cuda-windows/","category":"cuda"},
    {"id":"cuda-mlx","title":"MLX CoreML","url":"/contents/public/cuda-gpu/mlx-coreml-metal/","category":"cuda"},
    {"id":"paper-adaptive-seg","title":"Adaptive Segmentation","url":"/contents/publications/Papers/adaptive-image-segmentation-psnr/","category":"paper"},
    {"id":"paper-license-entropy","title":"License Plate Entropy","url":"/contents/publications/Papers/license-plate-recognition-entropy/","category":"paper"},
    {"id":"paper-multi-threshold","title":"Multi-threshold Plate","url":"/contents/publications/Papers/multi-threshold-license-plate/","category":"paper"},
    {"id":"paper-handwritten","title":"Thresholding Handwritten","url":"/contents/publications/Papers/comparison-thresholding-handwritten/","category":"paper"},
    {"id":"paper-camera-cal","title":"Camera Calibration","url":"/contents/publications/Papers/camera-calibration-multi-modal/","category":"paper"},
    {"id":"paper-pattern","title":"Pattern Calibration","url":"/contents/publications/Papers/pattern-image-calibration/","category":"paper"},
    {"id":"paper-2d3d","title":"2D vs 3D Map","url":"/contents/publications/Papers/2d-3d-map-movement/","category":"paper"},
    {"id":"paper-char","title":"Character Recognition","url":"/contents/publications/Papers/character-recognition-global-feature/","category":"paper"},
    {"id":"paper-class","title":"Classification","url":"/contents/publications/Papers/classification-geometrical-topological/","category":"paper"},
    {"id":"paper-tafresh","title":"TafreshGrid","url":"/contents/publications/Papers/tafreshgrid-grid-computing/","category":"paper"},
    {"id":"journal-psnr","title":"Adaptive PSNR","url":"/contents/publications/Journals/adaptive-thresholding-psnr/","category":"journal"},
    {"id":"journal-gsft","title":"GSFT-PSNR","url":"/contents/publications/Journals/gsft-psnr-fuzzy-threshold/","category":"journal"},
    {"id":"journal-seg","title":"PSNR Segmentation","url":"/contents/publications/Journals/psnr-threshold-segmentation/","category":"journal"},
    {"id":"journal-char","title":"Character Recognition","url":"/contents/publications/Journals/character-object-recognition/","category":"journal"},
    {"id":"journal-slam","title":"3D SLAM","url":"/contents/publications/Journals/3d-slam-humanoid-robots/","category":"journal"},
    {"id":"journal-ant","title":"Ant Colony","url":"/contents/publications/Journals/ant-colony-optimization/","category":"journal"},
    {"id":"book-optflow","title":"Optical Flow Book","url":"/contents/publications/Books/computational-intelligence-optical-flow/","category":"book"},
    {"id":"book-camcal","title":"Camera Calibration Book","url":"/contents/publications/Books/camera-calibration-video-stabilization/","category":"book"},
    {"id":"book-cvllm","title":"CV Meets LLM","url":"/contents/publications/Books/AI/computer-vision-meets-llm/","category":"book"},
    {"id":"book-opencv0","title":"OpenCV 5 Ch.0","url":"/contents/publications/Books/AI/opencv5-chapter0-introduction/","category":"book"},
    {"id":"book-opencv1","title":"OpenCV 5 Ch.1","url":"/contents/publications/Books/AI/opencv5-chapter1-image-basics/","category":"book"},
    {"id":"book-opencv2","title":"OpenCV 5 Ch.2","url":"/contents/publications/Books/AI/opencv5-chapter2-feature-detection/","category":"book"},
    {"id":"book-opencv3","title":"OpenCV 5 Ch.3","url":"/contents/publications/Books/AI/opencv5-chapter3-advanced/","category":"book"},
    {"id":"patent-face","title":"Face Augmentation","url":"/contents/publications/Patents/face-image-augmentation/","category":"patent"},
    {"id":"patent-facial","title":"Facial Analysis Ad","url":"/contents/publications/Patents/facial-analysis-advertisement/","category":"patent"},
    {"id":"patent-vehicle","title":"Vehicle Detection","url":"/contents/publications/Patents/vehicle-detection/","category":"patent"},
    {"id":"keynote-llm","title":"LLMs Meet CV","url":"/contents/publications/Keynotes/llms-meet-computer-vision/","category":"keynote"},
    {"id":"course-ml","title":"ML Specialization","url":"/contents/ai2026/machine-learning-specialization/","category":"course"},
    {"id":"course-fsdl","title":"Full Stack DL","url":"/contents/ai2026/full-stack-deep-learning/","category":"course"},
    {"id":"course-mlops","title":"MLOps","url":"/contents/ai2026/mlops/","category":"course"},
    {"id":"course-ros","title":"ROS","url":"/contents/ai2026/ros/","category":"course"},
    {"id":"course-parallel","title":"Parallel Programming","url":"/contents/ai2026/parallel-programming/","category":"course"},
    {"id":"course-cpp","title":"Modern C++","url":"/contents/ai2026/modern-cpp/","category":"course"},
    {"id":"course-k8s","title":"Cloud-Native","url":"/contents/ai2026/cloud-native/","category":"course"},
    {"id":"course-tf","title":"TensorFlow Deploy","url":"/contents/ai2026/tensorflow-deployment/","category":"course"},
    {"id":"course-riscv","title":"RISC-V","url":"/contents/ai2026/risc-v/","category":"course"},
    {"id":"course-edgeai","title":"Edge AI Summit","url":"/contents/ai2026/edge-ai-summit/","category":"course"},
    {"id":"course-iot","title":"Embedded IoT","url":"/contents/ai2026/embedded-iot/","category":"course"},
    {"id":"course-tesla","title":"Tesla AI","url":"/contents/ai2026/tesla/","category":"course"},
    {"id":"course-hardware","title":"AI Hardware","url":"/contents/ai2026/ai-hardware/","category":"course"},
    {"id":"course-openvino","title":"OpenVINO","url":"/contents/ai2026/openvino/","category":"course"},
    {"id":"course-metaverse","title":"Metaverse XR","url":"/contents/ai2026/metaverse/","category":"course"},
    {"id":"course-books","title":"Book Summaries","url":"/contents/ai2026/book-summary/","category":"course"},
    {"id":"course-scholarship","title":"IoT Scholarship","url":"/contents/ai2026/iot-scholarship/","category":"course"},
    {"id":"pkm-toc","title":"Data DevOps","url":"/contents/pkm/TOC/","category":"pkm"},
    {"id":"pkm-links","title":"Curated Links","url":"/contents/pkm/links/","category":"pkm"},
    {"id":"pkm-proof","title":"Site Links","url":"/contents/pkm/proof/","category":"pkm"},
    {"id":"biz-startup","title":"Startup Guide","url":"/contents/public/startup/","category":"business"},
    {"id":"biz-seo","title":"SEO for LLMs","url":"/contents/public/seo/","category":"business"},
    {"id":"biz-linkedin","title":"LinkedIn Posts","url":"/contents/public/linkedin-top-posts/","category":"business"},
    {"id":"biz-cpp","title":"C++ Reference","url":"/contents/public/cpp/","category":"business"},
    {"id":"biz-python","title":"Python Config","url":"/contents/public/python/","category":"business"},
    {"id":"biz-optimization","title":"Optimization","url":"/contents/public/optimization/","category":"business"},
    {"id":"biz-prompts","title":"Prompts","url":"/contents/public/prompts/","category":"business"},
    {"id":"biz-setup","title":"Developer Tools","url":"/contents/public/setup/","category":"business"},
    {"id":"biz-shell","title":"Shell Vim Ref","url":"/contents/public/shell-vim-quickref/","category":"business"},
    {"id":"biz-token","title":"Token Presentation","url":"/contents/ppt/farshid-ai-cv-llm-presentation/","category":"business"},
    {"id":"biz-10years","title":"10 Years Bugs","url":"/contents/publications/10Years/","category":"business"},
    {"id":"biz-cv","title":"CV","url":"/contents/publications/CV/","category":"business"}
  ];

  function initSearch() {
    gFuse = new Fuse(CONTENT_INDEX, {
      keys: [{ name: "title", weight: 2 }],
      threshold: 0.4, minMatchCharLength: 2
    });

    var input = document.getElementById("graph-search-input");
    var countEl = document.getElementById("graph-search-results");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q || q.length < 2) { window.graphClearHighlight(); countEl.textContent = ""; return; }
      var results = gFuse.search(q);
      if (results.length === 0) { window.graphClearHighlight(); countEl.textContent = "No matches"; return; }
      var ids = results.map(function (r) { return r.item.id; });
      window.graphHighlightNodes(ids);
      countEl.textContent = results.length + " highlighted";
    });
  }

  // Init
  resize();
  window.addEventListener("resize", function () { resize(); if (simulation) { simulation.force("center", d3.forceCenter(W / 2, H / 2)); simulation.force("x", d3.forceX(W / 2).strength(0.03)); simulation.force("y", d3.forceY(H / 2).strength(0.03)); render(); } });

  var graphFile = wrap.dataset.graph || "/assets/graph.json";
  fetch(graphFile)
    .then(function (r) { return r.json(); })
    .then(function (data) { setup(data); initSearch(); })
    .catch(function () { var s = document.getElementById("graph-stats"); if (s) s.textContent = "Graph data missing"; });
})();
