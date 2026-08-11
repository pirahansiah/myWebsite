/* =========================================================================
   WebGPU LLM Search — in-browser LLM (Qwen1.5-0.5B via transformers.js,
   WebGPU with WASM fallback) over the full-text site index (llm-index.json)
   with TF-IDF retrieval, streaming answers, and a connection dashboard
   built from graph.json.
   Based on the local in-browser LLM diagnostic (dynamicLLM/a).
   ========================================================================= */
(function () {
  "use strict";

  var MODEL = "Xenova/Qwen1.5-0.5B-Chat";
  // v3.8.1 = last stable with mature WebGPU support (v4.x WebGPU runtime is buggy)
  var CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
  var INDEX_URL = "/assets/llm-index.json";
  var GRAPH_URL = "/assets/graph.json";

  var $ = function (id) { return document.getElementById(id); };

  /* ------------------- shared model loading (from dynamicLLM) ----------- */
  var sharedPipelineModule = null;
  var sharedGenerator = null;
  var sharedDevice = null; // "webgpu" | "wasm"

  function loadPipelineModule() {
    if (!sharedPipelineModule) {
      return import(CDN).then(function (mod) {
        if (!mod.pipeline) throw new Error("Transformers.js loaded, but pipeline() is unavailable.");
        sharedPipelineModule = mod;
        return mod;
      });
    }
    return Promise.resolve(sharedPipelineModule);
  }

  function disposeSharedGenerator() {
    if (sharedGenerator && sharedGenerator.model && typeof sharedGenerator.model.dispose === "function") {
      try { sharedGenerator.model.dispose(); } catch (e) { console.warn("Cleanup warning:", e); }
    }
    sharedGenerator = null;
    sharedDevice = null;
    return Promise.resolve();
  }

  function ensureGenerator(onStatus, onProgress) {
    if (sharedGenerator) {
      onStatus && onStatus("Reusing already-loaded " + sharedDevice.toUpperCase() + " model.");
      return Promise.resolve(sharedGenerator);
    }
    onStatus && onStatus("Checking secure browser context...");
    if (!window.isSecureContext) return Promise.reject(new Error("This requires a secure context (https:// or localhost)."));

    return loadPipelineModule().then(function () {
      var tryLoad = function (device) {
        onStatus && onStatus("Downloading Qwen1.5-0.5B model (" + device.toUpperCase() + ")...");
        return sharedPipelineModule.pipeline("text-generation", MODEL, {
          device: device,
          dtype: device === "webgpu" ? "q4" : "fp32",
          progress_callback: function (d) {
            if (!d) return;
            if (d.status === "progress") {
              onStatus && onStatus("Downloading " + ((d.file || "").split("/").pop() || "model file") + "...");
              onProgress && onProgress(d.progress);
            } else if (d.status === "initiate" || d.status === "start") {
              onStatus && onStatus("Starting model download...");
            } else if (d.status === "done") {
              onStatus && onStatus("Model file downloaded.");
            } else if (d.status === "ready") {
              onStatus && onStatus("Model loaded. Preparing " + device.toUpperCase() + " inference...");
            }
          }
        });
      };

      var webgpuOk = false;
      if (navigator.gpu) {
        return navigator.gpu.requestAdapter().then(function (adapter) {
          webgpuOk = !!adapter;
          return webgpuOk ? tryLoad("webgpu") : null;
        }).then(function (gen) {
          if (gen) { sharedGenerator = gen; sharedDevice = "webgpu"; return gen; }
          if (!webgpuOk) onStatus && onStatus("WebGPU unavailable - using WASM (slower)...");
          return tryLoad("wasm").then(function (gen) {
            sharedGenerator = gen; sharedDevice = "wasm"; return gen;
          });
        }).catch(function (webgpuErr) {
          console.warn("WebGPU pipeline failed, falling back to WASM:", webgpuErr);
          return disposeSharedGenerator().then(function () {
            onStatus && onStatus("WebGPU runtime crashed - retrying on WASM (slower)...");
            onProgress && onProgress(0);
            return tryLoad("wasm").then(function (gen) {
              sharedGenerator = gen; sharedDevice = "wasm"; return gen;
            });
          });
        });
      }
      onStatus && onStatus("WebGPU unavailable - using WASM (slower)...");
      return tryLoad("wasm").then(function (gen) {
        sharedGenerator = gen; sharedDevice = "wasm"; return gen;
      });
    });
  }

  /* ------------------- retrieval index (TF-IDF, from dynamicLLM) --------- */
  var STOPWORDS = new Set("a an the is are was were be been being of to in on for with and or but not this that these those it its as at by from into about how what when where why who which do does did can could should would will shall".split(" "));
  function tokenize(str) {
    return (String(str).toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (t) { return t.length > 1 && !STOPWORDS.has(t); });
  }

  function chunkText(text, filename, maxLen) {
    maxLen = maxLen || 700;
    // Split on markdown headings first (like the original dynamicLLM chunker),
    // then pack paragraphs into ~maxLen chunks.
    var lines = String(text).split(/\r?\n/);
    var sections = [];
    var current = { heading: filename, lines: [] };
    for (var i = 0; i < lines.length; i++) {
      var m = /^#{1,6}\s+(.*)/.exec(lines[i]);
      if (m) {
        if (current.lines.join("\n").trim()) sections.push(current);
        current = { heading: m[1].trim(), lines: [] };
      } else {
        current.lines.push(lines[i]);
      }
    }
    if (current.lines.join("\n").trim()) sections.push(current);

    var chunks = [];
    for (var s = 0; s < sections.length; s++) {
      var body = sections[s].lines.join("\n").trim();
      if (!body) continue;
      var paras = body.split(/\n\s*\n/);
      var buf = "";
      for (var q = 0; q < paras.length; q++) {
        var p = paras[q].trim();
        if (!p) continue;
        if (buf && (buf + "\n\n" + p).length > maxLen) { chunks.push({ file: filename, heading: sections[s].heading, text: buf.trim() }); buf = p; }
        else buf = buf ? buf + "\n\n" + p : p;
      }
      if (buf.trim()) chunks.push({ file: filename, heading: sections[s].heading, text: buf.trim() });
    }
    return chunks;
  }

  var pages = [];       // raw index entries
  var chunks = [];      // {file, text}
  var tokenized = [];   // tokens per chunk
  var idf = new Map();
  var graphNodes = [];  // graph.json nodes
  var graphLinks = [];  // graph.json links
  var urlToNode = {};   // page url (normalized) -> node id (prefer note/moc)

  function normalizeUrl(u) {
    return String(u || "").replace(/\/+$/, "").toLowerCase();
  }

  function buildIndex(data) {
    pages = data;
    chunks = [];
    pages.forEach(function (p) {
      var body = p.body || "";
      if (p.hashtags) body += " " + p.hashtags;
      chunks = chunks.concat(chunkText(body, p.url));
    });
    var df = new Map();
    tokenized = chunks.map(function (c) { return tokenize(c.text); });
    tokenized.forEach(function (tokens) {
      new Set(tokens).forEach(function (t) { df.set(t, (df.get(t) || 0) + 1); });
    });
    var N = chunks.length;
    idf = new Map();
    df.forEach(function (count, term) { idf.set(term, Math.log((N + 1) / (count + 1)) + 1); });
  }

  function retrieve(query, topK) {
    topK = topK || 12;
    var qTokens = tokenize(query);
    if (!qTokens.length) return [];
    var scored = chunks.map(function (c, i) {
      var tf = new Map();
      tokenized[i].forEach(function (t) { tf.set(t, (tf.get(t) || 0) + 1); });
      var score = 0;
      qTokens.forEach(function (qt) { if (tf.has(qt)) score += tf.get(qt) * (idf.get(qt) || 1); });
      return { chunk: c, score: score / Math.sqrt(tokenized[i].length + 1) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.filter(function (s) { return s.score > 0; }).slice(0, topK);
  }

  /* ------------------- graph connections -------------------------------- */
  function setupGraph(g) {
    graphNodes = g.nodes || [];
    graphLinks = g.links || [];
    urlToNode = {};
    // Prefer page/hub nodes (note/moc) over tag nodes for the same URL
    graphNodes.forEach(function (n) {
      if (!n.url || String(n.url).indexOf("/view/") === 0) return;
      var key = normalizeUrl(n.url);
      var existing = urlToNode[key];
      if (!existing || existing.kind === "tag" || existing.kind === "asset") {
        if (n.kind !== "tag" && n.kind !== "asset") urlToNode[key] = n;
      }
    });
  }

  function nodeById(id) {
    for (var i = 0; i < graphNodes.length; i++) if (graphNodes[i].id === id) return graphNodes[i];
    return null;
  }

  function relatedForUrl(pageUrl) {
    var node = urlToNode[normalizeUrl(pageUrl)];
    if (!node) return { pages: [], tags: [] };
    var pagesSet = {}, tagsSet = {};
    graphLinks.forEach(function (l) {
      var s = typeof l.source === "object" ? l.source.id : l.source;
      var t = typeof l.target === "object" ? l.target.id : l.target;
      var otherId = null;
      if (s === node.id) otherId = t;
      else if (t === node.id) otherId = s;
      if (!otherId || otherId === node.id) return;
      var other = nodeById(otherId);
      if (!other) return;
      if (other.kind === "tag") {
        tagsSet[other.label || other.id] = true;
      } else if (other.url && String(other.url).indexOf("/view/") !== 0) {
        pagesSet[other.url] = { label: other.label || other.url, url: other.url };
      }
    });
    return { pages: Object.values(pagesSet).slice(0, 8), tags: Object.keys(tagsSet).slice(0, 8) };
  }

  /* ------------------- UI ------------------------------------------------ */
  var ui = {
    stats: $("llm-stats"), status: $("llm-status-text"), progressWrap: $("llm-progress"),
    progressBar: $("llm-progress-bar"), badge: $("llm-device-badge"), badgeText: $("llm-device-text"),
    answer: $("llm-answer"), answerBody: $("llm-answer-body"), sources: $("llm-sources"),
    results: $("llm-results"), resultsHead: $("llm-results-head"), count: $("llm-count"),
    conn: $("llm-conn"), canvas: $("llm-conn-canvas"), hint: $("llm-hint-line"),
    q: $("llm-query"), askBtn: $("llm-ask-btn"), initBtn: $("llm-init-btn")
  };

  function setProgress(n) {
    n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    ui.progressBar.style.width = n + "%";
    ui.progressBar.textContent = n + "%";
  }

  function setStatus(msg, showBar) {
    ui.status.textContent = msg || "";
    ui.progressWrap.style.display = showBar ? "block" : "none";
  }

  function setDeviceBadge(state, text) {
    ui.badge.className = "llm-badge " + state;
    ui.badgeText.textContent = text;
  }

  function pageMeta(url) {
    for (var i = 0; i < pages.length; i++) if (pages[i].url === url) return pages[i];
    return null;
  }

  function highlight(text, query) {
    var tokens = tokenize(query);
    if (!tokens.length || !text) return text;
    var re = new RegExp("(" + tokens.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    return String(text).replace(re, "<mark>$1</mark>");
  }

  function snippetFor(text, query, len) {
    len = len || 220;
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (text.length <= len) return text;
    var tokens = tokenize(query);
    var idx = -1;
    tokens.forEach(function (t) {
      var at = text.toLowerCase().indexOf(t);
      if (at >= 0 && (idx < 0 || at < idx)) idx = at;
    });
    var start = idx > 60 ? idx - 40 : 0;
    return (start > 0 ? "…" : "") + text.substring(start, start + len) + "…";
  }

  function renderResults(query, top, limit) {
    limit = limit || 12;
    ui.results.innerHTML = "";
    if (!top.length) {
      ui.results.innerHTML = '<div class="llm-empty">Nothing matched that query. Try different keywords.</div>';
      ui.count.textContent = "0";
      return;
    }
    ui.count.textContent = top.length;
    var shown = 0;
    top.forEach(function (r) {
      if (shown >= limit) return;
      var meta = pageMeta(r.chunk.file);
      var title = meta ? meta.title : r.chunk.file;
      var cat = meta ? meta.category : "hub";
      var tags = (meta && meta.tags) ? meta.tags : [];
      var hashes = (meta && meta.hashtags) ? String(meta.hashtags).split(/\s+/).filter(Boolean) : [];
      var rel = relatedForUrl(r.chunk.file);
      var pct = Math.min(100, Math.round((r.score / (top[0].score || 1)) * 100));
      var snippet = snippetFor(r.chunk.text, query);
      var html = '<div class="llm-card">' +
        '<div class="llm-card-top"><span class="llm-card-title"><a href="' + r.chunk.file + '">' + (title || r.chunk.file) + '</a></span>' +
        '<span class="llm-cat ' + cat + '">' + cat + '</span></div>' +
        '<div class="llm-score-row"><div class="llm-score-bar"><div class="llm-score-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="llm-score-val">' + pct + '%</span></div>' +
        '<div class="llm-snippet">' + highlight(snippet, query) + '</div>';
      if (tags.length || hashes.length) {
        html += '<div class="llm-tags-row">' +
          tags.slice(0, 6).map(function (t) { return '<span class="llm-tag">#' + t + '</span>'; }).join("") +
          hashes.slice(0, 4).map(function (h) { return '<span class="llm-tag hashtag">' + h + '</span>'; }).join("") +
          '</div>';
      }
      if (rel.pages.length) {
        html += '<div class="llm-related"><b>Connected:</b> ' +
          rel.pages.map(function (p) { return '<a href="' + p.url + '" class="rel-link" title="' + p.label + '">' + p.label + '</a>'; }).join("") +
          '</div>';
      }
      html += '</div>';
      ui.results.insertAdjacentHTML("beforeend", html);
      shown++;
    });
  }

  /* ------------------- connection force graph (d3) ----------------------- */
  var connSim = null;
  function renderConnections(query, top) {
    ui.conn.classList.add("visible");
    var seed = top.slice(0, 8).map(function (r) { return urlToNode[normalizeUrl(r.chunk.file)]; }).filter(Boolean);
    if (!seed.length) { ui.conn.style.display = "none"; return; }
    var keep = {};
    var nodesById = {};
    seed.forEach(function (n) { keep[n.id] = n; });
    var maxNeighbors = 4;
    seed.forEach(function (n) {
      var count = 0;
      graphLinks.forEach(function (l) {
        if (count >= maxNeighbors) return;
        var s = typeof l.source === "object" ? l.source.id : l.source;
        var t = typeof l.target === "object" ? l.target.id : l.target;
        var otherId = s === n.id ? t : (t === n.id ? s : null);
        if (!otherId) return;
        var other = nodeById(otherId);
        if (!other || !other.url || String(other.url).indexOf("/view/") === 0) return;
        keep[other.id] = other;
        count++;
      });
    });
    var nodes = Object.values(keep);
    var nodeSet = new Set(nodes.map(function (n) { return n.id; }));
    var links = [];
    var seen = {};
    graphLinks.forEach(function (l) {
      var s = typeof l.source === "object" ? l.source.id : l.source;
      var t = typeof l.target === "object" ? l.target.id : l.target;
      if (!nodeSet.has(s) || !nodeSet.has(t) || s === t) return;
      var key = [s, t].sort().join("|");
      if (seen[key]) return;
      seen[key] = true;
      links.push({ source: s, target: t, kind: l.kind || "link" });
    });

    var wrap = ui.conn;
    var W = wrap.clientWidth || 600;
    var H = 240;
    var svg = d3.select(ui.canvas).attr("width", W).attr("height", H);
    svg.selectAll("*").remove();
    var COLORS = { hub: "#0a84ff", page: "#30d158", tag: "#af52de", asset: "#8e8e93", moc: "#0a84ff", note: "#30d158" };
    var g = svg.append("g");
    var sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function (d) { return d.id; }).distance(70).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-180).distanceMax(240))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide().radius(16))
      .alphaDecay(0.08);

    var link = g.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", "rgba(139,148,158,0.25)").attr("stroke-width", 0.8);
    var node = g.append("g").selectAll("circle").data(nodes).enter().append("circle")
      .attr("r", function (d) { return d.id === urlToNode[normalizeUrl(query)] ? 0 : 7; })
      .attr("fill", function (d) { return COLORS[d.kind] || "#8e8e93"; })
      .attr("stroke", "#fff").attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("click", function (e, d) { if (d.url) window.location.href = d.url; })
      .append("title").text(function (d) { return (d.label || d.id) + (d.url ? " — open" : ""); });

    var label = g.append("g").selectAll("text").data(nodes).enter().append("text")
      .text(function (d) { var l = d.label || d.id; return l.length > 22 ? l.substring(0, 20) + "…" : l; })
      .attr("font-size", 9).attr("fill", "var(--text-muted)").attr("text-anchor", "middle")
      .attr("dy", 16);

    sim.on("tick", function () {
      link.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      node.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      label.attr("x", function (d) { return d.x; }).attr("y", function (d) { return d.y; });
    });
    connSim = sim;
  }

  /* ------------------- LLM answer ---------------------------------------- */
  function buildContext(top, maxChars) {
    maxChars = maxChars || 5200;
    var ctx = [], used = 0;
    top.forEach(function (r) {
      if (used >= maxChars) return;
      var meta = pageMeta(r.chunk.file);
      var head = meta ? meta.title : r.chunk.file;
      var text = r.chunk.text;
      if (used + text.length > maxChars) text = text.substring(0, maxChars - used);
      ctx.push("### Source: " + head + " (" + r.chunk.file + ")\n" + text);
      used += text.length;
    });
    return ctx.join("\n\n");
  }

  function askLLM(query, top) {
    ui.answer.classList.add("visible");
    ui.answerBody.textContent = "";
    ui.sources.innerHTML = "";
    ui.askBtn.disabled = true;
    var context = buildContext(top);
    var streamer = null;
    ensureGenerator(
      function (msg) { setStatus(msg, true); },
      setProgress
    ).then(function (generator) {
      setStatus("Generating answer on " + sharedDevice.toUpperCase() + "...", false);
      setDeviceBadge("ok", sharedDevice.toUpperCase());
      return loadPipelineModule().then(function () {
        streamer = new sharedPipelineModule.TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          callback_function: function (t) { ui.answerBody.textContent += t; }
        });
        var messages = [
          { role: "system", content: "You are a research assistant for the pirahansiah.com knowledge site. Answer using ONLY the document excerpts below. Always name the source file(s) you used, like (source: /notes/.../). If the excerpts don't contain enough information, say so plainly instead of guessing." },
          { role: "user", content: "Document excerpts:\n\n" + context + "\n\nQuestion: " + query }
        ];
        return generator(messages, { max_new_tokens: 240, do_sample: false, streamer: streamer });
      });
    }).then(function (result) {
      if (!ui.answerBody.textContent.trim()) {
        var x = result && result[0] && result[0].generated_text;
        if (typeof x === "string") ui.answerBody.textContent = x;
        else if (Array.isArray(x)) ui.answerBody.textContent = x[x.length - 1] && x[x.length - 1].content || "";
      }
      var unique = [];
      top.forEach(function (r) { if (unique.indexOf(r.chunk.file) < 0) unique.push(r.chunk.file); });
      ui.sources.innerHTML = "Sources: " + unique.map(function (f) {
        var meta = pageMeta(f);
        return '<a href="' + f + '" target="_blank" rel="noopener">' + (meta ? meta.title : f) + '</a>';
      }).join("");
      setStatus("Done (" + sharedDevice.toUpperCase() + ").", false);
      ui.askBtn.disabled = false;
    }).catch(function (e) {
      console.error(e);
      ui.answerBody.textContent = "LLM unavailable: " + (e && e.message || e) + "\n\n(Keyword results below are still valid.)";
      setStatus("LLM error — keyword results shown.", false);
      ui.askBtn.disabled = false;
    });
  }

  /* ------------------- main search flow ----------------------------------- */
  function doSearch() {
    var q = ui.q.value.trim();
    if (q.length < 2) {
      ui.results.innerHTML = "";
      ui.count.textContent = "";
      ui.answer.classList.remove("visible");
      ui.conn.classList.remove("visible");
      return;
    }
    var top = retrieve(q, 14);
    renderResults(q, top);
    if (typeof d3 !== "undefined") renderConnections(q, top);
    var meta = pages.length + " pages · " + chunks.length + " sections indexed";
    ui.resultsHead.style.display = top.length ? "flex" : "none";
    setStatus(top.length ? top.length + " relevant sections found." : "No matches.", false);
    ui.stats.textContent = meta;
    if (top.length) {
      askLLM(q, top.slice(0, 5));
    }
  }

  function init() {
    setDeviceBadge("warn", "checking GPU");
    if (navigator.gpu) {
      navigator.gpu.requestAdapter().then(function (a) {
        setDeviceBadge(a ? "ok" : "warn", a ? "WebGPU ready" : "WASM fallback");
      }).catch(function () { setDeviceBadge("warn", "WASM fallback"); });
    } else {
      setDeviceBadge("warn", "WASM fallback");
    }

    Promise.all([
      fetch(INDEX_URL).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }),
      fetch(GRAPH_URL).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    ]).then(function (arr) {
      buildIndex(arr[0]);
      setupGraph(arr[1]);
      ui.stats.textContent = pages.length + " pages · " + chunks.length + " sections indexed";
      setStatus("Ready. Ask a question or type keywords — results stream in live.", false);
      ui.q.disabled = false;
      ui.askBtn.disabled = false;
    }).catch(function (e) {
      console.error(e);
      setStatus("Could not load index (" + e.message + ").", false);
      ui.hint.textContent = "Index unavailable — try again later.";
    });

    ui.q.addEventListener("keydown", function (e) { if (e.key === "Enter") doSearch(); });
    ui.askBtn.addEventListener("click", doSearch);
    document.querySelectorAll(".llm-suggest button").forEach(function (b) {
      b.addEventListener("click", function () { ui.q.value = b.getAttribute("data-q"); doSearch(); ui.q.focus(); });
    });
    ui.initBtn.addEventListener("click", function () {
      ensureGenerator(
        function (msg) { setStatus(msg, true); },
        setProgress
      ).then(function () {
        setStatus("Model ready on " + sharedDevice.toUpperCase() + ".", false);
        setDeviceBadge("ok", sharedDevice.toUpperCase());
      }).catch(function (e) {
        setStatus("Model load failed: " + (e && e.message || e), false);
        setDeviceBadge("err", "load failed");
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
