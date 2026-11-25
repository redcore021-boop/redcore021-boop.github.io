// These static pages are shown inside the React app (in an iframe). Send their links to the app's own pages
// (/stock, /parts, ...) in the main window, instead of loading the home page inside the frame.
(() => {
  const SECTION_PAGES = { stock: '/stock', parts: '/parts', repairs: '/repairs', about: '/about', faq: '/faq', contact: '/contact', build: '/build', top: '/', main: '/' };

  const route = (url) => {
    const page = url.pathname.replace(/^\/+/, '');
    const hash = url.hash.slice(1);
    if (page === '' || page === 'index.html') return SECTION_PAGES[hash] || '/';
    return `/${page.replace(/\.html$/, '')}${url.search}${url.hash}`;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return; // same-page anchors (skip link, FAQ items) stay as they are
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return; // WhatsApp, phone, email and other sites
    e.preventDefault();
    window.top.location.href = route(url);
  });
})();
