/* =========================================================
   Bottega Ferri — prototipo frontend (nessun backend)
   Tutto ciò che sarebbe server (ordini, pagamenti, WhatsApp/SMS)
   è simulato nel browser e salvato in localStorage.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const hasGsap = typeof window.gsap !== "undefined";
  const hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover)").matches;
  const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
  const fmt = (n) => eur.format(Math.round(n * 100) / 100);
  const IMG = (id) => (window.__IMGS && window.__IMGS[id]) || `img/${id}.jpg`;

  const store = {
    get(k, d) { try { const v = localStorage.getItem("bf_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("bf_" + k, JSON.stringify(v)); } catch { /* storage non disponibile */ } },
  };

  /* ---------------- Immagini ---------------- */
  function loadImg(img) {
    const host = img.parentElement;
    host.classList.add("ph-host");
    img.decoding = "async";
    if (!img.closest(".hero")) img.loading = "lazy";
    img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true });
    img.src = IMG(img.dataset.img);
  }
  const hydrateImages = (root = document) => $$("img[data-img]:not([src])", root).forEach(loadImg);

  /* grana fotografica generata (niente SVG) */
  (function noise() {
    const c = document.createElement("canvas"); c.width = c.height = 140;
    const x = c.getContext("2d"); const d = x.createImageData(140, 140);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    document.documentElement.style.setProperty("--noise", `url(${c.toDataURL()})`);
  })();

  /* ---------------- Dati ---------------- */
  const CATS = [
    { k: "elettro", label: "Elettroutensili", img: "1504148455328-c376907d081c" },
    { k: "manuali", label: "Utensili manuali", img: "1508873535684-277a3cbcc4e8" },
    { k: "viteria", label: "Viteria e fissaggio", img: "1581244277943-fe4a9c777189" },
    { k: "legno", label: "Legno e taglio", img: "1513467535987-fd81bc7d62f8" },
    { k: "organizza", label: "Organizzazione", img: "1426927308491-6380b6a9936f" },
    { k: "kit", label: "Kit fai da te", img: "1597484661643-2f5fef640dd1" },
    { k: "#chiavi", label: "Duplicazione chiavi", img: "1567361808960-dec9cb578182", note: "Su misura" },
    { k: "#officina", label: "Noleggio e officina", img: "1558618666-fcd25c85cd64", note: "Servizi" },
  ];

  const PRODUCTS = [
    { id: "p1", cat: "elettro", name: "Trapano avvitatore 18V brushless", price: 149, was: 179, stock: 4, img: "1504148455328-c376907d081c", opts: [["2 × 2 Ah", 0], ["2 × 4 Ah", 40]] },
    { id: "p2", cat: "elettro", name: "Trapano avvitatore compatto 18V", price: 129, stock: 2, img: "1572981779307-38b8cabb2407" },
    { id: "p3", cat: "elettro", name: "Smerigliatrice angolare", price: 89.9, stock: 6, img: "1504917595217-d4dc5ebe6122", opts: [["115 mm", 0], ["125 mm", 10]] },
    { id: "p4", cat: "legno", name: "Sega circolare 190 mm", price: 179, stock: 1, img: "1513467535987-fd81bc7d62f8" },
    { id: "p5", cat: "manuali", name: "Martello da carpentiere, manico in legno", price: 24.5, stock: 14, img: "1586864387967-d02ef85d93e8", opts: [["450 g", 0], ["600 g", 3]] },
    { id: "p6", cat: "manuali", name: "Set pinze, martello e metro", price: 39.9, was: 49.9, stock: 8, img: "1567361808960-dec9cb578182" },
    { id: "p7", cat: "legno", name: "Troncatrice radiale 210 mm", price: 219, stock: 3, img: "1505798577917-a65157d3320a" },
    { id: "p8", cat: "viteria", name: "Inserti per avvitatore, set 32 pezzi", price: 18.9, stock: 40, img: "1581244277943-fe4a9c777189", opts: [["Standard", 0], ["Impact", 6]] },
    { id: "p9", cat: "viteria", name: "Chiodi assortiti con martello e pinza", price: 22.5, stock: 25, img: "1581783898377-1c85bf937427" },
    { id: "p10", cat: "kit", name: "Kit fai da te casa, 48 pezzi", price: 69, was: 85, stock: 5, img: "1597484661643-2f5fef640dd1" },
    { id: "p11", cat: "organizza", name: "Pannello portautensili da parete", price: 34, stock: 7, img: "1426927308491-6380b6a9936f" },
    { id: "p12", cat: "manuali", name: "Pinze e martello, set officina", price: 19.9, stock: 11, img: "1508873535684-277a3cbcc4e8" },
  ];

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      if (hasST) lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  if (hasST) gsap.registerPlugin(window.ScrollTrigger);

  const scrollToEl = (el) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.4 });
    else el.scrollIntoView({ behavior: "smooth" });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const t = $(a.getAttribute("href"));
    if (t) { e.preventDefault(); scrollToEl(t); }
  }));

  let locks = 0;
  const lock = (on) => {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.body.classList.toggle("is-locked", locks > 0);
    if (lenis) locks > 0 ? lenis.stop() : lenis.start();
  };

  /* ---------------- Saracinesca ---------------- */
  const shutter = $("#shutter");
  function openShutter() {
    if (!shutter || shutter.dataset.done) return;
    shutter.dataset.done = 1;
    const done = () => { shutter.remove(); heroIntro(); };
    if (hasGsap && !reduce) {
      gsap.timeline({ onComplete: done })
        .to(shutter, { y: 14, duration: 0.18, ease: "power2.out" })
        .to(shutter, { yPercent: -100, duration: 1.15, ease: "power3.inOut" });
    } else { done(); }
  }
  if (shutter) {
    lock(true);
    setTimeout(() => $(".shutter__sign", shutter).classList.add("is-on"), 250);
    setTimeout(() => { lock(false); openShutter(); }, reduce ? 0 : 1500);
    shutter.addEventListener("click", () => { lock(false); openShutter(); }, { once: true });
  }

  function heroIntro() {
    const words = $$("#heroTitle .line > *");
    if (hasGsap && !reduce) {
      gsap.from(words, { yPercent: 115, rotate: 4, duration: 1.1, ease: "power4.out", stagger: 0.08 });
      gsap.from([".hero__lead", ".hero__cta", ".hero__specs", ".hero .eyebrow"], { opacity: 0, y: 24, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.35 });
    }
    $$("[data-count]").forEach((el) => {
      const to = +el.dataset.count; const t0 = performance.now(); const dur = 1600;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(to * e).toLocaleString("it-IT");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------------- Aperto ora (ora di Roma) ---------------- */
  (function openNow() {
    const el = $("#openNow");
    const parts = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    const day = get("weekday").toLowerCase(); const m = +get("hour") * 60 + +get("minute");
    const am = m >= 480 && m < 750; const pm = m >= 870 && m < 1140;
    const open = day.startsWith("dom") ? false : day.startsWith("sab") ? am : am || pm;
    el.classList.toggle("is-open", open);
    $("b", el).textContent = open ? "Aperto ora" : "Chiuso · ordina online";
  })();

  /* ---------------- Loop di scroll: nav, parallax ---------------- */
  const nav = $("#nav");
  const heroImg = $(".hero__img"), heroTitle = $("#heroTitle"), hero = $("#hero");
  const footWord = $(".footer__word");
  const parallax = [
    { el: $(".config__bg"), k: 0.12 },
    { el: $(".workshop__media img"), k: 0.1 },
  ];
  let lastY = window.scrollY, vel = 0;

  function onScrollFrame() {
    const y = window.scrollY;
    vel = y - lastY; lastY = y;


    nav.classList.toggle("is-solid", y > 60);
    nav.classList.toggle("is-hidden", y > 400 && vel > 2);
    if (vel < -2) nav.classList.remove("is-hidden");

    // hero: l'immagine scende più lenta, il titolo viene "stretto in morsa"
    const hp = Math.min(1, y / (hero.offsetHeight || 1));
    if (heroImg) heroImg.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + hp * 0.06})`;
    if (heroTitle) {
      heroTitle.style.fontStretch = (100 - hp * 38).toFixed(1) + "%";
      heroTitle.style.letterSpacing = (-0.03 + hp * 0.02).toFixed(3) + "em";
    }

    parallax.forEach(({ el, k }) => {
      if (!el) return;
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      el.style.transform = `translate3d(0, ${(r.top - innerHeight / 2) * -k}px, 0)`;
    });

    if (footWord) {
      const r = footWord.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight * 0.6)));
      footWord.style.setProperty("--fill", (f * 100).toFixed(1) + "%");
    }

  }

  // torcia nella hero
  const torch = $("#torch");
  let lx = 0.65, ly = 0.4, gx = 0.65, gy = 0.4, torchUser = false;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    gx = (e.clientX - r.left) / r.width; gy = (e.clientY - r.top) / r.height; torchUser = true;
  });
  hero.addEventListener("pointerleave", () => { torchUser = false; });

  function frame(t) {
    onScrollFrame();
    if (!torchUser) { gx = 0.55 + Math.sin(t / 2400) * 0.22; gy = 0.42 + Math.cos(t / 1900) * 0.14; }
    lx += (gx - lx) * 0.08; ly += (gy - ly) * 0.08;
    torch.style.setProperty("--x", (lx * 100).toFixed(2) + "%");
    torch.style.setProperty("--y", (ly * 100).toFixed(2) + "%");
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------------- Nastro di cantiere (marquee guidato dallo scroll) ---------------- */
  const marquees = $$("[data-marquee]").map((track) => {
    track.innerHTML += track.innerHTML + track.innerHTML;
    return { track, x: 0, dir: +(track.dataset.dir || 1) };
  });
  (function mq() {
    marquees.forEach((m) => {
      const w = m.track.scrollWidth / 3;
      m.x -= (0.6 + Math.min(12, Math.abs(vel) * 0.25)) * m.dir;
      if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
      m.track.style.transform = `translate3d(${m.x}px,0,0)`;
    });
    requestAnimationFrame(mq);
  })();

  /* ---------------- Cassettiera ---------------- */
  const cabinet = $("#cabinet");
  cabinet.innerHTML = CATS.map((c) => {
    const n = PRODUCTS.filter((p) => p.cat === c.k).length;
    return `<button class="unit" data-k="${c.k}" aria-label="${c.label}">
      <div class="unit__inside"><img data-img="${c.img}" data-w="800" alt=""></div>
      <span class="unit__count">${c.note || n + (n === 1 ? " articolo" : " articoli")}</span>
      <span class="unit__go">Apri →</span>
      <div class="unit__front"><div class="label-holder"><span>${c.label}</span></div><div class="pull"></div></div>
    </button>`;
  }).join("");
  $$(".unit", cabinet).forEach((u) => u.addEventListener("click", () => {
    if (!canHover && !u.classList.contains("is-open")) {
      $$(".unit.is-open", cabinet).forEach((o) => o.classList.remove("is-open"));
      u.classList.add("is-open"); return;
    }
    const k = u.dataset.k;
    if (k === "#chiavi") { switchTab("key"); scrollToEl($("#su-misura")); return; }
    if (k.startsWith("#")) { scrollToEl($(k)); return; }
    setFilter(k); scrollToEl($("#bancone"));
  }));

  /* ---------------- Negozio ---------------- */
  const productsEl = $("#products"), filtersEl = $("#filters");
  const usedCats = CATS.filter((c) => PRODUCTS.some((p) => p.cat === c.k));
  filtersEl.innerHTML = `<button class="chip is-active" data-f="all">Tutto</button>` +
    usedCats.map((c) => `<button class="chip" data-f="${c.k}">${c.label}</button>`).join("");
  filtersEl.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) setFilter(b.dataset.f); });

  productsEl.innerHTML = PRODUCTS.map((p) => `
    <article class="card" data-cat="${p.cat}" data-id="${p.id}">
      <div class="card__media">
        <img data-img="${p.img}" data-w="900" alt="${p.name}">
        <span class="card__stock ${p.stock <= 2 ? "is-low" : ""}"><i></i>${p.stock === 1 ? "Ultimo pezzo" : p.stock <= 2 ? "Ultimi " + p.stock + " pz" : p.stock + " pz al banco"}</span>
      </div>
      <div class="tag"><div class="tag__body">${p.was ? `<small>${fmt(p.was)}</small>` : ""}<span data-price>${fmt(p.price)}</span></div></div>
      <div class="card__body">
        <div>
          <div class="card__cat">${CATS.find((c) => c.k === p.cat).label}</div>
          <h3 class="card__name">${p.name}</h3>
        </div>
        <button class="add" aria-label="Aggiungi ${p.name} al carrello">+</button>
      </div>
      ${p.opts ? `<div class="card__opts">${p.opts.map((o, i) => `<button class="mini ${i ? "" : "is-active"}" data-o="${i}">${o[0]}</button>`).join("")}</div>` : ""}
    </article>`).join("");

  productsEl.addEventListener("click", (e) => {
    const card = e.target.closest(".card"); if (!card) return;
    const p = PRODUCTS.find((x) => x.id === card.dataset.id);
    const mini = e.target.closest(".mini");
    if (mini) {
      $$(".mini", card).forEach((m) => m.classList.toggle("is-active", m === mini));
      $("[data-price]", card).textContent = fmt(p.price + p.opts[+mini.dataset.o][1]);
      const tag = $(".tag", card); tag.style.animation = "none"; void tag.offsetWidth; tag.style.animation = "swing 1.4s cubic-bezier(.2,.8,.2,1)";
      return;
    }
    const add = e.target.closest(".add");
    if (add) {
      const oi = p.opts ? +$(".mini.is-active", card).dataset.o : -1;
      const opt = oi >= 0 ? p.opts[oi] : null;
      addToCart({ id: p.id + (opt ? "-" + oi : ""), name: p.name, meta: opt ? opt[0] : "", price: p.price + (opt ? opt[1] : 0), img: p.img }, $("img", card));
      add.classList.add("is-done"); add.textContent = "✓";
      setTimeout(() => { add.classList.remove("is-done"); add.textContent = "+"; }, 1400);
    }
  });

  function setFilter(f) {
    $$(".chip", filtersEl).forEach((c) => c.classList.toggle("is-active", c.dataset.f === f));
    const cards = $$(".card", productsEl);
    const apply = () => cards.forEach((c) => c.classList.toggle("is-out", f !== "all" && c.dataset.cat !== f));
    if (hasGsap && !reduce) {
      gsap.to(productsEl, { opacity: 0, y: 12, duration: 0.2, onComplete: () => {
        apply(); if (hasST) ScrollTrigger.refresh();
        gsap.to(productsEl, { opacity: 1, y: 0, duration: 0.4 });
        gsap.from($$(".card:not(.is-out)", productsEl), { y: 30, opacity: 0, stagger: 0.05, duration: 0.6, ease: "power3.out" });
      } });
    } else apply();
  }

  /* ---------------- Carrello ---------------- */
  let cart = store.get("cart", []);
  const FREE = 79;
  const cartBtn = $("#cartBtn"), drawer = $("#drawer"), scrim = $("#scrim");
  const subtotal = () => cart.reduce((s, l) => s + l.price * l.qty, 0);

  function addToCart(item, fromImg) {
    const ex = cart.find((l) => l.id === item.id);
    if (ex) ex.qty++; else cart.push({ ...item, qty: 1 });
    store.set("cart", cart);
    flyTo(fromImg, item);
  }
  function flyTo(fromEl, item) {
    const target = cartBtn.getBoundingClientRect();
    const r = fromEl ? fromEl.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 64, height: 64 };
    const f = document.createElement(fromEl && fromEl.tagName === "IMG" && fromEl.complete && fromEl.naturalWidth ? "img" : "div");
    f.className = "flyer"; if (f.tagName === "IMG") f.src = fromEl.src;
    document.body.appendChild(f);
    const sx = r.left + r.width / 2 - 32, sy = r.top + r.height / 2 - 32;
    const ex = target.left + target.width / 2 - 32, ey = target.top + target.height / 2 - 32;
    const anim = f.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(1.4) rotate(0)`, opacity: 1 },
      { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 140}px) scale(1) rotate(-200deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${ex}px, ${ey}px) scale(.2) rotate(-420deg)`, opacity: 0.4 },
    ], { duration: reduce ? 1 : 850, easing: "cubic-bezier(.5,0,.3,1)" });
    anim.onfinish = () => { f.remove(); renderCart(); cartBtn.classList.remove("is-bump"); void cartBtn.offsetWidth; cartBtn.classList.add("is-bump"); };
  }

  function renderCart() {
    const n = cart.reduce((s, l) => s + l.qty, 0);
    $("#cartCount").textContent = n;
    const list = $("#cartList");
    if (!cart.length) {
      list.innerHTML = `<div class="empty"><b>Il sacchetto è vuoto</b>Aggiungi qualcosa dal bancone o componi un kit su misura.</div>`;
    } else {
      list.innerHTML = cart.map((l, i) => `
        <div class="line">
          <div class="line__img">${l.img ? `<img src="${IMG(l.img)}" alt="" onerror="this.remove()">` : (l.badge || "BF")}</div>
          <div><div class="line__name">${l.name}</div>${l.meta ? `<div class="line__meta">${l.meta}</div>` : ""}
            <div class="line__ctrl"><button data-i="${i}" data-d="-1" aria-label="Diminuisci">−</button><span>${l.qty}</span><button data-i="${i}" data-d="1" aria-label="Aumenta">+</button></div></div>
          <div class="line__price">${fmt(l.price * l.qty)}</div>
        </div>`).join("");
    }
    const s = subtotal();
    $("#cartTotal").textContent = fmt(s);
    $("#freeFill").style.width = Math.min(100, (s / FREE) * 100) + "%";
    $("#freeText").textContent = s >= FREE ? "Consegna in giornata gratuita ✓" : `Ancora ${fmt(FREE - s)} per la consegna gratis`;
    $("#toCheckout").disabled = !cart.length;
    $("#toCheckout").style.opacity = cart.length ? 1 : 0.4;
  }
  $("#cartList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    const l = cart[+b.dataset.i]; l.qty += +b.dataset.d;
    if (l.qty <= 0) cart.splice(+b.dataset.i, 1);
    store.set("cart", cart); renderCart();
  });

  const panels = { drawer, sheet: $("#sheet"), owner: $("#owner") };
  let openPanel = null;
  function show(name) {
    if (openPanel) hide(true);
    openPanel = name; panels[name].classList.add("is-on"); panels[name].setAttribute("aria-hidden", "false");
    scrim.classList.add("is-on"); lock(true);
  }
  function hide(keepScrim) {
    if (!openPanel) return;
    panels[openPanel].classList.remove("is-on"); panels[openPanel].setAttribute("aria-hidden", "true");
    openPanel = null; lock(false);
    if (!keepScrim) scrim.classList.remove("is-on");
  }
  cartBtn.addEventListener("click", () => { renderCart(); show("drawer"); });
  scrim.addEventListener("click", () => hide());
  $$("[data-close]").forEach((b) => b.addEventListener("click", () => hide()));
  addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); });

  /* ---------------- Contachilometri dei prezzi ---------------- */
  function odometer(el, value) {
    const str = fmt(value).replace("€", "").trim();
    if (el.dataset.len !== String(str.length)) {
      el.dataset.len = str.length;
      el.innerHTML = `<span class="cur">€</span>` + [...str].map((ch) => /\d/.test(ch)
        ? `<span class="odo-digit"><span>${[...Array(10).keys()].map((d) => `<span>${d}</span>`).join("")}</span></span>`
        : `<span>${ch}</span>`).join("");
    }
    const cols = $$(".odo-digit > span", el); let k = 0;
    [...str].forEach((ch) => { if (/\d/.test(ch)) cols[k++].style.transform = `translateY(-${+ch}em)`; });
  }

  /* ---------------- Configuratore: tab ---------------- */
  function switchTab(name) {
    $$(".tab").forEach((t) => { const on = t.dataset.tab === name; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    $$(".panel").forEach((p) => { const on = p.dataset.panel === name; p.classList.toggle("is-active", on); p.hidden = !on; });
    if (name === "cut") requestAnimationFrame(renderCut);
    if (hasST) ScrollTrigger.refresh();
  }
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

  /* ---------------- Kit in valigetta ---------------- */
  const CASES = [
    { k: "tela", n: "Borsa in tela", p: 29, sw: "linear-gradient(135deg,#8c7a58,#5d4f36)" },
    { k: "metal", n: "Cassetta metallo", p: 45, sw: "linear-gradient(135deg,#b3341d,#7c200f)" },
    { k: "trolley", n: "Trolley modulare", p: 89, sw: "linear-gradient(135deg,#2e3033,#141516); box-shadow: inset 0 -4px 0 #ffc21a" },
  ];
  const TOOLS = [
    { k: "trapano", n: "Trapano 18V", p: 129, area: "1 / 1 / 3 / 3" },
    { k: "livella", n: "Livella 60 cm", p: 16, area: "1 / 3 / 2 / 6", c: "steel" },
    { k: "pinza", n: "Pinza universale", p: 12, area: "1 / 6 / 2 / 7", c: "red" },
    { k: "martello", n: "Martello 600 g", p: 14, area: "2 / 3 / 3 / 5", c: "steel" },
    { k: "cacciaviti", n: "Cacciaviti × 6", p: 22, area: "2 / 5 / 3 / 7" },
    { k: "metro", n: "Metro 5 m", p: 9, area: "3 / 1 / 4 / 2" },
    { k: "regolabile", n: "Chiave regolabile", p: 15, area: "3 / 2 / 4 / 4", c: "steel" },
    { k: "cutter", n: "Cutter", p: 7, area: "3 / 4 / 4 / 5", c: "red" },
    { k: "brugole", n: "Brugole × 9", p: 11, area: "3 / 5 / 4 / 7", c: "steel" },
  ];
  const kit = { case: "metal", tools: new Set(["martello", "metro"]), engrave: "" };
  $("#caseChoices").innerHTML = CASES.map((c) => `<button class="choice ${c.k === kit.case ? "is-active" : ""}" data-k="${c.k}"><span class="choice__sw" style="background:${c.sw}"></span><b>${c.n}</b><small>${fmt(c.p)}</small></button>`).join("");
  $("#toolPick").innerHTML = TOOLS.map((t) => `<button class="tp" data-k="${t.k}" aria-pressed="false">${t.n}<i>${fmt(t.p)}</i></button>`).join("");
  $("#foam").innerHTML = TOOLS.map((t) => `<div class="slot" data-k="${t.k}" style="grid-area:${t.area}">${t.n}<div class="slot__tool ${t.c ? "slot__tool--" + t.c : ""}">${t.n}</div></div>`).join("");

  function kitPrice() {
    const tools = [...kit.tools].reduce((s, k) => s + TOOLS.find((t) => t.k === k).p, 0);
    const disc = kit.tools.size >= 3 ? tools * 0.1 : 0;
    return { total: CASES.find((c) => c.k === kit.case).p + tools - disc + (kit.engrave ? 5 : 0), disc };
  }
  function renderKit() {
    $("#case").dataset.case = kit.case;
    $$("#caseChoices .choice").forEach((b) => b.classList.toggle("is-active", b.dataset.k === kit.case));
    $$("#toolPick .tp").forEach((b) => { const on = kit.tools.has(b.dataset.k); b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", on); });
    $$("#foam .slot").forEach((s) => s.classList.toggle("is-filled", kit.tools.has(s.dataset.k)));
    $("#slotInfo").textContent = `${kit.tools.size} / ${TOOLS.length} sagome`;
    const { total, disc } = kitPrice();
    $("#kitSave").textContent = disc ? `Sconto kit −10%: risparmi ${fmt(disc)}` : "Con 3+ attrezzi: −10%";
    odometer($("#kitTotal"), total);
  }
  $("#caseChoices").addEventListener("click", (e) => { const b = e.target.closest(".choice"); if (b) { kit.case = b.dataset.k; renderKit(); } });
  $("#toolPick").addEventListener("click", (e) => {
    const b = e.target.closest(".tp"); if (!b) return;
    kit.tools.has(b.dataset.k) ? kit.tools.delete(b.dataset.k) : kit.tools.add(b.dataset.k); renderKit();
  });
  const engraveInput = $("#engraveInput"), plate = $("#plate");
  let engraveT;
  engraveInput.addEventListener("input", () => {
    kit.engrave = engraveInput.value.trim();
    $("#plateText").textContent = kit.engrave || "IL TUO NOME";
    $("#engraveCount").textContent = `${engraveInput.value.length}/18`;
    clearTimeout(engraveT);
    engraveT = setTimeout(() => { plate.classList.remove("is-engraved"); void plate.offsetWidth; plate.classList.add("is-engraved"); }, 350);
    renderKit();
  });
  $("#kitAdd").addEventListener("click", (e) => {
    if (!kit.tools.size) { toast("sms", "Kit vuoto", "Scegli almeno un attrezzo da mettere nella valigetta."); return; }
    const c = CASES.find((x) => x.k === kit.case);
    const names = [...kit.tools].map((k) => TOOLS.find((t) => t.k === k).n);
    addToCart({ id: "kit-" + Date.now(), name: `Kit su misura · ${c.n}`, meta: names.join(", ") + (kit.engrave ? ` · incisione “${kit.engrave}”` : ""), price: kitPrice().total, badge: "KIT" }, e.currentTarget);
  });
  renderKit();

  /* ---------------- Taglio legno ---------------- */
  const MATS = [
    { k: "betulla", n: "Multistrato betulla", r: 38 },
    { k: "mdf", n: "MDF grezzo", r: 14 },
    { k: "abete", n: "Abete lamellare", r: 32 },
  ];
  const THICK = { 12: 0.75, 18: 1, 25: 1.35 };
  const cut = { mat: "betulla", w: 120, h: 60, t: 18, q: 1 };
  $("#matChoices").innerHTML = MATS.map((m) => `<button class="choice ${m.k === cut.mat ? "is-active" : ""}" data-k="${m.k}"><b>${m.n}</b><small>${fmt(m.r)}/m²</small></button>`).join("");
  const cutPrice = () => {
    const m = MATS.find((x) => x.k === cut.mat);
    return (cut.w * cut.h / 10000) * m.r * THICK[cut.t] * cut.q + 1.5 * 2 * cut.q;
  };
  function renderCut() {
    const wrap = $("#boardWrap"), board = $("#board");
    board.dataset.mat = cut.mat;
    const aw = wrap.clientWidth - 70, ah = wrap.clientHeight - 60;
    const s = Math.min(aw / 244, ah / 122);
    const ghost = $("#sheetGhost");
    ghost.style.width = 244 * s + "px"; ghost.style.height = 122 * s + "px";
    board.style.width = Math.max(14, cut.w * s) + "px";
    board.style.height = Math.max(14, cut.h * s) + "px";
    const bw = Math.max(14, cut.w * s), bh = Math.max(14, cut.h * s);
    Object.assign($(".dim--w").style, { left: ghost.offsetLeft + "px", width: bw + "px", top: ghost.offsetTop - 26 + "px", right: "auto" });
    Object.assign($(".dim--h").style, { top: ghost.offsetTop + "px", height: bh + "px", left: ghost.offsetLeft - 36 + "px", bottom: "auto" });
    $("#dimW").textContent = cut.w + " cm"; $("#dimH").textContent = cut.h + " cm";
    $("#cutWOut").textContent = cut.w + " cm"; $("#cutHOut").textContent = cut.h + " cm";
    $$("#matChoices .choice").forEach((b) => b.classList.toggle("is-active", b.dataset.k === cut.mat));
    $$("#thick button").forEach((b) => b.classList.toggle("is-active", +b.dataset.t === cut.t));
    $("#cutQty span").textContent = cut.q;
    $("#cutInfo").textContent = `${((cut.w * cut.h * cut.q) / 10000).toFixed(2).replace(".", ",")} m² · ${cut.q * 2} tagli`;
    odometer($("#cutTotal"), cutPrice());
  }
  $("#matChoices").addEventListener("click", (e) => { const b = e.target.closest(".choice"); if (b) { cut.mat = b.dataset.k; renderCut(); } });
  $("#cutW").addEventListener("input", (e) => { cut.w = +e.target.value; renderCut(); });
  $("#cutH").addEventListener("input", (e) => { cut.h = +e.target.value; renderCut(); });
  $("#thick").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { cut.t = +b.dataset.t; renderCut(); } });
  $("#cutQty").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { cut.q = Math.max(1, Math.min(20, cut.q + +b.dataset.d)); renderCut(); } });
  addEventListener("resize", () => { if (!$('[data-panel="cut"]').hidden) renderCut(); });

  $("#cutAdd").addEventListener("click", (e) => {
    const btn = e.currentTarget, saw = $("#saw"), dust = $("#dust"), board = $("#board");
    btn.disabled = true;
    const m = MATS.find((x) => x.k === cut.mat);
    const finish = () => {
      btn.disabled = false;
      addToCart({ id: `cut-${cut.mat}-${cut.w}x${cut.h}x${cut.t}`, name: `Pannello ${m.n} su misura`, meta: `${cut.w} × ${cut.h} cm · ${cut.t} mm · ${cut.q} pz`, price: cutPrice() / cut.q, badge: "CUT" }, board);
      const l = cart.find((x) => x.id === `cut-${cut.mat}-${cut.w}x${cut.h}x${cut.t}`);
      if (l && cut.q > 1) { l.qty += cut.q - 1; store.set("cart", cart); }
    };
    if (reduce) return finish();
    saw.animate([{ left: "-6px", opacity: 1 }, { left: "calc(100% + 6px)", opacity: 1 }], { duration: 1100, easing: "cubic-bezier(.6,0,.4,1)" });
    let n = 0;
    const iv = setInterval(() => {
      for (let i = 0; i < 4; i++) {
        const d = document.createElement("i");
        const x = (n / 22) * 100;
        d.style.left = x + "%"; d.style.top = Math.random() * 100 + "%";
        dust.appendChild(d);
        d.animate([{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${(Math.random() - 0.3) * 60}px, ${40 + Math.random() * 60}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => d.remove();
      }
      if (++n > 22) { clearInterval(iv); setTimeout(finish, 200); }
    }, 50);
  });

  /* ---------------- Chiavi ---------------- */
  const KEYS = [
    { k: "normale", n: "Cilindro", p: 3.5 },
    { k: "sicurezza", n: "Sicurezza", p: 18 },
    { k: "auto", n: "Auto, senza chip", p: 12 },
  ];
  const KCOL = [["#2f6fd6", "Blu"], ["#c4501b", "Rosso"], ["#2f9e5b", "Verde"], ["#ffc21a", "Giallo"], ["#2b2b2b", "Nero"], ["#b88a3b", "Ottone"]];
  const key = { type: "normale", col: KCOL[0][0], q: 1 };
  $("#keyTypes").innerHTML = KEYS.map((k) => `<button class="choice ${k.k === key.type ? "is-active" : ""}" data-k="${k.k}"><b>${k.n}</b><small>${fmt(k.p)} cad.</small></button>`).join("");
  $("#keyColors").innerHTML = KCOL.map(([c, n], i) => `<button class="sw ${i ? "" : "is-active"}" data-c="${c}" style="background:${c}" aria-label="${n}"></button>`).join("");
  function renderKey(shuffle) {
    const shape = $("#keyShape");
    shape.dataset.type = key.type; shape.style.setProperty("--kc", key.col);
    if (shuffle) {
      $$(".key__blade i", shape).forEach((i) => { i.style.height = (key.type === "normale" ? 6 + Math.random() * 14 : key.type === "auto" ? 4 + Math.random() * 6 : 5 + Math.random() * 6) + "px"; });
      shape.animate([{ transform: "rotate(-14deg)" }, { transform: "rotate(-4deg) scale(1.04)" }, { transform: "rotate(-14deg)" }], { duration: 600, easing: "cubic-bezier(.3,1.4,.5,1)" });
    }
    $$("#keyTypes .choice").forEach((b) => b.classList.toggle("is-active", b.dataset.k === key.type));
    $$("#keyColors .sw").forEach((b) => b.classList.toggle("is-active", b.dataset.c === key.col));
    $("#keyQty span").textContent = key.q; $("#keyCount").textContent = "× " + key.q;
    odometer($("#keyTotal"), KEYS.find((k) => k.k === key.type).p * key.q);
  }
  $("#keyTypes").addEventListener("click", (e) => { const b = e.target.closest(".choice"); if (b) { key.type = b.dataset.k; renderKey(true); } });
  $("#keyColors").addEventListener("click", (e) => { const b = e.target.closest(".sw"); if (b) { key.col = b.dataset.c; renderKey(); } });
  $("#keyQty").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { key.q = Math.max(1, Math.min(10, key.q + +b.dataset.d)); renderKey(); } });
  $("#keyAdd").addEventListener("click", () => {
    const t = KEYS.find((k) => k.k === key.type), c = KCOL.find((x) => x[0] === key.col)[1];
    const id = `key-${key.type}-${c}`;
    const ex = cart.find((l) => l.id === id);
    if (ex) ex.qty += key.q; else cart.push({ id, name: `Duplicato chiave ${t.n.toLowerCase()}`, meta: `Testa ${c.toLowerCase()} · foto chiave al checkout`, price: t.p, qty: key.q, badge: "KEY" });
    store.set("cart", cart);
    flyTo($("#keyShape"), {});
  });
  renderKey(true);

  /* ---------------- Scintille in officina ---------------- */
  (function sparks() {
    const cv = $("#sparks"), media = cv.parentElement, ctx = cv.getContext("2d");
    let W, H, on = false, parts = [], ex = 0.42, ey = 0.58, tex = ex, tey = ey;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { W = media.clientWidth; H = media.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    media.addEventListener("pointermove", (e) => { const r = media.getBoundingClientRect(); tex = (e.clientX - r.left) / r.width; tey = (e.clientY - r.top) / r.height; });
    new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on) requestAnimationFrame(tick); }, { threshold: 0.1 }).observe(media);
    function tick() {
      if (!on || reduce) return;
      ex += (tex - ex) * 0.1; ey += (tey - ey) * 0.1;
      const ox = ex * W, oy = ey * H;
      const burst = 6 + Math.min(24, Math.abs(vel) * 1.5);
      for (let i = 0; i < burst; i++) {
        const a = -Math.PI * 0.15 + (Math.random() - 0.5) * 1.1, s = 4 + Math.random() * 9;
        parts.push({ x: ox, y: oy, px: ox, py: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, decay: 0.012 + Math.random() * 0.03 });
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      parts = parts.filter((p) => p.life > 0 && p.y < H + 20);
      for (const p of parts) {
        p.px = p.x; p.py = p.y; p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.y > H - 6 && p.vy > 0) { p.vy *= -0.35; p.vx *= 0.6; }
        const g = Math.floor(150 + p.life * 100);
        ctx.strokeStyle = `rgba(255,${g},${Math.floor(p.life * 80)},${Math.max(0, p.life)})`;
        ctx.lineWidth = 1.2 + p.life;
        ctx.beginPath(); ctx.moveTo(p.px - p.vx * 1.5, p.py - p.vy * 1.5); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 90);
      glow.addColorStop(0, "rgba(255,200,120,.55)"); glow.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = glow; ctx.fillRect(ox - 90, oy - 90, 180, 180);
      requestAnimationFrame(tick);
    }
  })();

  /* ---------------- Telefono del negozio ---------------- */
  const chatBody = $("#chatBody");
  const clock = () => new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  $("#phoneClock").textContent = clock();
  setInterval(() => { $("#phoneClock").textContent = clock(); }, 30000);

  function phoneIncoming(o) {
    const b = document.createElement("div");
    b.className = "bubble bubble--in is-new";
    b.innerHTML = `<b>🔔 Nuovo ordine #${o.no}</b><br>${o.lines.map((l) => `${l.qty}× ${l.name}`).join("<br>")}<br>${o.modeLabel}: ${o.slot} · ${o.name}<br><b>${fmt(o.total)}</b> · ${o.payLabel}
      <div class="bubble__act"><button data-ready="${o.no}">✓ Pronto</button><button type="button">📞 Chiama</button></div><span class="bubble__time mono">${clock()}</span>`;
    chatBody.appendChild(b);
    chatBody.scrollTop = chatBody.scrollHeight;
    while (chatBody.children.length > 6) chatBody.firstElementChild.remove();
  }
  function phoneReady(no) {
    const b = document.createElement("div");
    b.className = "bubble bubble--out is-new";
    b.innerHTML = `✓ #${no} pronto · cliente avvisato<span class="bubble__time mono">${clock()} ✓✓</span>`;
    chatBody.appendChild(b); chatBody.scrollTop = chatBody.scrollHeight;
  }
  chatBody.addEventListener("click", (e) => { const b = e.target.closest("[data-ready]"); if (b) markReady(+b.dataset.ready); });

  const FAKE = [
    { name: "Luca B.", lines: [{ qty: 1, name: "Smerigliatrice angolare" }, { qty: 2, name: "Dischi taglio inox" }] },
    { name: "Sara P.", lines: [{ qty: 3, name: "Duplicato chiave cilindro" }] },
    { name: "Impresa Rota", lines: [{ qty: 1, name: "Pannello betulla 120×60" }, { qty: 1, name: "Viti legno inox" }] },
  ];
  let fakeI = 0;
  $("#demoAlert").addEventListener("click", () => {
    const f = FAKE[fakeI++ % FAKE.length];
    const o = createOrder({ name: f.name, lines: f.lines.map((l) => ({ ...l, price: 0 })), total: 20 + Math.random() * 120, mode: "banco", slot: "Tra 30 min", pay: "banco", demo: true });
    toast("wa", "Ordini Bottega", `Nuovo ordine #${o.no} da ${o.name} · ${o.slot}`);
  });

  /* ---------------- Ordini (simulazione backend) ---------------- */
  let orders = store.get("orders", []);
  const MODE = { banco: "Ritiro al banco", auto: "Ritiro in auto", consegna: "Consegna" };
  const PAY = { carta: "Pagato con carta", wallet: "Pagato da telefono", banco: "Paga al ritiro" };
  function createOrder(d) {
    const no = 1040 + orders.length + 1;
    const o = { no, ...d, modeLabel: MODE[d.mode], payLabel: PAY[d.pay], status: "nuovo", at: Date.now() };
    orders.unshift(o); store.set("orders", orders);
    phoneIncoming(o); renderOwner();
    return o;
  }
  function markReady(no) {
    const o = orders.find((x) => x.no === no);
    if (!o || o.status === "pronto") return;
    o.status = "pronto"; store.set("orders", orders);
    renderOwner(); phoneReady(no);
    toast("sms", "SMS al cliente", `Ciao ${o.name.split(" ")[0]}, il tuo ordine #${no} è pronto${o.mode === "consegna" ? " ed è in viaggio" : " al banco"}. Bottega Ferri`);
  }
  function renderOwner() {
    const fresh = orders.filter((o) => o.status === "nuovo").length;
    $("#ownerBadge").textContent = fresh;
    $("#ownerList").innerHTML = orders.length ? orders.map((o) => `
      <div class="oc" data-status="${o.status}">
        <div class="oc__top"><span>#${o.no} · ${new Date(o.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span><em>${o.status === "nuovo" ? "Da preparare" : "Pronto"}</em></div>
        <p><b>${o.name}</b> · ${o.modeLabel} · ${o.slot}<br>${o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}<br>${fmt(o.total)} · ${o.payLabel}</p>
        <button data-ready="${o.no}" ${o.status === "pronto" ? "disabled" : ""}>${o.status === "pronto" ? "Cliente avvisato ✓" : "Segna pronto e avvisa il cliente"}</button>
      </div>`).join("") : `<p class="owner__note">Nessun ordine ancora. Fai un ordine di prova dal negozio.</p>`;
  }
  $("#ownerList").addEventListener("click", (e) => { const b = e.target.closest("[data-ready]"); if (b) markReady(+b.dataset.ready); });
  $("#ownerFab").addEventListener("click", () => { renderOwner(); show("owner"); });
  renderOwner();

  /* ---------------- Toast notifiche ---------------- */
  const toastEl = $("#toast"); let toastT;
  function toast(kind, title, text) {
    toastEl.innerHTML = `<div class="toast__icon ${kind === "sms" ? "toast__icon--sms" : ""}">${kind === "sms" ? "SMS" : "WA"}</div><div><b>${title}<small>ora</small></b><p>${text}</p></div>`;
    toastEl.classList.remove("is-on"); void toastEl.offsetWidth; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("is-on"), 4600);
  }

  /* ---------------- Checkout ---------------- */
  const sheet = $("#sheet"), form = $("#checkoutForm");
  let stepI = 0, slot = null;
  function buildSlots() {
    const now = new Date(); const out = [{ t: "Tra 30 min", s: "il prima possibile" }];
    const d = new Date(now); d.setMinutes(Math.ceil((now.getMinutes() + 60) / 30) * 30, 0, 0);
    for (let i = 0; i < 6; i++) {
      const h = d.getHours();
      if (h >= 8 && h < 19 && !(h >= 12 && h < 14) || i === 0) {
        out.push({ t: d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), s: d.getDate() === now.getDate() ? "oggi" : "domani" });
      }
      d.setMinutes(d.getMinutes() + 60);
    }
    $("#slots").innerHTML = out.slice(0, 6).map((o, i) => `<button type="button" class="slotbtn ${i ? "" : "is-active"}" data-s="${o.t}">${o.t}<small>${o.s}</small></button>`).join("");
    slot = out[0].t;
  }
  $("#slots").addEventListener("click", (e) => { const b = e.target.closest(".slotbtn"); if (!b) return; $$(".slotbtn").forEach((x) => x.classList.toggle("is-active", x === b)); slot = b.dataset.s; });
  const mode = () => form.elements.mode.value;
  const shipFee = () => (mode() === "consegna" && subtotal() < FREE ? 4.9 : 0);
  form.addEventListener("change", (e) => {
    if (e.target.name === "mode") $(".field--addr").hidden = mode() !== "consegna";
    if (e.target.name === "pay") $("#cardFields").hidden = form.elements.pay.value !== "carta";
    renderStep();
  });

  function renderStep() {
    $$(".cstep").forEach((s) => s.classList.toggle("is-on", +s.dataset.step === stepI));
    $$("#steps li").forEach((li, i) => { li.classList.toggle("is-on", i === stepI); li.classList.toggle("is-done", i < stepI); });
    $("#sheetBack").style.visibility = stepI ? "visible" : "hidden";
    $("#shipFee").textContent = subtotal() >= FREE ? "gratis" : "4,90 €";
    const total = subtotal() + shipFee();
    const label = stepI < 2 ? "Continua" : form.elements.pay.value === "banco" ? `Conferma ordine · ${fmt(total)}` : `Paga ${fmt(total)}`;
    $("#sheetNext span").textContent = label;
    if (stepI === 2) {
      $("#recap").innerHTML = `<div><span>Articoli (${cart.reduce((s, l) => s + l.qty, 0)})</span><span>${fmt(subtotal())}</span></div>
        <div><span>${MODE[mode()]} · ${slot}</span><span>${shipFee() ? fmt(shipFee()) : "gratis"}</span></div>
        <div><b>Totale</b><b>${fmt(total)}</b></div>`;
    }
  }
  function validate() {
    if (stepI !== 1) return true;
    let ok = true;
    const check = (name, test) => { const f = form.elements[name], wrap = f.closest(".field"); const good = test(f.value.trim()); wrap.classList.toggle("is-error", !good); if (!good && ok) { f.focus(); ok = false; } };
    check("name", (v) => v.length > 1);
    check("phone", (v) => v.replace(/\D/g, "").length >= 9);
    if (mode() === "consegna") check("addr", (v) => v.length > 4);
    return ok;
  }
  $("#toCheckout").addEventListener("click", () => { if (!cart.length) return; stepI = 0; buildSlots(); renderStep(); show("sheet"); });
  $("#sheetBack").addEventListener("click", () => { stepI = Math.max(0, stepI - 1); renderStep(); });
  $("#sheetNext").addEventListener("click", () => {
    if (!validate()) return;
    if (stepI < 2) { stepI++; renderStep(); return; }
    placeOrder(form.elements.pay.value);
  });
  $('[data-pay="wallet"]').addEventListener("click", (e) => {
    if (!validate()) return;
    const b = e.currentTarget; b.textContent = "Autorizzazione…";
    setTimeout(() => { b.innerHTML = `<span class="paybtn__chip"></span>Paga con il telefono`; placeOrder("wallet"); }, 900);
  });
  $("#ccNum").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "); });

  function placeOrder(pay) {
    const name = form.elements.name.value.trim();
    const total = subtotal() + shipFee();
    const o = createOrder({
      name, phone: form.elements.phone.value.trim(), note: form.elements.note.value.trim(),
      lines: cart.map((l) => ({ qty: l.qty, name: l.name, meta: l.meta, price: l.price })),
      total, ship: shipFee(), mode: mode(), slot, pay,
    });
    cart = []; store.set("cart", cart); renderCart();
    hide(); showReceipt(o);
    setTimeout(() => toast("sms", "SMS · Bottega Ferri", `Grazie ${name.split(" ")[0]}! Ordine #${o.no} ricevuto. ${o.modeLabel}: ${o.slot}.`), 2600);
    setTimeout(() => toast("wa", "Al negozio · WhatsApp", `🔔 Nuovo ordine #${o.no} · ${fmt(o.total)} · ${o.modeLabel} ${o.slot}`), 7600);
  }

  function showReceipt(o) {
    const wrap = $("#receiptWrap"), r = $("#receipt");
    const d = new Date();
    r.innerHTML = `<h5>BOTTEGA FERRI</h5>
      <div class="c">Via dei Fabbri 14 · Bergamo<br>${d.toLocaleDateString("it-IT")} ${clock()}</div><hr>
      <div class="r big"><span>ORDINE</span><span>#${o.no}</span></div><hr>
      ${o.lines.map((l) => `<div class="r"><span>${l.qty}× ${l.name}</span><span>${fmt(l.price * l.qty)}</span></div>`).join("")}
      ${o.ship ? `<div class="r"><span>Consegna</span><span>${fmt(o.ship)}</span></div>` : ""}<hr>
      <div class="r big"><span>TOTALE</span><span>${fmt(o.total)}</span></div>
      <div class="r"><span>${o.payLabel}</span><span></span></div><hr>
      <div class="c">${o.modeLabel.toUpperCase()} · ${o.slot}<br>Ti avvisiamo su ${form.elements.wa.checked ? "WhatsApp" : "SMS"} quando è pronto.</div>
      <div class="code"></div>
      <div class="c" style="margin-top:6px">PROTOTIPO · NESSUN ADDEBITO</div>`;
    wrap.classList.add("is-on"); wrap.setAttribute("aria-hidden", "false"); lock(true);
    r.classList.remove("is-printing"); void r.offsetWidth; r.classList.add("is-printing");
    form.reset(); $(".field--addr").hidden = true; $("#cardFields").hidden = false;
  }
  $("#receiptClose").addEventListener("click", () => { $("#receiptWrap").classList.remove("is-on"); $("#receiptWrap").setAttribute("aria-hidden", "true"); lock(false); });

  /* ---------------- Animazioni di ingresso + racconto orizzontale ---------------- */
  if (hasST && !reduce) {
    $$(".section-head, .alerts__text, .workshop__text").forEach((el) => {
      gsap.from(el.children, { y: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    gsap.from(".unit", { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: { each: 0.06, from: "start" }, scrollTrigger: { trigger: "#cabinet", start: "top 85%" } });
    gsap.from(".card", { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.05, scrollTrigger: { trigger: "#products", start: "top 85%" } });
    gsap.from("#phone", { y: 120, rotate: 14, opacity: 0, duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: "#phone", start: "top 90%" } });

    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      const strip = $("#storyStrip");
      const dist = () => strip.scrollWidth - innerWidth;
      const tw = gsap.to(strip, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: "#bottega", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true } });
      $$(".story__card img", strip).forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentElement, containerAnimation: tw, start: "left right", end: "right left", scrub: true } });
      });
    });
  }

  /* ---------------- Avvio ---------------- */
  hydrateImages();
  renderCart();
  addEventListener("load", () => { if (hasST) ScrollTrigger.refresh(); });
})();
