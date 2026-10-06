/* Mollica · nucleo: sacchetto, bancone, sfornate, hero, 48 ore, avvisi */
(function () {
  const M = window.M;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  M.$ = $; M.$$ = $$;

  /* ───────────── dialog con animazione di chiusura ───────────── */
  M.openDialog = (d) => { if (!d.open) d.showModal(); };
  M.closeDialog = (d) => {
    if (!d.open) return;
    if (M.reduced) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(() => { d.classList.remove('is-closing'); d.close(); }, 220);
  };
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) M.closeDialog(c.closest('dialog'));
  });
  // clic sullo sfondo chiude il dialog
  document.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'DIALOG' && e.target.open) {
      const r = e.target.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) M.closeDialog(e.target);
    }
  });

  /* livello superiore: porta un popover sopra ai dialog aperti */
  M.raise = (el) => {
    try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch (e) { el.hidden = false; }
  };
  /* ───────────── toast ───────────── */
  M.toast = (html, action) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<p>${html}</p>`;
    if (action) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = action.label;
      b.addEventListener('click', () => { action.fn(); t.remove(); });
      t.appendChild(b);
    }
    const box = $('#toasts');
    box.appendChild(t);
    M.raise(box);
    setTimeout(() => t.classList.add('is-out'), 5200);
    setTimeout(() => { t.remove(); if (!box.children.length) { try { box.hidePopover(); } catch (e) { /* */ } } }, 5600);
  };

  /* ───────────── campanello della porta (WebAudio) ───────────── */
  let actx;
  M.chime = () => {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime;
      [[1318.5, 0], [1760, 0.13]].forEach(([f, dt]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + dt);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + dt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 1.1);
        o.connect(g).connect(actx.destination);
        o.start(t0 + dt); o.stop(t0 + dt + 1.2);
      });
    } catch (e) { /* audio non disponibile */ }
  };

  /* ───────────── sacchetto ───────────── */
  const cart = {
    items: M.store.get('cart', []),
    save() { M.store.set('cart', this.items); renderBag(); updateCount(); },
    add(item) {
      const same = this.items.find((i) => i.key === item.key);
      if (same && !item.cake) same.qty += item.qty; else this.items.push(item);
      this.save();
    },
    setQty(key, qty) {
      const it = this.items.find((i) => i.key === key);
      if (!it) return;
      it.qty = qty;
      if (it.qty <= 0) this.items = this.items.filter((i) => i !== it);
      this.save();
    },
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    subtotal() { return this.items.reduce((s, i) => s + i.qty * i.price, 0); },
    hasCake() { return this.items.find((i) => i.cake); },
  };
  M.cart = cart;

  const bagBtn = $('#bagBtn');
  function updateCount() {
    const n = cart.count();
    const c = $('#bagCount');
    c.textContent = n;
    bagBtn.classList.toggle('has-items', n > 0);
  }

  function lineArt(i) {
    return i.cake ? `<div class="bag-line__art bag-line__art--cake">${i.thumb || ''}</div>` : `<div class="bag-line__art">${M.art(i.art)}</div>`;
  }

  function renderBag() {
    const body = $('#bagBody'), foot = $('#bagFoot');
    if (!cart.items.length) {
      body.innerHTML = `<div class="empty">
        <svg viewBox="0 0 120 120" aria-hidden="true" class="empty__bag"><path d="M22 38h76l-6 70H28Z"/><path d="M22 38l8-14h60l8 14"/><path d="M44 50v-8a16 16 0 0 1 32 0v8"/></svg>
        <p><strong>Il sacchetto è vuoto.</strong></p>
        <p class="muted">Le pagnotte della mattina di solito finiscono verso le 11.</p>
        <a class="btn btn--line" href="#bancone" data-close>Vai al bancone</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = `<ul class="lines">${cart.items.map((i) => `
      <li class="bag-line" data-key="${i.key}">
        ${lineArt(i)}
        <div class="bag-line__info">
          <strong>${i.name}</strong>
          ${i.optsLabel ? `<span class="muted small">${i.optsLabel}</span>` : ''}
          <div class="stepper" role="group" aria-label="Quantità di ${i.name}">
            <button type="button" data-q="-1" aria-label="Togli uno">−</button>
            <span class="mono">${i.qty}</span>
            <button type="button" data-q="1" aria-label="Aggiungi uno" ${i.cake ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <span class="bag-line__price mono">${M.eur(i.qty * i.price)}</span>
      </li>`).join('')}</ul>`;
    const sub = cart.subtotal();
    const left = 30 - sub;
    foot.innerHTML = `
      <div class="free-ship"><div class="free-ship__bar"><span style="width:${Math.min(100, (sub / 30) * 100)}%"></span></div>
      <p class="small">${left > 0 ? `Ancora <strong>${M.eur(left)}</strong> e la consegna in bici è gratis.` : '<strong>Consegna in bici gratuita</strong> per questo ordine.'}</p></div>
      <div class="sum"><span>Subtotale</span><strong class="mono">${M.eur(sub)}</strong></div>
      <button class="btn btn--ink btn--block" type="button" id="toCheckout">Scegli quando ritirare</button>`;
  }

  $('#bagBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const key = b.closest(".bag-line").dataset.key;
    const it = cart.items.find((i) => i.key === key);
    cart.setQty(key, it.qty + Number(b.dataset.q));
  });
  $('#bagFoot').addEventListener('click', (e) => {
    if (e.target.id === 'toCheckout') { M.closeDialog($('#bagDrawer')); setTimeout(() => M.openCheckout(), 230); }
  });
  bagBtn.addEventListener('click', () => { renderBag(); M.openDialog($('#bagDrawer')); });
  M.openBag = () => { renderBag(); M.openDialog($('#bagDrawer')); };

  /* volo verso il sacchetto */
  M.flyToBag = (fromEl, html) => {
    const done = () => {
      bagBtn.classList.remove('is-bump'); void bagBtn.offsetWidth; bagBtn.classList.add('is-bump');
    };
    if (M.reduced || !fromEl) { done(); return; }
    const a = fromEl.getBoundingClientRect(), b = bagBtn.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'fly';
    ghost.innerHTML = html;
    const size = Math.min(a.width, 160);
    Object.assign(ghost.style, { width: size + 'px', height: size * 0.75 + 'px', left: a.left + a.width / 2 - size / 2 + 'px', top: a.top + a.height / 2 - size * 0.375 + 'px' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const lift = Math.min(-80, dy * 0.3 - 120);
    const pts = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const x = dx * t, y = dy * t * t + lift * 4 * t * (1 - t) * 0.6;
      const s = 1 - 0.82 * t;
      return { transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${t * 220}deg)`, opacity: t > 0.9 ? 0.4 : 1 };
    });
    ghost.animate(pts, { duration: 760, easing: 'cubic-bezier(.45,.05,.55,.95)' }).onfinish = () => { ghost.remove(); done(); };
  };

  M.addToCart = (item, fromEl) => {
    cart.add(item);
    M.flyToBag(fromEl, item.cake ? item.thumb : M.art(item.art));
    M.toast(`<strong>${item.name}</strong> è nel sacchetto.`, { label: 'Apri', fn: M.openBag });
  };

  /* ───────────── bancone ───────────── */
  const shelf = $('#shelf');
  function cardHtml(p) {
    const meta = [p.unit, p.perKg ? M.eur(p.perKg) + '/kg' : null].filter(Boolean).join(' · ');
    return `<article class="product" data-id="${p.id}" data-cat="${p.cat}">
      <div class="product__stage">${M.art(p.art)}
        <span class="tag" aria-hidden="true"><span class="tag__string"></span><span class="tag__card mono">${M.eur(p.price)}</span></span>
        ${p.hot ? '<span class="hot mono">caldo alle 7:00</span>' : ''}
      </div>
      <div class="product__body">
        <h3>${p.name}</h3>
        <p class="product__desc">${p.desc}</p>
        <p class="product__meta mono">${meta}</p>
        <div class="product__foot">
          <span class="allergens" aria-label="Allergeni: ${p.allergens.join(', ')}">${p.allergens.map((a) => `<b>${a}</b>`).join('')}</span>
          <button class="add-btn" type="button" data-add="${p.id}">
            <span>${p.options ? 'Scegli' : 'Aggiungi'}</span><span class="add-btn__price mono">${M.eur(p.price)}</span>
          </button>
        </div>
      </div>
    </article>`;
  }
  shelf.innerHTML = M.PRODUCTS.map(cardHtml).join('');

  $('#catTabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat]');
    if (!t) return;
    $$('#catTabs [role=tab]').forEach((b) => b.setAttribute('aria-selected', b === t));
    shelf.setAttribute('aria-labelledby', t.id);
    const cat = t.dataset.cat;
    const apply = () => $$('.product', shelf).forEach((c) => { c.hidden = !(cat === 'tutto' || c.dataset.cat === cat); });
    if (document.startViewTransition && !M.reduced) document.startViewTransition(apply); else apply();
  });

  function simpleItem(p, opts = {}, note) {
    let price = p.price, labels = [];
    (p.options || []).forEach((o) => {
      const ch = o.choices.find((c) => c.v === (opts[o.key] ?? o.choices[0].v));
      price += ch.delta;
      if (ch.delta !== 0 || o.choices.indexOf(ch) > 0) labels.push(ch.label.split(' · ')[0]);
    });
    if (note) labels.push(note);
    const key = p.id + '|' + JSON.stringify(opts) + (note || '');
    return { key, id: p.id, name: p.name, art: p.art, price: Math.round(price * 100) / 100, qty: 1, optsLabel: labels.join(' · ') };
  }
  M.simpleItem = simpleItem;

  shelf.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    const p = M.product(b.dataset.add);
    const art = b.closest('.product').querySelector('.art');
    if (p.options) openOptions(p, art); else M.addToCart(simpleItem(p), art);
  });

  /* scheda opzioni */
  const sheet = $('#optionSheet');
  function openOptions(p, fromArt) {
    const state = Object.fromEntries(p.options.map((o) => [o.key, o.choices[0].v]));
    let qty = 1;
    sheet.innerHTML = `<form method="dialog" class="sheet__inner" id="optForm">
      <div class="sheet__art">${M.art(p.art)}</div>
      <div class="sheet__body">
        <h2 id="optTitle">${p.name}</h2>
        <p class="muted">${p.desc}</p>
        ${p.options.map((o) => `<fieldset class="opt"><legend>${o.label}</legend><div class="chips">
          ${o.choices.map((c, i) => `<label class="chip"><input type="radio" name="${o.key}" value="${c.v}" ${i === 0 ? 'checked' : ''}><span>${c.label}${c.delta > 0 ? ` <em class="mono">+${M.eur(c.delta)}</em>` : ''}</span></label>`).join('')}
        </div></fieldset>`).join('')}
        <div class="sheet__foot">
          <div class="stepper stepper--lg" role="group" aria-label="Quantità">
            <button type="button" data-sq="-1" aria-label="Togli uno">−</button><span class="mono" id="optQty">1</span><button type="button" data-sq="1" aria-label="Aggiungi uno">+</button>
          </div>
          <button class="btn btn--ink" type="submit" id="optAdd">Aggiungi · <span class="mono" id="optTotal"></span></button>
        </div>
      </div>
      <button class="icon-btn sheet__close" type="button" data-close aria-label="Chiudi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    </form>`;
    const total = () => { $('#optTotal', sheet).textContent = M.eur(simpleItem(p, state).price * qty); $('#optQty', sheet).textContent = qty; };
    total();
    sheet.querySelector('form').addEventListener('change', (e) => { state[e.target.name] = e.target.value; total(); });
    sheet.querySelector('form').addEventListener('click', (e) => {
      const s = e.target.closest('[data-sq]');
      if (s) { qty = Math.max(1, Math.min(24, qty + Number(s.dataset.sq))); total(); }
    });
    sheet.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const item = simpleItem(p, state); item.qty = qty;
      const art = $('.sheet__art .art', sheet).getBoundingClientRect();
      M.closeDialog(sheet);
      const ghostFrom = fromArt;
      setTimeout(() => M.addToCart(item, art.width ? { getBoundingClientRect: () => art } : ghostFrom), 60);
    });
    M.openDialog(sheet);
  }

  /* ───────────── sfornate di oggi ───────────── */
  function renderBakes() {
    const today = new Date();
    const closed = M.isClosed(today);
    const now = closed ? -1 : M.nowMin();
    const list = $('#bakesList');
    const items = M.BAKES.map((b) => {
      const p = M.product(b.product);
      let state = 'later', status = 'In programma', extra = '';
      if (now >= b.min) {
        const left = Math.max(0, Math.round(b.batch * (1 - (now - b.min) / 320)));
        state = left ? 'done' : 'gone';
        status = left ? `Sfornato · ne restano ${left}${b.unit ? ' ' + b.unit : ''}` : 'Esaurito per oggi';
      } else if (now >= b.min - 45) {
        state = 'oven';
        const pct = Math.round(((now - (b.min - 45)) / 45) * 100);
        status = `In forno · esce tra ${b.min - now} min`;
        extra = `<span class="bake__heat"><span style="width:${pct}%"></span></span>`;
      }
      return `<li class="bake bake--${state}">
        <span class="bake__dot" aria-hidden="true"></span>
        <time class="bake__time">${M.hhmm(b.min)}</time>
        <div class="bake__art">${M.art(p.art)}</div>
        <strong class="bake__name">${b.label}</strong>
        <span class="bake__status small">${status}</span>${extra}
        <button class="link-btn" type="button" data-bake="${b.product}|${M.hhmm(b.min)}" ${state === 'gone' ? 'disabled' : ''}>${state === 'gone' ? 'Torna domani' : 'Mettine da parte'}</button>
      </li>`;
    });
    list.innerHTML = items.join('');
    // ago "adesso": interpolato tra le sfornate
    const cards = $$('.bake', list);
    const scale = $('#bakesScale');
    let x = 0;
    if (closed) x = 0;
    else if (now <= M.BAKES[0].min) x = cards[0].offsetLeft + 10;
    else if (now >= M.BAKES[M.BAKES.length - 1].min) x = cards[cards.length - 1].offsetLeft + 10;
    else {
      for (let i = 0; i < M.BAKES.length - 1; i++) {
        const a = M.BAKES[i].min, b = M.BAKES[i + 1].min;
        if (now >= a && now < b) {
          const t = (now - a) / (b - a);
          x = cards[i].offsetLeft + 10 + t * (cards[i + 1].offsetLeft - cards[i].offsetLeft);
        }
      }
    }
    scale.innerHTML = `<span class="bakes__fill" style="width:${x}px"></span>
      <span class="bakes__now" style="left:${x}px"><span class="mono">${closed ? 'oggi chiuso' : 'adesso ' + M.hhmm(Math.max(0, now))}</span></span>`;
    const rail = $('#bakesRail');
    if (!renderBakes.scrolled && rail.scrollWidth > rail.clientWidth) { rail.scrollLeft = Math.max(0, x - rail.clientWidth / 3); renderBakes.scrolled = true; }
    // chip nel hero
    const next = M.BAKES.find((b) => b.min > now);
    $('#nextBakeText').textContent = closed
      ? 'Oggi siamo chiusi. Domani la prima pagnotta esce alle 06:40.'
      : next
        ? `Prossima sfornata: ${next.label} alle ${M.hhmm(next.min)} · tra ${fmtWait(next.min - now)}`
        : 'Sfornate finite per oggi. Domani si riparte alle 06:40.';
  }
  const fmtWait = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
  M.renderBakes = renderBakes;
  renderBakes();
  setInterval(renderBakes, 30000);
  window.addEventListener('resize', () => { clearTimeout(renderBakes.t); renderBakes.t = setTimeout(renderBakes, 150); });

  $('#bakesList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-bake]');
    if (!b) return;
    const [id, time] = b.dataset.bake.split('|');
    M.addToCart(simpleItem(M.product(id), {}, `dalla sfornata delle ${time}`), b.closest('.bake').querySelector('.art'));
  });

  /* ───────────── forno del hero: mosaico e arco ───────────── */
  (function buildOven() {
    const NS = 'http://www.w3.org/2000/svg';
    const tiles = $('.oven__tiles');
    const blues = ['#1E3556', '#24406A', '#2B4C7A', '#1A2E4B', '#335A8C', '#22395E'];
    let html = '<clipPath id="domeClip"><path d="M30 470V250C30 118 132 26 260 26S490 118 490 250v220Z"/></clipPath><g clip-path="url(#domeClip)">';
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 20; y < 480; y += 15) {
      for (let x = 24 + ((y / 15) % 2) * 7; x < 500; x += 15) {
        const gold = rnd() < 0.05;
        html += `<rect x="${x}" y="${y}" width="13" height="13" rx="2" fill="${gold ? '#C9A04A' : blues[Math.floor(rnd() * blues.length)]}"/>`;
      }
    }
    tiles.innerHTML = html + '</g>';
    const arch = $('#ovenArch');
    const cx = 260, cy = 250, r1 = 150, r2 = 188, n = 15;
    let a = '';
    for (let i = 0; i < n; i++) {
      const t0 = Math.PI + (i / n) * Math.PI, t1 = Math.PI + ((i + 1) / n) * Math.PI;
      const p = (r, t) => `${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
      a += `<path d="M${p(r1, t0)}L${p(r2, t0)}A${r2} ${r2} 0 0 1 ${p(r2, t1)}L${p(r1, t1)}A${r1} ${r1} 0 0 0 ${p(r1, t0)}Z" fill="${i % 2 ? '#E9DCC2' : '#D8C49C'}" stroke="#8F7A55" stroke-width="1.5"/>`;
    }
    for (let j = 0; j < 4; j++) {
      const y = 250 + j * 45;
      a += `<rect x="72" y="${y}" width="38" height="45" fill="${j % 2 ? '#D8C49C' : '#E9DCC2'}" stroke="#8F7A55" stroke-width="1.5"/>`;
      a += `<rect x="410" y="${y}" width="38" height="45" fill="${j % 2 ? '#E9DCC2' : '#D8C49C'}" stroke="#8F7A55" stroke-width="1.5"/>`;
    }
    a += `<path d="M228 62h64l-6 30h-52Z" fill="#C9A04A" stroke="#8F7A55" stroke-width="1.5"/>`;
    a += `<text x="260" y="84" text-anchor="middle" font-family="Pinyon Script, cursive" font-size="20" fill="#3A2416">M</text>`;
    arch.innerHTML = a;
    void NS;
  })();

  /* ───────────── farina che vola nel hero ───────────── */
  (function flour() {
    const cv = $('#flour');
    if (!cv || M.reduced) return;
    const ctx = cv.getContext('2d');
    const hero = cv.parentElement;
    let w, h, dpr, parts = [], mouse = { x: -999, y: -999 }, running = true, raf;
    const make = (x, y, burst) => ({
      x: x ?? Math.random() * w, y: y ?? Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vx: burst ? (Math.random() - 0.5) * 4 : 0, vy: burst ? -Math.random() * 3 : 0.12 + Math.random() * 0.35,
      ph: Math.random() * 6.28, a: 0.35 + Math.random() * 0.55, life: burst ? 1 : -1,
    });
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = hero.clientWidth; h = hero.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 9000));
      parts = Array.from({ length: n }, () => make());
    }
    function tick(t) {
      ctx.clearRect(0, 0, w, h);
      const col = getComputedStyle(document.documentElement).getPropertyValue('--flour').trim() || '#fff';
      ctx.fillStyle = col;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 6400) { const f = (6400 - d2) / 6400; p.vx += (dx / 80) * f * 0.6; p.vy += (dy / 80) * f * 0.6; }
        p.vx *= 0.94; p.vy = p.vy * 0.94 + (p.life > 0 ? 0.05 : 0.02);
        p.x += p.vx + Math.sin(t / 1400 + p.ph) * 0.25;
        p.y += p.vy + (p.life > 0 ? 0 : 0.12);
        if (p.life > 0) { p.life -= 0.012; if (p.life <= 0) { parts.splice(i, 1); continue; } }
        if (p.y > h + 4) { p.y = -4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        ctx.globalAlpha = p.a * (p.life > 0 ? p.life : 1);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(tick);
    }
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    hero.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a,button')) return;
      const r = hero.getBoundingClientRect();
      for (let i = 0; i < 26; i++) parts.push(make(e.clientX - r.left, e.clientY - r.top, true));
    });
    new IntersectionObserver(([en]) => {
      running = en.isIntersecting;
      if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
    }).observe(hero);
    window.addEventListener('resize', () => { clearTimeout(size.t); size.t = setTimeout(size, 150); });
    size();
  })();

  /* ───────────── 48 ore: impasto che cresce ───────────── */
  (function ferment() {
    const steps = $$('#fSteps li');
    const dough = $('#dough');
    const bubbles = $('.dough__bubbles', dough);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    bubbles.innerHTML = Array.from({ length: 20 }, (_, i) => {
      const x = 80 + rnd() * 140, y = 150 + rnd() * 70, r = 2 + rnd() * 5;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="--i:${i}"/>`;
    }).join('');
    const hoursEl = $('#fHours'), tempEl = $('#fTemp'), bar = $('#fBar');
    let shownH = 0, anim;
    function set(li) {
      steps.forEach((s) => s.classList.toggle('is-active', s === li));
      const h = Number(li.dataset.h), t = Number(li.dataset.t);
      dough.style.setProperty('--s', li.dataset.s);
      dough.classList.toggle('is-baked', li.dataset.c === '1');
      dough.classList.toggle('is-scored', li.dataset.score === '1');
      $$('circle', bubbles).forEach((c, i) => c.classList.toggle('on', i < Number(li.dataset.b)));
      tempEl.textContent = t + ' °C';
      tempEl.classList.toggle('is-hot', t > 100);
      tempEl.classList.toggle('is-cold', t < 10);
      bar.style.width = (h / 48) * 100 + '%';
      cancelAnimationFrame(anim);
      const from = shownH, start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / 600);
        shownH = Math.round(from + (h - from) * (1 - Math.pow(1 - k, 3)));
        hoursEl.textContent = shownH + ' h';
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    set(steps[0]);
    const io = new IntersectionObserver((ens) => {
      ens.forEach((en) => { if (en.isIntersecting) set(en.target); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => { io.observe(s); s.addEventListener('click', () => set(s)); });
  })();

  /* ───────────── telefono: anteprima WhatsApp ───────────── */
  const phone = $('#phone');
  let phoneTimers = [];
  M.phone = (cfg) => {
    phoneTimers.forEach(clearTimeout); phoneTimers = [];
    $('#phoneName').textContent = cfg.name;
    $('#phoneSub').textContent = cfg.sub;
    $('#phoneAvatar').textContent = cfg.avatar;
    $('#phoneCap').textContent = cfg.caption;
    phone.classList.toggle('phone--owner', !!cfg.owner);
    const chat = $('#phoneChat');
    chat.innerHTML = '';
    M.raise(phone);
    requestAnimationFrame(() => requestAnimationFrame(() => phone.classList.add('is-in')));
    let t = 400;
    cfg.messages.forEach((m) => {
      phoneTimers.push(setTimeout(() => {
        const typing = document.createElement('div');
        typing.className = 'bubble bubble--typing';
        typing.innerHTML = '<i></i><i></i><i></i>';
        chat.appendChild(typing);
      }, t));
      t += m.delay || 1100;
      phoneTimers.push(setTimeout(() => {
        chat.querySelector('.bubble--typing')?.remove();
        const b = document.createElement('div');
        b.className = 'bubble';
        const d = new Date();
        b.innerHTML = `${m.text}<time>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ✓✓</time>`;
        chat.appendChild(b);
        chat.scrollTop = chat.scrollHeight;
      }, t));
      t += 400;
    });
    phoneTimers.push(setTimeout(M.hidePhone, t + 9000));
  };
  M.hidePhone = () => {
    phone.classList.remove('is-in');
    setTimeout(() => { if (!phone.classList.contains('is-in')) { try { phone.hidePopover(); } catch (e) { /* */ } } }, 400);
  };
  $('#phoneClose').addEventListener('click', M.hidePhone);

  /* ───────────── ordini: archivio locale + canale tra schede ───────────── */
  const chan = 'BroadcastChannel' in window ? new BroadcastChannel('mollica-ordini') : null;
  let mem = null;
  const orders = {
    list() { return M.store.get('orders', null) || mem || (mem = seed()); },
    save(list) { mem = list; M.store.set('orders', list); window.dispatchEvent(new CustomEvent('mollica:orders')); },
    add(o) {
      const l = this.list(); l.unshift(o); this.save(l);
      chan?.postMessage({ type: 'new', id: o.id });
    },
    update(id, patch) {
      const l = this.list(); const o = l.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
      this.save(l);
      chan?.postMessage({ type: 'update', id });
    },
    nextNumber() { const n = M.store.get('ticket', 46) + 1; M.store.set('ticket', n); return n; },
  };
  function seed() {
    const t = M.dayKey(new Date());
    const l = [
      { id: 'es-45', n: 45, example: true, name: 'Marco R.', phone: '+39 347 000 0045', mode: 'ritiro', date: t, slot: '08:30', status: 'pronto', pay: 'Satispay', total: 14.9, createdAt: Date.now() - 50 * 60000,
        items: [{ name: 'Pagnotta di grani antichi', qty: 1, optsLabel: 'Affettata' }, { name: 'Cornetto sfogliato', qty: 4, optsLabel: 'Crema pasticcera' }, { name: 'Biove piemontesi', qty: 1 }] },
      { id: 'es-44', n: 44, example: true, name: 'Studio Ferrero', phone: '+39 011 000 0044', mode: 'consegna', address: 'Via Po 18, 10123', date: t, slot: '09:00–09:30', status: 'preparazione', pay: 'Carta', total: 41.5, createdAt: Date.now() - 80 * 60000,
        items: [{ name: 'Focaccia genovese', qty: 1, optsLabel: 'Teglia intera' }, { name: 'Vassoio di bignole', qty: 1 }, { name: 'Grissini stirati a mano', qty: 2 }] },
      { id: 'es-43', n: 43, example: true, name: 'Anna B.', phone: '+39 333 000 0043', mode: 'ritiro', date: t, slot: '07:45', status: 'ritirato', pay: 'Al ritiro', total: 6.5, createdAt: Date.now() - 140 * 60000,
        items: [{ name: 'Pagnotta di grani antichi', qty: 1 }] },
    ];
    M.store.set('orders', l);
    return l;
  }
  M.orders = orders;
  if (chan) chan.onmessage = (e) => { window.dispatchEvent(new CustomEvent('mollica:orders', { detail: e.data })); window.dispatchEvent(new CustomEvent('mollica:remote', { detail: e.data })); };

  updateCount();
  renderBag();
})();

/* orari: evidenzia oggi */
(function () {
  const rows = document.querySelectorAll('#hoursBody tr');
  const d = new Date().getDay();
  const idx = d === 1 ? 0 : d === 6 ? 2 : d === 0 ? 3 : 1;
  rows[idx]?.classList.add('is-today');
})();
