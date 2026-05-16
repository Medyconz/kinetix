(() => {
  const page = document.body.dataset.page;
  const navToggle = document.querySelector(".nav-toggle");
  const cart = new Map();
  let adminTables = { registrations: [], bookings: [] };

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  navToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  bindPickers();
  bindPublicForms();
  bindCartButtons();
  document.querySelector(".js-clear-cart")?.addEventListener("click", () => {
    cart.clear();
    setText(".cart-status", "Cart cleared.");
    renderCart();
  });
  renderCart();

  if (page === "activities") hydrateActivities();
  if (page === "merch") hydrateProducts();
  if (page === "admin") initAdmin();

  function bindPickers() {
    document.querySelectorAll(".js-pick-session").forEach((button) => button.addEventListener("click", () => pick("#session-type", button.dataset.session)));
    document.querySelectorAll(".js-pick-activity").forEach((button) => button.addEventListener("click", () => pick("#activity-choice", button.dataset.activity)));
  }

  function pick(selector, value) {
    const field = document.querySelector(selector);
    if (!field) return;
    field.value = value;
    field.focus();
  }

  function bindPublicForms() {
    document.querySelectorAll(".js-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = form.querySelector(".form-status");
        const endpoint = form.querySelector("#activity-choice") ? "/api/registrations" : form.querySelector("#session-type") ? "/api/bookings" : "";
        if (!endpoint) return;
        try {
          const result = await api(endpoint, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
          status.textContent = result.message || "Request received.";
          form.reset();
        } catch (error) {
          status.textContent = `${error.message} The backend is not active yet. Please contact Kinetix directly.`;
        }
      });
    });
  }

  async function api(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(path, {
      ...options,
      headers: isFormData ? { ...(options.headers || {}) } : { "content-type": "application/json", ...(options.headers || {}) },
    });
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
      list.innerHTML = activities.map(activityCard).join("");
      select.innerHTML = `<option value="">Select an activity</option>${activities.map((activity) => `<option>${escapeHtml(activity.title)}</option>`).join("")}`;
      bindPickers();
    } catch {}
  }

  async function hydrateProducts() {
    const grid = document.querySelector(".product-grid");
    if (!grid) return;
    try {
      const products = await api("/api/products");
      if (!products.length) return;
      grid.innerHTML = products.map(productCard).join("");
      bindCartButtons();
    } catch {}
  }

  function activityCard(activity) {
    return `<article class="activity-card"><div><p class="card-meta">${escapeHtml(formatDate(activity.date))}</p><h2>${escapeHtml(activity.title)}</h2></div><dl><div><dt>Time</dt><dd>${escapeHtml(activity.time)}</dd></div><div><dt>Location</dt><dd>${escapeHtml(activity.location)}</dd></div><div><dt>Age group</dt><dd>${escapeHtml(activity.ageGroup)}</dd></div></dl><button class="button button-small button-primary js-pick-activity" type="button" data-activity="${escapeAttr(activity.title)}">Register</button></article>`;
  }

  function productCard(product) {
    const options = Array.isArray(product.options) && product.options.length ? product.options : ["Standard"];
    const image = product.imageUrl ? `<img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}">` : `<span>${escapeHtml((product.name || "Item").split(" ").pop())}</span>`;
    return `<article class="product-card"><div class="product-image">${image}</div><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.priceLabel || "Contact for pricing")}</p><label>${escapeHtml(product.optionLabel || "Size / color")}</label><select>${options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}</select><button class="button button-primary js-add-cart" type="button" data-product="${escapeAttr(product.name)}">Add to Cart</button></article>`;
  }

  function bindCartButtons() {
    document.querySelectorAll(".js-add-cart").forEach((button) => {
      button.addEventListener("click", () => {
        const product = button.dataset.product;
        if (!product) return;
        cart.set(product, (cart.get(product) || 0) + 1);
        setText(".cart-status", `${product} added.`);
        renderCart();
      });
    });
  }

  function renderCart() {
    const cartItems = document.querySelector(".cart-items");
    const cartCount = document.querySelector("#cart-count");
    if (!cartItems || !cartCount) return;
    cartItems.innerHTML = "";
    let count = 0;
    cart.forEach((quantity, product) => {
      count += quantity;
      const line = document.createElement("div");
      line.className = "cart-line";
      line.innerHTML = `<span>${escapeHtml(product)} x ${quantity}</span>`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        quantity <= 1 ? cart.delete(product) : cart.set(product, quantity - 1);
        renderCart();
      });
      line.append(remove);
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
        status.textContent = "Signing in...";
        await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: new FormData(login).get("password") }) });
        status.textContent = "";
        login.classList.add("is-hidden");
        dashboard.classList.remove("is-hidden");
        await loadAdmin(state);
      } catch (error) {
        status.textContent = error.message;
      }
    });

    document.querySelector(".js-admin-logout")?.addEventListener("click", async () => {
      await api("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => {});
      dashboard.classList.add("is-hidden");
      login.classList.remove("is-hidden");
    });

    document.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-tab]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
      document.querySelectorAll("[data-admin-pane]").forEach((pane) => pane.classList.toggle("is-active", pane.dataset.adminPane === button.dataset.adminTab));
    }));

    bindActivityForm(state);
    bindProductForm(state);
    bindAdminTools();
    loadAdmin(state).then(() => { login?.classList.add("is-hidden"); dashboard?.classList.remove("is-hidden"); }).catch(() => {});
  }

  async function loadAdmin(state) {
    setAdminBusy(true);
    try {
      const [summary, activities, products, registrations, bookings] = await Promise.all([
        api("/api/admin/summary"), api("/api/admin/activities"), api("/api/admin/products"), api("/api/admin/registrations"), api("/api/admin/bookings"),
      ]);
      state.activities = activities;
      state.products = products;
      adminTables = { registrations, bookings };
      Object.entries(summary).forEach(([key, value]) => setText(`[data-stat="${key}"]`, value));
      renderAdminActivities(state);
      renderAdminProducts(state);
      renderRows("registrations", registrations, ["name", "phone", "activityChoice", "participants", "notes", "createdAt"]);
      renderRows("bookings", bookings, ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"]);
    } finally {
      setAdminBusy(false);
    }
  }

  function bindActivityForm(state) {
    const form = document.querySelector(".js-activity-admin-form");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      const data = Object.fromEntries(new FormData(form).entries());
      data.isActive = form.elements.isActive.checked;
      try {
        setAdminBusy(true);
        status.textContent = "Saving activity...";
        await api("/api/admin/activities", { method: "POST", body: JSON.stringify(data) });
        status.textContent = "Activity saved.";
        form.reset();
        form.elements.isActive.checked = true;
        await loadAdmin(state);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        setAdminBusy(false);
      }
    });
    form.querySelector(".js-reset-form")?.addEventListener("click", () => { form.reset(); form.elements.id.value = ""; form.elements.isActive.checked = true; });
  }

  function bindProductForm(state) {
    const form = document.querySelector(".js-product-admin-form");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      try {
        setAdminBusy(true);
        status.textContent = "Saving product...";
        const image = form.elements.image.files[0];
        if (image) {
          const upload = new FormData();
          upload.append("image", image);
          const result = await api("/api/admin/products/image", { method: "POST", body: upload });
          form.elements.imageKey.value = result.imageKey;
          setText("[data-image-status]", "Image uploaded.");
        }
        const data = Object.fromEntries(new FormData(form).entries());
        data.options = String(data.options || "").split("\n").map((line) => line.trim()).filter(Boolean);
        data.isActive = form.elements.isActive.checked;
        delete data.image;
        await api("/api/admin/products", { method: "POST", body: JSON.stringify(data) });
        status.textContent = "Product saved.";
        form.reset();
        form.elements.isActive.checked = true;
        await loadAdmin(state);
      } catch (error) {
        status.textContent = error.message;
      } finally {
        setAdminBusy(false);
      }
    });
    form.elements.image?.addEventListener("change", () => {
      const preview = form.querySelector("[data-image-preview]");
      const image = form.elements.image.files[0];
      if (!preview || !image) { preview?.classList.add("is-hidden"); return; }
      preview.src = URL.createObjectURL(image);
      preview.classList.remove("is-hidden");
    });
    form.querySelector(".js-reset-form")?.addEventListener("click", () => {
      form.reset(); form.elements.id.value = ""; form.elements.imageKey.value = ""; form.elements.isActive.checked = true;
      setText("[data-image-status]", "No image uploaded.");
      const preview = form.querySelector("[data-image-preview]");
      preview?.classList.add("is-hidden");
      preview?.removeAttribute("src");
    });
  }

  function renderAdminActivities(state) {
    const list = document.querySelector('[data-admin-list="activities"]');
    if (!list) return;
    list.innerHTML = state.activities.map((item) => `<article><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.date)} / ${escapeHtml(item.time)} / ${escapeHtml(item.location)}</p></div><div class="admin-actions"><button type="button" data-edit-activity="${escapeAttr(item.id)}">Edit</button><button type="button" data-delete-activity="${escapeAttr(item.id)}">Delete</button></div></article>`).join("") || "<p>No activities yet.</p>";
    list.querySelectorAll("[data-edit-activity]").forEach((button) => button.addEventListener("click", () => fillActivityForm(state.activities.find((item) => item.id === button.dataset.editActivity))));
    list.querySelectorAll("[data-delete-activity]").forEach((button) => button.addEventListener("click", async () => { if (!confirm("Delete this activity? This cannot be undone.")) return; await api(`/api/admin/activities/${button.dataset.deleteActivity}`, { method: "DELETE" }); await loadAdmin(state); }));
  }

  function renderAdminProducts(state) {
    const list = document.querySelector('[data-admin-list="products"]');
    if (!list) return;
    list.innerHTML = state.products.map((item) => `<article><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.priceLabel || "Contact for pricing")} / ${item.isActive ? "Visible" : "Hidden"}</p></div><div class="admin-actions"><button type="button" data-edit-product="${escapeAttr(item.id)}">Edit</button><button type="button" data-delete-product="${escapeAttr(item.id)}">Delete</button></div></article>`).join("") || "<p>No products yet.</p>";
    list.querySelectorAll("[data-edit-product]").forEach((button) => button.addEventListener("click", () => fillProductForm(state.products.find((item) => item.id === button.dataset.editProduct))));
    list.querySelectorAll("[data-delete-product]").forEach((button) => button.addEventListener("click", async () => { if (!confirm("Delete this product? This cannot be undone.")) return; await api(`/api/admin/products/${button.dataset.deleteProduct}`, { method: "DELETE" }); await loadAdmin(state); }));
  }

  function fillActivityForm(item) {
    const form = document.querySelector(".js-activity-admin-form");
    if (!form || !item) return;
    ["id", "title", "date", "time", "location", "ageGroup", "description"].forEach((key) => { form.elements[key].value = item[key] || ""; });
    form.elements.isActive.checked = Boolean(item.isActive);
  }

  function fillProductForm(item) {
    const form = document.querySelector(".js-product-admin-form");
    if (!form || !item) return;
    ["id", "name", "description", "priceLabel", "optionLabel", "imageKey", "sortOrder"].forEach((key) => { form.elements[key].value = item[key] || ""; });
    form.elements.options.value = (item.options || []).join("\n");
    form.elements.isActive.checked = Boolean(item.isActive);
    setText("[data-image-status]", item.imageKey ? `Current image: ${item.imageKey}` : "No image uploaded.");
  }

  function bindAdminTools() {
    document.querySelectorAll("[data-table-filter]").forEach((input) => input.addEventListener("input", () => {
      const table = input.dataset.tableFilter;
      const keys = table === "registrations" ? ["name", "phone", "activityChoice", "participants", "notes", "createdAt"] : ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"];
      const term = input.value.trim().toLowerCase();
      const rows = term ? (adminTables[table] || []).filter((row) => keys.some((key) => String(row[key] || "").toLowerCase().includes(term))) : (adminTables[table] || []);
      renderRows(table, rows, keys);
    }));
    document.querySelectorAll(".js-export-csv").forEach((button) => button.addEventListener("click", () => {
      const table = button.dataset.export;
      const keys = table === "registrations" ? ["name", "phone", "activityChoice", "participants", "notes", "createdAt"] : ["name", "phone", "sessionType", "preferredDate", "notes", "createdAt"];
      downloadCsv(`${table}.csv`, adminTables[table] || [], keys);
    }));
  }

  function renderRows(name, rows, keys) {
    const body = document.querySelector(`[data-admin-table="${name}"]`);
    if (!body) return;
    body.innerHTML = rows.length ? rows.map((row) => `<tr>${keys.map((key) => `<td data-label="${escapeAttr(labelFor(key))}">${escapeHtml(row[key] || "")}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${keys.length}">No records yet.</td></tr>`;
  }

  function downloadCsv(filename, rows, keys) {
    const csv = [keys.map(labelFor).join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] || "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function setAdminBusy(isBusy) { document.querySelector(".admin-dashboard")?.classList.toggle("is-busy", isBusy); }
  function setText(selector, text) { const node = document.querySelector(selector); if (node) node.textContent = text; }
  function labelFor(key) { return ({ activityChoice: "Activity", sessionType: "Session", preferredDate: "Preferred Date", createdAt: "Created" })[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
  function formatDate(value) { if (!value) return ""; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }); }
  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
})();
