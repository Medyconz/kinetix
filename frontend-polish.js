(() => {
  const page = document.body.dataset.page || "";
  document.addEventListener("DOMContentLoaded", () => {
    enhanceHomeHero();
    enhanceActivities();
    enhanceMerch();
    enhanceCoaches();
  });

  function enhanceHomeHero() {
    const hero = document.querySelector(".home-hero");
    if (!hero || hero.querySelector(".kinetix-hero-field")) return;
    hero.insertAdjacentHTML("afterbegin", '<div class="kinetix-hero-field" aria-hidden="true"></div>');
    const copy = hero.querySelector(".hero-copy");
    if (copy && !copy.querySelector(".hero-metrics")) {
      copy.insertAdjacentHTML("beforeend", '<div class="hero-metrics" aria-label="Kinetix performance signals"><div><strong>01</strong><small>Assess</small></div><div><strong>02</strong><small>Train</small></div><div><strong>03</strong><small>Perform</small></div></div>');
    }
  }

  function enhanceActivities() {
    if (page !== "activities") return;
    const list = document.querySelector(".activity-list");
    if (!list || document.querySelector(".polish-toolbar")) return;
    list.insertAdjacentHTML("beforebegin", `
      <div class="polish-toolbar" aria-label="Activity filters">
        <input type="search" data-activity-search placeholder="Search activities">
        <select data-age-filter><option value="all">All age groups</option></select>
        <div class="segmented" aria-label="View mode"><button type="button" class="is-active" data-view-mode="full">Full</button><button type="button" data-view-mode="compact">Compact</button></div>
      </div>
    `);
    refreshActivityMetadata();
    document.querySelector("[data-activity-search]")?.addEventListener("input", filterActivities);
    document.querySelector("[data-age-filter]")?.addEventListener("change", filterActivities);
    document.querySelectorAll("[data-view-mode]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-view-mode]").forEach((item) => item.classList.toggle("is-active", item === button));
      list.classList.toggle("is-compact", button.dataset.viewMode === "compact");
    }));
    new MutationObserver(() => { refreshActivityMetadata(); filterActivities(); }).observe(list, { childList: true });
  }

  function refreshActivityMetadata() {
    const cards = [...document.querySelectorAll(".activity-card")];
    const ages = new Set();
    cards.forEach((card) => {
      const title = card.querySelector("h2")?.textContent || "";
      const age = [...card.querySelectorAll("dt")].find((dt) => /age/i.test(dt.textContent))?.nextElementSibling?.textContent || "";
      card.dataset.searchText = `${title} ${card.textContent}`.toLowerCase();
      card.dataset.age = age.trim();
      if (age.trim()) ages.add(age.trim());
    });
    const select = document.querySelector("[data-age-filter]");
    if (select && select.options.length <= 1) {
      [...ages].sort().forEach((age) => select.append(new Option(age, age)));
    }
  }

  function filterActivities() {
    const query = (document.querySelector("[data-activity-search]")?.value || "").toLowerCase().trim();
    const age = document.querySelector("[data-age-filter]")?.value || "all";
    document.querySelectorAll(".activity-card").forEach((card) => {
      const okText = !query || card.dataset.searchText.includes(query);
      const okAge = age === "all" || card.dataset.age === age;
      card.classList.toggle("is-filtered-out", !(okText && okAge));
    });
  }

  function enhanceMerch() {
    if (page !== "merch") return;
    ensureQuickViewModal();
    document.querySelectorAll(".product-card").forEach((card) => {
      if (card.querySelector(".quick-view-button")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quick-view-button";
      button.textContent = "Quick view";
      button.addEventListener("click", () => openQuickView(card));
      card.append(button);
    });
    const cart = document.querySelector(".cart-panel");
    if (cart && !document.querySelector(".floating-cart-toggle")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "floating-cart-toggle";
      toggle.textContent = "Cart";
      toggle.addEventListener("click", () => cart.classList.toggle("is-drawer-open"));
      document.body.append(toggle);
      document.querySelectorAll(".js-add-cart").forEach((button) => button.addEventListener("click", () => cart.classList.add("is-drawer-open")));
    }
  }

  function ensureQuickViewModal() {
    if (document.querySelector(".polish-modal")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="polish-modal is-hidden" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <div class="polish-modal-backdrop" data-polish-close></div>
        <section class="polish-modal-card">
          <button class="polish-modal-close" type="button" data-polish-close aria-label="Close quick view">×</button>
          <div data-quick-view-content></div>
        </section>
      </div>
    `);
    document.querySelectorAll("[data-polish-close]").forEach((node) => node.addEventListener("click", closeQuickView));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeQuickView(); });
  }

  function openQuickView(card) {
    const modal = document.querySelector(".polish-modal");
    const content = document.querySelector("[data-quick-view-content]");
    if (!modal || !content) return;
    const title = card.querySelector("h2")?.textContent || "Kinetix product";
    const price = card.querySelector("p")?.textContent || "Contact for pricing";
    const optionLabel = card.querySelector("label")?.textContent || "Options";
    const options = [...card.querySelectorAll("option")].map((option) => option.textContent).join(" / ");
    content.innerHTML = `<p class="eyebrow">Merch preview</p><h2 id="quick-view-title">${escapeHtml(title)}</h2><p>${escapeHtml(price)}</p><p><strong>${escapeHtml(optionLabel)}:</strong> ${escapeHtml(options)}</p><p class="hero-text">A clean Kinetix staple for training, recovery, and daily movement. Product photos and final pricing can be managed from the admin portal.</p>`;
    modal.classList.remove("is-hidden");
  }

  function closeQuickView() {
    document.querySelector(".polish-modal")?.classList.add("is-hidden");
  }

  function enhanceCoaches() {
    if (page !== "coaches") return;
    const grid = document.querySelector(".coaches-grid");
    if (!grid || document.querySelector(".coach-progress")) return;
    const cards = [...grid.querySelectorAll(".coach-card")];
    const progress = document.createElement("div");
    progress.className = "coach-progress";
    progress.innerHTML = cards.map((_, index) => `<button type="button" aria-label="Show coach ${index + 1}" class="${index === 0 ? "is-active" : ""}"></button>`).join("");
    grid.after(progress);
    progress.querySelectorAll("button").forEach((button, index) => button.addEventListener("click", () => cards[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })));
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = cards.indexOf(entry.target);
          progress.querySelectorAll("button").forEach((button, buttonIndex) => button.classList.toggle("is-active", buttonIndex === index));
        });
      }, { root: grid, threshold: .65 });
      cards.forEach((card) => observer.observe(card));
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }
})();
