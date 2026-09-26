(() => {
  "use strict";

  const pages = Array.isArray(window.SITE_CATALOG) ? window.SITE_CATALOG : [];
  const categoryOrder = [
    "Research & publications",
    "Courses",
    "Notes & guides",
    "Talks & presentations",
    "Projects",
    "Coaching resources",
    "Site & services",
    "Site & tools"
  ];
  const layout = {
    desktop: {
      "Research & publications": [185, 178],
      "Courses": [475, 150],
      "Notes & guides": [790, 180],
      "Talks & presentations": [950, 400],
      "Projects": [780, 510],
      "Coaching resources": [460, 500],
      "Site & services": [180, 435],
      "Site & tools": [525, 325]
    },
    mobile: {
      "Research & publications": [270, 130],
      "Courses": [810, 130],
      "Notes & guides": [270, 380],
      "Talks & presentations": [810, 380],
      "Projects": [270, 640],
      "Coaching resources": [810, 640],
      "Site & services": [270, 900],
      "Site & tools": [810, 900]
    }
  };
  const ns = "http://www.w3.org/2000/svg";
  const byId = new Map(pages.map((page) => [page.id, page]));
  const groups = new Map(categoryOrder.map((category) => [category, pages.filter((page) => page.category === category)]));
  const counts = new Map(Array.from(groups, ([category, list]) => [category, list.length]));
  const search = document.getElementById("search");
  const filters = document.getElementById("filters");
  const pageList = document.getElementById("page-list");
  const emptyState = document.getElementById("empty-state");
  const map = document.getElementById("constellation");
  const mapLinks = document.getElementById("map-links");
  const mapOrbits = document.getElementById("map-orbits");
  const mapLabels = document.getElementById("map-labels");
  const mapNodes = document.getElementById("map-nodes");
  const motionToggle = document.getElementById("motion-toggle");
  const state = { category: "All pages", query: "", selectedId: "", mobile: false, paused: false };

  const svg = (name, attrs = {}) => {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  }

  function matchingPages() {
    const q = state.query.trim().toLocaleLowerCase();
    return pages.filter((page) => {
      const categoryMatch = state.category === "All pages" || page.category === state.category;
      const searchMatch = !q || `${page.title} ${page.category} ${page.source}`.toLocaleLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }

  function renderFilters() {
    filters.replaceChildren();
    const options = ["All pages", ...categoryOrder.filter((category) => counts.get(category))];
    options.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter-chip";
      button.setAttribute("aria-pressed", String(state.category === category));
      button.append(document.createTextNode(category));
      const count = document.createElement("span");
      count.className = "count";
      count.textContent = String(category === "All pages" ? pages.length : counts.get(category));
      button.append(count);
      button.addEventListener("click", () => {
        state.category = category;
        renderFilters();
        renderResults();
      });
      filters.append(button);
    });
  }

  function choosePage(page) {
    if (!page) return;
    state.selectedId = page.id;
    setText("#selection-category", page.category);
    setText("#selection-heading", page.title);
    setText("#selection-copy", page.source.endsWith("/farshid/content/atlas.md")
      ? "The single index of everything on pirahansiah.com — publications, courses, notes, talks, and projects."
      : "Open this page on the original website.");
    const link = document.getElementById("selection-link");
    link.href = page.href;
    link.setAttribute("aria-label", `Open ${page.title}`);
    const index = pages.findIndex((item) => item.id === page.id) + 1;
    setText("#selection-number", `${String(index).padStart(2, "0")} / ${pages.length}`);
    mapNodes.querySelectorAll(".map-node").forEach((node) => {
      node.classList.toggle("is-selected", node.getAttribute("data-id") === page.id);
    });
  }

  function renderResults() {
    const results = matchingPages();
    const fragment = document.createDocumentFragment();
    categoryOrder.forEach((category) => {
      const entries = results.filter((page) => page.category === category);
      if (!entries.length) return;
      const section = document.createElement("section");
      section.className = "page-group";
      const heading = document.createElement("h3");
      heading.append(document.createTextNode(category));
      const count = document.createElement("span");
      count.textContent = `${entries.length} ${entries.length === 1 ? "page" : "pages"}`;
      heading.append(count);
      section.append(heading);
      const list = document.createElement("div");
      list.className = "page-links";
      entries.forEach((page) => {
        const link = document.createElement("a");
        link.className = "page-link";
        link.href = page.href;
        link.title = page.title;
        const title = document.createElement("span");
        title.textContent = page.title;
        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";
        link.append(title, arrow);
        list.append(link);
      });
      section.append(list);
      fragment.append(section);
    });
    pageList.replaceChildren(fragment);
    emptyState.hidden = results.length > 0;
    setText("#visible-count", `${results.length} ${results.length === 1 ? "page" : "pages"}`);
    setText("#result-status", state.query || state.category !== "All pages"
      ? `Showing ${results.length} of ${pages.length} pages${state.category !== "All pages" ? ` in ${state.category}` : ""}.`
      : `${pages.length} pages across ${categoryOrder.filter((category) => counts.get(category)).length} topics.`);
    mapNodes.querySelectorAll(".map-node").forEach((node) => {
      const page = byId.get(node.getAttribute("data-id"));
      const categoryMatch = state.category === "All pages" || page?.category === state.category;
      const q = state.query.trim().toLocaleLowerCase();
      const searchMatch = !q || `${page?.title || ""} ${page?.category || ""} ${page?.source || ""}`.toLocaleLowerCase().includes(q);
      node.style.display = categoryMatch && searchMatch ? "" : "none";
    });
    const selected = byId.get(state.selectedId);
    if (results.length && (!selected || !results.some((page) => page.id === selected.id))) choosePage(results[0]);
  }

  function radiusFor(count) {
    return Math.min(96, Math.max(38, 24 + Math.sqrt(count) * 13));
  }

  function drawMap() {
    state.mobile = window.matchMedia("(max-width: 700px)").matches;
    map.setAttribute("viewBox", state.mobile ? "0 0 1080 1040" : "0 0 1080 600");
    map.classList.toggle("mobile-map", state.mobile);
    mapLinks.replaceChildren();
    mapOrbits.replaceChildren();
    mapLabels.replaceChildren();
    mapNodes.replaceChildren();

    const centers = layout[state.mobile ? "mobile" : "desktop"];
    const core = state.mobile ? [540, 520] : [540, 315];
    categoryOrder.forEach((category) => {
      const entries = groups.get(category) || [];
      if (!entries.length) return;
      const [cx, cy] = centers[category];
      const radius = radiusFor(entries.length);
      const coreLink = svg("path", { class: "core-link", d: `M ${core[0]} ${core[1]} Q ${(core[0] + cx) / 2} ${(core[1] + cy) / 2 - 15} ${cx} ${cy}` });
      mapLinks.append(coreLink);
      const orbit = svg("circle", { class: "orbit", cx, cy, r: radius + 19 });
      const inner = svg("circle", { class: "orbit-inner", cx, cy, r: radius + 8 });
      const halo = svg("circle", { class: "cluster-halo", cx, cy, r: radius + 14 });
      mapOrbits.append(orbit, inner, halo);

      const label = svg("text", { class: "cluster-label", x: cx, y: cy - radius - 21 });
      label.textContent = category;
      label.addEventListener("click", () => {
        state.category = category;
        renderFilters();
        renderResults();
      });
      const count = svg("text", { class: "cluster-count", x: cx, y: cy - radius - 7 });
      count.textContent = `${entries.length} ${entries.length === 1 ? "page" : "pages"}`;
      mapLabels.append(label, count);

      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      entries.forEach((page, index) => {
        const angle = index * goldenAngle;
        const distance = radius * Math.sqrt((index + .5) / entries.length);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance * .82;
        const node = svg("g", { class: "map-node", "data-id": page.id, style: `--delay:${Math.min(index * 5, 130)}ms` });
        const title = svg("title");
        title.textContent = `${page.title} — ${category}`;
        const dot = svg("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.1 });
        node.append(title, dot);
        node.addEventListener("pointerenter", () => choosePage(page));
        node.addEventListener("click", () => choosePage(page));
        mapNodes.append(node);
      });
    });

    if (byId.has(state.selectedId)) choosePage(byId.get(state.selectedId));
    renderResults();
  }

  function setMotionPaused(paused) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    state.paused = paused || prefersReduced;
    document.documentElement.classList.toggle("motion-paused", state.paused);
    motionToggle.disabled = prefersReduced;
    motionToggle.setAttribute("aria-pressed", String(state.paused));
    const label = prefersReduced ? "Motion reduced" : state.paused ? "Resume motion" : "Pause motion";
    motionToggle.querySelector("span").textContent = label;
    motionToggle.setAttribute("aria-label", label);
  }

  document.getElementById("entry-total").textContent = String(pages.length);
  search.placeholder = `Search ${pages.length} pages…`;
  document.querySelectorAll(".map-caption span")[0].textContent = `${pages.length} pages`;
  document.querySelectorAll(".map-caption span")[1].textContent = `${categoryOrder.filter((category) => counts.get(category)).length} topics`;
  search.addEventListener("input", () => {
    state.query = search.value;
    renderResults();
  });
  motionToggle.addEventListener("click", () => setMotionPaused(!state.paused));
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape" && document.activeElement === search && search.value) {
      search.value = "";
      state.query = "";
      renderResults();
    }
  });

  renderFilters();
  const atlas = pages.find((page) => page.source.endsWith("/farshid/content/atlas.md")) || pages[0];
  if (atlas) choosePage(atlas);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  setMotionPaused(reducedMotion.matches);
  drawMap();
  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", (event) => setMotionPaused(event.matches));
  }
  window.addEventListener("resize", () => {
    const isMobile = window.matchMedia("(max-width: 700px)").matches;
    if (isMobile !== state.mobile) drawMap();
  }, { passive: true });
})();
