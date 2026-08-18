/* =========================================================================
   Agent Swarm — a Kimi-style knowledge swarm for pirahansiah.com

   Ask a question; a swarm of specialized agents fans out across the whole
   site (papers, journals, books, patents, keynotes, courses, wiki, CV,
   projects) and reports back. The swarm is visualized live as a dynamic
   graph (orchestrator hub + agent nodes + message pulses), and the merged
   findings render as: a topic synthesis, key points, category coverage,
   tag cloud, references, an X post line, and an INTERACTIVE query-specific
   knowledge subgraph (pages + tags + relations) built from the results.

   Everything runs in the browser. Data: /assets/llm-index.json (all page
   text + tags + categories) and /assets/graph.json (knowledge graph).

   Public API: window.SiteSwarm = { run(query), abort, state }.
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------ config -------------------------------- */

  var INDEX_URL = "/assets/llm-index.json";
  var GRAPH_URL = "/assets/graph.json";

  // Agent roster. Each agent is a real retrieval/analysis worker; roles are
  // shown live on the swarm canvas with a status line per phase.
  var AGENTS = [
    { id: "scout",       name: "Scout",        icon: "\u{1F50D}", color: "#0a84ff",
      start: "Scanning every page for your keywords…",
      done:  "Found the strongest matching pages." },
    { id: "mapper",      name: "Graph Mapper", icon: "\u{1F5FA}", color: "#30d158",
      start: "Walking the knowledge graph from seed pages…",
      done:  "Mapped nearby topics, hubs and assets." },
    { id: "tagmine",     name: "Tag Miner",    icon: "#\u2764", color: "#af52de",
      start: "Mining hashtags and tags across results…",
      done:  "Tagged the knowledge space." },
    { id: "categorist",  name: "Categorist",   icon: "\u{1F4C1}", color: "#ff9f0a",
      start: "Sorting findings into categories…",
      done:  "Measured category coverage." },
    { id: "weaver",      name: "Relation Weaver", icon: "\u{1F517}", color: "#ff375f",
      start: "Weaving relations between pages…",
      done:  "Linked pages by shared tags and graph edges." },
    { id: "sage",        name: "Sage",         icon: "\u{1F9E0}", color: "#5e5ce6",
      start: "Synthesizing the swarm's knowledge…",
      done:  "Answered from all angles." }
  ];

  var COLORS = {
    query: "#0a84ff", page: "#30d158", tag: "#af52de",
    category: "#8e8e93", hub: "#0a84ff", relation: "#ff9f0a"
  };

  var STOPWORDS = new Set(("a an the is are was were be been being of to in on for with and or but not this that " +
    "these those it its as at by from into about how what when where why who which do does did can could should " +
    "would will shall all any your our their his her its my me you").split(" "));

  var CATEGORY_LABEL = {
    hub: "Hubs", course: "Courses", ai: "AI & LLM", cv: "Computer Vision",
    cuda: "CUDA & GPU", pkm: "Projects", paper: "Papers", journal: "Journals",
    book: "Books", patent: "Patents", keynote: "Keynotes", business: "Business", page: "Pages"
  };

  var FILLER = /^(introduction\s*[:.\-]?|in\s+this\s+(paper|study|article|work)|(this|the)\s+(paper|study|article|work)\s+presents?|we\s+(present|propose|introduce|study)\b)/i;

  /* --------------------------- DOM + state ------------------------------ */

  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    query: $("swarm-query"), ask: $("swarm-ask"), suggs: $("swarm-suggest"),
    wrap: $("swarm-wrap"), canvas: $("swarm-canvas"), stat: $("swarm-stat"),
    console: $("swarm-console"),
    synth: $("swarm-synthesis"), kp: $("swarm-keypoints"), cats: $("swarm-cat-bars"),
    cloud: $("swarm-tagcloud"), refs: $("swarm-refs"), xpost: $("swarm-xpost-body"),
    xcopy: $("swarm-xpost-copy"), gwrap: $("swarm-graph"), gcanvas: $("swarm-graph-canvas"),
    loading: $("swarm-loading"), notice: $("swarm-notice")
  };

  var pages = [], pageByUrl = new Map(), chunks = [], inverted = new Map(),
      docLen = [], avgLen = 1, idf = new Map();
  var graphNodes = [], graphLinks = [], nodeById = new Map(), urlToNode = new Map(),
      adjacency = new Map(), assets = [];
  var swarmState = { running: false, phase: "", agentsActive: 0 };

  /* ---------------------------- text utils ------------------------------ */

  function tokenize(str) {
    var out = [];
    var m = String(str || "").toLowerCase().match(/[a-z0-9]+/g);
    if (!m) return out;
    for (var i = 0; i < m.length; i++) if (m[i].length > 1 && !STOPWORDS.has(m[i])) out.push(m[i]);
    return out;
  }
  function uniq(arr) {
    var seen = Object.create(null), out = [];
    for (var i = 0; i < arr.length; i++) if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); }
    return out;
  }
  function cleanText(s) {
    return String(s || "")
      .replace(/^>\s*\*\*.*?\*\*\s*[-–—]\s*/g, "")   // share-line blockquote
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[#*_`\[\]()!|~]/g, " ")
      .replace(/\s+/g, " ").trim();
  }
  function firstSentence(s) {
    var t = cleanText(s);
    var m = /^[^.!?]*[.!?]/.exec(t);
    var out = (m ? m[0] : t).trim();
    out = out.replace(FILLER, "").trim();
    return out;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  /* ----------------------- index + BM25 retrieval ----------------------- */

  // Page-level BM25 (bodies are <=1600 chars in llm-index.json; no chunking
  // needed for the swarm — line numbers belong to the LLM page).
  function buildIndex(data) {
    pages = Array.isArray(data) ? data : [];
    pageByUrl = new Map(); chunks = []; inverted = new Map(); docLen = []; idf = new Map();
    var tfPer = [];
    pages.forEach(function (p) {
      if (!p || !p.url) return;
      pageByUrl.set(p.url, p);
      var boost = tokenize([p.title || "", (p.tags || []).join(" "), p.hashtags || ""].join(" "));
      var body = cleanText(p.body || "");
      var toks = tokenize(body);
      var tf = new Map();
      for (var i = 0; i < toks.length; i++) tf.set(toks[i], (tf.get(toks[i]) || 0) + 1);
      boost.forEach(function (t) { tf.set(t, (tf.get(t) || 0) + 2); });
      tfPer.push(tf);
      chunks.push(p);
      docLen.push(toks.length || 1);
    });
    var total = 0;
    tfPer.forEach(function (tf, d) {
      total += docLen[d];
      tf.forEach(function (count, term) {
        var post = inverted.get(term);
        if (!post) { post = []; inverted.set(term, post); }
        post.push(d, count);
      });
    });
    avgLen = tfPer.length ? total / tfPer.length || 1 : 1;
    var N = chunks.length || 1;
    inverted.forEach(function (post, term) {
      var df = post.length / 2;
      idf.set(term, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
    });
  }

  function retrieve(query, topK) {
    topK = topK || 12;
    var qTokens = uniq(tokenize(query));
    if (!qTokens.length || !chunks.length) return [];
    var scores = new Map(), hits = new Map();
    for (var qi = 0; qi < qTokens.length; qi++) {
      var post = inverted.get(qTokens[qi]);
      if (!post) continue;
      var w = idf.get(qTokens[qi]) || 0;
      for (var i = 0; i < post.length; i += 2) {
        var idx = post[i], tf = post[i + 1];
        var dl = docLen[idx] || 1;
        var s = w * (tf * 2.5) / (tf + 1.5 * (1 - 0.75 + 0.75 * dl / avgLen));
        scores.set(idx, (scores.get(idx) || 0) + s);
        hits.set(idx, (hits.get(idx) || 0) + 1);
      }
    }
    if (!scores.size) return [];
    var out = [];
    scores.forEach(function (score, idx) {
      var cov = 0.5 + 0.5 * ((hits.get(idx) || 1) / qTokens.length);
      out.push({ page: chunks[idx], idx: idx, score: score * cov });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, topK);
  }

  /* ----------------------------- graph utils ---------------------------- */

  function normalizeUrl(u) { return String(u || "").replace(/\/+$/, "").toLowerCase(); }

  function setupGraph(g) {
    graphNodes = (g && g.nodes) || [];
    graphLinks = (g && g.links) || [];
    nodeById = new Map(); urlToNode = new Map(); adjacency = new Map(); assets = [];
    graphNodes.forEach(function (n) {
      nodeById.set(n.id, n);
      if (n.kind === "asset") { assets.push(n); return; }
      if (n.kind === "tag" || !n.url || n.url.indexOf("/view/") === 0) return;
      var key = normalizeUrl(n.url);
      if (!urlToNode.has(key)) urlToNode.set(key, n);
    });
    graphLinks.forEach(function (l) {
      var s = typeof l.source === "object" ? l.source.id : l.source;
      var t = typeof l.target === "object" ? l.target.id : l.target;
      if (s == null || t == null || s === t) return;
      var kind = l.kind || "link";
      if (!adjacency.has(s)) adjacency.set(s, []);
      if (!adjacency.has(t)) adjacency.set(t, []);
      adjacency.get(s).push({ id: t, kind: kind });
      adjacency.get(t).push({ id: s, kind: kind });
    });
  }

  function nodeForPage(p) {
    return urlToNode.get(normalizeUrl(p.url)) || null;
  }

  /* =====================================================================
     SWARM VISUALIZATION — canvas animation: hub + agent ring + message
     pulses + status text. A rAF loop runs while the swarm is active.
     ===================================================================== */

  var vis = {
    W: 0, H: 0, dpr: 1, ctx: null,
    hub: null, agents: [], pulses: [], sparkles: [], t0: 0,
    raf: 0, logBuffer: []
  };

  function swLog(cls, who, text) {
    if (!ui.console) return;
    if (!ui.console.classList.contains("has-rows")) ui.console.classList.add("has-rows");
    var row = el("div", "swarm-log-row " + (cls || ""));
    row.appendChild(el("span", "swarm-log-who", who));
    row.appendChild(el("span", "swarm-log-text", text));
    ui.console.appendChild(row);
    ui.console.scrollTop = ui.console.scrollHeight;
  }

  function visResize() {
    if (!ui.wrap || !ui.canvas) return;
    vis.dpr = window.devicePixelRatio || 1;
    vis.W = ui.wrap.clientWidth || 600;
    vis.H = ui.wrap.clientHeight || 320;
    ui.canvas.width = vis.W * vis.dpr;
    ui.canvas.height = vis.H * vis.dpr;
    ui.canvas.style.width = vis.W + "px";
    ui.canvas.style.height = vis.H + "px";
    vis.ctx = ui.canvas.getContext("2d");
  }

  function visSetup() {
    visResize();
    vis.hub = { x: vis.W / 2, y: vis.H / 2, r: 26, a: 0 };
    var R = Math.min(vis.W, vis.H) / 2 - 70;
    if (R < 90) R = 90;
    vis.agents = AGENTS.map(function (a, i) {
      var ang = -Math.PI / 2 + (i / AGENTS.length) * Math.PI * 2;
      return {
        def: a, x: vis.W / 2 + Math.cos(ang) * R, y: vis.H / 2 + Math.sin(ang) * R,
        r: 21, status: "idle", msg: "", prog: 0, t: 0
      };
    });
    vis.pulses = [];
    vis.sparkles = [];
    vis.t0 = performance.now();
  }

  // Dispatch a message pulse hub -> agent ("task"), or agent -> hub ("report").
  function pulse(from, to, color, size) {
    vis.pulses.push({
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      t: 0, speed: 0.045 + Math.random() * 0.02, color: color || "#ffffff",
      size: size || 3, done: false
    });
  }

  function sparkle(x, y, color) {
    vis.sparkles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, life: 1, color: color || "#ffffff" });
  }

  // Set an agent's live status; if `msg` given it overwrites the canned text.
  function agentStatus(id, status, msg) {
    var a = vis.agents.filter(function (x) { return x.def.id === id; })[0];
    if (!a) return;
    a.status = status;
    a.msg = msg || "";
    a.t = 0;
  }

  function setStat(text) {
    if (ui.stat) ui.stat.textContent = text;
  }

  function visFrame(now) {
    var ctx = vis.ctx;
    if (!ctx) return;
    var dt = Math.min(32, now - (vis.lastNow || now)) / 1000;
    vis.lastNow = now;
    var bg = matchMedia("(prefers-color-scheme:dark)").matches ? "rgba(13,17,23,0.92)" : "rgba(248,249,250,0.92)";
    ctx.setTransform(vis.dpr, 0, 0, vis.dpr, 0, 0);
    ctx.clearRect(0, 0, vis.W, vis.H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, vis.W, vis.H);

    // subtle grid
    ctx.strokeStyle = "rgba(128,128,128,0.08)";
    ctx.lineWidth = 1;
    var gs = 34;
    for (var gx = 0; gx < vis.W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, vis.H); ctx.stroke(); }
    for (var gy = 0; gy < vis.H; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(vis.W, gy); ctx.stroke(); }

    // hub connections + pulses
    vis.agents.forEach(function (a) {
      var c = a.def.color;
      if (a.status === "done") c = "#30d158";
      ctx.beginPath(); ctx.moveTo(vis.hub.x, vis.hub.y); ctx.lineTo(a.x, a.y);
      ctx.strokeStyle = a.status === "idle" ? "rgba(128,128,128,0.15)" : c;
      ctx.globalAlpha = a.status === "idle" ? 0.5 : 0.85;
      ctx.lineWidth = a.status === "active" || a.status === "reporting" ? 1.5 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // pulses
    for (var pi = vis.pulses.length - 1; pi >= 0; pi--) {
      var p = vis.pulses[pi];
      p.t += p.speed;
      if (p.t >= 1) {
        vis.pulses.splice(pi, 1);
        continue;
      }
      var e = p.t * p.t * (3 - 2 * p.t);
      var px = p.x1 + (p.x2 - p.x1) * e;
      var py = p.y1 + (p.y2 - p.y1) * e;
      var s = p.size * (1 - Math.abs(p.t - 0.5));
      ctx.beginPath(); ctx.arc(px, py, Math.max(1, s), 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
    }

    // sparkles
    for (var si = vis.sparkles.length - 1; si >= 0; si--) {
      var sp = vis.sparkles[si];
      sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.03;
      if (sp.life <= 0) { vis.sparkles.splice(si, 1); continue; }
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.6 * sp.life, 0, Math.PI * 2);
      ctx.fillStyle = sp.color; ctx.globalAlpha = sp.life * 0.8; ctx.fill(); ctx.globalAlpha = 1;
    }

    // agents
    vis.agents.forEach(function (a) {
      var c = a.def.color;
      var prog = a.status === "done" ? 1 : Math.min(1, a.prog + dt * 0.35);
      a.prog = prog;
      a.t += dt;

      // ring progress
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(128,128,128,0.18)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
      ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.stroke();

      if (a.status === "active" || a.status === "reporting") {
        var glow = 0.25 + 0.15 * Math.sin(a.t * 6);
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r + 5, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.globalAlpha = glow; ctx.fill(); ctx.globalAlpha = 1;
      }

      // icon circle
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r - 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20,24,32,0.85)"; ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.font = (a.r - 4) + "px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(a.def.icon, a.x, a.y + 1);

      // label
      ctx.font = "600 11px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = matchMedia("(prefers-color-scheme:dark)").matches ? "#f5f5f7" : "#1d1d1f";
      ctx.textBaseline = "top";
      ctx.fillText(a.def.name, a.x, a.y + a.r + 6);

      // status text
      if (a.msg) {
        ctx.font = "9.5px -apple-system, system-ui, sans-serif";
        ctx.fillStyle = a.status === "done" ? "#30d158" : c;
        var msg = a.msg.length > 34 ? a.msg.slice(0, 32) + "…" : a.msg;
        ctx.fillText(msg, a.x, a.y + a.r + 20);
      }
      ctx.textBaseline = "alphabetic";
    });

    // hub
    var hc = swarmState.running ? "#0a84ff" : "#30d158";
    ctx.beginPath(); ctx.arc(vis.hub.x, vis.hub.y, vis.hub.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,24,32,0.9)"; ctx.fill();
    ctx.strokeStyle = hc; ctx.lineWidth = 2.5; ctx.stroke();
    var pulseGlow = 0.15 + 0.1 * Math.sin(now / 300);
    ctx.beginPath(); ctx.arc(vis.hub.x, vis.hub.y, vis.hub.r + 6, 0, Math.PI * 2);
    ctx.strokeStyle = hc; ctx.globalAlpha = pulseGlow; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = "15px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText("\u{1F916}", vis.hub.x, vis.hub.y + 1);
    ctx.font = "700 12px -apple-system, system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillStyle = matchMedia("(prefers-color-scheme:dark)").matches ? "#f5f5f7" : "#1d1d1f";
    ctx.fillText("Orchestrator", vis.hub.x, vis.hub.y + vis.hub.r + 8);
    if (swarmState.phase) {
      ctx.font = "9.5px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = "#8e8e93";
      var ph = swarmState.phase.length > 40 ? swarmState.phase.slice(0, 38) + "…" : swarmState.phase;
      ctx.fillText(ph, vis.hub.x, vis.hub.y + vis.hub.r + 24);
    }
    ctx.textBaseline = "alphabetic";
  }

  function visLoop(now) {
    visFrame(now);
    vis.raf = requestAnimationFrame(visLoop);
  }

  function visStart() {
    if (!vis.raf) { vis.raf = requestAnimationFrame(visLoop); }
  }
  function visStop() {
    if (vis.raf) { cancelAnimationFrame(vis.raf); vis.raf = 0; }
  }

  /* =====================================================================
     AGENT WORKERS — each returns findings merged into a shared report.
     ===================================================================== */

  var report = null;

  function makeReport(query) {
    var qTokens = uniq(tokenize(query));
    return {
      query: query, qTokens: qTokens,
      results: [],               // {page, score}
      pages: [],                 // ranked pages (unique)
      subgraph: { nodes: [], links: [] },
      tags: [],                  // [{tag, count}]
      categories: {},            // category -> count
      relations: [],             // [{a, b, kind}]
      seeds: [],                 // graph seed ids
      covered: [],               // ["Category (n)"]
      summaryLines: [],
      keypoints: [],
      xpost: ""
    };
  }

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  // Scout: BM25 retrieval over every page.
  async function agentScout(rep) {
    agentStatus("scout", "active", "searching…");
    swLog("", "Scout", "keywords: " + (rep.qTokens.slice(0, 8).join(", ") || "—"));
    await sleep(160);
    var top = retrieve(rep.query, 14);
    if (!top.length) {
      swLog("warn", "Scout", "no direct hits — loosening to tag matches…");
      var loose = [];
      pages.forEach(function (p) {
        var text = (p.title + " " + (p.tags || []).join(" ") + " " + (p.hashtags || "")).toLowerCase();
        var hit = rep.qTokens.filter(function (t) { return text.indexOf(t) >= 0; }).length;
        if (hit) loose.push({ page: p, score: hit * 2 });
      });
      loose.sort(function (a, b) { return b.score - a.score; });
      top = loose.slice(0, 10);
    }
    rep.results = top;
    var seen = new Set();
    top.forEach(function (r) {
      if (!seen.has(r.page.url)) { seen.add(r.page.url); rep.pages.push(r.page); }
    });
    rep.seeds = rep.pages.map(nodeForPage).filter(Boolean).map(function (n) { return n.id; });
    rep.covered.push("Scout scanned " + pages.length + " pages");
    swLog("ok", "Scout", "top hit: " + (top[0] ? top[0].page.title : "none"));
    agentStatus("scout", "reporting", "reporting " + rep.pages.length + " pages…");
    pulse(vis.hub, scoutAgent(), "#0a84ff", 4);
    await sleep(120);
    pulse(scoutAgent(), vis.hub, "#30d158", 4);
    agentStatus("scout", "done", rep.pages.length + " pages found");
    sparkle(vis.hub.x, vis.hub.y, "#30d158");
  }

  function scoutAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "scout"; })[0] || vis.hub;
  }

  // Mapper: BFS the knowledge graph from seed pages (1 hop, tags+hubs+pages).
  async function agentMapper(rep) {
    agentStatus("mapper", "active", "expanding…");
    swLog("", "Mapper", "seed nodes: " + (rep.seeds.slice(0, 5).join(", ") || "none"));
    await sleep(140);
    var nodeSet = new Set(), linkSet = new Set();
    rep.seeds.forEach(function (id) {
      nodeSet.add(id);
      (adjacency.get(id) || []).forEach(function (edge) {
        if (nodeSet.size > 90) return;
        var other = nodeById.get(edge.id);
        if (!other) return;
        nodeSet.add(edge.id);
        var key = [id, edge.id].sort().join("|");
        if (!linkSet.has(key)) { linkSet.add(key); rep.subgraph.links.push({ source: id, target: edge.id, kind: edge.kind }); }
      });
    });
    // also add pages connected to tags we found (2nd hop, cheap)
    var extra = [];
    nodeSet.forEach(function (id) {
      var n = nodeById.get(id);
      if (n && n.kind === "tag") {
        (adjacency.get(id) || []).forEach(function (edge) {
          if (nodeSet.size > 130) return;
          var other = nodeById.get(edge.id);
          if (!other || other.kind === "asset") return;
          nodeSet.add(edge.id);
          var key = [id, edge.id].sort().join("|");
          if (!linkSet.has(key)) { linkSet.add(key); rep.subgraph.links.push({ source: id, target: edge.id, kind: edge.kind }); }
        });
      }
    });
    nodeSet.forEach(function (id) {
      var n = nodeById.get(id);
      rep.subgraph.nodes.push({
        id: id, label: (n && n.label) || id, url: (n && n.url) || null,
        kind: (n && n.kind) || "note", category: (n && n.kind === "tag") ? "tag" : ((n && n.kind === "moc") ? "hub" : "page")
      });
    });
    var realLinks = rep.subgraph.links.filter(function (l) { return nodeSet.has(l.source) && nodeSet.has(l.target); });
    rep.subgraph.links = realLinks;
    var pagesInGraph = rep.subgraph.nodes.filter(function (n) { return n.kind === "note" && n.url; });
    rep.covered.push("Graph Mapper expanded to " + nodeSet.size + " graph nodes (" + pagesInGraph.length + " pages)");
    swLog("ok", "Mapper", nodeSet.size + " nodes, " + realLinks.length + " edges in topic subgraph");
    agentStatus("mapper", "reporting", "subgraph ready…");
    pulse(vis.hub, mapperAgent(), "#30d158", 4);
    await sleep(120);
    pulse(mapperAgent(), vis.hub, "#30d158", 4);
    agentStatus("mapper", "done", nodeSet.size + " nodes mapped");
  }

  function mapperAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "mapper"; })[0] || vis.hub;
  }

  // Tag Miner: aggregate tags/hashtags from result pages + graph tag nodes.
  async function agentTagMine(rep) {
    agentStatus("tagmine", "active", "mining #tags…");
    swLog("", "Tag Miner", "collecting tags from " + rep.pages.length + " pages");
    await sleep(120);
    var counts = new Map();
    rep.pages.forEach(function (p) {
      [p.tags, String(p.hashtags || "").split(/[\s,#]+/)].forEach(function (arr) {
        (Array.isArray(arr) ? arr : []).forEach(function (t) {
          t = String(t || "").trim().replace(/^#/, "").toLowerCase();
          if (t && t.length > 1) counts.set(t, (counts.get(t) || 0) + 1);
        });
      });
    });
    // graph tag nodes adjacent to our seeds count as strong signals
    rep.subgraph.nodes.forEach(function (n) {
      if (n.kind === "tag") {
        var t = String(n.label || n.id).replace(/^#/, "").toLowerCase();
        if (t && t.length > 1) counts.set(t, (counts.get(t) || 0) + 3);
      }
    });
    // query terms themselves are meaningful tags
    rep.qTokens.forEach(function (t) { counts.set(t, (counts.get(t) || 0) + 2); });
    rep.tags = Array.from(counts.entries())
      .filter(function (kv) { return kv[1] > 0; })
      .sort(function (a, b) { return b[1] - a[1]; })
      .slice(0, 16)
      .map(function (kv) { return { tag: kv[0], count: kv[1] }; });
    rep.covered.push("Tag Miner found " + rep.tags.length + " significant tags");
    swLog("ok", "Tag Miner", rep.tags.slice(0, 5).map(function (t) { return "#" + t.tag; }).join(" ") || "no tags yet");
    agentStatus("tagmine", "reporting", "tags mined…");
    pulse(vis.hub, tagAgent(), "#af52de", 4);
    await sleep(120);
    pulse(tagAgent(), vis.hub, "#af52de", 4);
    agentStatus("tagmine", "done", rep.tags.length + " tags");
  }

  function tagAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "tagmine"; })[0] || vis.hub;
  }

  // Categorist: coverage per content category.
  async function agentCategorist(rep) {
    agentStatus("categorist", "active", "grouping by category…");
    swLog("", "Categorist", "slicing findings by content type");
    await sleep(120);
    var cats = {};
    rep.pages.forEach(function (p) {
      var c = p.category || "page";
      cats[c] = (cats[c] || 0) + 1;
    });
    rep.categories = cats;
    var sorted = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; });
    var total = rep.pages.length || 1;
    sorted.forEach(function (c) {
      rep.covered.push(CATEGORY_LABEL[c] || c + " (" + cats[c] + ")");
      swLog("ok", "Categorist", (CATEGORY_LABEL[c] || c) + ": " + cats[c]);
    });
    agentStatus("categorist", "reporting", total + " pages categorized…");
    pulse(vis.hub, catAgent(), "#ff9f0a", 4);
    await sleep(120);
    pulse(catAgent(), vis.hub, "#ff9f0a", 4);
    agentStatus("categorist", "done", sorted.length + " categories");
  }

  function catAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "categorist"; })[0] || vis.hub;
  }

  // Weaver: explicit page-to-page relations (shared tags, graph edges).
  async function agentWeaver(rep) {
    agentStatus("weaver", "active", "linking pages…");
    swLog("", "Weaver", "comparing targets for shared tags and edges");
    await sleep(120);
    var relations = [];
    var byUrl = {};
    rep.pages.forEach(function (p) { byUrl[p.url] = p; });
    var urls = Object.keys(byUrl);
    var limit = Math.min(urls.length, 10);
    var tagSets = {};
    urls.slice(0, limit).forEach(function (u) {
      var p = byUrl[u];
      tagSets[u] = new Set((p.tags || []).map(function (t) { return String(t).toLowerCase(); }));
      String(p.hashtags || "").split(/[\s,#]+/).forEach(function (t) { t = t.trim().toLowerCase(); if (t) tagSets[u].add(t); });
    });
    // shared tags
    for (var i = 0; i < limit && relations.length < 14; i++) {
      for (var j = i + 1; j < limit && relations.length < 14; j++) {
        var shared = [];
        tagSets[urls[i]].forEach(function (t) { if (tagSets[urls[j]].has(t) && shared.length < 3) shared.push(t); });
        if (shared.length) {
          relations.push({ a: urls[i], b: urls[j], kind: "shared tag: #" + shared[0] });
        } else if (nodeLinkBetween(urls[i], urls[j])) {
          relations.push({ a: urls[i], b: urls[j], kind: "graph link" });
        }
      }
    }
    rep.relations = relations;
    rep.covered.push("Relation Weaver linked " + relations.length + " page pairs");
    swLog("ok", "Weaver", relations.length + " relations found");
    agentStatus("weaver", "reporting", relations.length + " relations…");
    pulse(vis.hub, weaveAgent(), "#ff375f", 4);
    await sleep(120);
    pulse(weaveAgent(), vis.hub, "#ff375f", 4);
    agentStatus("weaver", "done", relations.length + " relations");
  }

  function nodeLinkBetween(urlA, urlB) {
    var na = urlToNode.get(normalizeUrl(urlA)), nb = urlToNode.get(normalizeUrl(urlB));
    if (!na || !nb) return false;
    var set = new Set((adjacency.get(na.id) || []).map(function (e) { return e.id; }));
    return set.has(nb.id);
  }

  function weaveAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "weaver"; })[0] || vis.hub;
  }

  // Sage: synthesize the final answer package.
  async function agentSage(rep) {
    agentStatus("sage", "active", "thinking…");
    swLog("", "Sage", "merging all agent reports");
    await sleep(160);

    var kp = [], seen = new Set();
    rep.results.slice(0, 6).forEach(function (r) {
      var s = firstSentence(r.page.body || "");
      if (s && s.length > 40 && !seen.has(s)) { seen.add(s); kp.push({ text: s, page: r.page }); }
    });
    rep.keypoints = kp.slice(0, 4);

    // synthesis text
    var lines = [];
    var q = rep.query.trim() || "the site";
    if (rep.pages.length) {
      var top3 = rep.pages.slice(0, 3).map(function (p) { return p.title; });
      lines.push("The swarm fanned out across " + pages.length + " indexed pages and " +
        graphNodes.length + " knowledge-graph nodes to answer \u201C" + q + "\u201D. " +
        "Its strongest lead: " + top3.join(" · ") + ".");
    }
    var catTop = Object.keys(rep.categories).sort(function (a, b) { return rep.categories[b] - rep.categories[a]; });
    if (catTop.length) {
      lines.push("Material spans " + catTop.length + " content categories " +
        (catTop.slice(0, 3).map(function (c) { return CATEGORY_LABEL[c] || c; }).join(", ")) +
        (catTop.length > 3 ? " and more" : "") + " — " +
        catTop.map(function (c) { return (CATEGORY_LABEL[c] || c) + " (" + rep.categories[c] + ")"; }).join(", ") + ".");
    }
    if (rep.relations.length) {
      lines.push("The strongest " + rep.relations.length + " cross-connections tie these pages together via shared tags and graph links, so the topic is best read as a cluster, not a single page.");
    }
    if (rep.tags.length) {
      lines.push("The topic is most strongly tagged " + rep.tags.slice(0, 4).map(function (t) { return "#" + t.tag; }).join(" ") + ".");
    }
    if (!lines.length) {
      lines.push("No direct matches yet — try broader keywords, or explore the topic graph below.");
    }
    rep.summaryLines = lines;

    // X post
    var best = (rep.pages[0] && rep.pages[0].title) || q;
    var hash = rep.tags.slice(0, 4).map(function (t) { return "#" + t.tag.replace(/[^a-z0-9]/g, ""); }).filter(function (t) { return t.length > 1; }).join(" ") || (rep.qTokens.length ? "#" + rep.qTokens.slice(0, 3).join(" #") : "");
    var url = "https://pirahansiah.com/";
    if (rep.pages[0]) url = "https://pirahansiah.com" + rep.pages[0].url;
    rep.xpost = "Answers on \u201C" + q + "\u201D across the whole site: " + best + ". " +
      rep.covered.slice(0, 3).join(" · ") + ". " + url + " " + hash;

    swLog("ok", "Sage", "synthesis complete");
    agentStatus("sage", "reporting", "finalizing…");
    pulse(vis.hub, sageAgent(), "#5e5ce6", 4);
    await sleep(120);
    pulse(sageAgent(), vis.hub, "#5e5ce6", 4);
    agentStatus("sage", "done", "done");
    if (vis.agents.every(function (a) { return a.status === "done"; })) {
      sparkle(vis.hub.x - 20, vis.hub.y - 10, "#0a84ff");
      sparkle(vis.hub.x + 18, vis.hub.y - 14, "#30d158");
      sparkle(vis.hub.x + 6, vis.hub.y + 18, "#af52de");
    }
  }

  function sageAgent() {
    return vis.agents.filter(function (x) { return x.def.id === "sage"; })[0] || vis.hub;
  }

  /* ------------------------- result rendering --------------------------- */

  function renderSynthesis(rep) {
    if (ui.synth) {
      ui.synth.innerHTML = "";
      rep.summaryLines.forEach(function (l) {
        var p = el("p");
        p.textContent = l;
        ui.synth.appendChild(p);
      });
    }
    if (ui.kp) {
      ui.kp.innerHTML = "";
      if (!rep.keypoints.length) {
        ui.kp.appendChild(el("p", "swarm-muted", "No key sentences extracted — check the references below."));
      } else {
        rep.keypoints.forEach(function (k, i) {
          var row = el("div", "swarm-kp");
          var num = el("span", "swarm-kp-num", String(i + 1));
          var txt = el("span", "swarm-kp-text", k.text + " ");
          var src = el("a", "swarm-kp-src", "\u2192 " + k.page.title);
          src.href = k.page.url;
          src.target = "_blank";
          txt.appendChild(src);
          row.appendChild(num); row.appendChild(txt);
          ui.kp.appendChild(row);
        });
      }
    }
    renderCategories(rep);
    renderTagCloud(rep);
    renderRefs(rep);
    renderXPost(rep);
    renderRelationList(rep);
    renderGraph(rep);
    renderCovered(rep);
  }

  function renderCategories(rep) {
    if (!ui.cats) return;
    ui.cats.innerHTML = "";
    var sorted = Object.keys(rep.categories).sort(function (a, b) { return rep.categories[b] - rep.categories[a]; });
    if (!sorted.length) { ui.cats.innerHTML = '<span class="swarm-muted">No category data</span>'; return; }
    var max = Math.max.apply(null, sorted.map(function (c) { return rep.categories[c]; }));
    sorted.slice(0, 8).forEach(function (c) {
      var row = el("div", "swarm-cat-row");
      var lab = el("span", "swarm-cat-label", CATEGORY_LABEL[c] || c);
      var barWrap = el("span", "swarm-cat-bar-wrap");
      var bar = el("span", "swarm-cat-bar");
      bar.style.width = Math.max(6, (rep.categories[c] / max) * 100) + "%";
      barWrap.appendChild(bar);
      var cnt = el("span", "swarm-cat-count", String(rep.categories[c]));
      row.appendChild(lab); row.appendChild(barWrap); row.appendChild(cnt);
      ui.cats.appendChild(row);
    });
  }

  function renderTagCloud(rep) {
    if (!ui.cloud) return;
    ui.cloud.innerHTML = "";
    rep.tags.forEach(function (t) {
      var s = el("button", "swarm-cloud-tag", "#" + esc(t.tag));
      s.style.fontSize = Math.max(12, Math.min(22, 11 + t.count * 1.6)) + "px";
      s.title = t.count + " hits";
      s.addEventListener("click", function () { run(t.tag); });
      ui.cloud.appendChild(s);
    });
  }

  function renderRefs(rep) {
    if (!ui.refs) return;
    ui.refs.innerHTML = "";
    if (!rep.pages.length) { ui.refs.innerHTML = '<span class="swarm-muted">No references yet</span>'; return; }
    rep.pages.slice(0, 12).forEach(function (p, i) {
      var r = el("a", "swarm-ref", null);
      r.href = p.url;
      var num = el("span", "swarm-ref-num", String(i + 1));
      var body = el("span", "swarm-ref-body", null);
      var title = el("span", "swarm-ref-title", esc(p.title || p.url));
      var cat = el("span", "swarm-ref-cat", CATEGORY_LABEL[p.category] || p.category || "");
      var snip = el("span", "swarm-ref-snip", esc(cleanText(p.body || "").slice(0, 130)));
      body.appendChild(title); body.appendChild(cat);
      if (p.body) body.appendChild(snip);
      r.appendChild(num); r.appendChild(body);
      ui.refs.appendChild(r);
    });
  }

  function renderXPost(rep) {
    if (ui.xpost) ui.xpost.textContent = rep.xpost;
    var openLink = $("swarm-xpost-open");
    if (openLink) {
      openLink.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(rep.xpost);
    }
    if (ui.xcopy) {
      ui.xcopy.onclick = function () {
        var txt = rep.xpost;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () {
            ui.xcopy.textContent = "Copied!";
            setTimeout(function () { ui.xcopy.textContent = "Copy"; }, 1500);
          });
        } else {
          var ta = document.createElement("textarea");
          ta.value = txt; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); ui.xcopy.textContent = "Copied!"; } catch (e) {}
          document.body.removeChild(ta);
          setTimeout(function () { ui.xcopy.textContent = "Copy"; }, 1500);
        }
      };
    }
  }

  function renderRelationList(rep) {
    var box = $("swarm-relations");
    if (!box) return;
    box.innerHTML = "";
    if (!rep.relations.length) { box.innerHTML = '<span class="swarm-muted">No cross-page relations found yet.</span>'; return; }
    var byUrl = {};
    rep.pages.forEach(function (p) { byUrl[p.url] = p; });
    rep.relations.forEach(function (rel, i) {
      var a = byUrl[rel.a], b = byUrl[rel.b];
      var row = el("div", "swarm-rel");
      var ta = el("a", "swarm-rel-name", esc(a ? a.title : rel.a));
      ta.href = rel.a; ta.target = "_blank";
      var mid = el("span", "swarm-rel-kind", esc(rel.kind));
      var tb = el("a", "swarm-rel-name", esc(b ? b.title : rel.b));
      tb.href = rel.b; tb.target = "_blank";
      row.appendChild(ta); row.appendChild(mid); row.appendChild(tb);
      box.appendChild(row);
    });
  }

  function renderCovered(rep) {
    var box = $("swarm-covered");
    if (!box) return;
    box.innerHTML = "";
    rep.covered.forEach(function (c) {
      var chip = el("span", "swarm-chip", c);
      box.appendChild(chip);
    });
  }

  // Dynamic interactive knowledge subgraph (d3 force via canvas).
  var graphSim = null;
  function renderGraph(rep) {
    if (!ui.gwrap || !ui.gcanvas) return;
    if (graphSim) { graphSim.stop(); graphSim = null; }
    var g = $("swarm-graph");
    g.style.display = "block";
    var dpr = window.devicePixelRatio || 1;
    var W = ui.gwrap.clientWidth || 600;
    var H = ui.gwrap.clientHeight || 360;
    ui.gcanvas.width = W * dpr; ui.gcanvas.height = H * dpr;
    ui.gcanvas.style.width = W + "px"; ui.gcanvas.style.height = H + "px";
    var ctx = ui.gcanvas.getContext("2d");

    // Build the query-centric graph: query hub + top pages + tags + relations.
    var nodes = [{ id: "__query__", label: "Q: " + (rep.query.slice(0, 24)), url: null, category: "query", r: 13 }];
    var links = [];
    var byId = { __query__: nodes[0] };
    var pageIds = [];

    rep.pages.slice(0, 10).forEach(function (p, idx) {
      var id = "p" + idx;
      var n = { id: id, label: p.title || p.url, url: p.url, category: p.category || "page", r: 8 + Math.min(6, idx * 0.5) };
      nodes.push(n); byId[id] = n; pageIds.push(id);
      links.push({ source: "__query__", target: id, kind: "match", strength: 1.2 - idx * 0.05 });
    });

    rep.tags.slice(0, 10).forEach(function (t, idx) {
      var id = "t" + idx;
      nodes.push({ id: id, label: "#" + t.tag, url: null, category: "tag", r: 6 + Math.min(5, t.count) });
      byId[id] = nodes[nodes.length - 1];
      // attach tag to pages that carry it
      rep.pages.slice(0, 10).forEach(function (p, pi) {
        var tagText = ((p.tags || []).join(" ") + " " + (p.hashtags || "")).toLowerCase();
        if (tagText.indexOf(t.tag.replace(/^#/, "").toLowerCase()) >= 0) {
          links.push({ source: "p" + pi, target: id, kind: "tag", strength: 0.4 });
        }
      });
    });

    var urlToPageId = {};
    rep.pages.slice(0, 10).forEach(function (p, idx) { urlToPageId[p.url] = "p" + idx; });
    rep.relations.forEach(function (rel) {
      var ia = urlToPageId[rel.a], ib = urlToPageId[rel.b];
      if (!ia || !ib || ia === ib) return;
      links.push({ source: ia, target: ib, kind: "rel", strength: 0.5 });
    });

    if (!window.d3) { ctx.fillStyle = "#8e8e93"; ctx.font = "14px sans-serif"; ctx.fillText("Graph library unavailable.", 20, 30); return; }

    var sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function (d) { return d.id; }).distance(function (l) { return l.kind === "match" ? 110 : 60; }).strength(function (l) { return l.strength || 0.4; }))
      .force("charge", d3.forceManyBody().strength(-220).distanceMax(280))
      .force("center", d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force("collide", d3.forceCollide().radius(function (d) { return d.r + 4; }))
      .alphaDecay(0.03)
      .on("tick", function () { drawGraph(ctx, W, H, dpr, nodes, links); });
    graphSim = sim;

    // interactions: hover + click-to-open
    var hover = null;
    ui.gcanvas.onmousemove = function (e) {
      var rect = ui.gcanvas.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var hit = null;
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        var dx = x - n.x, dy = y - n.y;
        if (dx * dx + dy * dy <= (n.r + 5) * (n.r + 5)) { hit = n; break; }
      }
      if (hit !== hover) { hover = hit; ui.gcanvas.style.cursor = (hit && hit.url) ? "pointer" : "default"; drawGraph(ctx, W, H, dpr, nodes, links, hit); }
    };
    ui.gcanvas.onmouseleave = function () { hover = null; drawGraph(ctx, W, H, dpr, nodes, links, null); };
    ui.gcanvas.onclick = function (e) {
      var rect = ui.gcanvas.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        var dx = x - n.x, dy = y - n.y;
        if (dx * dx + dy * dy <= (n.r + 5) * (n.r + 5)) {
          if (n.url) { window.open(n.url, "_blank"); }
          return;
        }
      }
      if (rep.tags.length && nodes.length > 1) { /* click empty space: nothing */ }
    };
  }

  function drawGraph(ctx, W, H, dpr, nodes, links, hover) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var isDark = matchMedia("(prefers-color-scheme:dark)").matches;
    ctx.fillStyle = isDark ? "#0d1117" : "#f8f9fa";
    ctx.fillRect(0, 0, W, H);

    var hovSet = new Set();
    if (hover) {
      links.forEach(function (l) {
        if (l.source === hover || l.target === hover) {
          hovSet.add(l.source); hovSet.add(l.target);
        }
      });
    }

    links.forEach(function (l) {
      if (!l.source.x || !l.target.x) return;
      var hl = hover && (l.source === hover || l.target === hover);
      ctx.beginPath(); ctx.moveTo(l.source.x, l.source.y); ctx.lineTo(l.target.x, l.target.y);
      ctx.strokeStyle = l.kind === "tag" ? "rgba(175,82,222,0.45)" : l.kind === "rel" ? "rgba(255,55,95,0.4)" : "rgba(10,132,255,0.35)";
      ctx.lineWidth = hl ? 1.6 : 0.7;
      ctx.globalAlpha = hl ? 0.95 : (hover ? 0.12 : 0.6);
      ctx.stroke(); ctx.globalAlpha = 1;
    });

    nodes.forEach(function (n) {
      if (n.x == null) return;
      var c = COLORS[n.category] || "#8e8e93";
      if (n.category === "page" && n.url && n.url.indexOf("/notes/pubs/") >= 0) c = "#0a84ff";
      var isHov = hover === n;
      var isConn = hover && hovSet.has(n);
      var dim = hover && !isHov && !isConn;
      ctx.globalAlpha = dim ? 0.15 : 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      if (isHov) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
      var label = n.label || n.id;
      if (label.length > 26) label = label.slice(0, 24) + "…";
      ctx.font = (n.category === "query" ? "700 " : "400 ") + "10px -apple-system, system-ui, sans-serif";
      ctx.fillStyle = isDark ? "#f5f5f7" : "#1d1d1f";
      ctx.textAlign = "center";
      ctx.fillText(label, n.x, n.y + n.r + 11);
      ctx.globalAlpha = 1;
    });
  }

  /* ------------------------------ orchestration ------------------------- */

  function enableInput(on) {
    ui.query.disabled = !on;
    ui.ask.disabled = !on;
  }

  function resetPanels() {
    ["swarm-synthesis", "swarm-keypoints", "swarm-cat-bars", "swarm-tagcloud", "swarm-refs", "swarm-relations", "swarm-covered"].forEach(function (id) {
      var el2 = $(id); if (el2) el2.innerHTML = "";
    });
    var xp = $("swarm-xpost-body"); if (xp) xp.textContent = "";
    var g = $("swarm-graph"); if (g) g.style.display = "none";
    if (ui.console) ui.console.innerHTML = "";
    if (ui.notice) ui.notice.style.display = "none";
  }

  function showLoading(on) {
    if (ui.loading) ui.loading.style.display = on ? "flex" : "none";
  }

  async function run(query) {
    query = String(query || "").trim();
    if (!query || swarmState.running) return;
    if (!pages.length || !graphNodes.length) {
      swLog("warn", "System", "Indexes still loading — try again in a moment.");
      return;
    }
    swarmState.running = true;
    swarmState.agentsActive = AGENTS.length;
    resetPanels();
    visSetup();
    visStart();
    enableInput(false);
    if (ui.query) ui.query.value = query;
    setStat("swarm running…");

    report = makeReport(query);
    swarmState.phase = "dispatched " + AGENTS.length + " agents";
    // fan-out: all agents start, then report (visualized via staggered pulses)
    try {
      pulse(vis.hub, scoutAgent(), "#0a84ff", 4);
      await sleep(60);
      pulse(vis.hub, mapperAgent(), "#30d158", 4);
      await sleep(60);
      pulse(vis.hub, tagAgent(), "#af52de", 4);
      await sleep(60);
      pulse(vis.hub, catAgent(), "#ff9f0a", 4);
      await sleep(60);
      pulse(vis.hub, weaveAgent(), "#ff375f", 4);
      await sleep(60);
      pulse(vis.hub, sageAgent(), "#5e5ce6", 4);

      await Promise.all([
        agentScout(report)
      ]);
      swarmState.phase = "graph expansion + tags + categories…";
      await Promise.all([
        agentMapper(report),
        agentTagMine(report),
        agentCategorist(report)
      ]);
      swarmState.phase = "relation weaver + synthesis…";
      await agentWeaver(report);
      await agentSage(report);
      swarmState.phase = "";
      renderSynthesis(report);
      setStat("6 agents · " + report.pages.length + " pages · " + report.subgraph.nodes.length + " graph nodes · " + report.relations.length + " relations");
    } catch (err) {
      swLog("warn", "System", "agent error: " + err.message);
      setStat("swarm interrupted");
    } finally {
      swarmState.running = false;
      enableInput(true);
    }
  }

  function abort() {
    swarmState.running = false;
    enableInput(true);
    setStat("swarm stopped");
  }

  /* ------------------------------- init --------------------------------- */

  function init() {
    visResize();
    window.addEventListener("resize", visResize);
    if (ui.ask) {
      ui.ask.addEventListener("click", function () { run(ui.query ? ui.query.value : ""); });
    }
    if (ui.query) {
      ui.query.addEventListener("keydown", function (e) { if (e.key === "Enter") run(ui.query.value); });
    }
    if (ui.suggs) {
      ui.suggs.querySelectorAll("[data-q]").forEach(function (b) {
        b.addEventListener("click", function () { run(b.getAttribute("data-q")); });
      });
    }
    setStat("loading site index…");
    Promise.all([
      fetch(INDEX_URL).then(function (r) { if (!r.ok) throw new Error("index " + r.status); return r.json(); }),
      fetch(GRAPH_URL).then(function (r) { if (!r.ok) throw new Error("graph " + r.status); return r.json(); })
    ]).then(function (data) {
      buildIndex(data[0]);
      setupGraph(data[1]);
      showLoading(false);
      enableInput(true);
      setStat(pages.length + " pages · " + graphNodes.length + " graph nodes · " + graphLinks.length + " connections ready");
      visSetup();
      visStart(); // idle animation
      swLog("ok", "System", "swarm ready — " + pages.length + " pages, " + graphNodes.length + " graph nodes indexed");
    }).catch(function (e) {
      showLoading(false);
      setStat("failed to load indexes (" + e.message + ")");
      swLog("warn", "System", "could not load site indexes: " + e.message);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.SiteSwarm = { run: run, abort: abort, state: function () { return swarmState; } };
})();