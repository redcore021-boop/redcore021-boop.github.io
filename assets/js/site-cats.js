// RedCore — the menu on the older static pages (desks, pc-desks, terms, privacy, returns), built from the admin so it matches the React pages:
// top row: "כל הקטגוריות" (opens the side menu) + the quick links (admin: תפריטים → תפריט עליון), no dropdowns;
// side menu: the categories, their subcategories open on tap.
// If the menu can't be loaded, the page keeps its original menu.
(() => {
  const catDropdown = document.getElementById('catDropdown');
  const navRow = catDropdown && catDropdown.parentElement;
  const mobileNav = document.querySelector('#mobileMenu nav');
  if (!navRow && !mobileNav) return;

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const href = (c) => (c.count === 0 && c.link ? c.link : `/category/${encodeURIComponent(c.slug)}`);
  const badge = (c) => (c.badge ? ` <span class="badge-new">${esc(c.badge)}</span>` : '');

  const ICONS = [[/pc-in-desk|pc-desk/, 'i-desk-pc'], [/smartphone|iphone|phone/, 'i-smartphone'], [/laptop|macbook/, 'i-laptop'], [/tablet|ipad/, 'i-tablet'], [/watch/, 'i-watch'], [/desktop|imac|mac-/, 'i-desktop'], [/desk/, 'i-desk'], [/monitor/, 'i-monitor'], [/keyboard/, 'i-keyboard'], [/mice|mouse/, 'i-mouse'],
    [/headset|access/, 'i-headset'], [/chair/, 'i-chair'], [/component|parts|cpu/, 'i-cpu'], [/repair/, 'i-wrench'], [/computer|pc/, 'i-case']];
  const icon = (c) => { const id = c.icon || (ICONS.find(([re]) => re.test(c.slug)) || [, 'i-grid'])[1]; return document.getElementById(id) ? id : 'i-grid'; }; // this page's icon set is smaller
  const name = (c) => `<span class="m-cat-name"><svg class="m-cat-ico" aria-hidden="true"><use href="#${esc(icon(c))}"/></svg>${esc(c.name)}${badge(c)}</span>`;

  const mobile = (cats) => `
    <p class="m-cats-title">קטגוריות</p>
    <ul>${cats.map((c) => {
      const subs = c.children || [];
      if (!subs.length) return `<li><a class="m-cat-btn" href="${esc(href(c))}">${name(c)}</a></li>`;
      return `<li>
        <button type="button" class="m-cat-btn" aria-expanded="false" aria-controls="mcat-${c.id}">${name(c)}<svg class="w-5 h-5 chev" aria-hidden="true"><use href="#i-chev-d"/></svg></button>
        <ul id="mcat-${c.id}" class="m-cat-subs" hidden>
          ${c.count > 0 ? `<li><a href="/category/${encodeURIComponent(c.slug)}">הצגת הכול ›</a></li>` : ''}
          ${subs.map((s) => `<li><a href="${esc(href(s))}">${esc(s.name)}${badge(s)}</a></li>`).join('')}
        </ul>
      </li>`;
    }).join('')}</ul>`;

  fetch('/api/public/menu', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(({ categories: cats, links }) => {
      if (!Array.isArray(cats) || !cats.length) return;

      if (navRow) {
        // keep the "ייעוץ חינם" note at the end of the row; everything else becomes "כל הקטגוריות" + quick links
        const keep = [...navRow.children].filter((el) => el.classList.contains('ms-auto'));
        navRow.innerHTML = `<button type="button" class="allcats-btn" aria-controls="mobileMenu"><svg class="w-5 h-5" aria-hidden="true"><use href="#i-menu"/></svg>כל הקטגוריות</button>`
          + (links || []).map((l) => `<a class="nav-link toplink" href="${esc(l.href)}">${esc(l.label)}${l.badge ? ` <span class="badge-new">${esc(l.badge)}</span>` : ''}</a>`).join('');
        keep.forEach((el) => { el.classList.add('nav-consult'); navRow.appendChild(el); });
        navRow.classList.remove('gap-8');
        navRow.classList.add('gap-1');
        // the page's own menu button (hidden on desktop) opens and closes the side menu
        navRow.querySelector('.allcats-btn').addEventListener('click', () => { const b = document.getElementById('menuOpen'); if (b) b.click(); });
      }

      if (mobileNav) {
        const box = document.createElement('div');
        box.className = 'm-cats';
        box.innerHTML = mobile(cats);
        mobileNav.prepend(box);
        // the page's own links that the categories now cover are hidden; about / FAQ / contact stay
        mobileNav.querySelectorAll(':scope > ul > li').forEach((li) => {
          const a = li.querySelector('a');
          if (a && !/#(about|faq|contact)$/.test(a.getAttribute('href') || '')) li.hidden = true;
        });
        box.addEventListener('click', (e) => {
          const b = e.target.closest('button.m-cat-btn');
          if (!b) return;
          const open = b.getAttribute('aria-expanded') !== 'true';
          b.setAttribute('aria-expanded', String(open));
          document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
        });
      }
    })
    .catch(() => { /* keep the page's original menu */ });
})();
