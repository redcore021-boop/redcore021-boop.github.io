// RedCore — the 3D PC next to the configurator (build.html).
// Builds the panel (side column on a computer, top of the page on a phone), loads three.js + the models only when the
// browser is idle, shows a progress bar, and follows the configurator's choices (event 'rc:build' from configurator.js).
// Without WebGL, on a weak device, or if anything fails, the panel shows a rendered picture of a PC instead (assets/img/pc3d-preview.jpg).
(() => {
  const root = document.getElementById('configurator');
  const summary = root && root.querySelector('[data-summary]');
  if (!summary) return;
  const SCRIPT = 'assets/js/pc-3d.js';

  const webgl = () => {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
  };
  const weak = () => (navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2)
    || (navigator.connection && navigator.connection.saveData);
  const can3d = webgl() && !weak() && 'IntersectionObserver' in window && 'ResizeObserver' in window;
  // the models, fetched while the 3D code downloads (the same list as FILES in pc3d/pc-3d.js)
  const MODELS = ['case', 'case-pano', 'board-atx', 'board-matx', 'board-itx', 'cpu', 'fan-120', 'gpu-2fan', 'gpu-3fan', 'ram', 'ssd-m2', 'psu', 'cooler-air', 'aio-pump', 'aio-240', 'aio-280', 'aio-360']
    .map((n) => `assets/models/pc/${n}.glb`);
  // quality tier (see TIERS in pc3d/pc-3d.js): phones and weak graphics start low, laptops with integrated graphics medium,
  // the rest high. The 3D view also steps down by itself if the frame rate drops. ?pc3d-quality=low|medium|high forces one.
  const tier = () => {
    const forced = (location.search.match(/[?&]pc3d-quality=(low|medium|high)/) || [])[1];
    if (forced) return forced;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const phone = window.matchMedia('(max-width: 1023px)').matches || (touch && !window.matchMedia('(min-width: 1280px)').matches);
    let gpu = '';
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      const lose = gl && gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    } catch { /* unknown GPU */ }
    if (/swiftshader|llvmpipe|software|microsoft basic/i.test(gpu)) return 'low';
    if (phone) return cores >= 8 && mem >= 6 && !/mali-[gt]?[1-7]\d|adreno.*\b[1-5]\d\d\b|powervr/i.test(gpu) ? 'medium' : 'low';
    if (cores <= 2 || mem <= 2) return 'low';
    if (/intel/i.test(gpu) && !/iris|arc/i.test(gpu)) return 'medium'; // Intel HD / UHD
    if (cores <= 4) return 'medium';
    return 'high';
  };

  // the configurator's latest choices (it may render before the 3D is ready)
  let build = window.RCBuildCurrent || null;
  let view = null;
  // after the 3D has put a build together, it tells the builder how many extra fans really fit beside those parts
  const reportRoom = (b) => {
    if (!view || !b || !window.RCBuild || !window.RCBuild.setFanRoom || !view.fanRoom) return;
    const room = view.fanRoom();
    if (room !== null) window.RCBuild.setFanRoom(room, b.roomKey);
  };
  document.addEventListener('rc:build', (e) => {
    build = e.detail;
    const b = build;
    if (view) view.setBuild(build.sel, { removed: build.removed || [] }).then(() => { if (build === b) reportRoom(b); });
    updateTotal();
  });

  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* blocked */ } } };
  const COLORS = [['#E5132B', 'אדום'], ['#1E6BFF', 'כחול'], ['#18C46B', 'ירוק'], ['#A236FF', 'סגול'], ['#00D1FF', 'תכלת'], ['#FFFFFF', 'לבן']];
  const LABELS = { case: 'מארז', board: 'לוח אם', cpu: 'מעבד', cooler: 'קירור', ram: 'זיכרון RAM', gpu: 'כרטיס מסך', storage: 'אחסון', psu: 'ספק כוח', fans: 'מאווררים' };
  const MODES = [['static', 'קבוע'], ['breathe', 'נשימה'], ['rainbow', 'קשת']];
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shekel = (n) => `₪${Number(n).toLocaleString('he-IL')}`;
  const icon = (id, cls = 'w-5 h-5') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

  // ---------- layout: a side column with the 3D panel; the summary moves under the parts list
  const grid = summary.parentElement;
  const main = grid.firstElementChild;
  const side = document.createElement('div');
  side.className = 'cfg-side';
  side.innerHTML = `
    <section class="pc3d" aria-label="הדמיה תלת־ממדית של המחשב שבניתם">
      <div class="pc3d-head">
        <span class="pc3d-head-pill">הדמיה</span>
        <span class="pc3d-badge"><i aria-hidden="true"></i>תלת־ממד חי · מתעדכן לפי הבחירות</span>
      </div>
      <div class="pc3d-frame">
        <div class="pc3d-stage" data-stage>
          <div class="pc3d-loading" role="status" aria-live="polite">
            <span class="pc3d-spinner" aria-hidden="true"></span>
            <span>מרכיבים את המחשב <b class="tabular" data-pct>0%</b></span>
            <span class="pc3d-bar" aria-hidden="true"><i data-bar></i></span>
          </div>
          <p class="pc3d-hint" data-hint>${icon('i-refresh', 'w-3.5 h-3.5')}<span>גררו לסיבוב · צביטה לזום · לחצו על חלק</span></p>
          <div class="pc3d-tip" data-tip hidden></div>
          <div class="pc3d-card" data-card role="dialog" aria-label="פרטי החלק" hidden></div>
        </div>
        <div class="pc3d-top" data-top>
          <div class="pc3d-corner pc3d-tools" role="toolbar" aria-label="תצוגה">
            <button type="button" class="pc3d-btn is-icon" data-mute aria-pressed="false" aria-label="השתקת צליל ההרכבה" title="צליל">${icon('i-sound', 'w-4 h-4')}</button>
            <button type="button" class="pc3d-btn is-icon" data-reset aria-label="חזרה למבט הכללי" title="מבט כללי">${icon('i-refresh', 'w-4 h-4')}</button>
            <button type="button" class="pc3d-expand" data-expand aria-pressed="false" aria-label="הגדלה למסך מלא" title="מסך מלא">${icon('i-expand', 'w-4 h-4')}<span>הגדלה</span></button>
          </div>
        </div>
        <div class="pc3d-toggles pc3d-tools" role="toolbar" aria-label="מה להציג">
          <button type="button" class="pc3d-pill" data-power aria-pressed="true" title="הדלקה וכיבוי">${icon('i-zap', 'w-4 h-4')}<span>דלוק</span></button>
          <button type="button" class="pc3d-pill" data-explode aria-pressed="false" title="פירוק המחשב לחלקים">${icon('i-grid', 'w-4 h-4')}<span>פירוק</span></button>
        </div>
      </div>
      <div class="pc3d-light pc3d-tools" role="group" aria-label="תאורת RGB">
        <span class="pc3d-light-label">תאורת RGB</span>
        <div class="pc3d-colors" role="radiogroup" aria-label="צבע התאורה">
          ${COLORS.map(([hex, name]) => `<button type="button" role="radio" class="pc3d-swatch" data-color="${hex}" aria-label="${name}" title="${name}" style="--c:${hex}"></button>`).join('')}
        </div>
        <div class="pc3d-modes" role="radiogroup" aria-label="מצב התאורה">
          ${MODES.map(([id, name]) => `<button type="button" role="radio" class="pc3d-mode" data-mode="${id}">${name}</button>`).join('')}
        </div>
      </div>
      <aside class="pc3d-rail" aria-label="החלקים במחשב" data-rail></aside>
      <div class="pc3d-foot">
        <span><small>עלות מפרט</small><b class="tabular" data-total>₪0</b></span>
        <a href="#" class="btn btn-primary btn-sm" data-to-summary>לסיכום ושליחה</a>
      </div>
    </section>`;
  grid.insertBefore(side, summary);
  main.appendChild(summary);
  grid.classList.add('has-3d');

  const panelEl = side.querySelector('.pc3d'); // (moves into a dialog in full screen: look things up from it, not from side)
  const stage = side.querySelector('[data-stage]');
  const pct = side.querySelector('[data-pct]');
  const bar = side.querySelector('[data-bar]');
  const totalEl = side.querySelector('[data-total]');
  function updateTotal() {
    const t = summary.querySelector('.cfg-total strong');
    if (t) totalEl.textContent = t.textContent;
  }
  updateTotal();
  side.querySelector('[data-to-summary]').addEventListener('click', (e) => {
    e.preventDefault();
    summary.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.getElementById('cfgSumTitle')?.focus({ preventScroll: true });
  });

  // undo the layout if the 3D can't start: the page goes back to how it was
  // no 3D here: the same panel with a still picture (rendered in Blender) instead of the live model
  const giveUp = () => {
    const panel = side.querySelector('.pc3d');
    panel.classList.add('is-static', 'is-ready');
    stage.innerHTML = '<img class="pc3d-still" src="assets/img/pc3d-preview.jpg" alt="איור: מחשב גיימינג מורכב במארז זכוכית עם תאורת RGB" width="920" height="1000" decoding="async">'
      + '<p class="pc3d-hint">תמונה להמחשה · התצוגה התלת־ממדית לא זמינה במכשיר הזה</p>';
    panel.querySelectorAll('.pc3d-tools, .pc3d-top, [data-rail], [data-tip], [data-card]').forEach((el) => el.remove());
  };

  const setProgress = (p) => {
    const v = Math.round(Math.max(0, Math.min(1, p)) * 100);
    pct.textContent = `${v}%`; bar.style.width = `${v}%`;
  };

  // download the bundle with progress, then run it from the same URL (scripts from 'self' only)
  const loadScript = async () => {
    if (window.RCPc3D) return;
    try {
      const res = await fetch(SCRIPT);
      const packed = !!res.headers.get('content-encoding');
      const total = packed ? 0 : Number(res.headers.get('content-length')) || 0;
      if (res.body) {
        const reader = res.body.getReader(); let got = 0;
        for (;;) {
          const { done, value } = await reader.read(); if (done) break;
          got += value.length;
          setProgress(0.6 * (total ? got / total : 1 - Math.exp(-got / 360000)));
        }
      } else await res.arrayBuffer();
    } catch { /* the script tag still tries */ }
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    if (!window.RCPc3D) throw new Error('3D bundle did not load');
  };

  // ---------- hover label + the card of a clicked part
  const tip = side.querySelector('[data-tip]');
  const card = side.querySelector('[data-card]');
  const place = (el, at) => {
    const r = stage.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(r.width - el.offsetWidth - 8, at.x - el.offsetWidth / 2))}px`;
    el.style.top = `${Math.max(8, Math.min(r.height - el.offsetHeight - 8, at.y - el.offsetHeight - 16))}px`;
  };
  function onHover(cat, part, at) {
    if (!cat || !at || !card.hidden) { tip.hidden = true; return; }
    tip.innerHTML = `<b>${LABELS[cat] || ''}</b>${part ? `<span>${esc(part.name)}</span>` : '<span>עוד לא נבחר</span>'}`;
    tip.hidden = false;
    place(tip, at);
  }
  function closeCard() { card.hidden = true; }
  function onSelect(cat, part) {
    tip.hidden = true;
    if (cat && isBig()) { closeCard(); openSection(cat); return; }
    if (!cat || cat === 'fans') { closeCard(); return; }
    const label = LABELS[cat] || '';
    card.innerHTML = `
      <button type="button" class="pc3d-card-x" data-card-close aria-label="סגירה">${icon('i-x', 'w-4 h-4')}</button>
      <small>${label}</small>
      <b>${part ? esc(part.name) : 'עוד לא נבחר'}</b>
      ${part && part.note ? `<p>${esc(part.note)}</p>` : ''}
      ${part ? `<span class="pc3d-card-price tabular">${shekel(part.price)}</span>` : ''}
      <button type="button" class="btn btn-primary btn-sm" data-card-pick="${cat}">${part ? `החלפת ${label}` : `בחירת ${label}`}</button>`;
    card.hidden = false;
    card.querySelector('[data-card-pick]').focus({ preventScroll: true });
  }
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-card-close]')) { closeCard(); return; }
    const b = e.target.closest('[data-card-pick]');
    if (b) { closeCard(); if (window.RCBuild) window.RCBuild.open(b.dataset.cardPick); }
  });
  card.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCard(); });

  const start = async () => {
    try {
      await Promise.all([loadScript(), ...MODELS.map((u) => fetch(u).then((res) => res.arrayBuffer()).catch(() => null))]);
      view = await window.RCPc3D.create(stage, { quality: tier(), onProgress: (p) => setProgress(0.6 + 0.4 * p), onHover, onSelect });
      side.querySelector('.pc3d').classList.add('is-ready');
      if (build) { const b = build; view.setBuild(build.sel, { animate: false }).then(() => { if (build === b) reportRoom(b); }); }
      wire();
    } catch (err) {
      console.warn('3D PC unavailable', err);
      giveUp();
    }
  };

  function wire() {
    const powerBtn = side.querySelector('[data-power]');
    powerBtn.addEventListener('click', () => {
      const on = powerBtn.getAttribute('aria-pressed') !== 'true';
      powerBtn.setAttribute('aria-pressed', String(on));
      powerBtn.querySelector('span').textContent = on ? 'דלוק' : 'כבוי';
      view.setPower(on);
    });
    const swatches = [...side.querySelectorAll('[data-color]')];
    const pick = (hex, focus) => {
      swatches.forEach((b) => { const on = b.dataset.color === hex; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      view.setRgb(hex); store.set('rc-pc3d-rgb', hex);
    };
    const saved = store.get('rc-pc3d-rgb');
    pick(swatches.some((b) => b.dataset.color === saved) ? saved : COLORS[0][0]);
    swatches.forEach((b, i) => {
      b.addEventListener('click', () => pick(b.dataset.color));
      b.addEventListener('keydown', (e) => {
        const step = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }[e.key]; // RTL: left = next
        if (!step) return;
        e.preventDefault();
        pick(swatches[(i + step + swatches.length) % swatches.length].dataset.color, true);
      });
    });
    const muteBtn = side.querySelector('[data-mute]');
    const setMute = (m) => { muteBtn.setAttribute('aria-pressed', String(m)); muteBtn.setAttribute('aria-label', m ? 'הפעלת צליל ההרכבה' : 'השתקת צליל ההרכבה'); view.setMuted(m); store.set('rc-pc3d-mute', m ? '1' : '0'); };
    setMute(store.get('rc-pc3d-mute') === '1');
    muteBtn.addEventListener('click', () => setMute(muteBtn.getAttribute('aria-pressed') !== 'true'));
    side.querySelector('[data-reset]').addEventListener('click', () => view.resetView());
    // lighting mode: steady, breathing or rainbow
    const modes = [...side.querySelectorAll('[data-mode]')];
    const setMode = (m, focus) => {
      modes.forEach((b) => { const on = b.dataset.mode === m; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
      view.setRgbMode(m); store.set('rc-pc3d-mode', m);
    };
    const savedMode = store.get('rc-pc3d-mode');
    setMode(modes.some((b) => b.dataset.mode === savedMode) ? savedMode : 'static');
    modes.forEach((b, i) => {
      b.addEventListener('click', () => setMode(b.dataset.mode));
      b.addEventListener('keydown', (e) => {
        const step = { ArrowLeft: 1, ArrowDown: 1, ArrowRight: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        setMode(modes[(i + step + modes.length) % modes.length].dataset.mode, true);
      });
    });
    // exploded view: the parts float apart, and come back together on a second press
    const ex = side.querySelector('[data-explode]');
    ex.addEventListener('click', () => {
      const on = ex.getAttribute('aria-pressed') !== 'true';
      ex.setAttribute('aria-pressed', String(on));
      ex.querySelector('span').textContent = on ? 'הרכבה' : 'פירוק';
      closeCard();
      view.setExploded(on);
    });
    // a new choice puts the PC back together first
    document.addEventListener('rc:build', () => { if (ex.getAttribute('aria-pressed') === 'true') { ex.setAttribute('aria-pressed', 'false'); ex.querySelector('span').textContent = 'פירוק'; } closeCard(); renderRail(); });

    // the "how to" hint goes away after the first touch of the model (and stays away)
    const hint = side.querySelector('[data-hint]');
    if (store.get('rc-pc3d-hint') === '1') hint.classList.add('is-gone');
    stage.addEventListener('pointerdown', () => { hint.classList.add('is-gone'); store.set('rc-pc3d-hint', '1'); }, { once: true });

    // ---------- the large view (like the desk builder's): a window with the price, the 3D, and a side panel where the
    // parts, the extra fans and the lighting are chosen in place. It works through the builder (RCBuild), so the list,
    // the price, the summary and the quote always stay in step. The WebGL canvas just moves along; its size follows.
    const panel = panelEl;
    const expBtn = side.querySelector('[data-expand]');
    const dlg = document.createElement('dialog');
    dlg.className = 'desk-3d-dialog pc3d-big';
    dlg.setAttribute('aria-labelledby', 'pc3dBigTitle');
    dlg.innerHTML = `
      <div class="desk-3d-dialog-head">
        <div>
          <h2 id="pc3dBigTitle">המחשב שלכם בתלת־ממד</h2>
          <p class="desk-3d-hint">גררו כדי לסובב · גלגלת או צביטה לזום · לחצו על חלק כדי להחליף אותו</p>
        </div>
        <p class="desk-3d-price">מחיר משוער <b class="tabular" data-big-price></b></p>
        <button type="button" class="desk-3d-close" data-big-close aria-label="סגירת התצוגה המוגדלת">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="desk-3d-dialog-body pc3d-big-body"><aside class="desk-3d-side pc3d-side" aria-label="בחירת רכיבים" data-big-side></aside></div>`;
    document.body.appendChild(dlg);
    const bigBody = dlg.querySelector('.pc3d-big-body');
    const bigSide = dlg.querySelector('[data-big-side]');
    const bigPrice = dlg.querySelector('[data-big-price]');
    // ready views and zoom (shown in the large view only)
    const views = document.createElement('div');
    views.className = 'pc3d-views'; views.setAttribute('role', 'group'); views.setAttribute('aria-label', 'זווית צפייה');
    views.innerHTML = [['3d', 'תלת־ממד'], ['side', 'מהצד'], ['front', 'מלפנים']].map(([id, l], i) => `<button type="button" data-view="${id}" aria-pressed="${i === 0}">${l}</button>`).join('');
    const zoom = document.createElement('div');
    zoom.className = 'pc3d-zoom'; zoom.setAttribute('role', 'group'); zoom.setAttribute('aria-label', 'זום');
    zoom.innerHTML = '<button type="button" data-zoom="in" aria-label="התקרבות">+</button><button type="button" data-zoom="out" aria-label="התרחקות">−</button><button type="button" data-zoom="reset" aria-label="חזרה לזווית ההתחלתית" title="חזרה לזווית ההתחלתית">⟲</button>';
    panelEl.querySelector('[data-top]').prepend(views); stage.append(zoom);
    views.addEventListener('click', (e) => {
      const v = e.target.closest('[data-view]'); if (!v) return;
      view.setView(v.dataset.view);
      views.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === v)));
    });
    zoom.addEventListener('click', (e) => {
      const z = e.target.closest('[data-zoom]'); if (!z) return;
      if (z.dataset.zoom === 'reset') { view.resetView(); views.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === '3d'))); }
      else view.zoom(z.dataset.zoom === 'in' ? 0.8 : 1.25);
    });

    const spot = document.createComment('pc3d');
    const setExpanded = (on) => {
      if (on === panel.classList.contains('is-expanded')) return;
      closeCard(); tip.hidden = true;
      if (on) {
        panel.replaceWith(spot); bigBody.prepend(panel);
        panel.classList.add('is-expanded');
        renderRail();
        dlg.showModal();
        document.documentElement.classList.add('pc3d-lock');
        dlg.querySelector('[data-big-close]').focus({ preventScroll: true });
        view.resetView(); // (from the usual angle, as the desk builder does)
        views.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === '3d')));
      } else {
        panel.classList.remove('is-expanded');
        spot.replaceWith(panel);
        if (dlg.open) dlg.close();
        document.documentElement.classList.remove('pc3d-lock');
        expBtn.focus({ preventScroll: true });
      }
      expBtn.setAttribute('aria-pressed', String(on));
    };
    expBtn.addEventListener('click', () => setExpanded(!panel.classList.contains('is-expanded')));
    dlg.querySelector('[data-big-close]').addEventListener('click', () => setExpanded(false));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (!card.hidden) closeCard(); else setExpanded(false); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) setExpanded(false); }); // a click on the backdrop
    // "to the summary" (in the page, or the side panel's button): close the large view first
    side.querySelector('[data-to-summary]').addEventListener('click', () => setExpanded(false), { capture: true });
    bigSide.addEventListener('click', (e) => {
      if (e.target.closest('[data-big-summary]')) { setExpanded(false); side.querySelector('[data-to-summary]').click(); }
    });
    // a part clicked in the model, in the large view: its section opens in the side panel (instead of the card)
    openSection = (cat) => { openSec = cat; renderRail(); bigSide.querySelector(`[data-sec="${cat}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
    isBig = () => panel.classList.contains('is-expanded');
    priceEl = bigPrice;
  }

  // ---------- the large view's side panel: each part (the ones that fit what's chosen; one section open at a time),
  // the extra fans by position, and the lighting
  const SECTIONS = ['case', 'board', 'cpu', 'cooler', 'ram', 'gpu', 'storage', 'psu', 'fans'];
  let openSec = null;
  let openSection = () => {};
  let isBig = () => false;
  let priceEl = null;
  const money = (n) => `${n < 0 ? '−' : '+'}₪${Math.abs(n).toLocaleString('he-IL')}`;
  function renderRail() {
    const box = document.querySelector('[data-big-side]');
    if (!box || !isBig() || !window.RCBuild || !window.RCBuild.options) return;
    if (priceEl) { const t = summary.querySelector('.cfg-total strong'); priceEl.textContent = t ? t.textContent : ''; }
    const sel = (build && build.sel) || {};
    const f = build && build.fans;
    if (openSec === null) openSec = SECTIONS.find((k) => k !== 'fans' && !sel[k]) || '';
    // keep the focus (and the scroll) across the redraw
    const act = box.contains(document.activeElement) ? document.activeElement : null;
    const keep = act ? (act.dataset.optId ? `[data-opt-id="${act.dataset.optId}"]` : act.dataset.railFan ? `[data-rail-fan="${act.dataset.railFan}"][data-line="${act.dataset.line}"][data-d="${act.dataset.d}"]`
      : act.dataset.bigPack ? `[data-big-pack="${act.dataset.bigPack}"][data-line="${act.dataset.line}"]` : act.dataset.secToggle ? `[data-sec-toggle="${act.dataset.secToggle}"]` : act.dataset.bigColor ? `[data-big-color="${act.dataset.bigColor}"]` : act.dataset.bigMode ? `[data-big-mode="${act.dataset.bigMode}"]` : null) : null;
    const top = box.scrollTop;
    const opts = (key) => {
      const list = window.RCBuild.options(key);
      const cur = sel[key];
      if (!list.length) return '<p class="pc3d-opt-none">אין רכיבים שמתאימים לבחירות האחרות</p>';
      return `<div class="pc3d-opts">${list.map((o) => `<button type="button" class="pc3d-opt" data-opt-key="${key}" data-opt-id="${esc(o.id)}" aria-pressed="${key !== 'fans' && o.chosen}">
        <img src="${esc(o.img)}" alt="" loading="lazy" width="48" height="36">
        <span><b>${esc(o.name)}</b>${o.note ? `<small>${esc(o.note)}</small>` : ''}</span>
        <em class="tabular">${key === 'fans' ? `${o.chosen ? 'עוד אחד · ' : ''}+${shekel(o.price)}` : o.chosen ? 'נבחר' : cur ? money(o.price - cur.price) : shekel(o.price)}</em></button>`).join('')}</div>`;
    };
    // the extra fans, kind by kind: a pack comes whole (packs − / +, and + in a position moves one of its fans there);
    // single fans are added or dropped one at a time; each position takes no more than the case allows there
    const fanKind = (k, i) => {
      const rows = f.order.filter((q) => k.caps[q] || k.plan[q]).map((q) => {
        const n = k.plan[q] || 0; const cap = k.caps[q] || 0; const L = f.labels[q];
        if (k.pack) {
          return `<li class="is-move"><span>${L}</span><output class="tabular">${n}<small>/${cap}</small></output>
            <button type="button" class="pc3d-fan-step" data-rail-fan="${q}" data-line="${i}" data-d="1" aria-label="להעביר מאוורר מהערכה ל${L}" title="להעביר מאוורר לכאן" ${n >= cap || !(k.canMoveTo && k.canMoveTo[q]) ? 'disabled' : ''}>+</button></li>`;
        }
        return `<li><span>${L}</span>
          <button type="button" class="pc3d-fan-step" data-rail-fan="${q}" data-line="${i}" data-d="-1" aria-label="מאוורר אחד פחות ב${L}" ${!n || k.total <= 1 ? 'disabled' : ''}>−</button>
          <output class="tabular">${n}<small>/${cap}</small></output>
          <button type="button" class="pc3d-fan-step" data-rail-fan="${q}" data-line="${i}" data-d="1" aria-label="עוד מאוורר ב${L}" ${n >= cap ? 'disabled' : ''}>+</button></li>`;
      }).join('');
      return `<div class="pc3d-fankind">
        <div class="pc3d-fankind-head"><b>${esc(k.name)}</b><span class="tabular">${shekel(k.price)}</span>
          <button type="button" class="pc3d-link" data-big-remove-kind="${i}" aria-label="הסרת ${esc(k.name)}">הסרה</button></div>
        ${k.pack ? `<div class="pc3d-packs"><span>ערכות של ${k.per}<small>נמכרות שלמות</small></span>
          <button type="button" class="pc3d-fan-step" data-big-pack="-1" data-line="${i}" aria-label="ערכה אחת פחות" ${k.packs <= 1 ? 'disabled' : ''}>−</button>
          <output class="tabular">${k.packs}</output>
          <button type="button" class="pc3d-fan-step" data-big-pack="1" data-line="${i}" aria-label="עוד ערכה" ${k.packs >= k.maxPacks ? 'disabled' : ''}>+</button></div>` : ''}
        <ul class="pc3d-fanpos">${rows || '<li class="is-none">אין מקום פנוי במארז</li>'}</ul>
        ${k.unplaced ? `<p class="pc3d-fan-free">${k.unplaced === 1 ? 'מאוורר אחד מהערכה עוד לא במקום' : `${k.unplaced} מאווררים מהערכה עוד לא במקום`}: בחרו לו מיקום ב-+</p>` : ''}
      </div>`;
    };
    const fanPos = () => {
      if (!f) return '';
      return `${f.lines.map(fanKind).join('')}
        ${f.lines.some((k) => k.pack) ? '<p class="desk-3d-sub">ערכה נמכרת שלמה · + ליד מיקום מעביר אליו מאוורר מהערכה</p>' : ''}
        <p class="desk-3d-sub pc3d-fan-addhead">${f.canAdd ? 'הוספת סוג מאוורר נוסף' : 'אין במארז מקום לסוג נוסף'}</p>`;
    };
    const section = (key) => {
      const p = sel[key];
      const open = openSec === key;
      const label = key === 'fans' ? 'מאווררים נוספים' : LABELS[key];
      const value = key === 'fans' ? (f ? (f.lines.length > 1 ? `${f.count} מאווררים · ${f.lines.length} סוגים` : `${f.count} × ${esc(f.lines[0].name)}`) : 'ללא') : (p ? esc(p.name) : 'לבחירה');
      const price = key === 'fans' ? (f ? shekel(f.lines.reduce((n, k) => n + k.price, 0)) : '') : p ? shekel(p.price) : '';
      return `<section class="pc3d-sec ${open ? 'is-open' : ''} ${p || (key === 'fans' && f) ? '' : 'is-empty'}" data-sec="${key}">
        <button type="button" class="pc3d-sec-head" data-sec-toggle="${key}" aria-expanded="${open}">
          <small>${label}</small><b>${value}</b>${price ? `<span class="tabular">${price}</span>` : ''}<i aria-hidden="true"></i></button>
        ${open ? `<div class="pc3d-sec-body">${key === 'fans' ? fanPos() : ''}${opts(key)}</div>` : ''}
      </section>`;
    };
    // the lighting, as in the dock (the dock's own buttons are pressed, so both stay in step)
    const dock = panelEl;
    const on = dock.querySelector('[data-power]').getAttribute('aria-pressed') === 'true';
    const curColor = dock.querySelector('[data-color][aria-checked="true"]')?.dataset.color;
    const curMode = dock.querySelector('[data-mode][aria-checked="true"]')?.dataset.mode;
    box.innerHTML = `<h3>המפרט שלכם</h3>${SECTIONS.map(section).join('')}
      <h3>תאורת RGB <small>מסונכרנת בכל החלקים</small></h3>
      <div class="desk-3d-swatches">${COLORS.map(([hex, name]) => `<button type="button" class="desk-3d-swatch is-glow" data-big-color="${hex}" aria-pressed="${hex === curColor}" aria-label="${name}" title="${name}"><i data-hex="${hex}"></i><span>${name}</span></button>`).join('')}</div>
      <div class="desk-3d-mats pc3d-big-modes">${MODES.map(([id, name]) => `<button type="button" data-big-mode="${id}" aria-pressed="${id === curMode}"><b>${name}</b></button>`).join('')}
        <button type="button" data-big-power aria-pressed="${!on}"><b>${on ? 'כיבוי' : 'הדלקה'}</b></button></div>
      <div class="pc3d-big-total"><span>עלות מפרט <b class="tabular">${priceEl ? priceEl.textContent : ''}</b></span>
        <button type="button" class="btn btn-primary btn-sm" data-big-summary>לסיכום ושליחה</button></div>`;
    box.querySelectorAll('[data-hex]').forEach((i) => { i.style.background = i.dataset.hex; i.style.color = i.dataset.hex; });
    box.scrollTop = top;
    if (keep) box.querySelector(keep)?.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    const box = e.target.closest('[data-big-side]'); if (!box || !window.RCBuild) return;
    const t = e.target.closest('[data-sec-toggle]');
    if (t) { openSec = openSec === t.dataset.secToggle ? '' : t.dataset.secToggle; renderRail(); if (view && openSec) view.highlight(openSec); return; }
    const o = e.target.closest('[data-opt-id]');
    if (o) { if (o.getAttribute('aria-pressed') !== 'true') window.RCBuild.choose(o.dataset.optKey, o.dataset.optId); return; }
    const fb = e.target.closest('[data-rail-fan]');
    if (fb && !fb.disabled) { window.RCBuild.addFanAt(fb.dataset.railFan, Number(fb.dataset.d), Number(fb.dataset.line || 0)); return; }
    const pk = e.target.closest('[data-big-pack]');
    if (pk && !pk.disabled) { window.RCBuild.addPacks(Number(pk.dataset.bigPack), Number(pk.dataset.line || 0)); return; }
    const rk = e.target.closest('[data-big-remove-kind]');
    if (rk) { window.RCBuild.removeFanKind(Number(rk.dataset.bigRemoveKind)); return; }
    const rm = e.target.closest('[data-big-remove]');
    if (rm) { window.RCBuild.remove(rm.dataset.bigRemove); return; }
    const dock = panelEl;
    const c = e.target.closest('[data-big-color]');
    if (c) { dock.querySelector(`[data-color="${c.dataset.bigColor}"]`)?.click(); renderRail(); return; }
    const m = e.target.closest('[data-big-mode]');
    if (m) { dock.querySelector(`[data-mode="${m.dataset.bigMode}"]`)?.click(); renderRail(); return; }
    if (e.target.closest('[data-big-power]')) { dock.querySelector('[data-power]').click(); renderRail(); }
  });
  document.addEventListener('mouseover', (e) => {
    const h = e.target.closest('[data-big-side] [data-sec-toggle]');
    if (h && view && !h.contains(e.relatedTarget)) view.highlight(h.dataset.secToggle); // light the part up in the model
  });

  // start once the page has settled and the browser is idle (the list works meanwhile)
  const go = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
  if (!can3d) giveUp();
  else if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
})();
