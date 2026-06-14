/**
 * Render Obsidian MOC markdown (assets/site-map.md) on the home page.
 */
(function () {
  "use strict";

  var root = document.getElementById("site-content");
  if (!root) return;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var VIEWER_EXT =
    "html htm pdf doc docx py cpp c h java js ts go rs rb php swift kt cs sh sql r json xml css txt csv png jpg jpeg gif webp svg pdf".split(
      " "
    );

  function toMenuHref(href) {
    if (/^(https?:|#|mailto:)/i.test(href)) return href;
    if (!href.startsWith("/")) href = "/" + href;
    if (href.indexOf("/view/") === 0) return href;
    if (href.endsWith("/")) return href;
    var m = href.match(/\.([a-z0-9]+)$/i);
    if (m && VIEWER_EXT.indexOf(m[1].toLowerCase()) !== -1) {
      return "/view/?p=" + encodeURIComponent(href);
    }
    if (!/\.\w{2,5}$/i.test(href)) href += "/";
    return href;
  }

  function parseInline(text) {
    text = text.trim();
    var md = text.match(/^\[(.+?)\]\((.+?)\)$/);
    if (md) {
      var href = toMenuHref(md[2].trim());
      return (
        '<a class="liquid-glass-item moc-item" href="' +
        escapeHtml(href) +
        '">' +
        escapeHtml(md[1]) +
        "</a>"
      );
    }
    var wiki = text.match(/^\[\[(.+?)\]\]$/);
    if (wiki) {
      var ref = wiki[1];
      var label = ref;
      var path = ref;
      if (ref.indexOf("|") !== -1) {
        var parts = ref.split("|");
        path = parts[0].trim();
        label = parts[1].trim();
      }
      var href = "/contents/" + path.replace(/\.md$/i, "") + "/";
      return (
        '<a class="liquid-glass-item moc-item" href="' +
        escapeHtml(href) +
        '">' +
        escapeHtml(label) +
        "</a>"
      );
    }
    return '<span class="moc-item liquid-glass-item">' + escapeHtml(text) + "</span>";
  }

  function render(text) {
    var html = "";
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var s = line.trim();
      if (!s || s === "[]") continue;

      if (s.indexOf("#") === 0) {
        var m = s.match(/^(#{1,6})\s+(.+)$/);
        if (m) {
          var lvl = m[1].length;
          html +=
            "<h" +
            lvl +
            ' class="liquid-glass-item moc-heading">' +
            parseInline(m[2]) +
            "</h" +
            lvl +
            ">";
          continue;
        }
      }

      var list = line.match(/^(\s*)[-*+]\s+(.+)$/);
      if (list) {
        var depth = Math.floor(list[1].length / 2) + 1;
        html +=
          '<p class="moc-list" style="padding-left:' +
          depth * 1.1 +
          'rem">' +
          parseInline(list[2]) +
          "</p>";
        continue;
      }

      if (/^\[.+\]\(.+\)$/.test(s) || /^\[\[.+\]\]$/.test(s)) {
        html += '<p class="moc-link">' + parseInline(s) + "</p>";
        continue;
      }

      html += '<p class="moc-text liquid-glass-item">' + escapeHtml(s) + "</p>";
    }

    root.innerHTML = html;
  }

  fetch("/assets/site-map.md")
    .then(function (r) {
      if (!r.ok) throw new Error("map missing");
      return r.text();
    })
    .then(render)
    .catch(function () {
      root.innerHTML =
        "<p><em>Site map is being generated...</em><br><small>This message appears while GitHub Actions builds the site. It will be ready shortly.</small></p>";
    });
})();
