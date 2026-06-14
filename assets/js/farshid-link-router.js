/**
 * Route static content links through /view/ so nav + CSS stay visible.
 */
(function () {
  "use strict";

  var VIEWER_PATH = "/view/";

  var VIEWER_EXT =
    "html htm pdf doc docx xls xlsx ppt pptx zip py cpp c cc h hpp java js ts jsx tsx go rs rb php swift kt cs sh bash zsh sql r json xml css txt csv png jpg jpeg gif webp svg bmp mp4 webm".split(
      " "
    );

  function needsViewer(href) {
    if (!href || href.indexOf("/contents/") !== 0) return false;
    if (href.indexOf(VIEWER_PATH) === 0) return false;
    var path = href.split("?")[0];
    if (path.endsWith("/")) return false;
    var m = path.match(/\.([a-z0-9]+)$/i);
    if (!m) return false;
    return VIEWER_EXT.indexOf(m[1].toLowerCase()) !== -1;
  }

  function viewerHref(filePath) {
    return VIEWER_PATH + "?p=" + encodeURIComponent(filePath);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || a.getAttribute("target") === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var href = a.getAttribute("href");
    if (!href || href.charAt(0) !== "/") return;
    if (!needsViewer(href)) return;

    e.preventDefault();
    window.location.href = viewerHref(href);
  });
})();
