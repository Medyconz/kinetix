(() => {
  const FALLBACK_RESOURCES = [
    { key: "overview", href: "overview", label: "Overview", navGroup: "home", kind: "dashboard", searchKeywords: ["dashboard", "status", "warnings"] },
    { key: "activities", href: "activities", label: "Activities", navGroup: "operations", kind: "collection", searchKeywords: ["events", "sessions"] },
    { key: "registrations", href: "registrations", label: "Registrations", navGroup: "operations", kind: "collection", searchKeywords: ["participants"] },
    { key: "products", href: "products", label: "Products", navGroup: "catalog", kind: "collection", searchKeywords: ["merch", "images"] },
    { key: "bookings", href: "bookings", label: "Bookings", navGroup: "operations", kind: "collection", searchKeywords: ["coaching"] },
    { key: "audit", href: "audit", label: "Audit log", navGroup: "security", kind: "report", searchKeywords: ["history"] },
    { key: "backup", href: "backup", label: "Backup", navGroup: "security", kind: "workflow", searchKeywords: ["snapshot"] },
    { key: "settings", href: "settings", label: "Settings", navGroup: "settings", kind: "settings", searchKeywords: ["configuration"] },
  ];
  const state = {
    me: null,
    resources: FALLBACK_RESOURCES,
    view: new URLSearchParams(location.search).get("view") || "overview",
    data: { activities: [], products: [], registrations: { rows: [], total: 0 }, bookings: { rows: [], total: 0 }, audit: { rows: [], total: 0 } },
    filters: { activities: "", products: "", registrations: "", bookings: "", audit: "" },
    status: { activities: "all", products: "all" },
    page: { registrations: 1, bookings: 1, audit: 1 },
    perPage: { registrations: 25, bookings: 25, audit: 25 },
    summary: { activities: 0, products: 0, registrations: 0, bookings: 0 },
    backup: { tables: [] },
  };

  const auth = document.querySelector("[data-admin-auth]");
  const app = document.querySelector("[data-admin-app]");
  const loginForm = document.querySelector("[data-login-form]");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.querySelector("[data-login-status]");
    try {
      status.textContent = "Signing in...";
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: new FormData(loginForm).get("password") }) });
      status.textContent = "";
      await boot();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  document.querySelector("[data-logout]")?.addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => {});
    app.classList.add("is-hidden");
    auth.classList.remove("is-hidden");
  });

  document.querySelector("[data-mobile-open]")?.addEventListener("click", () => document.body.classList.add("admin-nav-open"));
  document.querySelector("[data-mobile-close]")?.addEventListener("click", () => document.body.classList.remove("admin-nav-open"));
  document.querySelector("[data-mobile-overlay]")?.addEventListener("click", () => document.body.classList.remove("admin-nav-open"));

  bindForms();
  bindTools();
  bindCommandPalette();
  boot().catch(() => { auth.classList.remove("is-hidden"); app.classList.add("is-hidden"); });

  async function boot() {
    state.me = await api("/api/admin/me");
    state.resources = state.me.resources?.length ? state.me.resources : FALLBACK_RESOURCES;
    auth.classList.add("is-hidden");
    app.classList.remove("is-hidden");
    renderNav();
    showView(state.view);
    renderShellData();
    try {
      await loadAll();
    } catch (error) {
      renderBackendUnavailable(error);
    }
    renderCommandResults("");
  }

  async function loadAll() {
    const [summary, activities, products, registrations, bookings, audit, backup] = await Promise.all([
      api("/api/admin/summary"),
      api("/api/admin/activities"),
      api("/api/admin/products"),
      loadCollection("registrations"),
      loadCollection("bookings"),
      loadCollection("audit"),
      api("/api/admin/backup/manifest").catch(() => ({ tables: [] })),
    ]);
    state.summary = summary;
    state.data.activities = activities;
    state.data.products = products;
    state.data.registrations = registrations;
    state.data.bookings = bookings;
    state.data.audit = audit;
    state.backup = backup;
    renderShellData();
  }

  function renderShellData() {
    renderOverview();
    renderActivities();
    renderProducts();
    renderCollection("registrations", ["name", "phone", "activityChoice", "participants", "notes", "createdAt"]);
    renderCollection("bookings", ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"]);
    renderCollection("audit", ["action", "entityType", "entityId", "actor", "reason", "createdAt"]);
    renderSettings();
    renderBackup();
  }

  function renderBackendUnavailable(error) {
    const message = error?.message || "Backend data is unavailable.";
    state.me = state.me || {};
    state.me.warnings = [
      ...(state.me.warnings || []),
      { title: "Backend data unavailable", body: `${message} The admin menu is still available, but live tables need D1/R2 bindings and migrations.` },
    ];
    renderShellData();
  }

  async function loadCollection(name) {
    const params = new URLSearchParams({ q: state.filters[name] || "", page: String(state.page[name] || 1), perPage: String(state.perPage[name] || 25) });
    return api(`/api/admin/${name === "audit" ? "audit-logs" : name}?${params}`);
  }

  async function api(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(path, { ...options, headers: isFormData ? { ...(options.headers || {}) } : { "content-type": "application/json", ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  function renderNav() {
    const nav = document.querySelector("[data-resource-nav]");
    const groups = groupBy(state.resources, "navGroup");
    nav.innerHTML = Object.entries(groups).map(([group, resources]) => `<div class="admin-nav-group"><span class="admin-nav-title">${escapeHtml(group)}</span>${resources.map((resource) => `<button type="button" data-nav-view="${escapeAttr(resource.key)}"><span>${escapeHtml(resource.label)}</span><small>${escapeHtml(resource.kind)}</small></button>`).join("")}</div>`).join("");
    nav.querySelectorAll("[data-nav-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.navView)));
  }

  function showView(view) {
    const exists = document.querySelector(`[data-page-panel="${view}"]`);
    state.view = exists ? view : "overview";
    document.querySelectorAll("[data-page-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.pagePanel === state.view));
    document.querySelectorAll("[data-nav-view]").forEach((button) => button.classList.toggle("is-active", button.dataset.navView === state.view));
    const resource = state.resources.find((item) => item.key === state.view);
    setText("[data-breadcrumbs]", `Admin / ${resource?.label || "Overview"}`);
    const url = new URL(location.href);
    url.searchParams.set("view", state.view);
    history.replaceState(null, "", url);
    document.body.classList.remove("admin-nav-open");
  }

  function renderOverview() {
    const stats = [["activities", state.summary.activities], ["products", state.summary.products], ["registrations", state.summary.registrations], ["bookings", state.summary.bookings]];
    document.querySelector("[data-stats]").innerHTML = stats.map(([label, count]) => `<div class="admin-stat"><span>${escapeHtml(count || 0)}</span><p>${escapeHtml(label)}</p></div>`).join("");
    const attention = [];
    if (Number(state.summary.registrations || 0) > 0) attention.push(["Registrations waiting", `${state.summary.registrations} activity registrations are in the database.`, "registrations"]);
    if (Number(state.summary.bookings || 0) > 0) attention.push(["Booking requests", `${state.summary.bookings} coaching requests need follow-up.`, "bookings"]);
    if (!state.data.products.some((item) => item.imageKey)) attention.push(["Product images", "Add product images so the merch page feels real.", "products"]);
    document.querySelector("[data-attention]").innerHTML = (attention.length ? attention : [["Nothing urgent", "No operational items need attention right now.", "overview"]]).map(([title, body, view]) => `<button class="admin-callout" type="button" data-jump="${view}"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></button>`).join("");
    document.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.jump)));
    const warnings = state.me?.warnings || [];
    document.querySelector("[data-warnings]").innerHTML = warnings.length ? warnings.map((warning) => `<div class="admin-callout"><strong>${escapeHtml(warning.title)}</strong><p>${escapeHtml(warning.body)}</p></div>`).join("") : `<div class="admin-callout"><strong>System ready</strong><p>No configuration warnings reported.</p></div>`;
  }

  function renderActivities() {
    const q = state.filters.activities.toLowerCase();
    const rows = state.data.activities.filter((item) => matchesStatus(item, state.status.activities) && [item.title, item.location, item.ageGroup].join(" ").toLowerCase().includes(q));
    document.querySelector('[data-list="activities"]').innerHTML = listCards(rows, "activity");
    bindRowActions("activity", state.data.activities, fillActivityForm, deleteActivity);
  }

  function renderProducts() {
    const q = state.filters.products.toLowerCase();
    const rows = state.data.products.filter((item) => matchesStatus(item, state.status.products) && [item.name, item.priceLabel].join(" ").toLowerCase().includes(q));
    document.querySelector('[data-list="products"]').innerHTML = listCards(rows, "product");
    bindRowActions("product", state.data.products, fillProductForm, deleteProduct);
  }

  function listCards(rows, kind) {
    if (!rows.length) return `<div class="admin-callout"><strong>No ${kind}s found</strong><p>Adjust filters or create a new ${kind}.</p></div>`;
    return `<div class="admin-list">${rows.map((item) => `<article class="admin-row"><div><h3>${escapeHtml(item.title || item.name)}</h3><p>${escapeHtml(item.location || item.priceLabel || "Contact for pricing")}</p><span class="admin-status-badge ${item.isActive ? "" : "is-hidden-status"}">${item.isActive ? "Visible" : "Hidden"}</span></div><div class="admin-actions"><button class="admin-button" type="button" data-edit-${kind}="${escapeAttr(item.id)}">Edit</button><button class="admin-button admin-button-danger" type="button" data-delete-${kind}="${escapeAttr(item.id)}">Delete</button></div></article>`).join("")}</div>`;
  }

  function bindRowActions(kind, rows, fill, remove) {
    document.querySelectorAll(`[data-edit-${kind}]`).forEach((button) => button.addEventListener("click", () => fill(rows.find((item) => item.id === button.dataset[`edit${capitalize(kind)}`]))));
    document.querySelectorAll(`[data-delete-${kind}]`).forEach((button) => button.addEventListener("click", () => remove(button.dataset[`delete${capitalize(kind)}`])));
  }

  function renderCollection(name, keys) {
    const collection = state.data[name];
    const rows = collection.rows || [];
    const table = document.querySelector(`[data-table="${name}"]`);
    table.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${keys.map((key) => `<th>${escapeHtml(labelFor(key))}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${keys.map((key) => `<td>${escapeHtml(formatCell(row[key]))}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${keys.length}">No records found.</td></tr>`}</tbody></table></div><div class="admin-mobile-list">${rows.map((row) => `<article class="admin-mobile-card"><dl>${keys.map((key) => `<div><dt>${escapeHtml(labelFor(key))}</dt><dd>${escapeHtml(formatCell(row[key]))}</dd></div>`).join("")}</dl></article>`).join("") || `<div class="admin-callout"><strong>No records found</strong><p>Try another search.</p></div>`}</div>`;
    renderPagination(name);
  }

  function renderPagination(name) {
    const collection = state.data[name];
    const page = state.page[name] || 1;
    const perPage = state.perPage[name] || 25;
    const totalPages = Math.max(1, Math.ceil((collection.total || 0) / perPage));
    document.querySelector(`[data-pagination="${name}"]`).innerHTML = `<button class="admin-button" type="button" data-page-prev="${name}" ${page <= 1 ? "disabled" : ""}>Previous</button><span class="admin-muted">Page ${page} of ${totalPages}</span><button class="admin-button" type="button" data-page-next="${name}" ${page >= totalPages ? "disabled" : ""}>Next</button>`;
    document.querySelector(`[data-page-prev="${name}"]`)?.addEventListener("click", () => setPage(name, page - 1));
    document.querySelector(`[data-page-next="${name}"]`)?.addEventListener("click", () => setPage(name, page + 1));
  }

  async function setPage(name, page) {
    state.page[name] = Math.max(1, page);
    try { state.data[name] = await loadCollection(name); } catch (error) { renderBackendUnavailable(error); }
    renderCollection(name, collectionKeys(name));
  }

  function bindForms() {
    const activity = document.querySelector("[data-activity-form]");
    activity?.addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(activity).entries()); data.isActive = activity.elements.isActive.checked; await saveEntity("activities", data, "[data-activity-status]"); activity.reset(); activity.elements.isActive.checked = true; });
    const product = document.querySelector("[data-product-form]");
    product?.addEventListener("submit", async (event) => { event.preventDefault(); const image = product.elements.image.files[0]; if (image) { const upload = new FormData(); upload.append("image", image); const result = await api("/api/admin/products/image", { method: "POST", body: upload }); product.elements.imageKey.value = result.imageKey; } const data = Object.fromEntries(new FormData(product).entries()); data.options = String(data.options || "").split("\n").map((line) => line.trim()).filter(Boolean); data.isActive = product.elements.isActive.checked; delete data.image; await saveEntity("products", data, "[data-product-status]"); product.reset(); product.elements.isActive.checked = true; clearProductPreview(); });
    product?.elements.image?.addEventListener("change", () => { const preview = document.querySelector("[data-product-preview]"); const image = product.elements.image.files[0]; if (!image) return clearProductPreview(); preview.src = URL.createObjectURL(image); preview.classList.remove("is-hidden"); setText("[data-image-status]", "Ready to upload."); });
    document.querySelectorAll("[data-reset-form]").forEach((button) => button.addEventListener("click", () => { button.closest("form").reset(); clearProductPreview(); }));
  }

  async function saveEntity(entity, data, statusSelector) {
    try {
      setText(statusSelector, "Saving...");
      await api(`/api/admin/${entity}`, { method: "POST", body: JSON.stringify(data) });
      setText(statusSelector, "Saved.");
      if (entity === "activities") { state.data.activities = await api("/api/admin/activities"); renderActivities(); }
      if (entity === "products") { state.data.products = await api("/api/admin/products"); renderProducts(); }
      state.summary = await api("/api/admin/summary"); renderOverview();
    } catch (error) { setText(statusSelector, error.message); }
  }

  function fillActivityForm(item) { const form = document.querySelector("[data-activity-form]"); if (!form || !item) return; ["id", "title", "date", "time", "location", "ageGroup", "description"].forEach((key) => { form.elements[key].value = item[key] || ""; }); form.elements.isActive.checked = Boolean(item.isActive); form.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function fillProductForm(item) { const form = document.querySelector("[data-product-form]"); if (!form || !item) return; ["id", "name", "description", "priceLabel", "optionLabel", "imageKey", "sortOrder"].forEach((key) => { form.elements[key].value = item[key] || ""; }); form.elements.options.value = (item.options || []).join("\n"); form.elements.isActive.checked = Boolean(item.isActive); setText("[data-image-status]", item.imageKey ? `Current image: ${item.imageKey}` : "No image uploaded."); form.scrollIntoView({ behavior: "smooth", block: "start" }); }
  async function deleteActivity(id) { if (!confirm("Delete this activity?")) return; try { await api(`/api/admin/activities/${id}`, { method: "DELETE" }); state.data.activities = await api("/api/admin/activities"); renderActivities(); } catch (error) { alert(error.message); } }
  async function deleteProduct(id) { if (!confirm("Delete this product?")) return; try { await api(`/api/admin/products/${id}`, { method: "DELETE" }); state.data.products = await api("/api/admin/products"); renderProducts(); } catch (error) { alert(error.message); } }

  function bindTools() {
    document.querySelectorAll("[data-filter]").forEach((input) => input.addEventListener("input", debounce(async () => { const name = input.dataset.filter; state.filters[name] = input.value; state.page[name] = 1; if (name === "activities") return renderActivities(); if (name === "products") return renderProducts(); try { state.data[name] = await loadCollection(name); } catch (error) { renderBackendUnavailable(error); } renderCollection(name, collectionKeys(name)); }, 180)));
    document.querySelectorAll("[data-filter-status]").forEach((select) => select.addEventListener("change", () => { state.status[select.dataset.filterStatus] = select.value; select.dataset.filterStatus === "activities" ? renderActivities() : renderProducts(); }));
    document.querySelectorAll("[data-per-page]").forEach((select) => select.addEventListener("change", async () => { const name = select.dataset.perPage; state.perPage[name] = Number(select.value); state.page[name] = 1; try { state.data[name] = await loadCollection(name); } catch (error) { renderBackendUnavailable(error); } renderCollection(name, collectionKeys(name)); }));
    document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", () => exportCsv(button.dataset.export)));
    document.querySelector("[data-backup-export]")?.addEventListener("click", () => location.href = "/api/admin/backup/export");
  }

  function exportCsv(name) { const q = encodeURIComponent(state.filters[name] || ""); const path = name === "audit" ? "audit-logs" : name; location.href = `/api/admin/${path}/export?q=${q}`; }
  function renderSettings() { document.querySelector("[data-permissions]").innerHTML = (state.me?.permissions || []).map((key) => `<div class="admin-permission">${escapeHtml(key)}</div>`).join("") || `<div class="admin-callout"><strong>Permissions unavailable</strong><p>Sign in with active backend configuration to load permissions.</p></div>`; document.querySelector("[data-integrations]").innerHTML = (state.me?.integrations || []).map((item) => `<div class="admin-callout"><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.status)}</p></div>`).join("") || `<div class="admin-callout"><strong>Integration status unavailable</strong><p>Backend setup is still required.</p></div>`; }
  function renderBackup() { const tables = state.backup?.tables || []; document.querySelector("[data-backup-manifest]").innerHTML = tables.map((table) => `<div class="admin-callout"><strong>${escapeHtml(table.table)}</strong><p>${escapeHtml(table.domain)} / ${escapeHtml(table.note || "Included")}</p></div>`).join("") || `<div class="admin-callout"><strong>Manifest unavailable</strong><p>Enable D1 to generate a backup manifest.</p></div>`; }

  function bindCommandPalette() {
    const modal = document.querySelector("[data-command-modal]"); const input = document.querySelector("[data-command-input]");
    document.querySelector("[data-command-open]")?.addEventListener("click", openCommand); document.querySelectorAll("[data-command-close]").forEach((node) => node.addEventListener("click", closeCommand)); input?.addEventListener("input", () => renderCommandResults(input.value));
    document.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openCommand(); } if (event.key === "Escape" && !modal.classList.contains("is-hidden")) closeCommand(); });
    function openCommand() { modal.classList.remove("is-hidden"); setTimeout(() => input.focus(), 0); renderCommandResults(input.value || ""); }
    function closeCommand() { modal.classList.add("is-hidden"); document.querySelector("[data-command-open]")?.focus(); }
  }

  function renderCommandResults(term) {
    const search = String(term || "").toLowerCase();
    const results = state.resources.flatMap((resource) => [resource, ...(resource.actions || []).map((action) => ({ ...action, parent: resource.label }))]).filter((item) => [item.label, item.parent, ...(item.searchKeywords || [])].join(" ").toLowerCase().includes(search)).slice(0, 10);
    document.querySelector("[data-command-results]").innerHTML = results.map((item) => `<button type="button" data-command-view="${escapeAttr(item.href || item.key)}"><span>${escapeHtml(item.label)}</span><small>${escapeHtml(item.parent || item.kind || "Page")}</small></button>`).join("") || `<div class="admin-callout"><strong>No results</strong><p>Try activities, products, export, backup, or audit.</p></div>`;
    document.querySelectorAll("[data-command-view]").forEach((button) => button.addEventListener("click", () => { showView(button.dataset.commandView.replace("#", "")); document.querySelector("[data-command-modal]").classList.add("is-hidden"); }));
  }

  function collectionKeys(name) { return name === "audit" ? ["action", "entityType", "entityId", "actor", "reason", "createdAt"] : name === "bookings" ? ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"] : ["name", "phone", "activityChoice", "participants", "notes", "createdAt"]; }
  function matchesStatus(item, status) { return status === "all" || (status === "active" && item.isActive) || (status === "hidden" && !item.isActive); }
  function clearProductPreview() { const preview = document.querySelector("[data-product-preview]"); preview?.classList.add("is-hidden"); preview?.removeAttribute("src"); setText("[data-image-status]", "No image uploaded."); }
  function groupBy(rows, key) { return rows.reduce((acc, row) => { (acc[row[key]] ||= []).push(row); return acc; }, {}); }
  function formatCell(value) { return value == null || value === "" ? "-" : String(value); }
  function labelFor(key) { return ({ activityChoice: "Activity", sessionType: "Session", preferredDate: "Preferred date", createdAt: "Created", entityType: "Entity", entityId: "Entity ID" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
  function setText(selector, text) { const node = document.querySelector(selector); if (node) node.textContent = text; }
  function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
  function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }
  function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
})();
