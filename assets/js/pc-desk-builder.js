// RedCore — desk with a built-in PC.
// Step 1: the desk (RCDesk, mode 'pc'). Step 2: PC parts from components.js, checked against each other
// and against the desk's hardware compartment limits (desk-config.js → pcDesk.limits).
// Spec order is fixed: chassis, CPU, GPU, motherboard, RAM, storage, PSU, cooling, lighting.
// waits for the live parts from the server (parts-live.js), then starts
(window.RC_LIVE || Promise.resolve()).then(() => {
  const CFG = window.RC_DESK;
  const PC = CFG.pcDesk;
  const PARTS = window.RC_PARTS;
  const { shekel } = window.RCDesk;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (cat, id) => (PARTS[cat] || []).find((p) => p.id === id);

  const STEPS = [
    { key: 'cpu', label: 'מעבד', icon: 'i-cpu' },
    { key: 'gpu', label: 'כרטיס מסך', icon: 'i-gpu' },
    { key: 'board', label: 'לוח אם', icon: 'i-board' },
    { key: 'ram', label: 'זיכרון', icon: 'i-ram' },
    { key: 'storage', label: 'אחסון', icon: 'i-drive' },
    { key: 'psu', label: 'ספק כוח', icon: 'i-zap' },
    { key: 'cooler', label: 'קירור', icon: 'i-fan' },
  ];
  const order = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

  // ---------- Compatibility ----------
  const ceil50 = (n) => Math.ceil(n / 50) * 50;
  const requiredPsu = (s) => (!s.cpu && !s.gpu ? 0 : Math.max(s.gpu?.minPsu || 0, ceil50((s.cpu?.power || 0) + (s.gpu?.power || 0) + 100)));
  const check = (cat, part, sel) => {
    const o = { ...sel, [cat]: part };
    const { cpu, board, ram, gpu, psu, cooler } = o;
    const L = PC.limits;
    if (gpu && gpu.length > L.gpuMax) return `כ-${gpu.length}mm, ותא החומרה בשולחן מקבל עד ${L.gpuMax}mm`;
    if (board && !L.forms.includes(board.form)) return `לוח ${board.form} לא נכנס לתא החומרה`;
    if (cpu && board && cpu.socket !== board.socket) return `שקע ${board.socket}, והמעבד שבחרתם דורש ${cpu.socket}`;
    if (board && ram && board.memory !== ram.type) return `${ram.type}, ולוח האם תומך רק ב-${board.memory}`;
    if (!board && cpu && ram && !cpu.memory.includes(ram.type)) return `${ram.type}, והמעבד תומך רק ב-${cpu.memory.join('/')}`;
    if (psu) { const need = requiredPsu(o); if (need && psu.watts < need) return `נדרש לפחות ${need}W למעבד ולכרטיס המסך שבחרתם`; }
    if (cooler) {
      if (cpu && !cooler.sockets.includes(cpu.socket)) return `לא תומך בשקע ${cpu.socket}`;
      if (cpu && cooler.rating < cpu.power) return `חלש מדי למעבד שבחרתם (${cpu.power}W)`;
      if (cooler.type === 'air' && cooler.height > L.coolerMax) return `גובה ${cooler.height}mm, ומתחת לזכוכית יש מקום לעד ${L.coolerMax}mm`;
      if (cooler.type === 'aio' && !L.radiators.includes(cooler.radiator)) return `רדיאטור ${cooler.radiator}mm לא נכנס לתא החומרה`;
    }
    return null;
  };
  const upstream = (cat, sel) => Object.fromEntries(Object.entries(sel).filter(([k]) => order[k] < order[cat]));
  const fits = (cat, p, sel) => !check(cat, p, upstream(cat, sel));

  // ---------- Pricing / spec ----------
  const total = (desk, sel, lighting) => {
    const d = window.RCDesk.price(desk, 'pc').total;
    const parts = STEPS.reduce((s, { key }) => s + (sel[key]?.price || 0), 0);
    const light = (PC.lighting.find((l) => l.id === lighting) || PC.lighting[0]).price;
    const done = STEPS.filter(({ key }) => sel[key]).length;
    return { desk: d, parts, light, fee: done ? PC.assemblyFee : 0, total: d + parts + light + (done ? PC.assemblyFee : 0) };
  };
  const chassisText = (desk) => {
    const L = Object.fromEntries(window.RCDesk.describe(desk, 'pc'));
    return `${L['מידות']} · ${L['צורה']} · ${L['משטח']} · גובה ${L['גובה']} · רגליים ${L['רגליים']}${L['תוספות'] !== 'ללא' ? ` · תוספות: ${L['תוספות']}` : ''}`;
  };
  const specLines = (desk, sel, lighting) => [
    ['שלדה', `${PC.chassis.label}: ${chassisText(desk)}`],
    ...STEPS.map(({ key, label }) => [label, sel[key] ? sel[key].name : 'לא נבחר']),
    ['תאורה', (PC.lighting.find((l) => l.id === lighting) || PC.lighting[0]).label],
  ];

  window.RCPcDesk = { STEPS, check, fits, total, specLines, requiredPsu, chassisText };

  // ---------- Page ----------
  const page = document.getElementById('pcDeskBuilder');
  if (!page) return;
  const icon = (id, cls = 'w-5 h-5') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const rowsEl = page.querySelector('[data-pc-rows]');
  const summaries = page.querySelectorAll('[data-pc-summary]');
  const noticeEl = page.querySelector('[data-pc-notice]');
  const barTotal = document.getElementById('pcBarTotal');
  const tops = page.querySelectorAll('[data-preview-top]');
  const fronts = page.querySelectorAll('[data-preview-front]');

  const sel = {};
  let desk = null; let deskOk = true; let lighting = PC.lighting[1].id;
  const production = () => (CFG.productionDays.pcDesk ? `זמן ייצור משוער: ${CFG.productionDays.pcDesk} ימי עבודה` : 'זמן הייצור יימסר בהצעת המחיר');

  const prune = () => {
    const removed = [];
    STEPS.forEach(({ key, label }) => { if (sel[key] && check(key, sel[key], upstream(key, sel))) { removed.push(`${label}: ${sel[key].name}`); delete sel[key]; } });
    return removed;
  };
  const notify = (msg, tone = 'warn') => {
    noticeEl.innerHTML = msg ? `${icon('i-alert', 'w-5 h-5 shrink-0')}<span>${msg}</span>` : '';
    noticeEl.hidden = !msg;
    noticeEl.dataset.tone = tone;
  };

  const preview = () => tops.forEach((t, i) => window.RCDeskPreview.render(t, fronts[i], desk, { pc: true, lighting }));

  const renderRows = () => {
    const rows = [
      `<li class="cfg-row is-done"><div class="cfg-row-cat"><span class="cfg-row-ico">${icon('i-case', 'w-6 h-6')}</span><span class="font-bold">שלדה</span></div><span class="cfg-row-thumb is-empty" aria-hidden="true"></span>
        <div class="cfg-row-prod"><span class="cfg-row-name">${esc(PC.chassis.label)}</span><span class="cfg-row-note">${esc(desk ? `${desk.width} על ${desk.depth} ס״מ · לפי הבחירה בשלב 1` : '')}</span></div>
        <div class="cfg-row-price tabular">${desk ? shekel(window.RCDesk.price(desk, 'pc').total) : ''}</div>
        <div class="cfg-row-act"><a href="#step-desk" class="btn btn-ghost btn-sm">עריכת השולחן</a></div></li>`,
      ...STEPS.map(({ key, label, icon: ic }) => {
        const p = sel[key];
        return `<li class="cfg-row ${p ? 'is-done' : ''}">
          <div class="cfg-row-cat"><span class="cfg-row-ico">${icon(ic, 'w-6 h-6')}</span><span class="font-bold">${label}</span></div>
          <span class="cfg-row-thumb is-empty" aria-hidden="true"></span>
          <div class="cfg-row-prod">${p ? `<span class="cfg-row-name">${esc(p.name)}</span><span class="cfg-row-note">${esc(p.note)}</span>` : '<span class="cfg-row-empty">לא נבחר</span>'}</div>
          <div class="cfg-row-price tabular">${p ? shekel(p.price) : ''}</div>
          <div class="cfg-row-act">${p
            ? `<button type="button" class="btn btn-ghost btn-sm" data-pick="${key}" aria-label="החלפת ${label}">החלפה</button><button type="button" class="cfg-row-del" data-remove="${key}" aria-label="הסרת ${label}">${icon('i-trash', 'w-4 h-4')}</button>`
            : `<button type="button" class="btn btn-dark btn-sm" data-pick="${key}" aria-label="בחירת ${label}">${icon('i-plus', 'w-4 h-4')}בחירה</button>`}</div>
        </li>`;
      }),
      `<li class="cfg-row is-done"><div class="cfg-row-cat"><span class="cfg-row-ico">${icon('i-zap', 'w-6 h-6')}</span><span class="font-bold">תאורה</span></div><span class="cfg-row-thumb is-empty" aria-hidden="true"></span>
        <div class="cfg-row-prod"><label class="sr-only" for="pcLighting">תאורה בתא החומרה</label>
          <select id="pcLighting" class="input !min-h-[42px]">${PC.lighting.map((l) => `<option value="${l.id}" ${l.id === lighting ? 'selected' : ''}>${esc(l.label)}${l.price ? ` (+${shekel(l.price)})` : ''}</option>`).join('')}</select></div>
        <div class="cfg-row-price tabular">${shekel((PC.lighting.find((l) => l.id === lighting) || PC.lighting[0]).price)}</div><div class="cfg-row-act"></div></li>`,
    ];
    rowsEl.innerHTML = rows.join('');
  };

  const renderSummary = () => {
    const t = total(desk, sel, lighting);
    const done = STEPS.filter(({ key }) => sel[key]).length;
    const complete = done === STEPS.length && deskOk;
    const need = requiredPsu(sel);
    const html = `
      <h2 class="text-lg font-bold" tabindex="-1" data-sum-title>סיכום המפרט</h2>
      <div class="cfg-progress" role="progressbar" aria-label="רכיבים שנבחרו" aria-valuemin="0" aria-valuemax="${STEPS.length}" aria-valuenow="${done}"><span data-style="width:${(done / STEPS.length) * 100}%"></span></div>
      <p class="text-xs text-muted mt-1.5">${done} מתוך ${STEPS.length} רכיבי מחשב</p>
      <ul class="cfg-sum-list">${specLines(desk, sel, lighting).map(([k, v]) => `<li><span class="text-muted">${k}</span><span class="cfg-sum-val">${esc(v)}</span></li>`).join('')}</ul>
      <div class="cfg-sum-stats"><div><span class="text-muted text-sm">ספק כוח נדרש</span><strong class="tabular">${need ? `${need}W` : '—'}</strong></div><div><span class="text-muted text-sm">תאימות</span>${done ? `<strong class="text-[color:var(--success)] flex items-center gap-1">${icon('i-check', 'w-4 h-4')}הכול תואם</strong>` : '<strong>—</strong>'}</div></div>
      <details class="desk-breakdown"><summary>פירוט המחיר</summary><ul>
        <li><span>שולחן ושלדה</span><span class="tabular">${shekel(t.desk)}</span></li><li><span>רכיבי מחשב</span><span class="tabular">${shekel(t.parts)}</span></li>
        <li><span>תאורה</span><span class="tabular">${shekel(t.light)}</span></li>${t.fee ? `<li><span>הרכבה ובדיקות</span><span class="tabular">${shekel(t.fee)}</span></li>` : ''}</ul></details>
      <div class="cfg-total"><span>מחיר משוער <span class="vat-note">כולל מע״מ</span></span><strong class="tabular">${deskOk ? shekel(t.total) : '—'}</strong></div>
      ${deskOk ? '' : '<p class="field-error mb-3">יש מידה לא תקינה בשלב 1. תקנו אותה כדי להמשיך.</p>'}
      <button type="button" class="btn btn-primary w-full" data-order ${complete ? '' : 'disabled aria-describedby="pcHelp"'}>שלח הזמנה</button>
      <button type="button" class="btn btn-ghost w-full mt-2" data-wa ${complete ? '' : 'disabled aria-describedby="pcHelp"'}>${icon('i-whatsapp', 'w-5 h-5 text-[#25D366]')}שלח בוואטסאפ</button>
      <p id="pcHelp" class="text-xs text-muted text-center mt-2">${complete ? 'נחזור אליכם עם אישור ומחיר סופי.' : `נשארו ${STEPS.length - done} רכיבים לבחירה`}</p>
      <ul class="cfg-trust"><li>${icon('i-clock', 'w-4 h-4')}${production()}</li><li>${icon('i-activity', 'w-4 h-4')}כולל הרכבה ובדיקות עומס</li></ul>`;
    // data-style instead of style="": inline style attributes are blocked by the CSP
    // The summary renders twice (sidebar + mobile); suffix the help id so aria-describedby stays unique
    summaries.forEach((s, i) => { s.innerHTML = i ? html.replaceAll('pcHelp', `pcHelp${i}`) : html; s.querySelectorAll('[data-style]').forEach((e) => { e.style.cssText = e.dataset.style; }); });
    if (barTotal) barTotal.textContent = deskOk ? shekel(t.total) : '—';
  };

  const render = () => { renderRows(); renderSummary(); };

  // ---------- Picker ----------
  const dlg = document.getElementById('pcPicker');
  const pList = dlg.querySelector('[data-picker-list]');
  const pNote = dlg.querySelector('[data-picker-note]');
  let pickKey = null;
  const openPicker = (key) => {
    pickKey = key;
    const step = STEPS.find((s) => s.key === key);
    dlg.querySelector('#pcPickerTitle').textContent = `בחירת ${step.label}`;
    const compatible = PARTS[key].filter((p) => fits(key, p, sel)).sort((a, b) => a.price - b.price);
    const hidden = PARTS[key].length - compatible.length;
    dlg.querySelector('[data-picker-meta]').textContent = `${compatible.length} אפשרויות שמתאימות`;
    pNote.hidden = !hidden;
    pNote.innerHTML = hidden ? `${icon('i-check', 'w-4 h-4')}<span>מוצגים רק רכיבים שמתאימים לרכיבים שבחרתם ולתא החומרה בשולחן (${hidden} הוסתרו).</span>` : '';
    pList.innerHTML = compatible.map((p) => `<li><button type="button" class="cfg-opt" data-id="${p.id}" aria-pressed="${sel[key]?.id === p.id}">
        <span class="cfg-opt-main"><span class="cfg-opt-name">${esc(p.name)}</span><span class="cfg-opt-note">${esc(p.note)}</span></span>
        <span class="cfg-opt-price tabular">${shekel(p.price)}</span><span class="cfg-check" aria-hidden="true">${icon('i-check', 'w-4 h-4')}</span></button></li>`).join('');
    dlg.showModal();
    (pList.querySelector('[aria-pressed="true"]') || pList.querySelector('button'))?.focus();
  };
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => page.querySelector(`[data-pick="${pickKey}"]`)?.focus());
  pList.addEventListener('click', (e) => {
    const b = e.target.closest('.cfg-opt');
    if (!b) return;
    sel[pickKey] = byId(pickKey, b.dataset.id);
    const removed = prune();
    notify(removed.length ? `שימו לב: הסרנו רכיבים שכבר לא מתאימים לבחירה החדשה: ${removed.map(esc).join(' · ')}. בחרו אותם מחדש.` : '');
    render();
    dlg.close();
  });

  page.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { openPicker(pick.dataset.pick); return; }
    const rm = e.target.closest('[data-remove]');
    if (rm) { delete sel[rm.dataset.remove]; notify(''); render(); page.querySelector(`[data-pick="${rm.dataset.remove}"]`)?.focus(); return; }
    const o = () => ({ title: 'שולחן מחשב עם מחשב מובנה', lines: specLines(desk, sel, lighting), total: shekel(total(desk, sel, lighting).total), production: production(), custom: true });
    if (e.target.closest('[data-order]')) window.RCOrder.open(o());
    if (e.target.closest('[data-wa]')) window.RCOrder.whatsapp(o());
    const go = e.target.closest('[data-go-summary]');
    if (go) { e.preventDefault(); const s = [...summaries].find((x) => x.offsetParent); s?.scrollIntoView({ block: 'start' }); s?.querySelector('[data-sum-title]')?.focus({ preventScroll: true }); }
  });
  page.addEventListener('change', (e) => {
    if (e.target.id === 'pcLighting') { lighting = e.target.value; preview(); render(); }
  });

  // Start from a ready model (?model=gaming) or the defaults
  const model = PC.models.find((m) => m.id === new URLSearchParams(location.search).get('model'));
  if (model) {
    Object.entries(model.parts).forEach(([k, id]) => { const p = byId(k, id); if (p) sel[k] = p; });
    lighting = model.lighting;
    const removed = prune();
    if (removed.length) notify(`חלק מרכיבי הדגם לא תואמים ולכן הוסרו: ${removed.join(' · ')}`);
  }
  window.RCDesk.mount(page.querySelector('[data-desk-options]'), {
    mode: 'pc',
    initial: model ? model.desk : undefined,
    onChange: (state, valid) => { desk = state; deskOk = valid; preview(); render(); },
  });
  if (model) {
    const t = page.querySelector('[data-model-note]');
    if (t) { t.hidden = false; t.textContent = `התחלתם מהדגם "${model.label}". אפשר לשנות כל פרט.`; }
  }
});
