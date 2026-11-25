// RedCore — live SVG preview of a desk (top view + front view, with dimension lines).
// Usage: RCDeskPreview.render(topEl, frontEl, state, { pc: false, lighting: 'none' })
// state = { width, depth, arm, height, shape, material, top, legs, extras: [] }  (cm / ids from desk-config.js)
(() => {
  const CFG = window.RC_DESK;
  const color = (list, id, fallback) => (list.find((c) => c[0] === id) || [])[2] || fallback;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cmLabel = (n) => `${n} ס״מ`;
  // Unique pattern/gradient ids per SVG, so several previews on one page do not share fills
  let uidSeq = 0;
  const scope = (svg) => { const u = ++uidSeq; return svg.replace(/(id="|url\(#)dp(Carbon|Wood|Glass|Rgb|Glow)/g, `$1dp$2${u}`); };

  // Dimension line with end ticks and a centered label
  const dim = (x1, y1, x2, y2, label, side = 'above') => {
    const horizontal = Math.abs(y1 - y2) < 0.5;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const t = 5;
    const ticks = horizontal
      ? `M${x1} ${y1 - t}V${y1 + t}M${x2} ${y2 - t}V${y2 + t}`
      : `M${x1 - t} ${y1}H${x1 + t}M${x2 - t} ${y2}H${x2 + t}`;
    if (horizontal) {
      const ly = my + (side === 'above' ? -7 : 15);
      return `<g class="dp-dim"><path d="M${x1} ${y1}L${x2} ${y2}${ticks}"/><text x="${mx}" y="${ly}" text-anchor="middle">${esc(label)}</text></g>`;
    }
    // Vertical: label rotated along the line (drafting style), so it never runs off the frame
    const lx = mx + (side === 'left' ? -7 : 15);
    return `<g class="dp-dim"><path d="M${x1} ${y1}L${x2} ${y2}${ticks}"/><text x="${lx}" y="${my}" text-anchor="middle" transform="rotate(-90 ${lx} ${my})">${esc(label)}</text></g>`;
  };

  const defs = (state, topFill) => `<defs>
      <pattern id="dpCarbon" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="${topFill}"/><rect width="4" height="4" fill="#ffffff" opacity=".06"/><rect x="4" y="4" width="4" height="4" fill="#000" opacity=".18"/>
      </pattern>
      <pattern id="dpWood" width="60" height="14" patternUnits="userSpaceOnUse">
        <rect width="60" height="14" fill="${topFill}"/>
        <path d="M0 4C15 2 30 6 60 3M0 10C20 12 40 8 60 11" stroke="#000" stroke-opacity=".12" fill="none"/>
      </pattern>
      <linearGradient id="dpGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="${topFill}" stop-opacity=".35"/><stop offset="1" stop-color="${topFill}" stop-opacity=".6"/>
      </linearGradient>
      <linearGradient id="dpRgb" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#E5132B"/><stop offset=".35" stop-color="#B14CFF"/><stop offset=".7" stop-color="#2FB8FF"/><stop offset="1" stop-color="#E5132B"/>
      </linearGradient>
      <filter id="dpGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>`;

  const topPaint = (state, fill) => (state.material === 'carbon' ? 'url(#dpCarbon)' : state.material === 'wood' ? 'url(#dpWood)' : state.material === 'glass' ? 'url(#dpGlass)' : fill);

  // ---------- Top view ----------
  const topView = (state, opts) => {
    const VW = 420; const VH = 280; const pad = 56;
    const shape = state.shape;
    const W = state.width; const D = state.depth;
    const A = shape === 'corner' ? Math.max(state.arm, D) : D;
    const totalD = Math.max(D, A);
    const s = Math.min((VW - pad * 2) / W, (VH - pad * 2) / totalD);
    const ox = (VW - W * s) / 2; const oy = (VH - totalD * s) / 2;
    const fill = color((CFG.materials.find((m) => m.id === state.material) || CFG.materials[0]).colors, state.top, '#1C1F26');
    const paint = topPaint(state, fill);
    const ex = new Set(state.extras || []);
    const x = (cm) => ox + cm * s; const y = (cm) => oy + cm * s;

    // Desk outline path (front = bottom of the drawing)
    let path;
    if (shape === 'corner') {
      // Main top along the back, return arm on the left going toward the viewer
      path = `M${x(0)} ${y(0)}H${x(W)}V${y(D)}H${x(D)}V${y(A)}H${x(0)}Z`;
    } else if (shape === 'curve') {
      const cw = W * 0.42; const cd = Math.min(12, D * 0.18); const c0 = (W - cw) / 2;
      path = `M${x(0)} ${y(0)}H${x(W)}V${y(D)}H${x(c0 + cw)}C${x(c0 + cw)} ${y(D - cd)} ${x(c0)} ${y(D - cd)} ${x(c0)} ${y(D)}H${x(0)}Z`;
    } else {
      path = `M${x(0)} ${y(0)}H${x(W)}V${y(D)}H${x(0)}Z`;
    }

    const parts = [];
    if (ex.has('rgb') || (opts.pc && opts.lighting !== 'none')) parts.push(`<path d="${path}" fill="none" stroke="url(#dpRgb)" stroke-width="7" filter="url(#dpGlow)" opacity=".9"/>`);
    parts.push(`<path d="${path}" fill="${paint}" stroke="#0F1115" stroke-opacity=".35" stroke-width="1.5" stroke-linejoin="round"/>`);
    if (state.material === 'glass') parts.push(`<path d="${path}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1"/>`);

    // Built-in PC: glass window over the hardware compartment (right side of the main top)
    if (opts.pc) {
      const cw = Math.min(62, W * 0.42); const cd = D - 16; const cx = W - cw - 6; const cy = 6;
      const glow = opts.lighting === 'none' ? '#5B6070' : opts.lighting === 'argb-fans' ? '#B14CFF' : '#2FB8FF';
      parts.push(`<g class="dp-pc">
        <rect x="${x(cx)}" y="${y(cy)}" width="${cw * s}" height="${cd * s}" rx="4" fill="#0B0D11"/>
        <rect x="${x(cx + 4)}" y="${y(cy + 4)}" width="${cw * 0.45 * s}" height="${(cd - 8) * s}" rx="2" fill="#20242C" stroke="#3A3E48"/>
        <rect x="${x(cx + 6)}" y="${y(cy + cd * 0.55)}" width="${(cw - 12) * s}" height="${8 * s}" rx="2" fill="#2A2E38" stroke="${glow}" stroke-opacity=".9"/>
        ${[0, 1, 2].map((i) => `<circle cx="${x(cx + cw - 9)}" cy="${y(cy + 9 + i * ((cd - 18) / 2))}" r="${5.5 * s}" fill="none" stroke="${glow}" stroke-width="2"/>`).join('')}
        <rect x="${x(cx + cw * 0.18)}" y="${y(cy + 8)}" width="${8 * s}" height="${8 * s}" rx="1.5" fill="#8E929C"/>
        <rect x="${x(cx)}" y="${y(cy)}" width="${cw * s}" height="${cd * s}" rx="4" fill="url(#dpGlass)" stroke="#CFE6EE" stroke-opacity=".8"/>
        <rect x="${x(cx)}" y="${y(cy)}" width="${cw * s}" height="${cd * s}" rx="4" fill="${glow}" opacity=".12"/>
      </g>`);
    }

    if (ex.has('mat')) {
      const mx = shape === 'corner' ? D + 3 : 3;
      const mw = opts.pc ? W - mx - Math.min(62, W * 0.42) - 12 : W - mx - 3;
      parts.push(`<rect x="${x(mx)}" y="${y(D * 0.35)}" width="${Math.max(10, mw) * s}" height="${D * 0.58 * s}" rx="6" fill="#111318" opacity=".88"/>`);
    }
    if (ex.has('shelf')) {
      const sw = Math.min(W * 0.55, 110); const sx = (W - sw) / 2 - (opts.pc ? W * 0.12 : 0);
      parts.push(`<rect x="${x(sx)}" y="${y(2)}" width="${sw * s}" height="${20 * s}" rx="3" fill="${fill}" stroke="#0F1115" stroke-opacity=".45" stroke-width="1.5"/>
        <rect x="${x(sx + sw * 0.15)}" y="${y(6)}" width="${sw * 0.7 * s}" height="${4 * s}" rx="1" fill="#111318" opacity=".7"/>`);
    }
    if (ex.has('charger')) parts.push(`<g><circle cx="${x(W - 14 - (opts.pc ? Math.min(62, W * 0.42) : 0))}" cy="${y(D - 13)}" r="${6 * s}" fill="#111318" stroke="#2FB8FF" stroke-width="2"/><path d="M${x(W - 15 - (opts.pc ? Math.min(62, W * 0.42) : 0))} ${y(D - 16)}l-${2 * s} ${3 * s}h${3 * s}l-${2 * s} ${3 * s}" stroke="#2FB8FF" fill="none" stroke-width="1.6"/></g>`);
    if (ex.has('cables')) parts.push(`<path d="M${x(4)} ${y(3)}H${x(W - 4)}" stroke="#E5132B" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>`);

    // Dimensions
    const dims = [
      dim(x(0), oy - 18, x(W), oy - 18, cmLabel(W)),
      dim(x(W) + 18, y(0), x(W) + 18, y(D), cmLabel(D), 'right'),
    ];
    if (shape === 'corner') dims.push(dim(x(0) - 18, y(0), x(0) - 18, y(A), cmLabel(A), 'left'));

    return `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="מבט על: ${W} על ${D} ס״מ">${defs(state, fill)}${parts.join('')}${dims.join('')}<text class="dp-view" x="${VW - 10}" y="${VH - 8}" text-anchor="start">מבט מלמעלה</text></svg>`;
  };

  // ---------- Front view ----------
  const frontView = (state, opts) => {
    const VW = 420; const VH = 230; const pad = 40;
    const W = state.width;
    const h = CFG.height.find((o) => o.id === state.height) || CFG.height[0];
    const H = h.cm || 75;
    const Hmax = h.range ? h.range[1] : H;
    const s = Math.min((VW - pad * 2) / W, (VH - 80) / Hmax);
    const ox = (VW - W * s) / 2; const floor = VH - 36; const topY = floor - H * s;
    const fill = color((CFG.materials.find((m) => m.id === state.material) || CFG.materials[0]).colors, state.top, '#1C1F26');
    const legC = color(CFG.legColors, state.legs, '#15171C');
    const ex = new Set(state.extras || []);
    const thick = Math.max(4, (state.material === 'glass' ? 1.2 : 3) * s * 1.6);
    const out = [];

    // Floor
    out.push(`<path d="M${ox - 30} ${floor}H${ox + W * s + 30}" stroke="#C9CCD4" stroke-width="2"/>`);
    // Legs
    const legX = [ox + 6 * s, ox + W * s - 6 * s - 6];
    if (state.height === 'electric') {
      legX.forEach((lx) => out.push(`<rect x="${lx - 2}" y="${topY + thick}" width="10" height="${floor - topY - thick - 4}" rx="2" fill="${legC}"/><rect x="${lx - 2}" y="${(topY + floor) / 2}" width="10" height="${(floor - topY) / 2 - 4}" rx="2" fill="${legC}" opacity=".85"/><rect x="${lx - 14}" y="${floor - 5}" width="34" height="5" rx="2" fill="${legC}"/>`));
      out.push(`<rect x="${ox + W * s - 34}" y="${topY + thick}" width="20" height="7" rx="2" fill="#111318"/><circle cx="${ox + W * s - 29}" cy="${topY + thick + 3.5}" r="1.4" fill="#2FB8FF"/>`);
    } else if (state.height === 'manual') {
      legX.forEach((lx) => out.push(`<rect x="${lx}" y="${topY + thick}" width="7" height="${floor - topY - thick - 4}" rx="1.5" fill="${legC}"/><circle cx="${lx + 3.5}" cy="${topY + (floor - topY) * 0.55}" r="4" fill="#111318" stroke="${legC}"/><rect x="${lx - 12}" y="${floor - 5}" width="31" height="5" rx="2" fill="${legC}"/>`));
    } else {
      legX.forEach((lx) => out.push(`<path d="M${lx} ${topY + thick}h7l12 ${floor - topY - thick}h-7z" fill="${legC}"/><path d="M${lx + 7} ${topY + thick}l-12 ${floor - topY - thick}h7l12 -${floor - topY - thick}z" fill="${legC}" opacity=".85"/>`));
    }
    // Built-in PC compartment under the top (right side)
    if (opts.pc) {
      const cw = Math.min(62, W * 0.42) * s; const cx = ox + W * s - cw - 10 * s;
      const glow = opts.lighting === 'none' ? '#5B6070' : opts.lighting === 'argb-fans' ? '#B14CFF' : '#2FB8FF';
      out.push(`<rect x="${cx}" y="${topY + thick}" width="${cw}" height="${18 * s}" rx="3" fill="#15171C"/><path d="M${cx + 6} ${topY + thick + 18 * s - 4}H${cx + cw - 6}" stroke="${glow}" stroke-width="2.5" filter="url(#dpGlow)"/><path d="M${cx + 6} ${topY + thick + 18 * s - 4}H${cx + cw - 6}" stroke="${glow}" stroke-width="1.5"/>`);
    }
    if (ex.has('drawer')) {
      const dw = Math.min(60, W * 0.3) * s; const dx = ox + (W * s - dw) / 2 - (opts.pc ? 12 * s : 0);
      out.push(`<rect x="${dx}" y="${topY + thick}" width="${dw}" height="${8 * s}" rx="2" fill="${fill}" stroke="#0F1115" stroke-opacity=".4"/><rect x="${dx + dw / 2 - 8}" y="${topY + thick + 4 * s - 1.5}" width="16" height="3" rx="1.5" fill="#8E929C"/>`);
    }
    // RGB glow under the top
    if (ex.has('rgb')) out.push(`<path d="M${ox + 8} ${topY + thick + 2}H${ox + W * s - 8}" stroke="url(#dpRgb)" stroke-width="5" filter="url(#dpGlow)"/><path d="M${ox + 8} ${topY + thick + 1}H${ox + W * s - 8}" stroke="url(#dpRgb)" stroke-width="2"/>`);
    // Top slab
    out.push(`<rect x="${ox}" y="${topY}" width="${W * s}" height="${thick}" rx="2" fill="${topPaint(state, fill)}" stroke="#0F1115" stroke-opacity=".35"/>`);
    if (ex.has('shelf')) {
      const sw = Math.min(W * 0.55, 110) * s; const sx = ox + (W * s - sw) / 2 - (opts.pc ? W * 0.12 * s : 0);
      out.push(`<rect x="${sx}" y="${topY - 11 * s}" width="${sw}" height="${3}" rx="1" fill="${fill}" stroke="#0F1115" stroke-opacity=".45"/><rect x="${sx + 4}" y="${topY - 11 * s}" width="4" height="${11 * s}" fill="${legC}"/><rect x="${sx + sw - 8}" y="${topY - 11 * s}" width="4" height="${11 * s}" fill="${legC}"/>`);
    }

    const hLabel = h.range ? `${h.range[0]} עד ${h.range[1]} ס״מ` : cmLabel(H);
    const dims = [
      dim(ox, floor + 14, ox + W * s, floor + 14, cmLabel(W), 'below'),
      dim(ox - 16, topY, ox - 16, floor, hLabel, 'left'),
    ];
    return `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="מבט חזית: גובה ${esc(hLabel)}">${defs(state, fill)}${out.join('')}${dims.join('')}<text class="dp-view" x="${VW - 10}" y="16" text-anchor="start">מבט מלפנים</text></svg>`;
  };

  window.RCDeskPreview = {
    render(topEl, frontEl, state, opts = {}) {
      if (topEl) topEl.innerHTML = scope(topView(state, opts));
      if (frontEl) frontEl.innerHTML = scope(frontView(state, opts));
    },
    // Static thumbnail (top view only) for model cards
    thumb(state, opts = {}) { return scope(topView(state, opts)); },
  };
})();
