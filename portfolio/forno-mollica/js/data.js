/* Mollica · dati del forno (in produzione arriveranno dal backend) */
(function () {
  const PRODUCTS = [
    // ── Pane
    { id: 'pagnotta', cat: 'pane', art: 'pagnotta', name: 'Pagnotta di grani antichi',
      desc: 'Lievito madre, 48 ore di fermentazione, crosta spessa e mollica alveolata.',
      unit: '~900 g', perKg: 7.2, price: 6.5, allergens: ['G'],
      options: [
        { key: 'size', label: 'Formato', choices: [
          { v: 'intera', label: 'Intera · ~900 g', delta: 0 },
          { v: 'mezza', label: 'Mezza · ~450 g', delta: -3.1 } ] },
        { key: 'slice', label: 'Affettatura', choices: [
          { v: 'no', label: 'Intera', delta: 0 },
          { v: 'si', label: 'Affettata', delta: 0 } ] } ] },
    { id: 'semola', cat: 'pane', art: 'filone', name: 'Filone di semola rimacinata',
      desc: 'Mollica gialla e profumata, crosta sottile cosparsa di sesamo.',
      unit: '~600 g', perKg: 7.0, price: 4.2, allergens: ['G', 'S'] },
    { id: 'biove', cat: 'pane', art: 'biove', name: 'Biove piemontesi',
      desc: 'Il pane di tutti i giorni a Torino: dentro leggero, fuori croccante.',
      unit: '4 pezzi · ~320 g', perKg: 8.75, price: 2.8, allergens: ['G'] },
    { id: 'grissini', cat: 'pane', art: 'grissini', name: 'Grissini stirati a mano',
      desc: 'Rubatà all\'olio extravergine, stirati uno per uno come una volta.',
      unit: '250 g', perKg: 18, price: 4.5, allergens: ['G'] },
    // ── Lievitati
    { id: 'cornetto', cat: 'lievitati', art: 'cornetto', name: 'Cornetto sfogliato',
      desc: 'Burro di centrifuga, 27 strati, sfogliato a mano ogni notte.',
      unit: '1 pezzo · ~75 g', price: 1.4, allergens: ['G', 'L', 'U'], hot: true,
      options: [
        { key: 'fill', label: 'Ripieno', choices: [
          { v: 'vuoto', label: 'Vuoto', delta: 0 },
          { v: 'crema', label: 'Crema pasticcera', delta: 0.2 },
          { v: 'albicocca', label: 'Albicocca', delta: 0.2 },
          { v: 'pistacchio', label: 'Pistacchio', delta: 0.5 } ] } ] },
    { id: 'maritozzo', cat: 'lievitati', art: 'maritozzo', name: 'Maritozzo con la panna',
      desc: 'Brioche morbida all\'arancia, panna montata al momento.',
      unit: '1 pezzo', price: 3.0, allergens: ['G', 'L', 'U'] },
    { id: 'bombolone', cat: 'lievitati', art: 'bombolone', name: 'Bombolone',
      desc: 'Fritto in mattinata e passato nello zucchero semolato.',
      unit: '1 pezzo', price: 1.8, allergens: ['G', 'L', 'U'],
      options: [
        { key: 'fill', label: 'Ripieno', choices: [
          { v: 'crema', label: 'Crema pasticcera', delta: 0 },
          { v: 'nocciola', label: 'Crema alla nocciola', delta: 0.3 },
          { v: 'vuoto', label: 'Vuoto', delta: -0.2 } ] } ] },
    { id: 'focaccia', cat: 'lievitati', art: 'focaccia', name: 'Focaccia genovese',
      desc: 'Alta due dita, unta il giusto, sale grosso in superficie.',
      unit: 'trancio · ~150 g', perKg: 16, price: 2.5, allergens: ['G'],
      options: [
        { key: 'size', label: 'Formato', choices: [
          { v: 'trancio', label: 'Trancio · ~150 g', delta: 0 },
          { v: 'teglia', label: 'Teglia intera · 30×40 cm', delta: 15.5 } ] } ] },
    // ── Pasticceria
    { id: 'crostata', cat: 'pasticceria', art: 'crostata', name: 'Crostata di albicocche',
      desc: 'Frolla al burro e confettura di albicocche della Val di Susa.',
      unit: 'Ø 24 cm · 8 fette', price: 22, allergens: ['G', 'L', 'U'] },
    { id: 'baci', cat: 'pasticceria', art: 'baci', name: 'Baci di dama',
      desc: 'Due semisfere di nocciola unite da cioccolato fondente.',
      unit: '200 g · ~16 pezzi', perKg: 37.5, price: 7.5, allergens: ['G', 'L', 'F'] },
    { id: 'nocciole', cat: 'pasticceria', art: 'nocciole', name: 'Torta di nocciole',
      desc: 'Nocciola Piemonte IGP tostata da noi. Senza farina di frumento.',
      unit: 'Ø 22 cm', price: 19, allergens: ['U', 'L', 'F'] },
    { id: 'bignole', cat: 'pasticceria', art: 'bignole', name: 'Vassoio di bignole',
      desc: 'Piccoli bignè glassati: caffè, cioccolato, crema e zabaione.',
      unit: '12 pezzi', price: 15, allergens: ['G', 'L', 'U', 'So'] },
  ];

  /* Programma fisso delle infornate. min = minuti dopo mezzanotte */
  const BAKES = [
    { min: 6 * 60 + 40, product: 'pagnotta', batch: 40, label: 'Pagnotta di grani antichi' },
    { min: 7 * 60, product: 'cornetto', batch: 120, label: 'Cornetti sfogliati' },
    { min: 8 * 60 + 15, product: 'focaccia', batch: 6, unit: 'teglie', label: 'Focaccia genovese' },
    { min: 9 * 60 + 30, product: 'biove', batch: 60, label: 'Biove piemontesi' },
    { min: 10 * 60 + 30, product: 'grissini', batch: 30, unit: 'mazzi', label: 'Grissini stirati' },
    { min: 12 * 60, product: 'focaccia', batch: 4, unit: 'teglie', label: 'Seconda focaccia' },
    { min: 15 * 60 + 30, product: 'maritozzo', batch: 36, label: 'Maritozzi' },
    { min: 17 * 60 + 15, product: 'pagnotta', batch: 24, label: 'Pagnotta della sera' },
  ];

  const CAKE = {
    occasion: [
      { v: 'compleanno', label: 'Compleanno' },
      { v: 'battesimo', label: 'Battesimo' },
      { v: 'laurea', label: 'Laurea' },
      { v: 'matrimonio', label: 'Matrimonio' },
      { v: 'nessuna', label: 'Senza motivo' },
    ],
    tiers: [
      { v: 1, label: '1 piano' },
      { v: 2, label: '2 piani', delta: 15 },
      { v: 3, label: '3 piani', delta: 35 },
    ],
    base: [
      { v: 'classico', label: 'Pan di Spagna', color: '#F2D58C', perKg: 32 },
      { v: 'cacao', label: 'Al cacao', color: '#6B3D24', perKg: 34 },
      { v: 'mandorle', label: 'Alle mandorle', color: '#E4C58F', perKg: 36 },
      { v: 'redvelvet', label: 'Red velvet', color: '#A3253A', perKg: 36 },
    ],
    filling: [
      { v: 'chantilly', label: 'Chantilly', color: '#FBEFC9', perKg: 0 },
      { v: 'pistacchio', label: 'Pistacchio', color: '#A9BE6A', perKg: 5 },
      { v: 'gianduia', label: 'Gianduia', color: '#7A4A2B', perKg: 3 },
      { v: 'ricotta', label: 'Ricotta e gocce', color: '#F8F4EA', perKg: 2, dots: true },
      { v: 'frutti', label: 'Frutti di bosco', color: '#B03A5B', perKg: 4 },
    ],
    coating: [
      { v: 'panna', label: 'Panna montata', color: '#FBF6EC', perKg: 0 },
      { v: 'ganache', label: 'Ganache con colature', color: '#3E2116', perKg: 3 },
      { v: 'zucchero', label: 'Pasta di zucchero', color: '#F2C9CF', perKg: 6 },
      { v: 'naked', label: 'Naked cake', color: '#F2D58C', perKg: -2 },
    ],
    tint: [
      { v: '#F2C9CF', label: 'Rosa cipria' },
      { v: '#BFD6EA', label: 'Azzurro carta' },
      { v: '#C9D6B5', label: 'Salvia' },
      { v: '#F6F0E3', label: 'Avorio' },
    ],
    decor: [
      { v: 'fragole', label: 'Fragole fresche', price: 6 },
      { v: 'bosco', label: 'Frutti di bosco', price: 8 },
      { v: 'macarons', label: 'Macarons', price: 12 },
      { v: 'fiori', label: 'Fiori eduli', price: 9 },
      { v: 'candeline', label: 'Candeline', price: 2 },
    ],
  };

  const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const DAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];
  const DAYS_LONG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

  const eur = (n) => '€ ' + n.toFixed(2).replace('.', ',');
  const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const dayKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x; };
  const shortDate = (d) => DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  const longDate = (d) => DAYS_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  const closeTime = (d) => (d.getDay() === 0 ? 13 * 60 : 19 * 60 + 30);
  const isClosed = (d) => d.getDay() === 1;

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('mollica.' + key); return v ? JSON.parse(v) : fallback; }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('mollica.' + key, JSON.stringify(value)); } catch (e) { /* storage non disponibile */ }
    },
  };

  window.M = {
    PRODUCTS, BAKES, CAKE, eur, hhmm, nowMin, dayKey, fromKey, addDays, shortDate, longDate,
    closeTime, isClosed, store,
    product: (id) => PRODUCTS.find((p) => p.id === id),
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
})();
