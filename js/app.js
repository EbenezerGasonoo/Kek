(function () {
  "use strict";

  const FREE_DELIVERY_THRESHOLD = 200;
  const DELIVERY_FEE = 25;
  /** Ghana WhatsApp: digits only, no + (replace with your business line) */
  const WHATSAPP_NUMBER = "233541234567";
  const WHATSAPP_HELLO =
    "Hello KEK Skincare! I'm interested in your organic skincare and the website launch sale.";
  const LAUNCH_POPUP_KEY = "kek_launch_popup_dismissed";

  const FALLBACK_PRODUCT_IMG =
    "https://burst.shopifycdn.com/photos/hands-hold-a-small-cosmetics-container.jpg?width=600&format=pjpg&exif=0&iptc=0";

  function productImageUrl(id) {
    const m = window.KEK_MEDIA && window.KEK_MEDIA.productsById;
    return (m && m[id]) || FALLBACK_PRODUCT_IMG;
  }

  function hydrateProductImages() {
    PRODUCTS.forEach((p) => {
      p.image = productImageUrl(p.id);
    });
  }

  const PRODUCTS = [
    {
      id: "glow-cream",
      name: "KEK Glow Cream",
      subtitle: "Brightening Moisturizer",
      category: "creams",
      size: "60ml",
      price: 120,
      rating: 5,
      reviews: 124,
      bestseller: true,
      image: "",
      description:
        "A rich, natural moisturizer crafted with plant oils and botanical extracts to brighten and hydrate. Suitable for daily use on face and neck.",
    },
    {
      id: "turmeric-scrub",
      name: "Turmeric Face Scrub",
      subtitle: "Gentle exfoliation",
      category: "scrubs",
      size: "100g",
      price: 95,
      rating: 5,
      reviews: 89,
      bestseller: true,
      image: "",
      description:
        "Fine natural exfoliants and turmeric help lift dull skin without harsh chemicals. Use 2–3 times per week for a radiant glow.",
    },
    {
      id: "bright-serum",
      name: "Bright & Clear Serum",
      subtitle: "Vitamin-rich treatment",
      category: "serums",
      size: "30ml",
      price: 145,
      rating: 5,
      reviews: 156,
      bestseller: true,
      image: "",
      description:
        "Lightweight serum absorbs quickly to support even tone and clarity. Layer under your moisturizer morning or night.",
    },
    {
      id: "aloe-toner",
      name: "Aloe Calming Toner",
      subtitle: "Hydrating mist",
      category: "serums",
      size: "150ml",
      price: 75,
      rating: 4,
      reviews: 42,
      bestseller: false,
      image: "",
      description:
        "Refreshing aloe-based toner to soothe and prep skin before serums and creams.",
    },
    {
      id: "shea-body",
      name: "Shea Body Butter",
      subtitle: "Deep moisture",
      category: "creams",
      size: "200ml",
      price: 110,
      rating: 5,
      reviews: 67,
      bestseller: false,
      image: "",
      description:
        "Whipped shea and cocoa butter for long-lasting body hydration with a subtle natural scent.",
    },
  ];

  const state = {
    cart: loadCart(),
    filter: "all",
    search: "",
    qtyDetail: 1,
    currentProductId: null,
    homeSection: "home",
    pendingScroll: null,
    scrollSpyObserver: null,
    lastRouteName: null,
  };

  function loadCart() {
    try {
      const raw = localStorage.getItem("kek_cart");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("kek_cart", JSON.stringify(state.cart));
  }

  function getProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }

  function cartCount() {
    return state.cart.reduce((n, line) => n + line.qty, 0);
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, line) => {
      const p = getProduct(line.id);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);
  }

  function parseRoute() {
    const h = (window.location.hash || "#/home").replace(/^#\/?/, "");
    const parts = h.split("/").filter(Boolean);
    const name = parts[0] || "home";
    const param = parts[1] || null;
    return { name, param };
  }

  function whatsappUrl(text) {
    const t = encodeURIComponent(text || WHATSAPP_HELLO);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${t}`;
  }

  function syncWhatsAppLinks() {
    const url = whatsappUrl(WHATSAPP_HELLO);
    [
      document.getElementById("whatsapp-float"),
      document.getElementById("header-whatsapp"),
      document.getElementById("mobile-nav-whatsapp"),
      document.getElementById("footer-whatsapp"),
      document.getElementById("checkout-help-whatsapp"),
    ].forEach((el) => {
      if (el) el.href = url;
    });
  }

  function updateNavActive() {
    const { name, param } = parseRoute();
    let activeNav = null;
    if (name === "about") activeNav = "about";
    else if (name === "products" || (name === "product" && param))
      activeNav = "products";
    else if (name === "cart") activeNav = "cart";
    else if (name === "checkout") activeNav = "checkout";
    else if (name === "home") activeNav = state.homeSection || "home";

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const key = link.getAttribute("data-nav");
      const isActive = activeNav !== null && key === activeNav;
      link.classList.toggle("nav-link--active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const cartIcon = document.querySelector("[data-header-cart]");
    if (cartIcon) {
      const onBagFlow = name === "cart" || name === "checkout";
      cartIcon.classList.toggle("icon-btn--active", onBagFlow);
      if (onBagFlow) cartIcon.setAttribute("aria-current", "page");
      else cartIcon.removeAttribute("aria-current");
    }
  }

  function scrollToSectionId(id) {
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      state.homeSection = "home";
      updateNavActive();
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (id === "testimonials") state.homeSection = "testimonials";
      else if (id === "contact") state.homeSection = "contact";
      else state.homeSection = "home";
      updateNavActive();
    }
  }

  function setupScrollSpy() {
    if (state.scrollSpyObserver) {
      state.scrollSpyObserver.disconnect();
      state.scrollSpyObserver = null;
    }
    const { name } = parseRoute();
    if (name !== "home" || !window.IntersectionObserver) return;

    const testimonialsEl = document.getElementById("testimonials");
    const contactEl = document.getElementById("contact");
    const ratios = { testimonials: 0, contact: 0 };

    const apply = () => {
      let next = "home";
      if (ratios.contact > 0.14) next = "contact";
      else if (ratios.testimonials > 0.18) next = "testimonials";
      if (next !== state.homeSection) {
        state.homeSection = next;
        updateNavActive();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.target.id === "testimonials")
            ratios.testimonials = en.intersectionRatio;
          if (en.target.id === "contact") ratios.contact = en.intersectionRatio;
        });
        apply();
      },
      { threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.6, 1], rootMargin: "-64px 0px -20% 0px" }
    );

    if (testimonialsEl) observer.observe(testimonialsEl);
    if (contactEl) observer.observe(contactEl);
    state.scrollSpyObserver = observer;
  }

  function showPage(name) {
    document.querySelectorAll(".page").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.page === name);
    });
  }

  function renderCartBadge() {
    const n = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.classList.toggle("hidden", n === 0);
    });
  }

  function filteredProducts() {
    let list = PRODUCTS.slice();
    if (state.filter !== "all") {
      list = list.filter((p) => p.category === state.filter);
    }
    if (state.search.trim()) {
      const q = state.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }

  function renderShopGrid() {
    const container = document.getElementById("shop-grid");
    if (!container) return;
    const list = filteredProducts();
    if (list.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No products match your search.</p>';
      return;
    }
    container.innerHTML = list
      .map(
        (p) => `
      <article class="product-card" data-product-id="${p.id}">
        <div class="product-card__img">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" width="400" height="400">
        </div>
        <div class="product-card__body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="meta">${escapeHtml(p.subtitle)} · ${escapeHtml(p.size)}</p>
          <p class="price">GHC ${p.price}</p>
          <button type="button" class="btn btn-primary btn-block btn-add-shop" data-id="${p.id}">Add to cart</button>
        </div>
      </article>`
      )
      .join("");

    container.querySelectorAll(".btn-add-shop").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.id, 1);
      });
    });

    container.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const id = card.dataset.productId;
        window.location.hash = "#/product/" + id;
      });
    });
  }

  function renderBestsellers() {
    const container = document.getElementById("bestseller-grid");
    if (!container) return;
    const list = PRODUCTS.filter((p) => p.bestseller).slice(0, 3);
    container.innerHTML = list
      .map(
        (p) => `
      <article class="product-card">
        <div class="product-card__img">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" width="400" height="400">
        </div>
        <div class="product-card__body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="meta">${escapeHtml(p.subtitle)}</p>
          <button type="button" class="btn btn-primary btn-learn" data-id="${p.id}">Learn more</button>
        </div>
      </article>`
      )
      .join("");
    container.querySelectorAll(".btn-learn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.location.hash = "#/product/" + btn.dataset.id;
      });
    });
  }

  function renderProductDetail(id) {
    const p = getProduct(id);
    const root = document.getElementById("product-detail-root");
    if (!root || !p) {
      if (root)
        root.innerHTML =
          '<p class="empty-state">Product not found. <a href="#/products">Back to products</a></p>';
      return;
    }
    state.qtyDetail = 1;
    state.currentProductId = id;
    root.innerHTML = `
      <div class="pd-layout">
        <div class="pd-image-wrap">
          ${p.bestseller ? '<span class="badge-bestseller">Best Seller</span>' : ""}
          <img src="${p.image}" alt="${escapeHtml(p.name)}" width="600" height="600">
        </div>
        <div>
          <h1 class="heading-serif" style="font-size:1.75rem;margin:0 0 0.25rem">${escapeHtml(p.name)}</h1>
          <p class="muted" style="color:var(--muted);margin:0 0 0.5rem">${escapeHtml(p.subtitle)} · ${escapeHtml(p.size)}</p>
          <p class="stars" aria-label="${p.rating} out of 5 stars">${"★".repeat(p.rating)}${"☆".repeat(5 - p.rating)} <span style="font-size:0.85rem;color:var(--muted);font-family:var(--font-sans);letter-spacing:0">(${p.reviews} reviews)</span></p>
          <p class="pd-price">GHC ${p.price}</p>
          <p class="stock-ok"><span aria-hidden="true">✓</span> In stock</p>
          <div class="qty-row">
            <span style="font-weight:600">Quantity</span>
            <div class="qty-stepper" data-detail-qty>
              <button type="button" aria-label="Decrease" data-dq="-1">−</button>
              <span data-dq-val>1</span>
              <button type="button" aria-label="Increase" data-dq="1">+</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.5rem">
            <button type="button" class="btn btn-primary btn-block" id="pd-add-cart">Add to cart — GHC <span id="pd-line-total">${p.price}</span></button>
            <button type="button" class="btn btn-secondary btn-block" id="pd-buy-now">Buy now</button>
          </div>
          <div class="accordion">
            <button type="button" class="accordion-trigger" data-acc>Product description <span data-acc-icon>▼</span></button>
            <div class="accordion-panel" data-acc-panel>
              <p>${escapeHtml(p.description)}</p>
            </div>
          </div>
        </div>
      </div>`;

    const dqVal = root.querySelector("[data-dq-val]");
    const lineEl = root.querySelector("#pd-line-total");
    const updateLine = () => {
      const total = p.price * state.qtyDetail;
      if (dqVal) dqVal.textContent = String(state.qtyDetail);
      if (lineEl) lineEl.textContent = String(total);
    };

    root.querySelectorAll("[data-dq]").forEach((b) => {
      b.addEventListener("click", () => {
        const delta = parseInt(b.dataset.dq, 10);
        state.qtyDetail = Math.max(1, Math.min(99, state.qtyDetail + delta));
        updateLine();
      });
    });

    root.querySelector("#pd-add-cart")?.addEventListener("click", () => {
      addToCart(id, state.qtyDetail);
      window.location.hash = "#/cart";
    });

    root.querySelector("#pd-buy-now")?.addEventListener("click", () => {
      addToCart(id, state.qtyDetail);
      window.location.hash = "#/checkout";
    });

    const acc = root.querySelector("[data-acc]");
    const panel = root.querySelector("[data-acc-panel]");
    const icon = root.querySelector("[data-acc-icon]");
    acc?.addEventListener("click", () => {
      const open = panel.classList.toggle("is-open");
      if (icon) icon.textContent = open ? "▲" : "▼";
    });
  }

  function addToCart(id, qty) {
    const p = getProduct(id);
    if (!p) return;
    const line = state.cart.find((l) => l.id === id);
    if (line) line.qty += qty;
    else state.cart.push({ id, qty });
    saveCart();
    renderCartBadge();
    renderCartPage();
  }

  function setLineQty(id, qty) {
    const line = state.cart.find((l) => l.id === id);
    if (!line) return;
    if (qty <= 0) {
      state.cart = state.cart.filter((l) => l.id !== id);
    } else {
      line.qty = qty;
    }
    saveCart();
    renderCartBadge();
    renderCartPage();
  }

  function removeLine(id) {
    state.cart = state.cart.filter((l) => l.id !== id);
    saveCart();
    renderCartBadge();
    renderCartPage();
  }

  function renderCartPage() {
    const listEl = document.getElementById("cart-lines");
    const promoEl = document.getElementById("cart-promo");
    const subEl = document.querySelector("[data-cart-subtotal]");
    const delEl = document.querySelector("[data-cart-delivery]");
    const totEl = document.querySelector("[data-cart-total]");
    const titleCount = document.querySelector("[data-cart-title-count]");

    const sub = cartSubtotal();
    const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = sub + delivery;

    if (titleCount) titleCount.textContent = String(cartCount());

    if (promoEl) {
      if (sub === 0) {
        promoEl.classList.add("hidden");
      } else if (sub < FREE_DELIVERY_THRESHOLD) {
        promoEl.classList.remove("hidden");
        const need = FREE_DELIVERY_THRESHOLD - sub;
        promoEl.textContent = `You're GHC ${need} away from free delivery!`;
      } else {
        promoEl.classList.remove("hidden");
        promoEl.textContent = "You qualify for free delivery!";
      }
    }

    if (subEl) subEl.textContent = "GHC " + sub;
    if (delEl) delEl.textContent = delivery === 0 ? "FREE" : "GHC " + delivery;
    if (totEl) totEl.textContent = "GHC " + total;

    if (!listEl) return;

    if (state.cart.length === 0) {
      listEl.innerHTML =
        '<p class="empty-state">Your cart is empty. <a href="#/products">Shop products</a></p>';
      return;
    }

    listEl.innerHTML = state.cart
      .map((line) => {
        const p = getProduct(line.id);
        if (!p) return "";
        return `
        <div class="cart-line" data-cart-line="${p.id}">
          <div class="cart-line__img"><img src="${p.image}" alt="" width="72" height="72"></div>
          <div class="cart-line__info">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">GHC ${p.price} × ${line.qty}</p>
            <div class="qty-stepper" style="margin-top:0.5rem;width:fit-content">
              <button type="button" data-cq="${p.id}" data-delta="-1">−</button>
              <span>${line.qty}</span>
              <button type="button" data-cq="${p.id}" data-delta="1">+</button>
            </div>
          </div>
          <div class="cart-line__controls">
            <button type="button" class="cart-remove" data-remove="${p.id}" aria-label="Remove">✕</button>
          </div>
        </div>`;
      })
      .join("");

    listEl.querySelectorAll("[data-cq]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.cq;
        const delta = parseInt(btn.dataset.delta, 10);
        const line = state.cart.find((l) => l.id === id);
        if (line) setLineQty(id, line.qty + delta);
      });
    });

    listEl.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => removeLine(btn.dataset.remove));
    });

    const checkoutBtn = document.querySelector("[data-go-checkout]");
    if (checkoutBtn) {
      checkoutBtn.disabled = state.cart.length === 0;
    }
  }

  function buildWhatsAppCartUrl() {
    const sub = cartSubtotal();
    const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = sub + delivery;
    let msg = "Hello KEK Skincare! I'd like to order:\n\n";
    state.cart.forEach((line) => {
      const p = getProduct(line.id);
      if (p) msg += `• ${p.name} x${line.qty} — GHC ${p.price * line.qty}\n`;
    });
    msg += `\nSubtotal: GHC ${sub}\nDelivery: ${delivery === 0 ? "FREE" : "GHC " + delivery}\nTotal: GHC ${total}`;
    return whatsappUrl(msg);
  }

  function renderCheckoutSummary() {
    const sub = cartSubtotal();
    const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const total = sub + delivery;
    const itemsEl = document.querySelector("[data-co-items]");
    const subEl = document.querySelector("[data-co-sub]");
    const delEl = document.querySelector("[data-co-del]");
    const totEl = document.querySelector("[data-co-total]");
    const placeBtn = document.querySelector("[data-place-order]");

    if (itemsEl) {
      itemsEl.textContent =
        state.cart.length +
        " item" +
        (state.cart.length !== 1 ? "s" : "") +
        " · GHC " +
        sub;
    }
    if (subEl) subEl.textContent = "GHC " + sub;
    if (delEl) delEl.textContent = delivery === 0 ? "FREE" : "GHC " + delivery;
    if (totEl) totEl.textContent = "GHC " + total;
    if (placeBtn) {
      placeBtn.innerHTML = `🔒 Place order — GHC ${total}`;
      placeBtn.disabled = state.cart.length === 0;
    }
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function route() {
    const { name, param } = parseRoute();
    const mobilePages = ["products", "product", "cart", "checkout", "about"];
    const prev = state.lastRouteName;
    state.lastRouteName = name;

    if (name === "home") {
      showPage("home");
      closeMenu();
      if (prev && prev !== "home") {
        state.homeSection = "home";
        if (!state.pendingScroll) window.scrollTo(0, 0);
      }
    } else if (name === "about") {
      showPage("about");
      closeMenu();
    } else if (name === "products") {
      showPage("products");
      renderShopGrid();
      closeMenu();
    } else if (name === "product" && param) {
      showPage("product-detail");
      renderProductDetail(param);
      closeMenu();
    } else if (name === "cart") {
      showPage("cart");
      renderCartPage();
      closeMenu();
    } else if (name === "checkout") {
      showPage("checkout");
      renderCheckoutSummary();
      closeMenu();
    } else {
      window.location.hash = "#/home";
    }

    document.body.classList.toggle(
      "is-subpage",
      mobilePages.includes(name) || (name === "product" && param)
    );

    updateNavActive();
    setupScrollSpy();

    if (state.pendingScroll) {
      const target = state.pendingScroll;
      state.pendingScroll = null;
      setTimeout(() => scrollToSectionId(target), 120);
    }
  }

  function closeMenu() {
    const nav = document.getElementById("mobile-nav");
    nav?.classList.remove("is-open");
    nav?.setAttribute("aria-hidden", "true");
    document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    const nav = document.getElementById("mobile-nav");
    nav?.classList.add("is-open");
    nav?.setAttribute("aria-hidden", "false");
    document.getElementById("menu-toggle")?.setAttribute("aria-expanded", "true");
  }

  function bindEvents() {
    document.getElementById("menu-toggle")?.addEventListener("click", () => {
      const nav = document.getElementById("mobile-nav");
      if (nav?.classList.contains("is-open")) closeMenu();
      else openMenu();
    });

    document.getElementById("mobile-nav")?.addEventListener("click", (e) => {
      if (e.target.classList.contains("mobile-nav__backdrop")) closeMenu();
    });

    document.querySelectorAll("[data-goto]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        let path = el.getAttribute("data-goto") || "#/home";
        if (!path.startsWith("#")) path = "#" + path;
        if (!path.startsWith("#/")) path = "#/" + path.replace(/^#\/?/, "");
        const scrollTarget = el.getAttribute("data-scroll");

        if (window.location.hash === path) {
          if (scrollTarget) scrollToSectionId(scrollTarget);
          closeMenu();
          return;
        }

        state.pendingScroll = scrollTarget || null;
        window.location.hash = path;
        closeMenu();
      });
    });

    document.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("is-active"));
        pill.classList.add("is-active");
        state.filter = pill.dataset.filter || "all";
        renderShopGrid();
      });
    });

    const searchInput = document.getElementById("shop-search");
    searchInput?.addEventListener("input", () => {
      state.search = searchInput.value;
      renderShopGrid();
    });

    document.querySelector("[data-go-checkout]")?.addEventListener("click", () => {
      if (state.cart.length === 0) return;
      window.location.hash = "#/checkout";
    });

    document.querySelector("[data-whatsapp-cart]")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (state.cart.length === 0) return;
      window.open(buildWhatsAppCartUrl(), "_blank", "noopener,noreferrer");
    });

    document.getElementById("checkout-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = e.target;
      let ok = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const wrap = field.closest(".field");
        let err = wrap?.querySelector(".error-msg");
        if (!field.value.trim()) {
          ok = false;
          if (!err) {
            err = document.createElement("p");
            err.className = "error-msg";
            wrap.appendChild(err);
          }
          err.textContent = "This field is required.";
        } else if (err) {
          err.remove();
        }
      });
      if (!ok) return;
      const sub = cartSubtotal();
      const delivery = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const total = sub + delivery;
      alert(
        "Thank you! Your order total is GHC " +
          total +
          ". In a real store this would connect to Mobile Money or your payment provider."
      );
      state.cart = [];
      saveCart();
      renderCartBadge();
      window.location.hash = "#/home";
    });

    document.querySelector("[data-search-toggle]")?.addEventListener("click", () => {
      window.location.hash = "#/products";
      setTimeout(() => document.getElementById("shop-search")?.focus(), 200);
    });

    window.addEventListener("hashchange", route);

    window.addEventListener("pageshow", () => {
      syncWhatsAppLinks();
    });
  }

  function initInstaGrid() {
    const grid = document.getElementById("insta-grid");
    if (!grid) return;
    const urls =
      (window.KEK_MEDIA && window.KEK_MEDIA.instaUrls) ||
      [FALLBACK_PRODUCT_IMG];
    grid.innerHTML = urls
      .map(
        (u) =>
          `<img src="${u}" alt="" loading="lazy" width="320" height="320">`
      )
      .join("");
  }

  function initLaunchModal() {
    const modal = document.getElementById("launch-modal");
    if (!modal) return;

    function closeModal() {
      modal.classList.remove("is-visible");
      try {
        localStorage.setItem(LAUNCH_POPUP_KEY, "1");
      } catch (_) {}
      window.setTimeout(() => {
        modal.setAttribute("hidden", "");
        modal.setAttribute("aria-hidden", "true");
      }, 320);
    }

    function openModal() {
      modal.removeAttribute("hidden");
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => modal.classList.add("is-visible"));
    }

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(LAUNCH_POPUP_KEY) === "1";
    } catch (_) {}

    if (!dismissed) window.setTimeout(openModal, 500);

    modal.querySelectorAll("[data-launch-close]").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    modal.querySelector("[data-launch-shop]")?.addEventListener("click", () => {
      closeModal();
      window.location.hash = "#/products";
    });

    const copyBtn = document.getElementById("launch-copy-code");
    copyBtn?.addEventListener("click", () => {
      const code = copyBtn.getAttribute("data-code") || "KEKLAUNCH15";
      const revert = () => {
        copyBtn.textContent = code;
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(code)
          .then(() => {
            copyBtn.textContent = "Copied!";
            window.setTimeout(revert, 2000);
          })
          .catch(revert);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-visible")) {
        e.preventDefault();
        closeModal();
      }
    });
  }

  function init() {
    if (!window.location.hash || window.location.hash === "#") {
      window.location.hash = "#/home";
    }
    hydrateProductImages();
    syncWhatsAppLinks();
    renderBestsellers();
    renderCartBadge();
    renderCartPage();
    renderShopGrid();
    bindEvents();
    initInstaGrid();
    initLaunchModal();
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
