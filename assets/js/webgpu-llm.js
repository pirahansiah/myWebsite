/* =========================================================================
   WebGPU LLM Search — in-browser LLM (Qwen1.5-0.5B via transformers.js,
   WebGPU with WASM fallback) over the full-text site index (llm-index.json)
   with TF-IDF retrieval, streaming answers, a connection dashboard built
   from graph.json, plus a ChatGPT-style conversation panel.

   Based on the local in-browser LLM diagnostic (dynamicLLM/a).
   ========================================================================= */
(function () {
  "use strict";

  // v3.8.1 = last stable with mature WebGPU support (v4.x WebGPU runtime is buggy)
  var CDN = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
  var INDEX_URL = "/assets/llm-index.json";
  var GRAPH_URL = "/assets/graph.json";

  // Model picker: 3 options, small for phones -> large for powerful laptops.
  // Persisted in localStorage; the pipeline is reloaded on change.
  var MODEL_OPTIONS = [
    { id: "Xenova/Qwen1.5-0.5B-Chat", label: "Tiny — 0.5B", size: "~0.5 GB", note: "iPhone / slow devices" },
    { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Medium — 1.5B", size: "~1.2 GB", note: "Laptop" },
    { id: "onnx-community/Llama-3.2-3B-Instruct", label: "Large — 3B", size: "~2 GB", note: "Powerful GPU" }
  ];
  var MODEL_KEY = "llm-model-id";
  function selectedModelId() {
    var saved = null;
    try { saved = localStorage.getItem(MODEL_KEY); } catch (e) {}
    var found = null;
    MODEL_OPTIONS.forEach(function (o) { if (o.id === saved) found = o.id; });
    return found || MODEL_OPTIONS[0].id;
  }
  function saveModelId(id) {
    try { localStorage.setItem(MODEL_KEY, id); } catch (e) {}
  }

  var $ = function (id) { return document.getElementById(id); };

  /* ------------------- shared model loading (from dynamicLLM) ----------- */
  var sharedPipelineModule = null;
  var sharedGenerator = null;
  var sharedDevice = null;   // "webgpu" | "wasm"
  var sharedDtype = null;    // "q4f16" | "q4" | "int8" | "fp32"

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

  // Try WebGPU first, fall back to WASM (q8 quantized — ~500MB, same as the
  // notice promises; fp32 would be ~1GB and often fails on Safari).
  function ensureGenerator(onStatus, onProgress) {
    if (sharedGenerator) {
      onStatus && onStatus("Reusing already-loaded " + deviceLabel() + " model.");
      return Promise.resolve(sharedGenerator);
    }
    onStatus && onStatus("Checking secure browser context...");
    if (!window.isSecureContext) return Promise.reject(new Error("This requires a secure context (https:// or localhost)."));

    return loadPipelineModule().then(function () {
      var tryLoad = function (device, dtype) {
        onStatus && onStatus("Downloading " + (selectedModelId().split("/").pop() || "model") + " (" + device.toUpperCase() + ", " + dtype + ")...");
        return sharedPipelineModule.pipeline("text-generation", selectedModelId(), {
          device: device,
          dtype: dtype,
          progress_callback: function (d) {
            if (!d) return;
            if (d.status === "progress") {
              onStatus && onStatus("Downloading " + ((d.file || "").split("/").pop() || "model file") + "… " + (Math.round(Number(d.progress) || 0)) + "%");
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

      var loadWasm = function () {
        // int8 (8-bit, RAM-light, exists for all 3 models) -> fp32 guaranteed.
        // q8 files don't exist for these models, and q4 is WebGPU-only in
        // transformers.js v3, so the old q8->fp32 chain hit 6GB RAM on M3.
        var dtype = "int8";
        return tryLoad("wasm", "int8").catch(function (e) {
          console.warn("WASM int8 failed, retrying fp32:", e);
          dtype = "fp32";
          return tryLoad("wasm", "fp32");
        }).then(function (gen) {
          sharedGenerator = gen;
          sharedDevice = "wasm";
          sharedDtype = dtype;
          return gen;
        });
      };

      // WebGPU dtype ladder: q4f16 (fp16 compute, lightest) -> q4 (fp32
      // compute, works on every WebGPU incl. Safari without shader-f16).
      var tryWebgpuDtypes = function () {
        return tryLoad("webgpu", "q4f16").then(function (g) {
          sharedDtype = "q4f16"; return g;
        }).catch(function (e) {
          console.warn("WebGPU q4f16 failed, retrying q4:", e);
          return tryLoad("webgpu", "q4").then(function (g) {
            sharedDtype = "q4"; return g;
          });
        });
      };

      var webgpuOk = false;
      if (navigator.gpu) {
        return navigator.gpu.requestAdapter().then(function (adapter) {
          webgpuOk = !!adapter;
          return webgpuOk ? tryWebgpuDtypes() : null;
        }).then(function (gen) {
          if (gen) { sharedGenerator = gen; sharedDevice = "webgpu"; return gen; }
          if (!webgpuOk) onStatus && onStatus("WebGPU unavailable - using WASM (slower)...");
          return loadWasm();
        }).catch(function (webgpuErr) {
          console.warn("WebGPU pipeline failed, falling back to WASM:", webgpuErr);
          return disposeSharedGenerator().then(function () {
            onStatus && onStatus("WebGPU runtime crashed - retrying on WASM (slower)...");
            onProgress && onProgress(0);
            return loadWasm();
          });
        });
      }
      onStatus && onStatus("WebGPU unavailable - using WASM (slower)...");
      return loadWasm();
    });
  }

  /* ------------------- retrieval index (TF-IDF, from dynamicLLM) --------- */
  var STOPWORDS = new Set("a an the is are was were be been being of to in on for with and or but not this that these those it its as at by from into about how what when where why who which do does did can could should would will shall".split(" "));
  function tokenize(str) {
    return (String(str).toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (t) { return t.length > 1 && !STOPWORDS.has(t); });
  }

  function chunkText(text, filename, maxLen) {
    maxLen = maxLen || 700;
    // Split on markdown headings first, then pack paragraphs into ~maxLen chunks.
    var lines = String(text).split(/\r?\n/);
    var sections = [];
    var current = { heading: filename, lines: [], startLine: 0 };
    for (var i = 0; i < lines.length; i++) {
      var m = /^#{1,6}\s+(.*)/.exec(lines[i]);
      if (m) {
        if (current.lines.join("\n").trim()) sections.push(current);
        current = { heading: m[1].trim(), lines: [], startLine: i + 1 };
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
      var bufStart = sections[s].startLine;
      var lineOffset = 0;
      for (var q = 0; q < paras.length; q++) {
        var p = paras[q].trim();
        if (!p) continue;
        if (buf && (buf + "\n\n" + p).length > maxLen) {
          chunks.push({ file: filename, heading: sections[s].heading, text: buf.trim(), startLine: bufStart });
          buf = p;
          bufStart = sections[s].startLine + lineOffset + 1;
        } else {
          buf = buf ? buf + "\n\n" + p : p;
        }
        lineOffset += p.split("\n").length + 1;
      }
      if (buf.trim()) chunks.push({ file: filename, heading: sections[s].heading, text: buf.trim(), startLine: bufStart });
    }
    return chunks;
  }

  var pages = [];       // raw index entries
  var chunks = [];      // {file, heading, text}
  var tokenized = [];   // tokens per chunk
  var idf = new Map();
  var graphNodes = [];  // graph.json nodes
  var graphLinks = [];  // graph.json links
  var urlToNode = {};   // page url (normalized) -> node id (prefer note/moc)
  var assetsById = {};  // node id -> asset node (PDFs, images, code files)

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

  /* ------------------- graph connections + assets ------------------------ */
  function setupGraph(g) {
    graphNodes = g.nodes || [];
    graphLinks = g.links || [];
    urlToNode = {};
    assetsById = {};
    graphNodes.forEach(function (n) {
      if (n.kind === "asset") { assetsById[n.id] = n; return; }
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

  // Related pages + attached files for a page url, with the REASON (link kind).
  function relatedForUrl(pageUrl) {
    var node = urlToNode[normalizeUrl(pageUrl)];
    var pagesSet = {}, tagsSet = {}, filesSet = {}, pageLinks = {};
    if (node) {
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
        } else if (other.kind === "asset") {
          filesSet[other.url] = { label: other.label || other.url, url: other.url, raw: other.raw };
        } else if (other.url && String(other.url).indexOf("/view/") !== 0) {
          pagesSet[other.url] = { label: other.label || other.url, url: other.url };
          var kind = l.kind || "link";
          pageLinks[other.url] = pageLinks[other.url] || [];
          if (pageLinks[other.url].indexOf(kind) < 0) pageLinks[other.url].push(kind);
        }
      });
    }
    // Also surface assets whose raw path shares this page's folder/name.
    if (node && node.raw) {
      var base = String(node.raw).replace(/\.md$/i, "");
      Object.keys(assetsById).forEach(function (id) {
        var a = assetsById[id];
        if (!a.raw) return;
        var raw = String(a.raw);
        if (raw.indexOf(base) === 0 || base.indexOf(raw.replace(/\.[^.]+$/, "")) === 0) {
          filesSet[a.url] = { label: a.label || a.url, url: a.url, raw: a.raw };
        }
      });
    }
    var pages = Object.values(pagesSet).slice(0, 8).map(function (p) {
      var kinds = pageLinks[p.url] || [];
      var label = kinds.map(function (k) {
        return k === "wiki" ? "wiki link" : k === "mdlink" ? "linked" : k === "moc" ? "menu" : k === "tag" ? "tag" : k;
      }).join(", ");
      return { label: p.label, url: p.url, rel: label };
    });
    return { pages: pages, tags: Object.keys(tagsSet).slice(0, 8), files: Object.values(filesSet).slice(0, 6) };
  }

  // Category order for reading-path grouping (hub/overview first, then concepts, then research).
  var CATEGORY_ORDER = ["hub", "course", "ai", "cv", "cuda", "pkm", "paper", "journal", "book", "patent", "keynote", "business"];
  var CATEGORY_LABEL = {
    hub: "Overview", course: "Courses", ai: "AI & LLMs", cv: "Computer Vision",
    cuda: "CUDA & GPU", pkm: "Knowledge", paper: "Papers", journal: "Journals",
    book: "Books", patent: "Patents", keynote: "Keynotes", business: "Business"
  };
  function categoryRank(cat) {
    var i = CATEGORY_ORDER.indexOf(cat);
    return i < 0 ? 99 : i;
  }

  // Build an ordered "how to read this topic" path from ranked pages.
  function buildReadingPath(ranked) {
    var used = {};
    var pick = function (cats) {
      for (var i = 0; i < ranked.length; i++) {
        var pg = ranked[i];
        if (used[pg.url]) continue;
        if (cats.indexOf(pg.cat) >= 0) { used[pg.url] = true; return pg; }
      }
      return null;
    };
    var path = [];
    var overview = pick(["hub"]);
    if (overview) path.push({ step: "Start with the overview", pg: overview });
    var concepts = pick(["course", "ai", "cv", "cuda"]);
    if (concepts) path.push({ step: "Learn the concepts", pg: concepts });
    var research = pick(["paper", "journal", "book", "patent"]);
    if (research) path.push({ step: "Dive into research", pg: research });
    var extra = pick(["pkm", "business", "keynote"]);
    if (extra) path.push({ step: "Related material", pg: extra });
    // fill remaining with top pages not yet used
    for (var i = 0; i < ranked.length && path.length < 5; i++) {
      if (!used[ranked[i].url]) { used[ranked[i].url] = true; path.push({ step: "Keep exploring", pg: ranked[i] }); }
    }
    return path;
  }

  // Short label for a page (first words of title, else last URL segment).
  function shortPageLabel(url) {
    var meta = pageMeta(url);
    if (meta && meta.title) {
      var words = String(meta.title).split(/\s+/);
      var label = words.slice(0, 3).join(" ");
      if (words.length > 3) label += "…";
      return label;
    }
    var parts = String(url || "").replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || url;
  }

  // Per-keyword breakdown for the query: matched pages + one-line definition.
  function keywordMapRows(query) {
    var tokens = tokenize(query);
    var kws = [];
    tokens.forEach(function (t) { if (kws.indexOf(t) < 0 && kws.length < 5) kws.push(t); });
    return kws.map(function (kw) {
      var pages = {};
      chunks.forEach(function (c, i) {
        var toks = tokenized[i] || [];
        if (toks.indexOf(kw) < 0) return;
        var base = c.file;
        if (!pages[base]) pages[base] = { score: 0, chunk: c };
        pages[base].score += (idf.get(kw) || 1) * (toks.filter(function (t) { return t === kw; }).length);
      });
      var ranked = Object.keys(pages).map(function (u) {
        return { url: u, score: pages[u].score, chunk: pages[u].chunk };
      }).sort(function (a, b) { return b.score - a.score; }).slice(0, 3);
      // definition: first real sentence containing the keyword from the best chunk
      var def = "";
      if (ranked.length) {
        var sents = String(ranked[0].chunk.text).match(/[^.!?]+[.!?]+/g) || [];
        for (var s = 0; s < sents.length; s++) {
          var sent = sents[s].trim();
          // skip share-line blockquotes and markdown noise ("> **Title** — desc — URL")
          if (/^>\s*\*\*|^\s*#|pirahansiah\.com/.test(sent)) continue;
          if (sent.toLowerCase().indexOf(kw) >= 0) { def = sent; break; }
        }
        if (!def) {
          // fallback: any real sentence from the chunk
          for (var s2 = 0; s2 < sents.length; s2++) {
            var sent2 = sents[s2].trim();
            if (/^>\s*\*\*|^\s*#|pirahansiah\.com/.test(sent2)) continue;
            def = sent2; break;
          }
        }
        if (!def) def = String(ranked[0].chunk.text).slice(0, 120);
        // strip URLs and stray markdown symbols from the definition text
        def = def.replace(/https?:\/\/\S+/g, "").replace(/[#*`>_\[\]()]/g, " ").replace(/\s+/g, " ").trim();
        if (def.length > 150) def = def.slice(0, 149).trim() + "…";
      }
      return {
        kw: kw,
        pages: ranked.map(function (r) { return { url: r.url, label: shortPageLabel(r.url) }; }),
        def: def
      };
    }).filter(function (r) { return r.pages.length; });
  }

  // Render the keyword map (deterministic — no model needed) + idea line.
  function renderKeywordMap(query, ideaLine) {
    var rows = keywordMapRows(query);
    if (!rows.length) { ui.kwmap.style.display = "none"; return; }
    ui.kwmap.style.display = "block";
    ui.kwmapRows.innerHTML = rows.map(function (r) {
      var pages = r.pages.map(function (p) {
        return '<a href="' + p.url + '" class="kw-page">' + esc(p.label) + '</a>';
      }).join(" · ");
      return '<div class="llm-kwmap-row">' +
        '<span class="llm-kw">' + esc(r.kw) + '</span>' +
        '<span class="llm-kw-pages">' + pages + '</span>' +
        '<span class="llm-kw-def">' + esc(r.def) + '</span>' +
        '</div>';
    }).join("");
    // idea line: LLM-generated if present, else heuristic join
    var idea = ideaLine && ideaLine.trim() ? ideaLine.trim()
      : "Combine " + rows.map(function (r) { return "'" + r.kw + "'"; }).join(", ") + " — the pages above show how they connect.";
    ui.kwmapIdea.innerHTML = '<span class="llm-kwmap-idea-label">&#128161; Idea:</span> ' + esc(idea);
  }

  /* ------------------- UI ------------------------------------------------ */
  var ui = {
    stats: $("llm-stats"), status: $("llm-status-text"), progressWrap: $("llm-progress"),
    progressBar: $("llm-progress-bar"), badge: $("llm-device-badge"), badgeText: $("llm-device-text"),
    answer: $("llm-answer"), review: $("llm-review"), keypoints: $("llm-keypoints"),
    sources: $("llm-sources"),
    kwmap: $("llm-kwmap"), kwmapRows: $("llm-kwmap-rows"), kwmapIdea: $("llm-kwmap-idea"),
    modelSelect: $("llm-model-select"),
    catBars: $("llm-cat-bars"), tagcloud: $("llm-tagcloud"),
    refsList: $("llm-refs-list"), webLinks: $("llm-web-links"),
    xpostBody: $("llm-xpost-body"), xpostCopy: $("llm-xpost-copy"), xpostOpen: $("llm-xpost-open"),
    results: $("llm-results"), resultsHead: $("llm-results-head"), count: $("llm-count"),
    conn: $("llm-conn"), canvas: $("llm-conn-canvas"), hint: $("llm-hint-line"),
    q: $("llm-query"), askBtn: $("llm-ask-btn"), initBtn: $("llm-init-btn"),
    chatLog: $("llm-chat-log"), chatInput: $("llm-chat-input"), chatSend: $("llm-chat-send"), chatStatus: $("llm-chat-status")
  };

  function setProgress(n) {
    n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    ui.progressBar.style.width = n + "%";
    ui.progressBar.textContent = n + "%";
  }

  function setStatus(msg, showBar) {
    if (ui.status) ui.status.textContent = msg || "";
    if (ui.progressWrap) ui.progressWrap.style.display = showBar ? "block" : "none";
  }

  function deviceLabel() {
    return sharedDevice ? sharedDevice.toUpperCase() + (sharedDtype ? " " + sharedDtype : "") : "—";
  }

  function setDeviceBadge(state, text) {
    ui.badge.className = "llm-badge " + state;
    ui.badgeText.textContent = text;
  }

  function pageMeta(url) {
    for (var i = 0; i < pages.length; i++) if (pages[i].url === url) return pages[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function highlight(text, query) {
    var tokens = tokenize(query);
    if (!tokens.length || !text) return esc(text);
    var re = new RegExp("(" + tokens.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    return esc(text).replace(re, "<mark>$1</mark>");
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

  function fileLabel(raw) {
    var name = String(raw || "").split("/").pop() || "";
    return decodeURIComponent(name);
  }

  // Exact lines from a chunk containing query tokens, with line numbers.
  function exactLines(chunk, query, maxLines) {
    maxLines = maxLines || 14;
    var tokens = tokenize(query);
    var lines = String(chunk.text).split("\n");
    var hitIdx = -1;
    for (var i = 0; i < lines.length; i++) {
      var low = lines[i].toLowerCase();
      for (var t = 0; t < tokens.length; t++) {
        if (low.indexOf(tokens[t]) >= 0) { hitIdx = i; break; }
      }
      if (hitIdx >= 0) break;
    }
    if (hitIdx < 0) hitIdx = 0;
    var start = Math.max(0, hitIdx - 2);
    var end = Math.min(lines.length, start + maxLines);
    var out = [];
    for (var j = start; j < end; j++) {
      out.push({ n: (chunk.startLine || 1) + j, text: lines[j] });
    }
    return out;
  }

  // One card per PAGE (aggregating chunk scores) + exact lines + files + relations.
  function renderResults(query, top, limit) {
    limit = limit || 10;
    ui.results.innerHTML = "";
    if (!top.length) {
      ui.results.innerHTML = '<div class="llm-empty">Nothing matched that query. Try different keywords.</div>';
      ui.count.textContent = "0";
      return;
    }
    // Aggregate top chunks per page
    var perPage = {};
    top.forEach(function (r) {
      var url = r.chunk.file;
      if (!perPage[url]) perPage[url] = { score: 0, chunks: [] };
      perPage[url].score += r.score;
      perPage[url].chunks.push(r);
    });
    var ranked = Object.keys(perPage).map(function (url) {
      var meta = pageMeta(url);
      var cat = meta ? meta.category : "hub";
      return { url: url, score: perPage[url].score, n: perPage[url].chunks.length, best: perPage[url].chunks[0], cat: cat, title: meta ? meta.title : url };
    });
    ranked.sort(function (a, b) { return b.score - a.score; });
    ui.count.textContent = ranked.length;
    var maxScore = ranked[0].score || 1;

    // ---- Reading path (ordered steps) ----
    var path = buildReadingPath(ranked);
    if (path.length >= 2) {
      var pathHtml = '<div class="llm-path"><div class="llm-path-title">&#128218; How to read this topic — suggested order</div><div class="llm-path-steps">';
      path.forEach(function (p, idx) {
        var meta2 = pageMeta(p.pg.url);
        pathHtml += '<div class="llm-path-step" style="--step:' + idx + '">' +
          '<div class="llm-path-num">' + (idx + 1) + '</div>' +
          '<div class="llm-path-body"><div class="llm-path-label">' + esc(p.step) + '</div>' +
          '<a href="' + p.pg.url + '">' + esc(p.pg.title) + '</a></div></div>';
      });
      pathHtml += '</div></div>';
      ui.results.insertAdjacentHTML("beforeend", pathHtml);
    }

    // ---- Category-grouped results ----
    var byCat = {};
    ranked.slice(0, limit).forEach(function (pg) {
      (byCat[pg.cat] = byCat[pg.cat] || []).push(pg);
    });
    var cats = Object.keys(byCat).sort(function (a, b) { return categoryRank(a) - categoryRank(b); });
    cats.forEach(function (cat) {
      var html = '<div class="llm-cat-group"><div class="llm-cat-group-head"><span class="llm-cat-group-title">' +
        esc(CATEGORY_LABEL[cat] || cat) + '</span><span class="llm-cat-group-count">' + byCat[cat].length + '</span></div>';
      byCat[cat].forEach(function (pg, gi) {
        var meta = pageMeta(pg.url);
        var title = meta ? meta.title : pg.url;
        var tags = (meta && meta.tags) ? meta.tags : [];
        var hashes = (meta && meta.hashtags) ? String(meta.hashtags).split(/\s+/).filter(Boolean) : [];
        var rel = relatedForUrl(pg.url);
        var pct = Math.min(100, Math.round((pg.score / maxScore) * 100));
        var snippet = snippetFor(pg.best.chunk.text, query);
        var lines = exactLines(pg.best.chunk, query);
        var firstLine = lines.length ? lines[0].n : (pg.best.chunk.startLine || 1);
        var lastLine = lines.length ? lines[lines.length - 1].n : firstLine;
        var card = '<div class="llm-card" style="--gi:' + gi + '">' +
          '<div class="llm-card-top"><span class="llm-card-title"><a href="' + pg.url + '">' + esc(title) + '</a></span>' +
          '<span class="llm-cat ' + esc(cat) + '">' + esc(CATEGORY_LABEL[cat] || cat) + '</span></div>' +
          '<div class="llm-score-row"><div class="llm-score-bar"><div class="llm-score-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="llm-score-val">' + pct + '%</span></div>' +
          '<div class="llm-snippet">' + highlight(snippet, query) + '</div>' +
          '<div class="llm-lines"><div class="llm-lines-head">&#128203; Exact lines ' + firstLine + '–' + lastLine +
          ' <button type="button" class="llm-lines-toggle" data-card="' + esc(pg.url) + '">show</button></div>' +
          '<div class="llm-lines-body" id="lines-' + esc(pg.url).replace(/[^a-zA-Z0-9_-]/g, "_") + '" style="display:none">';
        lines.forEach(function (ln) {
          card += '<div class="llm-line"><span class="llm-line-num">' + ln.n + '</span><span class="llm-line-text">' + highlight(ln.text, query) + '</span></div>';
        });
        card += '</div></div>';
        if (rel.files.length) {
          card += '<div class="llm-files"><b>&#128196; Files &amp; PDFs:</b> ' +
            rel.files.map(function (f) {
              var label = f.label === f.url ? fileLabel(f.raw) : f.label;
              return '<a href="' + f.url + '" target="_blank" rel="noopener" class="rel-link" title="' + esc(label) + '">' + esc(label) + '</a>';
            }).join("") + '</div>';
        }
        if (tags.length || hashes.length) {
          card += '<div class="llm-tags-row">' +
            tags.slice(0, 6).map(function (t) { return '<span class="llm-tag">#' + esc(t) + '</span>'; }).join("") +
            hashes.slice(0, 4).map(function (h) { return '<span class="llm-tag hashtag">' + esc(h) + '</span>'; }).join("") +
            '</div>';
        }
        if (rel.pages.length) {
          card += '<div class="llm-related"><b>&#128279; Connected:</b> ' +
            rel.pages.map(function (p) {
              return '<a href="' + p.url + '" class="rel-link" title="' + esc(p.label) + '">' + esc(p.label) + '</a>' +
                (p.rel ? '<span class="rel-kind">(' + esc(p.rel) + ')</span>' : '');
            }).join("") + '</div>';
        }
        card += '</div>';
        html += card;
      });
      html += '</div>';
      ui.results.insertAdjacentHTML("beforeend", html);
    });

    // wire the line toggles
    document.querySelectorAll(".llm-lines-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-card").replace(/[^a-zA-Z0-9_-]/g, "_");
        var body = document.getElementById("lines-" + key);
        if (!body) return;
        var open = body.style.display !== "none";
        body.style.display = open ? "none" : "block";
        btn.textContent = open ? "show" : "hide";
      });
    });
  }

  /* ------------------- connection force graph (d3) ----------------------- */
  var connSim = null;
  function renderConnections(query, top) {
    ui.conn.classList.add("visible");
    var seed = top.slice(0, 8).map(function (r) { return urlToNode[normalizeUrl(r.chunk.file)]; }).filter(Boolean);
    if (!seed.length) { ui.conn.style.display = "none"; return; }
    var keep = {};
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
      .attr("r", 7)
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

  /* ------------------- LLM helpers --------------------------------------- */
  function buildContext(top, maxChars) {
    maxChars = maxChars || 9000;
    var ctx = [], used = 0, seen = {};
    top.forEach(function (r) {
      if (used >= maxChars) return;
      if (seen[r.chunk.file]) return; // one chunk per page for context
      seen[r.chunk.file] = true;
      var meta = pageMeta(r.chunk.file);
      var head = meta ? meta.title : r.chunk.file;
      var text = r.chunk.text;
      if (used + text.length > maxChars) text = text.substring(0, maxChars - used);
      ctx.push("### Source: " + head + " (" + r.chunk.file + ")\n" + text);
      used += text.length;
    });
    return ctx.join("\n\n");
  }

  function uniquePages(top) {
    var out = [], seen = {};
    top.forEach(function (r) { if (!seen[r.chunk.file]) { seen[r.chunk.file] = true; out.push(r.chunk.file); } });
    return out;
  }

  function sourcesHtml(pages) {
    return pages.map(function (f) {
      var meta = pageMeta(f);
      return '<a href="' + f + '" target="_blank" rel="noopener">' + esc(meta ? meta.title : f) + '</a>';
    }).join("");
  }

  function runAnswer(top, question, streamEl, onDone) {
    var context = buildContext(top);
    return ensureGenerator(
      function (msg) { setStatus(msg, true); },
      setProgress
    ).then(function (generator) {
      setStatus("Generating answer on " + deviceLabel() + "...", false);
      setDeviceBadge("ok", deviceLabel());
      return loadPipelineModule().then(function () {
        var streamer = new sharedPipelineModule.TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          callback_function: function (t) { streamEl.textContent += t; }
        });
        var messages = [
          { role: "system", content: "You are a research assistant for the pirahansiah.com knowledge site. Answer using ONLY the document excerpts below. Structure your reply exactly like this:\nREVIEW: a rich, detailed single paragraph (6-10 sentences) that synthesizes the context, connections between pages, and key technical details from ALL the sources. Write it in a natural, engaging, informative style that works anywhere — social post, paper, or presentation. NEVER start with words like 'Introduction', 'In this paper, we', 'This paper presents', 'In this study', or any academic-paper-intro filler. Just go straight into the substance of the topic.\nKEY POINTS: three numbered key points (1. 2. 3.), each one short sentence.\nX POST: a short 1-2 sentence summary of the review above, most relevant to the question's keywords (no hashtags, no URL).\nIDEA: one single sentence that connects the question's keywords into a practical idea or application.\nAlways name the source file(s) you used, like (source: /notes/.../). If the excerpts don't contain enough information, say so plainly instead of guessing." },
          { role: "user", content: "Document excerpts:\n\n" + context + "\n\nQuestion: " + question }
        ];
        return generator(messages, { max_new_tokens: 540, do_sample: false, streamer: streamer });
      });
    }).then(function (result) {
      if (!streamEl.textContent.trim()) {
        var x = result && result[0] && result[0].generated_text;
        if (typeof x === "string") streamEl.textContent = x;
        else if (Array.isArray(x)) streamEl.textContent = x[x.length - 1] && x[x.length - 1].content || "";
      }
      setStatus("Done (" + deviceLabel() + ").", false);
      // onDone must never be able to blank the generated text: guard it.
      try {
        onDone && onDone();
      } catch (e) {
        console.error("post-processing failed (generated text kept):", e);
      }
      return result;
    });
  }

  // Split the raw LLM output into review / key points / x-post / idea sections.
  function parseStructured(text) {
    var out = { review: "", keypoints: [], xpost: "", idea: "" };
    text = String(text || "");
    var review = /REVIEW\s*:\s*([\s\S]*?)(?=KEY\s*POINTS|X\s*POST|IDEA|$)/i.exec(text);
    if (review) out.review = review[1].trim();
    var kp = /KEY\s*POINTS?\s*:\s*([\s\S]*?)(?=X\s*POST|IDEA|$)/i.exec(text);
    if (kp) {
      kp[1].split(/\n/).forEach(function (line) {
        var m = /^\s*(?:\d+[.)]\s*|[-*]\s*)?(.+)$/.exec(line);
        if (m && m[1].trim() && !/^key\s*points?$/i.test(m[1].trim())) out.keypoints.push(m[1].trim());
      });
    }
    var xp = /X\s*POST\s*:\s*(.+)/i.exec(text);
    if (xp) out.xpost = xp[1].trim();
    var idea = /IDEA\s*:\s*(.+)/i.exec(text);
    if (idea) out.idea = idea[1].trim();
    if (!out.review && !out.keypoints.length && !out.xpost && !out.idea) out.review = text.trim(); // fallback
    return out;
  }

  // Clean version of the full answer for the review box: keeps ALL model text,
  // only strips the section labels and any academic intro filler.
  function cleanStructuredText(text) {
    var out = String(text || "")
      .replace(/^\s*REVIEW\s*:\s*/i, "")
      .replace(/^\s*KEY\s*POINTS?\s*:\s*/i, "")
      .replace(/^\s*X\s*POST\s*:\s*/i, "")
      .replace(/^\s*IDEA\s*:\s*/i, "")
      .trim();
    // Strip academic intro filler clauses (chained: "Introduction\nThis paper
    // presents..." needs multiple passes), up to the first real content.
    var FILLER = /^(introduction\s*[:\-–—.]?\s*|in\s+this\s+(paper|study|article|work)[^.]*\.\s*|this\s+(paper|study|article|work)\s+presents?\s+[^.]*\.\s*|the\s+(paper|study|article|work)\s+presents?\s+[^.]*\.\s*)/i;
    for (var i = 0; i < 4; i++) {
      var before = out;
      out = out.replace(FILLER, "");
      if (out === before) break;
    }
    return out.trim();
  }

  // Build a short X-ready summary from the review text, most relevant to the
  // question keywords: pick the 1-2 sentences with the most keyword hits.
  function summarizeForX(reviewText, query, maxLen) {
    maxLen = maxLen || 240;
    var text = String(reviewText || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    var tokens = tokenize(query);
    var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    var scored = sentences.map(function (s, i) {
      var low = s.toLowerCase();
      var hits = 0;
      tokens.forEach(function (t) { if (low.indexOf(t) >= 0) hits++; });
      return { s: s.trim(), i: i, hits: hits };
    });
    // prefer sentences with keyword hits, then earlier position
    scored.sort(function (a, b) { return (b.hits - a.hits) || (a.i - b.i); });
    var out = "";
    scored.forEach(function (item) {
      if (out.length >= maxLen) return;
      var piece = (out ? " " : "") + item.s;
      if ((out + piece).length > maxLen && out) return;
      out += piece;
      if (item.hits > 0) { /* keep going to gather up to 2 relevant sentences */ }
    });
    // If nothing had keyword hits, fall back to the first sentence.
    if (!out) out = sentences[0] ? sentences[0].trim() : text;
    if (out.length > maxLen) out = out.substring(0, maxLen - 1).trim() + "…";
    return out;
  }

  // Build the shareable X post: short keyword-relevant summary of the review
  // + full site URL of top page + hashtags.
  function buildXPost(text, topPages, reviewText, query) {
    var top = topPages[0];
    var meta = pageMeta(top);
    var url = location.origin + top;
    var tags = (meta && meta.tags) ? meta.tags.slice(0, 4) : [];
    var hashes = (meta && meta.hashtags) ? String(meta.hashtags).split(/\s+/).filter(Boolean).slice(0, 4) : [];
    var hashStr = [].concat(tags.map(function (t) { return "#" + t; }), hashes).filter(function (h) { return h && h.length > 1; }).slice(0, 6).join(" ");
    // Prefer the model's X POST line; otherwise summarize the review itself.
    var line = (text && text.trim()) ? text.trim() : summarizeForX(reviewText, query);
    if (!line) line = "Check out " + (meta ? meta.title : top);
    return { line: line, url: url, hashtags: hashStr };
  }

  // Render the deterministic panels: category bars, tag cloud, refs, web links, X post.
  // xpostLine can be passed explicitly so the LLM-generated X line isn't lost
  // after the review text is cleaned (was: re-parsing review lost the X POST marker).
  function renderPanels(ranked, topPages, query, xpostLine) {
    // category bars
    var counts = {};
    ranked.slice(0, 10).forEach(function (pg) { counts[pg.cat] = (counts[pg.cat] || 0) + 1; });
    var cats = Object.keys(counts).sort(function (a, b) { return categoryRank(a) - categoryRank(b); });
    var max = Math.max.apply(null, cats.map(function (c) { return counts[c]; }).concat([1]));
    ui.catBars.innerHTML = cats.map(function (c) {
      var w = Math.round((counts[c] / max) * 100);
      return '<div class="llm-bar-row"><span class="llm-bar-label">' + esc(CATEGORY_LABEL[c] || c) + '</span>' +
        '<div class="llm-bar-track"><div class="llm-bar-fill" style="width:' + w + '%"></div></div>' +
        '<span class="llm-bar-val">' + counts[c] + '</span></div>';
    }).join("") || '<div class="llm-empty" style="padding:.6rem">No data</div>';

    // tag cloud: aggregate tags + hashtags from top pages
    var tagCount = {};
    topPages.forEach(function (u) {
      var m = pageMeta(u);
      if (!m) return;
      (m.tags || []).forEach(function (t) { tagCount[t.toLowerCase()] = (tagCount[t.toLowerCase()] || 0) + 1; });
      String(m.hashtags || "").split(/\s+/).filter(Boolean).forEach(function (h) {
        var k = h.toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1;
      });
    });
    var tags = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a]; }).slice(0, 14);
    var tMax = Math.max.apply(null, tags.map(function (t) { return tagCount[t]; }).concat([1]));
    ui.tagcloud.innerHTML = tags.map(function (t) {
      var size = 0.7 + (tagCount[t] / tMax) * 0.9;
      return '<span class="llm-cloud-tag" style="font-size:' + size.toFixed(2) + 'rem" title="' + tagCount[t] + 'x">' + esc(t) + '</span>';
    }).join("") || '<div class="llm-empty" style="padding:.6rem">No tags</div>';

    // references
    ui.refsList.innerHTML = topPages.map(function (u, i) {
      var m = pageMeta(u);
      return '<li class="llm-ref"><a href="' + u + '" target="_blank" rel="noopener">' + esc(m ? m.title : u) + '</a>' +
        '<span class="llm-ref-url">' + esc(u) + '</span></li>';
    }).join("");

    // web search links
    var engines = [
      { name: "Google", url: "https://www.google.com/search?q=" + encodeURIComponent(query) },
      { name: "Bing", url: "https://www.bing.com/search?q=" + encodeURIComponent(query) },
      { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" + encodeURIComponent(query) },
      { name: "arXiv", url: "https://arxiv.org/list/cs.CV/recent" },
      { name: "YouTube", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(query) },
      { name: "Semantic Scholar", url: "https://www.semanticscholar.org/search?q=" + encodeURIComponent(query) }
    ];
    ui.webLinks.innerHTML = engines.map(function (e) {
      return '<a class="llm-web-link" href="' + e.url + '" target="_blank" rel="noopener">' + esc(e.name) + '</a>';
    }).join("");

    // X post: model's X POST line if present; else keyword-relevant summary of the review
    var xp = buildXPost(xpostLine || "", topPages, ui.review ? ui.review.textContent : "", query);
    var full = xp.line + "\n\n" + xp.url + (xp.hashtags ? "\n\n" + xp.hashtags : "");
    ui.xpostBody.textContent = full;
    ui.xpostOpen.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(full);
    if (ui.xpostCopy) {
      ui.xpostCopy.onclick = function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(full).then(function () {
            ui.xpostCopy.textContent = "Copied!";
            setTimeout(function () { ui.xpostCopy.textContent = "Copy"; }, 1500);
          });
        }
      };
    }
  }

  /* ------------------- main search flow ----------------------------------- */
  var lastParsed = null; // last structured answer, so panels don't lose the X line

  function doSearch() {
    var q = ui.q.value.trim();
    if (q.length < 2) {
      ui.results.innerHTML = "";
      ui.count.textContent = "";
      ui.answer.classList.remove("visible");
      ui.conn.classList.remove("visible");
      return;
    }
    lastParsed = null;
    var top = retrieve(q, 16);
    renderResults(q, top);
    if (typeof d3 !== "undefined") renderConnections(q, top);
    ui.resultsHead.style.display = top.length ? "flex" : "none";
    setStatus(top.length ? top.length + " relevant sections found." : "No matches.", false);
    if (top.length) {
      ui.answer.classList.add("visible");
      ui.review.textContent = "";
      ui.keypoints.innerHTML = "";
      ui.sources.innerHTML = "Sources: " + sourcesHtml(uniquePages(top));
      var topPages = uniquePages(top);
      // ranked list for panels
      var perPage = {};
      top.forEach(function (r) {
        if (!perPage[r.chunk.file]) perPage[r.chunk.file] = 0;
        perPage[r.chunk.file] += r.score;
      });
      var ranked2 = Object.keys(perPage).map(function (url) {
        var meta = pageMeta(url);
        return { url: url, score: perPage[url], cat: meta ? meta.category : "hub" };
      }).sort(function (a, b) { return b.score - a.score; });

      // deterministic panels render instantly (no model needed)
      renderPanels(ranked2, topPages, q, "");
      renderKeywordMap(q, "");

      var top5 = top.slice(0, 8); // more pages -> richer review context
      ui.askBtn.disabled = true;
      runAnswer(top5, q, ui.review, function () {
        // Parse ONCE. The review box keeps the FULL model text (labels stripped)
        // so nothing ever disappears; key points + X line are shown in addition.
        lastParsed = parseStructured(ui.review.textContent);
        var raw = ui.review.textContent;
        if (lastParsed.keypoints.length) {
          ui.review.textContent = cleanStructuredText(raw) || raw;
          ui.keypoints.innerHTML = lastParsed.keypoints.slice(0, 3).map(function (k) {
            return '<div class="llm-kp"><span class="llm-kp-num">&#10003;</span><span>' + esc(k) + '</span></div>';
          }).join("");
        } else {
          // model didn't follow the format — keep the raw text untouched
          ui.review.textContent = raw;
        }
        // refresh panels + keyword map with the LLM X line / idea preserved
        try {
          renderPanels(ranked2, topPages, q, lastParsed.xpost);
          renderKeywordMap(q, lastParsed.idea);
        } catch (err) { console.error(err); }
        ui.askBtn.disabled = false;
      }).catch(function (e) {
        console.error(e);
        // never wipe generated/partial text with an error banner
        if (!ui.review.textContent.trim()) {
          ui.review.textContent = "LLM unavailable: " + (e && e.message || e) + "\n\n(Relevant pages above are still valid.)";
        } else {
          setStatus("LLM error: " + (e && e.message || e) + " — partial answer kept.", false);
        }
        ui.askBtn.disabled = false;
      });
    }
  }

  /* ------------------- chat (ChatGPT-like) -------------------------------- */
  var chatHistory = [];
  var chatBusy = false;

  function chatAddMsg(role, text) {
    var div = document.createElement("div");
    div.className = "chat-msg " + (role === "user" ? "chat-user" : "chat-bot");
    var bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;
    div.appendChild(bubble);
    ui.chatLog.appendChild(div);
    ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
    return bubble;
  }

  function chatSend() {
    var q = ui.chatInput.value.trim();
    if (!q || chatBusy) return;
    if (!pages.length) { ui.chatStatus.textContent = "Index still loading — wait a second."; return; }
    chatBusy = true;
    ui.chatSend.disabled = true;
    ui.chatStatus.textContent = "";
    chatAddMsg("user", q);
    ui.chatInput.value = "";
    var thinking = chatAddMsg("bot", "…");

    var top = retrieve(q, 10);
    if (!top.length) {
      thinking.textContent = "Nothing in the site matches that closely — try rephrasing.";
      chatBusy = false; ui.chatSend.disabled = false;
      return;
    }
    chatHistory.push({ role: "user", content: q });

    var context = buildContext(top.slice(0, 5));
    ensureGenerator(
      function (msg) { ui.chatStatus.textContent = msg; },
      setProgress
    ).then(function (generator) {
      ui.chatStatus.textContent = "Generating on " + deviceLabel() + "...";
      setDeviceBadge("ok", deviceLabel());
      return loadPipelineModule().then(function () {
        thinking.textContent = "";
        var streamer = new sharedPipelineModule.TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          callback_function: function (t) { thinking.textContent += t; }
        });
        var messages = [
          { role: "system", content: "You are a helpful research assistant for the pirahansiah.com knowledge site. Answer using the document excerpts below when relevant. Always mention which source page(s) you used, like (source: /notes/.../). If the excerpts don't contain enough info, say so plainly." },
          { role: "user", content: "Document excerpts:\n\n" + context }
        ];
        // keep last few turns for conversation continuity
        var history = chatHistory.slice(-6, -1).map(function (m) { return { role: m.role, content: m.content }; });
        messages = messages.concat(history);
        messages.push({ role: "user", content: q });
        return generator(messages, { max_new_tokens: 260, do_sample: false, streamer: streamer });
      });
    }).then(function (result) {
      if (!thinking.textContent.trim()) {
        var x = result && result[0] && result[0].generated_text;
        if (typeof x === "string") thinking.textContent = x;
        else if (Array.isArray(x)) thinking.textContent = x[x.length - 1] && x[x.length - 1].content || "";
      }
      var src = document.createElement("div");
      src.className = "chat-sources";
      src.innerHTML = "Sources: " + sourcesHtml(uniquePages(top));
      thinking.parentNode.appendChild(src);
      chatHistory.push({ role: "assistant", content: thinking.textContent });
      ui.chatStatus.textContent = "";
    }).catch(function (e) {
      console.error(e);
      // never wipe a partial chat answer with an error banner
      if (!thinking.textContent.trim() || thinking.textContent === "…") {
        thinking.textContent = "Model error: " + (e && e.message || e) + " — try the Load model button first.";
      } else {
        thinking.textContent += "\n\n[Error: " + (e && e.message || e) + " — partial answer kept]";
      }
      ui.chatStatus.textContent = "";
    }).finally(function () {
      chatBusy = false;
      ui.chatSend.disabled = false;
      ui.chatInput.disabled = !pages.length;
    });
  }

  /* ------------------- init ----------------------------------------------- */
  function init() {
    setDeviceBadge("warn", "checking GPU");
    if (navigator.gpu) {
      navigator.gpu.requestAdapter().then(function (a) {
        setDeviceBadge(a ? "ok" : "warn", a ? "WebGPU ready" : "WASM fallback");
      }).catch(function () { setDeviceBadge("warn", "WASM fallback"); });
    } else {
      setDeviceBadge("warn", "WASM fallback");
    }

    // Model picker: restore saved choice, reload the pipeline when changed.
    if (ui.modelSelect) {
      ui.modelSelect.value = selectedModelId();
      ui.modelSelect.addEventListener("change", function () {
        saveModelId(ui.modelSelect.value);
        // discard any loaded model so the next ask uses the new selection
        disposeSharedGenerator().then(function () {
          setStatus("Model changed to " + (ui.modelSelect.selectedOptions[0] ? ui.modelSelect.selectedOptions[0].textContent.split("—")[0].trim() : ui.modelSelect.value) + " — next Ask will download it.", false);
        });
      });
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
      ui.chatInput.disabled = false;
      ui.chatSend.disabled = false;
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
        setStatus("Model ready on " + deviceLabel() + ".", false);
        setDeviceBadge("ok", deviceLabel());
      }).catch(function (e) {
        setStatus("Model load failed: " + (e && e.message || e) + " — check your connection and retry.", false);
        setDeviceBadge("err", "load failed");
      });
    });

    // Chat
    ui.chatSend.addEventListener("click", chatSend);
    ui.chatInput.addEventListener("keydown", function (e) { if (e.key === "Enter") chatSend(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
