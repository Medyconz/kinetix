(() => {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  const toggle = document.querySelector(".nav-toggle");
  toggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll(".js-pick-session").forEach((button) => button.addEventListener("click", () => pick("#session-type", button.dataset.session)));
  document.querySelectorAll(".js-pick-activity").forEach((button) => button.addEventListener("click", () => pick("#activity-choice", button.dataset.activity)));

  document.querySelectorAll(".js-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      const endpoint = form.querySelector("#activity-choice") ? "/api/registrations" : form.querySelector("#session-type") ? "/api/bookings" : "";
      if (!endpoint) return;
      try {
        const result = await api(endpoint, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        status.textContent = result.message || "Request received.";
        form.reset();
      } catch (error) {
        status.textContent = error.message;
      }
    });
  });

  const cart = new Map();
  const cartItems = document.querySelector(".cart-items");
  const cartCount = document.querySelector("#cart-count");
  const cartStatus = document.querySelector(".cart-status");
  bindCartButtons();
  document.querySelector(".js-clear-cart")?.addEventListener("click", () => { cart.clear(); cartStatus.textContent = "Cart cleared."; renderCart(); });

  if (page === "activities") hydrateActivities();
  if (page === "merch") hydrateProducts();
  if (page === "admin") initAdmin();

  function pick(selector, value) { const input = document.querySelector(selector); if (input) { input.value = value; input.focus(); } }

  async function api(path, options = {}) {
    const headers = options.body instanceof FormData ? options.headers || {} : { "content-type": "application/json", ...(options.headers || {}) };
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function hydrateActivities() {
    const list = document.querySelector(".activity-list");
    const select = document.querySelector("#activity-choice");
    if (!list || !select) return;
    try {
      const activities = await api("/api/activities");
      if (!activities.length) return;
      list.innerHTML = activities.map((a) => `<article class="activity-card"><div><p class="card-meta">${escapeHtml(formatDate(a.date))}</p><h2>${escapeHtml(a.title)}</h2></div><dl><div><dt>Time</dt><dd>${escapeHtml(a.time)}</dd></div><div><dt>Location</dt><dd>${escapeHtml(a.location)}</dd></div><div><dt>Age group</dt><dd>${escapeHtml(a.ageGroup)}</dd></div></dl><button class="button button-small button-primary js-pick-activity" type="button" data-activity="${escapeAttr(a.title)}">Register</button></article>`).join("");
      select.innerHTML = `<option value="">Select an activity</option>${activities.map((a) => `<option>${escapeHtml(a.title)}</option>`).join("")}`;
      document.querySelectorAll(".js-pick-activity").forEach((button) => button.addEventListener("click", () => pick("#activity-choice", button.dataset.activity)));
    } catch {}
  }

  async function hydrateProducts() {
    const grid = document.querySelector(".product-grid");
    if (!grid) return;
    try {
      const products = await api("/api/products");
      if (!products.length) return;
      grid.innerHTML = products.map((p) => {
        const image = p.imageUrl ? `<img src="${escapeAttr(p.imageUrl)}" alt="${escapeAttr(p.name)}">` : `<span>${escapeHtml((p.name || "Item").split(" ").pop())}</span>`;
        const options = (Array.isArray(p.options) && p.options.length ? p.options : ["Standard"]).map((o) => `<option>${escapeHtml(o)}</option>`).join("");
        return `<article class="product-card"><div class="product-image">${image}</div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.priceLabel || "Price: TBA")}</p><label>${escapeHtml(p.optionLabel || "Size / color")}</label><select>${options}</select><button class="button button-primary js-add-cart" type="button" data-product="${escapeAttr(p.name)}">Add to Cart</button></article>`;
      }).join("");
      bindCartButtons();
    } catch {}
  }

  function bindCartButtons() {
    document.querySelectorAll(".js-add-cart").forEach((button) => button.addEventListener("click", () => {
      const product = button.dataset.product;
      cart.set(product, (cart.get(product) || 0) + 1);
      if (cartStatus) cartStatus.textContent = `${product} added.`;
      renderCart();
    }));
  }

  function renderCart() {
    if (!cartItems || !cartCount) return;
    cartItems.innerHTML = "";
    let count = 0;
    cart.forEach((qty, product) => {
      count += qty;
      const line = document.createElement("div");
      line.className = "cart-line";
      line.innerHTML = `<span>${escapeHtml(product)} x ${qty}</span><button type="button">Remove</button>`;
      line.querySelector("button").addEventListener("click", () => { qty <= 1 ? cart.delete(product) : cart.set(product, qty - 1); renderCart(); });
      cartItems.append(line);
    });
    cartCount.textContent = String(count);
  }

  function initAdmin() {
    const login = document.querySelector(".js-admin-login");
    const dashboard = document.querySelector(".admin-dashboard");
    const state = { activities: [], products: [] };
    login?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = login.querySelector(".form-status");
      try {
        await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: new FormData(login).get("password") }) });
        login.classList.add("is-hidden");
        dashboard.classList.remove("is-hidden");
        await loadAdmin(state);
      } catch (error) { status.textContent = error.message; }
    });
    document.querySelector(".js-admin-logout")?.addEventListener("click", async () => { await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => {}); dashboard.classList.add("is-hidden"); login.classList.remove("is-hidden"); });
    document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      document.querySelectorAll("[data-admin-pane]").forEach((pane) => pane.classList.toggle("is-active", pane.dataset.adminPane === button.dataset.adminTab));
    }));
    bindAdminForms(state);
    loadAdmin(state).then(() => { login.classList.add("is-hidden"); dashboard.classList.remove("is-hidden"); }).catch(() => {});
  }

  async function loadAdmin(state) {
    const [summary, activities, products, registrations, bookings] = await Promise.all([api("/api/admin/summary"), api("/api/admin/activities"), api("/api/admin/products"), api("/api/admin/registrations"), api("/api/admin/bookings")]);
    state.activities = activities; state.products = products;
    Object.entries(summary).forEach(([k, v]) => { const node = document.querySelector(`[data-stat="${k}"]`); if (node) node.textContent = v; });
    renderAdminList("activities", activities, fillActivityForm, async (id) => { await api(`/api/admin/activities/${id}`, { method: "DELETE" }); await loadAdmin(state); });
    renderAdminList("products", products, fillProductForm, async (id) => { await api(`/api/admin/products/${id}`, { method: "DELETE" }); await loadAdmin(state); });
    renderRows("registrations", registrations, ["name", "phone", "activityChoice", "participants", "notes", "createdAt"]);
    renderRows("bookings", bookings, ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"]);
  }

  function bindAdminForms(state) {
    const activity = document.querySelector(".js-activity-admin-form");
    activity?.addEventListener("submit", async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(activity)); data.isActive = activity.elements.isActive.checked; await api("/api/admin/activities", { method: "POST", body: JSON.stringify(data) }); activity.reset(); activity.elements.isActive.checked = true; await loadAdmin(state); });
    const product = document.querySelector(".js-product-admin-form");
    product?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const image = product.elements.image.files[0];
      if (image) { const upload = new FormData(); upload.append("image", image); const result = await api("/api/admin/products/image", { method: "POST", body: upload, headers: {} }); product.elements.imageKey.value = result.imageKey; }
      const data = Object.fromEntries(new FormData(product));
      data.options = String(data.options || "").split("\n").map((x) => x.trim()).filter(Boolean);
      data.isActive = product.elements.isActive.checked;
      delete data.image;
      await api("/api/admin/products", { method: "POST", body: JSON.stringify(data) });
      product.reset(); product.elements.isActive.checked = true; await loadAdmin(state);
    });
    document.querySelectorAll(".js-reset-form").forEach((button) => button.addEventListener("click", () => button.closest("form").reset()));
  }

  function renderAdminList(type, rows, fill, remove) {
    const list = document.querySelector(`[data-admin-list="${type}"]`);
    if (!list) return;
    list.innerHTML = rows.map((row) => `<article><div><h3>${escapeHtml(row.title || row.name)}</h3><p>${escapeHtml(row.date || row.priceLabel || "")}</p></div><div class="admin-actions"><button type="button" data-edit="${escapeAttr(row.id)}">Edit</button><button type="button" data-delete="${escapeAttr(row.id)}">Delete</button></div></article>`).join("") || "<p>No records yet.</p>";
    list.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => fill(rows.find((row) => row.id === button.dataset.edit))));
    list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => remove(button.dataset.delete)));
  }

  function fillActivityForm(item) { const f = document.querySelector(".js-activity-admin-form"); if (!f || !item) return; ["id", "title", "date", "time", "location", "ageGroup", "description"].forEach((k) => f.elements[k].value = item[k] || ""); f.elements.isActive.checked = Boolean(item.isActive); }
  function fillProductForm(item) { const f = document.querySelector(".js-product-admin-form"); if (!f || !item) return; ["id", "name", "description", "priceLabel", "optionLabel", "imageKey", "sortOrder"].forEach((k) => f.elements[k].value = item[k] || ""); f.elements.options.value = (item.options || []).join("\n"); f.elements.isActive.checked = Boolean(item.isActive); }
  function renderRows(name, rows, keys) { const body = document.querySelector(`[data-admin-table="${name}"]`); if (!body) return; body.innerHTML = rows.length ? rows.map((row) => `<tr>${keys.map((k) => `<td data-label="${labelFor(k)}">${escapeHtml(row[k] || "")}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${keys.length}">No records yet.</td></tr>`; }
  function labelFor(key) { return ({ activityChoice: "Activity", sessionType: "Session", preferredDate: "Preferred Date", createdAt: "Created" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase()); }
  function formatDate(value) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }); }
  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
})();
