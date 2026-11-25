// RedCore — accessibility menu (תפריט נגישות).
// Self-contained: injects its own button + panel, so any page only needs <script src="assets/js/a11y.js" defer>.
// Settings persist per visitor in localStorage (falls back gracefully when storage is blocked).
(() => {
  const KEY = 'rc-a11y';
  const FONT_STEPS = [100, 112, 125, 140, 160];
  const TOGGLES = [
    { id: 'contrast', label: 'ניגודיות גבוהה', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>' },
    { id: 'grayscale', label: 'גווני אפור', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M8 9.5v5M16 9.5v5"/>' },
    { id: 'links', label: 'הדגשת קישורים', icon: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
    { id: 'readable', label: 'גופן קריא', icon: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>' },
    { id: 'motion', label: 'עצירת אנימציות', icon: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>' },
    { id: 'cursor', label: 'סמן גדול', icon: '<path d="M4 3l7 17 2.5-7.5L21 10z"/>' },
  ];

  // font is a step index (0..4); an older save could hold a percent (100..160), convert it.
  const normalize = (raw) => {
    const s = raw && typeof raw === 'object' ? raw : {};
    let font = Number(s.font) || 0;
    if (font >= 100) font = Math.max(0, FONT_STEPS.findIndex((p) => p >= font));
    font = Math.min(FONT_STEPS.length - 1, Math.max(0, Math.round(font)));
    const out = { font };
    TOGGLES.forEach(({ id }) => { if (s[id]) out[id] = true; });
    return out;
  };
  const load = () => { try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return { font: 0 }; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked: settings last for this page view */ } };
  let state = load();

  const root = document.documentElement;
  const apply = () => {
    root.style.fontSize = state.font ? `${FONT_STEPS[state.font]}%` : '';
    TOGGLES.forEach(({ id }) => root.classList.toggle(`a11y-${id}`, !!state[id]));
    if (panel) {
      panel.querySelectorAll('[data-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(!!state[b.dataset.toggle])));
      panel.querySelector('[data-font-label]').textContent = `${FONT_STEPS[state.font]}%`;
      panel.querySelector('[data-font="-1"]').disabled = state.font === 0;
      panel.querySelector('[data-font="1"]').disabled = state.font === FONT_STEPS.length - 1;
    }
  };

  // Apply saved settings before building UI (avoids a flash)
  let panel = null;
  apply();

  const svg = (paths, cls = 'w-5 h-5') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICON_A11Y = '<circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none"/><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M9 21l3-6.5 3 6.5"/>';

  const build = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'a11y-fab';
    btn.id = 'a11yOpen';
    btn.setAttribute('aria-label', 'תפריט נגישות');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'a11yPanel');
    btn.innerHTML = svg(ICON_A11Y, 'w-7 h-7');

    panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.id = 'a11yPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'a11yTitle');
    panel.hidden = true;
    panel.innerHTML = `
      <div class="a11y-head">
        <h2 id="a11yTitle">${svg(ICON_A11Y)} תפריט נגישות</h2>
        <button type="button" class="a11y-close" data-close aria-label="סגירת תפריט הנגישות">${svg('<path d="M18 6 6 18M6 6l12 12"/>')}</button>
      </div>
      <div class="a11y-body">
        <div class="a11y-font" role="group" aria-label="גודל טקסט">
          <span class="a11y-font-title">גודל טקסט</span>
          <div class="a11y-font-ctrl">
            <button type="button" data-font="-1" aria-label="הקטנת טקסט">א−</button>
            <span data-font-label aria-live="polite">100%</span>
            <button type="button" data-font="1" aria-label="הגדלת טקסט">א+</button>
          </div>
        </div>
        <div class="a11y-grid">
          ${TOGGLES.map((t) => `<button type="button" class="a11y-opt" data-toggle="${t.id}" aria-pressed="false">${svg(t.icon, 'w-6 h-6')}<span>${t.label}</span></button>`).join('')}
        </div>
        <button type="button" class="a11y-reset" data-reset>${svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')} איפוס הגדרות</button>
        <a class="a11y-statement" href="accessibility.html">להצהרת הנגישות</a>
      </div>`;

    document.body.append(btn, panel);

    const open = () => {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      panel.querySelector('[data-close]').focus();
    };
    const close = () => {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    };
    btn.addEventListener('click', () => (panel.hidden ? open() : close()));
    panel.querySelector('[data-close]').addEventListener('click', close);
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });

    panel.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.toggle) state[t.dataset.toggle] = !state[t.dataset.toggle];
      else if (t.dataset.font) state.font = Math.min(FONT_STEPS.length - 1, Math.max(0, state.font + Number(t.dataset.font)));
      else if (t.hasAttribute('data-reset')) state = { font: 0 };
      else return;
      save(state);
      apply();
    });

    apply();
  };

  // Settings changed in another page of the site (or the frame around this one): follow them.
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); apply(); } });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
