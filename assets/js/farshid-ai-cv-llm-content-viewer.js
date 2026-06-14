/**
 * Universal file viewer — keeps site nav/CSS while showing html, pdf, code, etc.
 * Usage: /view/?p=/contents/cv/AboutMe.html
 */
(function () {
  "use strict";

  var CODE_EXT =
    "py cpp c cc h hpp hh java js ts jsx tsx go rs rb php swift kt cs sh bash zsh fish sql r m mm yaml yml toml xml css scss html htm vue svelte json jsonc md txt ini cfg conf log dockerfile makefile".split(
      " "
    );

  var EMBED_EXT = ["pdf"];
  var IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"];
  var HTML_EXT = ["html", "htm"];

  var stage = document.getElementById("viewer-stage");
  var titleEl = document.getElementById("viewer-title");
  var openLink = document.getElementById("viewer-open");
  var downloadLink = document.getElementById("viewer-download");
  if (!stage) return;

  function ext(path) {
    var m = path.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  }

  function basename(path) {
    return path.split("/").pop() || path;
  }

  function normalizeContentPath(p) {
    if (!p || typeof p !== "string") return "";

    try {
      p = decodeURIComponent(p.replace(/\+/g, " "));
    } catch (err) {
      /* keep as-is */
    }

    if (p.indexOf("/view/") !== -1 || p.indexOf("?p=") !== -1 || p.indexOf("&p=") !== -1) {
      var q = p.indexOf("?") !== -1 ? p.slice(p.indexOf("?") + 1) : "";
      var params = new URLSearchParams(q);
      var inner = params.get("p") || params.get("path");
      if (inner) return normalizeContentPath(inner);
    }

    p = p.trim();
    if (p.startsWith("contents/")) p = "/" + p;
    return p;
  }

  function isSafePath(p) {
    p = normalizeContentPath(p);
    if (!p) return false;
    if (p.indexOf("..") !== -1) return false;
    return /^\/contents\//i.test(p);
  }

  function showError(msg) {
    stage.innerHTML = '<p class="viewer-error">' + msg + "</p>";
  }

  function setChrome(filePath) {
    var name = basename(filePath);
    if (titleEl) titleEl.textContent = name;
    if (openLink) {
      openLink.href = filePath;
      openLink.textContent = "Open file";
    }
    if (downloadLink) {
      downloadLink.href = filePath;
      downloadLink.setAttribute("download", name);
    }
  }

  function showDownloadCard(filePath, message) {
    stage.innerHTML =
      '<div class="viewer-download-card"><p>' +
      message +
      '</p><a href="' +
      filePath +
      '" download>Download ' +
      basename(filePath) +
      "</a></div>";
  }

  function loadHtml(filePath) {
    var iframe = document.createElement("iframe");
    iframe.title = basename(filePath);
    iframe.src = filePath;
    iframe.setAttribute("loading", "lazy");
    stage.innerHTML = "";
    stage.appendChild(iframe);
  }

  function loadEmbed(filePath) {
    var iframe = document.createElement("iframe");
    iframe.src = filePath;
    iframe.title = basename(filePath);
    stage.innerHTML = "";
    stage.appendChild(iframe);
  }

  function loadImage(filePath) {
    var img = document.createElement("img");
    img.src = filePath;
    img.alt = basename(filePath);
    stage.innerHTML = "";
    stage.appendChild(img);
  }

  function loadCode(filePath) {
    stage.innerHTML = '<pre class="viewer-code-wrap" id="viewer-code">Loading…</pre>';
    var pre = document.getElementById("viewer-code");
    fetch(filePath)
      .then(function (r) {
        if (!r.ok) throw new Error("not found");
        return r.text();
      })
      .then(function (text) {
        pre.textContent = text;
      })
      .catch(function () {
        pre.textContent = "Could not load file.";
      });
  }

  function load(filePath) {
    if (!isSafePath(filePath)) {
      showError("Invalid path. Only files under /contents/ are allowed.");
      return;
    }

    setChrome(filePath);
    var e = ext(filePath);

    if (HTML_EXT.indexOf(e) !== -1) {
      loadHtml(filePath);
    } else if (EMBED_EXT.indexOf(e) !== -1) {
      loadEmbed(filePath);
    } else if (IMAGE_EXT.indexOf(e) !== -1) {
      loadImage(filePath);
    } else if (CODE_EXT.indexOf(e) !== -1 || e === "") {
      loadCode(filePath);
    } else {
      showDownloadCard(
        filePath,
        "Preview is not available for ." +
          e +
          " files. Download or open the file directly."
      );
    }
  }

  var params = new URLSearchParams(window.location.search);
  var path = normalizeContentPath(params.get("p") || params.get("path") || "");

  if (!path) {
    if (titleEl) titleEl.textContent = "No file selected";
    showError('Missing file path. Use <code>/view/?p=/contents/…</code>');
    return;
  }

  load(path);
})();
