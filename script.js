(() => {
  const page = document.body.dataset.page;
  const cart = new Map();
  const SOCIAL_LINKS = [
    { key: "instagram", label: "Instagram", href: "https://instagram.com/kinetix" },
    { key: "whatsapp", label: "WhatsApp", href: "https://wa.me/000000000000" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@kinetix" },
  ];

  injectMobilePolish();
  injectVisualPolish();
  ensureSharedLinks();
  markActiveNav();
  bindNavToggle();
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

  function injectMobilePolish() {
    addStyle("kinetix-mobile-polish", `@media(max-width:560px){body{font-size:15px}.navbar,.site-footer,.page-hero,.section{width:min(var(--max),calc(100% - 28px))}.navbar{min-height:58px;gap:10px}.brand{gap:9px}.brand-mark{width:28px;height:28px}.brand span{font-size:.78rem;letter-spacing:.06em}.nav-toggle{width:38px;height:38px}.nav-toggle span:not(.sr-only){width:16px}.nav-links{inset:59px 14px auto}.nav-links a{padding:13px 12px;font-size:.78rem}.home-hero{min-height:auto;padding:18px 16px 30px;gap:18px}.home-hero:before{height:58%;opacity:.75}.home-hero .eyebrow{max-width:26ch;margin-bottom:12px;font-size:.66rem;letter-spacing:.12em}.home-hero h1{max-width:9ch;margin-bottom:14px;font-size:clamp(2.75rem,13.2vw,4rem);line-height:.84}.home-hero .hero-text{font-size:.95rem;line-height:1.55}.home-hero .button-row{gap:8px;margin-top:18px}.button{min-height:44px;padding:12px 15px;font-size:.76rem}.home-hero .hero-emblem{width:min(52vw,210px);max-width:210px}.hero-emblem img{width:68%;height:68%}.home-hero .hero-strip{margin-top:14px}.home-hero .hero-strip span{padding:9px 6px;font-size:.66rem}.page-hero{padding:42px 0 34px}.page-hero h1{max-width:13ch;margin-bottom:16px;font-size:clamp(2.05rem,10.5vw,3.15rem);line-height:.92}.page-hero p{font-size:.96rem;line-height:1.55}h2{font-size:clamp(1.45rem,7.5vw,2.15rem)}.section{padding:40px 0}.section-heading{gap:12px;margin-bottom:24px}.feature-panel{min-height:210px;padding:20px}.panel-number{font-size:clamp(1.7rem,10vw,3rem)}.service-card,.activity-card,.product-card,.form-panel,.cart-panel,.contact-panel{padding:20px}.service-card{min-height:250px}.service-card h2,.activity-card h2,.product-card h2,.form-panel h2,.cart-panel h2,.contact-panel h2,.story-copy h2{font-size:clamp(1.12rem,6vw,1.55rem);line-height:1.06}.card-footer{gap:10px;padding-top:16px}.product-image{aspect-ratio:1.25;margin-bottom:18px}.product-image:before{inset:13px}.form-panel .button,.product-card .button{margin-top:18px}.coaches-hero{width:min(var(--max),calc(100% - 28px))!important;padding:44px 0 24px!important;gap:18px!important}.coaches-hero h1{max-width:10ch!important;margin-bottom:14px!important;font-size:clamp(2.2rem,11vw,3.4rem)!important;line-height:.9!important}.coaches-hero p{font-size:.96rem!important;line-height:1.55!important}.coach-hero-panel{min-height:220px!important;padding:20px!important}.coaches-grid,.coach-cta{width:min(var(--max),calc(100% - 28px))!important}.coach-card{min-height:auto!important}.coach-photo{min-height:220px!important}.coach-photo span{font-size:clamp(2.8rem,16vw,4.5rem)!important}.coach-copy{padding:20px!important;gap:22px!important}.coach-copy h2{font-size:clamp(1.65rem,8vw,2.4rem)!important;line-height:.94!important}.coach-stats{grid-template-columns:1fr 1fr 1fr!important}.coach-stats strong{font-size:1.05rem!important}.coach-stats small{font-size:.62rem!important}.coach-cta{padding:40px 0!important}.admin-quick-access{left:12px;bottom:64px;min-height:40px;padding:0 12px;font-size:.68rem}.social-floaters{right:12px;bottom:12px}.social-floaters a{width:40px;height:40px}}`);
  }

  function injectVisualPolish() {
    addStyle("kinetix-visual-polish", `:root{--sage:oklch(82% .042 154);--sage-soft:oklch(93% .028 154);--clay-soft:oklch(91% .03 58);--steel-soft:oklch(91% .022 230);--warm-paper:oklch(97% .015 78)}body{background:radial-gradient(circle at 16% 8%,oklch(92% .03 154/.58),transparent 28rem),radial-gradient(circle at 86% 18%,oklch(92% .028 58/.42),transparent 26rem),linear-gradient(180deg,oklch(96% .016 78),var(--paper) 420px),var(--paper)}.site-header{background:oklch(97% .014 78/.88)}.nav-links a{position:relative;isolation:isolate;overflow:hidden}.nav-links a:before{content:"";position:absolute;inset:auto 10px 7px;height:1px;background:oklch(42% .055 154);transform:scaleX(0);transform-origin:left;transition:transform .26s cubic-bezier(.16,1,.3,1)}.nav-links a:hover:before,.nav-links a:focus-visible:before,.nav-links a.is-active:before{transform:scaleX(1)}.nav-links a:hover,.nav-links a.is-active{background:linear-gradient(135deg,var(--sage-soft),oklch(95% .02 78));color:var(--ink)}.button{position:relative;isolation:isolate;overflow:hidden;will-change:transform}.button:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 0 36%,oklch(98% .02 78/.28) 45%,transparent 58%);transform:translateX(-120%);transition:transform .5s cubic-bezier(.16,1,.3,1);z-index:-1}.button:hover:before,.button:focus-visible:before{transform:translateX(120%)}.button:active{transform:translateY(0) scale(.985)}.button-primary:hover{background:oklch(23% .045 154);color:var(--reverse)}.button-secondary:hover{background:oklch(21% .034 235);color:var(--reverse)}.hero-strip span,.coach-tags span{transition:transform .24s cubic-bezier(.16,1,.3,1),background .24s cubic-bezier(.16,1,.3,1),border-color .24s cubic-bezier(.16,1,.3,1)}.hero-strip span:hover,.coach-tags span:hover{transform:translateY(-2px);background:var(--sage-soft);border-color:oklch(65% .04 154)}.feature-panel,.service-card,.activity-card,.product-card,.form-panel,.cart-panel,.contact-panel,.coach-card,.coach-hero-panel,.coach-cta-inner{transition:transform .28s cubic-bezier(.16,1,.3,1),box-shadow .28s cubic-bezier(.16,1,.3,1),border-color .28s cubic-bezier(.16,1,.3,1),background .28s cubic-bezier(.16,1,.3,1)}.feature-panel:hover,.service-card:hover,.activity-card:hover,.product-card:hover,.coach-card:hover{transform:translateY(-4px);border-color:oklch(62% .045 154);box-shadow:0 18px 46px oklch(13% .018 235/.1)}.service-card:nth-child(2n),.activity-card:nth-child(2n),.product-card:nth-child(2n){background:linear-gradient(145deg,oklch(96.5% .014 78),var(--steel-soft))}.service-card:nth-child(2n+1),.activity-card:nth-child(2n+1),.product-card:nth-child(2n+1){background:linear-gradient(145deg,oklch(96.5% .014 78),var(--clay-soft))}.form-panel,.cart-panel,.contact-panel{background:linear-gradient(160deg,var(--warm-paper),var(--sage-soft))}.page-hero .eyebrow,.card-meta,.coach-role{color:oklch(39% .055 154)}.product-image{background:linear-gradient(145deg,var(--sage-soft),var(--clay-soft))}.hero-emblem{transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s cubic-bezier(.16,1,.3,1)}.hero-emblem:hover{transform:translateY(-4px) rotate(-1deg);box-shadow:0 30px 90px oklch(13% .018 235/.18)}.kinetic-lines span{animation:kinetix-drift 7s cubic-bezier(.16,1,.3,1) infinite alternate}.kinetic-lines span:nth-child(2){animation-delay:-1.6s}.kinetic-lines span:nth-child(3){animation-delay:-3s}@keyframes kinetix-drift{from{transform:translateX(-10px) rotate(-28deg);opacity:.42}to{transform:translateX(16px) rotate(-28deg);opacity:.8}}@media(max-width:900px){body.nav-open .nav-links{animation:kinetix-menu-in .2s cubic-bezier(.16,1,.3,1) both}@keyframes kinetix-menu-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}}@media(prefers-reduced-motion:reduce){.kinetic-lines span{animation:none!important}.feature-panel:hover,.service-card:hover,.activity-card:hover,.product-card:hover,.coach-card:hover,.hero-emblem:hover,.button:hover{transform:none!important}.button:before,.nav-links a:before{transition:none!important}}`);
  }

  function addStyle(id, css) {
    if (document.querySelector(`#${id}`)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.append(style);
  }

  function ensureSharedLinks() {
    const nav = document.querySelector("#site-nav");
    if (nav && !nav.querySelector('[data-nav="coaches"]')) {
      const link = makeLink("coaches.html", "Our Coaches", "coaches");
      const coachingLink = nav.querySelector('[data-nav="coaching"]');
      const activitiesLink = nav.querySelector('[data-nav="activities"]');
      if (coachingLink?.nextSibling) nav.insertBefore(link, coachingLink.nextSibling);
      else if (activitiesLink) nav.insertBefore(link, activitiesLink);
      else nav.append(link);
    }
    if (nav && !nav.querySelector('[data-nav="admin"]')) {
      const link = makeLink("admin.html", "Admin", "admin");
      link.className = "admin-nav-link";
      nav.append(link);
    }
    const footerLinks = document.querySelector(".footer-links");
    if (footerLinks && !footerLinks.querySelector('a[href="coaches.html"]')) {
      const link = makeLink("coaches.html", "Our Coaches");
      const coachingLink = Array.from(footerLinks.querySelectorAll("a")).find((item) => item.getAttribute("href") === "coaching.html");
      const activitiesLink = Array.from(footerLinks.querySelectorAll("a")).find((item) => item.getAttribute("href") === "activities.html");
      if (coachingLink?.nextSibling) footerLinks.insertBefore(link, coachingLink.nextSibling);
      else if (activitiesLink) footerLinks.insertBefore(link, activitiesLink);
      else footerLinks.append(link);
    }
    if (footerLinks && !footerLinks.querySelector('a[href="admin.html"]')) footerLinks.append(makeLink("admin.html", "Admin"));
  }

  function makeLink(href, text, navKey) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    if (navKey) link.dataset.nav = navKey;
    return link;
  }

  function markActiveNav() {
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function bindNavToggle() {
    document.querySelector(".nav-toggle")?.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("nav-open");
      document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function injectAdminAccess() {
    if (page === "admin" || document.querySelector(".admin-quick-access")) return;
    addStyle("kinetix-admin-access", `.admin-nav-link{border:1px solid oklch(13% .018 235);color:oklch(13% .018 235)!important;background:oklch(97% .012 78)}.admin-nav-link:hover,.admin-nav-link:focus-visible{background:oklch(13% .018 235)!important;color:oklch(98% .012 78)!important}.admin-quick-access{position:fixed;left:18px;bottom:18px;z-index:61;display:inline-flex;min-height:44px;align-items:center;justify-content:center;border:1px solid oklch(13% .018 235);background:oklch(13% .018 235/.94);color:oklch(98% .012 78);padding:0 16px;font-size:.76rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase;backdrop-filter:blur(14px);box-shadow:0 14px 34px oklch(13% .018 235/.14);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.16,1,.3,1)}.admin-quick-access:hover,.admin-quick-access:focus-visible{transform:translateY(-3px);background:oklch(97% .012 78);color:oklch(13% .018 235)}`);
    const link = makeLink("admin.html", "Admin");
    link.className = "admin-quick-access";
    link.setAttribute("aria-label", "Open Kinetix admin portal");
    document.body.append(link);
  }

  function injectSocialFloaters() {
    if (page === "admin" || document.querySelector(".social-floaters")) return;
    addStyle("kinetix-social-floaters", `.social-floaters{position:fixed;right:18px;bottom:18px;z-index:60;display:grid;gap:8px}.social-floaters a{width:46px;height:46px;display:grid;place-items:center;border:1px solid oklch(80% .012 78);background:oklch(97% .012 78/.92);color:oklch(13% .018 235);backdrop-filter:blur(14px);box-shadow:0 14px 34px oklch(13% .018 235/.11);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s cubic-bezier(.16,1,.3,1),color .2s cubic-bezier(.16,1,.3,1)}.social-floaters a svg{width:20px;height:20px;display:block;fill:currentColor}.social-floaters a:hover,.social-floaters a:focus-visible{transform:translateY(-3px);background:oklch(13% .018 235);color:oklch(98% .012 78)}@media(max-width:560px){.social-floaters{right:12px;bottom:12px;grid-auto-flow:column}.social-floaters a{width:40px;height:40px}.social-floaters a svg{width:18px;height:18px}}`);
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
