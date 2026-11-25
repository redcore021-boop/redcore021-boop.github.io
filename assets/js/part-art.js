// RedCore — part images for the configurators: a real photo if set in components.js (image: "assets/img/parts/<file>"),
// otherwise generated "box art" for CPUs/GPUs (our own illustration in each family's colours — no official logos),
// otherwise a category illustration from assets/img/parts/cat-*.svg.
(() => {
  const ART = {
    cpu: (p) => (p.socket.startsWith('LGA') ? 'cpu-intel' : 'cpu-amd'),
    board: (p) => (p.form === 'ATX' ? 'board-atx' : 'board-matx'),
    gpu: (p) => (p.power >= 250 ? 'gpu-3fan' : 'gpu-2fan'),
    cooler: (p) => (p.type === 'aio' ? 'aio' : 'cooler'),
    case: (p) => (p.style === 'panoramic' ? 'case-panoramic' : p.forms.includes('ATX') ? 'case-tower' : 'case-compact'),
  };
  // Product "box art" for CPUs and GPUs (our own illustration in each family's colours — no official logos)
  const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const BOX_FONT = 'font-family="Arial, Helvetica, sans-serif"';
  const cpuBox = (p) => {
    let m;
    if ((m = p.name.match(/Core Ultra (\d) (\d+K)/))) {
      return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0A1B4D"/><stop offset="1" stop-color="#05102E"/></linearGradient></defs>
        <rect x="22" y="6" width="116" height="108" rx="8" fill="url(#g)"/>
        <g fill="#4FA3FF">${[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => `<rect x="${108 + c * 8}" y="${54 + r * 8}" width="3" height="3" opacity="${0.35 + ((r + c) % 3) * 0.25}"/>`).join('')).join('')}</g>
        <text x="34" y="44" ${BOX_FONT} font-size="21" font-weight="700" fill="#fff">CORE</text>
        <text x="34" y="62" ${BOX_FONT} font-size="11" letter-spacing="3" fill="#BFD8FF">ULTRA</text>
        <text x="34" y="100" ${BOX_FONT} font-size="40" font-weight="700" fill="#fff">${m[1]}</text>
        <text x="70" y="100" ${BOX_FONT} font-size="12" font-weight="700" fill="#4FA3FF">${m[2]}</text></svg>`);
    }
    if ((m = p.name.match(/Core (i\d)-(\w+)/))) {
      return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E7BE0"/><stop offset="1" stop-color="#0B4FB0"/></linearGradient></defs>
        <rect x="22" y="6" width="116" height="108" rx="8" fill="url(#g)"/>
        <text x="34" y="52" ${BOX_FONT} font-size="26" font-weight="700" fill="#fff">CORE</text>
        <rect x="34" y="66" width="44" height="34" rx="4" fill="#fff"/>
        <text x="56" y="91" ${BOX_FONT} font-size="22" font-weight="700" fill="#0B4FB0" text-anchor="middle">${m[1]}</text>
        <text x="86" y="90" ${BOX_FONT} font-size="12" font-weight="700" fill="#DDEBFF">${m[2]}</text></svg>`);
    }
    if ((m = p.name.match(/Ryzen (\d) (\w+)/))) {
      const x3d = /X3D/.test(m[2]);
      return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26282E"/><stop offset="1" stop-color="#0E0F12"/></linearGradient></defs>
        <rect x="22" y="6" width="116" height="108" rx="8" fill="url(#g)"/>
        <path d="M108 6h22a8 8 0 0 1 8 8v22z" fill="#F26522"/>
        <text x="34" y="44" ${BOX_FONT} font-size="19" font-weight="700" letter-spacing="2" fill="#fff">RYZEN</text>
        <text x="34" y="88" ${BOX_FONT} font-size="40" font-weight="700" fill="#F26522">${m[1]}</text>
        <text x="64" y="86" ${BOX_FONT} font-size="12" font-weight="700" fill="#fff">${m[2]}</text>
        ${x3d ? `<rect x="34" y="96" width="70" height="12" rx="2" fill="#F26522"/><text x="69" y="105" ${BOX_FONT} font-size="8" font-weight="700" fill="#111" text-anchor="middle">3D V-CACHE</text>` : ''}</svg>`);
    }
    return null;
  };
  const gpuBox = (p) => {
    const nv = p.name.match(/RTX (\d{4}(?: Ti)?) (\d+GB)/);
    const amd = p.name.match(/RX (\d{4}(?: XTX| XT)?) (\d+GB)/);
    if (!nv && !amd) return null;
    const [accent, line, model, mem] = nv ? ['#76B900', 'GeForce RTX', nv[1], nv[2]] : ['#E8262F', 'Radeon RX', amd[1], amd[2]];
    const fans = p.power >= 250 ? [44, 80, 116] : [56, 104];
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3E48"/><stop offset="1" stop-color="#1C1F26"/></linearGradient></defs>
      <rect x="8" y="16" width="144" height="62" rx="8" fill="url(#g)"/>
      ${fans.map((cx) => `<circle cx="${cx}" cy="47" r="${fans.length === 3 ? 16 : 20}" fill="#121418" stroke="#5B6070" stroke-width="2"/><circle cx="${cx}" cy="47" r="4" fill="${accent}"/>`).join('')}
      <rect x="8" y="16" width="144" height="4" rx="2" fill="${accent}"/>
      <rect x="40" y="78" width="80" height="5" fill="#D9B44A"/>
      <text x="80" y="99" ${BOX_FONT} font-size="10" font-weight="700" fill="${accent}" text-anchor="middle" letter-spacing="1">${line}</text>
      <text x="80" y="115" ${BOX_FONT} font-size="14" font-weight="700" fill="#1C1F26" text-anchor="middle">${model} · ${mem}</text></svg>`);
  };
  const BOX = { cpu: cpuBox, gpu: gpuBox };
  const imgSrc = (key, p) => p.image || (BOX[key] && BOX[key](p)) || `assets/img/parts/cat-${ART[key] ? ART[key](p) : key}.svg`;

  window.RCPartArt = { imgSrc };
})();
