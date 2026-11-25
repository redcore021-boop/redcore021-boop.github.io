// RedCore — category pages (desks.html, pc-desks.html): illustrations, options catalog,
// "from" price and the three ready-made built-in-PC models. Everything is read from desk-config.js.
// waits for the live parts from the server (parts-live.js), then starts
(window.RC_LIVE || Promise.resolve()).then(() => {
  const CFG = window.RC_DESK;
  const P = window.RCDeskPreview;
  const D = window.RCDesk;
  if (!CFG || !P || !D) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const art = (sel, state, opts) => { const el = document.querySelector(`[data-art="${sel}"]`); if (el) el.innerHTML = P.thumb({ arm: 120, ...state }, opts); };

  // Illustrations
  art('hero', { width: 180, depth: 75, height: 'electric', shape: 'corner', arm: 120, material: 'wood', top: 'walnut', legs: 'black', extras: ['rgb', 'shelf', 'mat', 'charger', 'cables'] });
  const g = CFG.pcDesk.models[1];
  art('pc', g.desk, { pc: true, lighting: g.lighting });
  art('pc-hero', g.desk, { pc: true, lighting: g.lighting });

  // "From" price: smallest straight MDF desk with fixed height
  const from = document.querySelector('[data-from-price]');
  if (from) {
    const min = D.price({ ...D.defaultState('desk'), width: CFG.dims.width.min, depth: CFG.dims.depth.min }, 'desk').total;
    from.textContent = `החל מ־${D.shekel(min)} (מחיר משוער כולל מע״מ, לשולחן ${CFG.dims.width.min} על ${CFG.dims.depth.min} ס״מ)`;
  }

  // Options catalog (desks.html)
  const cat = document.querySelector('[data-desk-catalog]');
  if (cat) {
    const plus = (n) => (n ? `+${D.shekel(n)}` : 'כלול');
    cat.innerHTML = `
      <article class="card p-6">
        <h3 class="text-lg font-bold">מידות וצורה</h3>
        <p class="text-sm text-muted mt-1">רוחב ${CFG.dims.width.min} עד ${CFG.dims.width.max} ס״מ · עומק ${CFG.dims.depth.min} עד ${CFG.dims.depth.max} ס״מ, בכל מספר שלם.</p>
        <ul class="spec-list mt-4">${CFG.shapes.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${plus(s.price)}${s.hasArm ? ' + זרוע' : ''}</dd></div>`).join('')}
          ${CFG.height.map((h) => `<div><dt>${esc(h.label)}</dt><dd>${plus(h.price)}</dd></div>`).join('')}</ul>
      </article>
      <article class="card p-6">
        <h3 class="text-lg font-bold">חומרים וצבעים</h3>
        <ul class="mt-3 space-y-4">${CFG.materials.map((m) => `<li>
          <div class="flex justify-between gap-3"><span class="font-semibold">${esc(m.label)}</span><span class="text-sm font-bold text-brand-dark">${plus(m.price)}</span></div>
          <p class="text-xs text-muted">${esc(m.note)}</p>
          <div class="flex gap-1.5 mt-2" aria-label="צבעים זמינים: ${esc(m.colors.map((c) => c[1]).join(', '))}">${m.colors.map(([, l, hex]) => `<span title="${esc(l)}" class="w-6 h-6 rounded-full border border-line" data-style="background:${hex}"></span>`).join('')}</div>
        </li>`).join('')}</ul>
      </article>
      <article class="card p-6">
        <h3 class="text-lg font-bold">תוספות</h3>
        <ul class="spec-list mt-4">${CFG.extras.map((e) => `<div><dt>${esc(e.label)}</dt><dd>+${D.shekel(e.price)}${e.perCmWidth ? ' + לפי רוחב' : ''}</dd></div>`).join('')}</ul>
        <a href="desk-builder.html" class="btn btn-primary w-full mt-6">בנה את השולחן שלך</a>
      </article>`;
    cat.querySelectorAll('[data-style]').forEach((e) => { e.style.cssText = e.dataset.style; }); // data-style: inline style attributes are blocked by the CSP
  }

  // Ready-made models (pc-desks.html)
  const models = document.querySelector('[data-pc-models]');
  if (models && window.RCPcDesk && window.RC_PARTS) {
    const PC = window.RCPcDesk;
    models.innerHTML = CFG.pcDesk.models.map((m, i) => {
      const desk = { ...D.defaultState('pc'), ...m.desk };
      const sel = Object.fromEntries(Object.entries(m.parts).map(([k, id]) => [k, (window.RC_PARTS[k] || []).find((p) => p.id === id)]).filter(([, p]) => p));
      const t = PC.total(desk, sel, m.lighting);
      const lines = PC.specLines(desk, sel, m.lighting);
      return `<article class="card card-hover p-4 flex flex-col">
        <div class="model-art is-dark" data-model-art="${m.id}" aria-hidden="true"></div>
        <div class="px-2 pt-4 flex flex-col flex-1">
          <div class="flex items-center gap-2"><h3 class="text-xl font-bold">${esc(m.label)}</h3>${i === 1 ? '<span class="badge badge-hot !static">מומלץ</span>' : ''}</div>
          <p class="text-sm text-muted">${esc(m.tagline)}</p>
          <dl class="spec-list mt-3 mb-4">${lines.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(k === 'שלדה' ? `${desk.width} על ${desk.depth} ס״מ, ${(CFG.materials.find((x) => x.id === desk.material) || {}).label}` : v)}</dd></div>`).join('')}</dl>
          <p class="price tabular mt-auto">${D.shekel(t.total)}</p>
          <p class="text-xs text-muted">מחיר משוער כולל שולחן, רכיבים, תאורה, הרכבה ומע״מ</p>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button type="button" class="btn btn-primary btn-sm" data-model-order="${m.id}">שלח הזמנה</button>
            <a class="btn btn-ghost btn-sm" href="pc-desk-builder.html?model=${m.id}">התאמה אישית</a>
          </div>
        </div>
      </article>`;
    }).join('');
    CFG.pcDesk.models.forEach((m) => { const el = models.querySelector(`[data-model-art="${m.id}"]`); if (el) el.innerHTML = P.thumb({ arm: 120, ...m.desk }, { pc: true, lighting: m.lighting }); });
    models.addEventListener('click', (e) => {
      const b = e.target.closest('[data-model-order]');
      if (!b || !window.RCOrder) return;
      const m = CFG.pcDesk.models.find((x) => x.id === b.dataset.modelOrder);
      const desk = { ...D.defaultState('pc'), ...m.desk };
      const sel = Object.fromEntries(Object.entries(m.parts).map(([k, id]) => [k, (window.RC_PARTS[k] || []).find((p) => p.id === id)]).filter(([, p]) => p));
      window.RCOrder.open({
        title: `שולחן עם מחשב מובנה – דגם ${m.label}`,
        lines: PC.specLines(desk, sel, m.lighting),
        total: D.shekel(PC.total(desk, sel, m.lighting).total),
        production: CFG.productionDays.pcDesk ? `זמן ייצור משוער: ${CFG.productionDays.pcDesk} ימי עבודה` : 'זמן הייצור יימסר בהצעת המחיר',
        custom: true,
      });
    });
  }
});
