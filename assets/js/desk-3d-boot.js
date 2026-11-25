// RedCore — lazy loader for the 3D desk preview (desk-builder.html).
// Loads three.js + the model only when the preview scrolls into view, shows a progress skeleton,
// and leaves the 2D drawing in place when WebGL is missing, the device is weak, or anything fails.
(() => {
  const page = document.getElementById('deskBuilder');
  if (!page) return;
  const SCRIPT = 'assets/js/desk-3d.js';
  const MODEL = 'assets/models/desk.glb';

  const webgl = () => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch { return false; }
  };
  const weak = () => (navigator.deviceMemory && navigator.deviceMemory < 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2)
    || (navigator.connection && navigator.connection.saveData);
  if (!webgl() || weak() || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;

  // Latest desk state from desk-builder.js
  let state = window.RCDeskCurrent || null;
  const views = []; // { view, syncHeight }

  // Gaming chair shown with the desk (view only: not part of the price or the order). Shared by both previews.
  const CHAIR = { style: 'none', color: '#D9122A' };
  const CHAIR_STYLES = [['none', 'ללא'], ['racing', 'ספורטיבי'], ['ergo', 'ארגונומי']];
  const CHAIR_COLORS = [['red', 'אדום', '#D9122A'], ['blue', 'כחול', '#1E6BFF'], ['green', 'ירוק', '#18B45B'], ['white', 'לבן', '#EDEEF0'], ['black', 'שחור', '#2A2C31']];
  const chairUi = new Set(); // callbacks that redraw chair buttons in each preview

  // Gaming setup on the desk (view only): screen size, PC case color, RGB color. Shared by both previews.
  const SETUP = { on: false, monitor: '27', pcHex: '#111216', rgbHex: '#E5132B' };
  const SETUP_MONITORS = [['24', '24″'], ['27', '27″'], ['32', '32″'], ['34uw', '34″ UW'], ['dual', '2×27″']];
  const SETUP_PC = [['שחור', '#111216'], ['לבן', '#E9EAEC'], ['אפור', '#5E626B']];
  const SETUP_RGB = [['אדום', '#E5132B'], ['כחול', '#1E6BFF'], ['סגול', '#9B3BFF'], ['ירוק', '#18D46B'], ['ציאן', '#18D5E5']];
  const applySetup = () => {
    views.forEach((v) => { v.view.setProps(SETUP.on); v.view.setSetup(SETUP); });
    chairUi.forEach((fn) => fn());
  };
  const applyChair = () => {
    views.forEach((v) => { v.view.setChair(CHAIR.style); v.view.setChairColor(CHAIR.color); });
    chairUi.forEach((fn) => fn());
  };
  document.addEventListener('rc:desk', (e) => {
    state = e.detail;
    views.forEach((v) => { v.view.update(state); v.syncHeight(); });
  });

  // Height shown in the 3D view for adjustable desks. View only: not part of the price or the order.
  const HEIGHTS = (window.RC_DESK && window.RC_DESK.height) || [];
  const PRESETS = { electric: [['ישיבה', 73], ['עמידה', 110]] };
  const shownHeight = {}; // per height type, shared by both previews
  const heightRange = (type) => (HEIGHTS.find((h) => h.id === type) || {}).range;
  const heightFor = (type) => {
    const [min, max] = heightRange(type);
    if (shownHeight[type] == null) shownHeight[type] = Math.min(max, Math.max(min, 75));
    return shownHeight[type];
  };

  // Download the bundle with progress (fills the cache), then run it from the same URL (CSP: scripts from 'self' only)
  let scriptPromise = null;
  const loadScript = (onProgress) => {
    if (window.RCDesk3D) return Promise.resolve();
    if (scriptPromise) return scriptPromise;
    scriptPromise = (async () => {
      try {
        const res = await fetch(SCRIPT);
        // With gzip/brotli, content-length is the compressed size but we count unpacked bytes: estimate instead
        const packed = !!res.headers.get('content-encoding');
        const total = packed ? 0 : Number(res.headers.get('content-length')) || 0;
        if (res.body) {
          const reader = res.body.getReader(); let got = 0;
          for (;;) {
            const { done, value } = await reader.read(); if (done) break;
            got += value.length;
            onProgress(total ? got / total : 1 - Math.exp(-got / 350000)); // ~680 KB bundle -> ~86% when done
          }
        } else await res.arrayBuffer();
      } catch { /* the script tag below still tries */ }
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SCRIPT; s.async = true; s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      if (!window.RCDesk3D) throw new Error('3D bundle did not load');
    })();
    return scriptPromise;
  };

  // Start the 3D only after the page has loaded and the browser is idle (the 2D drawing shows meanwhile)
  const pageSettled = new Promise((resolve) => {
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(() => resolve(), { timeout: 1500 }) : setTimeout(resolve, 300));
    if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, { once: true });
  });

  const VIEW_BUTTONS = [['3d', 'תלת־ממד'], ['top', 'מלמעלה'], ['front', 'מלפנים']];

  const setup = (preview) => {
    const box = document.createElement('div');
    box.className = 'desk-3d is-loading';
    box.innerHTML = `
      <div class="desk-3d-loading" role="status" aria-live="polite">
        <span class="desk-3d-spinner" aria-hidden="true"></span>
        <span>טוען הדמיה תלת־ממדית <b class="tabular" data-pct>0%</b></span>
        <span class="desk-3d-bar" aria-hidden="true"><i data-bar></i></span>
      </div>`;
    const head = preview.firstElementChild;
    head.after(box);
    preview.classList.add('has-3d'); // reserve the 3D space now (no layout jump later); undone if the 3D fails
    const pct = box.querySelector('[data-pct]');
    const bar = box.querySelector('[data-bar]');
    const progress = (p) => {
      const v = Math.round(Math.max(0, Math.min(1, p)) * 100);
      pct.textContent = `${v}%`;
      bar.style.width = `${v}%`;
    };

    const io = new IntersectionObserver(async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try {
        await pageSettled; // never compete with the page's own first render and the price/summary setup
        await loadScript((p) => progress(p * 0.8));
        const view = await window.RCDesk3D.create(box, { modelUrl: MODEL, onProgress: (p) => progress(0.8 + p * 0.2) });
        if (state) view.update(state);

        // Height slider, shown only for adjustable desks
        const hBox = document.createElement('div');
        hBox.className = 'desk-3d-height';
        hBox.hidden = true;
        const sliderId = `desk3dH${Math.random().toString(36).slice(2, 7)}`;
        hBox.innerHTML = `
          <label for="${sliderId}">גובה בהדמיה <b class="tabular" data-hval></b></label>
          <input type="range" id="${sliderId}" step="1" data-hrange>
          <span class="desk-3d-presets" data-hpresets></span>
          <small>להמחשה בלבד. השולחן מתכוונן לכל גובה בטווח.</small>`;
        box.after(hBox); // below the 3D view, so it never covers the legs
        const range = hBox.querySelector('[data-hrange]');
        const hval = hBox.querySelector('[data-hval]');
        const presets = hBox.querySelector('[data-hpresets]');
        let shownType = null;
        const setH = (cm) => {
          const type = state && state.height;
          shownHeight[type] = cm;
          range.value = cm; hval.textContent = `${cm} ס״מ`;
          views.forEach((v) => v.applyHeight(type, cm));
        };
        const syncHeight = () => {
          const type = state && state.height;
          const r = type && heightRange(type);
          hBox.hidden = !r;
          if (!r) { shownType = null; return; }
          if (type !== shownType) {
            shownType = type;
            range.min = r[0]; range.max = r[1];
            presets.innerHTML = (PRESETS[type] || []).map(([label, cm]) => `<button type="button" data-cm="${cm}">${label} ${cm}</button>`).join('');
          }
          const cm = heightFor(type);
          range.value = cm; hval.textContent = `${cm} ס״מ`;
          view.setHeight(cm);
        };
        range.addEventListener('input', () => setH(Number(range.value)));
        presets.addEventListener('click', (e) => { const b = e.target.closest('[data-cm]'); if (b) setH(Number(b.dataset.cm)); });
        const entry = {
          view, syncHeight,
          applyHeight: (type, cm) => { if (state && state.height === type) { range.value = cm; hval.textContent = `${cm} ס״מ`; view.setHeight(cm); } },
        };
        views.push(entry);
        if (CHAIR.style !== 'none') { view.setChair(CHAIR.style); view.setChairColor(CHAIR.color); }
        if (SETUP.on) { view.setProps(true); view.setSetup(SETUP); }
        syncHeight();
        box.classList.remove('is-loading');
        box.querySelector('.desk-3d-loading').remove();

        const bar2 = document.createElement('div');
        bar2.className = 'desk-3d-views';
        bar2.setAttribute('role', 'group');
        bar2.setAttribute('aria-label', 'זווית צפייה');
        bar2.innerHTML = VIEW_BUTTONS.map(([id, label]) => `<button type="button" data-view="${id}" aria-pressed="${id === '3d'}">${label}</button>`).join('');
        // Show/hide toggles sit at the bottom, so the top row never covers the desk
        const toggles = document.createElement('div');
        toggles.className = 'desk-3d-views desk-3d-toggles';
        toggles.setAttribute('role', 'group');
        toggles.setAttribute('aria-label', 'מה להציג');
        toggles.innerHTML = '<button type="button" data-toggle="dims" aria-pressed="true">מידות</button>'
          + '<button type="button" data-toggle="props" aria-pressed="false" title="מסך, מקלדת, עכבר, אוזניות ומחשב גיימינג להמחשה">סט גיימינג</button>'
          + '<button type="button" data-2d aria-pressed="false">שרטוט</button>'
          + '<button type="button" data-chair aria-pressed="false" title="כיסא גיימינג להמחשה, לא כלול במחיר">כיסא</button>'
          + '<button type="button" data-explode aria-pressed="false" title="הפרדת השולחן לחלקים שלו">פירוק לחלקים</button>';
        box.append(bar2, toggles);
        const onBarClick = (e) => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.toggle) {
            const on = b.getAttribute('aria-pressed') !== 'true';
            b.setAttribute('aria-pressed', String(on));
            if (b.dataset.toggle === 'dims') view.setDims(on); else { SETUP.on = on; applySetup(); }
            return;
          }
          if (b.hasAttribute('data-chair')) {
            CHAIR.style = CHAIR.style === 'none' ? 'racing' : 'none';
            applyChair();
            return;
          }
          if (b.hasAttribute('data-explode')) {
            const on = b.getAttribute('aria-pressed') !== 'true';
            b.setAttribute('aria-pressed', String(on));
            b.textContent = on ? 'הרכבה בחזרה' : 'פירוק לחלקים';
            view.setExplode(on);
            return;
          }
          if (b.hasAttribute('data-2d')) {
            const on = preview.classList.toggle('show-2d');
            b.setAttribute('aria-pressed', String(on));
            return;
          }
          if (!b.dataset.view) return; // e.g. the "הגדלה" button, which has its own handler
          view.setView(b.dataset.view);
          bar2.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        };
        chairUi.add(() => {
          toggles.querySelector('[data-chair]').setAttribute('aria-pressed', String(CHAIR.style !== 'none'));
          toggles.querySelector('[data-toggle="props"]').setAttribute('aria-pressed', String(SETUP.on));
        });
        bar2.addEventListener('click', onBarClick);
        toggles.addEventListener('click', onBarClick);

        // ---- Large view: the same 3D (same state, same camera) moved into a big modal window
        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'desk-3d-expand';
        expandBtn.setAttribute('aria-haspopup', 'dialog');
        expandBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>הגדלה</span>';
        bar2.append(expandBtn);

        const zoomBar = document.createElement('div');
        zoomBar.className = 'desk-3d-zoom';
        zoomBar.setAttribute('role', 'group');
        zoomBar.setAttribute('aria-label', 'זום');
        zoomBar.innerHTML = '<button type="button" data-zoom="in" aria-label="התקרבות">+</button>'
          + '<button type="button" data-zoom="out" aria-label="התרחקות">−</button>'
          + '<button type="button" data-zoom="reset" aria-label="חזרה לזווית ההתחלתית" title="חזרה לזווית ההתחלתית">⟲</button>';
        box.append(zoomBar);
        zoomBar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-zoom]'); if (!b) return;
          if (b.dataset.zoom === 'reset') view.reset(); else view.zoom(b.dataset.zoom === 'in' ? 0.8 : 1.25);
        });

        const dlg = document.createElement('dialog');
        dlg.className = 'desk-3d-dialog';
        dlg.setAttribute('aria-labelledby', `${sliderId}-title`);
        dlg.innerHTML = `
          <div class="desk-3d-dialog-head">
            <div>
              <h2 id="${sliderId}-title">השולחן שלכם בתלת־ממד</h2>
              <p class="desk-3d-hint">גררו כדי לסובב · גלגלת או צביטה לזום · הכפתורים למטה למבטים מהירים</p>
            </div>
            <p class="desk-3d-price">מחיר משוער <b class="tabular" data-dlg-price></b></p>
            <button type="button" class="desk-3d-close" aria-label="סגירת התצוגה המוגדלת">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="desk-3d-dialog-body"></div>
          <div class="desk-3d-dialog-foot"></div>`;
        document.body.append(dlg);
        const dlgBody = dlg.querySelector('.desk-3d-dialog-body');
        const dlgFoot = dlg.querySelector('.desk-3d-dialog-foot');
        const dlgPrice = dlg.querySelector('[data-dlg-price]');
        const placeholder = document.createElement('div');
        const updatePrice = () => {
          const t = page.querySelector('[data-desk-summary] .cfg-total strong');
          dlgPrice.textContent = t ? t.textContent : '';
        };
        document.addEventListener('rc:desk', () => { if (dlg.open) requestAnimationFrame(updatePrice); });

        // ---- Side panel in the large view: material + top color + leg color, without leaving the 3D.
        // It clicks the page's own options, so the price, summary and order always stay in sync.
        const CFG = window.RC_DESK || {};
        const side = document.createElement('aside');
        side.className = 'desk-3d-side';
        side.setAttribute('aria-label', 'חומר וצבע');
        dlgBody.append(side);
        const fmt = (n) => `+₪${Number(n).toLocaleString('he-IL')}`;
        const swatch = (name, [id, label, hex], current) => `<button type="button" class="desk-3d-swatch" data-pick="${name}" data-val="${id}"
          aria-pressed="${id === current}" aria-label="${label}" title="${label}"><i data-hex="${hex}"></i><span>${label}</span></button>`;
        const renderSide = () => {
          if (!state) return;
          const mat = (CFG.materials || []).find((m) => m.id === state.material) || (CFG.materials || [])[0];
          if (!mat) return;
          side.innerHTML = `
            <h3>חומר המשטח</h3>
            <div class="desk-3d-mats">${CFG.materials.map((m) => `<button type="button" data-pick="material" data-val="${m.id}" aria-pressed="${m.id === state.material}">
              <b>${m.label}</b><small>${m.price ? fmt(m.price) : 'כלול'}</small></button>`).join('')}</div>
            <h3>צבע המשטח</h3>
            <div class="desk-3d-swatches">${mat.colors.map((c) => swatch('top', c, state.top)).join('')}</div>
            <h3>צבע הרגליים</h3>
            <div class="desk-3d-swatches">${(CFG.legColors || []).map((c) => swatch('legs', c, state.legs)).join('')}</div>
            <h3>סט גיימינג <small>להמחשה · לא כלול במחיר</small></h3>
            <div class="desk-3d-mats desk-3d-chairs">${[['off', 'ללא'], ['on', 'הצגה']].map(([id, label]) => `<button type="button" data-setup-on="${id}" aria-pressed="${(id === 'on') === SETUP.on}"><b>${label}</b></button>`).join('')}</div>
            ${SETUP.on ? `
            <p class="desk-3d-sub">גודל מסך</p>
            <div class="desk-3d-mats desk-3d-monitors">${SETUP_MONITORS.map(([id, label]) => `<button type="button" data-setup-monitor="${id}" aria-pressed="${id === SETUP.monitor}"><b>${label}</b></button>`).join('')}</div>
            <p class="desk-3d-sub">צבע המחשב</p>
            <div class="desk-3d-swatches">${SETUP_PC.map(([label, hex]) => `<button type="button" class="desk-3d-swatch" data-setup-pc="${hex}" aria-pressed="${hex === SETUP.pcHex}" aria-label="${label}" title="${label}"><i data-hex="${hex}"></i><span>${label}</span></button>`).join('')}</div>
            <p class="desk-3d-sub">תאורת RGB</p>
            <div class="desk-3d-swatches">${SETUP_RGB.map(([label, hex]) => `<button type="button" class="desk-3d-swatch is-glow" data-setup-rgb="${hex}" aria-pressed="${hex === SETUP.rgbHex}" aria-label="${label}" title="${label}"><i data-hex="${hex}"></i><span>${label}</span></button>`).join('')}</div>` : ''}
            <h3>כיסא גיימינג <small>להמחשה · לא כלול במחיר</small></h3>
            <div class="desk-3d-mats desk-3d-chairs">${CHAIR_STYLES.map(([id, label]) => `<button type="button" data-chair-style="${id}" aria-pressed="${id === CHAIR.style}"><b>${label}</b></button>`).join('')}</div>
            ${CHAIR.style === 'none' ? '' : `<div class="desk-3d-swatches desk-3d-chair-colors">${CHAIR_COLORS.map(([, label, hex]) => `<button type="button" class="desk-3d-swatch" data-chair-color="${hex}"
              aria-pressed="${hex === CHAIR.color}" aria-label="${label}" title="${label}"><i data-hex="${hex}"></i><span>${label}</span></button>`).join('')}</div>`}`;
          side.querySelectorAll('[data-hex]').forEach((i) => { i.style.background = i.dataset.hex; });
        };
        chairUi.add(() => { if (dlg.open) renderSide(); });
        side.addEventListener('click', (e) => {
          const so = e.target.closest('[data-setup-on]');
          if (so) { SETUP.on = so.dataset.setupOn === 'on'; applySetup(); return; }
          const sm = e.target.closest('[data-setup-monitor]');
          if (sm) { SETUP.monitor = sm.dataset.setupMonitor; applySetup(); return; }
          const sp = e.target.closest('[data-setup-pc]');
          if (sp) { SETUP.pcHex = sp.dataset.setupPc; applySetup(); return; }
          const sr = e.target.closest('[data-setup-rgb]');
          if (sr) { SETUP.rgbHex = sr.dataset.setupRgb; applySetup(); return; }
          const cs = e.target.closest('[data-chair-style]');
          if (cs) { CHAIR.style = cs.dataset.chairStyle; applyChair(); return; }
          const cc = e.target.closest('[data-chair-color]');
          if (cc) { CHAIR.color = cc.dataset.chairColor; applyChair(); return; }
          const b = e.target.closest('[data-pick]'); if (!b) return;
          const input = page.querySelector(`[data-desk-options] input[name="${b.dataset.pick}"][value="${b.dataset.val}"]`);
          if (input && !input.checked) input.click();
        });
        document.addEventListener('rc:desk', () => {
          if (!dlg.open) return;
          // keep keyboard focus on the same choice after the panel redraws
          const focused = side.contains(document.activeElement) ? `[data-pick="${document.activeElement.dataset.pick}"][data-val="${document.activeElement.dataset.val}"]` : null;
          renderSide();
          if (focused) side.querySelector(focused)?.focus();
        });

        const openLarge = () => {
          renderSide();
          // keep the page layout steady while the 3D box is away
          placeholder.className = 'desk-3d-placeholder';
          const sliderH = hBox.hidden ? 0 : hBox.offsetHeight + 8; // the slider moves into the window too
          placeholder.style.height = `${box.offsetHeight + sliderH}px`;
          box.before(placeholder);
          dlgBody.append(box);
          if (!hBox.hidden) dlgFoot.append(hBox);
          box.classList.add('is-expanded');
          expandBtn.hidden = true;
          updatePrice();
          document.documentElement.classList.add('desk-3d-lock');
          dlg.showModal();
          view.setInteractive(true);
          view.reset();
        };
        const closeLarge = () => {
          box.classList.remove('is-expanded');
          view.setInteractive(false);
          const ex = toggles.querySelector('[data-explode]');
          if (ex.getAttribute('aria-pressed') === 'true') { ex.setAttribute('aria-pressed', 'false'); ex.textContent = 'פירוק לחלקים'; view.setExplode(false); }
          placeholder.replaceWith(box);
          box.after(hBox);
          expandBtn.hidden = false;
          document.documentElement.classList.remove('desk-3d-lock');
          view.reset();
          requestAnimationFrame(() => expandBtn.focus({ preventScroll: true })); // after the dialog restores focus
        };
        expandBtn.addEventListener('click', openLarge);
        // Small preview: a tap/click opens the large view (a drag or scroll does not)
        view.setInteractive(false);
        box.classList.add('is-tappable');
        const tapHint = document.createElement('span');
        tapHint.className = 'desk-3d-taphint';
        tapHint.setAttribute('aria-hidden', 'true');
        tapHint.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M21 3v6h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>לחצו לסיבוב ולהגדלה';
        box.append(tapHint);
        const canvasEl = box.querySelector('canvas');
        let down = null;
        canvasEl.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
        canvasEl.addEventListener('pointerup', (e) => {
          if (!down || dlg.open) { down = null; return; }
          const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
          if (moved < 8 && performance.now() - down.t < 600) openLarge();
          down = null;
        });
        canvasEl.addEventListener('pointercancel', () => { down = null; }); // the page scrolled instead
        dlg.addEventListener('close', closeLarge);                       // Esc, the ✕ button, or a click outside
        dlg.querySelector('.desk-3d-close').addEventListener('click', () => dlg.close());
        dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
        // The height slider can appear/disappear while open (when the height type changes on the page)
        document.addEventListener('rc:desk', () => {
          if (!dlg.open) return;
          if (!hBox.hidden && hBox.parentElement !== dlgFoot) dlgFoot.append(hBox);
        });
      } catch (err) {
        console.warn('3D preview unavailable, keeping the 2D drawing.', err);
        box.remove();
        preview.classList.remove('has-3d'); // back to the 2D drawing
      }
    }, { rootMargin: '200px' });
    io.observe(box);
  };

  page.querySelectorAll('.desk-preview').forEach(setup);
})();
