// RedCore — the builder's parts come from the server (what is edited in the admin, "רכיבים לבונה המחשבים").
// components.js stays as a fallback: if the server does not answer, the builder still works with it.
// The builder scripts wait for window.RC_LIVE before they start.
window.RC_LIVE = fetch('/api/public/parts', { credentials: 'same-origin' })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    if (!d || !d.RC_PARTS) return;
    ['RC_PARTS', 'RC_EXTRAS', 'RC_PRESETS', 'RC_STEPS'].forEach((k) => {
      if (d[k] && (Array.isArray(d[k]) ? d[k].length : Object.keys(d[k]).length)) window[k] = d[k];
    });
    if (typeof d.RC_ASSEMBLY_FEE === 'number') window.RC_ASSEMBLY_FEE = d.RC_ASSEMBLY_FEE;
  })
  .catch(() => { /* offline: keep components.js */ });
