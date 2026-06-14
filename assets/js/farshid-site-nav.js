/**
 * Nav dropdown toggles + liquid-glass pointer tracking.
 */
(function () {
  "use strict";

  var nav = document.getElementById("site-nav");
  var navList = document.getElementById("nav-list");
  var menuBtn = document.getElementById("nav-menu-btn");
  if (!nav || !navList) return;

  function setMobileNavOpen(open) {
    nav.classList.toggle("nav-open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Menu";
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setMobileNavOpen(!nav.classList.contains("nav-open"));
    });
  }

  function closeAll(exceptLi) {
    var open = navList.querySelectorAll("li.has-children.open");
    for (var i = 0; i < open.length; i++) {
      if (exceptLi && open[i] === exceptLi) continue;
      open[i].classList.remove("open");
      var toggles = open[i].querySelectorAll("[data-nav-toggle]");
      for (var j = 0; j < toggles.length; j++) {
        toggles[j].setAttribute("aria-expanded", "false");
      }
    }
  }

  navList.addEventListener("click", function (e) {
    if (e.target.closest(".nav-sub a:not([data-nav-toggle])")) {
      setMobileNavOpen(false);
      return;
    }

    var toggle = e.target.closest("[data-nav-toggle]");
    if (!toggle) return;

    var li = toggle.closest("li.has-children");
    if (!li) return;

    e.preventDefault();
    e.stopPropagation();

    var isOpen = li.classList.contains("open");

    if (li.parentElement && li.parentElement.classList.contains("nav-list")) {
      closeAll(li);
    }

    if (!isOpen) {
      li.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    } else {
      li.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#site-nav")) {
      closeAll();
      setMobileNavOpen(false);
    }
  });

  function trackGlassPointer(e) {
    var nodes = document.querySelectorAll(
      ".liquid-glass, .liquid-glass-item, .toolbar button, .toolbar a, main.site-main a, main.site-main .moc-item"
    );
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", x + "%");
      el.style.setProperty("--mouse-y", y + "%");
    }
  }

  document.addEventListener("mousemove", trackGlassPointer, { passive: true });
  trackGlassPointer({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
})();
