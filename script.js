(() => {
  const page = document.body.dataset.page;
  const navToggle = document.querySelector(".nav-toggle");
  const cart = new Map();
  const SOCIAL_LINKS = [
    { key: "instagram", label: "Instagram", short: "IG", href: "https://instagram.com/kinetix" },
    { key: "whatsapp", label: "WhatsApp", short: "WA", href: "https://wa.me/000000000000" },
    { key: "tiktok", label: "TikTok", short: "TT", href: "https://www.tiktok.com/@kinetix" },
  ];

  ensureCoachesLinks();

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

  function ensureCoachesLinks() {
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
  }

  function injectSocialFloaters() {
    if (page === "admin" || document.querySelector(".social-floaters")) return;
    const style = document.createElement("style");
    style.textContent = `.social-floaters{position:fixed;right:18px;bottom:18px;z-index:60;display:grid;gap:8px}.social-floaters a{width:46px;height:46px;display:grid;place-items:center;border:1px solid oklch(80% .012 78);background:oklch(97% .012 78/.92);color:oklch(13% .018 235);font-size:.72rem;font-weight:900;letter-spacing:.04em;backdrop-filter:blur(14px);box-shadow:0 14px 34px oklch(13% .018 235/.11);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.16,1,.3,1)}.social-floaters a:hover,.social-floaters a:focus-visible{transform:translateY(-3px);background:oklch(13% .018 235);color:oklch(98% .012 78)}@media(max-width:560px){.social-floaters{right:12px;bottom:12px;grid-auto-flow:column}.social-floaters a{width:42px;height:42px}}`;
    document.head.append(style);
    const nav = document.createElement("nav");
    nav.className = "social-floaters";
    nav.setAttribute("aria-label", "Social links");
    nav.innerHTML = SOCIAL_LINKS.map((item) => `<a href="${escapeAttr(item.href)}" target="_blank" rel="noreferrer" aria-label="Open Kinetix ${escapeAttr(item.label)}">${escapeHtml(item.short)}</a>`).join("");
    document.body.append(nav);
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
