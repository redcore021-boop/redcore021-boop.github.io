// RedCore — desk configurator (shared by desk-builder.html and step 1 of pc-desk-builder.html).
// RCDesk.mount(container, { mode: 'desk' | 'pc', initial, onChange }) renders the options UI.
// RCDesk.price(state, mode) / RCDesk.describe(state, mode) are used by summaries and the order form.
(() => {
  const CFG = window.RC_DESK;
  const shekel = (n) => `₪${Math.round(n).toLocaleString('he-IL')}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const find = (list, id) => list.find((x) => x.id === id) || list[0];
  const colorName = (list, id) => (list.find((c) => c[0] === id) || list[0])[1];

  const limits = (mode) => ({
    width: { ...CFG.dims.width, min: mode === 'pc' ? Math.max(CFG.dims.width.min, CFG.pcDesk.minWidth) : CFG.dims.width.min },
    depth: { ...CFG.dims.depth, min: mode === 'pc' ? Math.max(CFG.dims.depth.min, CFG.pcDesk.minDepth) : CFG.dims.depth.min },
    arm: CFG.dims.arm,
  });

  const defaultState = (mode) => {
    const L = limits(mode);
    const mat = CFG.materials[0];
    return {
      width: Math.max(L.width.default, L.width.min), depth: Math.max(L.depth.default, L.depth.min), arm: L.arm.default,
      height: CFG.height[0].id, shape: CFG.shapes[0].id, material: mat.id, top: mat.colors[0][0], legs: CFG.legColors[0][0], extras: [],
    };
  };

  const price = (st, mode) => {
    const P = CFG.pricing;
    const lines = [];
    lines.push([`בסיס ומידות (${st.width} על ${st.depth} ס״מ)`, P.base + st.width * P.perCmWidth + st.depth * P.perCmDepth]);
    const shape = find(CFG.shapes, st.shape);
    if (shape.price || shape.hasArm) lines.push([shape.hasArm ? `צורה: ${shape.label}, זרוע ${st.arm} ס״מ` : `צורה: ${shape.label}`, shape.price + (shape.hasArm ? st.arm * P.perCmArm : 0)]);
    const mat = find(CFG.materials, st.material);
    if (mat.price) lines.push([`משטח: ${mat.label}`, mat.price]);
    const h = find(CFG.height, st.height);
    if (h.price) lines.push([`גובה: ${h.label}`, h.price]);
    st.extras.forEach((id) => { const e = CFG.extras.find((x) => x.id === id); if (e) lines.push([e.label, e.price + (e.perCmWidth ? e.perCmWidth * st.width : 0)]); });
    if (mode === 'pc') lines.push([CFG.pcDesk.chassis.label, CFG.pcDesk.chassis.price]);
    return { lines, total: lines.reduce((s, [, v]) => s + v, 0) };
  };

  const describe = (st, mode) => {
    const mat = find(CFG.materials, st.material);
    const shape = find(CFG.shapes, st.shape);
    const out = [
      ['מידות', `רוחב ${st.width} ס״מ · עומק ${st.depth} ס״מ${shape.hasArm ? ` · זרוע ${st.arm} ס״מ` : ''}`],
      ['צורה', shape.label],
      ['גובה', find(CFG.height, st.height).label],
      ['משטח', `${mat.label}, ${colorName(mat.colors, st.top)}`],
      ['רגליים', colorName(CFG.legColors, st.legs)],
    ];
    if (mode === 'pc') out.unshift(['שלדה', CFG.pcDesk.chassis.label]);
    out.push(['תוספות', st.extras.length ? st.extras.map((id) => (CFG.extras.find((e) => e.id === id) || {}).label).join(', ') : 'ללא']);
    return out;
  };

  // ---------- UI ----------
  const dimField = (key, label, L, val) => `
    <div class="desk-dim" data-dim="${key}">
      <div class="flex items-baseline justify-between gap-3">
        <label for="dim-${key}" class="font-semibold">${label}</label>
        <span class="text-xs text-muted">${L.min} עד ${L.max} ס״מ</span>
      </div>
      <div class="desk-dim-row">
        <div class="desk-num">
          <input id="dim-${key}" type="number" inputmode="numeric" min="${L.min}" max="${L.max}" step="1" value="${val}" aria-describedby="dim-${key}-err dim-${key}-help" data-num="${key}">
          <span>ס״מ</span>
        </div>
        <input type="range" min="${L.min}" max="${L.max}" step="1" value="${val}" data-range="${key}" aria-label="${label} בס״מ">
      </div>
      ${L.presets ? `<div class="desk-presets" role="group" aria-label="מידות פופולריות">${L.presets.filter((p) => p >= L.min && p <= L.max).map((p) => `<button type="button" class="facet-chip" data-preset-dim="${key}" data-val="${p}" aria-pressed="${p === val}">${p}</button>`).join('')}</div>` : ''}
      <p class="field-error" id="dim-${key}-err" role="alert"></p>
      <p class="sr-only" id="dim-${key}-help">הקלידו מספר שלם בין ${L.min} ל-${L.max}</p>
    </div>`;

  const optCards = (name, list, cur, extraNote) => `<div class="desk-opts" role="radiogroup">${list.map((o) => `
      <label class="desk-opt"><input type="radio" name="${name}" value="${o.id}" ${o.id === cur ? 'checked' : ''}>
        <span><strong>${esc(o.label)}</strong>${o.note ? `<small>${esc(o.note)}</small>` : ''}<em>${o.price ? `+${shekel(o.price)}${o.hasArm && extraNote ? ' + זרוע' : ''}` : 'כלול'}</em></span>
      </label>`).join('')}</div>`;

  const swatches = (name, list, cur) => `<div class="desk-swatches" role="radiogroup">${list.map(([id, label, hex]) => `
      <label class="desk-swatch" title="${esc(label)}"><input type="radio" name="${name}" value="${id}" ${id === cur ? 'checked' : ''}>
        <span data-style="--sw:${hex}" aria-hidden="true"></span><small>${esc(label)}</small></label>`).join('')}</div>`;

  const mount = (root, { mode = 'desk', initial, onChange } = {}) => {
    const L = limits(mode);
    const st = { ...defaultState(mode), ...(initial || {}) };
    st.extras = [...(st.extras || [])];
    const invalid = new Set();

    const render = () => {
      const mat = find(CFG.materials, st.material);
      if (!mat.colors.some((c) => c[0] === st.top)) st.top = mat.colors[0][0];
      root.innerHTML = `
        <section class="desk-sec" aria-labelledby="sec-dims">
          <h2 id="sec-dims" class="desk-sec-title"><span>1</span>מידות</h2>
          <div class="grid sm:grid-cols-2 gap-5">
            ${dimField('width', 'רוחב', L.width, st.width)}
            ${dimField('depth', 'עומק', L.depth, st.depth)}
          </div>
          ${mode === 'pc' ? `<p class="helper mt-3">בשולחן עם מחשב מובנה המידות המינימליות הן ${L.width.min} על ${L.depth.min} ס״מ, כדי שתא החומרה ייכנס.</p>` : ''}
          <h3 class="desk-sub">צורה</h3>
          ${optCards('shape', CFG.shapes, st.shape, true)}
          <div class="mt-4 ${find(CFG.shapes, st.shape).hasArm ? '' : 'hidden'}" data-arm-wrap>${dimField('arm', 'אורך הזרוע (פינה)', L.arm, st.arm)}</div>
          <h3 class="desk-sub">גובה</h3>
          ${optCards('height', CFG.height, st.height)}
        </section>

        <section class="desk-sec" aria-labelledby="sec-mat">
          <h2 id="sec-mat" class="desk-sec-title"><span>2</span>חומר וצבע</h2>
          ${optCards('material', CFG.materials, st.material)}
          <h3 class="desk-sub">צבע המשטח</h3>
          ${swatches('top', mat.colors, st.top)}
          <h3 class="desk-sub">צבע הרגליים</h3>
          ${swatches('legs', CFG.legColors, st.legs)}
        </section>

        <section class="desk-sec" aria-labelledby="sec-extras">
          <h2 id="sec-extras" class="desk-sec-title"><span>3</span>תוספות</h2>
          <div class="desk-opts">${CFG.extras.map((e) => `
            <label class="desk-opt is-check"><input type="checkbox" name="extras" value="${e.id}" ${st.extras.includes(e.id) ? 'checked' : ''}>
              <span><strong>${esc(e.label)}</strong><small>${esc(e.note)}</small><em>+${shekel(e.price + (e.perCmWidth ? e.perCmWidth * st.width : 0))}${e.perCmWidth ? ' (לפי הרוחב)' : ''}</em></span>
            </label>`).join('')}</div>
        </section>`;
      root.querySelectorAll('[data-style]').forEach((e) => { e.style.cssText = e.dataset.style; }); // data-style: inline style attributes are blocked by the CSP
    };

    const emit = () => onChange && onChange({ ...st, extras: [...st.extras] }, invalid.size === 0);

    const setError = (key, msg) => {
      const wrap = root.querySelector(`[data-dim="${key}"]`);
      const input = wrap.querySelector('[data-num]');
      wrap.querySelector('.field-error').textContent = msg || '';
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) invalid.add(key); else invalid.delete(key);
    };

    const commitDim = (key, raw, { fromSlider = false } = {}) => {
      const lim = L[key];
      const label = { width: 'רוחב', depth: 'עומק', arm: 'אורך הזרוע' }[key];
      const v = Number(raw);
      const wrap = root.querySelector(`[data-dim="${key}"]`);
      if (raw === '' || !Number.isFinite(v)) { setError(key, `הזינו ${label} במספרים`); emit(); return; }
      if (!Number.isInteger(v)) { setError(key, `${label} חייב להיות מספר שלם (בלי נקודה עשרונית)`); emit(); return; }
      if (v < lim.min || v > lim.max) { setError(key, `${label} חייב להיות בין ${lim.min} ל-${lim.max} ס״מ. הזנתם ${v} ס״מ.`); emit(); return; }
      setError(key, '');
      st[key] = v;
      if (fromSlider) wrap.querySelector('[data-num]').value = v; else wrap.querySelector('[data-range]').value = v;
      wrap.querySelectorAll('[data-preset-dim]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.val === v)));
      if (key === 'width') root.querySelectorAll('input[name="extras"]').forEach((cb) => {
        const e = CFG.extras.find((x) => x.id === cb.value);
        if (e.perCmWidth) cb.closest('label').querySelector('em').textContent = `+${shekel(e.price + e.perCmWidth * v)} (לפי הרוחב)`;
      });
      emit();
    };

    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.num) commitDim(t.dataset.num, t.value.trim());
      else if (t.dataset.range) commitDim(t.dataset.range, t.value, { fromSlider: true });
    });
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'shape') { st.shape = t.value; root.querySelector('[data-arm-wrap]').classList.toggle('hidden', !find(CFG.shapes, st.shape).hasArm); emit(); }
      else if (t.name === 'height') { st.height = t.value; emit(); }
      else if (t.name === 'material') { st.material = t.value; render(); root.querySelector(`input[name="material"][value="${st.material}"]`).focus(); emit(); }
      else if (t.name === 'top') { st.top = t.value; emit(); }
      else if (t.name === 'legs') { st.legs = t.value; emit(); }
      else if (t.name === 'extras') { st.extras = [...root.querySelectorAll('input[name="extras"]:checked')].map((c) => c.value); emit(); }
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-preset-dim]');
      if (!b) return;
      const key = b.dataset.presetDim;
      root.querySelector(`#dim-${key}`).value = b.dataset.val;
      commitDim(key, b.dataset.val);
    });

    render();
    emit();
    return {
      get state() { return { ...st, extras: [...st.extras] }; },
      get valid() { return invalid.size === 0; },
      set(next) { Object.assign(st, next); st.extras = [...(next.extras || st.extras)]; invalid.clear(); render(); emit(); },
    };
  };

  window.RCDesk = { mount, price, describe, defaultState, limits, shekel };

  // ---------- Page: desk-builder.html ----------
  const page = document.getElementById('deskBuilder');
  if (!page) return;
  const optionsEl = page.querySelector('[data-desk-options]');
  const topEl = page.querySelectorAll('[data-preview-top]');
  const frontEl = page.querySelectorAll('[data-preview-front]');
  const summaries = page.querySelectorAll('[data-desk-summary]');
  const barTotal = document.getElementById('deskBarTotal');
  let current = null; let ok = true;

  const production = () => (CFG.productionDays.desk ? `זמן ייצור משוער: ${CFG.productionDays.desk} ימי עבודה` : 'זמן הייצור יימסר בהצעת המחיר');

  const renderSummary = () => {
    const p = price(current, 'desk');
    const html = `
      <h2 class="text-lg font-bold" tabindex="-1" data-sum-title>סיכום השולחן</h2>
      <ul class="cfg-sum-list">${describe(current, 'desk').map(([k, v]) => `<li><span class="text-muted">${k}</span><span class="cfg-sum-val">${esc(v)}</span></li>`).join('')}</ul>
      <details class="desk-breakdown"><summary>פירוט המחיר</summary><ul>${p.lines.map(([k, v]) => `<li><span>${esc(k)}</span><span class="tabular">${shekel(v)}</span></li>`).join('')}</ul></details>
      <div class="cfg-total"><span>מחיר משוער <span class="vat-note">כולל מע״מ</span></span><strong class="tabular">${ok ? shekel(p.total) : '—'}</strong></div>
      ${ok ? '' : '<p class="field-error mb-3">יש מידה לא תקינה. תקנו אותה כדי לראות מחיר.</p>'}
      <button type="button" class="btn btn-primary w-full" data-order ${ok ? '' : 'disabled'}>שלח הזמנה</button>
      <button type="button" class="btn btn-ghost w-full mt-2" data-wa ${ok ? '' : 'disabled'}><svg class="w-5 h-5 text-[#25D366]" aria-hidden="true"><use href="#i-whatsapp"/></svg>שלח בוואטסאפ</button>
      <ul class="cfg-trust"><li><svg class="w-4 h-4" aria-hidden="true"><use href="#i-clock"/></svg>${production()}</li><li><svg class="w-4 h-4" aria-hidden="true"><use href="#i-shield"/></svg>ייצור בהתאמה אישית לפי המידות שבחרתם</li></ul>
      <p class="text-xs text-muted mt-3">המחיר משוער. מחיר סופי יימסר אחרי אישור המידות והחומרים.</p>`;
    summaries.forEach((s) => { s.innerHTML = html; });
    if (barTotal) barTotal.textContent = ok ? shekel(p.total) : '—';
  };

  const order = () => ({
    title: 'שולחן מחשב בהתאמה אישית',
    lines: describe(current, 'desk'),
    total: shekel(price(current, 'desk').total),
    production: production(),
    custom: true,
  });

  page.addEventListener('click', (e) => {
    if (e.target.closest('[data-order]')) window.RCOrder.open(order());
    if (e.target.closest('[data-wa]')) window.RCOrder.whatsapp(order());
    const go = e.target.closest('[data-go-summary]');
    if (go) { e.preventDefault(); const s = [...summaries].find((x) => x.offsetParent); s?.scrollIntoView({ block: 'start' }); s?.querySelector('[data-sum-title]')?.focus({ preventScroll: true }); }
  });

  mount(optionsEl, {
    mode: 'desk',
    onChange: (state, valid) => {
      current = state; ok = valid;
      topEl.forEach((t, i) => window.RCDeskPreview.render(t, frontEl[i], state, { pc: false }));
      window.RCDeskCurrent = state; // for the 3D preview (desk-3d-boot.js)
      document.dispatchEvent(new CustomEvent('rc:desk', { detail: state }));
      renderSummary();
    },
  });
})();
