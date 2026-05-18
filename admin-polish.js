(() => {
  document.addEventListener("DOMContentLoaded", () => waitForAdmin().then(init).catch(() => {}));

  function waitForAdmin() {
    const app = document.querySelector("[data-admin-app]");
    if (!app) return Promise.reject(new Error("Admin app not found"));
    if (!app.classList.contains("is-hidden")) return Promise.resolve();
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (!app.classList.contains("is-hidden")) { observer.disconnect(); resolve(); }
      });
      observer.observe(app, { attributes: true, attributeFilter: ["class"] });
    });
  }

  async function init() {
    addQuickActions();
    addBottomNav();
    await renderTrendPanels();
    observeNavState();
  }

  async function renderTrendPanels() {
    const overview = document.querySelector("[data-page-panel='overview']");
    const anchor = overview?.querySelector("[data-enhanced-analytics]");
    if (!overview || overview.querySelector(".admin-trend-grid")) return;
    const grid = document.createElement("div");
    grid.className = "admin-trend-grid";
    grid.innerHTML = `
      <section class="admin-panel admin-trend-panel is-loading"><div class="admin-panel-head"><h2>Activity pulse</h2><span class="admin-chip">14 days</span></div><div class="admin-trend-bars" data-trend-bars></div><div class="admin-trend-labels"><span>Older</span><span>Today</span></div></section>
      <section class="admin-panel"><div class="admin-panel-head"><h2>Performance score</h2><span class="admin-chip">health</span></div><div class="admin-score-list" data-score-list></div></section>
    `;
    if (anchor) anchor.after(grid); else overview.querySelector("[data-stats]")?.after(grid);
    try {
      const [summary, registrations, bookings, products, activities] = await Promise.all([
        api("/api/admin/summary"), api("/api/admin/registrations?perPage=100"), api("/api/admin/bookings?perPage=100"), api("/api/admin/products"), api("/api/admin/activities")
      ]);
      drawTrend(registrations.rows || [], bookings.rows || []);
      drawScores(summary, products || [], activities || []);
    } catch {
      drawTrend([], []);
      drawScores({}, [], []);
    } finally {
      grid.querySelectorAll(".is-loading").forEach((node) => node.classList.remove("is-loading"));
    }
  }

  async function api(path) {
    const response = await fetch(path, { credentials: "same-origin", headers: { "content-type": "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function drawTrend(registrations, bookings) {
    const bars = document.querySelector("[data-trend-bars]");
    if (!bars) return;
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      return date.toISOString().slice(0, 10);
    });
    const counts = days.map((day) => [...registrations, ...bookings].filter((row) => String(row.createdAt || "").slice(0, 10) === day).length);
    const max = Math.max(...counts, 1);
    bars.innerHTML = counts.map((count) => `<span class="admin-trend-bar" title="${count} requests" style="--height:${Math.max(8, Math.round((count / max) * 100))}%"></span>`).join("");
  }

  function drawScores(summary, products, activities) {
    const list = document.querySelector("[data-score-list]");
    if (!list) return;
    const visibleProducts = products.filter((item) => item.isActive !== 0).length;
    const visibleActivities = activities.filter((item) => item.isActive !== 0).length;
    const requestTotal = Number(summary.registrations || 0) + Number(summary.bookings || 0);
    const productScore = percent(visibleProducts, Math.max(products.length, 1));
    const activityScore = percent(visibleActivities, Math.max(activities.length, 1));
    list.innerHTML = `
      <div class="admin-score"><span>Catalog live</span><strong>${productScore}%</strong></div>
      <div class="admin-score"><span>Activities live</span><strong>${activityScore}%</strong></div>
      <div class="admin-score"><span>Total demand</span><strong>${requestTotal}</strong></div>
      <div class="admin-score"><span>Follow-up load</span><strong>${requestTotal > 10 ? "High" : requestTotal > 0 ? "Active" : "Calm"}</strong></div>
    `;
  }

  function addQuickActions() {
    const main = document.querySelector(".admin-main");
    if (!main || document.querySelector(".admin-quick-actions")) return;
    const actions = document.createElement("div");
    actions.className = "admin-quick-actions";
    actions.innerHTML = quickButtons(["activities", "products", "registrations", "bookings", "calendar", "roles"]);
    main.prepend(actions);
    actions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-jump]");
      if (button) jump(button.dataset.adminJump);
    });
  }

  function addBottomNav() {
    if (document.querySelector(".admin-bottom-nav")) return;
    const nav = document.createElement("nav");
    nav.className = "admin-bottom-nav";
    nav.setAttribute("aria-label", "Mobile admin navigation");
    nav.innerHTML = quickButtons(["overview", "activities", "products", "calendar", "roles"]);
    document.body.append(nav);
    nav.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-jump]");
      if (button) jump(button.dataset.adminJump);
    });
  }

  function quickButtons(keys) {
    const labels = { overview: "Overview", activities: "Activities", products: "Products", registrations: "Regs", bookings: "Bookings", calendar: "Calendar", roles: "Roles" };
    return keys.map((key) => `<button type="button" data-admin-jump="${key}">${labels[key] || key}</button>`).join("");
  }

  function jump(view) {
    const existing = document.querySelector(`[data-nav-view='${view}']`);
    if (existing) existing.click();
    else {
      const panel = document.querySelector(`[data-page-panel='${view}']`);
      if (!panel) return;
      document.querySelectorAll("[data-page-panel]").forEach((item) => item.classList.toggle("is-active", item === panel));
      document.querySelectorAll("[data-nav-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.navView === view));
    }
    syncActive(view);
  }

  function observeNavState() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-nav-view]");
      if (button) setTimeout(() => syncActive(button.dataset.navView), 0);
    });
    syncActive(new URLSearchParams(location.search).get("view") || "overview");
  }

  function syncActive(view) {
    document.querySelectorAll("[data-admin-jump]").forEach((button) => button.classList.toggle("is-active", button.dataset.adminJump === view));
  }

  function percent(value, max) { return Math.max(0, Math.min(100, Math.round((Number(value) / Math.max(Number(max), 1)) * 100))); }
})();
