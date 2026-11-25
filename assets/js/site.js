// RedCore — shared header behaviour for inner pages (desks.html, pc-desks.html):
// header shadow, categories dropdown, mobile menu, footer year. (index.html uses main.js.)
(() => {
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => { // two thresholds so the shrinking header doesn't flip back and forth (shaking)
    const on = header.classList.contains('is-scrolled');
    header.classList.toggle('is-scrolled', on ? window.scrollY > 4 : window.scrollY > 60);
  };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile search: opens under the header on demand
  const sToggle = document.getElementById('searchToggle');
  const sBox = document.getElementById('mobileSearch');
  if (sToggle && sBox) {
    const setSearch = (open) => { sBox.classList.toggle('hidden', !open); sToggle.setAttribute('aria-expanded', String(open)); if (open) sBox.querySelector('input').focus(); };
    sToggle.addEventListener('click', () => setSearch(sBox.classList.contains('hidden')));
    sBox.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setSearch(false); sToggle.focus(); } });
  }

  const dd = document.getElementById('catDropdown');
  if (dd) {
    const btn = dd.querySelector('button');
    const setOpen = (open) => { dd.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', () => setOpen(!dd.classList.contains('open')));
    document.addEventListener('click', (e) => { if (!dd.contains(e.target)) setOpen(false); });
    dd.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); btn.focus(); } });
  }

  const menu = document.getElementById('mobileMenu');
  const scrim = document.getElementById('menuScrim');
  const openBtn = document.getElementById('menuOpen');
  const closeBtn = document.getElementById('menuClose');
  if (menu && openBtn) {
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
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
