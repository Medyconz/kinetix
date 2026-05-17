(() => {
  const page = document.body.dataset.page;
  const navToggle = document.querySelector(".nav-toggle");
  const cart = new Map();
  const SOCIAL_LINKS = [
    { key: "instagram", label: "Instagram", href: "https://instagram.com/kinetix" },
    { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/000000000000" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@kinetix" },
  ];

  ensureSharedLinks();

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

  injectAdminAccess();
  injectSocialFloaters();
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

  function ensureSharedLinks() {
    const nav = document.querySelector("#site-nav");
    if (nav && !nav.querySelector('[data-nav="coaches"]')) {
      const link = document.createElement("a");
      link.href = "coaches.html";
      link.dataset.nav = "coaches";
      link.textContent = "Our Coaches";
      const coachingLink = nav.querySelector('[data-nav="coaching"]');
      const activitiesLink = nav.querySelector('[data-nav="activities"]');
      if (coachingLink?.nextSibling) {
        nav.insertBefore(link, coachingLink.nextSibling);
      } else if (activitiesLink) {
        nav.insertBefore(link, activitiesLink);
      } else {
        nav.append(link);
      }
    }
    if (nav && !nav.querySelector('[data-nav="admin"]')) {
      const link = document.createElement("a");
      link.href = "admin.html";
      link.dataset.nav = "admin";
      link.textContent = "Admin";
      link.className = "admin-nav-link";
      nav.append(link);
    }

    const footerLinks = document.querySelector(".footer-links");
    if (footerLinks && !footerLinks.querySelector('a[href="coaches.html"]')) {
      const link = document.createElement("a");
      link.href = "coaches.html";
      link.textContent = "Our Coaches";
      const coachingLink = Array.from(footerLinks.querySelectorAll("a")).find((item) => item.getAttribute("href") === "coaching.html");
      const activitiesLink = Array.from(footerLinks.querySelectorAll("a")).find((item) => item.getAttribute("href") === "activities.html");
      if (coachingLink?.nextSibling) {
        footerLinks.insertBefore(link, coachingLink.nextSibling);
      } else if (activitiesLink) {
        footerLinks.insertBefore(link, activitiesLink);
      } else {
        footerLinks.append(link);
      }
    }
    if (footerLinks && !footerLinks.querySelector('a[href="admin.html"]')) {
      const link = document.createElement("a");
      link.href = "admin.html";
      link.textContent = "Admin";
      footerLinks.append(link);
    }
  }

  function injectAdminAccess() {
    if (page === "admin" || document.querySelector(".admin-quick-access")) return;
    const style = document.createElement("style");
    style.textContent = `.admin-nav-link{border:1px solid oklch(13% .018 235);color:oklch(13% .018 235)!important;background:oklch(97% .012 78)}.admin-nav-link:hover,.admin-nav-link:focus-visible{background:oklch(13% .018 235)!important;color:oklch(98% .012 78)!important}.admin-quick-access{position:fixed;left:18px;bottom:18px;z-index:61;display:inline-flex;min-height:44px;align-items:center;justify-content:center;border:1px solid oklch(13% .018 235);background:oklch(13% .018 235/.94);color:oklch(98% .012 78);padding:0 16px;font-size:.76rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;backdrop-filter:blur(14px);box-shadow:0 14px 34px oklch(13% .018 235/.14);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.16,1,.3,1)}.admin-quick-access:hover,.admin-quick-access:focus-visible{transform:translateY(-3px);background:oklch(97% .012 78);color:oklch(13% .018 235)}@media(max-width:560px){.admin-quick-access{left:12px;bottom:66px;min-height:42px;padding:0 14px}}`;
    document.head.append(style);
    const link = document.createElement("a");
    link.href = "admin.html";
    link.className = "admin-quick-access";
    link.setAttribute("aria-label", "Open Kinetix admin portal");
    link.textContent = "Admin";
    document.body.append(link);
  }

  function injectSocialFloaters() {
    if (page === "admin" || document.querySelector(".social-floaters")) return;
    const style = document.createElement("style");
    style.textContent = `.social-floaters{position:fixed;right:18px;bottom:18px;z-index:60;display:grid;gap:8px}.social-floaters a{width:46px;height:46px;display:grid;place-items:center;border:1px solid oklch(80% .012 78);background:oklch(97% .012 78/.92);color:oklch(13% .018 235);backdrop-filter:blur(14px);box-shadow:0 14px 34px oklch(13% .018 235/.11);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.16,1,.3,1)}.social-floaters a svg{width:20px;height:20px;display:block;fill:currentColor}.social-floaters a:hover,.social-floaters a:focus-visible{transform:translateY(-3px);background:oklch(13% .018 235);color:oklch(98% .012 78)}@media(max-width:560px){.social-floaters{right:12px;bottom:12px;grid-auto-flow:column}.social-floaters a{width:42px;height:42px}.social-floaters a svg{width:19px;height:19px}}`;
    document.head.append(style);
    const nav = document.createElement("nav");
    nav.className = "social-floaters";
    nav.setAttribute("aria-label", "Social links");
    nav.innerHTML = SOCIAL_LINKS.map((item) => `<a href="${escapeAttr(item.href)}" target="_blank" rel="noreferrer" aria-label="Open Kinetix ${escapeAttr(item.label)}">${socialIcon(item.key)}<span class="sr-only">${escapeHtml(item.label)}</span></a>`).join("");
    document.body.append(nav);
  }

  function socialIcon(key) {
    const icons = {
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.3A4.7 4.7 0 1 1 12 16.7 4.7 4.7 0 0 1 12 7.3Zm0 2A2.7 2.7 0 1 0 12 14.7 2.7 2.7 0 0 0 12 9.3Zm5.05-2.65a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 1 8.45 15.05L21.8 22l-5.08-1.28A9.91 9.91 0 0 1 2.13 12.1 9.92 9.92 0 0 1 12.04 2Zm0 2a7.91 7.91 0 0 0-6.78 11.96l.28.45-.73 2.74 2.83-.72.43.25A7.9 7.9 0 1 0 12.04 4Zm-3.1 3.77c.18-.02.38-.02.58-.01.14 0 .33.05.5.43.2.46.67 1.64.72 1.75.06.12.1.26.02.41-.08.16-.12.25-.24.39-.12.14-.25.31-.36.42-.12.12-.25.25-.11.49.14.24.62 1.02 1.33 1.65.92.82 1.69 1.07 1.93 1.2.24.12.38.1.53-.06.14-.17.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.42.67 1.66.79.25.12.41.18.47.28.06.1.06.59-.14 1.15-.2.57-1.16 1.09-1.62 1.13-.42.04-.95.06-1.53-.1-.36-.1-.81-.26-1.39-.51-2.44-1.05-4.04-3.5-4.16-3.66-.12-.16-.99-1.31-.99-2.5 0-1.2.63-1.78.85-2.03.22-.24.49-.3.65-.32Z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.7 2c.32 2.2 1.55 3.7 3.8 3.84v3.05a7.01 7.01 0 0 1-3.78-1.12v6.76A6.13 6.13 0 1 1 9.6 8.4c.34 0 .67.03.98.08v3.32a2.91 2.91 0 1 0 1.96 2.75V2h3.16Z"/></svg>'
    };
    return icons[key] || "";
  }

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

  function setText(selector, text) { const node = document.querySelector(selector); if (node) node.textContent = text; }
  function formatDate(value) { if (!value) return ""; const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }); }
  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#096;"); }
})();
