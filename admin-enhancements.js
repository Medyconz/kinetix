(() => {
  const ENHANCED_VIEWS = [
    { key: "calendar", label: "Calendar", group: "Planning", description: "Activities and booking requests by date." },
    { key: "roles", label: "Roles", group: "Security", description: "Admin role templates and permission limits." },
  ];
  const ROLE_STORAGE_KEY = "kinetix_admin_role_drafts";
  const ASSIGNMENT_STORAGE_KEY = "kinetix_admin_assignments";
  const state = {
    me: null,
    summary: { activities: 0, products: 0, registrations: 0, bookings: 0 },
    activities: [],
    products: [],
    registrations: { rows: [], total: 0 },
    bookings: { rows: [], total: 0 },
  };

  document.addEventListener("DOMContentLoaded", () => {
    waitForAdminApp().then(initEnhancements).catch(() => {});
  });

  async function initEnhancements() {
    buildOverviewAnalytics();
    buildCalendarPanel();
    buildRolesPanel();
    addEnhancedNavigation();
    bindEnhancedNavigation();
    await loadEnhancedData();
    renderOverviewAnalytics();
    renderCalendar();
    renderRoles();
    const requested = new URLSearchParams(location.search).get("view");
    if (requested === "calendar" || requested === "roles") showEnhancedView(requested);
  }

  function waitForAdminApp() {
    const app = document.querySelector("[data-admin-app]");
    if (!app) return Promise.reject(new Error("Admin app not found"));
    if (!app.classList.contains("is-hidden")) return Promise.resolve();
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (!app.classList.contains("is-hidden")) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(app, { attributes: true, attributeFilter: ["class"] });
    });
  }

  async function loadEnhancedData() {
    const results = await Promise.allSettled([
      api("/api/admin/me"),
      api("/api/admin/summary"),
      api("/api/admin/activities"),
      api("/api/admin/products"),
      api("/api/admin/registrations?perPage=100"),
      api("/api/admin/bookings?perPage=100"),
    ]);
    const [me, summary, activities, products, registrations, bookings] = results.map((result) => result.status === "fulfilled" ? result.value : null);
    if (me) state.me = me;
    if (summary) state.summary = summary;
    if (activities) state.activities = activities;
    if (products) state.products = products;
    if (registrations) state.registrations = registrations;
    if (bookings) state.bookings = bookings;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers || {}) },
      credentials: "same-origin",
    });
    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();
    if (!response.ok) throw new Error(data?.error || "Request failed");
    return data;
  }

  function addEnhancedNavigation() {
    const nav = document.querySelector("[data-resource-nav]");
    if (!nav || nav.querySelector("[data-enhanced-nav]")) return;
    const planning = document.createElement("div");
    planning.className = "admin-nav-group";
    planning.dataset.enhancedNav = "true";
    planning.innerHTML = `<div class="admin-nav-title">Planning</div>${ENHANCED_VIEWS.map((view) => `<button type="button" data-nav-view="${view.key}">${view.label}</button>`).join("")}`;
    const settingsGroup = [...nav.querySelectorAll(".admin-nav-group")].find((group) => group.textContent.toLowerCase().includes("security"));
    if (settingsGroup) settingsGroup.after(planning);
    else nav.append(planning);
  }

  function bindEnhancedNavigation() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-nav-view='calendar'],[data-nav-view='roles']");
      if (!button) return;
      event.preventDefault();
      showEnhancedView(button.dataset.navView);
    });
  }

  function showEnhancedView(view) {
    const panel = document.querySelector(`[data-page-panel='${view}']`);
    if (!panel) return;
    document.querySelectorAll("[data-page-panel]").forEach((section) => section.classList.toggle("is-active", section === panel));
    document.querySelectorAll("[data-nav-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.navView === view));
    const label = ENHANCED_VIEWS.find((item) => item.key === view)?.label || view;
    const breadcrumbs = document.querySelector("[data-breadcrumbs]");
    if (breadcrumbs) breadcrumbs.textContent = `Admin / ${label}`;
    document.body.classList.remove("admin-nav-open");
    history.replaceState(null, "", `admin.html?view=${encodeURIComponent(view)}`);
  }

  function buildOverviewAnalytics() {
    const overview = document.querySelector("[data-page-panel='overview']");
    const stats = overview?.querySelector("[data-stats]");
    if (!overview || !stats || overview.querySelector("[data-enhanced-analytics]")) return;
    const grid = document.createElement("div");
    grid.className = "admin-analytics-grid";
    grid.dataset.enhancedAnalytics = "true";
    grid.innerHTML = `
      <section class="admin-panel admin-analytics-card" data-tone="cool" data-analytics-card="mix"></section>
      <section class="admin-panel admin-analytics-card" data-tone="warm" data-analytics-card="conversion"></section>
      <section class="admin-panel admin-analytics-card" data-analytics-card="visibility"></section>
    `;
    stats.after(grid);
  }

  function buildCalendarPanel() {
    const main = document.querySelector(".admin-main");
    if (!main || document.querySelector("[data-page-panel='calendar']")) return;
    const section = document.createElement("section");
    section.className = "admin-page";
    section.dataset.pagePanel = "calendar";
    section.innerHTML = `
      <div class="admin-page-head">
        <p class="admin-kicker">Planning</p>
        <h1>Calendar</h1>
        <p>See upcoming activities and coaching requests in one planning view.</p>
      </div>
      <div class="admin-calendar-layout">
        <section class="admin-panel">
          <div class="admin-panel-head"><h2>Next 14 days</h2><span class="admin-chip" data-calendar-count>0 items</span></div>
          <div class="admin-calendar-board" data-calendar-board></div>
        </section>
        <section class="admin-panel">
          <div class="admin-panel-head"><h2>Agenda</h2><span class="admin-chip">live data</span></div>
          <div class="admin-agenda" data-calendar-agenda></div>
        </section>
      </div>
    `;
    main.append(section);
  }

  function buildRolesPanel() {
    const main = document.querySelector(".admin-main");
    if (!main || document.querySelector("[data-page-panel='roles']")) return;
    const section = document.createElement("section");
    section.className = "admin-page";
    section.dataset.pagePanel = "roles";
    section.innerHTML = `
      <div class="admin-page-head">
        <p class="admin-kicker">Security</p>
        <h1>Roles</h1>
        <p>Create role templates, review permission limits, and prepare admin assignments.</p>
      </div>
      <div class="admin-role-layout">
        <section class="admin-panel">
          <div class="admin-panel-head"><h2>Role templates</h2><span class="admin-chip" data-role-count>0 roles</span></div>
          <div class="admin-role-cards" data-role-cards></div>
        </section>
        <form class="admin-panel admin-form admin-role-form" data-role-form>
          <h2>Add admin assignment</h2>
          <label>Admin name<input name="name" required placeholder="Coach or team member"></label>
          <label>Email or phone<input name="contact" required placeholder="admin@example.com"></label>
          <label>Role<select name="role" data-role-select></select></label>
          <label>Access note<textarea name="note" rows="3" placeholder="What this admin should handle"></textarea></label>
          <div class="admin-action-row"><button class="admin-button admin-button-primary" type="submit">Save assignment</button></div>
          <p class="admin-status" data-role-status></p>
          <div class="admin-admin-list" data-admin-assignments></div>
        </form>
      </div>
      <section class="admin-panel" style="margin-top:18px">
        <div class="admin-panel-head"><h2>Permission matrix</h2><span class="admin-chip">limits</span></div>
        <div class="admin-role-matrix" data-role-matrix></div>
      </section>
    `;
    main.append(section);
    section.querySelector("[data-role-form]")?.addEventListener("submit", handleRoleAssignment);
  }

  function renderOverviewAnalytics() {
    const totalRequests = number(state.summary.registrations) + number(state.summary.bookings);
    const registrations = number(state.summary.registrations);
    const bookings = number(state.summary.bookings);
    const activityCount = number(state.summary.activities);
    const productCount = number(state.summary.products);
    const activeActivities = state.activities.filter((item) => item.isActive !== 0).length;
    const activeProducts = state.products.filter((item) => item.isActive !== 0).length;
    const activityVisibility = percent(activeActivities, Math.max(state.activities.length, 1));
    const productVisibility = percent(activeProducts, Math.max(state.products.length, 1));
    const bookingShare = percent(bookings, Math.max(totalRequests, 1));

    setHtml("[data-analytics-card='mix']", `
      <div class="admin-analytics-top">
        <div><h2>Operations mix</h2><p class="admin-analytics-note">The workload split across the live Kinetix admin data.</p></div>
        <span class="admin-chip" data-good="true">${totalRequests} requests</span>
      </div>
      <div class="admin-bars">
        ${bar("Registrations", registrations, totalRequests)}
        ${bar("Bookings", bookings, totalRequests)}
        ${bar("Activities", activityCount, Math.max(activityCount + productCount, 1))}
        ${bar("Products", productCount, Math.max(activityCount + productCount, 1))}
      </div>
    `);

    setHtml("[data-analytics-card='conversion']", `
      <div class="admin-analytics-top">
        <div><h2>Request balance</h2><p class="admin-analytics-note">Bookings as a share of all incoming action requests.</p></div>
      </div>
      <div class="admin-ring-wrap">
        <div class="admin-ring" style="--value:${bookingShare}" data-label="${bookingShare}%"></div>
        <ul class="admin-mini-list">
          <li><span>Coaching bookings</span><strong>${bookings}</strong></li>
          <li><span>Activity registrations</span><strong>${registrations}</strong></li>
          <li><span>Total requests</span><strong>${totalRequests}</strong></li>
        </ul>
      </div>
    `);

    setHtml("[data-analytics-card='visibility']", `
      <div class="admin-analytics-top">
        <div><h2>Public visibility</h2><p class="admin-analytics-note">How much of the catalog is currently visible on the public website.</p></div>
        <span class="admin-chip">content health</span>
      </div>
      <div class="admin-bars">
        ${bar("Activities", activeActivities, Math.max(state.activities.length, 1), `${activityVisibility}%`)}
        ${bar("Products", activeProducts, Math.max(state.products.length, 1), `${productVisibility}%`)}
      </div>
      <ul class="admin-mini-list">
        <li><span>Hidden activities</span><strong>${Math.max(state.activities.length - activeActivities, 0)}</strong></li>
        <li><span>Hidden products</span><strong>${Math.max(state.products.length - activeProducts, 0)}</strong></li>
      </ul>
    `);
  }

  function renderCalendar() {
    const events = collectCalendarEvents();
    const board = document.querySelector("[data-calendar-board]");
    const agenda = document.querySelector("[data-calendar-agenda]");
    const count = document.querySelector("[data-calendar-count]");
    if (count) count.textContent = `${events.length} items`;
    if (!board || !agenda) return;
    const days = nextDays(14);
    board.innerHTML = days.map((day) => {
      const dayEvents = events.filter((item) => item.dateKey === day.key).slice(0, 3);
      return `<article class="admin-calendar-day ${day.isToday ? "is-today" : ""}">
        <div class="admin-calendar-date">${day.label}</div>
        ${dayEvents.length ? dayEvents.map((item) => `<div class="admin-calendar-event" data-type="${item.type}">${escapeHtml(item.title)}<br><span>${escapeHtml(item.meta)}</span></div>`).join("") : `<div class="admin-muted">No items</div>`}
      </article>`;
    }).join("");
    const upcoming = events.slice(0, 10);
    agenda.innerHTML = upcoming.length ? upcoming.map((item) => `
      <article class="admin-agenda-item">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${formatDate(item.dateKey)} · ${escapeHtml(item.meta)}</span>
        <span>${escapeHtml(item.detail)}</span>
      </article>
    `).join("") : `<div class="admin-empty-strong">No dated activities or booking requests yet.</div>`;
  }

  function collectCalendarEvents() {
    const activities = state.activities.map((item) => ({
      type: "activity",
      dateKey: normalizeDate(item.date),
      title: item.title || "Activity",
      meta: [item.time, item.location].filter(Boolean).join(" · ") || "Activity",
      detail: item.ageGroup || "All athletes",
    }));
    const bookings = (state.bookings.rows || []).map((item) => ({
      type: "booking",
      dateKey: normalizeDate(item.preferredDate),
      title: item.sessionType || "Coaching booking",
      meta: item.name || "Client",
      detail: item.phone || "No phone provided",
    }));
    return [...activities, ...bookings]
      .filter((item) => item.dateKey)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }

  function renderRoles() {
    const permissions = Array.isArray(state.me?.permissions) ? state.me.permissions : [];
    const templates = buildRoleTemplates(permissions);
    const drafts = readJson(ROLE_STORAGE_KEY, []);
    const roles = [...templates, ...drafts];
    const cards = document.querySelector("[data-role-cards]");
    const matrix = document.querySelector("[data-role-matrix]");
    const select = document.querySelector("[data-role-select]");
    const count = document.querySelector("[data-role-count]");
    if (count) count.textContent = `${roles.length} roles`;
    if (select) select.innerHTML = roles.map((role) => `<option value="${escapeHtml(role.key)}">${escapeHtml(role.name)}</option>`).join("");
    if (cards) cards.innerHTML = roles.map((role) => `
      <article class="admin-role-card">
        <div class="admin-analytics-top"><h3>${escapeHtml(role.name)}</h3><span class="admin-chip">${role.permissions.length} permissions</span></div>
        <p class="admin-muted">${escapeHtml(role.description)}</p>
        <div class="admin-permission-pills">${role.permissions.slice(0, 6).map((permission) => `<span class="admin-permission-pill is-on">${escapeHtml(shortPermission(permission))}</span>`).join("")}${role.permissions.length > 6 ? `<span class="admin-permission-pill">+${role.permissions.length - 6}</span>` : ""}</div>
      </article>
    `).join("");
    if (matrix) matrix.innerHTML = groupPermissions(permissions).map((group) => `
      <div class="admin-role-row">
        <strong>${escapeHtml(group.name)}</strong>
        <div class="admin-permission-pills">${group.items.map((permission) => `<span class="admin-permission-pill is-on">${escapeHtml(shortPermission(permission))}</span>`).join("")}</div>
      </div>
    `).join("") || `<div class="admin-empty-strong">No permission catalog is available from the backend yet.</div>`;
    renderAssignments(roles);
  }

  function buildRoleTemplates(permissions) {
    const pick = (name, test) => permissions.filter(test);
    return [
      { key: "owner", name: "Owner", description: "Full access across content, data, exports, backups, and security.", permissions },
      { key: "operations", name: "Operations", description: "Activities, registrations, coaching bookings, and exports.", permissions: pick("Operations", (p) => /^(activity|registration|booking)\./.test(p)) },
      { key: "merch", name: "Merch Manager", description: "Product catalog, product images, and merch export access.", permissions: pick("Merch", (p) => /^product\./.test(p) || p === "site.upload_media") },
      { key: "auditor", name: "Auditor", description: "Audit visibility, backup snapshots, and settings review.", permissions: pick("Auditor", (p) => /^(audit|admin|settings)\./.test(p)) },
    ].filter((role) => role.permissions.length);
  }

  function handleRoleAssignment(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const assignments = readJson(ASSIGNMENT_STORAGE_KEY, []);
    assignments.unshift({ ...data, id: crypto.randomUUID?.() || String(Date.now()), createdAt: new Date().toISOString() });
    sessionStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignments.slice(0, 12)));
    const status = form.querySelector("[data-role-status]");
    if (status) status.textContent = "Assignment saved in this admin session. Connect invite delivery when you are ready for multi-admin login.";
    form.reset();
    renderAssignments(buildRoleTemplates(state.me?.permissions || []));
  }

  function renderAssignments(roles) {
    const list = document.querySelector("[data-admin-assignments]");
    if (!list) return;
    const assignments = readJson(ASSIGNMENT_STORAGE_KEY, []);
    const owner = state.me?.user ? [{ name: state.me.user.displayName || "Owner", contact: "Current admin", role: state.me.user.role || "owner", createdAt: "Active" }] : [];
    const all = [...owner, ...assignments];
    list.innerHTML = all.length ? all.map((item) => {
      const role = roles.find((entry) => entry.key === item.role)?.name || item.role || "Owner";
      return `<div class="admin-admin-item"><div><strong>${escapeHtml(item.name)}</strong><br><span>${escapeHtml(item.contact)}</span></div><span>${escapeHtml(role)}</span></div>`;
    }).join("") : `<div class="admin-empty-strong">No admin assignments yet.</div>`;
  }

  function groupPermissions(permissions) {
    const groups = new Map();
    permissions.forEach((permission) => {
      const [prefix] = permission.split(".");
      if (!groups.has(prefix)) groups.set(prefix, []);
      groups.get(prefix).push(permission);
    });
    return [...groups.entries()].map(([name, items]) => ({ name, items }));
  }

  function nextDays(count) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      const key = toDateKey(date);
      return { key, isToday: index === 0, label: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) };
    });
  }

  function normalizeDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return toDateKey(date);
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatDate(value) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  function bar(label, value, max, customLabel) {
    const pct = percent(value, Math.max(max, 1));
    return `<div class="admin-bar-row"><span>${escapeHtml(label)}</span><div class="admin-meter"><div class="admin-meter-fill" style="--value:${pct}%"></div></div><strong>${escapeHtml(customLabel || String(value))}</strong></div>`;
  }

  function percent(value, max) {
    return Math.max(0, Math.min(100, Math.round((number(value) / Math.max(number(max), 1)) * 100)));
  }

  function number(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function shortPermission(permission) {
    return permission.replace(/_/g, " ").replace(/\./g, " ");
  }

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) || "");
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function setHtml(selector, html) {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = html;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }
})();
