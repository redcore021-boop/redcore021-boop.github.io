// RedCore — shared order form for the desk configurators.
// RCOrder.open({ title, lines: [[label, value]...], total, production, custom }) opens the form (name, phone, city, notes)
// and sends the full spec via WhatsApp or e-mail. RCOrder.whatsapp(order) opens the same dialog in "quick" mode
// (no personal fields, WhatsApp only). Both modes require consent to the terms + privacy policy (never pre-checked);
// custom: true (made-to-order desks) adds a required acknowledgement of the cancellation exception.
(() => {
  const WA = '972525956062';
  const EMAIL = 'redcore021@gmail.com';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const phoneOk = (v) => /^0\d{1,2}-?\d{3}-?\d{4}$|^\+?972-?\d{1,2}-?\d{3}-?\d{4}$/.test(v.replace(/\s/g, ''));

  const specText = (o) => [
    `${o.title}:`,
    ...o.lines.map(([k, v]) => `• ${k}: ${v}`),
    `${o.totalLabel || 'מחיר משוער'} באתר: ${o.total} (כולל מע״מ)`,
  ];

  const whatsapp = (o, customer) => {
    const lines = ['היי RedCore, אשמח להזמין:', ...specText(o)];
    if (customer) {
      lines.push('', 'פרטי המזמין:', `• שם: ${customer.name}`, `• טלפון: ${customer.phone}`, `• עיר: ${customer.city}`);
      if (customer.notes) lines.push(`• הערות: ${customer.notes}`);
    }
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  };

  let dlg = null;
  let current = null;
  let lastFocus = null;
  let quick = false;

  const build = () => {
    dlg = document.createElement('dialog');
    dlg.className = 'sheet order-dialog';
    dlg.setAttribute('aria-labelledby', 'orderTitle');
    dlg.innerHTML = `
      <form class="p-6 sm:p-7" novalidate>
        <div class="flex items-start justify-between gap-4 mb-1">
          <h2 id="orderTitle" class="text-2xl font-extrabold">שליחת הזמנה</h2>
          <button type="button" class="icon-btn shrink-0" data-close aria-label="סגירה"><svg class="w-5 h-5" aria-hidden="true"><use href="#i-x"/></svg></button>
        </div>
        <p class="text-sm text-muted mb-5">נחזור אליכם עם אישור מידות, מחיר סופי וזמן ייצור. שדות המסומנים ב-<span class="text-brand">*</span> הם שדות חובה.</p>
        <div class="order-spec" data-spec></div>
        <div data-summary-err class="hidden mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800" tabindex="-1" role="alert"></div>
        <div class="grid sm:grid-cols-2 gap-4" data-customer>
          <div class="field"><label for="o-name">שם מלא <span class="req">*</span></label><input id="o-name" name="name" class="input" autocomplete="name" required aria-describedby="o-name-err"><p class="field-error" id="o-name-err"></p></div>
          <div class="field"><label for="o-phone">טלפון <span class="req">*</span></label><input id="o-phone" name="phone" type="tel" inputmode="tel" dir="ltr" class="input" autocomplete="tel" placeholder="050-000-0000" required aria-describedby="o-phone-err"><p class="field-error" id="o-phone-err"></p></div>
          <div class="field sm:col-span-2"><label for="o-city">עיר <span class="req">*</span></label><input id="o-city" name="city" class="input" autocomplete="address-level2" required aria-describedby="o-city-err"><p class="field-error" id="o-city-err"></p></div>
          <div class="field sm:col-span-2"><label for="o-notes">הערות</label><textarea id="o-notes" name="notes" class="input" placeholder="למשל: צבע מיוחד, קומה ללא מעלית, מועד משלוח מועדף"></textarea></div>
        </div>
        <div class="mt-5 space-y-3">
          <div data-custom-wrap class="hidden">
            <p class="callout-sm">שולחן בהתאמה אישית מיוצר במיוחד עבורכם, ולכן <strong>עשוי שלא לחול עליו זכות הביטול</strong> של עסקת מכר מרחוק. <a href="returns.html#custom" target="_blank" rel="noopener" class="underline">פרטים במדיניות הביטול</a>.</p>
            <label class="consent mt-2"><input type="checkbox" name="customAck" id="o-custom" aria-describedby="o-custom-err"><span>הבנתי שהמוצר מיוצר במיוחד עבורי ושזכות הביטול עשויה שלא לחול עליו. <span class="req">*</span></span></label>
            <p class="field-error" id="o-custom-err"></p>
          </div>
          <label class="consent"><input type="checkbox" name="terms" id="o-terms" aria-describedby="o-terms-err"><span>קראתי ואני מסכים/ה ל<a href="terms.html" target="_blank" rel="noopener">תקנון</a> ול<a href="privacy.html" target="_blank" rel="noopener">מדיניות הפרטיות</a>. <span class="req">*</span></span></label>
          <p class="field-error" id="o-terms-err"></p>
          <p class="privacy-note">הפרטים שתמסרו ישמשו רק לטיפול בהזמנה וליצירת קשר איתכם. ההודעה תישלח דרך WhatsApp או Gmail ותישמר אצלנו. אינכם חייבים למסור את הפרטים, אך בלעדיהם לא נוכל לטפל בהזמנה. אפשר לבקש לעיין בפרטים, לתקן או למחוק אותם. <a href="privacy.html" target="_blank" rel="noopener">מדיניות הפרטיות</a>. לעולם לא נבקש פרטי אשראי בטופס או בהודעה.</p>
        </div>
        <div class="mt-5 flex flex-col sm:flex-row gap-3">
          <button type="submit" class="btn btn-primary flex-1" data-channel="whatsapp"><svg class="w-5 h-5" aria-hidden="true"><use href="#i-whatsapp"/></svg>שליחה בוואטסאפ</button>
          <button type="submit" class="btn btn-ghost flex-1" data-channel="email" data-email-btn><svg class="w-5 h-5" aria-hidden="true"><use href="#i-mail"/></svg>שליחה במייל</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);

    const form = dlg.querySelector('form');
    const summary = dlg.querySelector('[data-summary-err]');
    const fields = {
      name: { el: form.querySelector('#o-name'), check: (v) => (v.trim().length >= 2 ? '' : 'כתבו שם מלא (לפחות 2 תווים).') },
      phone: { el: form.querySelector('#o-phone'), check: (v) => (phoneOk(v) ? '' : 'מספר הטלפון לא תקין. לדוגמה: 050-123-4567.') },
      city: { el: form.querySelector('#o-city'), check: (v) => (v.trim().length >= 2 ? '' : 'כתבו את העיר למשלוח.') },
    };
    const checks = {
      terms: { el: form.querySelector('#o-terms'), check: (v, el) => (el.checked ? '' : 'כדי לשלוח הזמנה יש לאשר את התקנון ואת מדיניות הפרטיות.') },
      customAck: { el: form.querySelector('#o-custom'), check: (v, el) => (!current?.custom || el.checked ? '' : 'יש לאשר שהמוצר מיוצר במיוחד ושזכות הביטול עשויה שלא לחול עליו.') },
    };
    Object.values(checks).forEach(({ el, check }) => el.addEventListener('change', () => setError(el, check(el.value, el))));
    const setError = (el, msg) => { el.setAttribute('aria-invalid', msg ? 'true' : 'false'); form.querySelector(`#${el.id}-err`).textContent = msg || ''; };
    Object.values(fields).forEach(({ el, check }) => {
      el.addEventListener('blur', () => el.value && setError(el, check(el.value)));
      el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && setError(el, check(el.value)));
    });

    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => lastFocus && lastFocus.focus());

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const errors = [];
      const active = [...(quick ? [] : Object.values(fields)), ...Object.values(checks)];
      active.forEach(({ el, check }) => { const m = check(el.value, el); setError(el, m); if (m) errors.push({ el, m }); });
      if (errors.length) {
        summary.innerHTML = `<p class="font-semibold mb-1">יש ${errors.length === 1 ? 'שדה אחד' : `${errors.length} שדות`} לתיקון:</p><ul class="list-disc ps-5">${errors.map(({ el, m }) => `<li><a class="underline" href="#${el.id}">${m}</a></li>`).join('')}</ul>`;
        summary.classList.remove('hidden');
        summary.querySelectorAll('a').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); form.querySelector(a.getAttribute('href')).focus(); }));
        (errors.length > 1 ? summary : errors[0].el).focus();
        return;
      }
      summary.classList.add('hidden');
      if (quick) { whatsapp(current); dlg.close(); return; }
      const fd = new FormData(form);
      const customer = { name: fd.get('name').trim(), phone: fd.get('phone').trim(), city: fd.get('city').trim(), notes: fd.get('notes').trim() };
      if ((e.submitter?.dataset.channel || 'whatsapp') === 'email') {
        const body = [...specText(current), '', `שם: ${customer.name}`, `טלפון: ${customer.phone}`, `עיר: ${customer.city}`, customer.notes ? `הערות: ${customer.notes}` : ''].join('\n');
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`הזמנה מהאתר: ${current.title}`)}&body=${encodeURIComponent(body)}`;
      } else {
        whatsapp(current, customer);
      }
      dlg.close();
    });
  };

  window.RCOrder = {
    open(order, opts = {}) {
      if (!dlg) build();
      current = order;
      quick = !!opts.quick;
      const form = dlg.querySelector('form');
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.setAttribute('aria-invalid', 'false'));
      form.querySelectorAll('.field-error').forEach((p) => { p.textContent = ''; });
      dlg.querySelector('[data-summary-err]').classList.add('hidden');
      dlg.querySelector('[data-customer]').classList.toggle('hidden', quick);
      dlg.querySelector('[data-email-btn]').classList.toggle('hidden', quick);
      dlg.querySelector('[data-custom-wrap]').classList.toggle('hidden', !order.custom);
      dlg.querySelector('#orderTitle').textContent = quick ? 'שליחה בוואטסאפ' : 'שליחת הזמנה';
      lastFocus = document.activeElement;
      dlg.querySelector('[data-spec]').innerHTML = `
        <p class="font-bold mb-2">${esc(order.title)}</p>
        <ul class="cfg-sum-list !mt-0">${order.lines.map(([k, v]) => `<li><span class="text-muted">${esc(k)}</span><span class="cfg-sum-val">${esc(v)}</span></li>`).join('')}</ul>
        <div class="flex justify-between items-baseline mt-3"><span class="font-semibold">${esc(order.totalLabel || 'מחיר משוער')}</span><strong class="price tabular">${esc(order.total)}</strong></div>
        <p class="vat-note">המחירים כוללים מע״מ</p>
        ${order.production ? `<p class="text-xs text-muted mt-1">${esc(order.production)}</p>` : ''}`;
      dlg.showModal();
      dlg.querySelector(quick ? '#o-terms' : '#o-name').focus();
    },
    whatsapp: (order) => window.RCOrder.open(order, { quick: true }),
  };
})();
