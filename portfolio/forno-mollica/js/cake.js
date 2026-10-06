/* Mollica · configuratore torte su misura */
(function () {
  const M = window.M, C = M.CAKE, $ = M.$, $$ = M.$$;
  const form = $('#cakeForm'), svg = $('#cakeSvg');
  const TEXTS = { compleanno: 'Auguri Giulia!', battesimo: 'Benvenuto Leo', laurea: 'Dottoressa!', matrimonio: 'Anna & Luca', nessuna: 'Buona domenica' };
  const MIN_SERV = { 1: 8, 2: 20, 3: 36 };

  const dates = [];
  for (let i = 2; dates.length < 8; i++) { const d = M.addDays(new Date(), i); if (!M.isClosed(d)) dates.push(d); }

  const state = {
    occasion: 'compleanno', tiers: 1, servings: 16, base: 'classico', filling: 'chantilly',
    coating: 'panna', tint: C.tint[0].v, decor: ['fragole', 'candeline'], text: TEXTS.compleanno,
    date: M.dayKey(dates[0]), slice: false, textEdited: false,
  };
  let prev = null;

  /* ───────────── controlli ───────────── */
  const radio = (group, o, checked, inner) =>
    `<label class="chip"><input type="radio" name="${group}" id="ck-${group}-${o.v}" value="${o.v}" ${checked ? 'checked' : ''}><span>${inner || o.label}</span></label>`;
  $('[data-group=occasion]', form).innerHTML = C.occasion.map((o) => radio('occasion', o, o.v === state.occasion)).join('');
  $('[data-group=tiers]', form).innerHTML = C.tiers.map((o) =>
    `<label class="seg__opt"><input type="radio" name="tiers" id="ck-tiers-${o.v}" value="${o.v}" ${o.v === state.tiers ? 'checked' : ''}>
      <span><svg viewBox="0 0 40 30" aria-hidden="true">${Array.from({ length: o.v }, (_, i) => `<rect x="${6 + i * 5}" y="${22 - i * 8}" width="${28 - i * 10}" height="8" rx="1.5"/>`).join('')}</svg>${o.label}</span></label>`).join('');
  const swatch = (group, o) => `<label class="swatch"><input type="radio" name="${group}" id="ck-${group}-${o.v}" value="${o.v}" ${state[group] === o.v ? 'checked' : ''}>
      <span><i style="--c:${o.color}" class="${o.dots ? 'dots' : ''} ${o.v === 'ganache' ? 'drip' : ''} ${o.v === 'naked' ? 'naked' : ''}"></i>${o.label}${o.perKg > 0 ? `<em class="mono">+${M.eur(o.perKg)}/kg</em>` : ''}</span></label>`;
  ['base', 'filling', 'coating'].forEach((g) => { $(`[data-group=${g}]`, form).innerHTML = C[g].map((o) => swatch(g, o)).join(''); });
  $('[data-group=tint]', form).innerHTML = C.tint.map((o) =>
    `<label class="tint"><input type="radio" name="tint" id="ck-tint-${o.v.slice(1)}" value="${o.v}" ${o.v === state.tint ? 'checked' : ''}><span style="--c:${o.v}"></span><b class="sr-only">${o.label}</b></label>`).join('') + '<span class="tints__label small muted">Colore della pasta di zucchero</span>';
  $('[data-group=decor]', form).innerHTML = C.decor.map((o) =>
    `<label class="chip"><input type="checkbox" name="decor" id="ck-decor-${o.v}" value="${o.v}" ${state.decor.includes(o.v) ? 'checked' : ''}><span>${o.label} <em class="mono">+${M.eur(o.price)}</em></span></label>`).join('');
  $('[data-group=date]', form).innerHTML = dates.map((d, i) =>
    `<label class="date"><input type="radio" name="date" id="ck-date-${M.dayKey(d)}" value="${M.dayKey(d)}" ${i === 0 ? 'checked' : ''}>
      <span><small>${['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'][d.getDay()]}</small><b>${d.getDate()}</b><small>${M.shortDate(d).split(' ')[2]}</small></span></label>`).join('');

  const servings = $('#servings'), servOut = $('#servingsOut'), textIn = $('#cakeText');

  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'decor') state.decor = $$('[name=decor]:checked', form).map((i) => i.value);
    else if (t.name === 'tiers') {
      state.tiers = Number(t.value);
      if (state.servings < MIN_SERV[state.tiers]) { state.servings = MIN_SERV[state.tiers]; servings.value = state.servings; M.toast(`Con ${state.tiers} piani servono almeno ${state.servings} porzioni: le abbiamo aumentate.`); }
    } else if (t.name === 'occasion') {
      state.occasion = t.value;
      if (!state.textEdited) { state.text = TEXTS[t.value]; textIn.value = state.text; }
      if (t.value === 'matrimonio') M.toast('Per i matrimoni ti chiamiamo per fissare una degustazione gratuita.');
    } else if (t.name in state && t.type === 'radio') {
      state[t.name] = t.value;
      if (t.name === 'base' || t.name === 'filling') state.slice = true;
    }
    render();
  });
  servings.addEventListener('input', () => {
    state.servings = Number(servings.value);
    const need = Object.entries(MIN_SERV).filter(([, v]) => v <= state.servings).map(([k]) => Number(k));
    if (state.servings < MIN_SERV[state.tiers]) {
      state.tiers = Math.max(...need);
      $(`#ck-tiers-${state.tiers}`).checked = true;
    }
    render();
  });
  textIn.addEventListener('input', () => { state.text = textIn.value; state.textEdited = true; render(); });
  $('#sliceToggle').addEventListener('click', () => { state.slice = !state.slice; render(); });

  /* ───────────── calcoli ───────────── */
  function dims() {
    const S = state.servings, T = state.tiers;
    let d0 = T === 1 ? 16 + (S - 8) * 0.4 : T === 2 ? 20 + (S - 20) * 0.3 : 24 + (S - 36) * 0.3;
    d0 = Math.min(32, Math.round(d0));
    const ds = Array.from({ length: T }, (_, i) => Math.max(12, d0 - i * 6));
    return { ds, kg: S * 0.11 };
  }
  function price() {
    const { kg } = dims();
    const pk = C.base.find((b) => b.v === state.base).perKg + C.filling.find((b) => b.v === state.filling).perKg + C.coating.find((b) => b.v === state.coating).perKg;
    const tierDelta = C.tiers.find((t) => t.v === state.tiers).delta || 0;
    const decor = state.decor.reduce((s, v) => s + C.decor.find((d) => d.v === v).price, 0);
    return Math.round((kg * pk + tierDelta + decor) * 2) / 2;
  }

  /* ───────────── disegno ───────────── */
  const CX = 210, FLOOR = 352;
  const shade = (c, k) => { // schiarisce (k>0) o scurisce (k<0) un hex
    const n = parseInt(c.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (x) => Math.round(k > 0 ? x + (255 - x) * k : x * (1 + k));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  };
  const coatColor = () => state.coating === 'zucchero' ? state.tint : C.coating.find((c) => c.v === state.coating).color;
  const sponge = () => C.base.find((b) => b.v === state.base).color;
  const fillC = () => C.filling.find((b) => b.v === state.filling);
  let rs = 11;
  const rnd = () => (rs = (rs * 16807) % 2147483647) / 2147483647;

  function tierGeom() {
    const { ds } = dims();
    const hs = [70, 60, 52];
    const g = [];
    let yb = FLOOR;
    ds.forEach((d, i) => {
      const rx = d * 5, ry = rx * 0.2, h = hs[i];
      g.push({ i, rx, ry, yb, yt: yb - h, h });
      yb = yb - h - 2;
    });
    return g;
  }

  function sidePath(t) {
    return `M${CX - t.rx} ${t.yt}V${t.yb}A${t.rx} ${t.ry} 0 0 0 ${CX + t.rx} ${t.yb}V${t.yt}Z`;
  }
  const onFront = (t, n, yOff = 0, from = 0.06, to = 0.94) => Array.from({ length: n }, (_, k) => {
    const th = Math.PI * (from + (to - from) * (k / (n - 1)));
    return [CX + Math.cos(th) * t.rx, t.yt + yOff + Math.sin(th) * t.ry];
  });

  function drawTier(t) {
    const coat = coatColor();
    let s = `<g class="tier" data-tier="${t.i}">`;
    if (state.coating === 'naked') {
      const layers = [];
      const f = fillC().color, sp = sponge();
      const bands = [[0, 0.26, sp], [0.26, 0.36, f], [0.36, 0.64, sp], [0.64, 0.74, f], [0.74, 1, sp]];
      bands.forEach(([a, b, c]) => layers.push(`<rect x="${CX - t.rx}" y="${t.yt + t.h * a}" width="${t.rx * 2}" height="${t.h * (b - a) + t.ry + 1}" fill="${c}"/>`));
      s += `<clipPath id="ck_side${t.i}"><path d="${sidePath(t)}"/></clipPath>
        <g clip-path="url(#ck_side${t.i})">${layers.join('')}<path d="${sidePath(t)}" fill="#FFFBF2" opacity=".42"/></g>`;
    } else {
      s += `<path d="${sidePath(t)}" fill="${coat}"/>`;
    }
    s += `<path d="${sidePath(t)}" fill="url(#ck_shade)"/>`;
    s += `<ellipse cx="${CX}" cy="${t.yt}" rx="${t.rx}" ry="${t.ry}" fill="${state.coating === 'naked' ? '#FBF3E2' : shade(coat.startsWith('#') ? coat : '#FBF6EC', 0.12)}"/>`;
    if (state.coating === 'ganache') {
      s += `<ellipse cx="${CX - t.rx * 0.3}" cy="${t.yt - t.ry * 0.25}" rx="${t.rx * 0.4}" ry="${t.ry * 0.3}" fill="#fff" opacity=".12"/>`;
      s += `<g class="drips">`;
      s += `<path d="M${CX - t.rx} ${t.yt}A${t.rx} ${t.ry} 0 0 0 ${CX + t.rx} ${t.yt}V${t.yt + 7}A${t.rx} ${t.ry} 0 0 1 ${CX - t.rx} ${t.yt + 7}Z" fill="${coat}"/>`;
      rs = 5 + t.i * 13;
      onFront(t, Math.round(t.rx / 11), 4).forEach(([x, y]) => {
        const L = 8 + rnd() * (t.h * 0.42), w = 7 + rnd() * 4;
        s += `<path d="M${x - w / 2} ${y}v${L}a${w / 2} ${w / 2} 0 0 0 ${w} 0v${-L}Z" fill="${coat}"/>`;
      });
      s += `</g>`;
    } else if (state.coating === 'panna') {
      const ros = (x, y, r) => `<g class="rosette"><circle cx="${x}" cy="${y}" r="${r}" fill="#FFFDF8"/><path d="M${x - r * 0.5} ${y}a${r * 0.5} ${r * 0.5} 0 1 1 ${r * 0.6} ${r * 0.3}" stroke="#E8DCC6" stroke-width="1.2" fill="none"/></g>`;
      s += onFront(t, Math.round(t.rx / 8), 0, 0.02, 0.98).map(([x, y]) => ros(x, y, 6)).join('');
      s += onFront(t, Math.round(t.rx / 9), t.h, 0.03, 0.97).map(([x, y]) => ros(x, y, 5)).join('');
    } else if (state.coating === 'zucchero') {
      s += `<g class="pearls">${onFront(t, Math.round(t.rx / 4.5), t.h - 2, 0.02, 0.98).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#FFFDF9" stroke="${shade(state.tint, -0.15)}" stroke-width=".6"/>`).join('')}</g>`;
      s += `<path d="M${CX - t.rx} ${t.yt + t.h * 0.55}A${t.rx} ${t.ry} 0 0 0 ${CX + t.rx} ${t.yt + t.h * 0.55}" stroke="${shade(state.tint, -0.12)}" stroke-width="6" fill="none" opacity=".55"/>`;
    }
    return s + '</g>';
  }

  function drawDecor(top) {
    const out = {};
    const pts = (n, spread = 0.62, seedN = 3) => {
      rs = seedN;
      return Array.from({ length: n }, (_, k) => {
        const a = (k / n) * Math.PI * 2 + rnd() * 0.5, r = spread * (0.35 + rnd() * 0.65);
        return [CX + Math.cos(a) * top.rx * r, top.yt + Math.sin(a) * top.ry * r];
      }).sort((a, b) => a[1] - b[1]);
    };
    out.fragole = pts(6, 0.6, 9).map(([x, y]) => `<g transform="translate(${x} ${y - 8})">
      <path d="M0 14C-9 8-10-2-5-5s5-1 5 1c0-2 1-4 5-1s4 13-5 19Z" fill="#D2344A"/>
      <path d="M-5-5l2 3 3-4 3 4 2-3-5-2Z" fill="#4E8A3A"/>
      <g fill="#F6D57A"><circle cx="-3" cy="2" r=".7"/><circle cx="2" cy="1" r=".7"/><circle cx="0" cy="6" r=".7"/><circle cx="-2" cy="9" r=".7"/><circle cx="3" cy="7" r=".7"/></g></g>`).join('');
    out.bosco = pts(14, 0.75, 21).map(([x, y], k) => k % 3 === 0
      ? `<g transform="translate(${x} ${y - 4})">${[[0, 0], [3, 1], [-3, 1], [0, 3], [2, -2], [-2, -2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="#C2324F"/>`).join('')}</g>`
      : `<g transform="translate(${x} ${y - 4})"><circle r="4.4" fill="#3C4377"/><circle cx="-1.4" cy="-1.4" r="1.2" fill="#9AA3D9" opacity=".7"/></g>`).join('');
    const mac = ['#F2B8C6', '#C9DFA3', '#F6E3A1', '#BFD6EA', '#D9C2EA'];
    out.macarons = onFront({ ...top, ry: top.ry * 0.9 }, 7, 0, 1.08, 1.92).map(([x, y], k) => `<g transform="translate(${x} ${y - 10})">
      <ellipse cy="-4" rx="10" ry="5" fill="${mac[k % 5]}"/><rect x="-9" y="-3" width="18" height="4" rx="2" fill="#FFF8EC"/><ellipse cy="4" rx="10" ry="5" fill="${shade(mac[k % 5], -0.08)}"/></g>`).join('');
    const flower = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${[0, 72, 144, 216, 288].map((r) => `<ellipse rx="3.4" ry="6.4" cy="-5.6" fill="${c}" transform="rotate(${r})"/>`).join('')}<circle r="2.6" fill="#F3C443"/></g>`;
    const fl = ['#F7F2FA', '#E8A7C0', '#B79CD9', '#F7F2FA', '#F1C7D6'];
    const g = tierGeom();
    let cascade = pts(4, 0.5, 31).map(([x, y], k) => flower(x, y - 6, fl[k % 5], 0.9)).join('');
    g.forEach((t, ti) => {
      const th = Math.PI * (0.18 + ti * 0.05);
      const x = CX + Math.cos(th) * t.rx * 0.98, y = t.yt + t.h * 0.4 + Math.sin(th) * t.ry;
      cascade += flower(x, y, fl[(ti + 1) % 5], 1) + flower(x - 10, y + 14, fl[(ti + 2) % 5], 0.75);
    });
    out.fiori = cascade;
    out.candeline = [-0.42, -0.14, 0.14, 0.42].map((r, k) => {
      const x = CX + r * top.rx, y = top.yt + (k % 2 ? -3 : 3);
      return `<g transform="translate(${x} ${y})"><rect x="-2.5" y="-30" width="5" height="30" rx="1.5" fill="#F7F1E6"/>
        <path d="M-2.5-26l5-4M-2.5-18l5-4M-2.5-10l5-4" stroke="${['#D2344A', '#3C77B5', '#E5A93A', '#5E9E64'][k]}" stroke-width="2"/>
        <path d="M0-31v-3" stroke="#3B2A20" stroke-width="1"/>
        <g class="flame" style="--d:${k * 0.13}s"><ellipse cy="-40" rx="7" ry="9" fill="#FFC75A" opacity=".25"/><path d="M0-46c4 5 4 9 0 11-4-2-4-6 0-11Z" fill="#FFB547"/><path d="M0-42c2 3 2 5 0 6-2-1-2-3 0-6Z" fill="#FFF3C4"/></g></g>`;
    }).join('');
    return out;
  }

  function drawSlice() {
    const t = tierGeom()[0];
    const H = t.h + 8, W = 116, x0 = 0, y0 = 0;
    const f = fillC(), sp = sponge(), coat = state.coating === 'naked' ? '#FBF3E2' : coatColor();
    const bands = [[0, 0.07, coat], [0.07, 0.31, sp], [0.31, 0.43, f.color], [0.43, 0.67, sp], [0.67, 0.79, f.color], [0.79, 1, sp]];
    let s = `<ellipse cx="62" cy="${H + 10}" rx="86" ry="14" fill="#fff" opacity=".9"/><ellipse cx="62" cy="${H + 10}" rx="86" ry="14" fill="none" stroke="#C9B48E"/>`;
    s += `<path d="M${x0} ${y0}L${x0 + 40} ${y0 - 26}L${x0 + W} ${y0}Z" fill="${coat}"/>`;
    s += `<path d="M${x0 + W} ${y0}L${x0 + 40} ${y0 - 26}L${x0 + W + 10} ${y0 - 12}L${x0 + W + 10} ${y0 + H - 12}L${x0 + W} ${y0 + H}Z" fill="${state.coating === 'naked' ? sp : shade(coat.startsWith('#') ? coat : '#FBF6EC', -0.1)}"/>`;
    bands.forEach(([a, b, c]) => { s += `<rect x="${x0}" y="${y0 + H * a}" width="${W}" height="${H * (b - a) + 0.5}" fill="${c}"/>`; });
    // alveoli del pan di spagna
    rs = 41;
    [[0.07, 0.31], [0.43, 0.67], [0.79, 1]].forEach(([a, b]) => {
      for (let k = 0; k < 9; k++) s += `<circle cx="${x0 + 6 + rnd() * (W - 12)}" cy="${y0 + H * (a + 0.03 + rnd() * (b - a - 0.06))}" r="${0.8 + rnd() * 1.4}" fill="${shade(sp, -0.18)}" opacity=".6"/>`;
    });
    if (f.dots) [[0.31, 0.43], [0.67, 0.79]].forEach(([a]) => { for (let k = 0; k < 7; k++) s += `<rect x="${x0 + 8 + k * 15}" y="${y0 + H * (a + 0.04)}" width="3" height="3" rx="1" fill="#3A1F14"/>`; });
    if (state.filling === 'frutti') [[0.31], [0.67]].forEach(([a]) => { for (let k = 0; k < 5; k++) s += `<circle cx="${x0 + 12 + k * 22}" cy="${y0 + H * (a + 0.06)}" r="3" fill="#7E1F3C"/>`; });
    if (state.coating === 'ganache') s += `<path d="M${x0} ${y0}h${W}v6c-8 0-6 10-12 10s-4-10-12-8-6 6-14 6-6-8-14-8H${x0}Z" fill="${coat}"/>`;
    s += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.12)"/>`;
    return s;
  }

  function render() {
    const g = tierGeom();
    const top = g[g.length - 1];
    const deco = drawDecor(top);
    const coat = coatColor();
    const textColor = state.coating === 'ganache' ? '#E2C27A' : state.coating === 'zucchero' ? shade(state.tint, -0.55) : '#5A3424';
    const b = g[0];
    const ty = b.yt + b.h * 0.58;
    const tPath = `M${CX - b.rx * 0.78} ${ty + b.ry * 0.25}Q${CX} ${ty + b.ry * 1.6} ${CX + b.rx * 0.78} ${ty + b.ry * 0.25}`;
    const decorOrder = ['bosco', 'fragole', 'macarons', 'candeline', 'fiori'];

    svg.innerHTML = `<defs>
        <linearGradient id="ck_shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
        <linearGradient id="ck_stand" x1="0" x2="1"><stop offset="0" stop-color="#C9CED6"/><stop offset=".5" stop-color="#F4F6F8"/><stop offset="1" stop-color="#B5BBC4"/></linearGradient>
        <path id="ck_text" d="${tPath}"/>
      </defs>
      <g class="cake-all ${state.slice ? 'is-sliced' : ''}">
        <ellipse class="cake-shadow" cx="${CX}" cy="${FLOOR + 50}" rx="120" ry="10"/>
        <path d="M${CX - 34} ${FLOOR + 48}h68l-14-34h-40Z" fill="url(#ck_stand)"/>
        <ellipse cx="${CX}" cy="${FLOOR + 6}" rx="${Math.max(170, b.rx + 22)}" ry="26" fill="url(#ck_stand)"/>
        <ellipse cx="${CX}" cy="${FLOOR + 2}" rx="${Math.max(170, b.rx + 22) - 6}" ry="22" fill="#FBFCFD"/>
        ${g.map(drawTier).join('')}
        ${state.text.trim() ? `<text class="cake-text" font-family="Pinyon Script, cursive" font-size="${Math.min(30, b.rx / 4.2)}" fill="${textColor}" stroke="${textColor}"><textPath href="#ck_text" startOffset="50%" text-anchor="middle">${escapeXml(state.text)}</textPath></text>` : ''}
        ${decorOrder.filter((d) => state.decor.includes(d)).map((d) => `<g class="decor" data-decor="${d}">${deco[d]}</g>`).join('')}
      </g>
      <g transform="translate(272 ${FLOOR - 40})"><g class="slice ${state.slice ? 'is-out' : ''}">${drawSlice()}</g></g>`;
    void coat;

    // animazioni in base a cosa è cambiato
    if (prev && !M.reduced) {
      if (state.tiers > prev.tiers) $$('.tier', svg).slice(prev.tiers).forEach((el) => el.classList.add('drop'));
      if (state.coating !== prev.coating || state.tint !== prev.tint) $$('.tier', svg).forEach((el) => el.classList.add('pour'));
      state.decor.filter((d) => !prev.decor.includes(d)).forEach((d) => $(`[data-decor=${d}]`, svg)?.classList.add('pop'));
      if (state.text !== prev.text && state.text.trim()) $('.cake-text', svg)?.classList.add('pipe');
      if ((state.base !== prev.base || state.filling !== prev.filling) && state.slice) $('.slice', svg).classList.add('bump');
    } else if (!prev && !M.reduced) {
      $('.cake-text', svg)?.classList.add('pipe');
    }
    prev = { ...state, decor: [...state.decor] };

    // ui
    const { ds, kg } = dims();
    servOut.textContent = `${state.servings} persone`;
    $('#cakeDims').textContent = `${state.tiers > 1 ? state.tiers + ' piani · ' : ''}Ø ${ds.join('/')} cm · ${kg.toFixed(1).replace('.', ',')} kg`;
    animatePrice(price());
    $('#cakeTextCount').textContent = `${state.text.length}/24`;
    $('[data-group=tint]', form).hidden = state.coating !== 'zucchero';
    const st = $('#sliceToggle');
    st.setAttribute('aria-pressed', state.slice);
    st.textContent = state.slice ? 'Torna alla torta' : 'Vedi la fetta';
    svg.setAttribute('aria-label', `Torta ${state.tiers} ${state.tiers > 1 ? 'piani' : 'piano'}, ${C.base.find((x) => x.v === state.base).label}, farcitura ${C.filling.find((x) => x.v === state.filling).label}, ${C.coating.find((x) => x.v === state.coating).label}`);
  }

  const escapeXml = (s) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  let shownPrice = 0, pAnim;
  function animatePrice(to) {
    const el = $('#cakePrice');
    cancelAnimationFrame(pAnim);
    if (M.reduced) { el.textContent = M.eur(to); shownPrice = to; return; }
    const from = shownPrice, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 450);
      shownPrice = from + (to - from) * (1 - Math.pow(1 - k, 3));
      el.textContent = M.eur(shownPrice);
      if (k < 1) pAnim = requestAnimationFrame(step); else shownPrice = to;
    };
    pAnim = requestAnimationFrame(step);
  }

  let cakeN = 0;
  $('#cakeAdd').addEventListener('click', () => {
    const lab = (g) => C[g].find((x) => x.v === state[g]).label;
    const d = M.fromKey(state.date);
    cakeN++;
    const clone = svg.cloneNode(true);
    clone.querySelector('.slice')?.parentNode.remove();
    clone.querySelector('.cake-all')?.classList.remove('is-sliced');
    clone.removeAttribute('id');
    const thumb = clone.outerHTML.replace(/ck_(\w+)/g, `ck_$1_t${cakeN}`).replace(/class="(tier|decor|cake-text)[^"]*"/g, 'class="$1"');
    M.addToCart({
      key: 'cake-' + Date.now(), cake: true, name: 'Torta su misura', price: price(), qty: 1, art: null, thumb,
      cakeDate: state.date,
      optsLabel: [`${state.tiers} ${state.tiers > 1 ? 'piani' : 'piano'}`, `${state.servings} porzioni`, lab('base'), lab('filling'), lab('coating'),
        state.decor.length ? state.decor.map((v) => C.decor.find((x) => x.v === v).label.toLowerCase()).join(', ') : null,
        state.text.trim() ? `scritta "${state.text.trim()}"` : null, `ritiro ${M.longDate(d)}`].filter(Boolean).join(' · '),
    }, svg);
  });

  render();
})();
