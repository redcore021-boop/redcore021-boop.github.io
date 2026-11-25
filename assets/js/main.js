// RedCore — site interactions
(() => {
  const WA_NUMBER = '972525956062';
  const EMAIL = 'redcore021@gmail.com';
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const shekel = (n) => `₪${n.toLocaleString('he-IL')}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  const onScroll = () => { // two thresholds so the shrinking header doesn't flip back and forth (shaking)
    const on = header.classList.contains('is-scrolled');
    header.classList.toggle('is-scrolled', on ? window.scrollY > 4 : window.scrollY > 60);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Active nav link
  const navLinks = [...document.querySelectorAll('nav .nav-link[href^="#"]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === `#${e.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // Mobile search: opens under the header on demand (saves a full row of screen)
  const sToggle = document.getElementById('searchToggle');
  const sBox = document.getElementById('mobileSearch');
  if (sToggle && sBox) {
    const setSearch = (open) => { sBox.classList.toggle('hidden', !open); sToggle.setAttribute('aria-expanded', String(open)); if (open) sBox.querySelector('input').focus(); };
    sToggle.addEventListener('click', () => setSearch(sBox.classList.contains('hidden')));
    sBox.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setSearch(false); sToggle.focus(); } });
  }

  // Categories dropdown
  const dd = document.getElementById('catDropdown');
  if (dd) {
    const btn = dd.querySelector('button');
    const setOpen = (open) => { dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => setOpen(!dd.classList.contains('open')));
    dd.querySelectorAll('.dropdown-menu a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) setOpen(false); });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
  }

  // Mobile menu
  const menu = document.getElementById('mobileMenu');
  const scrim = document.getElementById('menuScrim');
  const openBtn = document.getElementById('menuOpen');
  const closeBtn = document.getElementById('menuClose');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    scrim.classList.toggle('hidden', !open);
    menu.inert = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    (open ? closeBtn : openBtn).focus();
  };
  openBtn.addEventListener('click', () => setMenu(true));
  closeBtn.addEventListener('click', () => setMenu(false));
  scrim.addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });

  // Toast
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
  };

  // ---------- Products ----------
  const products = window.RC_PRODUCTS || [];
  const grid = document.getElementById('productGrid');
  const empty = document.getElementById('productEmpty');
  const status = document.getElementById('searchStatus');
  const BADGES = { in: ['במלאי', 'badge-in'], hot: ['הנמכר ביותר', 'badge-hot'], pre: ['בהזמנה מראש', 'badge-pre'] };
  // Ready-PC orders go through the shared order form (order.js): consent to terms + privacy before sending
  const orderProduct = (id) => {
    const p = products.find((x) => x.id === id);
    if (p && window.RCOrder) window.RCOrder.open({ title: `מחשב מוכן – ${p.name}`, lines: p.specs, total: shekel(p.price), totalLabel: 'מחיר' });
  };

  const card = (p) => {
    const [label, cls] = BADGES[p.status] || BADGES.in;
    const specs = p.specs.slice(0, 4).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    return `<article class="card card-hover product p-3 flex flex-col reveal" data-id="${esc(p.id)}">
      <div class="media">
        <img src="${esc(p.image)}" alt="${esc(p.alt)}" loading="lazy">
        <button type="button" data-zoom="${esc(p.id)}" aria-label="הגדלת התמונה של ${esc(p.name)}"></button>
        <span class="zoom-hint" aria-hidden="true"><svg class="w-4 h-4"><use href="#i-search"/></svg></span>
        <span class="badge ${cls}">${label}</span>
      </div>
      <div class="px-2 pt-4 pb-2 flex flex-col flex-1">
        <h3 class="text-lg font-bold">${esc(p.name)}</h3>
        <p class="text-sm text-muted">${esc(p.tagline)}</p>
        <dl class="spec-list mt-3 mb-4">${specs}</dl>
        <p class="price tabular mt-auto">${shekel(p.price)} <span class="vat-note">כולל מע״מ</span></p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button type="button" class="btn btn-primary btn-sm" data-order-id="${esc(p.id)}" aria-label="הזמנת ${esc(p.name)}">להזמנה</button>
          <button type="button" class="btn btn-ghost btn-sm" data-details="${esc(p.id)}">מפרט מלא</button>
        </div>
      </div>
    </article>`;
  };

  const renderProducts = (list) => {
    grid.innerHTML = list.map(card).join('');
    empty.classList.toggle('hidden', list.length > 0);
    grid.classList.toggle('hidden', list.length === 0);
    observeReveals(grid.querySelectorAll('.reveal'));
  };

  // Budget filter ("לכל כיס")
  const priceFilter = document.getElementById("priceFilter");
  let range = [0, Infinity];
  const inRange = (p) => p.price >= range[0] && p.price < range[1];
  if (priceFilter) {
    priceFilter.addEventListener("click", (e) => {
      const b = e.target.closest("[data-range]");
      if (!b) return;
      priceFilter.querySelectorAll("[data-range]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      range = b.dataset.range === "all" ? [0, Infinity] : b.dataset.range.split("-").map(Number);
      status.textContent = "";
      document.querySelectorAll("[data-search] input[name=\"q\"]").forEach((i) => { i.value = ""; });
      renderProducts(products.filter(inRange));
    });
  }

  // Product details dialog
  const pd = document.getElementById('productDialog');
  let pdTrigger = null;
  const openDetails = (id, trigger) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    pdTrigger = trigger;
    document.getElementById('pdImg').src = p.image;
    document.getElementById('pdImg').alt = p.alt;
    document.getElementById('pdTitle').textContent = p.name;
    document.getElementById('pdTagline').textContent = p.tagline;
    document.getElementById('pdSpecs').innerHTML = p.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    document.getElementById('pdPrice').textContent = shekel(p.price);
    document.getElementById('pdOrder').dataset.orderId = p.id;
    pd.showModal();
  };
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-details]');
    if (b) openDetails(b.dataset.details, b);
    const o = e.target.closest('[data-order-id]');
    if (o) orderProduct(o.dataset.orderId);
  });
  pd.querySelector('[data-close]').addEventListener('click', () => pd.close());
  document.getElementById('pdOrder').addEventListener('click', (e) => { const id = e.currentTarget.dataset.orderId; pdTrigger = null; pd.close(); orderProduct(id); });
  pd.addEventListener('click', (e) => { if (e.target === pd) pd.close(); });
  pd.addEventListener('close', () => pdTrigger && pdTrigger.focus());

  // ---------- Search ----------
  const norm = (s) => s.toLowerCase().replace(/[\s\-_.]+/g, ' ').trim();
  const partTiles = [...document.querySelectorAll('#partsGrid a')];
  const clearHighlights = () => partTiles.forEach((t) => t.classList.remove('match'));

  const runSearch = (q, cat) => {
    const query = norm(q);
    clearHighlights();
    if (cat === 'repairs') { document.getElementById('repairs').scrollIntoView(); return; }

    const terms = query.split(' ').filter(Boolean);
    const matches = (text) => terms.every((t) => norm(text).includes(t));

    if (cat !== 'pcs') {
      const hits = query ? partTiles.filter((t) => matches(`${t.dataset.keywords} ${t.textContent}`)) : [];
      // Category words ("ספק כוח", "כרטיס מסך") go to the parts grid; model names/specs ("5070") go to products
      if (cat === 'parts' || hits.length) {
        hits.forEach((t) => t.classList.add('match'));
        document.getElementById('parts').scrollIntoView();
        status.textContent = '';
        return;
      }
    }

    const list = query ? products.filter((p) => matches(`${p.name} ${p.tagline} ${p.specs.flat().join(' ')}`)) : products;
    renderProducts(list);
    status.innerHTML = query
      ? `${list.length} תוצאות עבור "${esc(q)}" · <button type="button" class="underline font-semibold text-ink" data-clear-search>ניקוי</button>`
      : '';
    document.getElementById('stock').scrollIntoView();
  };

  document.querySelectorAll('[data-search]').forEach((form) => form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    runSearch(String(fd.get('q') || ''), String(fd.get('cat') || 'all'));
  }));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-clear-search]')) return;
    document.querySelectorAll('[data-search] input[name="q"]').forEach((i) => { i.value = ''; });
    status.textContent = '';
    clearHighlights();
    range = [0, Infinity];
    priceFilter?.querySelectorAll("[data-range]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.range === "all")));
    renderProducts(products);
  });

  // WhatsApp deep links for part categories
  // Category tiles link to the configurator with that category's picker open (build.html?open=cpu)

  // ---------- Forms ----------
  const setError = (input, msg) => {
    const err = document.getElementById(`${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };
  const phoneOk = (v) => /^0\d{1,2}-?\d{3}-?\d{4}$|^\+?972-?\d{1,2}-?\d{3}-?\d{4}$/.test(v.replace(/\s/g, ''));

  // Contact form
  const contactForm = document.getElementById('contactForm');
  const summary = document.getElementById('contactSummary');
  const fields = {
    name: { el: document.getElementById('c-name'), check: (v) => (v.trim().length >= 2 ? '' : 'כתבו שם מלא (לפחות 2 תווים).') },
    phone: { el: document.getElementById('c-phone'), check: (v) => (phoneOk(v) ? '' : 'מספר הטלפון לא תקין. לדוגמה: 050-123-4567.') },
    message: { el: document.getElementById('c-msg'), check: (v) => (v.trim().length >= 5 ? '' : 'כתבו כמה מילים על הפנייה.') },
  };
  Object.values(fields).forEach(({ el, check }) => {
    el.addEventListener('blur', () => el.value && setError(el, check(el.value)));
    el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && setError(el, check(el.value)));
  });
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const channel = e.submitter?.dataset.channel || 'whatsapp';
    const errors = [];
    Object.values(fields).forEach(({ el, check }) => {
      const msg = check(el.value);
      setError(el, msg);
      if (msg) errors.push({ el, msg });
    });
    if (errors.length) {
      summary.innerHTML = `<p class="font-semibold mb-2">יש ${errors.length === 1 ? 'שדה אחד' : errors.length + ' שדות'} לתיקון:</p><ul class="list-disc ps-5 space-y-1">${errors
        .map(({ el, msg }) => `<li><a class="underline" href="#${el.id}">${msg}</a></li>`).join('')}</ul>`;
      summary.classList.remove('hidden');
      summary.querySelectorAll('a').forEach((a) => a.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.querySelector(a.getAttribute('href')).focus();
      }));
      if (errors.length > 1) summary.focus(); else errors[0].el.focus();
      return;
    }
    summary.classList.add('hidden');
    const fd = new FormData(contactForm);
    const body = `שם: ${fd.get('name')}\nטלפון: ${fd.get('phone')}\nנושא: ${fd.get('topic')}\n\n${fd.get('message')}`;
    if (channel === 'email') {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`פנייה מהאתר: ${fd.get('topic')}`)}&body=${encodeURIComponent(body)}`;
      showToast('תוכנת המייל נפתחה עם ההודעה שלכם.');
    } else {
      window.open(waLink(`היי RedCore, פנייה מהאתר:\n${body}`), '_blank', 'noopener');
      showToast('ההודעה נפתחה בוואטסאפ. נשאר רק ללחוץ "שליחה".');
    }
  });

  // ---------- Photo lightbox (ready-PC photos; click a product photo) ----------
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  let items = [];
  let current = 0;
  let lastTrigger = null;
  const show = (i) => {
    if (!items.length) return;
    current = (i + items.length) % items.length;
    const p = items[current];
    lbImg.src = p.image;
    lbImg.alt = p.alt;
    lbCaption.textContent = `${p.name} · נבנה אצלנו`;
  };
  grid.addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]');
    if (!z) return;
    items = [...grid.querySelectorAll('[data-zoom]')].map((b) => products.find((p) => p.id === b.dataset.zoom)).filter(Boolean);
    lastTrigger = z;
    show(items.findIndex((p) => p.id === z.dataset.zoom));
    lb.showModal();
  });
  document.getElementById('lbClose').addEventListener('click', () => lb.close());
  // RTL: "previous" sits on the right
  document.getElementById('lbPrev').addEventListener('click', () => show(current - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current + 1);
    if (e.key === 'ArrowRight') show(current - 1);
  });
  lb.addEventListener('close', () => lastTrigger && lastTrigger.focus());

  // ---------- Scroll reveal ----------
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = 'IntersectionObserver' in window && !reduced
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const siblings = [...e.target.parentElement.children];
        e.target.style.transitionDelay = `${Math.min(siblings.indexOf(e.target), 5) * 50}ms`;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1 })
    : null;
  function observeReveals(els) {
    els.forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  }
  observeReveals(document.querySelectorAll('.reveal'));

  renderProducts(products);

  // Search submitted from an inner page (index.html?q=...)
  const q = new URLSearchParams(location.search).get("q");
  if (q) {
    document.querySelectorAll("[data-search] input[name=\"q\"]").forEach((i) => { i.value = q; });
    runSearch(q, new URLSearchParams(location.search).get("cat") || "all");
  }
})();
