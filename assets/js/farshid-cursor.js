/**
 * Farshid Liquid-Glass Cursor — macOS 27 / iOS 27
 */
(function () {
  "use strict";

  const cursor = document.createElement('div');
  cursor.id = 'farshid-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <div class="cursor-glass"></div>
    <div class="cursor-shine"></div>
    <div class="cursor-ring"></div>
    <div class="cursor-dot"></div>
  `;
  document.body.appendChild(cursor);

  let targetX = -200, targetY = -200;
  let currentX = -200, currentY = -200;
  let raf;

  const LERP = 0.14;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function loop() {
    currentX = lerp(currentX, targetX, LERP);
    currentY = lerp(currentY, targetY, LERP);
    cursor.style.transform =
      "translate(calc(" + currentX + "px - 50%), calc(" + currentY + "px - 50%))";
    raf = requestAnimationFrame(loop);
  }

  document.addEventListener("mousemove", function (e) {
    targetX = e.clientX;
    targetY = e.clientY;
  }, { passive: true });

  document.addEventListener("mouseleave", function () {
    cursor.style.opacity = "0";
  });
  document.addEventListener("mouseenter", function () {
    cursor.style.opacity = "1";
  });

  document.addEventListener("mousedown", function () {
    cursor.classList.add("is-clicking");
  });
  document.addEventListener("mouseup", function () {
    cursor.classList.remove("is-clicking");
  });

  const HOVER_SELECTOR = [
    "a",
    "button",
    '[role="button"]',
    'input[type="submit"]',
    'input[type="button"]',
    "select",
    "label",
    "summary",
    ".liquid-glass-item",
    ".nav-list a",
    ".nav-toggle",
    ".nav-menu-btn",
    ".toolbar button",
    ".toolbar a"
  ].join(", ");

  const TEXT_SELECTOR = [
    "p",
    "span",
    "li",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote",
    "td", "th",
    "input[type='text']",
    "textarea",
    "[contenteditable]"
  ].join(", ");

  document.addEventListener("mouseover", function (e) {
    const target = e.target;
    if (!target) return;

    if (target.closest(HOVER_SELECTOR)) {
      cursor.classList.add("is-hovered");
      cursor.classList.remove("is-text");
      return;
    }

    if (target.closest(TEXT_SELECTOR) && !target.closest(HOVER_SELECTOR)) {
      cursor.classList.add("is-text");
      cursor.classList.remove("is-hovered");
      return;
    }

    cursor.classList.remove("is-hovered", "is-text");
  }, { passive: true });

  document.addEventListener("mouseout", function (e) {
    const related = e.relatedTarget;
    if (!related || related === document.documentElement) {
      cursor.classList.remove("is-hovered", "is-text");
    }
  }, { passive: true });

  loop();
})();
