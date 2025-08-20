/* Hyvä-friendly bootstrapping: partials + menu init */

async function injectPartial(el, name) {
  try {
    // Prefer relative path (works on file://), but fall back to absolute from site root
    const paths = name.startsWith('components/')
      ? [ `${name}.html`, `/${name}.html` ]
      : [ `partials/${name}.html`, `/partials/${name}.html` ];
    for (const path of paths) {
      try {
        const res = await fetch(path, { cache: 'no-store' });
        if (res && res.ok) {
          const html = await res.text();
          el.outerHTML = html;
          return;
        }
      } catch {}
    }
  } catch {}
}

async function loadPartials() {
  // In Hyvä, header/footer are loaded via PHTML; partial injection can be disabled
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');
  if (headerPh) await injectPartial(headerPh, 'header');
  if (footerPh) await injectPartial(footerPh, 'footer');

  // Generic component placeholders (support nested placeholders introduced by injected partials)
  let safety = 0;
  while (safety < 3) { // limit recursion depth
    const blocks = Array.from(document.querySelectorAll('[data-partial]'));
    if (blocks.length === 0) break;
    await Promise.all(blocks.map((el) => injectPartial(el, el.getAttribute('data-partial'))));
    safety += 1;
  }

  // Notify others that partials are loaded
  try { document.dispatchEvent(new CustomEvent('partials:loaded')); } catch {}

  // Minicart toggle (prototype only) – to be replaced by Hyvä minicart
  const openers = document.querySelectorAll('[data-open="minicart"]');
  const minicart = document.getElementById('minicart');
  if (minicart && openers.length) {
    const closeButtons = minicart.querySelectorAll('[data-close="minicart"]');
    const open = () => minicart.classList.remove('hidden');
    const close = () => minicart.classList.add('hidden');
    try { if (!window.openMinicart) window.openMinicart = open; } catch {}
    openers.forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (window.RemkaCart && typeof window.RemkaCart.count === 'function') {
          if (window.RemkaCart.count() > 0) open();
          else open(); // also show empty minicart if there are no items
        } else {
          open();
        }
      } catch { open(); }
    }));
    closeButtons.forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); close(); }));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();
  // Footer safety net: if footer failed to inject, add minimal divider bar
  try {
    const hasFooter = !!document.querySelector('footer.footer-premium');
    const ph = document.getElementById('footer-placeholder');
    if (!hasFooter && ph) {
      const year = new Date().getFullYear();
      const div = document.createElement('div');
      div.innerHTML = `
        <footer class="footer-premium" role="contentinfo">
          <div class="footer-divider">
            <div class="container mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
              <div class="text-sm text-dark/70">© <span id="year">${year}</span> Remka B.V.</div>
              <div class="flex items-center gap-3 opacity-80">
                <img class="h-6 w-auto" src="/assets/images/payment-icons/ideal-logo.webp" alt="iDEAL" loading="lazy" decoding="async" />
                <img class="h-6 w-auto" src="/assets/images/payment-icons/Bancontact-logo.webp" alt="Bancontact" loading="lazy" decoding="async" />
                <img class="h-6 w-auto" src="/assets/images/payment-icons/Visa_Brandmark_Blue_RGB_2021.webp" alt="Visa" loading="lazy" decoding="async" />
                <img class="h-6 w-auto" src="/assets/images/payment-icons/ma_symbol_rgb.webp" alt="Mastercard" loading="lazy" decoding="async" />
                <img class="h-6 w-auto" src="/assets/images/payment-icons/PayPal-logo.webp" alt="PayPal" loading="lazy" decoding="async" />
                <img class="h-6 w-auto" src="/assets/images/payment-icons/Apple-Pay-Logo.webp" alt="Apple Pay" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </footer>`;
      ph.replaceWith(div.firstElementChild);
    }
  } catch {}
  // Ensure Subfooter is present even if nested partial injection didn't run
  try {
    const hasSubfooter = !!document.querySelector('.subfooter');
    const footerEl = document.querySelector('footer.footer-premium');
    if (!hasSubfooter && footerEl) {
      let html = '';
      try {
        const res = await fetch('partials/subfooter.html', { cache: 'no-store' });
        if (res && res.ok) html = await res.text();
      } catch {}
      if (html) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        const el = wrapper.firstElementChild;
        if (el) {
          footerEl.insertAdjacentElement('afterend', el);
          // Set current year for subfooter if placeholder present
          const y = el.querySelector('[data-year]');
          if (y) y.textContent = String(new Date().getFullYear());
        }
      }
    }
  } catch {}
  // Compute sticky offset so sticky sidebars (TOCs) never sit under the header
  try {
    const header = document.getElementById('site-header');
    const root = document.documentElement;
    const compute = () => {
      const h = header ? header.getBoundingClientRect().height : 0;
      root.style.setProperty('--sticky-offset', (h + 8) + 'px'); // small extra gap
    };
    compute();
    const ro = new (window.ResizeObserver || function(fn){ return { observe(){}, disconnect(){} }; })(() => compute());
    if (header && ro.observe) ro.observe(header);
    window.addEventListener('resize', compute);
    document.addEventListener('partials:loaded', compute);
  } catch {}
  // Let menu.js initialize itself after partials:loaded to avoid double init
  try {
    const y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());
  } catch {}
  // Unobtrusive demo form handlers (replace inline onsubmit)
  try {
    document.querySelectorAll('form[data-navigate]')
      .forEach((form) => {
        if (form.dataset.bound) return;
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const to = form.getAttribute('data-navigate');
          if (to) window.location.href = to;
        });
        form.dataset.bound = '1';
      });
  } catch {}
  // FAQ accordion delegation (removed inline script from faq.html)
  try {
    document.addEventListener('click', function(e){
      const btn = e.target.closest && e.target.closest('button[id^="tab-"]');
      if(!btn) return;
      const panelId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if(panel) panel.hidden = expanded;
    });
  } catch {}

  // Footer newsletter removed

  // Login/Register success toast (prototype only)
  try {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        try { window.toast && window.toast.success('Ingelogd'); } catch {}
        setTimeout(() => { window.location.href = 'account-dashboard.html'; }, 300);
      });
    }
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      // Minimal UX for business vs consumer fields
      const typeRadios = registerForm.querySelectorAll('input[name="accountType"]');
      const bizIntro = document.getElementById('bizIntro');
      const bizAddressRow = document.getElementById('bizAddressRow');
      const bizAddressConfirm = document.getElementById('bizAddressConfirm');
      const company = document.getElementById('company');
      const kvk = document.getElementById('kvk');
      const vat = document.getElementById('vat');
      const vatHint = document.getElementById('vatHint');
      const onAccountRequest = document.getElementById('onAccountRequest');

      function setBusinessRequired(isBiz){
        if (!company || !kvk || !vat || !bizAddressRow || !bizIntro) return;
        company.required = isBiz;
        kvk.required = isBiz;
        vat.required = isBiz;
        bizIntro.hidden = !isBiz;
        bizAddressRow.hidden = !isBiz;
        if (!isBiz) {
          bizAddressConfirm.checked = false;
          vat.setCustomValidity('');
          if (vatHint) vatHint.textContent = '';
        }
      }

      function getAccountType(){
        const checked = Array.from(typeRadios).find(r => r.checked);
        return checked ? checked.value : 'consumer';
      }

      typeRadios.forEach(r => r.addEventListener('change', () => setBusinessRequired(getAccountType()==='business')));
      setBusinessRequired(getAccountType()==='business');

      // Very lightweight VAT pattern hint (not a real validation)
      if (vat && vatHint) {
        vat.addEventListener('input', () => {
          const v = (vat.value || '').trim().toUpperCase();
          const looksNl = /^NL[0-9]{9}B[0-9]{2}$/.test(v);
          if (!v) { vatHint.textContent = ''; return; }
          vatHint.textContent = looksNl ? 'Btw-nummer lijkt geldig van formaat (NL).' : 'Controleer het formaat. Voor NL: NL123456789B01';
        });
      }

      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simple client-side guard for business address confirm
        if (getAccountType() === 'business' && bizAddressRow && !bizAddressConfirm.checked) {
          try { window.toast && window.toast.warning('Bevestig dat je met een zakelijk adres registreert.'); } catch {}
          bizAddressConfirm.focus();
          return;
        }
        // Simulate request/notification for on-account requests
        if (onAccountRequest && onAccountRequest.checked) {
          // In Magento/Hyvä: trigger email to sales/admin; here we just toast
          try { window.toast && window.toast.info('Aanvraag "betalen op rekening" verzonden.'); } catch {}
        }
        try { window.toast && window.toast.success('Account aangemaakt'); } catch {}
        setTimeout(() => { window.location.href = 'account-dashboard.html'; }, 300);
      });
    }
  } catch {}

  // Removed dynamic image catalog per request
});

// --- Demo account/auth removed for Hyvä ---
/* const RemkaAuth = (() => {
  const AUTH_KEY = 'remka_demo_auth';
  const USER_KEY = 'remka_demo_user';

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function seedDemoUserIfNeeded() {
    if (read(USER_KEY)) return;
    const demoUser = {
      id: '100001',
      firstName: 'Sanne',
      lastName: 'Jansen',
      email: 'sanne.jansen@example.com',
      company: 'Huisartsenpraktijk Parklaan',
      kvk: '12345678',
      vat: 'NL123456789B01',
      newsletter: true,
      addresses: [
        { id: 'addr1', type: 'shipping', firstName: 'Sanne', lastName: 'Jansen', company: 'Huisartsenpraktijk Parklaan', street: 'Parklaan 12', postcode: '2512 AB', city: 'Den Haag', country: 'NL', phone: '+31 70 123 4567', isDefault: true },
        { id: 'addr2', type: 'billing', firstName: 'Sanne', lastName: 'Jansen', company: 'Huisartsenpraktijk Parklaan', street: 'Parklaan 12', postcode: '2512 AB', city: 'Den Haag', country: 'NL', phone: '+31 70 123 4567', isDefault: true }
      ],
      orders: [
        { id: '200000001', incrementId: '200000001', date: '2024-06-12', status: 'Verzonden', total: 248.50, currency: 'EUR', shippingMethod: 'DHL – Zakelijk', paymentMethod: 'iDEAL', items: [ { sku: 'KAI-HP-4', name: 'KAI huidcurette 4 mm', qty: 2, price: 19.95, thumb: '/assets/images/kai_biopsy_punch_4.jpg' }, { sku: 'HART-37971', name: 'Hartmann Verband 10x10', qty: 5, price: 12.90, thumb: '/assets/images/Products/Hartmann/37971_43.jpg' } ], invoices: ['000000123'], creditmemos: [] },
        { id: '200000002', incrementId: '200000002', date: '2024-07-03', status: 'In behandeling', total: 92.10, currency: 'EUR', shippingMethod: 'DHL – Zakelijk', paymentMethod: 'Op rekening', items: [ { sku: 'HEINE-EN200', name: 'HEINE EN 200 powersource', qty: 1, price: 89.00, thumb: '/assets/images/Products/HEINE/A-095.12.218-HEINE-PowerSource-EN200-main.jpg' } ], invoices: [], creditmemos: [] }
      ],
      invoices: [ { number: '000000123', date: '2024-06-13', order: '200000001', amount: 248.50, currency: 'EUR', pdf: '#' } ],
      creditmemos: [],
      wishlist: [ { sku: 'SECA-213', name: 'seca 213 mobiele lengtemeter', price: 59.00, link: '/product.html', thumb: '/assets/images/placeholder-4x3.svg' }, { sku: 'SCHUELKE-STER', name: 'Schülke Sterillium 500ml', price: 7.95, link: '/product.html', thumb: '/assets/images/placeholder-4x3.svg' } ],
      reviews: [ { sku: 'KAI-HP-4', name: 'KAI huidcurette 4 mm', rating: 5, title: 'Uitstekend product', text: 'Scherp en precies, snelle levering.', date: '2024-05-22' } ],
      requisitionLists: [
        { id: 'rl-1', name: 'Maandelijkse verbruiksartikelen', createdAt: '2024-04-01', items: [ { sku: 'HART-37971', name: 'Hartmann Verband 10x10', qty: 10 }, { sku: 'SCHUELKE-STER', name: 'Schülke Sterillium 500ml', qty: 6 } ] },
        { id: 'rl-2', name: 'Instrumenten onderhoud', createdAt: '2024-03-15', items: [ { sku: 'HEINE-EN200', name: 'HEINE EN 200 powersource', qty: 1 } ] }
      ]
    };
    write(USER_KEY, demoUser);
  }

  function getUser() { return read(USER_KEY); }
  function setUser(user) { write(USER_KEY, user); }
  function isLoggedIn() { const a = read(AUTH_KEY); return !!(a && a.loggedIn && a.userEmail); }
  function login(email, _password) {
    const user = getUser();
    if (user && user.email.toLowerCase() === String(email || '').toLowerCase()) {
      write(AUTH_KEY, { loggedIn: true, userEmail: user.email });
      return { ok: true };
    }
    write(USER_KEY, { ...getUser(), email: email || 'demo@example.com' });
    write(AUTH_KEY, { loggedIn: true, userEmail: email || 'demo@example.com' });
    return { ok: true };
  }
  function logout() { write(AUTH_KEY, { loggedIn: false }); }

  function updateHeaderAccountLink() {
    const link = document.querySelector('[data-account-link]');
    const label = document.querySelector('[data-account-label]');
    if (!link || !label) return;
    if (isLoggedIn()) {
      link.setAttribute('href', 'account-dashboard.html');
      label.textContent = 'Mijn account';
      link.setAttribute('aria-label', 'Ga naar mijn account');
    } else {
      link.setAttribute('href', 'account-login.html');
      label.textContent = 'Inloggen';
      link.setAttribute('aria-label', 'Inloggen of account');
    }
  }

  function guardAccountRoutes() {
    // Demo: auth guard disabled so all account pages are accessible without login
    return;
  }

  function wireForms() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[name="email"]').value;
        const password = loginForm.querySelector('input[name="password"]').value;
        const res = login(email, password);
        if (res.ok) { location.href = 'account-dashboard.html'; }
      });
    }
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const firstName = registerForm.querySelector('input[name="firstName"]').value;
        const lastName = registerForm.querySelector('input[name="lastName"]').value;
        const email = registerForm.querySelector('input[name="email"]').value;
        const company = registerForm.querySelector('input[name="company"]').value;
        const kvk = registerForm.querySelector('input[name="kvk"]').value;
        const vat = registerForm.querySelector('input[name="vat"]').value;
        seedDemoUserIfNeeded();
        const user = { ...getUser(), firstName, lastName, email, company, kvk, vat };
        setUser(user);
        write(AUTH_KEY, { loggedIn: true, userEmail: email });
        location.href = 'account-dashboard.html';
      });
    }
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const success = document.getElementById('forgotSuccess');
        if (success) success.classList.remove('hidden');
      });
    }
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        location.href = 'account-login.html';
      });
    }
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        updateHeaderAccountLink();
        location.href = 'account-login.html';
      });
    }
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
      const user = getUser();
      if (user) {
        personalForm.querySelector('input[name="firstName"]').value = user.firstName || '';
        personalForm.querySelector('input[name="lastName"]').value = user.lastName || '';
        personalForm.querySelector('input[name="email"]').value = user.email || '';
      }
      personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userNow = { ...getUser(),
          firstName: personalForm.querySelector('input[name="firstName"]').value,
          lastName: personalForm.querySelector('input[name="lastName"]').value,
          email: personalForm.querySelector('input[name="email"]').value
        };
        setUser(userNow);
        const note = document.getElementById('personalSaved');
        if (note) note.classList.remove('hidden');
      });
    }
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
      const user = getUser();
      const checkbox = newsletterForm.querySelector('input[name="newsletter"]');
      if (user && checkbox) checkbox.checked = !!user.newsletter;
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userNow = { ...getUser(), newsletter: !!checkbox.checked };
        setUser(userNow);
        const note = document.getElementById('newsletterSaved');
        if (note) note.classList.remove('hidden');
      });
    }
  }

  function renderers() {
    const user = getUser();
    const nameEl = document.getElementById('accountName');
    if (nameEl && user) nameEl.textContent = `${user.firstName} ${user.lastName}`.trim();
    const emailEl = document.getElementById('accountEmail');
    if (emailEl && user) emailEl.textContent = user.email;
    const addrList = document.getElementById('addressList');
    if (addrList && user) {
      addrList.innerHTML = '';
      user.addresses.forEach((a) => {
        const div = document.createElement('div');
        div.className = 'card p-4';
        const def = a.isDefault ? '<span class="badge badge--ok">Standaard</span>' : '';
        div.innerHTML = `<div class=\"flex items-start justify-between gap-4\">\n            <div>\n              <div class=\"font-semibold\">${a.firstName} ${a.lastName}</div>\n              <div class=\"text-sm text-dark/70\">${a.company || ''}</div>\n              <div class=\"text-sm text-dark/70\">${a.street}, ${a.postcode} ${a.city}</div>\n              <div class=\"text-sm text-dark/70\">${a.country}</div>\n              <div class=\"text-sm text-dark/70\">${a.phone || ''}</div>\n            </div>\n            ${def}\n          </div>`;
        addrList.appendChild(div);
      });
    }
    const ordersTbody = document.getElementById('ordersTableBody');
    if (ordersTbody && user) {
      ordersTbody.innerHTML = '';
      user.orders.forEach((o) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class=\"py-2 px-3 font-semibold\">#${o.incrementId}</td>\n                        <td class=\"py-2 px-3\">${o.date}</td>\n                        <td class=\"py-2 px-3\">${o.status}</td>\n                        <td class=\"py-2 px-3\">€ ${o.total.toFixed(2)}</td>\n                        <td class=\"py-2 px-3 text-right\"><a class=\"link-cta\" href=\"account-order-detail.html?id=${o.id}\">Details</a></td>`;
        ordersTbody.appendChild(tr);
      });
    }
    const wishlistGrid = document.getElementById('wishlistGrid');
    if (wishlistGrid && user) {
      wishlistGrid.innerHTML = '';
      user.wishlist.forEach((w) => {
        const a = document.createElement('a');
        a.href = w.link;
        a.className = 'card card--hover p-4 flex items-center gap-4';
        a.innerHTML = `<img src=\"${w.thumb}\" alt=\"${w.name}\" loading=\"lazy\" decoding=\"async\" width=\"64\" height=\"64\" class=\"w-16 h-16 object-contain border border-light rounded\"/>\n                       <div class=\"flex-1\"><div class=\"font-semibold\">${w.name}</div><div class=\"text-sm text-dark/70\">SKU: ${w.sku}</div></div>\n                       <div class=\"font-semibold\">€ ${w.price.toFixed(2)}</div>`;
        wishlistGrid.appendChild(a);
      });
    }
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList && user) {
      reviewsList.innerHTML = '';
      user.reviews.forEach((r) => {
        const li = document.createElement('li');
        li.className = 'card p-4';
        li.innerHTML = `<div class=\"font-semibold\">${r.title}</div>\n                        <div class=\"text-sm text-dark/70\">${r.name} – ${r.date}</div>\n                        <div class=\"text-sm\">${r.text}</div>`;
        reviewsList.appendChild(li);
      });
    }
    const invoicesTbody = document.getElementById('invoicesTableBody');
    if (invoicesTbody && user) {
      invoicesTbody.innerHTML = '';
      user.invoices.forEach((inv) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class=\"py-2 px-3 font-semibold\">${inv.number}</td>\n                        <td class=\"py-2 px-3\">${inv.date}</td>\n                        <td class=\"py-2 px-3\">Order #${inv.order}</td>\n                        <td class=\"py-2 px-3\">€ ${inv.amount.toFixed(2)}</td>\n                        <td class=\"py-2 px-3 text-right\"><a class=\"link-cta\" href=\"${inv.pdf}\">Download</a></td>`;
        invoicesTbody.appendChild(tr);
      });
    }
    const rlList = document.getElementById('requisitionLists');
    if (rlList && user) {
      rlList.innerHTML = '';
      user.requisitionLists.forEach((list) => {
        const div = document.createElement('div');
        div.className = 'card p-4';
        div.innerHTML = `<div class=\"flex items-start justify-between\">\n            <div>\n              <div class=\"font-semibold\">${list.name}</div>\n              <div class=\"text-sm text-dark/70\">Aangemaakt: ${list.createdAt} • ${list.items.length} artikelen</div>\n            </div>\n            <a href=\"#\" class=\"btn btn-outline\">In winkelwagen</a>\n          </div>`;
        rlList.appendChild(div);
      });
    }
    const companyEl = document.getElementById('companyInfo');
    if (companyEl && user) {
      companyEl.innerHTML = `<div class=\"card p-4\">\n        <div class=\"grid md:grid-cols-2 gap-4\">\n          <div><div class=\"text-sm text-dark/70\">Bedrijfsnaam</div><div class=\"font-semibold\">${user.company || '-'}</div></div>\n          <div><div class=\"text-sm text-dark/70\">KvK-nummer</div><div class=\"font-semibold\">${user.kvk || '-'}</div></div>\n          <div><div class=\"text-sm text-dark/70\">btw-nummer</div><div class=\"font-semibold\">${user.vat || '-'}</div></div>\n          <div><div class=\"text-sm text-dark/70\">E-mailadres</div><div class=\"font-semibold\">${user.email}</div></div>\n        </div>\n      </div>`;
    }
    const orderDetail = document.getElementById('orderDetail');
    if (orderDetail && user) {
      const url = new URL(location.href);
      const id = url.searchParams.get('id');
      const o = user.orders.find(x => x.id === id) || user.orders[0];
      if (o) {
        const itemsRows = o.items.map(i => `<tr>\n            <td class=\"py-2 px-3\">${i.name}<div class=\"text-sm text-dark/70\">SKU: ${i.sku}</div></td>\n            <td class=\"py-2 px-3\">${i.qty}</td>\n            <td class=\"py-2 px-3\">€ ${i.price.toFixed(2)}</td>\n            <td class=\"py-2 px-3\">€ ${(i.qty * i.price).toFixed(2)}</td>\n          </tr>`).join('');
        orderDetail.innerHTML = `\n          <div class=\"flex items-center justify-between\">\n            <div>\n              <div class=\"font-extrabold text-xl\">Bestelling #${o.incrementId}</div>\n              <div class=\"text-sm text-dark/70\">${o.date} • ${o.status}</div>\n            </div>\n            <div class=\"text-right font-semibold\">Totaal: € ${o.total.toFixed(2)}</div>\n          </div>\n          <div class=\"mt-4 overflow-auto\">\n            <table class=\"min-w-full text-sm\">\n              <thead><tr><th class=\"text-left py-2 px-3\">Product</th><th class=\"text-left py-2 px-3\">Aantal</th><th class=\"text-left py-2 px-3\">Prijs</th><th class=\"text-left py-2 px-3\">Subtotaal</th></tr></thead>\n              <tbody>${itemsRows}</tbody>\n            </table>\n          </div>`;
      }
    }
  }

  function init() {
    seedDemoUserIfNeeded();
    updateHeaderAccountLink();
    guardAccountRoutes();
    wireForms();
    renderers();
    document.addEventListener('partials:loaded', () => {
      updateHeaderAccountLink();
      wireForms();
      renderers();
    });
  }

  return { init, isLoggedIn, getUser };
})(); */