/* ==========================================================================
   AVC — Adyar Variety Choice
   Front-end logic. No build step: plain JS, runs as a static GitHub Pages site.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------- Config ---------------- */
  const WHATSAPP_NUMBER = "918248138571"; // digits only, country code first
  const IMAGE_BASE = "images/";
  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
  const PAGE_SIZE = 24;

  const CATEGORY_ICON = {
    "Bras": "🩱", "Panties": "🎀", "Briefs & Trunks": "🩲", "Vests": "🎽",
    "Nighties": "🌙", "Nightsuits": "🌙", "Camisoles & Slips": "👚",
    "Shapewear": "⏳", "Thermal Wear": "🧣", "Tights": "🧦",
    "Kidswear": "🧸", "Men's Outerwear": "👕", "Women's Outerwear": "👗",
    "Accessories": "🧵"
  };

  /* ---------------- State ---------------- */
  let PRODUCTS = [];
  let filtered = [];
  let visibleCount = PAGE_SIZE;
  let cart = loadCart();

  const state = {
    search: "",
    brand: "",
    gender: "",
    category: "",
    tag: "",
    sort: "relevance"
  };

  /* ---------------- Boot ---------------- */
  fetch("data/products.json")
    .then((r) => r.json())
    .then((data) => {
      PRODUCTS = data;
      initFilters();
      initHeroSwatches();
      initChatSuggestions();
      applyFilters();
    })
    .catch((err) => {
      document.getElementById("resultCount").textContent =
        "Couldn't load the catalogue — check that data/products.json exists.";
      console.error(err);
    });

  updateCartCount();
  renderCart();

  /* ==========================================================================
     Filters, search, sort
     ========================================================================== */
  function clearSearchBox() {
    document.getElementById("searchInput").value = "";
    state.search = "";
  }

  function initFilters() {
    const brandSel = document.getElementById("brandFilter");
    const genderSel = document.getElementById("genderFilter");
    const chipRow = document.getElementById("categoryChips");
    const genderPillRow = document.getElementById("genderPillRow");

    const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort();
    brands.forEach((b) => {
      const o = document.createElement("option");
      o.value = b; o.textContent = b;
      brandSel.appendChild(o);
    });

    const genders = [...new Set(PRODUCTS.map((p) => p.gender).filter(Boolean))].sort();
    genders.forEach((g) => {
      const o = document.createElement("option");
      o.value = g; o.textContent = g;
      genderSel.appendChild(o);
    });

    const categories = [...new Set(PRODUCTS.map((p) => p.category).filter(Boolean))].sort();
    categories.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "chip";
      btn.dataset.cat = c;
      btn.textContent = `${CATEGORY_ICON[c] || ""} ${c}`.trim();
      chipRow.appendChild(btn);
    });

    chipRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      [...chipRow.children].forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.category = btn.dataset.cat || "";
      clearSearchBox();
      visibleCount = PAGE_SIZE;
      applyFilters();
      closeFilterSidebar();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("tagChips").addEventListener("click", (e) => {
      const btn = e.target.closest(".chip-tag");
      if (!btn) return;
      const already = btn.classList.contains("is-active");
      [...document.querySelectorAll(".chip-tag")].forEach((c) => c.classList.remove("is-active"));
      state.tag = already ? "" : btn.dataset.tag;
      if (!already) btn.classList.add("is-active");
      clearSearchBox();
      visibleCount = PAGE_SIZE;
      applyFilters();
    });

    genderPillRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".gender-pill");
      if (!btn) return;
      [...genderPillRow.children].forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.gender = btn.dataset.gender || "";
      genderSel.value = state.gender;
      clearSearchBox();
      visibleCount = PAGE_SIZE;
      applyFilters();
    });

    let searchDebounce;
    document.getElementById("searchInput").addEventListener("input", (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.search = e.target.value.trim().toLowerCase();
        visibleCount = PAGE_SIZE;
        applyFilters();
      }, 150);
    });

    brandSel.addEventListener("change", (e) => {
      state.brand = e.target.value;
      visibleCount = PAGE_SIZE;
      applyFilters();
    });
    genderSel.addEventListener("change", (e) => {
      state.gender = e.target.value;
      syncGenderPills();
      visibleCount = PAGE_SIZE;
      applyFilters();
    });
    document.getElementById("sortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      applyFilters();
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", clearAllFilters);

    document.getElementById("loadMoreBtn").addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderGrid();
    });

    document.getElementById("filterOpenBtn").addEventListener("click", openFilterSidebar);
    document.getElementById("filterSidebarClose").addEventListener("click", closeFilterSidebar);
  }

  function syncGenderPills() {
    document.querySelectorAll(".gender-pill").forEach((p) => {
      p.classList.toggle("is-active", (p.dataset.gender || "") === state.gender);
    });
  }

  function clearAllFilters() {
    state.search = ""; state.brand = ""; state.gender = ""; state.category = ""; state.tag = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("brandFilter").value = "";
    document.getElementById("genderFilter").value = "";
    syncGenderPills();
    document.querySelectorAll("#categoryChips .chip").forEach((c) => c.classList.toggle("is-active", !c.dataset.cat));
    document.querySelectorAll(".chip-tag").forEach((c) => c.classList.remove("is-active"));
    visibleCount = PAGE_SIZE;
    applyFilters();
  }

  function syncDrawerOverlay() {
    const anyOpen = document.getElementById("cartDrawer").classList.contains("is-open")
      || document.getElementById("filterSidebar").classList.contains("is-open");
    document.getElementById("drawerOverlay").classList.toggle("is-open", anyOpen);
  }

  function openFilterSidebar() {
    document.getElementById("filterSidebar").classList.add("is-open");
    syncDrawerOverlay();
  }
  function closeFilterSidebar() {
    document.getElementById("filterSidebar").classList.remove("is-open");
    syncDrawerOverlay();
  }

  function activeFilterCount() {
    return [state.brand, state.gender, state.category, state.tag].filter(Boolean).length;
  }

  const TAG_LABELS = { padded: "Padded", sports: "Sports / Active", strapless: "Strapless", feeding: "Feeding & nursing", shapewear: "Shapewear" };

  function renderActiveFilters() {
    const row = document.getElementById("activeFilterRow");
    const pills = [];
    if (state.search) pills.push(["search", `Search: “${state.search}”`]);
    if (state.brand) pills.push(["brand", state.brand]);
    if (state.gender) pills.push(["gender", state.gender]);
    if (state.category) pills.push(["category", state.category]);
    if (state.tag) pills.push(["tag", TAG_LABELS[state.tag] || state.tag]);

    if (!pills.length) { row.hidden = true; row.innerHTML = ""; return; }
    row.hidden = false;
    row.innerHTML = pills.map(([key, label]) =>
      `<span class="active-filter-pill">${esc(label)}<button data-remove-filter="${key}" aria-label="Remove filter">✕</button></span>`
    ).join("");

    row.querySelectorAll("[data-remove-filter]").forEach((btn) => {
      btn.addEventListener("click", () => removeFilter(btn.dataset.removeFilter));
    });

    const badge = document.getElementById("filterCount");
    const count = activeFilterCount();
    badge.hidden = count === 0;
    badge.textContent = count;
  }

  function removeFilter(key) {
    if (key === "search") clearSearchBox();
    if (key === "brand") { state.brand = ""; document.getElementById("brandFilter").value = ""; }
    if (key === "gender") { state.gender = ""; document.getElementById("genderFilter").value = ""; syncGenderPills(); }
    if (key === "category") {
      state.category = "";
      document.querySelectorAll("#categoryChips .chip").forEach((c) => c.classList.toggle("is-active", !c.dataset.cat));
    }
    if (key === "tag") {
      state.tag = "";
      document.querySelectorAll(".chip-tag").forEach((c) => c.classList.remove("is-active"));
    }
    visibleCount = PAGE_SIZE;
    applyFilters();
  }

  function matchesTag(p, tag) {
    switch (tag) {
      case "padded": return p.padded;
      case "sports": return p.sports;
      case "strapless": return p.strapless;
      case "feeding": return p.feeding;
      case "shapewear": return p.shapewear || p.category === "Shapewear";
      default: return true;
    }
  }

  function applyFilters() {
    filtered = PRODUCTS.filter((p) => {
      if (state.brand && p.brand !== state.brand) return false;
      if (state.gender && p.gender !== state.gender) return false;
      if (state.category && p.category !== state.category) return false;
      if (state.tag && !matchesTag(p, state.tag)) return false;
      if (state.search) {
        const hay = `${p.brand} ${p.model} ${p.type} ${p.category} ${p.fabric} ${p.style} ${p.description}`.toLowerCase();
        if (!hay.includes(state.search)) return false;
      }
      return true;
    });

    if (state.sort === "price-asc") {
      filtered.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
    } else if (state.sort === "price-desc") {
      filtered.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    } else if (state.sort === "brand") {
      filtered.sort((a, b) => a.brand.localeCompare(b.brand));
    }

    renderActiveFilters();
    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById("productGrid");
    const countEl = document.getElementById("resultCount");
    const slice = filtered.slice(0, visibleCount);

    countEl.textContent = filtered.length
      ? `${filtered.length} style${filtered.length === 1 ? "" : "s"}`
      : "No styles match those filters — try clearing a filter.";

    grid.innerHTML = slice.map(productCardHTML).join("");

    document.getElementById("loadMoreBtn").style.display =
      visibleCount < filtered.length ? "inline-flex" : "none";

    grid.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.add);
      });
    });
    grid.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openQuickView(btn.dataset.view);
      });
    });
    grid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", () => openQuickView(card.dataset.id));
    });
  }

  function productCardHTML(p) {
    const price = p.price ? `₹${p.price}` : `<small>Price on request</small>`;
    const badges = [];
    if (p.padded) badges.push("Padded");
    if (p.sports) badges.push("Sports");
    if (p.strapless) badges.push("Strapless");
    if (p.feeding) badges.push("Feeding");
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="product-media">
        ${imgTagHTML(p)}
        <div class="product-badges">${badges.slice(0, 2).map((b) => `<span class="badge">${b}</span>`).join("")}</div>
      </div>
      <div class="product-info">
        <span class="product-brand">${esc(p.brand)}</span>
        <span class="product-name">${esc(p.type || p.category)}</span>
        <span class="product-meta">${esc(p.sizeRange || p.gender || "")}</span>
        <div class="product-price-row">
          <span class="product-price">${price}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-add" data-add="${p.id}">Add to cart</button>
        <button class="btn-view" data-view="${p.id}" aria-label="Quick view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </article>`;
  }

  function imgTagHTML(p) {
    const initials = (p.brand || "AVC").slice(0, 2).toUpperCase();
    return `<img src="${IMAGE_BASE}${encodeURIComponent(p.id)}.jpg" alt="${esc(p.brand)} ${esc(p.type)}"
      onerror="this.onerror=null; window.__tryNextExt(this, '${p.id}', 0)">`;
  }

  // Tries .jpg, .jpeg, .png, .webp in turn; if all fail, swap in a monogram fallback.
  window.__tryNextExt = function (img, id, i) {
    if (i >= IMAGE_EXTENSIONS.length) {
      const fallback = document.createElement("div");
      fallback.className = "fallback";
      fallback.textContent = (id || "AVC").replace("AVC-", "#");
      img.replaceWith(fallback);
      return;
    }
    img.onerror = () => window.__tryNextExt(img, id, i + 1);
    img.src = `${IMAGE_BASE}${encodeURIComponent(id)}.${IMAGE_EXTENSIONS[i]}`;
  };

  function esc(s) {
    return (s || "").toString().replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  /* ==========================================================================
     Hero swatches (category quick-links)
     ========================================================================== */
  function initHeroSwatches() {
    const counts = {};
    PRODUCTS.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const colours = ["var(--rose)", "var(--plum)", "var(--sage)", "var(--rose-deep)", "var(--ink)", "var(--plum)"];
    const grid = document.getElementById("heroSwatchGrid");
    grid.innerHTML = top.map(([cat, count], i) => `
      <button class="swatch-card" style="background:${colours[i % colours.length]}" data-cat="${esc(cat)}">
        ${CATEGORY_ICON[cat] || "✦"} ${esc(cat)}
        <span class="swatch-count">${count} styles</span>
      </button>`).join("");

    grid.querySelectorAll(".swatch-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const chip = document.querySelector(`.chip[data-cat="${CSS.escape(btn.dataset.cat)}"]`);
        if (chip) chip.click();
      });
    });
  }

  /* ==========================================================================
     Cart
     ========================================================================== */
  function loadCart() {
    try { return JSON.parse(localStorage.getItem("avc_cart") || "{}"); }
    catch (e) { return {}; }
  }
  function saveCart() { localStorage.setItem("avc_cart", JSON.stringify(cart)); }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    updateCartCount();
    renderCart();
    openCart();
  }
  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    saveCart();
    updateCartCount();
    renderCart();
  }

  function updateCartCount() {
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    document.getElementById("cartCount").textContent = total;
  }

  function renderCart() {
    const wrap = document.getElementById("cartItems");
    const ids = Object.keys(cart);
    if (!ids.length) {
      wrap.innerHTML = `<p class="cart-empty">Your cart is empty — add a few styles to get started.</p>`;
      document.getElementById("cartTotal").textContent = "₹0";
      return;
    }
    let total = 0;
    wrap.innerHTML = ids.map((id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      const qty = cart[id];
      const lineTotal = (p.price || 0) * qty;
      total += lineTotal;
      return `
      <div class="cart-item" data-id="${id}">
        <div class="cart-item-thumb">${cartThumbHTML(p)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${esc(p.brand)} — ${esc(p.type)}</div>
          <div class="cart-item-meta">${esc(p.id)} · ${esc(p.sizeRange || "")}</div>
          <div class="cart-item-row">
            <div class="qty-control">
              <button data-dec="${id}" aria-label="Decrease quantity">–</button>
              <span>${qty}</span>
              <button data-inc="${id}" aria-label="Increase quantity">+</button>
            </div>
            <span class="cart-item-price">${p.price ? "₹" + lineTotal : "On request"}</span>
          </div>
          <button class="cart-item-remove" data-remove="${id}">Remove</button>
        </div>
      </div>`;
    }).join("");

    document.getElementById("cartTotal").textContent = `₹${total}`;

    wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.inc, cart[b.dataset.inc] + 1)));
    wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.dec, cart[b.dataset.dec] - 1)));
    wrap.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => setQty(b.dataset.remove, 0)));
  }

  function cartThumbHTML(p) {
    return `<img src="${IMAGE_BASE}${encodeURIComponent(p.id)}.jpg" alt=""
      onerror="this.onerror=null; window.__tryNextExt(this, '${p.id}', 0)">`;
  }

  function openCart() {
    document.getElementById("cartDrawer").classList.add("is-open");
    syncDrawerOverlay();
    document.getElementById("cartDrawer").setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    document.getElementById("cartDrawer").classList.remove("is-open");
    syncDrawerOverlay();
    document.getElementById("cartDrawer").setAttribute("aria-hidden", "true");
  }

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("drawerOverlay").addEventListener("click", () => {
    closeCart(); closeFilterSidebar(); closeQuickView();
  });

  document.getElementById("placeOrderBtn").addEventListener("click", () => {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    let total = 0;
    let hasUnpriced = false;
    const lines = ids.map((id, i) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return "";
      const qty = cart[id];
      const priceStr = p.price ? `₹${p.price}` : "price on request";
      if (p.price) total += p.price * qty; else hasUnpriced = true;
      const details = [
        p.sizeRange ? `Size: ${p.sizeRange}` : "",
        `Qty: ${qty}`,
        priceStr
      ].filter(Boolean).join(" · ");
      return `${i + 1}. *${p.id}* — ${p.brand} ${p.type}\n    ${details}`;
    }).join("\n\n");

    const totalLine = hasUnpriced
      ? `*Estimated total: ₹${total}+* (some prices to be confirmed)`
      : `*Estimated total: ₹${total}*`;

    const msg =
      `Hi AVC! 👋 I'd like to place an order:\n\n${lines}\n\n${totalLine}\n\nCould you please confirm sizes, stock and final pricing? Thank you!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  document.getElementById("footerWhatsapp").href =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi AVC! I have a question about your catalogue.")}`;

  /* ==========================================================================
     Quick view
     ========================================================================== */
  function openQuickView(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const body = document.getElementById("quickViewBody");
    const facts = [
      ["Fabric", p.fabric], ["Coverage", p.coverage], ["Padding", p.paddingLevel],
      ["Style", p.style], ["Size range", p.sizeRange], ["Cup range", p.cupRange]
    ].filter(([, v]) => v);

    body.innerHTML = `
      <div class="qv-grid">
        <div class="qv-media">${imgTagHTML(p)}</div>
        <div class="qv-info">
          <span class="product-brand">${esc(p.brand)}</span>
          <h3>${esc(p.type || p.category)}</h3>
          <div class="qv-price">${p.price ? "₹" + p.price : "Price on request"}</div>
          <p class="qv-desc">${esc(p.description || "Message us for full details on this style.")}</p>
          <div class="qv-facts">
            ${facts.map(([k, v]) => `<div class="qv-fact"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("")}
          </div>
          ${p.colours.length ? `<div class="qv-colours">${p.colours.slice(0, 8).map((c) => `<span class="qv-colour-chip">${esc(c)}</span>`).join("")}</div>` : ""}
          <div class="qv-actions">
            <button class="btn btn-primary" id="qvAdd">Add to cart</button>
            <button class="btn btn-outline" id="qvClose2">Keep browsing</button>
          </div>
        </div>
      </div>`;

    document.getElementById("qvAdd").addEventListener("click", () => { addToCart(p.id); closeQuickView(); });
    document.getElementById("qvClose2").addEventListener("click", closeQuickView);

    document.getElementById("quickView").classList.add("is-open");
    document.getElementById("quickViewOverlay").classList.add("is-open");
    document.getElementById("quickView").setAttribute("aria-hidden", "false");
  }
  function closeQuickView() {
    document.getElementById("quickView").classList.remove("is-open");
    document.getElementById("quickViewOverlay").classList.remove("is-open");
    document.getElementById("quickView").setAttribute("aria-hidden", "true");
  }
  document.getElementById("quickViewClose").addEventListener("click", closeQuickView);
  document.getElementById("quickViewOverlay").addEventListener("click", closeQuickView);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeCart(); closeFilterSidebar(); closeQuickView(); closeChat(); }
  });

  /* ==========================================================================
     Size guide calculators
     ========================================================================== */
  document.querySelectorAll(".sg-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".sg-tab").forEach((t) => { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      document.querySelectorAll(".sg-tabpanel").forEach((p) => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      document.getElementById(tab.dataset.target).classList.add("is-active");
    });
  });

  function resultCardHTML(size, label, note, filterFn) {
    return `
      <div class="sg-result-card">
        <div class="sg-result-size">${size}</div>
        <div class="sg-result-label">${label}</div>
        <p class="sg-result-note">${note}</p>
        <div class="sg-result-cta"><button class="btn btn-primary btn-small" id="sgShopBtn">Shop this size</button></div>
      </div>`;
  }
  function wireShopButton(container, fn) {
    const btn = container.querySelector("#sgShopBtn");
    if (btn) btn.addEventListener("click", fn);
  }
  function goToCatalogWithSearch(term) {
    document.getElementById("searchInput").value = term;
    state.search = term.toLowerCase();
    visibleCount = PAGE_SIZE;
    applyFilters();
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  }

  // Bra size
  document.getElementById("braCalcBtn").addEventListener("click", () => {
    const band = parseFloat(document.getElementById("braBand").value);
    const bust = parseFloat(document.getElementById("braBust").value);
    const out = document.getElementById("braResult");
    if (!band || !bust) { out.innerHTML = `<div class="sg-result-placeholder"><p>Please fill in both measurements to continue.</p></div>`; return; }
    let bandSize = Math.round(band);
    if (bandSize % 2 !== 0) bandSize += 1;
    const diff = Math.round(bust - band);
    const cups = ["AA", "A", "B", "C", "D", "DD", "E", "F", "FF", "G"];
    const cup = cups[Math.max(0, Math.min(diff, cups.length - 1))];
    const size = `${bandSize}${cup}`;
    out.innerHTML = resultCardHTML(size, "Your estimated bra size",
      `Sizing varies a little between brands — if you're between sizes, we recommend sizing up in the band or trying both in person.`);
    wireShopButton(out, () => goToCatalogWithSearch(""));
  });

  // Panty / bottoms size
  document.getElementById("pantyCalcBtn").addEventListener("click", () => {
    const hip = parseFloat(document.getElementById("pantyHip").value);
    const out = document.getElementById("pantyResult");
    if (!hip) { out.innerHTML = `<div class="sg-result-placeholder"><p>Please enter your hip measurement.</p></div>`; return; }
    const bands = [[36, "S"], [39, "M"], [42, "L"], [45, "XL"], [48, "XXL"], [999, "3XL"]];
    const size = bands.find(([max]) => hip <= max)[1];
    out.innerHTML = resultCardHTML(size, "Your estimated bottoms size",
      `Based on a hip measurement of ${hip}". Panty and shapewear sizing runs close to this across most of our brands.`);
    wireShopButton(out, () => goToCatalogWithSearch(""));
  });

  // Men's size
  document.getElementById("menCalcBtn").addEventListener("click", () => {
    const waist = parseFloat(document.getElementById("menWaist").value);
    const out = document.getElementById("menResult");
    if (!waist) { out.innerHTML = `<div class="sg-result-placeholder"><p>Please enter your waist measurement.</p></div>`; return; }
    const bands = [[30, "S"], [34, "M"], [38, "L"], [42, "XL"], [46, "XXL"], [999, "3XL"]];
    const size = bands.find(([max]) => waist <= max)[1];
    out.innerHTML = resultCardHTML(size, "Your estimated size",
      `Based on a waist measurement of ${waist}". Applies to briefs, trunks, boxers and vests across our menswear brands.`);
    wireShopButton(out, () => goToCatalogWithSearch(""));
  });

  // Kids
  document.getElementById("kidsCalcBtn").addEventListener("click", () => {
    const age = parseFloat(document.getElementById("kidsAge").value);
    const out = document.getElementById("kidsResult");
    if (!age) { out.innerHTML = `<div class="sg-result-placeholder"><p>Please enter the child's age.</p></div>`; return; }
    let label;
    if (age <= 3) label = "1–3 yrs";
    else if (age <= 6) label = "3–6 yrs";
    else if (age <= 9) label = "6–9 yrs";
    else if (age <= 12) label = "9–12 yrs";
    else label = "12+ yrs";
    out.innerHTML = resultCardHTML(label, "Suggested size band",
      `A good starting point for briefs, vests and trunks. We size kidswear a little generously for room to grow.`);
    wireShopButton(out, () => goToCatalogWithSearch("kidswear"));
  });

  /* ==========================================================================
     Chat / help widget — searches the same product data, no external API
     ========================================================================== */
  const chatFab = document.getElementById("chatFab");
  const chatPanel = document.getElementById("chatPanel");
  const chatBody = document.getElementById("chatBody");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  function openChat() {
    chatPanel.classList.add("is-open");
    chatPanel.setAttribute("aria-hidden", "false");
    chatInput.focus();
  }
  function closeChat() {
    chatPanel.classList.remove("is-open");
    chatPanel.setAttribute("aria-hidden", "true");
    hideSuggestions();
  }
  chatFab.addEventListener("click", () => {
    chatPanel.classList.contains("is-open") ? closeChat() : openChat();
  });
  document.getElementById("chatClose").addEventListener("click", closeChat);
  document.getElementById("navHelpLink").addEventListener("click", (e) => {
    e.preventDefault(); openChat();
  });

  chatBody.addEventListener("click", (e) => {
    const fillBtn = e.target.closest("[data-fill]");
    if (fillBtn) { chatInput.value = fillBtn.dataset.fill; chatForm.requestSubmit(); }
  });

  const TAG_WORDS = {
    padded: "padded", "non-padded": "padded", sports: "sports", active: "sports",
    strapless: "strapless", feeding: "feeding", nursing: "feeding",
    shapewear: "shapewear", shaper: "shapewear", corset: "shapewear"
  };

  const STYLE_SUGGESTIONS = [
    "Padded", "Sports / Active", "Strapless", "Feeding & nursing", "Shapewear"
  ];

  /* ---------- Live typeahead ---------- */
  let CHAT_SUGGESTIONS = [];
  let activeSuggestIndex = -1;
  const chatSuggestEl = document.getElementById("chatSuggest");

  function initChatSuggestions() {
    const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))]
      .map((label) => ({ label, kind: "Brand" }));
    const categories = [...new Set(PRODUCTS.map((p) => p.category).filter(Boolean))]
      .map((label) => ({ label, kind: "Category" }));
    const styles = STYLE_SUGGESTIONS.map((label) => ({ label, kind: "Style" }));
    CHAT_SUGGESTIONS = [...brands, ...styles, ...categories];
  }

  function matchSuggestions(query) {
    const q = query.toLowerCase();
    if (!q) return [];
    const starts = [];
    const contains = [];
    CHAT_SUGGESTIONS.forEach((s) => {
      const l = s.label.toLowerCase();
      if (l.startsWith(q)) starts.push(s);
      else if (l.includes(q)) contains.push(s);
    });
    return [...starts, ...contains].slice(0, 7);
  }

  function highlightMatch(label, query) {
    const i = label.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return esc(label);
    return `${esc(label.slice(0, i))}<strong>${esc(label.slice(i, i + query.length))}</strong>${esc(label.slice(i + query.length))}`;
  }

  function renderSuggestions(query) {
    const matches = matchSuggestions(query);
    activeSuggestIndex = -1;
    if (!matches.length) { hideSuggestions(); return; }
    chatSuggestEl.innerHTML = matches.map((s, i) => `
      <button type="button" class="chat-suggest-item" data-idx="${i}" data-value="${esc(s.label)}" role="option">
        <span>${highlightMatch(s.label, query)}</span>
        <span class="chat-suggest-kind">${s.kind}</span>
      </button>`).join("");
    chatSuggestEl.hidden = false;
    chatInput.setAttribute("aria-expanded", "true");
  }

  function hideSuggestions() {
    chatSuggestEl.hidden = true;
    chatSuggestEl.innerHTML = "";
    chatInput.setAttribute("aria-expanded", "false");
    activeSuggestIndex = -1;
  }

  function selectSuggestion(value) {
    chatInput.value = value;
    hideSuggestions();
    chatForm.requestSubmit();
  }

  chatInput.addEventListener("input", () => renderSuggestions(chatInput.value.trim()));

  chatInput.addEventListener("keydown", (e) => {
    const items = [...chatSuggestEl.querySelectorAll(".chat-suggest-item")];
    if (chatSuggestEl.hidden || !items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestIndex = Math.min(activeSuggestIndex + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle("is-active", i === activeSuggestIndex));
      items[activeSuggestIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestIndex = Math.max(activeSuggestIndex - 1, 0);
      items.forEach((it, i) => it.classList.toggle("is-active", i === activeSuggestIndex));
      items[activeSuggestIndex].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (activeSuggestIndex >= 0) {
        e.preventDefault();
        selectSuggestion(items[activeSuggestIndex].dataset.value);
      } else {
        hideSuggestions();
      }
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });

  chatSuggestEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-suggest-item");
    if (btn) selectSuggestion(btn.dataset.value);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".chat-input-wrap")) hideSuggestions();
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = chatInput.value.trim();
    if (!raw) return;
    hideSuggestions();
    addChatMsg(raw, "user");
    chatInput.value = "";
    setTimeout(() => respondTo(raw), 260);
  });

  function addChatMsg(html, who) {
    const div = document.createElement("div");
    div.className = `chat-msg chat-msg-${who}`;
    div.innerHTML = html;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function respondTo(query) {
    const q = query.toLowerCase();

    const brandMatch = [...new Set(PRODUCTS.map((p) => p.brand))]
      .find((b) => q.includes(b.toLowerCase()));

    const catMatch = [...new Set(PRODUCTS.map((p) => p.category))]
      .find((c) => q.includes(c.toLowerCase().replace(/&/g, "").replace(/\s+/g, " ").trim())
        || q.includes(c.toLowerCase().split(" ")[0]));

    const tagKey = Object.keys(TAG_WORDS).find((w) => q.includes(w));

    let results = PRODUCTS;
    let usedFilter = false;
    let filterLabel = [];

    if (brandMatch) { results = results.filter((p) => p.brand === brandMatch); usedFilter = true; filterLabel.push(brandMatch); }
    if (catMatch) { results = results.filter((p) => p.category === catMatch); usedFilter = true; filterLabel.push(catMatch); }
    if (tagKey) { results = results.filter((p) => matchesTag(p, TAG_WORDS[tagKey])); usedFilter = true; filterLabel.push(tagKey); }

    if (!usedFilter) {
      // free text fallback across brand/type/category/fabric
      results = PRODUCTS.filter((p) => `${p.brand} ${p.type} ${p.category} ${p.fabric}`.toLowerCase().includes(q));
    }

    if (!results.length) {
      addChatMsg(`I couldn't find a match for "${esc(query)}". Try a brand name like <button class="chat-inline-btn" data-fill="Enamor">Enamor</button>, or a style like <button class="chat-inline-btn" data-fill="nighty">nighty</button>.`, "bot");
      return;
    }

    const heading = usedFilter
      ? `Here's what we have for <strong>${esc(filterLabel.join(" · "))}</strong> — ${results.length} style${results.length === 1 ? "" : "s"}:`
      : `Found ${results.length} match${results.length === 1 ? "" : "es"} for "${esc(query)}":`;

    const bot = addChatMsg(heading, "bot");

    const list = document.createElement("div");
    list.className = "chat-results";
    results.slice(0, 4).forEach((p) => {
      const card = document.createElement("button");
      card.className = "chat-result-card";
      card.innerHTML = `
        <div class="chat-result-thumb">${imgTagHTML(p)}</div>
        <div class="chat-result-text">
          <strong>${esc(p.brand)} — ${esc(p.type)}</strong>
          <span>${p.price ? "₹" + p.price : "Price on request"} · ${esc(p.sizeRange || "")}</span>
        </div>`;
      card.addEventListener("click", () => openQuickView(p.id));
      list.appendChild(card);
    });
    if (results.length > 4) {
      const more = document.createElement("button");
      more.className = "chat-result-more";
      more.textContent = `Show all ${results.length} in the catalogue →`;
      more.addEventListener("click", () => {
        closeChat();
        clearSearchBox();
        if (brandMatch) { document.getElementById("brandFilter").value = brandMatch; state.brand = brandMatch; }
        if (catMatch) { const chip = document.querySelector(`.chip[data-cat="${CSS.escape(catMatch)}"]`); if (chip) chip.click(); }
        applyFilters();
        document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
      });
      list.appendChild(more);
    }
    chatBody.appendChild(list);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

})();
