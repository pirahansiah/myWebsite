/* =========================================================================
   WebGPU LLM Search — in-browser LLM (transformers.js, WebGPU with WASM
   fallback) over the full-text site index (llm-index.json), BM25 retrieval,
   streaming answers, a connection dashboard built from graph.json, and a
   conversation panel.

   Rewrite notes (v2):
   - Retrieval: inverted index + BM25 (was: full scan + per-query TF rebuild).
   - O(1) lookups for pages and graph nodes (were linear scans inside loops).
   - Fixed d3 bug where the node selection was the <title> element, so the
     force graph never actually moved.
   - Single-flight model loading + a generation queue (concurrent Ask/Chat
     calls used to download the model twice and interleave generations).
   - Stop button (Ask doubles as Stop while generating).
   - Correct line numbers per chunk; hashtags no longer injected into body.
   - Streamed tokens flushed on rAF instead of per-token DOM writes.
   - Null-safe DOM access, escaped URLs, no duplicated key points.
   Public API: window.LLMSearch = { search, stop, reload, state }.
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------ config -------------------------------- */

  // v3.8.1 = last stable with mature WebGPU support (v4.x WebGPU runtime is buggy)
  var CDNS = [
    "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1",
    "https://unpkg.com/@huggingface/transformers@3.8.1"
    // NOTE: the old cdnjs entry was dropped — cdnjs has no bare-package entry
    // point, so `import(".../libs/transformers.js/3.8.1")` always 404'd.
  ];
  var INDEX_URL = "/assets/llm-index.json";
  var GRAPH_URL = "/assets/graph.json";

  // Each model carries its measured ONNX download size (int8) plus an ESTIMATE
  // of total session RAM = weights + KV cache + context/activation buffers.
  // KV cache is estimated at the model's typical context (full window for tiny
  // models, ~2k tokens for large-window models). These are estimates, not
  // guarantees — real usage varies with context length and backend.
  var MODEL_OPTIONS = [
    { id: "Xenova/LaMini-Flan-T5-77M",            label: "Micro — Flan-T5 77M",      seq2seq: true,  weightsMB: 90,   window: 512,   kvMB: 12,  totalMB: 150 },
    { id: "Xenova/llama2.c-stories15M",           label: "Nano — stories 15M",       seq2seq: false, weightsMB: 15,   window: 256,   kvMB: 4,   totalMB: 25 },
    { id: "Xenova/llama2.c-stories42M",           label: "Pico — stories 42M",       seq2seq: false, weightsMB: 40,   window: 1024,  kvMB: 32,  totalMB: 95 },
    { id: "Xenova/llama2.c-stories110M",          label: "Slim — stories 110M",      seq2seq: false, weightsMB: 105,  window: 1024,  kvMB: 72,  totalMB: 230 },
    { id: "Xenova/distilgpt2",                    label: "Compact — DistilGPT-2",    seq2seq: false, weightsMB: 226,  window: 1024,  kvMB: 36,  totalMB: 375 },
    { id: "Xenova/LaMini-GPT-124M",               label: "Tiny — LaMini 124M",       seq2seq: false, weightsMB: 268,  window: 1024,  kvMB: 72,  totalMB: 475 },
    { id: "Xenova/Qwen1.5-0.5B-Chat",             label: "Medium — Qwen1.5 0.5B",    seq2seq: false, weightsMB: 460,  window: 32768, kvMB: 384, totalMB: 1100 },
    { id: "onnx-community/Qwen2.5-0.5B-Instruct", label: "Balanced — Qwen2.5 0.5B",  seq2seq: false, weightsMB: 488,  window: 32768, kvMB: 48,  totalMB: 780 },
    { id: "onnx-community/Qwen2.5-1.5B-Instruct", label: "Large — Qwen2.5 1.5B",     seq2seq: false, weightsMB: 1506, window: 32768, kvMB: 112, totalMB: 2400 }
  ];
  var MODEL_KEY = "llm-model-id";
  var DEVICE_KEY = "llm-device-v5";   // bumped: iOS/Android now try WebGPU for decoder-only models
  var MODE_KEY = "llm-device-mode";   // "auto" | "webgpu" | "wasm" (manual override)

  // ---- Embedded / mobile / low-memory profile ----
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(navigator.userAgent);
  var isMobile = isIOS || isAndroid || /Mobile|Tablet/i.test(navigator.userAgent);
  var isSafari = /Safari\//.test(navigator.userAgent) && !/Chrome|Chromium|Firefox|Edg/.test(navigator.userAgent);
  var isWebKit = isSafari || isIOS;
  // NOTE: desktop Safari is deliberately NOT low-mem — it is a known-working
  // WASM path; only iOS/Android/unknown-RAM small desktops get the tight
  // profile.
  var approxGB = navigator.deviceMemory || (isIOS ? 6 : 0);   // 0 = unknown
  var isLowMem = isMobile || (approxGB > 0 && approxGB <= 6);

  function modelOption(id) {
    for (var i = 0; i < MODEL_OPTIONS.length; i++) if (MODEL_OPTIONS[i].id === id) return MODEL_OPTIONS[i];
    return null;
  }

  function isSeq2Seq(id) {
    id = String(id || "");
    var o = modelOption(id);
    if (o) return !!o.seq2seq;
    return /flan-t5|t5-/i.test(id) || id.indexOf("LaMini-Flan-T5") >= 0;
  }

  // Manual backend override ("auto" | "webgpu" | "wasm"). Auto = the smart
  // per-device ladder below; "webgpu"/"wasm" force a backend (with a safe
  // fallback so the page never hard-fails).
  function deviceMode() {
    var m = storageGet(MODE_KEY);
    return (m === "webgpu" || m === "wasm") ? m : "auto";
  }

  // Models that fit this device's RAM budget (used to disable the rest).
  function ramAllowed(totalMB) {
    if (isIOS || isAndroid) return totalMB <= 260;   // 6 GB phones: tiny models only
    if (isLowMem) return totalMB <= 500;             // low-mem desktops: up to ~0.5 GB
    return true;                                     // full desktops: everything
  }

  function ramLabel(totalMB) {
    return totalMB >= 1024 ? (totalMB / 1024).toFixed(1) + " GB" : totalMB + " MB";
  }

  // The next model SMALLER than `id` (by total RAM) — the OOM auto-downgrade
  // steps down one rung at a time. Returns null when `id` is already the
  // smallest (so we never downgrade to a *bigger* model, and never loop).
  function smallerThan(id) {
    var o = modelOption(id);
    if (!o) return null;
    var best = null;
    for (var i = 0; i < MODEL_OPTIONS.length; i++) {
      var m = MODEL_OPTIONS[i];
      if (m.totalMB < o.totalMB && (!best || m.totalMB > best.totalMB)) best = m;
    }
    return best;
  }

  // Best phone default: the smallest DECODER-ONLY model with a usable window
  // (>=1024 tokens). Decoder-only models run on WebGPU (q4f16) with far less
  // system RAM than the WASM int8 heap, which OOMs iPhone 14 Pro Max even with
  // tiny models. seq2seq (Flan-T5) is avoided as a phone default.
  function phoneDefaultId() {
    var best = null;
    for (var i = 0; i < MODEL_OPTIONS.length; i++) {
      var m = MODEL_OPTIONS[i];
      if (m.seq2seq || m.window < 1024) continue;
      if (!best || m.totalMB < best.totalMB) best = m;
    }
    return best ? best.id : MODEL_OPTIONS[0].id;
  }

  // Migrate away from TinyStories (stories42M) and force phone-safe Micro.
  // storageGet/Set are function decls (hoisted). On iOS/Android always force
  // Micro; on other low-mem keep Micro/Tiny only.
  (function migrateModelChoice() {
    var saved = storageGet(MODEL_KEY);
    var opt = saved ? modelOption(saved) : null;
    // Phones default to the smallest decoder-only model (Pico, WebGPU-capable);
    // desktops default to Flan-T5. A saved model that still fits is kept (so a
    // user's Nano/Flan-T5 pick survives).
    var def = (isIOS || isAndroid) ? phoneDefaultId() : MODEL_OPTIONS[0].id;
    if (!opt || !ramAllowed(opt.totalMB)) storageSet(MODEL_KEY, def);
    if (isIOS || isAndroid) { try { localStorage.removeItem("llm-device-v2"); } catch (e) {} }
  })();

  var CHUNK_MAX = isLowMem ? 450 : 700;   // chars per retrieval chunk
  var BM25_K1 = 1.5;
  var BM25_B = 0.75;
  var FIELD_BOOST = 2;      // extra tf credit for terms in title/heading/tags
  var MAX_NEW_TOKENS = isLowMem ? 192 : 540;   // answer budget for models with big windows
  var TINY_WINDOW = isLowMem ? 1024 : 2048;    // below this window: short prompt + shorter answers
  var GRAPH_HEIGHT = 240;

  /* ---------------------------- tiny helpers ----------------------------- */

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // Only allow same-origin paths and http(s) — blocks javascript: in index data.
  function safeUrl(u) {
    var s = String(u || "");
    if (/^\/(?!\/)/.test(s) || /^https?:\/\//i.test(s)) return esc(s);
    return "#";
  }

  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }

  // onnxruntime-web surfaces some internal failures as bare numeric codes —
  // per upstream transformers.js issue #688 those are OUT-OF-MEMORY errors
  // (the number is the failed allocation size in bytes). Make them
  // comprehensible instead of showing a raw number.
  function isOomError(e) {
    var m = String((e && e.message) || e || "");
    if (/^\d+$/.test(m)) return true;
    return /out of memory|array buffer allocation failed|allocation failed|not enough memory/i.test(m);
  }

  function friendlyError(e) {
    var m = (e && e.message) || e || "";
    m = String(m);
    if (/^\d+$/.test(m)) {
      return "ran out of memory while allocating ~" + Math.round(Number(m) / 1048576) + " MB (onnxruntime code " + m + ")";
    }
    return m;
  }

  function debounce(fn, ms) {
    var t = 0;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  // Buffered writer: streaming tokens hit the DOM once per frame, not per token.
  function streamWriter(el) {
    var buf = "", raf = 0;
    function flush() { raf = 0; if (!buf || !el) return; el.textContent += buf; buf = ""; }
    return {
      write: function (t) { buf += t; if (!raf) raf = requestAnimationFrame(flush); },
      finish: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } flush(); },
      reset: function () { if (raf) { cancelAnimationFrame(raf); raf = 0; } buf = ""; if (el) el.textContent = ""; }
    };
  }

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function selectedModelId() {
    var saved = storageGet(MODEL_KEY);
    for (var i = 0; i < MODEL_OPTIONS.length; i++) if (MODEL_OPTIONS[i].id === saved) return saved;
    return MODEL_OPTIONS[0].id;
  }

  /* --------------- model download mirror fallback (HF → hf-mirror) ------- */

  // huggingface.co is sometimes unreachable (Cloudflare 521 "origin down"),
  // which killed model downloads and forced full re-downloads. Patch fetch
  // once: a failed or 5xx model-file request transparently retries on the
  // hf-mirror.com CDN (same files, Range supported for ONNX). Only
  // huggingface.co URLs are rewritten; 404s pass through untouched.
  var MIRROR_HOST = "hf-mirror.com";
  var __mirrorInstalled = false;

  function mirrorUrl(u) {
    u = String(u);
    return /^https?:\/\/huggingface\.co\//.test(u)
      ? "https://" + MIRROR_HOST + "/" + u.replace(/^https?:\/\/huggingface\.co\//, "")
      : u;
  }

  function installMirrorFallback() {
    if (__mirrorInstalled || typeof window === "undefined" || !window.fetch) return;
    __mirrorInstalled = true;
    var realFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var isHf = typeof input === "string" && /^https?:\/\/huggingface\.co\//.test(input);
      if (!isHf) return realFetch(input, init);
      return realFetch(input, init).then(function (res) {
        if (res.ok || res.status < 500) return res;   // 404: mirror won't have it either
        if (res.body && res.body.cancel) res.body.cancel();    // drop the failed body
        console.warn("HF HTTP " + res.status + " for " + String(input).split("/").pop() + " — retrying on " + MIRROR_HOST);
        return realFetch(mirrorUrl(input), init);
      }, function (err) {
        // Mirror failure propagates straight to the caller (the pipeline
        // retry above); it must NOT be re-caught here and retried again.
        console.warn("HF fetch failed (" + (err && err.message) + ") — retrying on " + MIRROR_HOST);
        return realFetch(mirrorUrl(input), init);
      });
    };
  }
  installMirrorFallback();

  /* ----------------------- model loading (single flight) ----------------- */

  var mod = null;          // transformers.js module
  var modPromise = null;   // in-flight import
  var generator = null;
  var genPromise = null;   // in-flight pipeline load
  var genModelId = null;   // model belonging to generator/genPromise
  var device = null;       // "webgpu" | "wasm"
  var dtype = null;
  var stopper = null;      // InterruptableStoppingCriteria, when available

  // Configure the ONNX runtime for this device BEFORE any pipeline call:
  // multi-threaded WASM is a common crash/hang source on Safari/iOS (no
  // cross-origin isolation -> no SharedArrayBuffer), and threads add little
  // on embedded devices. Called once right after the module loads.
  function configureOnnxForDevice(m) {
    try {
      if (!m || !m.env || !m.env.backends || !m.env.backends.onnx) return;
      if (isWebKit || isLowMem) {
        m.env.backends.onnx.wasm.numThreads = 1;
      } else {
        m.env.backends.onnx.wasm.numThreads = Math.min(
          4, Math.max(1, (navigator.hardwareConcurrency || 4) >> 1)
        );
      }
      if (isLowMem) m.env.backends.onnx.wasm.proxy = false;
      console.log("ONNX backend: numThreads=" + m.env.backends.onnx.wasm.numThreads);
    } catch (e) {
      console.warn("ONNX env config skipped:", e);
    }
  }

  function loadModule() {
    if (mod) return Promise.resolve(mod);
    if (modPromise) return modPromise;                 // <- was re-importing on every call
    var tryCdn = function (urls) {
      if (!urls.length) return Promise.reject(new Error("All CDNs unreachable."));
      return import(urls[0]).then(function (m) {
        if (!m || !m.pipeline) throw new Error("Transformers.js loaded, but pipeline() is unavailable.");
        mod = m;
        configureOnnxForDevice(m);
        return m;
      }).catch(function (e) {
        console.warn("CDN load failed (" + urls[0] + "), trying next:", e && e.message);
        return tryCdn(urls.slice(1));
      });
    };
    modPromise = tryCdn(CDNS).catch(function (e) { modPromise = null; throw e; });
    return modPromise;
  }

  // Called from external code (model switch, reload, pagehide) it waits for
  // any in-flight load so a half-finished download can't install its
  // generator afterwards. Called from INSIDE the load chain (WebGPU → WASM
  // fallback) it must NOT wait: the in-flight promise is the very chain we
  // are running in, so waiting would deadlock.
  function disposeGenerator(fromLoadChain) {
    if (genPromise && !fromLoadChain) {
      var pending = genPromise;
      return pending.catch(function () {}).then(function () {
        if (genPromise === pending) genPromise = null;
        return disposeGenerator();
      });
    }
    try {
      if (generator && generator.model && typeof generator.model.dispose === "function") generator.model.dispose();
    } catch (e) { console.warn("Cleanup warning:", e); }
    generator = null; genModelId = null; device = null; dtype = null;
    return Promise.resolve();
  }

  function deviceLabel() { return device ? device.toUpperCase() + (dtype ? " " + dtype : "") : "—"; }

  // Returns the shared generator. Concurrent callers share one download.
  function ensureGenerator(onStatus, onProgress) {
    var modelId = selectedModelId();
    if (generator && genModelId === modelId) {
      onStatus && onStatus("Reusing already-loaded " + deviceLabel() + " model.");
      return Promise.resolve(generator);
    }
    if (genPromise) {
      if (genModelId === modelId) {
        onStatus && onStatus("Model is already loading…");
        return genPromise;                              // <- was starting a 2nd download
      }
      // A different model was picked while another download was in flight:
      // wait for it to settle, dispose it, then load the new one. Never let
      // two downloads run concurrently.
      onStatus && onStatus("Model changed — finishing the current load, then switching…");
      return disposeGenerator().then(function () {
        return ensureGenerator(onStatus, onProgress);
      });
    }
    if (!window.isSecureContext) {
      return Promise.reject(new Error("This requires a secure context (https:// or localhost)."));
    }

    var shortName = modelId.split("/").pop() || "model";

    var flight = loadModule().then(function () {
      function tryLoad(dev, dt) {
        onStatus && onStatus("Downloading " + shortName + " (" + dev.toUpperCase() + ", " + dt + ")…");
        var task = isSeq2Seq(modelId) ? "text2text-generation" : "text-generation";
        return mod.pipeline(task, modelId, {
          device: dev,
          dtype: dt,
          progress_callback: function (d) {
            if (!d) return;
            if (d.status === "progress") {
              var pct = Math.round(Number(d.progress) || 0);
              onStatus && onStatus("Downloading " + ((d.file || "").split("/").pop() || "model file") + " — " + pct + "%");
              onProgress && onProgress(pct);
            } else if (d.status === "initiate" || d.status === "start") {
              onStatus && onStatus("Starting model download…");
            } else if (d.status === "done") {
              onStatus && onStatus("Model file downloaded.");
            } else if (d.status === "ready") {
              onStatus && onStatus("Model loaded. Preparing " + dev.toUpperCase() + " inference…");
            }
          }
        });
      }

      // transformers.js caches fully-downloaded files in Cache Storage, so a
      // retry after a transient network failure (e.g. Cloudflare 521 "origin
      // down") re-fetches only the file that failed — the rest comes from cache.
      function tryLoadWithRetry(dev, dt, attemptsLeft) {
        attemptsLeft = attemptsLeft == null ? 1 : attemptsLeft;
        return tryLoad(dev, dt).catch(function (e) {
          // Only retry TRANSIENT network failures. An out-of-memory (numeric
          // code) or an unsupported backend/dtype will fail the same way again,
          // so re-downloading it only wastes bandwidth and looks like the page
          // is "downloading the model over and over".
          if (attemptsLeft <= 0 || isOomError(e)) throw e;
          var msg = String((e && e.message) || e || "");
          var net = /fetch|network|load failed|timeout|temporar|521|503|502|429|retry|errno|socket/i.test(msg);
          if (!net) throw e;
          console.warn(dev + "/" + dt + " load failed (" + friendlyError(e) + ") — " + attemptsLeft + " retry(ies) left.");
          onStatus && onStatus("Network hiccup while downloading — retrying… (" + attemptsLeft + " left)");
          onProgress && onProgress(0);
          return new Promise(function (res) { setTimeout(res, 2500); }).then(function () {
            return tryLoadWithRetry(dev, dt, attemptsLeft - 1);
          });
        });
      }

      // A WebGPU session build that hangs (known on some Chrome versions)
      // must not block the page forever — cap it and fall back to WASM.
      function withTimeout(promise, ms, label) {
        return new Promise(function (resolve, reject) {
          var t = setTimeout(function () {
            reject(new Error(label + " timed out after " + Math.round(ms / 1000) + "s"));
          }, ms);
          promise.then(function (v) { clearTimeout(t); resolve(v); },
            function (e) { clearTimeout(t); reject(e); });
        });
      }

      // int8 exists for all four models; q8 does not, and q4 is WebGPU-only in v3.
      // Do not fall back to fp32: that downloads a second variant and caused
      // the 3–6 GB memory spikes on embedded devices.
      function loadWasm() {
        var dt = "int8";
        return tryLoadWithRetry("wasm", dt).then(function (g) {
          storageSet(DEVICE_KEY, "wasm");
          generator = g; genModelId = modelId; device = "wasm"; dtype = dt; return g;
        });
      }

      // Decide the WebGPU dtype from adapter features BEFORE downloading. Old
      // WebGPU implementations without shader-f16 use WASM instead of trying
      // q4 and then downloading a second variant after a runtime failure.
      function loadWebgpu() {
        return navigator.gpu.requestAdapter().then(function (adapter) {
          if (!adapter) return null;
          var f16 = !!(adapter.features && adapter.features.has && adapter.features.has("shader-f16"));
          if (!f16) {
            onStatus && onStatus("Older WebGPU detected — using WASM int8 (one model download)…");
            return null;
          }
          var dt = "q4f16";
          onStatus && onStatus("WebGPU " + dt + " (one model download)…");
          // Chrome's WebGPU runtime can fail with numeric onnxruntime codes
          // or hang during session build — cap the attempt, then fall back to
          // WASM (which Safari already uses successfully).
          return withTimeout(tryLoadWithRetry("webgpu", dt), 60000, "WebGPU").then(function (g) {
            storageSet(DEVICE_KEY, "webgpu");
            generator = g; genModelId = modelId; device = "webgpu"; dtype = dt; return g;
          }, function (e) {
            // Fall back to WASM for ANY WebGPU failure — including OOM:
            // GPU and CPU memory budgets differ (an iPhone can fail the
            // 500MB WASM heap yet fit the q4f16 GPU session, or vice versa).
            // If the WASM attempt also OOMs, the top-level handler downgrades
            // to the Micro model.
            console.warn("WebGPU load failed, falling back to WASM:", e);
            onStatus && onStatus("WebGPU failed (" + friendlyError(e) + ") — using WASM int8…");
            onProgress && onProgress(0);
            storageSet(DEVICE_KEY, "wasm");
            return disposeGenerator(true).then(loadWasm);
          });
        }, function (e) {
          // Two-arg form: this ONLY handles requestAdapter() failing. It must
          // not catch rejections from the pipeline/fallback above — those
          // must propagate so the OOM downgrade can run.
          console.warn("WebGPU adapter unavailable:", e);
          return null;
        });
      }

      // Desktop Safari: WASM only (WebGPU session build is unstable).
      // iOS / Android: decoder-only models (stories/gpt2/Qwen) get a WebGPU
      // attempt — the q4f16 GPU session needs far less system RAM than the
      // WASM int8 heap (which OOMs iPhone 14 Pro Max even with tiny models).
      // seq2seq (Flan-T5) stays on WASM on phones (seq2seq WebGPU is unreliable).
      // The user can override all of this with the "Method" selector.
      var mode = deviceMode();
      var preferWasm = isLowMem && !navigator.gpu;
      var skipWebgpu = mode === "wasm" ||
                       (isSafari && !isIOS) ||
                       ((isIOS || isAndroid) && isSeq2Seq(modelId)) ||
                       storageGet(DEVICE_KEY) === "wasm" ||
                       preferWasm;
      if (mode === "webgpu" && navigator.gpu) {
        onStatus && onStatus("Manual WebGPU mode — attempting WebGPU…");
        return loadWebgpu().then(function (g) {
          if (g) return g;
          onStatus && onStatus("WebGPU unavailable — falling back to WASM…");
          return loadWasm();
        });
      }
      if (navigator.gpu && !skipWebgpu) {
        return loadWebgpu().then(function (g) {
          if (g) return g;
          onStatus && onStatus("WebGPU unavailable — using WASM (slower)…");
          return loadWasm();
        });
      }
      onStatus && onStatus(mode === "wasm"
        ? "Manual WASM mode — using WASM int8 (universal)…"
        : (isLowMem ? "Mobile / low-memory profile — using WASM int8…"
                    : "WebGPU unavailable — using WASM (slower)…"));
      return loadWasm();
    }).then(function (g) {
      if (genPromise === flight) genPromise = null;
      return g;
    }, function (e) {
      if (genPromise === flight) genPromise = null;
      // Out of memory: drop to the smallest model and try once more. The
      // numeric onnxruntime codes are allocation failures (issue #688), so
      // loading the same model again would fail the same way.
      var smaller = isOomError(e) ? smallerThan(modelId) : null;
      if (smaller) {
        console.warn("Out of memory loading " + modelId + " — retrying with " + smaller.id + ":", e);
        onStatus && onStatus("Not enough memory for " + shortName + " — retrying with " + (smaller.label || smaller.id) + "…");
        onProgress && onProgress(0);
        storageSet(MODEL_KEY, smaller.id);
        storageSet(DEVICE_KEY, "wasm");   // the retry must skip WebGPU
        if (ui && ui.modelSelect) ui.modelSelect.value = smaller.id;
        updateRamInfo();
        return ensureGenerator(onStatus, onProgress);
      }
      // Micro already selected and still OOM — let callers fall back to extractive.
      throw e;
    });
    genPromise = flight;
    genModelId = modelId;
    return flight;
  }

  // One generation at a time — transformers.js sessions are not re-entrant.
  var genQueue = Promise.resolve();
  var generating = false;
  function enqueue(task) {
    var run = genQueue.then(task, task);
    genQueue = run.then(function () {}, function () {});
    return run;
  }
  function stopGeneration() { if (stopper && stopper.interrupt) stopper.interrupt(); }
  function stoppingOpts() {
    if (mod && mod.InterruptableStoppingCriteria) {
      stopper = new mod.InterruptableStoppingCriteria();
      return { stopping_criteria: stopper };
    }
    stopper = null;
    return {};
  }

  /* --------------------------- text processing --------------------------- */

  var STOPWORDS = new Set(("a an the is are was were be been being of to in on for with and or but not this that " +
    "these those it its as at by from into about how what when where why who which do does did can could should " +
    "would will shall").split(" "));

  function tokenize(str) {
    var out = [];
    var m = String(str).toLowerCase().match(/[a-z0-9]+/g);
    if (!m) return out;
    for (var i = 0; i < m.length; i++) if (m[i].length > 1 && !STOPWORDS.has(m[i])) out.push(m[i]);
    return out;
  }

  function uniq(arr) {
    var seen = Object.create(null), out = [];
    for (var i = 0; i < arr.length; i++) if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); }
    return out;
  }

  /* Chunker: splits on markdown headings, packs paragraphs to ~CHUNK_MAX and
     keeps a per-line map back to the SOURCE line numbers (the old version
     computed startLine from a running offset and drifted badly). */
  function chunkText(text, filename, maxLen) {
    maxLen = maxLen || CHUNK_MAX;
    var lines = String(text || "").split(/\r?\n/);
    var chunks = [];
    var heading = filename;
    var buf = [], bufLen = 0;
    var para = [], paraStart = 1;

    function flush() {
      if (!buf.length) return;
      var textLines = [], lineNums = [];
      for (var i = 0; i < buf.length; i++) {
        if (i) { textLines.push(""); lineNums.push(0); }
        var pl = buf[i].text.split("\n");
        for (var k = 0; k < pl.length; k++) { textLines.push(pl[k]); lineNums.push(buf[i].line + k); }
      }
      var body = textLines.join("\n").trim();
      if (body) {
        chunks.push({
          file: filename, heading: heading, text: textLines.join("\n"),
          lines: lineNums, startLine: lineNums[0] || 1
        });
      }
      buf = []; bufLen = 0;
    }

    function endPara() {
      var t = para.join("\n").trim();
      var start = paraStart;
      para = [];
      if (!t) return;
      if (bufLen && bufLen + t.length + 2 > maxLen) flush();
      buf.push({ text: t, line: start });
      bufLen += t.length + 2;
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var h = /^#{1,6}\s+(.*)/.exec(line);
      if (h) { endPara(); flush(); heading = h[1].trim() || heading; continue; }
      if (!line.trim()) { endPara(); continue; }
      if (!para.length) paraStart = i + 1;
      para.push(line);
    }
    endPara(); flush();
    return chunks;
  }

  /* ------------------------ index + BM25 retrieval ----------------------- */

  var pages = [];                  // raw index entries
  var pageByUrl = new Map();       // url -> page  (was a linear scan per call)
  var chunks = [];                 // {file, heading, text, lines, startLine}
  var inverted = new Map();        // term -> flat [chunkIdx, tf, chunkIdx, tf, …]
  var docLen = [];                 // body token count per chunk
  var avgLen = 1;
  var idf = new Map();

  function buildIndex(data, onProgress) {
    pages = Array.isArray(data) ? data : [];
    pageByUrl = new Map();
    chunks = []; inverted = new Map(); docLen = []; idf = new Map();

    var tfPerChunk = [];
    var i = 0;

    // Sliced build so a large index doesn't freeze the UI thread.
    return new Promise(function (resolve) {
      function slice() {
        var deadline = performance.now() + 12;
        while (i < pages.length && performance.now() < deadline) {
          var p = pages[i++];
          if (!p || !p.url) continue;
          pageByUrl.set(p.url, p);

          var boost = tokenize([p.title || "", (p.tags || []).join(" "), p.hashtags || ""].join(" "));
          var pageChunks = chunkText(p.body || "", p.url);
          for (var c = 0; c < pageChunks.length; c++) {
            var ch = pageChunks[c];
            var toks = tokenize(ch.text);
            var tf = new Map();
            for (var t = 0; t < toks.length; t++) tf.set(toks[t], (tf.get(toks[t]) || 0) + 1);
            // title / tags / heading terms get extra weight without inflating length
            var extra = boost.concat(tokenize(ch.heading || ""));
            for (var e = 0; e < extra.length; e++) tf.set(extra[e], (tf.get(extra[e]) || 0) + FIELD_BOOST);
            chunks.push(ch);
            tfPerChunk.push(tf);
            docLen.push(toks.length || 1);
          }
          onProgress && onProgress(Math.round((i / pages.length) * 100));
        }
        if (i < pages.length) { setTimeout(slice, 0); return; }

        // postings + idf
        var total = 0;
        for (var d = 0; d < tfPerChunk.length; d++) {
          total += docLen[d];
          tfPerChunk[d].forEach(function (count, term) {
            var post = inverted.get(term);
            if (!post) { post = []; inverted.set(term, post); }
            post.push(d, count);
          });
        }
        avgLen = tfPerChunk.length ? (total / tfPerChunk.length) || 1 : 1;
        var N = chunks.length || 1;
        inverted.forEach(function (post, term) {
          var df = post.length / 2;
          idf.set(term, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
        });
        resolve();
      }
      slice();
    });
  }

  // BM25 over the inverted index: only chunks containing a query term are
  // touched (the old version scored every chunk and rebuilt its TF map).
  function retrieve(query, topK) {
    topK = topK || 12;
    var qTokens = uniq(tokenize(query));
    if (!qTokens.length || !chunks.length) return [];
    var scores = new Map(), hits = new Map();

    for (var q = 0; q < qTokens.length; q++) {
      var post = inverted.get(qTokens[q]);
      if (!post) continue;
      var w = idf.get(qTokens[q]) || 0;
      for (var i = 0; i < post.length; i += 2) {
        var idx = post[i], tf = post[i + 1];
        var dl = docLen[idx] || 1;
        var s = w * (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * dl / avgLen));
        scores.set(idx, (scores.get(idx) || 0) + s);
        hits.set(idx, (hits.get(idx) || 0) + 1);
      }
    }
    if (!scores.size) return [];

    var out = [];
    scores.forEach(function (score, idx) {
      // coverage bonus: chunks matching more distinct query terms rank higher
      var cov = 0.5 + 0.5 * ((hits.get(idx) || 1) / qTokens.length);
      out.push({ chunk: chunks[idx], idx: idx, score: score * cov });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, topK);
  }

  function pageMeta(url) { return pageByUrl.get(url) || null; }

  /* --------------------------- graph + relations ------------------------- */

  var graphNodes = [], graphLinks = [];
  var nodeById = new Map();        // id -> node (was a linear scan inside loops)
  var urlToNode = new Map();
  var assets = [];
  var adjacency = new Map();       // id -> [{id, kind}]

  function normalizeUrl(u) { return String(u || "").replace(/\/+$/, "").toLowerCase(); }
  function isViewUrl(u) { return String(u || "").indexOf("/view/") === 0; }

  function setupGraph(g) {
    graphNodes = (g && g.nodes) || [];
    graphLinks = (g && g.links) || [];
    nodeById = new Map(); urlToNode = new Map(); adjacency = new Map(); assets = [];

    graphNodes.forEach(function (n) {
      nodeById.set(n.id, n);
      if (n.kind === "asset") { assets.push(n); return; }
      if (n.kind === "tag" || !n.url || isViewUrl(n.url)) return;
      var key = normalizeUrl(n.url);
      if (!urlToNode.has(key)) urlToNode.set(key, n);   // first real page wins
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

  var REL_LABEL = { wiki: "wiki link", mdlink: "linked", moc: "menu", tag: "tag" };

  function relatedForUrl(pageUrl) {
    var node = urlToNode.get(normalizeUrl(pageUrl));
    var relPages = new Map(), tags = new Map(), files = new Map();
    if (node) {
      (adjacency.get(node.id) || []).forEach(function (edge) {
        var other = nodeById.get(edge.id);
        if (!other) return;
        if (other.kind === "tag") {
          tags.set(other.label || other.id, true);
        } else if (other.kind === "asset") {
          files.set(other.url, { label: other.label || other.url, url: other.url, raw: other.raw });
        } else if (other.url && !isViewUrl(other.url)) {
          var entry = relPages.get(other.url) || { label: other.label || other.url, url: other.url, kinds: [] };
          if (entry.kinds.indexOf(edge.kind) < 0) entry.kinds.push(edge.kind);
          relPages.set(other.url, entry);
        }
      });
      // assets that live next to this page's source file
      if (node.raw) {
        var base = String(node.raw).replace(/\.md$/i, "");
        for (var i = 0; i < assets.length; i++) {
          var a = assets[i];
          if (!a.raw) continue;
          var raw = String(a.raw);
          if (raw.indexOf(base) === 0 || base.indexOf(raw.replace(/\.[^.]+$/, "")) === 0) {
            files.set(a.url, { label: a.label || a.url, url: a.url, raw: a.raw });
          }
        }
      }
    }
    var list = Array.from(relPages.values()).slice(0, 8).map(function (p) {
      return {
        label: p.label, url: p.url,
        rel: p.kinds.map(function (k) { return REL_LABEL[k] || k; }).join(", ")
      };
    });
    return {
      pages: list,
      tags: Array.from(tags.keys()).slice(0, 8),
      files: Array.from(files.values()).slice(0, 6)
    };
  }

  /* ------------------------------ categories ----------------------------- */

  var CATEGORY_ORDER = ["hub", "course", "ai", "cv", "cuda", "pkm", "paper", "journal", "book", "patent", "keynote", "business"];
  var CATEGORY_LABEL = {
    hub: "Overview", course: "Courses", ai: "AI & LLMs", cv: "Computer Vision",
    cuda: "CUDA & GPU", pkm: "Knowledge", paper: "Papers", journal: "Journals",
    book: "Books", patent: "Patents", keynote: "Keynotes", business: "Business"
  };
  function categoryRank(cat) { var i = CATEGORY_ORDER.indexOf(cat); return i < 0 ? 99 : i; }

  function buildReadingPath(ranked) {
    var used = Object.create(null);
    function pick(cats) {
      for (var i = 0; i < ranked.length; i++) {
        var pg = ranked[i];
        if (used[pg.url]) continue;
        if (cats.indexOf(pg.cat) >= 0) { used[pg.url] = true; return pg; }
      }
      return null;
    }
    var path = [];
    var steps = [
      ["Start with the overview", ["hub"]],
      ["Learn the concepts", ["course", "ai", "cv", "cuda"]],
      ["Dive into research", ["paper", "journal", "book", "patent"]],
      ["Related material", ["pkm", "business", "keynote"]]
    ];
    steps.forEach(function (s) { var pg = pick(s[1]); if (pg) path.push({ step: s[0], pg: pg }); });
    for (var i = 0; i < ranked.length && path.length < 5; i++) {
      if (!used[ranked[i].url]) { used[ranked[i].url] = true; path.push({ step: "Keep exploring", pg: ranked[i] }); }
    }
    return path;
  }

  function shortPageLabel(url) {
    var meta = pageMeta(url);
    if (meta && meta.title) {
      var words = String(meta.title).split(/\s+/);
      return words.slice(0, 3).join(" ") + (words.length > 3 ? "…" : "");
    }
    var parts = String(url || "").replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || url;
  }

  /* ------------------------------- keyword map ---------------------------- */

  var NOISE_LINE = /^>\s*\*\*|^\s*#|pirahansiah\.com/;

  function keywordMapRows(query) {
    var kws = uniq(tokenize(query)).slice(0, 5);
    var rows = [];
    kws.forEach(function (kw) {
      var post = inverted.get(kw);
      if (!post) return;
      var perPage = new Map();
      for (var i = 0; i < post.length; i += 2) {
        var ch = chunks[post[i]], tf = post[i + 1];
        if (!ch) continue;
        var cur = perPage.get(ch.file) || { score: 0, chunk: ch };
        cur.score += tf * (idf.get(kw) || 1);
        if (tf > (cur.bestTf || 0)) { cur.bestTf = tf; cur.chunk = ch; }
        perPage.set(ch.file, cur);
      }
      var ranked = Array.from(perPage.entries())
        .map(function (e) { return { url: e[0], score: e[1].score, chunk: e[1].chunk }; })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, 3);
      if (!ranked.length) return;

      var sents = String(ranked[0].chunk.text).match(/[^.!?]+[.!?]+/g) || [];
      var def = "";
      for (var s = 0; s < sents.length && !def; s++) {
        var sent = sents[s].trim();
        if (NOISE_LINE.test(sent) || cjkRatio(sent) > 0.4) continue;
        if (sent.toLowerCase().indexOf(kw) >= 0) def = sent;
      }
      for (var s2 = 0; s2 < sents.length && !def; s2++) {
        var s2t = sents[s2].trim();
        if (!NOISE_LINE.test(s2t) && cjkRatio(s2t) <= 0.4) def = s2t;
      }
      if (!def) def = stripCjk(String(ranked[0].chunk.text).slice(0, 120));
      def = def.replace(/https?:\/\/\S+/g, "").replace(/[#*`>_[\]()]/g, " ").replace(/\s+/g, " ").trim();
      if (def.length > 150) def = def.slice(0, 149).trim() + "…";

      rows.push({
        kw: kw,
        pages: ranked.map(function (r) { return { url: r.url, label: shortPageLabel(r.url) }; }),
        def: def
      });
    });
    return rows;
  }

  /* ---------------------------------- UI --------------------------------- */

  var ui = {
    stats: $("llm-stats"), status: $("llm-status-text"), progressWrap: $("llm-progress"),
    progressBar: $("llm-progress-bar"), badge: $("llm-device-badge"), badgeText: $("llm-device-text"),
    answer: $("llm-answer"), review: $("llm-review"), keypoints: $("llm-keypoints"),
    sources: $("llm-sources"),
    kwmap: $("llm-kwmap"), kwmapRows: $("llm-kwmap-rows"), kwmapIdea: $("llm-kwmap-idea"),
    modelSelect: $("llm-model-select"), deviceSelect: $("llm-device-select"), ramInfo: $("llm-ram-info"),
    catBars: $("llm-cat-bars"), tagcloud: $("llm-tagcloud"),
    refsList: $("llm-refs-list"), webLinks: $("llm-web-links"),
    xpostBody: $("llm-xpost-body"), xpostCopy: $("llm-xpost-copy"), xpostOpen: $("llm-xpost-open"),
    results: $("llm-results"), resultsHead: $("llm-results-head"), count: $("llm-count"),
    conn: $("llm-conn"), canvas: $("llm-conn-canvas"), hint: $("llm-hint-line"),
    q: $("llm-query"), askBtn: $("llm-ask-btn"), initBtn: $("llm-init-btn"),
    chatLog: $("llm-chat-log"), chatInput: $("llm-chat-input"), chatSend: $("llm-chat-send"), chatStatus: $("llm-chat-status")
  };

  function setProgress(n) {
    if (!ui.progressBar) return;
    n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    ui.progressBar.style.width = n + "%";
    ui.progressBar.textContent = n + "%";
  }

  function setStatus(msg, showBar) {
    if (ui.status) ui.status.textContent = msg || "";
    if (ui.progressWrap) ui.progressWrap.style.display = showBar ? "block" : "none";
  }

  function setDeviceBadge(state, text) {
    if (!ui.badge) return;
    ui.badge.className = "llm-badge " + state;
    if (ui.badgeText) ui.badgeText.textContent = text;
  }

  // Show the per-model RAM breakdown (weights + KV cache + context/activations)
  // whenever the selected model changes.
  function updateRamInfo() {
    if (!ui.ramInfo) return;
    var opt = modelOption(selectedModelId());
    if (!opt) { ui.ramInfo.textContent = ""; return; }
    var workspace = Math.max(0, opt.totalMB - opt.weightsMB - opt.kvMB);
    ui.ramInfo.textContent =
      "RAM estimate — " + opt.label.split("—")[0].trim() + ": " +
      opt.weightsMB + " MB weights + " + opt.kvMB + " MB KV cache + ~" + workspace +
      " MB context/activations ≈ " + ramLabel(opt.totalMB) +
      " total (" + opt.weightsMB + " MB int8 download · " + opt.window + "-token window)";
  }

  function highlight(text, query) {
    var tokens = uniq(tokenize(query));
    var safe = esc(text);
    if (!tokens.length || !text) return safe;
    var re = new RegExp("(" + tokens.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    // skip matches inside HTML entities (&amp; would otherwise match "amp")
    return safe.replace(/&[a-z]+;|(.[^&]*)/gi, function (seg) {
      return /^&[a-z]+;$/i.test(seg) ? seg : seg.replace(re, "<mark>$1</mark>");
    });
  }

  function snippetFor(text, query, len) {
    len = len || 220;
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (text.length <= len) return text;
    var tokens = tokenize(query);
    var low = text.toLowerCase(), idx = -1;
    tokens.forEach(function (t) { var at = low.indexOf(t); if (at >= 0 && (idx < 0 || at < idx)) idx = at; });
    var start = idx > 60 ? idx - 40 : 0;
    return (start > 0 ? "…" : "") + text.substr(start, len) + "…";
  }

  function fileLabel(raw) {
    try { return decodeURIComponent(String(raw || "").split("/").pop() || ""); }
    catch (e) { return String(raw || "").split("/").pop() || ""; }
  }

  function exactLines(chunk, query, maxLines) {
    maxLines = maxLines || 14;
    var tokens = tokenize(query);
    var lines = String(chunk.text).split("\n");
    var hitIdx = -1;
    for (var i = 0; i < lines.length && hitIdx < 0; i++) {
      var low = lines[i].toLowerCase();
      for (var t = 0; t < tokens.length; t++) if (low.indexOf(tokens[t]) >= 0) { hitIdx = i; break; }
    }
    if (hitIdx < 0) hitIdx = 0;
    var start = Math.max(0, hitIdx - 2);
    var end = Math.min(lines.length, start + maxLines);
    var out = [];
    for (var j = start; j < end; j++) {
      var n = (chunk.lines && chunk.lines[j]) || ((chunk.startLine || 1) + j);
      out.push({ n: n, text: lines[j] });
    }
    return out;
  }

  function domKey(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, "_"); }

  // Aggregate chunk hits into one card per page. Builds one HTML string and
  // writes it once (the old version did an insertAdjacentHTML per category).
  function renderResults(query, top, limit) {
    limit = limit || 10;
    if (!ui.results) return [];
    if (!top.length) {
      ui.results.innerHTML = '<div class="llm-empty">Nothing matched that query. Try different keywords.</div>';
      if (ui.count) ui.count.textContent = "0";
      return [];
    }

    var perPage = new Map();
    top.forEach(function (r) {
      var url = r.chunk.file;
      var e = perPage.get(url) || { score: 0, chunks: [] };
      e.score += r.score; e.chunks.push(r);
      perPage.set(url, e);
    });
    var ranked = Array.from(perPage.entries()).map(function (e) {
      var meta = pageMeta(e[0]);
      return {
        url: e[0], score: e[1].score, n: e[1].chunks.length, best: e[1].chunks[0],
        cat: (meta && meta.category) || "hub", title: (meta && meta.title) || e[0]
      };
    }).sort(function (a, b) { return b.score - a.score; });

    if (ui.count) ui.count.textContent = ranked.length;
    var maxScore = ranked[0].score || 1;
    var html = "";

    var path = buildReadingPath(ranked);
    if (path.length >= 2) {
      html += '<div class="llm-path"><div class="llm-path-title">&#128218; How to read this topic — suggested order</div><div class="llm-path-steps">';
      path.forEach(function (p, idx) {
        html += '<div class="llm-path-step" style="--step:' + idx + '">' +
          '<div class="llm-path-num">' + (idx + 1) + '</div>' +
          '<div class="llm-path-body"><div class="llm-path-label">' + esc(p.step) + '</div>' +
          '<a href="' + safeUrl(p.pg.url) + '">' + esc(p.pg.title) + '</a></div></div>';
      });
      html += '</div></div>';
    }

    var byCat = new Map();
    ranked.slice(0, limit).forEach(function (pg) {
      if (!byCat.has(pg.cat)) byCat.set(pg.cat, []);
      byCat.get(pg.cat).push(pg);
    });
    Array.from(byCat.keys())
      .sort(function (a, b) { return categoryRank(a) - categoryRank(b); })
      .forEach(function (cat) {
        var group = byCat.get(cat);
        html += '<div class="llm-cat-group"><div class="llm-cat-group-head">' +
          '<span class="llm-cat-group-title">' + esc(CATEGORY_LABEL[cat] || cat) + '</span>' +
          '<span class="llm-cat-group-count">' + group.length + '</span></div>';

        group.forEach(function (pg, gi) {
          var meta = pageMeta(pg.url);
          var tags = (meta && meta.tags) || [];
          var hashes = (meta && meta.hashtags) ? String(meta.hashtags).split(/\s+/).filter(Boolean) : [];
          var rel = relatedForUrl(pg.url);
          var pct = Math.min(100, Math.round((pg.score / maxScore) * 100));
          var lines = exactLines(pg.best.chunk, query);
          var firstLine = lines.length ? lines[0].n : (pg.best.chunk.startLine || 1);
          var lastLine = lines.length ? lines[lines.length - 1].n : firstLine;
          var key = domKey(pg.url);

          html += '<div class="llm-card" style="--gi:' + gi + '">' +
            '<div class="llm-card-top"><span class="llm-card-title"><a href="' + safeUrl(pg.url) + '">' + esc(pg.title) + '</a></span>' +
            '<span class="llm-cat ' + esc(cat) + '">' + esc(CATEGORY_LABEL[cat] || cat) + '</span></div>' +
            '<div class="llm-score-row"><div class="llm-score-bar"><div class="llm-score-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="llm-score-val">' + pct + '%</span></div>' +
            '<div class="llm-snippet">' + highlight(snippetFor(pg.best.chunk.text, query), query) + '</div>' +
            '<div class="llm-lines"><div class="llm-lines-head">&#128203; Exact lines ' + firstLine + '–' + lastLine +
            ' <button type="button" class="llm-lines-toggle" aria-expanded="false" aria-controls="lines-' + key + '" data-card="' + key + '">show</button></div>' +
            '<div class="llm-lines-body" id="lines-' + key + '" hidden>';
          lines.forEach(function (ln) {
            html += '<div class="llm-line"><span class="llm-line-num">' + ln.n + '</span>' +
              '<span class="llm-line-text">' + highlight(ln.text, query) + '</span></div>';
          });
          html += '</div></div>';

          if (rel.files.length) {
            html += '<div class="llm-files"><b>&#128196; Files &amp; PDFs:</b> ' + rel.files.map(function (f) {
              var label = f.label === f.url ? fileLabel(f.raw) : f.label;
              return '<a href="' + safeUrl(f.url) + '" target="_blank" rel="noopener" class="rel-link" title="' + esc(label) + '">' + esc(label) + '</a>';
            }).join("") + '</div>';
          }
          if (tags.length || hashes.length) {
            html += '<div class="llm-tags-row">' +
              tags.slice(0, 6).map(function (t) { return '<span class="llm-tag">#' + esc(t) + '</span>'; }).join("") +
              hashes.slice(0, 4).map(function (h) { return '<span class="llm-tag hashtag">' + esc(h) + '</span>'; }).join("") +
              '</div>';
          }
          if (rel.pages.length) {
            html += '<div class="llm-related"><b>&#128279; Connected:</b> ' + rel.pages.map(function (p) {
              return '<a href="' + safeUrl(p.url) + '" class="rel-link" title="' + esc(p.label) + '">' + esc(p.label) + '</a>' +
                (p.rel ? '<span class="rel-kind">(' + esc(p.rel) + ')</span>' : '');
            }).join("") + '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      });

    ui.results.innerHTML = html;
    return ranked;
  }

  // One delegated listener instead of re-binding every toggle on every render.
  function wireResultDelegation() {
    on(ui.results, "click", function (e) {
      var btn = e.target.closest && e.target.closest(".llm-lines-toggle");
      if (!btn) return;
      var body = document.getElementById("lines-" + btn.getAttribute("data-card"));
      if (!body) return;
      var open = !body.hidden;
      body.hidden = open;
      btn.textContent = open ? "show" : "hide";
      btn.setAttribute("aria-expanded", String(!open));
    });
  }

  /* -------------------------- connection graph (d3) ----------------------- */

  var connSim = null;
  var lastGraphArgs = null;

  function renderConnections(query, top) {
    if (!ui.conn || !ui.canvas || typeof d3 === "undefined") return;
    lastGraphArgs = { query: query, top: top };
    if (connSim) { connSim.stop(); connSim = null; }   // <- old sims kept running forever

    var seed = [];
    var seen = new Set();
    top.slice(0, 8).forEach(function (r) {
      var n = urlToNode.get(normalizeUrl(r.chunk.file));
      if (n && !seen.has(n.id)) { seen.add(n.id); seed.push(n); }
    });
    if (!seed.length) { ui.conn.classList.remove("visible"); return; }
    ui.conn.classList.add("visible");
    ui.conn.style.display = "";

    var keep = new Map();
    seed.forEach(function (n) { keep.set(n.id, n); });
    seed.forEach(function (n) {
      var count = 0;
      (adjacency.get(n.id) || []).forEach(function (edge) {
        if (count >= 4) return;
        var other = nodeById.get(edge.id);
        if (!other || !other.url || isViewUrl(other.url)) return;
        keep.set(other.id, other);
        count++;
      });
    });

    var nodes = Array.from(keep.values()).map(function (n) {
      return { id: n.id, label: n.label, url: n.url, kind: n.kind };
    });
    var idSet = new Set(nodes.map(function (n) { return n.id; }));
    var links = [], linkSeen = Object.create(null);
    graphLinks.forEach(function (l) {
      var s = typeof l.source === "object" ? l.source.id : l.source;
      var t = typeof l.target === "object" ? l.target.id : l.target;
      if (!idSet.has(s) || !idSet.has(t) || s === t) return;
      var key = s < t ? s + "|" + t : t + "|" + s;
      if (linkSeen[key]) return;
      linkSeen[key] = true;
      links.push({ source: s, target: t, kind: l.kind || "link" });
    });

    var W = ui.conn.clientWidth || 600;
    var H = GRAPH_HEIGHT;
    var svg = d3.select(ui.canvas).attr("width", W).attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H);
    svg.selectAll("*").remove();

    var COLORS = { hub: "#0a84ff", page: "#30d158", tag: "#af52de", asset: "#8e8e93", moc: "#0a84ff", note: "#30d158" };
    var g = svg.append("g");

    var link = g.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke", "rgba(139,148,158,0.25)").attr("stroke-width", 0.8);

    // FIX: keep the circle selection. The original chained .append("title"),
    // so `node` was the <title> selection and cx/cy were never applied.
    var node = g.append("g").selectAll("circle").data(nodes).enter().append("circle")
      .attr("r", 7)
      .attr("fill", function (d) { return COLORS[d.kind] || "#8e8e93"; })
      .attr("stroke", "#fff").attr("stroke-width", 1)
      .style("cursor", function (d) { return d.url ? "pointer" : "default"; })
      .on("click", function (e, d) { if (d.url) window.location.href = d.url; });
    node.append("title").text(function (d) { return (d.label || d.id) + (d.url ? " — open" : ""); });

    var label = g.append("g").selectAll("text").data(nodes).enter().append("text")
      .text(function (d) { var l = d.label || d.id; return l.length > 22 ? l.substring(0, 20) + "…" : l; })
      .attr("font-size", 9).attr("fill", "var(--text-muted)").attr("text-anchor", "middle").attr("dy", 16);

    connSim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(function (d) { return d.id; }).distance(70).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-180).distanceMax(240))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide().radius(16))
      .alphaDecay(0.08)
      .on("tick", function () {
        link.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
        node.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
        label.attr("x", function (d) { return d.x; }).attr("y", function (d) { return d.y; });
      });
  }

  /* ------------------------------ LLM helpers ---------------------------- */

  // Token count of text. Uses the model's real tokenizer when available
  // (transformers.js v3 encode() returns number[]), else ~3.5 chars/token.
  function estimateTokens(text, tokenizer) {
    if (tokenizer && typeof tokenizer.encode === "function") {
      try {
        var enc = tokenizer.encode(String(text));
        if (enc && typeof enc.length === "number") return enc.length;
      } catch (e) {}
    }
    return Math.ceil(String(text).length / 3.5);
  }

  // LaMini-GPT reports n_positions; Qwen/Llama report max_position_embeddings.
  function modelWindowTokens(gen) {
    try {
      var cfg = gen && gen.model && gen.model.config;
      if (!cfg) return null;
      return cfg.max_position_embeddings || cfg.n_positions || null;
    } catch (e) { return null; }
  }

  // Builds the retrieval context, capped to fit the model's context window:
  // window − (answer budget + prompt overhead). Chunks are added in score
  // order; the last one is trimmed to the remaining token room. The old
  // char-only cap sent ~9000 chars (2400+ tokens) into LaMini's 1024-token
  // window, which crashed ONNX Runtime: "wpe/Gather idx=1024 out of bounds".
  // Fraction of CJK characters in a string (0..1) — used to keep non-English
  // excerpts out of the LLM context so tiny models have nothing to echo back
  // in Chinese/Japanese/Korean.
  function cjkRatio(s) {
    s = String(s || "");
    var cjk = s.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef\u3040-\u30ff\uac00-\ud7af]/g);
    var latin = s.match(/[A-Za-z0-9]/g);
    if (!cjk || !latin) return cjk ? 1 : 0;
    return cjk.length / (cjk.length + latin.length);
  }

  // Hard guarantee: remove CJK characters from any text the model (or the
  // extractive fallback) produced, so the Topic review / chat can never show
  // Chinese, Japanese, or Korean even if the model ignored the prompt.
  function stripCjk(s) {
    return String(s == null ? "" : s).replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef\u3040-\u30ff\uac00-\ud7af]+/g, "");
  }

  function buildContext(top, tokenizer, windowTokens, maxNewTokens, overheadTokens) {
    var budgetTokens = null;
    if (windowTokens) {
      var avail = windowTokens - (maxNewTokens || MAX_NEW_TOKENS) - (overheadTokens || 300);
      budgetTokens = Math.max(40, avail);
    }
    var ctx = [], usedTokens = 0, seen = Object.create(null);
    for (var i = 0; i < top.length; i++) {
      var r = top[i];
      // Skip chunks that are mostly Chinese/Japanese/Korean — the model must
      // answer in English only and should never see text it would echo back.
      if (cjkRatio(r.chunk.text) > 0.4) continue;
      if (seen[r.chunk.file]) continue;     // one chunk per page
      seen[r.chunk.file] = 1;
      var meta = pageMeta(r.chunk.file);
      // A non-English page TITLE would be shown to the model and echoed back —
      // fall back to the (ASCII) file path for CJK-heavy titles.
      var title = (meta && meta.title) || r.chunk.file;
      if (cjkRatio(title) > 0.4) title = r.chunk.file;
      var header = "### Source: " + title + " (" + r.chunk.file + ")\n";
      var block = header + r.chunk.text;
      var blockTokens = estimateTokens(block, tokenizer);
      if (budgetTokens != null) {
        if (usedTokens + blockTokens > budgetTokens) {
          var remaining = budgetTokens - usedTokens;
          if (remaining < 24) break;
          var keep = Math.max(80, Math.floor(remaining * 3.5) - header.length);
          block = header + r.chunk.text.substring(0, Math.min(r.chunk.text.length, keep));
          blockTokens = estimateTokens(block, tokenizer);
          if (usedTokens + blockTokens > budgetTokens) break;
        }
      } else if (usedTokens > 2400) {
        break;                              // no window info: hard safety cap
      }
      ctx.push(block);
      usedTokens += blockTokens;
    }
    return ctx.join("\n\n");
  }

  function uniquePages(top) {
    var out = [], seen = Object.create(null);
    top.forEach(function (r) { if (!seen[r.chunk.file]) { seen[r.chunk.file] = 1; out.push(r.chunk.file); } });
    return out;
  }

  function sourcesHtml(list) {
    return list.map(function (f) {
      var meta = pageMeta(f);
      return '<a href="' + safeUrl(f) + '" target="_blank" rel="noopener">' + esc((meta && meta.title) || f) + '</a>';
    }).join("");
  }

  var SYSTEM_ANSWER =
    "You are a research assistant for the pirahansiah.com knowledge site. Answer using ONLY the document excerpts below. " +
    "IMPORTANT: Write EVERYTHING in English only. Never use Chinese, Japanese, Korean, or any other language — not even mixed in. " +
    "If a source title is non-English, still explain it in English.\n" +
    "Structure your reply exactly like this:\n" +
    "REVIEW: a rich, detailed single paragraph (6-10 sentences) that synthesizes the context, connections between pages, " +
    "and key technical details from ALL the sources. Write it in a natural, engaging, informative style that works anywhere — " +
    "social post, paper, or presentation. NEVER start with words like 'Introduction', 'In this paper, we', 'This paper presents', " +
    "'In this study', or any academic-paper-intro filler. Just go straight into the substance of the topic.\n" +
    "KEY POINTS: three numbered key points (1. 2. 3.), each one short sentence.\n" +
    "X POST: a short 1-2 sentence summary of the review above, most relevant to the question's keywords (no hashtags, no URL).\n" +
    "IDEA: one single sentence that connects the question's keywords into a practical idea or application.\n" +
    "Always name the source file(s) you used, like (source: /notes/.../). If the excerpts don't contain enough information, say so plainly instead of guessing.";

  // Tiny models (124M) can't follow the full format spec; a short prompt keeps
  // their whole 1024-token window for the answer.
  var SYSTEM_TINY =
    "You are a research assistant for the pirahansiah.com site. Use ONLY the excerpts below. " +
    "Write EVERYTHING in English only — never Chinese or any other language. Reply with: " +
    "REVIEW (one rich paragraph), KEY POINTS (3 short lines), X POST (1-2 sentences), IDEA (one sentence). " +
    "Name the source files you used, like (source: /notes/.../).";

  function promptFor(gen, messages) {
    // Base models (e.g. LaMini-GPT) have no chat template — flatten to text.
    var hasChat = !!(gen.tokenizer && gen.tokenizer.chat_template);
    if (hasChat) return messages;
    return messages.map(function (m) { return m.role + ": " + m.content; }).join("\n\n") + "\n\nAssistant:";
  }

  // First 2–3 sentence-ish slices from chunk text (no model required).
  function firstSentences(text, maxN) {
    maxN = maxN || 3;
    text = String(text || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    var parts = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return parts.slice(0, maxN).map(function (s) { return s.trim(); }).filter(Boolean).join(" ");
  }

  // Extractive fallback when Micro still OOMs / model unavailable on phone.
  // Templated REVIEW + bullet key sentences from BM25 top chunks + sources.
  function extractiveAnswer(top, question) {
    var lines = [];
    var sources = [];
    var keypoints = [];
    var seen = Object.create(null);
    var i, r, meta, title, snip, firstLine;
    for (i = 0; i < top.length && sources.length < 4; i++) {
      r = top[i];
      if (!r || !r.chunk || seen[r.chunk.file]) continue;
      seen[r.chunk.file] = 1;
      meta = pageMeta(r.chunk.file);
      title = (meta && meta.title) || r.chunk.file;
      sources.push(title + " (" + r.chunk.file + ")");
      snip = firstSentences(r.chunk.text, sources.length <= 2 ? 3 : 2);
      if (snip) lines.push(snip + " (source: " + r.chunk.file + ")");
      firstLine = String(r.chunk.text || "").split(/\n/).map(function (s) {
        return s.replace(/^#+\s*/, "").trim();
      }).filter(Boolean)[0] || snip;
      if (firstLine) keypoints.push(firstLine.replace(/\s+/g, " ").trim().slice(0, 160));
    }
    var review = lines.slice(0, 2).join(" ") ||
      ("No model is available on this device for \"" + question + "\". Showing the top matching excerpts instead.");
    var kp = keypoints.slice(0, 3).map(function (k, idx) { return (idx + 1) + ". " + k; }).join("\n");
    var xpost = firstSentences(review, 2).slice(0, 220);
    var idea = "Explore: " + String(question || "").trim() +
      (sources[0] ? " — start with " + sources[0].split(" (")[0] : "");
    return "REVIEW: " + review + "\n\n" +
      "KEY POINTS:\n" + (kp || "1. See the matching pages below.") + "\n\n" +
      "X POST: " + (xpost || review.slice(0, 180)) + "\n\n" +
      "IDEA: " + idea + "\n\n" +
      "Sources: " + sources.join("; ");
  }

  function applyExtractiveToReview(top, question, writer) {
    var text = stripCjk(extractiveAnswer(top, question));   // excerpts may be non-English
    if (writer && writer.reset) writer.reset();
    if (writer && writer.write) { writer.write(text); writer.finish(); }
    else if (ui && ui.review) ui.review.textContent = text;
    setStatus("Using extractive answer (model unavailable on this device)", false);
    return text;
  }

  function flanPrompt(context, question) {
    return "Answer in English only (never Chinese or any other language). Using ONLY these excerpts, write REVIEW (one paragraph), KEY POINTS (3 short lines), X POST (1-2 sentences), IDEA (one sentence). Name sources.\n\nExcerpts:\n" +
      context + "\n\nQuestion: " + question;
  }

  function runAnswer(top, question, writer) {
    return ensureGenerator(function (m) { setStatus(m, true); }, setProgress).then(function (gen) {
      return enqueue(function () {
        setStatus("Generating answer on " + deviceLabel() + "…", false);
        setDeviceBadge("ok", deviceLabel());
        generating = true;
        setAskBusy(true);
        var modelId = genModelId || selectedModelId();
        var seq2seq = isSeq2Seq(modelId);
        var streamer = null;
        try {
          streamer = new mod.TextStreamer(gen.tokenizer, {
            skip_prompt: true,
            callback_function: function (t) { writer.write(stripCjk(t)); }
          });
        } catch (e) {
          streamer = null;
        }
        var win = modelWindowTokens(gen);
        // Flan-T5 encoder/decoder windows are small (~512); treat as tiny.
        // Base models (no chat template: stories/gpt2) also get the short
        // prompt — a 124M model can't follow the full format spec.
        var hasChat = !!(gen.tokenizer && gen.tokenizer.chat_template);
        var tiny = seq2seq || (win != null && win < TINY_WINDOW) || !hasChat;
        var sysPrompt = tiny ? SYSTEM_TINY : SYSTEM_ANSWER;
        var maxNew = tiny ? (isLowMem ? 160 : 320) : MAX_NEW_TOKENS;
        if (seq2seq) maxNew = isLowMem ? 128 : 192;
        var overhead = estimateTokens(seq2seq ? flanPrompt("", question) : sysPrompt, gen.tokenizer) +
          estimateTokens(question, gen.tokenizer) + 40;
        // Very small windows cannot hold the full answer budget — clamp so
        // the whole prompt always fits. (Old TinyStories was 256 tokens.)
        if (win) {
          var room = win - overhead - 48;
          if (maxNew > room) maxNew = Math.max(16, Math.floor(room));
        }
        var context = buildContext(top, gen.tokenizer, win || (seq2seq ? 512 : null), maxNew, overhead);
        var opts = { max_new_tokens: maxNew, do_sample: false, no_repeat_ngram_size: 3, repetition_penalty: 1.15 };
        if (streamer) opts.streamer = streamer;
        var extra = stoppingOpts();
        for (var k in extra) opts[k] = extra[k];
        var input;
        if (seq2seq) {
          input = flanPrompt(context, question);
        } else {
          var messages = [
            { role: "system", content: sysPrompt },
            { role: "user", content: "Document excerpts:\n\n" + context + "\n\nQuestion: " + question }
          ];
          input = promptFor(gen, messages);
        }
        return gen(input, opts).then(function (result) {
          // text2text without streamer: write the full result once
          if (streamer == null) {
            var full = textFromResult(result);
            if (full) writer.write(stripCjk(full));
          }
          writer.finish();
          return result;
        }, function (err) { writer.finish(); throw err; });
      }).then(function (result) {
        generating = false; setAskBusy(false);
        setStatus("Done (" + deviceLabel() + ").", false);
        return result;
      }, function (err) {
        generating = false; setAskBusy(false);
        throw err;
      });
    });
  }

  function textFromResult(result) {
    var x = result && result[0] && result[0].generated_text;
    if (typeof x === "string") return x;
    if (Array.isArray(x)) return (x[x.length - 1] && x[x.length - 1].content) || "";
    return "";
  }

  function parseStructured(text) {
    var out = { review: "", keypoints: [], xpost: "", idea: "" };
    text = stripCjk(text);   // English-only: never show CJK, whatever the model wrote
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
    if (!out.review && !out.keypoints.length && !out.xpost && !out.idea) out.review = text.trim();
    return out;
  }

  // Strips section labels ANYWHERE (the old version only matched at ^) and
  // removes academic intro filler.
  function cleanStructuredText(text) {
    var out = String(text || "").replace(/^\s*(REVIEW|KEY\s*POINTS?|X\s*POST|IDEA)\s*:\s*/gim, "").trim();
    var FILLER = /^(introduction\s*[:\-–—.]?\s*|in\s+this\s+(paper|study|article|work)[^.]*\.\s*|(this|the)\s+(paper|study|article|work)\s+presents?\s+[^.]*\.\s*)/i;
    for (var i = 0; i < 4; i++) {
      var before = out;
      out = out.replace(FILLER, "");
      if (out === before) break;
    }
    return out.trim();
  }

  function summarizeForX(reviewText, query, maxLen) {
    maxLen = maxLen || 240;
    var text = String(reviewText || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    var tokens = tokenize(query);
    var sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    var scored = sentences.map(function (s, i) {
      var low = s.toLowerCase(), hits = 0;
      tokens.forEach(function (t) { if (low.indexOf(t) >= 0) hits++; });
      return { s: s.trim(), i: i, hits: hits };
    }).sort(function (a, b) { return (b.hits - a.hits) || (a.i - b.i); }).slice(0, 2)
      .sort(function (a, b) { return a.i - b.i; });   // keep original reading order
    var out = scored.map(function (x) { return x.s; }).join(" ").trim();
    if (!out) out = sentences[0] ? sentences[0].trim() : text;
    if (out.length > maxLen) out = out.substring(0, maxLen - 1).trim() + "…";
    return out;
  }

  function buildXPost(line, topPages, reviewText, query) {
    var top = topPages && topPages[0];
    if (!top) return null;                              // <- used to throw on empty results
    var meta = pageMeta(top);
    var tags = (meta && meta.tags) ? meta.tags.slice(0, 4).map(function (t) { return "#" + t; }) : [];
    var hashes = (meta && meta.hashtags) ? String(meta.hashtags).split(/\s+/).filter(Boolean).slice(0, 4) : [];
    var hashStr = tags.concat(hashes).filter(function (h) { return h && h.length > 1; }).slice(0, 6).join(" ");
    var body = (line && line.trim()) || summarizeForX(reviewText, query) || ("Check out " + ((meta && meta.title) || top));
    return { line: body, url: location.origin + top, hashtags: hashStr };
  }

  /* ------------------------------- panels -------------------------------- */

  function renderPanels(ranked, topPages, query, xpostLine, reviewText) {
    if (ui.catBars) {
      var counts = Object.create(null);
      ranked.slice(0, 10).forEach(function (pg) { counts[pg.cat] = (counts[pg.cat] || 0) + 1; });
      var cats = Object.keys(counts).sort(function (a, b) { return categoryRank(a) - categoryRank(b); });
      var max = Math.max.apply(null, cats.map(function (c) { return counts[c]; }).concat([1]));
      ui.catBars.innerHTML = cats.map(function (c) {
        var w = Math.round((counts[c] / max) * 100);
        return '<div class="llm-bar-row"><span class="llm-bar-label">' + esc(CATEGORY_LABEL[c] || c) + '</span>' +
          '<div class="llm-bar-track"><div class="llm-bar-fill" style="width:' + w + '%"></div></div>' +
          '<span class="llm-bar-val">' + counts[c] + '</span></div>';
      }).join("") || '<div class="llm-empty" style="padding:.6rem">No data</div>';
    }

    if (ui.tagcloud) {
      var tagCount = Object.create(null);
      topPages.forEach(function (u) {
        var m = pageMeta(u);
        if (!m) return;
        (m.tags || []).forEach(function (t) { var k = String(t).toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1; });
        String(m.hashtags || "").split(/\s+/).filter(Boolean).forEach(function (h) {
          var k = h.toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1;
        });
      });
      var tags = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a]; }).slice(0, 14);
      var tMax = Math.max.apply(null, tags.map(function (t) { return tagCount[t]; }).concat([1]));
      ui.tagcloud.innerHTML = tags.map(function (t) {
        var size = 0.7 + (tagCount[t] / tMax) * 0.9;
        return '<span class="llm-cloud-tag" style="font-size:' + size.toFixed(2) + 'rem" title="' + tagCount[t] + '&times;">' + esc(t) + '</span>';
      }).join("") || '<div class="llm-empty" style="padding:.6rem">No tags</div>';
    }

    if (ui.refsList) {
      ui.refsList.innerHTML = topPages.map(function (u) {
        var m = pageMeta(u);
        return '<li class="llm-ref"><a href="' + safeUrl(u) + '" target="_blank" rel="noopener">' + esc((m && m.title) || u) + '</a>' +
          '<span class="llm-ref-url">' + esc(u) + '</span></li>';
      }).join("");
    }

    if (ui.webLinks) {
      var enc = encodeURIComponent(query);
      var engines = [
        ["Google", "https://www.google.com/search?q=" + enc],
        ["Bing", "https://www.bing.com/search?q=" + enc],
        ["DuckDuckGo", "https://duckduckgo.com/?q=" + enc],
        ["arXiv", "https://arxiv.org/list/cs.CV/recent"],
        ["YouTube", "https://www.youtube.com/results?search_query=" + enc],
        ["Semantic Scholar", "https://www.semanticscholar.org/search?q=" + enc]
      ];
      ui.webLinks.innerHTML = engines.map(function (e) {
        return '<a class="llm-web-link" href="' + esc(e[1]) + '" target="_blank" rel="noopener">' + esc(e[0]) + '</a>';
      }).join("");
    }

    var xp = buildXPost(xpostLine || "", topPages, reviewText || "", query);
    if (xp && ui.xpostBody) {
      var full = xp.line + "\n\n" + xp.url + (xp.hashtags ? "\n\n" + xp.hashtags : "");
      ui.xpostBody.textContent = full;
      if (ui.xpostOpen) ui.xpostOpen.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(full);
      if (ui.xpostCopy) {
        ui.xpostCopy.onclick = function () {
          if (!navigator.clipboard || !navigator.clipboard.writeText) return;
          navigator.clipboard.writeText(full).then(function () {
            ui.xpostCopy.textContent = "Copied";
            setTimeout(function () { ui.xpostCopy.textContent = "Copy"; }, 1500);
          });
        };
      }
    }
  }

  function renderKeywordMap(query, ideaLine) {
    if (!ui.kwmap || !ui.kwmapRows) return;
    var rows = keywordMapRows(query);
    if (!rows.length) { ui.kwmap.style.display = "none"; return; }
    ui.kwmap.style.display = "block";
    ui.kwmapRows.innerHTML = rows.map(function (r) {
      var links = r.pages.map(function (p) {
        return '<a href="' + safeUrl(p.url) + '" class="kw-page">' + esc(p.label) + '</a>';
      }).join(" · ");
      return '<div class="llm-kwmap-row">' +
        '<span class="llm-kw">' + esc(r.kw) + '</span>' +
        '<span class="llm-kw-pages">' + links + '</span>' +
        '<span class="llm-kw-def">' + esc(r.def) + '</span></div>';
    }).join("");
    if (ui.kwmapIdea) {
      var idea = (ideaLine && ideaLine.trim()) ||
        ("Combine " + rows.map(function (r) { return "'" + r.kw + "'"; }).join(", ") + " — the pages above show how they connect.");
      ui.kwmapIdea.innerHTML = '<span class="llm-kwmap-idea-label">&#128161; Idea:</span> ' + esc(idea);
    }
  }

  /* ------------------------------ search flow ---------------------------- */

  var askLabel = "Ask";
  function setAskBusy(busy) {
    if (!ui.askBtn) return;
    ui.askBtn.textContent = busy ? "Stop" : askLabel;
    ui.askBtn.classList.toggle("is-busy", !!busy);
  }

  // Instant, model-free part of a search: results, graph, panels, keyword map.
  function renderRetrieval(q) {
    var top = retrieve(q, 16);
    var ranked = renderResults(q, top);
    renderConnections(q, top);
    if (ui.resultsHead) ui.resultsHead.style.display = top.length ? "flex" : "none";
    setStatus(top.length ? top.length + " relevant sections found." : "No matches.", false);
    if (top.length) {
      var topPages = uniquePages(top);
      renderPanels(ranked, topPages, q, "", "");
      renderKeywordMap(q, "");
    }
    return top;
  }

  function clearAnswer() {
    if (ui.answer) ui.answer.classList.remove("visible");
    if (ui.conn) ui.conn.classList.remove("visible");
    if (ui.results) ui.results.innerHTML = "";
    if (ui.count) ui.count.textContent = "";
  }

  function doSearch(withLLM) {
    if (!ui.q) return;
    var q = ui.q.value.trim();
    if (q.length < 2) { clearAnswer(); return; }

    var top = renderRetrieval(q);
    if (!top.length || !withLLM) return;

    var topPages = uniquePages(top);
    var perPage = new Map();
    top.forEach(function (r) { perPage.set(r.chunk.file, (perPage.get(r.chunk.file) || 0) + r.score); });
    var ranked = Array.from(perPage.entries()).map(function (e) {
      var meta = pageMeta(e[0]);
      return { url: e[0], score: e[1], cat: (meta && meta.category) || "hub" };
    }).sort(function (a, b) { return b.score - a.score; });

    if (ui.answer) ui.answer.classList.add("visible");
    if (ui.keypoints) ui.keypoints.innerHTML = "";
    if (ui.sources) ui.sources.innerHTML = "Sources: " + sourcesHtml(topPages);

    var writer = streamWriter(ui.review);
    writer.reset();

    function finishStructured(raw) {
      if (!ui.review) return;
      var parsed = parseStructured(raw);
      ui.review.textContent = (parsed.review && cleanStructuredText(parsed.review)) || cleanStructuredText(raw) || stripCjk(raw) || "";
      if (ui.keypoints && parsed.keypoints.length) {
        ui.keypoints.innerHTML = parsed.keypoints.slice(0, 3).map(function (k) {
          return '<div class="llm-kp"><span class="llm-kp-num">&#10003;</span><span>' + esc(k) + '</span></div>';
        }).join("");
      }
      try {
        renderPanels(ranked, topPages, q, parsed.xpost, ui.review.textContent);
        renderKeywordMap(q, parsed.idea);
      } catch (err) { console.error("panel refresh failed:", err); }
    }

    runAnswer(top.slice(0, 8), q, writer).then(function (result) {
      if (!ui.review) return;
      if (!ui.review.textContent.trim()) ui.review.textContent = stripCjk(textFromResult(result));
      finishStructured(ui.review.textContent);
    }).catch(function (e) {
      console.error(e);
      // After Micro OOM / load failure: never hard-fail phones with stories —
      // fall back to extractive BM25 snippets.
      var alreadySmallest = !smallerThan(selectedModelId());
      if (isOomError(e) || alreadySmallest || isIOS || isAndroid || isLowMem) {
        try {
          var ext = applyExtractiveToReview(top.slice(0, 8), q, writer);
          finishStructured(ext);
          return;
        } catch (ee) { console.warn("extractive fallback failed:", ee); }
      }
      if (ui.review && !ui.review.textContent.trim()) {
        ui.review.textContent = "LLM unavailable: " + friendlyError(e) +
          "\n\nThe pages above are still valid. If this says 'Load failed' or 'fetch failed', the model file could not be " +
          "downloaded — check your connection, then press Load model.";
      } else {
        setStatus("LLM error: " + friendlyError(e) + " — partial answer kept.", false);
      }
    });
  }

  /* --------------------------------- chat -------------------------------- */

  var chatHistory = [];
  var chatBusy = false;

  function chatAddMsg(role, text) {
    if (!ui.chatLog) return null;
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
    if (!ui.chatInput) return;
    var q = ui.chatInput.value.trim();
    if (!q || chatBusy) return;
    if (!pages.length) { if (ui.chatStatus) ui.chatStatus.textContent = "Index is still loading — one moment."; return; }

    chatBusy = true;
    if (ui.chatSend) ui.chatSend.disabled = true;
    if (ui.chatStatus) ui.chatStatus.textContent = "";
    chatAddMsg("user", q);
    ui.chatInput.value = "";
    var bubble = chatAddMsg("bot", "…");

    var top = retrieve(q, 10);
    if (!top.length) {
      if (bubble) bubble.textContent = "Nothing on the site matches that closely — try rephrasing.";
      chatBusy = false;
      if (ui.chatSend) ui.chatSend.disabled = false;
      return;
    }
    chatHistory.push({ role: "user", content: q });

    var writer = streamWriter(bubble);

    ensureGenerator(function (m) { if (ui.chatStatus) ui.chatStatus.textContent = m; }, setProgress)
      .then(function (gen) {
        return enqueue(function () {
          if (ui.chatStatus) ui.chatStatus.textContent = "Generating on " + deviceLabel() + "…";
          setDeviceBadge("ok", deviceLabel());
          writer.reset();
          var modelId = genModelId || selectedModelId();
          var seq2seq = isSeq2Seq(modelId);
          var streamer = null;
          try {
            streamer = new mod.TextStreamer(gen.tokenizer, {
              skip_prompt: true,
              callback_function: function (t) { writer.write(stripCjk(t)); if (ui.chatLog) ui.chatLog.scrollTop = ui.chatLog.scrollHeight; }
            });
          } catch (e) { streamer = null; }
          var sysChat = "You are a helpful research assistant for the pirahansiah.com knowledge site. Answer using the document excerpts below when relevant. Always mention which source page(s) you used, like (source: /notes/.../). If the excerpts don't contain enough info, say so plainly. Always answer in English only — never in Chinese or any other language.";
          var win = modelWindowTokens(gen);
          var hasChat = !!(gen.tokenizer && gen.tokenizer.chat_template);
          var tiny = seq2seq || (win != null && win < TINY_WINDOW) || !hasChat;
          var maxNew = tiny ? (isLowMem ? 120 : 200) : (isLowMem ? 150 : 260);
          if (seq2seq) maxNew = isLowMem ? 96 : 160;
          // Keep only as much conversation history as fits the window
          // (LaMini's 1024-token window would overflow with 6 long messages).
          var histBudget = tiny ? 200 : 1200;
          var histMsgs = [], histText = "";
          for (var h = chatHistory.length - 2; h >= 0; h--) {
            var hm = chatHistory[h];
            if (!hm || !hm.content) continue;
            var piece = (hm.role === "user" ? "User: " : "Assistant: ") + hm.content;
            if (histMsgs.length >= 5 || estimateTokens(histText + piece + "\n", gen.tokenizer) > histBudget) break;
            histText += piece + "\n";
            histMsgs.unshift(hm);
          }
          var overhead = estimateTokens(sysChat, gen.tokenizer) + estimateTokens(q, gen.tokenizer) + estimateTokens(histText, gen.tokenizer) + 40;
          if (win) {
            var room = win - overhead - 48;
            if (maxNew > room) maxNew = Math.max(16, Math.floor(room));
          }
          var context = buildContext(top.slice(0, 5), gen.tokenizer, win || (seq2seq ? 512 : null), maxNew, overhead);
          var opts = { max_new_tokens: maxNew, do_sample: false, no_repeat_ngram_size: 3, repetition_penalty: 1.15 };
          if (streamer) opts.streamer = streamer;
          var extra = stoppingOpts();
          for (var k in extra) opts[k] = extra[k];
          var input;
          if (seq2seq) {
            input = "Answer in English only (never Chinese or any other language). Using ONLY these excerpts, answer the question in a few short sentences and name sources.\n\nExcerpts:\n" +
              context + "\n\nQuestion: " + q +
              (histText ? "\n\nEarlier conversation:\n" + histText : "");
          } else {
            var messages = [
              { role: "system", content: sysChat },
              { role: "user", content: "Document excerpts:\n\n" + context }
            ];
            messages = messages.concat(histMsgs);
            messages.push({ role: "user", content: q });
            input = promptFor(gen, messages);
          }
          return gen(input, opts).then(function (r) {
            if (streamer == null) {
              var full = textFromResult(r);
              if (full) writer.write(stripCjk(full));
            }
            writer.finish();
            return r;
          }, function (err) { writer.finish(); throw err; });
        });
      })
      .then(function (result) {
        if (bubble && !bubble.textContent.trim()) bubble.textContent = stripCjk(textFromResult(result));
        if (bubble && bubble.parentNode) {
          var src = document.createElement("div");
          src.className = "chat-sources";
          src.innerHTML = "Sources: " + sourcesHtml(uniquePages(top));
          bubble.parentNode.appendChild(src);
        }
        chatHistory.push({ role: "assistant", content: bubble ? bubble.textContent : "" });
        if (ui.chatStatus) ui.chatStatus.textContent = "";
      })
      .catch(function (e) {
        console.error(e);
        if (bubble) {
          if (!bubble.textContent.trim() || bubble.textContent === "…") {
            // Phone-safe: never hard-fail chat — extractive BM25 answer.
            try {
              bubble.textContent = extractiveAnswer(top, q);
              if (ui.chatStatus) ui.chatStatus.textContent = "Using extractive answer (model unavailable on this device)";
            } catch (ee) {
              bubble.textContent = "Model error: " + friendlyError(e) + " — try Load model first.";
            }
          } else {
            bubble.textContent += "\n\n[Stopped: " + ((e && e.message) || e) + " — partial answer kept]";
          }
        }
        if (ui.chatStatus && !ui.chatStatus.textContent) ui.chatStatus.textContent = "";
      })
      .then(function () {
        chatBusy = false;
        if (ui.chatSend) ui.chatSend.disabled = false;
        if (ui.chatInput) ui.chatInput.disabled = !pages.length;
        if (ui.chatLog) ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
      });
  }

  /* --------------------------------- init -------------------------------- */

  function setInputsEnabled(enabled) {
    [ui.q, ui.askBtn, ui.chatInput, ui.chatSend].forEach(function (el) { if (el) el.disabled = !enabled; });
  }

  function init() {
    if (ui.askBtn) askLabel = ui.askBtn.textContent.trim() || "Ask";
    setInputsEnabled(false);
    setDeviceBadge("warn", "checking GPU");

    if (navigator.gpu) {
      navigator.gpu.requestAdapter()
        .then(function (a) { setDeviceBadge(a ? "ok" : "warn", a ? "WebGPU ready" : "WASM fallback"); })
        .catch(function () { setDeviceBadge("warn", "WASM fallback"); });
    } else {
      setDeviceBadge("warn", "WASM fallback");
    }

    if (ui.modelSelect) {
      // Keep <option> values in sync with MODEL_OPTIONS (md may lag a deploy).
      if (ui.modelSelect.options.length === MODEL_OPTIONS.length) {
        for (var oi = 0; oi < MODEL_OPTIONS.length; oi++) {
          ui.modelSelect.options[oi].value = MODEL_OPTIONS[oi].id;
          ui.modelSelect.options[oi].textContent =
            MODEL_OPTIONS[oi].label + " · ~" + ramLabel(MODEL_OPTIONS[oi].totalMB);
        }
      }
      ui.modelSelect.value = selectedModelId();
      // Disable models that don't fit this device's RAM budget (phones and
      // low-memory desktops). The OOM auto-downgrade still catches surprises.
      for (var mi = 0; mi < ui.modelSelect.options.length; mi++) {
        var mOpt = ui.modelSelect.options[mi];
        var opt = MODEL_OPTIONS[mi] || modelOption(mOpt.value);
        if (opt && !ramAllowed(opt.totalMB)) {
          mOpt.disabled = true;
          if ((mOpt.textContent || "").indexOf("desktop only") < 0 &&
              (mOpt.textContent || "").indexOf("phone") < 0) {
            mOpt.textContent = (mOpt.textContent || mOpt.value) +
              ((isIOS || isAndroid) ? " (phone: small models only)" : " (desktop only)");
          }
        }
      }
      if (isIOS || isAndroid) ui.modelSelect.value = selectedModelId();
      updateRamInfo();
      on(ui.modelSelect, "change", function () {
        storageSet(MODEL_KEY, ui.modelSelect.value);
        updateRamInfo();
        disposeGenerator().then(function () {
          var name = (ui.modelSelect.selectedOptions && ui.modelSelect.selectedOptions[0])
            ? ui.modelSelect.selectedOptions[0].textContent.split("·")[0].trim()
            : ui.modelSelect.value;
          setStatus("Model set to " + name + ". The next answer downloads it.", false);
        });
      });
    }

    // Manual backend/method selector: Auto lets the page pick the best backend
    // for this device (WebGPU → WASM ladder); WebGPU / WASM force a method.
    if (ui.deviceSelect) {
      ui.deviceSelect.value = deviceMode();
      on(ui.deviceSelect, "change", function () {
        storageSet(MODE_KEY, ui.deviceSelect.value);
        if (ui.deviceSelect.value === "auto") { try { localStorage.removeItem(DEVICE_KEY); } catch (e) {} }
        else storageSet(DEVICE_KEY, ui.deviceSelect.value);
        disposeGenerator().then(function () {
          setStatus("Method set to " + ui.deviceSelect.value.toUpperCase() +
            ". The next answer reloads the model on that backend.", false);
        });
      });
    }

    wireResultDelegation();

    setStatus("Loading index…", true);
    Promise.all([
      fetch(INDEX_URL).then(function (r) { if (!r.ok) throw new Error("index HTTP " + r.status); return r.json(); }),
      fetch(GRAPH_URL).then(function (r) { if (!r.ok) throw new Error("graph HTTP " + r.status); return r.json(); })
    ]).then(function (arr) {
      setupGraph(arr[1]);
      return buildIndex(arr[0], setProgress);
    }).then(function () {
      if (ui.stats) ui.stats.textContent = pages.length + " pages · " + chunks.length + " sections indexed";
      setStatus("Ready. Ask a question or type keywords — results appear as you type.", false);
      setInputsEnabled(true);
      if (ui.q) ui.q.focus();
    }).catch(function (e) {
      console.error(e);
      setStatus("Could not load the index (" + ((e && e.message) || e) + ").", false);
      if (ui.hint) ui.hint.textContent = "Index unavailable — reload the page to try again.";
    });

    // Type → instant retrieval only. Enter / Ask → retrieval + LLM answer.
    var liveSearch = debounce(function () {
      if (!generating && ui.q && ui.q.value.trim().length >= 2) renderRetrieval(ui.q.value.trim());
    }, 220);
    on(ui.q, "input", liveSearch);
    on(ui.q, "keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(true); } });

    on(ui.askBtn, "click", function () {
      if (generating) { stopGeneration(); setStatus("Stopping…", false); return; }
      doSearch(true);
    });

    document.querySelectorAll(".llm-suggest button").forEach(function (b) {
      on(b, "click", function () {
        if (!ui.q) return;
        ui.q.value = b.getAttribute("data-q") || "";
        doSearch(true);
        ui.q.focus();
      });
    });

    on(ui.initBtn, "click", function () {
      ensureGenerator(function (m) { setStatus(m, true); }, setProgress).then(function () {
        setStatus("Model ready on " + deviceLabel() + ".", false);
        setDeviceBadge("ok", deviceLabel());
      }).catch(function (e) {
        if (isOomError(e) || isIOS || isAndroid) {
          setStatus("Using extractive answer (model unavailable on this device)", false);
          setDeviceBadge("warn", "extractive");
        } else {
          setStatus("Model load failed: " + friendlyError(e) + " — check your connection and retry.", false);
          setDeviceBadge("err", "load failed");
        }
      });
    });

    on(ui.chatSend, "click", chatSend);
    on(ui.chatInput, "keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); chatSend(); }
    });

    // Re-lay the force graph on resize (it used to keep the old width forever).
    on(window, "resize", debounce(function () {
      if (lastGraphArgs) renderConnections(lastGraphArgs.query, lastGraphArgs.top);
    }, 250));

    // Free GPU/WASM memory when the tab is discarded.
    on(window, "pagehide", function () { if (connSim) connSim.stop(); disposeGenerator(); });
  }

  window.LLMSearch = {
    search: function (q) { if (ui.q) { ui.q.value = q; } doSearch(true); },
    stop: stopGeneration,
    reload: function () { return disposeGenerator(); },
    state: function () {
      return { pages: pages.length, chunks: chunks.length, terms: inverted.size, device: device, dtype: dtype, model: selectedModelId() };
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
