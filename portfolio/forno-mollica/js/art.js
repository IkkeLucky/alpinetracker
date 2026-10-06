/* Mollica · illustrazioni dei prodotti (SVG disegnati a mano, viewBox 200×150) */
(function () {
  let uid = 0;
  const id = (p) => p + '-' + (++uid);

  const crustGrad = (gid, a, b, c) =>
    `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;

  const shadow = (cx = 100, rx = 70) => `<ellipse class="art__shadow" cx="${cx}" cy="134" rx="${rx}" ry="7"/>`;
  const steam = () =>
    `<g class="art__steam" fill="none"><path d="M82 46c-8-12 8-18 0-30s6-18 0-26"/><path d="M100 40c-8-12 8-18 0-30s6-18 0-26"/><path d="M118 46c-8-12 8-18 0-30s6-18 0-26"/></g>`;

  const ART = {
    pagnotta() {
      const g = id('pg');
      return `<defs>${crustGrad(g, '#8E4A1E', '#B86F2E', '#D9A35A')}</defs>${shadow()}
        <path d="M34 130c-6-50 26-84 66-84s72 34 66 84c-22 6-110 6-132 0Z" fill="url(#${g})"/>
        <path d="M60 86c22-16 64-22 92-6-28-4-62 0-92 6Z" fill="#EBC888"/>
        <path d="M60 86c26-12 64-14 92-6" stroke="#6E3714" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path class="art__score" d="M60 86c26-12 64-14 92-6" stroke="#F5DFAE" stroke-width="1.6" fill="none" stroke-linecap="round" pathLength="1"/>
        <g fill="#F7EEDC" opacity=".8"><circle cx="86" cy="68" r="1.4"/><circle cx="104" cy="62" r="1.1"/><circle cx="122" cy="66" r="1.6"/><circle cx="96" cy="74" r="1"/><circle cx="134" cy="76" r="1.2"/></g>${steam()}`;
    },
    filone() {
      const g = id('fl');
      return `<defs>${crustGrad(g, '#C27A35', '#D99B4E', '#E8BE7A')}</defs>${shadow(100, 82)}
        <path d="M20 122c-4-30 30-52 80-52s86 22 80 52c-30 12-130 12-160 0Z" fill="url(#${g})"/>
        <g stroke="#8E4A1E" stroke-width="2.4" fill="none" stroke-linecap="round">
          <path d="M52 86c8 4 14 10 18 18"/><path d="M84 78c8 4 14 10 18 18"/><path d="M116 78c8 4 14 10 18 18"/><path d="M146 84c6 4 11 9 14 15"/></g>
        <g class="art__score-set" stroke="#F3D9A0" stroke-width="1.2" fill="none" stroke-linecap="round">
          <path d="M52 86c8 4 14 10 18 18" pathLength="1"/><path d="M84 78c8 4 14 10 18 18" pathLength="1"/><path d="M116 78c8 4 14 10 18 18" pathLength="1"/></g>
        <g fill="#FFF6E2"><ellipse cx="70" cy="90" rx="1.6" ry="1" /><ellipse cx="96" cy="84" rx="1.6" ry="1"/><ellipse cx="128" cy="86" rx="1.6" ry="1"/><ellipse cx="110" cy="98" rx="1.6" ry="1"/><ellipse cx="82" cy="100" rx="1.6" ry="1"/><ellipse cx="150" cy="98" rx="1.6" ry="1"/><ellipse cx="58" cy="102" rx="1.6" ry="1"/></g>${steam()}`;
    },
    biove() {
      const g = id('bv');
      const roll = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
        <path d="M-40 24c-4-30 16-46 40-46s44 16 40 46c-14 6-66 6-80 0Z" fill="url(#${g})"/>
        <path d="M0 -20c-3 14-3 30 0 44" stroke="#9A5622" stroke-width="3" fill="none"/>
        <path d="M-22 -10c8 6 14 14 16 24M22 -10c-8 6-14 14-16 24" stroke="#E9C483" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
      return `<defs>${crustGrad(g, '#B8692A', '#D59A52', '#EDCB8C')}</defs>${shadow(100, 80)}
        ${roll(62, 106, 0.95)}${roll(138, 106, 0.95)}${roll(100, 88, 1)}`;
    },
    grissini() {
      const sticks = [-26, -15, -6, 3, 12, 22].map((r, i) =>
        `<g transform="rotate(${r} 100 130)"><rect x="${96 + (i % 2)}" y="${18 + (i % 3) * 4}" width="7" height="${112 - (i % 3) * 4}" rx="3.5" fill="#D9A256"/><path d="M${99 + (i % 2)} ${30 + (i % 3) * 4}v90" stroke="#B57A33" stroke-width="1" stroke-dasharray="6 9"/></g>`).join('');
      return `${shadow(100, 52)}${sticks}
        <path d="M70 96c20 8 40 8 60 0l2 12c-22 8-42 8-64 0Z" fill="#F4EFE4"/>
        <path d="M70 96c20 8 40 8 60 0" stroke="#3B2A20" stroke-width="1" fill="none" opacity=".25"/>
        <text x="100" y="108" text-anchor="middle" font-family="Pinyon Script, cursive" font-size="11" fill="#7A2E2E">Mollica</text>`;
    },
    cornetto() {
      const g = id('cr');
      const segs = [-48, -28, -9, 9, 28, 48].map((a, i) => {
        const w = [18, 26, 32, 32, 26, 18][i];
        return `<ellipse cx="${100 + a * 1.25}" cy="${96 - Math.cos(a / 40) * 14}" rx="${w * 0.55}" ry="${w * 0.9}" transform="rotate(${a * 1.1} ${100 + a * 1.25} ${96 - Math.cos(a / 40) * 14})" fill="url(#${g})" stroke="#9A541E" stroke-width="1.2"/>`;
      }).join('');
      return `<defs>${crustGrad(g, '#B4622A', '#D48E45', '#ECC077')}</defs>${shadow(100, 78)}
        ${segs}
        <g class="art__glaze" fill="#FFF2D6" opacity=".55"><ellipse cx="88" cy="74" rx="6" ry="2.6"/><ellipse cx="112" cy="74" rx="6" ry="2.6"/><ellipse cx="66" cy="82" rx="4" ry="2"/><ellipse cx="134" cy="82" rx="4" ry="2"/></g>${steam()}`;
    },
    maritozzo() {
      const g = id('mz');
      return `<defs>${crustGrad(g, '#B76A2E', '#D69B55', '#EDC98E')}</defs>${shadow(100, 72)}
        <path d="M36 126c-6-28 22-46 64-46s70 18 64 46c-24 6-104 6-128 0Z" fill="url(#${g})"/>
        <path d="M44 90c10-36 102-36 112 0-6 10-106 10-112 0Z" fill="#FFFDF7"/>
        <path d="M50 88c14-10 32-14 50-14s38 4 50 14" stroke="#EDE3D2" stroke-width="2" fill="none"/>
        <path d="M54 80c10 6 22 8 30 6M98 72c10 6 20 6 30 4" stroke="#EDE3D2" stroke-width="1.6" fill="none"/>
        <path d="M30 70c10-32 130-32 140 0-6 6-14 8-22 8-34-14-74-14-96 0-8 0-16-2-22-8Z" fill="url(#${g})"/>
        <g fill="#FFFFFF" opacity=".9"><circle cx="62" cy="54" r="2"/><circle cx="84" cy="48" r="2.2"/><circle cx="110" cy="46" r="1.8"/><circle cx="134" cy="52" r="2"/><circle cx="98" cy="54" r="1.6"/></g>`;
    },
    bombolone() {
      const g = id('bb');
      const sugar = Array.from({ length: 34 }, (_, i) => {
        const a = (i * 137.5) * Math.PI / 180, r = 10 + (i * 7) % 46;
        return `<rect x="${100 + Math.cos(a) * r * 1.1}" y="${86 + Math.sin(a) * r * 0.7}" width="2.2" height="2.2" rx=".5" transform="rotate(${i * 23} ${100 + Math.cos(a) * r * 1.1} ${86 + Math.sin(a) * r * 0.7})"/>`;
      }).join('');
      return `<defs>${crustGrad(g, '#C67A34', '#DE9C52', '#EDC27C')}</defs>${shadow(100, 66)}
        <path d="M38 118c-8-40 22-70 62-70s70 30 62 70c-20 14-104 14-124 0Z" fill="url(#${g})"/>
        <path d="M44 112c16 8 96 8 112 0" stroke="#F6E2B3" stroke-width="6" fill="none" opacity=".7"/>
        <g fill="#FFFBF0" opacity=".95">${sugar}</g>
        <path class="art__cream" d="M150 92c10-4 18 2 16 10s-12 10-18 4c-4-4-2-12 2-14Z" fill="#F6D27A"/>`;
    },
    focaccia() {
      const g = id('fc');
      const dimples = Array.from({ length: 18 }, (_, i) => {
        const x = 46 + (i % 6) * 22 + (Math.floor(i / 6) % 2) * 10, y = 82 + Math.floor(i / 6) * 14;
        return `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="2.6" fill="#B66C27"/><ellipse cx="${x - 1}" cy="${y - 1}" rx="2" ry="1" fill="#F3D493" opacity=".8"/>`;
      }).join('');
      return `<defs>${crustGrad(g, '#D8994A', '#E3AE5E', '#C98637')}</defs>${shadow(100, 86)}
        <path d="M22 76l26-12h126l-4 16-26 12H18Z" fill="#C88A3F"/>
        <path d="M18 92l26-12h126v32l-26 12H18Z" fill="url(#${g})"/>
        <path d="M144 92l26-12v32l-26 12Z" fill="#B67430"/>
        <path d="M18 92h126v32H18Z" fill="#EFCB86"/>
        <g opacity=".55"><circle cx="40" cy="104" r="2" fill="#FFF7E2"/><circle cx="72" cy="112" r="2.6" fill="#FFF7E2"/><circle cx="104" cy="102" r="1.8" fill="#FFF7E2"/><circle cx="126" cy="114" r="2.4" fill="#FFF7E2"/><circle cx="56" cy="98" r="1.6" fill="#FFF7E2"/></g>
        <g transform="translate(0 -16) skewX(-26) translate(40 0)">${dimples}</g>
        <path class="art__oil" d="M40 70c30-8 60-10 110-6" stroke="#FFF1C2" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/>
        <g fill="#FFFFFF"><rect x="64" y="72" width="3" height="3" rx=".6"/><rect x="110" y="68" width="3" height="3" rx=".6"/><rect x="138" y="76" width="3" height="3" rx=".6"/><rect x="88" y="80" width="3" height="3" rx=".6"/></g>`;
    },
    crostata() {
      const g = id('cs');
      const lattice = [-36, -12, 12, 36].map((o) =>
        `<path d="M${100 + o - 30} 64l60 52" stroke="#D9974A" stroke-width="7" stroke-linecap="round"/><path d="M${100 + o + 30} 64l-60 52" stroke="#CF8A3E" stroke-width="7" stroke-linecap="round"/>`).join('');
      return `<defs>${crustGrad(g, '#E3A954', '#D6913F', '#B9722B')}<clipPath id="${g}c"><ellipse cx="100" cy="90" rx="62" ry="26"/></clipPath></defs>${shadow(100, 78)}
        <path d="M24 92v18c0 16 34 26 76 26s76-10 76-26V92Z" fill="url(#${g})"/>
        <ellipse cx="100" cy="92" rx="76" ry="32" fill="#E6AC5A"/>
        <ellipse cx="100" cy="90" rx="62" ry="26" fill="#E8862A"/>
        <ellipse cx="88" cy="84" rx="26" ry="8" fill="#F7B25A" opacity=".6"/>
        <g clip-path="url(#${g}c)">${lattice}</g>
        <g fill="#C67B33">${Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return `<circle cx="${100 + Math.cos(a) * 70}" cy="${92 + Math.sin(a) * 29}" r="4"/>`; }).join('')}</g>`;
    },
    baci() {
      const one = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
        <path d="M-22 0c0-16 10-24 22-24s22 8 22 24Z" fill="#D9A15B"/>
        <path d="M-22 6c0 14 10 20 22 20s22-6 22-20Z" fill="#CF9450"/>
        <rect x="-22" y="0" width="44" height="7" rx="3" fill="#3A1F14"/>
        <path d="M-12-14c4-4 10-5 14-3" stroke="#F0CB8A" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/></g>`;
      return `${shadow(100, 80)}${one(56, 110, 0.9)}${one(146, 112, 0.9)}${one(100, 98, 1.05)}${one(76, 66, 0.75)}${one(126, 64, 0.75)}`;
    },
    nocciole() {
      const g = id('nc');
      const nuts = Array.from({ length: 9 }, (_, i) => {
        const a = i / 9 * Math.PI * 2;
        const x = 100 + Math.cos(a) * 44, y = 80 + Math.sin(a) * 16;
        return `<g transform="translate(${x} ${y})"><ellipse rx="6" ry="5" fill="#8A4F25"/><ellipse cx="-1.5" cy="-1.6" rx="2.4" ry="1.6" fill="#C38652"/></g>`;
      }).join('');
      return `<defs>${crustGrad(g, '#9C5B2A', '#B87436', '#8F5122')}</defs>${shadow(100, 80)}
        <path d="M28 82v26c0 16 32 24 72 24s72-8 72-24V82Z" fill="url(#${g})"/>
        <ellipse cx="100" cy="82" rx="72" ry="28" fill="#B9773B"/>
        <ellipse cx="100" cy="82" rx="72" ry="28" fill="#000" opacity=".06"/>
        <g fill="#FFFDF6" opacity=".9">${Array.from({ length: 40 }, (_, i) => `<circle cx="${70 + (i * 13) % 62}" cy="${70 + (i * 7) % 24}" r="${0.8 + (i % 3) * 0.4}"/>`).join('')}</g>
        ${nuts}<g transform="translate(100 80)"><ellipse rx="7" ry="6" fill="#8A4F25"/><ellipse cx="-2" cy="-2" rx="2.8" ry="1.8" fill="#C38652"/></g>`;
    },
    bignole() {
      const colors = ['#5A3424', '#F3E6CF', '#B9845A', '#F2D38A', '#5A3424', '#F2D38A', '#B9845A', '#F3E6CF'];
      const pos = [[48, 112], [82, 116], [118, 116], [152, 112], [64, 92], [100, 94], [136, 92], [100, 74]];
      const items = pos.map(([x, y], i) => `<g transform="translate(${x} ${y})">
        <path d="M-17 4c-2-14 6-22 17-22s19 8 17 22c-6 4-28 4-34 0Z" fill="#D49A55"/>
        <path d="M-14-6c2-10 8-13 14-13s12 3 14 13c-6 4-22 4-28 0Z" fill="${colors[i]}"/>
        <ellipse cx="-4" cy="-13" rx="4" ry="1.6" fill="#FFF" opacity=".45"/></g>`).join('');
      return `${shadow(100, 86)}<path d="M14 120l12 14h148l12-14Z" fill="#E9E1D2"/><path d="M14 120h172" stroke="#C9B48E" stroke-width="2"/>
        <path d="M20 124h160" stroke="#C9A64A" stroke-width="1.2" stroke-dasharray="2 3"/>${items}`;
    },
  };

  window.M.art = (key, cls = '') =>
    `<svg class="art ${cls}" viewBox="0 0 200 150" aria-hidden="true" focusable="false">${(ART[key] || ART.pagnotta)()}</svg>`;
})();
