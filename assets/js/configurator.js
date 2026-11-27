// RedCore — PC configurator with compatibility checks.
// Data lives in components.js. Every candidate part is checked against the parts already selected;
// incompatible parts are disabled with a specific reason, and parts invalidated by a later change are removed.
// A shared build: build?b=<code> (the "שיתוף ההרכבה" button makes it). The code is the build as the browser saves it
// (parts, fan kinds and places) plus the 3D lighting, as base64url JSON. Nothing personal is in it.
window.RCShareCode = {
  encode: (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (code) => {
    try {
      const b64 = String(code).replace(/-/g, '+').replace(/_/g, '/');
      const obj = JSON.parse(decodeURIComponent(escape(atob(b64 + '==='.slice((b64.length + 3) % 4)))));
      return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
    } catch { return null; }
  },
};
const RC_SHARED = (() => { const c = new URLSearchParams(location.search).get('b'); return c ? window.RCShareCode.decode(c) : null; })();
if (RC_SHARED && !new URLSearchParams(location.search).has('edit')) {
  // (the builder may be inside the site's frame: the whole window goes to the spec page)
  const to = `/shared-build?b=${encodeURIComponent(new URLSearchParams(location.search).get('b'))}`;
  try { (window.top || window).location.replace(to); } catch { location.replace(to); }
}
if (RC_SHARED) {
  try {
    if (/^#[0-9a-f]{6}$/i.test(RC_SHARED.rgb || '')) localStorage.setItem('rc-pc3d-rgb', RC_SHARED.rgb);
    if (/^[a-z]{3,12}$/.test(RC_SHARED.mode || '')) localStorage.setItem('rc-pc3d-mode', RC_SHARED.mode);
  } catch { /* storage blocked: the 3D keeps its default lighting */ }
}

// waits for the live parts from the server (parts-live.js), then starts
(window.RC_LIVE || Promise.resolve()).then(() => {
  const root = document.getElementById('configurator');
  if (!root) return;

  const PARTS = window.RC_PARTS;
  const STEPS = window.RC_STEPS;
  const PRESETS = window.RC_PRESETS;
  const FEE = window.RC_ASSEMBLY_FEE || 0;
  const shekel = (n) => `₪${n.toLocaleString('he-IL')}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (cat, id) => PARTS[cat].find((p) => p.id === id);

  const sel = {}; // category -> part

  // ---------- Compatibility ----------
  const ceil50 = (n) => Math.ceil(n / 50) * 50;
  const requiredPsu = (s) => {
    if (!s.cpu && !s.gpu) return 0;
    const draw = (s.cpu?.power || 0) + (s.gpu?.power || 0) + 100; // + board, RAM, drives, fans
    return Math.max(s.gpu?.minPsu || 0, ceil50(draw));
  };

  // What a case takes, by position (its data's `mounts`, from the spec sheets): where an AIO's radiator goes (the first
  // position that takes its size, top first, as builders do; the 3D mounts it there too), and how many more fans of a
  // size fit, after the fans the case comes with and the radiator (its own fans sit on it, so that position is taken).
  const MOUNT_ORDER = ['top', 'front', 'side', 'bottom', 'rear'];
  const aioMount = (pcCase, size) => (pcCase && pcCase.mounts ? MOUNT_ORDER.find((k) => (pcCase.mounts[k]?.rad || []).includes(size)) || null : null);
  const freeFanSlots = (pcCase, size, cooler) => {
    if (!pcCase || !pcCase.mounts) return Infinity; // (a case without the data: no limit known)
    const radAt = cooler && cooler.type === 'aio' ? aioMount(pcCase, cooler.radiator) : null;
    let free = 0;
    for (const [pos, mt] of Object.entries(pcCase.mounts)) {
      const slots = (mt.fans || {})[size] || 0;
      if (!slots || pos === radAt) continue;
      // the share of this position the case's own fans already take (a position holds fans of one size at a time)
      const used = (pcCase.fansIncluded || []).filter((f) => f.pos === pos).reduce((s, f) => s + f.count / ((mt.fans || {})[f.size] || f.count), 0);
      free += Math.max(0, Math.floor(slots * (1 - used) + 1e-9));
    }
    return free;
  };

  // Returns { block: string|null, warn: string[] } for placing `part` in `cat`, given the other selections `s`
  const check = (cat, part, s) => {
    const o = { ...s, [cat]: part };
    const errs = [];
    const warn = [];
    const { cpu, board, ram, gpu, storage, cooler, case: pcCase, psu } = o;

    if (cpu && board && cpu.socket !== board.socket) errs.push(cat === 'cpu' ? `שקע ${cpu.socket}, ולוח האם שבחרתם הוא ${board.socket}` : `שקע ${board.socket}, והמעבד שבחרתם דורש ${cpu.socket}`);
    if (board && ram && board.memory !== ram.type) errs.push(cat === 'ram' ? `${ram.type}, ולוח האם תומך רק ב-${board.memory}` : `תומך ב-${board.memory}, והזיכרון שבחרתם הוא ${ram.type}`);
    else if (!board && cpu && ram && !cpu.memory.includes(ram.type)) errs.push(cat === 'ram' ? `${ram.type}, והמעבד תומך רק ב-${cpu.memory.join('/')}` : `תומך רק ב-${cpu.memory.join('/')}, והזיכרון שבחרתם הוא ${ram.type}`);
    if (board && pcCase && !pcCase.forms.includes(board.form)) errs.push(cat === 'case' ? `לא מתאים ללוח בגודל ${board.form}` : `לוח ${board.form} לא נכנס למארז שבחרתם`);
    if (gpu && pcCase && gpu.length > pcCase.gpuMax) errs.push(cat === 'case' ? `מקבל כרטיס עד ${pcCase.gpuMax}mm, והכרטיס שבחרתם כ-${gpu.length}mm` : `כ-${gpu.length}mm, והמארז מקבל עד ${pcCase.gpuMax}mm`);
    if (cpu && cooler) {
      if (!cooler.sockets.includes(cpu.socket)) errs.push(`לא תומך בשקע ${cpu.socket}`);
      else if (cooler.rating < cpu.power) errs.push(cat === 'cpu' ? `הקירור שבחרתם חלש מדי למעבד הזה (${cpu.power}W)` : `חלש מדי למעבד שבחרתם (${cpu.power}W)`);
    }
    if (cooler && pcCase) {
      if (cooler.type === 'air' && cooler.height > pcCase.coolerMax) errs.push(cat === 'case' ? `מקבל קירור אוויר עד ${pcCase.coolerMax}mm` : `גובה ${cooler.height}mm, והמארז מקבל עד ${pcCase.coolerMax}mm`);
      if (cooler.type === 'aio' && !pcCase.radiators.includes(cooler.radiator)) errs.push(cat === 'case' ? `אין מקום לרדיאטור ${cooler.radiator}mm` : `אין מקום לרדיאטור ${cooler.radiator}mm במארז שבחרתם`);
    }
    if (psu) {
      const need = requiredPsu(o);
      if (need && psu.watts < need) errs.push(cat === 'psu' ? `נדרש לפחות ${need}W למעבד ולכרטיס שבחרתם` : `ספק הכוח שבחרתם (${psu.watts}W) חלש מדי. נדרש לפחות ${need}W`);
    }

    // Non-blocking notes — only on the rows they are about (the BIOS note belongs to the CPU and the board, not to the SSD)
    const about = (...cats) => cats.includes(cat);
    if (about('storage', 'board') && storage && board && storage.gen === 5 && !board.gen5) warn.push('בלוח האם הזה הכונן יעבוד במהירות Gen4');
    if (about('cpu', 'board') && cpu && board && /^r[579]-9/.test(cpu.id) && /b650/.test(board.id)) warn.push('דורש עדכון BIOS. אנחנו מבצעים אותו בהרכבה');
    if (about('cpu', 'board') && cpu && board && /k$/.test(cpu.id) && /b760/.test(board.id)) warn.push('לוח B760 לא מאפשר האצת מעבד (Overclock)');

    return { block: errs[0] || null, warn };
  };

  const otherSelections = (cat) => Object.fromEntries(Object.entries(sel).filter(([k]) => k !== cat));
  // Only earlier steps constrain a step, so changing e.g. the CPU is always possible;
  // later parts that no longer fit are removed by prune() with a notice.
  const order = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));
  const upstream = (cat) => Object.fromEntries(Object.entries(sel).filter(([k]) => order[k] < order[cat]));

  // After a change, drop selections that became incompatible (repeat until stable)
  let removedKeys = []; // categories prune() dropped since the last render (the 3D shows them in red on the way out)
  const prune = () => {
    const removed = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const { key, label } of STEPS) {
        if (!sel[key]) continue;
        const r = check(key, sel[key], upstream(key));
        if (r.block) { removed.push(`${label}: ${sel[key].name}`); removedKeys.push(key); delete sel[key]; changed = true; }
      }
    }
    // the extra fans: each kind fits into what the case takes now (another case, or a radiator now taking a place);
    // what no longer fits moves to a free position, or comes out
    fitFans(sel).forEach((m) => removed.push(m));
    return removed;
  };

  // ---------- Optional accessories ----------
  const EXTRAS = window.RC_EXTRAS || [];
  const ALL = [...STEPS, ...EXTRAS];
  const meta = (key) => ALL.find((s) => s.key === key);
  const isExtra = (key) => EXTRAS.some((s) => s.key === key);
  const extraNotes = (key, part) => {
    const n = [];
    if (key === 'wifi' && sel.board?.wifi) n.push('ללוח האם שבחרתם כבר יש WiFi מובנה');
    if (key === 'monitor' && sel.gpu) {
      if (/4K/.test(part.name) && sel.gpu.price < 3000) n.push('לכרטיס המסך שבחרתם עדיף מסך 1440p');
    }
    return n;
  };
  // ---------- Extra fans: which kinds, how many, and where ----------
  // The customer adds one kind of fan or several (e.g. a set of 3 ARGB fans, and two single fans of another make), and
  // places each fan in a position the case has (front, top, floor, side, rear). A position takes no more than the case's
  // spec sheet allows there (less the fans the case comes with, and the room the other kinds take there; none where the
  // radiator is), and no more than the 3D measures really fits there beside the chosen parts (it reports that for one
  // exact build: roomKey). A fan sold on its own is added one at a time; a pack (part.count fans, e.g. 3) comes whole:
  // it's added and taken out as a pack, and all its fans go in the case; + in a position moves one of its fans there.
  const FAN_POS = ['front', 'top', 'bottom', 'side', 'rear'];
  const FAN_POS_LABEL = { front: 'חזית', top: 'גג', bottom: 'רצפה', side: 'צד', rear: 'אחורי' };
  const NO_CASE_CAPS = { front: 3, top: 3, rear: 1 }; // (no case chosen yet: a common mid tower)
  let fanLines = []; // [{ part, packs, plan: { position: how many placed } }]; sel.fans is the first kind
  const syncFans = () => { if (fanLines.length) sel.fans = fanLines[0].part; else delete sel.fans; };
  const clearFans = () => { fanLines = []; delete sel.fans; };
  const roomKey = (s) => ['case', 'board', 'cooler', 'gpu'].map((k) => (s[k] ? s[k].id : '')).join('|') + '|' + fanLines.map((l) => l.part.id).join(',');
  let fanRoom = null; // { fan id: { position: how many fit } } from the 3D
  let fanRoomKey = '';
  const per = (L) => L.part.count || 1;
  const isPackL = (L) => per(L) > 1;
  const totalL = (L) => FAN_POS.reduce((n, q) => n + (L.plan[q] || 0), 0);
  const neededL = (L) => (isPackL(L) ? L.packs * per(L) : totalL(L)); // fans bought
  const packsL = (L) => (isPackL(L) ? L.packs : Math.max(1, totalL(L))); // what's bought (packs or fans)
  const unplacedL = (L) => Math.max(0, neededL(L) - totalL(L)); // a pack's fans not placed yet
  const fanCount = () => fanLines.reduce((n, L) => n + neededL(L), 0);
  /** What the case's spec sheet leaves free at each position for fans of this size (less the fans it comes with). */
  const dataCaps = (part, s) => {
    const caps = {};
    if (!part) return caps;
    const c = s.case;
    if (!c || !c.mounts) return { ...NO_CASE_CAPS };
    const radAt = s.cooler && s.cooler.type === 'aio' ? aioMount(c, s.cooler.radiator) : null;
    FAN_POS.forEach((q) => {
      const mt = c.mounts[q]; const slots = mt && mt.fans ? mt.fans[part.size] || 0 : 0;
      if (!slots || q === radAt) return;
      const used = (c.fansIncluded || []).filter((f) => f.pos === q).reduce((n, f) => n + f.count / (mt.fans[f.size] || f.count), 0);
      const free = Math.max(0, Math.floor(slots * (1 - used) + 1e-9));
      if (free) caps[q] = free;
    });
    return caps;
  };
  /**
   * How many fans of this kind each position takes: what the spec sheet leaves (in the share of the position the other
   * kinds don't take: a position holds fans of one size at a time), and what the 3D measured fits there.
   */
  const capsFor = (L, s) => {
    const base = dataCaps(L.part, s);
    const room = fanRoom && fanRoomKey === roomKey(s) ? fanRoom[L.part.id] : null;
    const others = fanLines.filter((M) => M !== L);
    const caps = {};
    Object.keys(base).forEach((q) => {
      const share = others.reduce((n, M) => { const m = M.plan[q] || 0; if (!m) return n; const mc = dataCaps(M.part, s)[q] || m; return n + m / mc; }, 0);
      let free = Math.max(0, Math.floor(base[q] * (1 - share) + 1e-9));
      if (room) free = Math.min(free, Math.max(0, (room[q] || 0) - others.filter((M) => M.part.size === L.part.size).reduce((n, M) => n + (M.plan[q] || 0), 0)));
      if (free) caps[q] = free;
    });
    return caps;
  };
  const maxFor = (L, s) => Object.values(capsFor(L, s)).reduce((a, b) => a + b, 0);
  /** Take fans out from the end (the last positions first) until no more than n are placed. */
  const trimL = (L, n) => {
    [...FAN_POS].reverse().forEach((q) => { while (totalL(L) > n && L.plan[q]) { L.plan[q] -= 1; if (!L.plan[q]) delete L.plan[q]; } });
  };
  /** Add n fans where there's room, in order (front first). */
  const addInOrder = (L, n, s) => {
    const caps = capsFor(L, s);
    FAN_POS.forEach((q) => { while (n && (L.plan[q] || 0) < (caps[q] || 0)) { L.plan[q] = (L.plan[q] || 0) + 1; n -= 1; } });
  };
  /**
   * Fit every kind into what the case takes now: fans over a position's limit move to a free one (in order); packs that
   * no longer fit whole come out (fewer fans, for single ones); a kind with no room comes out. Returns notes for the
   * visitor.
   */
  const fitFans = (s) => {
    const notes = [];
    fanLines.forEach((L) => {
      const caps = capsFor(L, s);
      let over = 0;
      FAN_POS.forEach((q) => { const v = Math.min(L.plan[q] || 0, caps[q] || 0); over += (L.plan[q] || 0) - v; if (v) L.plan[q] = v; else delete L.plan[q]; });
      if (isPackL(L)) {
        const before = L.packs;
        L.packs = Math.min(L.packs, Math.floor(maxFor(L, s) / per(L)));
        trimL(L, neededL(L));
        addInOrder(L, unplacedL(L), s);
        if (L.packs >= 1 && L.packs < before) notes.push(`מאווררים נוספים: ${L.part.name} – נשארו ${L.packs} ${L.packs === 1 ? 'ערכה' : 'ערכות'} (אין מקום ליותר במארז)`);
      } else {
        const fix = capsFor(L, s);
        FAN_POS.forEach((q) => { while (over && (L.plan[q] || 0) < (fix[q] || 0)) { L.plan[q] = (L.plan[q] || 0) + 1; over -= 1; } });
        if (over && totalL(L)) notes.push(`מאווררים נוספים: ${L.part.name} – נשארו ${totalL(L)} (אין מקום ליותר במארז)`);
      }
    });
    const gone = fanLines.filter((L) => (isPackL(L) ? L.packs < 1 : !totalL(L)));
    if (gone.length) {
      gone.forEach((L) => notes.push(`מאווררים נוספים: ${L.part.name}`));
      fanLines = fanLines.filter((L) => !gone.includes(L));
      if (!fanLines.length) removedKeys.push('fans');
    }
    syncFans();
    return notes;
  };
  /** Where a pack's fan moves from, to go to `pos`: a fan waiting to be placed, else the position with the most fans. */
  const moveSource = (L, pos) => {
    if (unplacedL(L)) return 'free';
    let best = null;
    FAN_POS.forEach((x) => { if (x !== pos && L.plan[x] > 0 && (!best || L.plan[x] >= L.plan[best])) best = x; });
    return best;
  };
  /**
   * One fan more (+1) or less (-1) of kind i in a position (or, none given, the first with room / the last with fans). A
   * single fan is bought or dropped. A pack is never split: + in a position moves one of its fans there.
   */
  const changeFan = (i, pos, d) => {
    const L = fanLines[i];
    if (!L) return false;
    const caps = capsFor(L, sel);
    if (isPackL(L)) {
      if (d < 0 || !pos || (L.plan[pos] || 0) >= (caps[pos] || 0)) return false;
      const from = moveSource(L, pos);
      if (!from) return false;
      if (from !== 'free') { L.plan[from] -= 1; if (!L.plan[from]) delete L.plan[from]; }
      L.plan[pos] = (L.plan[pos] || 0) + 1;
    } else if (d > 0) {
      const q = pos || FAN_POS.find((x) => (L.plan[x] || 0) < (caps[x] || 0));
      if (!q || (L.plan[q] || 0) >= (caps[q] || 0)) return false;
      L.plan[q] = (L.plan[q] || 0) + 1;
    } else {
      const q = pos || [...FAN_POS].reverse().find((x) => L.plan[x] > 0);
      if (!q || !L.plan[q] || totalL(L) <= 1) return false;
      L.plan[q] -= 1; if (!L.plan[q]) delete L.plan[q];
    }
    notify(''); render();
    return true;
  };
  /** A whole pack of kind i more (its fans placed where there's room) or less (its fans out, the last placed first). */
  const changePacks = (i, d) => {
    const L = fanLines[i];
    if (!L) return false;
    if (!isPackL(L)) return changeFan(i, null, d);
    const v = L.packs + d;
    if (v < 1 || v > Math.floor(maxFor(L, sel) / per(L))) return false;
    L.packs = v;
    if (d > 0) addInOrder(L, per(L), sel); else trimL(L, neededL(L));
    notify(''); render();
    return true;
  };
  /** Add a kind of fan (one pack, or one fan, placed where there's room); a kind already chosen gets one more. */
  const addFanKind = (part) => {
    const at = fanLines.findIndex((L) => L.part.id === part.id);
    if (at >= 0) return changePacks(at, 1);
    const L = { part, packs: 1, plan: {} };
    fanLines.push(L);
    addInOrder(L, per(L), sel);
    if (!totalL(L)) { fanLines.pop(); syncFans(); notify(`אין במארז מקום פנוי ל-${esc(part.name)}.`); render(); return false; }
    syncFans(); notify(''); render();
    return true;
  };
  const removeFanKind = (i) => { if (!fanLines[i]) return; fanLines.splice(i, 1); syncFans(); notify(''); render(); };
  /** Can this fan be added (a new kind, or one more of a kind already chosen)? A note when it can't. */
  const fanBlock = (part, s) => {
    if (!part || !part.size || !s.case) return null;
    const L = fanLines.find((M) => M.part.id === part.id) || { part, packs: 0, plan: {} };
    const room = maxFor(L, s) - (L.packs ? neededL(L) : 0);
    if (room >= (part.count || 1)) return null;
    return `${room > 0 ? `יש במארז מקום רק ל-${room}` : 'אין במארז מקום פנוי'} למאווררי ${part.size}mm${fanLines.length ? ' (לצד המאווררים שכבר בחרתם)' : ''}${s.cooler && s.cooler.type === 'aio' && aioMount(s.case, s.cooler.radiator) ? ' (הרדיאטור תופס מקום)' : ''}`;
  };
  const rowCheck = (key, part, scope) => {
    if (key === 'fans') return { block: fanBlock(part, scope), warn: [] };
    return isExtra(key) ? { block: null, warn: extraNotes(key, part) } : check(key, part, scope);
  };

  // ---------- Persistence (per visitor; optional) ----------
  const KEY = 'rc-build';
  const state = () => ({ ...Object.fromEntries(Object.entries(sel).map(([k, p]) => [k, p.id])), ...(fanLines.length ? { fansLines: fanLines.map((L) => ({ id: L.part.id, packs: L.packs, plan: L.plan })) } : {}) });
  const saveSel = () => { try { localStorage.setItem(KEY, JSON.stringify(state())); } catch { /* storage blocked */ } };
  const loadSel = (from) => {
    try {
      const saved = from || JSON.parse(localStorage.getItem(KEY)) || {};
      if (from) { ALL.forEach(({ key }) => delete sel[key]); }
      ALL.forEach(({ key }) => { const p = saved[key] && byId(key, saved[key]); if (p) sel[key] = p; });
      fanLines = [];
      const cleanPlan = (sp) => { const o = {}; if (sp && typeof sp === 'object') FAN_POS.forEach((q) => { const v = Math.max(0, Math.min(20, Math.floor(Number(sp[q]) || 0))); if (v) o[q] = v; }); return o; };
      const list = Array.isArray(saved.fansLines) ? saved.fansLines
        : saved.fans ? [{ id: saved.fans, packs: saved.fansPacks, plan: saved.fansPlan, qty: saved.fansQty }] : []; // (the one-kind form saved before)
      list.slice(0, 6).forEach((x) => {
        const part = x && byId('fans', x.id);
        if (!part || fanLines.some((L) => L.part.id === part.id)) return;
        const L = { part, packs: 1, plan: cleanPlan(x.plan) };
        L.packs = Math.max(1, Math.min(10, Math.floor(Number(x.packs) || 0) || Math.ceil(totalL(L) / per(L)) || Number(x.qty) || 1));
        fanLines.push(L);
        if (isPackL(L)) { trimL(L, neededL(L)); addInOrder(L, unplacedL(L), sel); } else if (!totalL(L)) addInOrder(L, Math.max(1, Math.min(20, Number(x.qty) || 1)), sel);
      });
      syncFans();
      prune();
    } catch { /* ignore */ }
  };
  const applyPreset = (id) => {
    const pr = PRESETS.find((x) => x.id === id);
    if (!pr) return false;
    STEPS.forEach(({ key }) => { sel[key] = byId(key, pr.parts[key]); });
    prune();
    return true;
  };

  /** The link to this build: opens the builder with the same parts, fans and lighting. */
  const shareUrl = () => {
    let light = {};
    try { light = { rgb: localStorage.getItem('rc-pc3d-rgb') || undefined, mode: localStorage.getItem('rc-pc3d-mode') || undefined }; } catch { /* none */ }
    const base = (window.top !== window && (() => { try { return window.top.location.origin; } catch { return ''; } })()) || location.origin;
    return `${base}/shared-build?b=${window.RCShareCode.encode({ v: 1, ...state(), ...light })}`;
  };
  // after "copied": the button says so for a moment
  const flash = (btn, text) => {
    const label = btn.querySelector('[data-share-label]');
    if (!label) return;
    const was = label.dataset.was || label.textContent; label.dataset.was = was; label.textContent = text;
    clearTimeout(btn._t); btn._t = setTimeout(() => { label.textContent = was; }, 2200);
  };
  const copyLink = async (btn, url) => {
    try { await navigator.clipboard.writeText(url); flash(btn, 'הקישור הועתק'); return; } catch { /* blocked (e.g. inside the site's frame): the older way below */ }
    const box = root.querySelector('[data-share-box]');
    const inp = box?.querySelector('input');
    if (inp) {
      box.hidden = false; inp.value = url; inp.focus(); inp.select();
      let copied = false; try { copied = document.execCommand('copy'); } catch { /* not allowed: copy by hand from the box */ }
      flash(btn, copied ? 'הקישור הועתק' : 'העתיקו את הקישור מהתיבה');
    }
  };

  // ---------- Rendering ----------
  const hwEl = root.querySelector('[data-rows="hw"]');
  const exEl = root.querySelector('[data-rows="extras"]');
  const summaryEl = root.querySelector('[data-summary]');
  const noticeEl = root.querySelector('[data-notice]');
  const barTotal = document.getElementById('cfgBarTotal');
  const barCount = document.getElementById('cfgBarCount');
  const icon = (id, cls = 'w-5 h-5') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const imgSrc = (key, p) => window.RCPartArt.imgSrc(key, p);

  // Picker filters (Ivory-style chips): facet label -> value getter
  // one spelling per brand ("GIGABYTE" and "Gigabyte" are the same filter chip)
  const BRANDS = ['AMD', 'Intel', 'NVIDIA', 'ASUS', 'MSI', 'Gigabyte', 'ASRock', 'Corsair', 'Lian Li', 'Thermalright', 'Arctic', 'DeepCool', 'Noctua', 'NZXT', 'Fractal Design', 'Cooler Master', 'HYTE', 'Seasonic', 'be quiet!', 'Samsung', 'WD', 'Crucial', 'Kingston', 'TP-Link', 'Dell', 'LG', 'AOC', 'BenQ'];
  const brandOf = (p) => {
    const m = p.name.match(new RegExp(`^(${BRANDS.map((b) => b.replace(/[!]/g, '\\$&')).join('|')})`, 'i'));
    return m ? BRANDS.find((b) => b.toLowerCase() === m[1].toLowerCase()) : 'אחר';
  };
  // graphics chip maker from the model name (the card brand is a separate filter)
  const chipOf = (p) => (/GeForce|RTX|GTX/i.test(p.name) ? 'NVIDIA' : /Radeon|\bRX\s?\d/i.test(p.name) ? 'AMD' : brandOf(p));
  const FACETS = {
    cpu: [['יצרן', brandOf], ['שקע', (p) => p.socket]],
    board: [['יצרן', brandOf], ['שקע', (p) => p.socket], ['גודל', (p) => p.form], ['זיכרון', (p) => p.memory]],
    ram: [['סוג', (p) => p.type], ['נפח', (p) => (p.name.match(/(\d+GB)/) || [])[1]], ['יצרן', brandOf]],
    gpu: [['יצרן שבב', chipOf], ['יצרן כרטיס', brandOf]],
    storage: [['דור', (p) => `Gen${p.gen}`]],
    cooler: [['סוג', (p) => (p.type === 'aio' ? 'קירור נוזלי' : 'קירור אוויר')], ['יצרן', brandOf]],
    case: [['יצרן', brandOf], ['לוח מקסימלי', (p) => (p.forms.includes('ATX') ? 'ATX' : 'mATX')]],
    psu: [['יצרן', brandOf], ['הספק', (p) => `${p.watts}W`]],
    monitor: [['שימוש', (p) => (p.use === 'office' ? 'משרדי' : p.use === 'gaming' ? 'גיימינג' : undefined)], ['גודל', (p) => (p.size ? `${p.size}"` : undefined)], ['רזולוציה', (p) => p.res], ['יצרן', brandOf]],
  };
  let facetSel = {}; // facet label -> Set of values
  const thumb = (key, p, cls) => `<span class="${cls}"><img src="${esc(imgSrc(key, p))}" alt="" loading="lazy" width="160" height="120"></span>`;

  // the price of a line (fans: every kind, times its packs), and its name in the summary and the quote (fans: where)
  const priceOf = (key) => (key === 'fans' ? fanLines.reduce((n, L) => n + L.part.price * packsL(L), 0) : sel[key].price);
  const whereL = (L) => [...FAN_POS.filter((q) => L.plan[q]).map((q) => `${FAN_POS_LABEL[q]} ${L.plan[q]}`), ...(unplacedL(L) ? [`${unplacedL(L)} ללא מיקום`] : [])].join(', ');
  const nameOf = (key) => (key === 'fans'
    ? fanLines.map((L) => `${L.part.name}${packsL(L) > 1 ? ` × ${packsL(L)}` : ''} (${whereL(L)})`).join(' + ')
    : sel[key].name);
  // the extra fans' line: each kind with its packs (whole) or count, and where its fans go; then "add another kind"
  const fanLineHTML = (L, i) => {
    const caps = capsFor(L, sel); const pack = isPackL(L); const total = totalL(L); const free = unplacedL(L);
    const maxPacks = Math.floor(maxFor(L, sel) / per(L));
    const rows = FAN_POS.filter((q) => caps[q] || L.plan[q]).map((q) => {
      const n = L.plan[q] || 0; const cap = caps[q] || 0; const Lb = FAN_POS_LABEL[q];
      if (pack) {
        return `<li><span class="cfg-fanpos-name">${Lb}</span><output class="tabular">${n}</output><small class="tabular">/${cap}</small>
          <button type="button" class="cfg-qty-btn" data-fanpos="${q}" data-line="${i}" data-d="1" aria-label="להעביר מאוורר מהערכה ל${Lb}" title="להעביר מאוורר לכאן" ${n >= cap || !moveSource(L, q) ? 'disabled' : ''}>+</button></li>`;
      }
      return `<li><span class="cfg-fanpos-name">${Lb}</span>
        <button type="button" class="cfg-qty-btn" data-fanpos="${q}" data-line="${i}" data-d="-1" aria-label="מאוורר אחד פחות ב${Lb}" ${!n || total <= 1 ? 'disabled' : ''}>−</button>
        <output class="tabular">${n}</output><small class="tabular">/${cap}</small>
        <button type="button" class="cfg-qty-btn" data-fanpos="${q}" data-line="${i}" data-d="1" aria-label="עוד מאוורר ב${Lb}" ${n >= cap ? 'disabled' : ''}>+</button></li>`;
    }).join('');
    return `<div class="cfg-fanline" role="group" aria-label="${esc(L.part.name)}">
      <div class="cfg-fanline-head">${thumb('fans', L.part, 'cfg-fanline-thumb')}<b>${esc(L.part.name)}</b>
        <span class="tabular">${shekel(L.part.price * packsL(L))}</span>
        ${fanLines.length > 1 ? `<button type="button" class="cfg-fanline-x" data-fanline-remove="${i}" aria-label="הסרת ${esc(L.part.name)}">${icon('i-x', 'w-4 h-4')}</button>` : ''}</div>
      ${pack ? `<div class="cfg-fanpacks"><span>ערכות של ${per(L)}</span>
        <button type="button" class="cfg-qty-btn" data-fanpack="-1" data-line="${i}" aria-label="ערכה אחת פחות" ${L.packs <= 1 ? 'disabled' : ''}>−</button>
        <output class="tabular">${L.packs}</output>
        <button type="button" class="cfg-qty-btn" data-fanpack="1" data-line="${i}" aria-label="עוד ערכה" ${L.packs >= maxPacks ? 'disabled' : ''}>+</button></div>` : ''}
      <ul>${rows || '<li class="text-muted">אין מקום פנוי במארז</li>'}</ul>
      ${free ? `<p class="cfg-fan-free">${free === 1 ? 'מאוורר אחד מהערכה עוד לא במקום' : `${free} מאווררים מהערכה עוד לא במקום`}: בחרו לו מיקום ב-+</p>` : ''}
    </div>`;
  };
  const fanPlanHTML = () => {
    const canAdd = (PARTS.fans || []).some((x) => !fanBlock(x, sel));
    const pack = fanLines.some(isPackL);
    return `<div class="cfg-fanplan">
      ${fanLines.map(fanLineHTML).join('')}
      ${pack ? '<p class="cfg-fan-hint">ערכה נמכרת שלמה. + ליד מיקום מעביר אליו מאוורר מהערכה.</p>' : ''}
      ${canAdd ? `<button type="button" class="cfg-fan-add" data-pick="fans">${icon('i-plus', 'w-4 h-4')}הוספת סוג מאוורר נוסף</button>` : ''}
      <small>${fanCount() === 1 ? 'מאוורר אחד' : `${fanCount()} מאווררים`}${sel.case ? '' : ' · בחרו מארז כדי לראות את מיקומי ההתקנה שלו'}</small>
    </div>`;
  };

  const rowHTML = ({ key, label, icon: ic }) => {
    const p = sel[key];
    const warn = p ? rowCheck(key, p, otherSelections(key)).warn : [];
    return `<li class="cfg-row ${p ? 'is-done' : ''}">
      <div class="cfg-row-cat"><span class="cfg-row-ico">${icon(ic, 'w-6 h-6')}</span><span class="font-bold">${label}</span></div>
      ${p ? thumb(key, p, 'cfg-row-thumb') : '<span class="cfg-row-thumb is-empty" aria-hidden="true"></span>'}
      <div class="cfg-row-prod">
        ${p && key === 'fans' ? `<span class="cfg-row-name">${fanLines.length > 1 ? `${fanLines.length} סוגי מאווררים` : esc(p.name)}</span>` : p ? `<span class="cfg-row-name">${esc(p.name)}</span><span class="cfg-row-note">${esc(p.note)}</span>` : '<span class="cfg-row-empty">לא נבחר</span>'}
        ${warn.length ? `<span class="cfg-opt-warn">${icon('i-alert', 'w-4 h-4')}${esc(warn[0])}</span>` : ''}
        ${p && key === 'fans' ? fanPlanHTML() : ''}
      </div>
      <div class="cfg-row-price tabular">${p ? shekel(priceOf(key)) : ''}</div>
      <div class="cfg-row-act">
        ${p
          ? `${key === 'fans' ? '' : `<button type="button" class="btn btn-ghost btn-sm" data-pick="${key}" aria-label="החלפת ${label}">החלפה</button>`}
             <button type="button" class="cfg-row-del" data-remove="${key}" aria-label="הסרת ${label}">${icon('i-trash', 'w-4 h-4')}</button>`
          : `<button type="button" class="btn btn-dark btn-sm" data-pick="${key}" aria-label="בחירת ${label}">${icon('i-plus', 'w-4 h-4')}בחירה</button>`}
      </div>
    </li>`;
  };

  const renderRows = () => {
    hwEl.innerHTML = STEPS.map(rowHTML).join('');
    exEl.innerHTML = EXTRAS.map(rowHTML).join('');
  };

  const renderSummary = () => {
    const chosenHw = STEPS.filter(({ key }) => sel[key]);
    const chosenEx = EXTRAS.filter(({ key }) => sel[key]);
    const sum = [...chosenHw, ...chosenEx].reduce((s, { key }) => s + priceOf(key), 0);
    const total = sum + (chosenHw.length ? FEE : 0);
    const need = requiredPsu(sel);
    const complete = chosenHw.length === STEPS.length;
    const warns = [...new Set(ALL.flatMap(({ key }) => (sel[key] ? rowCheck(key, sel[key], otherSelections(key)).warn : [])))];
    summaryEl.innerHTML = `
      <h2 class="text-lg font-bold" id="cfgSumTitle" tabindex="-1">סיכום המפרט</h2>
      <div class="cfg-progress" role="progressbar" aria-label="רכיבי חובה שנבחרו" aria-valuemin="0" aria-valuemax="${STEPS.length}" aria-valuenow="${chosenHw.length}"><span data-style="width:${(chosenHw.length / STEPS.length) * 100}%"></span></div>
      <p class="text-xs text-muted mt-1.5">${chosenHw.length} מתוך ${STEPS.length} רכיבי חובה</p>
      <ul class="cfg-sum-list">
        ${[...chosenHw, ...chosenEx].map(({ key, label }) => `<li><span class="text-muted">${label}</span><span class="cfg-sum-val">${esc(nameOf(key))}</span></li>`).join('') || '<li class="text-muted">עוד לא נבחרו רכיבים</li>'}
        ${FEE && chosenHw.length ? `<li><span class="text-muted">הרכבה, Windows ובדיקות</span><span class="cfg-sum-val tabular">${shekel(FEE)}</span></li>` : ''}
      </ul>
      <div class="cfg-sum-stats">
        <div><span class="text-muted text-sm">ספק כוח נדרש</span><strong class="tabular">${need ? `${need}W` : '—'}</strong></div>
        <div><span class="text-muted text-sm">תאימות</span>${chosenHw.length ? `<strong class="text-[color:var(--success)] flex items-center gap-1">${icon('i-check', 'w-4 h-4')}הכול תואם</strong>` : '<strong>—</strong>'}</div>
      </div>
      ${warns.length ? `<ul class="cfg-sum-warn">${warns.map((w) => `<li>${icon('i-alert', 'w-4 h-4')}${esc(w)}</li>`).join('')}</ul>` : ''}
      <div class="cfg-total"><span>עלות מפרט <span class="vat-note">כולל מע״מ</span></span><strong class="tabular">${shekel(total)}</strong></div>
      <button type="button" class="btn btn-primary w-full" data-send ${complete ? '' : 'disabled aria-describedby="cfgSendHelp"'}>${icon('i-whatsapp')}שליחת המפרט להצעת מחיר</button>
      <p id="cfgSendHelp" class="text-xs text-muted text-center mt-2">${complete ? 'נבדוק זמינות ונחזור אליכם עם מחיר סופי.' : `נשארו ${STEPS.length - chosenHw.length} רכיבי חובה לבחירה`}</p>
      <div class="cfg-share">
        <button type="button" class="btn btn-ghost" data-share ${chosenHw.length + chosenEx.length ? '' : 'disabled'}>${icon('i-share', 'w-4 h-4')}<span data-share-label>שיתוף ההרכבה</span></button>
        <button type="button" class="btn btn-ghost cfg-share-wa" data-share-wa ${chosenHw.length + chosenEx.length ? '' : 'disabled'} aria-label="שליחת ההרכבה לחבר בוואטסאפ">${icon('i-whatsapp', 'w-5 h-5')}</button>
      </div>
      <div class="cfg-share-box" data-share-box hidden>
        <label for="cfgShareUrl" class="text-xs text-muted">העתיקו את הקישור:</label>
        <input id="cfgShareUrl" class="input" readonly dir="ltr">
      </div>
      <button type="button" class="cfg-reset" data-reset>איפוס המפרט</button>
      <ul class="cfg-trust">
        <li>${icon('i-clock', 'w-4 h-4')}זמן הרכבה: 3–7 ימי עסקים</li>
        <li>${icon('i-activity', 'w-4 h-4')}כולל בדיקות עומס לפני מסירה</li>
        <li>${icon('i-shield', 'w-4 h-4')}אחריות על הרכבה ורכיבים</li>
      </ul>
      <p class="text-xs text-muted mt-3">המחירים לדוגמה ומתעדכנים לפי זמינות. מידות הרכיבים לפי נתוני היצרן, ולפני ההזמנה נאשר כל רכיב מול הדגם המדויק.</p>`;
    summaryEl.querySelectorAll('[data-style]').forEach((e) => { e.style.cssText = e.dataset.style; }); // data-style: inline style attributes are blocked by the CSP
    if (barTotal) { barTotal.textContent = shekel(total); barCount.textContent = `${chosenHw.length}/${STEPS.length} רכיבי חובה`; }
    root.querySelectorAll('[data-preset]').forEach((b) => {
      const pr = PRESETS.find((x) => x.id === b.dataset.preset);
      b.setAttribute('aria-pressed', String(STEPS.every(({ key }) => sel[key]?.id === pr.parts[key])));
    });
  };

  // the 3D PC (pc-3d-boot.js) follows the choices: it listens to 'rc:build'
  const announce = () => {
    const detail = { sel: { ...sel }, removed: removedKeys };
    if (sel.fans) { // how many: the 3D puts them all in; its fan control shows the count and the limit
      detail.sel.fans = { ...sel.fans, lines: fanLines.map((L) => ({ part: L.part, qty: packsL(L), plan: { ...L.plan } })) };
      detail.fans = {
        order: FAN_POS, labels: FAN_POS_LABEL, hasCase: !!sel.case, count: fanCount(),
        canAdd: (PARTS.fans || []).some((x) => !fanBlock(x, sel)),
        lines: fanLines.map((L) => ({
          id: L.part.id, name: L.part.name, price: L.part.price * packsL(L), per: per(L), pack: isPackL(L), packs: packsL(L), needed: neededL(L), total: totalL(L),
          unplaced: unplacedL(L), plan: { ...L.plan }, caps: capsFor(L, sel), max: maxFor(L, sel), maxPacks: Math.floor(maxFor(L, sel) / per(L)),
          canMoveTo: Object.fromEntries(FAN_POS.map((q) => [q, !!moveSource(L, q)])),
        })),
      };
    }
    detail.roomKey = roomKey(sel);
    removedKeys = [];
    window.RCBuildCurrent = detail;
    document.dispatchEvent(new CustomEvent('rc:build', { detail }));
  };
  const render = () => { renderRows(); renderSummary(); saveSel(); announce(); };

  const notify = (msg) => {
    noticeEl.innerHTML = msg ? `${icon('i-alert', 'w-5 h-5 shrink-0')}<span>${msg}</span>` : '';
    noticeEl.hidden = !msg;
  };

  // ---------- Picker dialog ----------
  const dlg = document.getElementById('picker');
  const pSearch = document.getElementById('pickerSearch');
  const pSort = document.getElementById('pickerSort');
  const pList = dlg.querySelector('[data-picker-list]');
  const pEmpty = dlg.querySelector('[data-picker-empty]');
  const pMeta = dlg.querySelector('[data-picker-meta]');
  const pFacets = dlg.querySelector('[data-picker-facets]');
  const pNote = dlg.querySelector('[data-picker-note]');
  let pickKey = null;
  let pickTrigger = null;

  // The picker shows ONLY parts that fit everything already chosen (in any order),
  // and filter chips only offer values that exist among those parts.
  const fits = (key, p) => !rowCheck(key, p, otherSelections(key)).block;
  // Which chosen parts are narrowing this list (shown as a note so nothing "disappears" silently)
  const constraintsFor = (key) => {
    const others = otherSelections(key);
    return Object.keys(others).filter((k) => STEPS.some((st) => st.key === k)
      && PARTS[key].some((p) => rowCheck(key, p, others).block && !rowCheck(key, p, { ...others, [k]: undefined }).block));
  };

  const optionHTML = (key, p) => {
    const warn = rowCheck(key, p, otherSelections(key)).warn;
    const chosen = sel[key]?.id === p.id;
    return `<li><button type="button" class="cfg-opt" data-id="${p.id}" aria-pressed="${chosen}">
      ${thumb(key, p, "cfg-opt-thumb")}
      <span class="cfg-opt-main">
        <span class="cfg-opt-name">${esc(p.name)}</span>
        <span class="cfg-opt-note">${esc(p.note)}</span>
        ${warn.length ? `<span class="cfg-opt-warn">${icon("i-alert", "w-4 h-4")}${esc(warn[0])}</span>` : ""}
      </span>
      <span class="cfg-opt-price tabular">${shekel(p.price)}</span>
      <span class="cfg-check" aria-hidden="true">${icon("i-check", "w-4 h-4")}</span>
    </button></li>`;
  };

  const renderPicker = () => {
    const q = pSearch.value.trim().toLowerCase();
    const all = PARTS[pickKey];
    const compatible = all.filter((x) => fits(pickKey, x));
    const facets = FACETS[pickKey] || [];
    // Drop selected chip values that no longer exist among compatible parts
    facets.forEach(([label, get]) => {
      const present = new Set(compatible.map(get));
      facetSel[label]?.forEach((v) => { if (!present.has(v)) facetSel[label].delete(v); });
    });
    const passFacets = (x, skip) => facets.every(([label, get]) => label === skip || !facetSel[label]?.size || facetSel[label].has(get(x)));
    pFacets.innerHTML = facets.map(([label, get]) => {
      const values = [...new Set(compatible.map(get).filter(Boolean))];
      if (values.length < 2) return "";
      return `<div class="facet" role="group" aria-label="${label}"><span class="facet-label">${label}</span>${values.map((v) => {
        const n = compatible.filter((x) => get(x) === v && passFacets(x, label)).length;
        const on = facetSel[label]?.has(v);
        return `<button type="button" class="facet-chip" data-facet="${esc(label)}" data-value="${esc(v)}" aria-pressed="${!!on}">${esc(v)} <span>${n}</span></button>`;
      }).join("")}</div>`;
    }).join("");
    pFacets.hidden = !pFacets.innerHTML.trim();

    const dir = pSort.value === "desc" ? -1 : 1;
    const list = compatible
      .filter((x) => (!q || `${x.name} ${x.note}`.toLowerCase().includes(q)) && passFacets(x))
      .sort((a, b) => (a.price - b.price) * dir);
    pList.innerHTML = list.map((x) => optionHTML(pickKey, x)).join("");
    pEmpty.hidden = list.length > 0;

    const cons = isExtra(pickKey) && pickKey !== 'fans' ? [] : constraintsFor(pickKey); // (fans: the case limits them)
    pMeta.textContent = isExtra(pickKey)
      ? `${compatible.length} אפשרויות · לא חובה`
      : `${compatible.length} אפשרויות שמתאימות למחשב שלכם`;
    pNote.innerHTML = cons.length
      ? `${icon("i-check", "w-4 h-4")}<span>מוצגים רק רכיבים שמתאימים ל${cons.map((k) => meta(k).label).join(", ")} שבחרתם. כדי לראות אפשרויות אחרות, החליפו או הסירו קודם את ${cons.length > 1 ? "הרכיבים האלה" : meta(cons[0]).label}.</span>`
      : "";
    pNote.hidden = !cons.length;
  };

  const openPicker = (key, trigger) => {
    pickKey = key;
    pickTrigger = trigger;
    const m = meta(key);
    dlg.querySelector('#pickerTitle').textContent = `בחירת ${m.label}`;
    dlg.querySelector('[data-picker-icon]').innerHTML = icon(m.icon, 'w-6 h-6');
    pSearch.value = '';
    facetSel = {};
    renderPicker();
    dlg.showModal();
    (dlg.querySelector('.cfg-opt[aria-pressed="true"]') || pSearch).focus();
  };

  pFacets.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-facet]');
    if (!chip) return;
    const { facet, value } = chip.dataset;
    const set = facetSel[facet] || (facetSel[facet] = new Set());
    if (set.has(value)) set.delete(value); else set.add(value);
    renderPicker();
    pFacets.querySelector(`[data-facet="${CSS.escape(facet)}"][data-value="${CSS.escape(value)}"]`)?.focus();
  });
  pSearch.addEventListener('input', renderPicker);
  pSort.addEventListener('change', renderPicker);
  dlg.querySelector('[data-picker-close]').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    // Trigger may have been re-rendered; focus the row's current button for the same key
    const btn = root.querySelector(`[data-pick="${pickKey}"]`) || pickTrigger;
    btn?.focus();
  });

  /** Choose a part (from the picker, or from the 3D's side panel): what no longer fits comes out, with a note. */
  const choose = (key, id) => {
    const part = byId(key, id);
    if (!part) return false;
    if (key === 'fans') return addFanKind(part);
    sel[key] = part;
    const removed = prune();
    notify(removed.length ? `הסרנו רכיבים שכבר לא תואמים: ${removed.map(esc).join(' · ')}. בחרו אותם מחדש.` : '');
    render();
    return true;
  };
  pList.addEventListener('click', (e) => {
    const opt = e.target.closest('.cfg-opt');
    if (!opt || opt.disabled) return;
    choose(pickKey, opt.dataset.id);
    dlg.close();
  });

  // ---------- Events ----------
  root.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { openPicker(pick.dataset.pick, pick); return; }

    const fk = e.target.closest('[data-fanpack]');
    if (fk) {
      const { fanpack, line } = fk.dataset;
      changePacks(Number(line), Number(fanpack));
      (root.querySelector(`[data-fanpack="${fanpack}"][data-line="${line}"]:not(:disabled)`) || root.querySelector('[data-fanpack]:not(:disabled), [data-fanpos]:not(:disabled)'))?.focus();
      return;
    }
    const fp = e.target.closest('[data-fanpos]');
    if (fp) {
      const { fanpos, d, line } = fp.dataset;
      changeFan(Number(line), fanpos, Number(d));
      (root.querySelector(`[data-fanpos="${fanpos}"][data-line="${line}"][data-d="${d}"]:not(:disabled)`) || root.querySelector('[data-fanpos]:not(:disabled)'))?.focus();
      return;
    }
    const fx = e.target.closest('[data-fanline-remove]');
    if (fx) { removeFanKind(Number(fx.dataset.fanlineRemove)); root.querySelector('[data-pick="fans"]')?.focus(); return; }

    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const key = rm.dataset.remove;
      delete sel[key];
      if (key === 'fans') clearFans();
      notify('');
      render();
      root.querySelector(`[data-pick="${key}"]`)?.focus();
      return;
    }

    const preset = e.target.closest('[data-preset]');
    if (preset) { applyPreset(preset.dataset.preset); notify(''); render(); return; }

    if (e.target.closest('[data-reset]')) {
      ALL.forEach(({ key }) => delete sel[key]);
      clearFans();
      notify('');
      render();
      return;
    }

    const shareBtn = e.target.closest('[data-share]');
    if (shareBtn && !shareBtn.disabled) {
      const url = shareUrl();
      const total = root.querySelector('.cfg-total strong')?.textContent || '';
      // phones: the system share sheet (WhatsApp, Messages…); computers: copy the link
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        navigator.share({ title: 'המחשב שבניתי ב-RedCore', text: `המחשב שבניתי ב-RedCore (${total}):`, url })
          .catch((err) => { if (err?.name !== 'AbortError') copyLink(shareBtn, url); }); // (closed by the visitor: nothing; not allowed: copy instead)
      } else copyLink(shareBtn, url);
      return;
    }
    const waBtn = e.target.closest('[data-share-wa]');
    if (waBtn && !waBtn.disabled) {
      const total = root.querySelector('.cfg-total strong')?.textContent || '';
      window.open(`https://wa.me/?text=${encodeURIComponent(`תראו את המחשב שבניתי ב-RedCore (${total}):\n${shareUrl()}`)}`, '_blank', 'noopener');
      return;
    }

    if (e.target.closest('[data-send]')) {
      // Sent through the shared order form (order.js): consent to terms + privacy before anything leaves the page
      const lines = [...STEPS, ...EXTRAS].filter(({ key }) => sel[key]).map(({ key, label }) => [label, nameOf(key)]);
      lines.push(['קישור להרכבה', shareUrl()]);
      window.RCOrder.open({ title: 'מחשב בהרכבה אישית – בקשה להצעת מחיר', lines, total: root.querySelector('.cfg-total strong').textContent, totalLabel: 'עלות מפרט משוערת' });
    }
  });

  document.getElementById('cfgBar')?.querySelector('a').addEventListener('click', (e) => {
    e.preventDefault();
    summaryEl.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.getElementById('cfgSumTitle')?.focus({ preventScroll: true });
  });

  // the 3D PC opens a category's picker when a part is clicked in it
  window.RCBuild = {
    open: (key) => { if (ALL.some((s) => s.key === key)) openPicker(key, root.querySelector(`[data-pick="${key}"]`)); },
    // the 3D's side panel (full screen) chooses parts in place, like the picker does
    steps: () => ALL.map(({ key, label, icon: ic }) => ({ key, label, icon: ic, extra: isExtra(key) })),
    /** The parts that fit what's chosen, cheapest first: { id, name, note, price, img, chosen }. */
    options: (key) => (PARTS[key] || []).filter((p) => fits(key, p)).sort((a, b) => a.price - b.price)
      .map((p) => ({ id: p.id, name: p.name, note: p.note || '', price: p.price, img: imgSrc(key, p), chosen: key === 'fans' ? fanLines.some((L) => L.part.id === p.id) : sel[key]?.id === p.id })),
    choose,
    remove: (key) => { if (!sel[key]) return; delete sel[key]; if (key === 'fans') clearFans(); notify(''); render(); },
    // the 3D's fan controls: one fan more or less, in a position or wherever there's room
    addPacks: (step, line = 0) => changePacks(line, step), // (a pack: a whole pack; a single fan: one fan)
    addFanAt: (pos, step, line = 0) => changeFan(line, pos, step),
    removeFanKind,
    // the 3D's measure of the room for fans in each position, for the build `key`
    setFanRoom: (room, key) => {
      if (key !== roomKey(sel) || (JSON.stringify(room) === JSON.stringify(fanRoom) && key === fanRoomKey)) return;
      fanRoom = room; fanRoomKey = key;
      const notes = fitFans(sel);
      if (notes.length) notify(`עם הרכיבים שבחרתם יש פחות מקום למאווררים, אז עדכנו: ${notes.map(esc).join(' · ')}`);
      render();
    },
  };

  // Start: ?preset=mid from links in the shop, otherwise the visitor's last build
  if (RC_SHARED) {
    loadSel(RC_SHARED);
    notify('פתחתם הרכבה ששיתפו איתכם. אפשר לשנות כל רכיב, ולשלוח לנו לקבלת הצעת מחיר.');
  } else if (!applyPreset(new URLSearchParams(location.search).get('preset'))) loadSel();
  render();
  // Opened from a category on the home page (build.html?open=cpu): show that category's picker right away
  const openKey = new URLSearchParams(location.search).get('open');
  if (openKey && ALL.some((s) => s.key === openKey)) openPicker(openKey, root.querySelector(`[data-pick="${openKey}"]`));
});
