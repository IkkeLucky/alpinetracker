/* Mollica · vista titolare: ordini in arrivo e avvisi */
(function () {
  const M = window.M, $ = M.$, $$ = M.$$;
  const dlg = $('#owner');
  const FLOW = {
    nuovo: { label: 'Nuovo', next: 'preparazione', action: 'Inizia a preparare' },
    preparazione: { label: 'In preparazione', next: 'pronto', action: 'Segna come pronto' },
    pronto: { label: 'Pronto', next: 'ritirato', action: 'Consegnato al cliente' },
    ritirato: { label: 'Consegnato', next: null },
  };
  let filter = 'attivi', highlight = null;
  const prefs = Object.assign({ wa: true, sms: true, sound: true }, M.store.get('ownerPrefs', {}));

  const time = (ts) => { const d = new Date(ts); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  function badge() {
    const n = M.orders.list().filter((o) => o.status === 'nuovo').length;
    const b = $('#ownerBadge');
    b.hidden = n === 0; b.textContent = n;
  }

  function alerts(list) {
    const out = [];
    list.forEach((o) => {
      const what = `n. ${o.n} · ${o.mode === 'ritiro' ? 'ritiro' : 'consegna'} ${M.shortDate(M.fromKey(o.date))} ${o.slot} · ${M.eur(o.total)}`;
      if (prefs.wa) out.push({ ts: o.createdAt, ch: 'WhatsApp', to: 'Titolare', text: `Nuovo ordine ${what}` });
      if (prefs.sms) out.push({ ts: o.createdAt + 1000, ch: 'SMS', to: 'Banco 2', text: `MOLLICA: ordine ${what}` });
      if (o.readyAt && o.wa) out.push({ ts: o.readyAt, ch: 'WhatsApp', to: o.name, text: `Ordine n. ${o.n} pronto` });
    });
    return out.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }

  function render() {
    const list = M.orders.list();
    const today = M.dayKey(new Date());
    const todays = list.filter((o) => o.date === today);
    const cash = todays.reduce((s, o) => s + o.total, 0);
    const todo = list.filter((o) => o.status === 'nuovo' || o.status === 'preparazione').length;
    const shown = list.filter((o) => filter === 'tutti' || (filter === 'attivi' ? o.status !== 'ritirato' : o.status === filter));
    const now = new Date();
    dlg.innerHTML = `<div class="own">
      <header class="own__head">
        <div>
          <p class="eyebrow">Vista titolare · ${M.longDate(now)}</p>
          <h2 id="ownerTitle">Ordini al bancone</h2>
        </div>
        <button class="icon-btn" type="button" data-close aria-label="Chiudi la vista titolare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </header>
      <div class="own__stats">
        <div><span class="mono small muted">Ordini per oggi</span><strong>${todays.length}</strong></div>
        <div><span class="mono small muted">Incasso previsto</span><strong>${M.eur(cash)}</strong></div>
        <div class="${todo ? 'is-warn' : ''}"><span class="mono small muted">Da preparare</span><strong>${todo}</strong></div>
      </div>
      <div class="own__grid">
        <section aria-label="Ordini">
          <div class="tabs tabs--sm" role="tablist" aria-label="Filtra ordini">
            ${[['attivi', 'Da gestire'], ['nuovo', 'Nuovi'], ['pronto', 'Pronti'], ['tutti', 'Tutti']].map(([v, l]) => `<button role="tab" type="button" id="own-tab-${v}" aria-selected="${filter === v}" data-filter="${v}">${l}</button>`).join('')}
          </div>
          <ul class="orders">${shown.length ? shown.map((o) => card(o)).join('') : '<li class="orders__empty muted">Nessun ordine in questa vista.</li>'}</ul>
        </section>
        <aside class="own__side" aria-label="Avvisi e impostazioni">
          <h3>Avvisi</h3>
          <div class="own__prefs">
            ${[['wa', 'WhatsApp al titolare'], ['sms', 'SMS al banco'], ['sound', 'Campanello in negozio']].map(([k, l]) => `<label class="switch"><input type="checkbox" id="own-pref-${k}" data-pref="${k}" ${prefs[k] ? 'checked' : ''}><span class="switch__ui" aria-hidden="true"></span><span>${l}</span></label>`).join('')}
          </div>
          <ol class="alerts">${alerts(list).map((a) => `<li><span class="alerts__ch alerts__ch--${a.ch === 'SMS' ? 'sms' : 'wa'} mono">${a.ch}</span><div><strong>${a.to}</strong><span>${a.text}</span></div><time class="mono">${time(a.ts)}</time></li>`).join('')}</ol>
          <p class="note">Apri il sito in un'altra scheda e fai un ordine: qui arriva in tempo reale, con il campanello. <a href="#titolare" target="_blank" rel="noopener">Apri questa vista in una nuova scheda</a></p>
        </aside>
      </div>
    </div>`;
  }

  function card(o) {
    const f = FLOW[o.status];
    const d = M.fromKey(o.date);
    return `<li class="order order--${o.status} ${o.id === highlight ? 'is-new' : ''}" data-id="${o.id}">
      <div class="order__num"><span class="mono small">n.</span>${String(o.n).padStart(2, '0')}</div>
      <div class="order__main">
        <div class="order__top">
          <strong>${o.name}</strong>
          <span class="pill pill--${o.status}">${f.label}</span>
          ${o.example ? '<span class="pill pill--example">esempio</span>' : ''}
        </div>
        <p class="order__when mono">${o.mode === 'ritiro' ? 'Ritiro' : 'Consegna'} · ${M.shortDate(d)} · ${o.slot}${o.address ? ' · ' + o.address : ''}</p>
        <ul class="order__items">${o.items.map((i) => `<li>${i.qty} × ${i.name}${i.optsLabel ? ` <span class="muted">(${i.optsLabel})</span>` : ''}</li>`).join('')}</ul>
        ${o.note ? `<p class="order__note">“${o.note}”</p>` : ''}
        <div class="order__foot">
          <span class="mono">${M.eur(o.total)} · ${o.pay}</span>
          <span class="mono muted small">${o.phone} · ricevuto ${time(o.createdAt)}</span>
          ${f.next ? `<button class="btn btn--sm ${o.status === 'nuovo' ? 'btn--ink' : 'btn--line'}" type="button" data-advance="${o.id}">${f.action}</button>` : ''}
        </div>
      </div>
    </li>`;
  }

  dlg.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { filter = f.dataset.filter; render(); return; }
    const a = e.target.closest('[data-advance]');
    if (a) {
      const o = M.orders.list().find((x) => x.id === a.dataset.advance);
      const next = FLOW[o.status].next;
      const patch = { status: next };
      if (next === 'pronto') patch.readyAt = Date.now();
      M.orders.update(o.id, patch);
      if (next === 'pronto') {
        M.toast(o.wa ? `Avviso "pronto" inviato a <strong>${o.name}</strong> su WhatsApp.` : `Ordine n. ${o.n} segnato come pronto.`);
        M.customerReady({ ...o, ...patch });
      }
    }
  });
  dlg.addEventListener('change', (e) => {
    const k = e.target.dataset.pref;
    if (k) { prefs[k] = e.target.checked; M.store.set('ownerPrefs', prefs); render(); }
  });

  window.addEventListener('mollica:orders', () => { badge(); if (dlg.open) render(); });
  // ordine arrivato da un'altra scheda
  window.addEventListener('mollica:remote', (e) => {
    if (e.detail?.type !== 'new') return;
    const o = M.orders.list().find((x) => x.id === e.detail.id);
    if (o) M.ownerNotify(o);
  });

  M.ownerNotify = (o) => {
    if (prefs.sound) M.chime();
    highlight = o.id;
    badge();
    if (dlg.open) { filter = 'attivi'; render(); return; }
    setTimeout(() => M.toast(`🔔 Il forno ha ricevuto l'ordine <strong>n. ${o.n}</strong> · ${M.eur(o.total)}`, { label: 'Vista titolare', fn: () => M.openOwner(o.id) }), 900);
  };

  M.openOwner = (id) => {
    if (id) highlight = id;
    filter = 'attivi';
    render();
    M.openDialog(dlg);
  };
  $$('[data-open-owner]').forEach((b) => b.addEventListener('click', () => M.openOwner()));
  if (location.hash === '#titolare') setTimeout(() => M.openOwner(), 300);
  window.addEventListener('hashchange', () => { if (location.hash === '#titolare') M.openOwner(); });

  badge();
})();
