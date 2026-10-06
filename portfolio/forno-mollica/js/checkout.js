/* Mollica · checkout in tre passi, biglietto eliminacode, messaggi WhatsApp */
(function () {
  const M = window.M, $ = M.$, $$ = M.$$;
  const dlg = $('#checkout');
  const CAPS = ['10121', '10122', '10123', '10124', '10125', '10126', '10127', '10128'];
  const PAY = [
    { v: 'applepay', label: 'Apple Pay', mark: '' },
    { v: 'googlepay', label: 'Google Pay', mark: 'G' },
    { v: 'satispay', label: 'Satispay', mark: 'S' },
    { v: 'carta', label: 'Carta', mark: '▭' },
    { v: 'ritiro', label: 'Paga al ritiro', mark: '€' },
  ];

  let st;
  const reset = () => {
    st = { step: 1, mode: 'ritiro', day: null, slot: null, cap: '', address: '', name: '', phone: '', note: '', wa: true, pay: 'satispay', busy: false };
  };

  /* ───────────── giorni e orari ───────────── */
  function days() {
    const cake = M.cart.items.filter((i) => i.cake).map((i) => i.cakeDate).sort().pop();
    const out = [];
    for (let i = 0; out.length < 6 && i < 14; i++) {
      const d = M.addDays(new Date(), i);
      if (M.isClosed(d)) continue;
      const key = M.dayKey(d);
      const ok = !cake || key === cake;
      if (i === 0 && slots(d).every((s) => s.off)) continue;
      out.push({ d, key, ok, label: i === 0 ? 'Oggi' : i === 1 ? 'Domani' : M.shortDate(d).split(' ')[0] });
    }
    if (cake && !out.some((x) => x.key === cake)) { const d = M.fromKey(cake); out.push({ d, key: cake, ok: true, label: M.shortDate(d).split(' ')[0] }); }
    return { list: out, cake };
  }
  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  function slots(d) {
    const key = M.dayKey(d), today = key === M.dayKey(new Date());
    const earliest = today ? M.nowMin() + 30 : 0;
    const out = [];
    if (st.mode === 'ritiro') {
      for (let m = 7 * 60; m <= M.closeTime(d) - 15; m += 15) {
        const hot = M.BAKES.some((b) => m >= b.min && m - b.min <= 10);
        out.push({ v: M.hhmm(m), label: M.hhmm(m), past: m < earliest, off: m < earliest || hash(key + m) % 6 === 0, full: hash(key + m) % 6 === 0, hot });
      }
    } else {
      const wins = d.getDay() === 0 ? [[8 * 60, 12 * 60]] : [[8 * 60, 12 * 60], [16 * 60, 19 * 60]];
      wins.forEach(([a, b]) => { for (let m = a; m < b; m += 30) out.push({ v: `${M.hhmm(m)}–${M.hhmm(m + 30)}`, label: `${M.hhmm(m)}–${M.hhmm(m + 30)}`, past: m < earliest, off: m < earliest || hash(key + m) % 5 === 0, full: hash(key + m) % 5 === 0 }); });
    }
    return out.filter((x) => !x.past);
  }

  const sub = () => M.cart.subtotal();
  const fee = () => (st.mode === 'consegna' && sub() < 30 ? 2.9 : 0);
  const total = () => sub() + fee();

  /* ───────────── rendering ───────────── */
  function shell(inner) {
    const steps = ['Quando', 'Chi', 'Paga'];
    return `<div class="co">
      <header class="co__head">
        <button class="icon-btn" type="button" ${st.step > 1 && st.step < 4 ? 'data-back' : 'data-close'} aria-label="${st.step > 1 && st.step < 4 ? 'Indietro' : 'Chiudi'}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${st.step > 1 && st.step < 4 ? '<path d="M15 5l-7 7 7 7"/>' : '<path d="M6 6l12 12M18 6 6 18"/>'}</svg></button>
        ${st.step < 4 ? `<ol class="co__steps">${steps.map((s, i) => `<li class="${i + 1 === st.step ? 'is-now' : i + 1 < st.step ? 'is-done' : ''}"><span class="mono">${i + 1}</span>${s}</li>`).join('')}</ol>` : '<span></span>'}
        <span class="co__total mono">${st.step < 4 ? M.eur(total()) : ''}</span>
      </header>
      <div class="co__body">${inner}</div>
    </div>`;
  }

  function stepWhen() {
    const { list, cake } = days();
    if (!st.day || !list.find((x) => x.key === st.day && x.ok)) st.day = (list.find((x) => x.ok) || list[0]).key;
    const d = M.fromKey(st.day);
    const sl = slots(d);
    if (st.slot && !sl.find((s) => s.v === st.slot && !s.off)) st.slot = null;
    const capOk = CAPS.includes(st.cap);
    return `<h2 id="coTitle" class="co__title">Quando lo vuoi?</h2>
      <div class="seg seg--wide" role="radiogroup" aria-label="Ritiro o consegna">
        <label class="seg__opt"><input type="radio" name="mode" id="co-mode-ritiro" value="ritiro" ${st.mode === 'ritiro' ? 'checked' : ''}><span><b>Ritiro al bancone</b><small>gratis · pronto all'orario scelto</small></span></label>
        <label class="seg__opt"><input type="radio" name="mode" id="co-mode-consegna" value="consegna" ${st.mode === 'consegna' ? 'checked' : ''}><span><b>Consegna in bici</b><small>${sub() >= 30 ? 'gratis per questo ordine' : '€ 2,90 · gratis sopra € 30'}</small></span></label>
      </div>
      ${st.mode === 'consegna' ? `<div class="co__row">
        <label class="field"><span class="field__label">CAP</span><input id="co-cap" inputmode="numeric" maxlength="5" placeholder="10123" value="${st.cap}"></label>
        <label class="field field--grow"><span class="field__label">Indirizzo e citofono</span><input id="co-address" placeholder="Via Po 18, citofono Rossi" value="${st.address}"></label>
      </div>
      <p class="note ${st.cap.length === 5 ? (capOk ? 'note--ok' : 'note--bad') : ''}" id="co-capnote">${st.cap.length === 5 ? (capOk ? 'Consegniamo in questa zona.' : 'Questo CAP è fuori dai nostri 3 km. Puoi scegliere il ritiro al bancone.') : 'Consegniamo nei CAP da 10121 a 10128.'}</p>` : ''}
      ${cake ? `<p class="note note--info">Nel sacchetto c'è una torta su misura: prepariamo tutto per ${M.longDate(M.fromKey(cake))}.</p>` : ''}
      <div class="co__label">Giorno</div>
      <div class="days">${list.map((x) => `<label class="day"><input type="radio" name="day" id="co-day-${x.key}" value="${x.key}" ${x.key === st.day ? 'checked' : ''} ${x.ok ? '' : 'disabled'}><span><small>${x.label}</small><b>${x.d.getDate()}</b><small>${M.shortDate(x.d).split(' ')[2]}</small></span></label>`).join('')}</div>
      <div class="co__label">Orario <span class="muted small">${st.mode === 'ritiro' ? 'ogni 15 minuti' : 'fasce di 30 minuti'}</span></div>
      <div class="slots">${sl.map((s) => `<label class="slot ${s.hot ? 'slot--hot' : ''}"><input type="radio" name="slot" id="co-slot-${s.v.replace(/\D/g, '')}" value="${s.v}" ${s.v === st.slot ? 'checked' : ''} ${s.off ? 'disabled' : ''}><span>${s.label}${s.full ? '<small>pieno</small>' : s.hot ? '<small>appena sfornato</small>' : ''}</span></label>`).join('')}</div>
      <footer class="co__foot"><button class="btn btn--ink btn--block" type="button" data-next ${canNext() ? '' : 'disabled'}>${nextLabel()}</button></footer>`;
  }

  function stepWho() {
    return `<h2 id="coTitle" class="co__title">A chi lo diamo?</h2>
      <button type="button" class="link-btn" data-sample>Compila con dati di esempio</button>
      <label class="field"><span class="field__label">Nome</span><input id="co-name" autocomplete="given-name" placeholder="Giulia" value="${st.name}"></label>
      <label class="field"><span class="field__label">Cellulare</span><span class="field__prefix"><span class="mono">+39</span><input id="co-phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="333 123 4567" value="${st.phone}"></span></label>
      <label class="field"><span class="field__label">Note per il forno <span class="muted">facoltativo</span></span><textarea id="co-note" rows="2" placeholder="Pagnotta ben cotta, per favore">${st.note}</textarea></label>
      <label class="switch"><input type="checkbox" id="co-wa" ${st.wa ? 'checked' : ''}><span class="switch__ui" aria-hidden="true"></span><span>Avvisami su WhatsApp quando l'ordine è pronto</span></label>
      <footer class="co__foot"><button class="btn btn--ink btn--block" type="button" data-next ${canNext() ? '' : 'disabled'}>Vai al pagamento</button></footer>`;
  }

  function stepPay() {
    const d = M.fromKey(st.day);
    const opts = PAY.filter((p) => p.v !== 'ritiro' || st.mode === 'ritiro');
    if (!opts.find((p) => p.v === st.pay)) st.pay = 'satispay';
    return `<h2 id="coTitle" class="co__title">Riepilogo e pagamento</h2>
      <div class="recap">
        <p><strong>${st.mode === 'ritiro' ? 'Ritiro al bancone' : 'Consegna in bici'}</strong> · ${M.longDate(d)} · ${st.slot}</p>
        ${st.mode === 'consegna' ? `<p class="muted small">${st.address || 'Indirizzo da confermare'}, ${st.cap} Torino</p>` : '<p class="muted small">Via dei Fornai 12, Torino</p>'}
        <ul class="recap__lines">${M.cart.items.map((i) => `<li><span>${i.qty} × ${i.name}${i.optsLabel ? `<small>${i.optsLabel}</small>` : ''}</span><span class="mono">${M.eur(i.qty * i.price)}</span></li>`).join('')}</ul>
        <div class="recap__sum"><span>Subtotale</span><span class="mono">${M.eur(sub())}</span></div>
        ${st.mode === 'consegna' ? `<div class="recap__sum"><span>Consegna</span><span class="mono">${fee() ? M.eur(fee()) : 'gratis'}</span></div>` : ''}
        <div class="recap__sum recap__sum--total"><span>Totale</span><span class="mono">${M.eur(total())}</span></div>
      </div>
      <div class="co__label">Come paghi</div>
      <div class="pays">${opts.map((p) => `<label class="pay"><input type="radio" name="pay" id="co-pay-${p.v}" value="${p.v}" ${p.v === st.pay ? 'checked' : ''}><span><i class="pay__mark pay__mark--${p.v}" aria-hidden="true">${p.mark}</i>${p.label}</span></label>`).join('')}</div>
      <p class="note">Prototipo: nessun addebito. Con il backend il pagamento passa da Stripe o Satispay.</p>
      <footer class="co__foot"><button class="btn btn--ink btn--block btn--pay ${st.busy ? 'is-busy' : ''}" type="button" data-pay>
        <span class="btn__label">${st.pay === 'ritiro' ? 'Conferma ordine' : 'Paga ' + M.eur(total())}</span><span class="btn__spin" aria-hidden="true"></span></button></footer>`;
  }

  function stepDone(o) {
    const d = M.fromKey(o.date);
    return `<div class="done">
      <div class="dispenser" aria-hidden="true">
        <div class="dispenser__body"><span>Prendi il numero</span></div>
        <div class="ticket">
          <span class="ticket__brand">Mollica</span>
          <span class="ticket__label mono">il tuo numero</span>
          <span class="ticket__num">${String(o.n).padStart(2, '0')}</span>
          <span class="ticket__when mono">${M.shortDate(d)} · ${o.slot}</span>
        </div>
      </div>
      <h2 id="coTitle" class="co__title">Ordine ricevuto, numero ${o.n}</h2>
      <p>${o.mode === 'ritiro' ? `Ti aspettiamo ${M.longDate(d)} alle ${o.slot} al bancone. Di' il tuo numero e salti la fila.` : `Arriviamo ${M.longDate(d)} tra le ${o.slot.replace('–', ' e le ')}.`}${o.wa ? ' Ti abbiamo scritto su WhatsApp.' : ''}</p>
      <div class="receipt mono">
        ${o.items.map((i) => `<div><span>${i.qty} × ${i.name}</span><span>${M.eur(i.qty * i.price)}</span></div>`).join('')}
        ${o.fee ? `<div><span>Consegna</span><span>${M.eur(o.fee)}</span></div>` : ''}
        <div class="receipt__tot"><span>Totale · ${o.pay}</span><span>${M.eur(o.total)}</span></div>
      </div>
      <div class="done__cta">
        <button class="btn btn--ink" type="button" data-owner-view>Guarda cosa vede il forno</button>
        <button class="btn btn--line" type="button" data-close>Torna al bancone</button>
      </div>
    </div>`;
  }

  function canNext() {
    if (st.step === 1) return !!st.slot && (st.mode === 'ritiro' || (CAPS.includes(st.cap) && st.address.trim().length > 3));
    if (st.step === 2) return st.name.trim().length > 1 && st.phone.replace(/\D/g, '').length >= 9;
    return true;
  }
  const nextLabel = () => (st.slot ? `Continua · ${st.mode === 'ritiro' ? 'ritiro' : 'consegna'} alle ${st.slot.split('–')[0]}` : 'Scegli un orario');

  let lastOrder = null;
  function render(focus) {
    const inner = st.step === 1 ? stepWhen() : st.step === 2 ? stepWho() : st.step === 3 ? stepPay() : stepDone(lastOrder);
    dlg.innerHTML = shell(inner);
    dlg.dataset.step = st.step;
    if (focus) { const el = dlg.querySelector('#' + focus); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
  }
  function refreshNext() {
    const b = dlg.querySelector('[data-next]');
    if (b) { b.disabled = !canNext(); if (st.step === 1) b.textContent = nextLabel(); }
  }

  /* ───────────── eventi ───────────── */
  dlg.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'mode') { st.mode = t.value; st.slot = null; render(); }
    else if (t.name === 'day') { st.day = t.value; st.slot = null; render(); }
    else if (t.name === 'slot') { st.slot = t.value; refreshNext(); }
    else if (t.name === 'pay') { st.pay = t.value; dlg.querySelector('.btn__label').textContent = st.pay === 'ritiro' ? 'Conferma ordine' : 'Paga ' + M.eur(total()); }
    else if (t.id === 'co-wa') st.wa = t.checked;
  });
  dlg.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'co-cap') {
      st.cap = t.value.replace(/\D/g, '').slice(0, 5); t.value = st.cap;
      const n = $('#co-capnote', dlg), ok = CAPS.includes(st.cap);
      n.className = 'note ' + (st.cap.length === 5 ? (ok ? 'note--ok' : 'note--bad') : '');
      n.textContent = st.cap.length === 5 ? (ok ? 'Consegniamo in questa zona.' : 'Questo CAP è fuori dai nostri 3 km. Puoi scegliere il ritiro al bancone.') : 'Consegniamo nei CAP da 10121 a 10128.';
      dlg.querySelector('.co__total').textContent = M.eur(total());
    }
    if (t.id === 'co-address') st.address = t.value;
    if (t.id === 'co-name') st.name = t.value;
    if (t.id === 'co-phone') st.phone = t.value;
    if (t.id === 'co-note') st.note = t.value;
    refreshNext();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) { st.step--; render(); return; }
    if (e.target.closest('[data-next]')) { st.step++; render(); dlg.querySelector('.co__body').scrollTop = 0; return; }
    if (e.target.closest('[data-sample]')) { st.name = 'Giulia'; st.phone = '333 123 4567'; st.note = 'Pagnotta ben cotta, per favore'; render(); return; }
    if (e.target.closest('[data-pay]')) { pay(); return; }
    if (e.target.closest('[data-owner-view]')) { M.closeDialog(dlg); setTimeout(() => M.openOwner(lastOrder?.id), 240); }
  });
  dlg.addEventListener('close', () => { if (st.step === 4) reset(); });

  function pay() {
    if (st.busy) return;
    st.busy = true;
    const btn = dlg.querySelector('[data-pay]');
    btn.classList.add('is-busy'); btn.disabled = true;
    setTimeout(() => {
      const n = M.orders.nextNumber();
      const payLabel = PAY.find((p) => p.v === st.pay).label;
      const o = {
        id: 'o-' + n + '-' + Date.now().toString(36), n, name: st.name.trim(), phone: '+39 ' + st.phone.trim(), note: st.note.trim(), wa: st.wa,
        mode: st.mode, address: st.mode === 'consegna' ? `${st.address}, ${st.cap}` : '', date: st.day, slot: st.slot,
        items: M.cart.items.map((i) => ({ name: i.name, qty: i.qty, optsLabel: i.optsLabel, price: i.price, cake: !!i.cake })),
        subtotal: sub(), fee: fee(), total: total(), pay: payLabel, status: 'nuovo', createdAt: Date.now(),
      };
      M.orders.add(o);
      lastOrder = o;
      M.cart.clear();
      st.busy = false; st.step = 4;
      render();
      M.ownerNotify?.(o);
      if (o.wa) setTimeout(() => customerMessages(o), 1600);
    }, 1400);
  }

  function customerMessages(o) {
    const d = M.fromKey(o.date);
    M.phone({
      name: 'Mollica Forno', sub: 'WhatsApp · account aziendale', avatar: 'M',
      caption: `Anteprima: messaggio WhatsApp ricevuto da ${o.name}`,
      messages: [
        { text: `Ciao ${o.name}! 🥖 Abbiamo ricevuto il tuo ordine <b>n. ${o.n}</b>.`, delay: 900 },
        { text: `${o.mode === 'ritiro' ? `Ritiro <b>${M.longDate(d)}</b> alle <b>${o.slot}</b> in Via dei Fornai 12.` : `Consegna <b>${M.longDate(d)}</b>, ${o.slot}.`} Totale ${M.eur(o.total)} · ${o.pay}.`, delay: 1300 },
        { text: 'Ti scriviamo appena è pronto. Per modifiche rispondi pure qui.', delay: 1100 },
      ],
    });
  }
  M.customerReady = (o) => {
    if (!o.wa) return;
    M.phone({
      name: 'Mollica Forno', sub: 'WhatsApp · account aziendale', avatar: 'M',
      caption: `Anteprima: avviso "pronto" inviato a ${o.name}`,
      messages: [{ text: `${o.name}, il tuo ordine <b>n. ${o.n}</b> è pronto ${o.mode === 'ritiro' ? 'sul bancone' : 'e sta partendo in bici'}. Ancora caldo! 🔥`, delay: 900 }],
    });
  };

  M.openCheckout = () => {
    if (!M.cart.items.length) { M.openBag(); return; }
    reset();
    render();
    M.openDialog(dlg);
  };
})();
