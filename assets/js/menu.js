// Header + Menu (Hyvä-ready) – modulair, A11y-first, data-gedreven
(function () {
  // Helpers
  const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, audio[controls], video[controls], [contenteditable], [tabindex]:not([tabindex="-1"])';
  const slugify = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const debounce = (fn, ms = 150) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), ms); }; };
  const trapFocus = (container) => {
    if (!container) return () => {};
    const previouslyFocused = document.activeElement;
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null || el === container);
    const first = () => focusables()[0];
    const last = () => focusables()[focusables().length - 1];
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const active = document.activeElement; const firstEl = f[0]; const lastEl = f[f.length - 1];
      if (e.shiftKey && (active === firstEl || active === container)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && (active === lastEl)) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { (first() || container).focus(); });
    return () => { document.removeEventListener('keydown', onKey); if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus(); };
  };

  const withSlugs = (node) => ({
    name: node.name,
    slug: node.slug || slugify(node.name || ''),
    children: Array.isArray(node.children) ? node.children.map(withSlugs) : []
  });

  const RemkaHeader = {
    state: {
      data: [],
      mobileCloser: null,
      offcanvasUntrap: null,
      lastScrollY: 0,
      hidden: false,
    },

    ensureScaffold() {
      let header = document.querySelector('header[role="banner"]');
      if (!header) {
        header = document.createElement('header');
        header.setAttribute('role','banner');
        header.className = 'sticky top-0 z-50 bg-white header-shadow';
        header.innerHTML = '' +
          '<div class="border-b border-light px-4 py-4 flex items-center gap-3">' +
          '  <button type="button" class="md:hidden p-2 rounded-md border border-light" aria-label="Menu" aria-controls="offcanvas" aria-expanded="false" data-nav-toggle>' +
          '    <span class="block w-5 h-0.5 bg-dark mb-1"></span>' +
          '    <span class="block w-5 h-0.5 bg-dark mb-1"></span>' +
          '    <span class="block w-5 h-0.5 bg-dark"></span>' +
          '  </button>' +
          '  <a href="index.html" class="inline-flex items-center" aria-label="Home">Remka</a>' +
          '  <div class="ml-auto flex items-center gap-2">' +
          '    <button type="button" class="header-action header-cart focus-ring js-mini-cart-toggle" aria-label="Winkelmand" data-cart-toggle><span class="header-badge">0</span></button>' +
          '  </div>' +
          '</div>' +
          '<nav id="mainNav" class="hidden md:block bg-brand text-white" aria-label="Hoofdmenu">' +
          '  <ul id="menuRoot" class="flex items-center gap-2 md:gap-4 text-sm font-semibold py-2" role="menubar" aria-label="Hoofdmenu"></ul>' +
          '</nav>' +
          '<div id="megaHost" class="hidden md:block"></div>';
        const main = document.querySelector('main') || document.body.firstChild;
        document.body.insertBefore(header, main);
      }
      if (!document.getElementById('mainNav')) {
        const nav = document.createElement('nav');
        nav.id = 'mainNav'; nav.className = 'hidden md:block bg-brand text-white'; nav.setAttribute('aria-label','Hoofdmenu');
        nav.innerHTML = '<ul id="menuRoot" class="flex items-center gap-2 md:gap-4 text-sm font-semibold py-2" role="menubar" aria-label="Hoofdmenu"></ul>';
        header.appendChild(nav);
      }
      if (!document.getElementById('megaHost')) {
        const host = document.createElement('div'); host.id = 'megaHost'; host.className = 'hidden md:block'; header.appendChild(host);
      }
      if (!document.getElementById('offcanvas')) {
        const off = document.createElement('div');
        off.id = 'offcanvas'; off.className = 'fixed inset-0 z-50 hidden'; off.setAttribute('aria-hidden','true');
        off.innerHTML = '<div class="absolute inset-0 bg-black/40" data-close="offcanvas" aria-hidden="true"></div>' +
          '<aside class="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-2xl overflow-y-auto offcanvas-panel" role="dialog" aria-modal="true" aria-label="Mobiel menu">' +
          '  <div class="p-4 border-b border-light flex items-center justify-between sticky top-0 bg-white z-10">' +
          '    <h2 class="text-base font-bold">Menu</h2>' +
          '    <button class="p-2 rounded-md border border-light" data-close="offcanvas" aria-label="Sluiten">✕</button>' +
          '  </div>' +
          '  <div class="p-3 border-b border-light">' +
          '    <input type="search" placeholder="Zoek in menu" class="w-full rounded-md border border-light px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal" />' +
          '  </div>' +
          '  <div id="mobileMenu" class="p-2" role="menu" aria-label="Mobiel menu"></div>' +
          '</aside>';
        header.appendChild(off);
      }
      if (!header.querySelector('[data-nav-toggle]')) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'md:hidden p-2 rounded-md border border-light';
        btn.setAttribute('aria-label','Menu'); btn.setAttribute('aria-controls','offcanvas'); btn.setAttribute('aria-expanded','false');
        btn.setAttribute('data-nav-toggle','');
        const bar = header.firstElementChild || header;
        bar.insertBefore(btn, bar.firstChild);
      }
    },

    // Text formatting respecting user capitalization preferences
    formatName(raw) {
      const s = String(raw || '').trim();
      if (!s) return '';
      let out = s.toLowerCase();
      const replacements = [
        ['ecg', 'ECG'], ['crp', 'CRP'], ['hba1c', 'HbA1c'], ['aed', 'AED'], ['kno', 'KNO'], ['ph ', 'pH '], ['ph-', 'pH-'], ['covid-19', 'COVID-19']
      ];
      replacements.forEach(([k, v]) => { out = out.replace(new RegExp(k, 'g'), v); });
      return out.charAt(0).toUpperCase() + out.slice(1);
    },
    formatMidName(raw) {
      let out = String(raw || '').trim().toLowerCase();
      const reps = [
        ['ecg', 'ECG'], ['crp', 'CRP'], ['hba1c', 'HbA1c'], ['aed', 'AED'], ['kno', 'KNO'], ['ph ', 'pH '], ['ph-', 'pH-'], ['covid-19', 'COVID-19']
      ];
      reps.forEach(([k, v]) => { out = out.replace(new RegExp(k, 'g'), v); });
      return out;
    },
    create(tag, props = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([k, v]) => {
        if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else el.setAttribute(k, v);
      });
      children.forEach(c => el.appendChild(c));
      return el;
    },

    async loadData() {
      // In Hyvä/Magento: menu wordt server-side gerenderd; JS gebruikt alleen voor interactiviteit.
      // Laat state leeg; renderers gaan uit van bestaande markup of eenvoudige items.
      this.state.data = [];
    },

    renderDesktop() {
      const root = document.getElementById('menuRoot');
      const host = document.getElementById('megaHost');
      const nav = document.getElementById('mainNav');
      if (!root) return;
      root.innerHTML = '';
      if (host) host.innerHTML = '';
      // Ensure host sits right below nav for alignment
      if (host && nav && nav.nextElementSibling !== host) {
        nav.parentNode.insertBefore(host, nav.nextSibling);
      }

      // Hyvä-ready: als er geen menu-data is (prototype), verberg de menubalk volledig
      if (!this.state.data || this.state.data.length === 0) {
        if (nav) nav.classList.add('hidden');
        if (host) host.classList.add('hidden');
        return;
      }

      this.state.data.forEach((cat, i) => {
        const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
        const li = this.create('li', { role: 'none' });

        if (!hasChildren || !host) {
          const a = this.create('a', { href: `/category.html?c=${encodeURIComponent(cat.slug)}`, class: 'nav-link-premium', role: 'menuitem', tabindex: '0' });
          a.textContent = this.formatName(cat.name); li.appendChild(a); root.appendChild(li); return;
        }

        const btn = this.create('a', { href: `/category.html?c=${encodeURIComponent(cat.slug)}`, class: 'nav-link-premium', role: 'menuitem', 'data-idx': String(i), 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': `mega-${i}`, tabindex: '0' });
        btn.textContent = this.formatName(cat.name); li.appendChild(btn); root.appendChild(li);

        const panel = this.create('div', { id: `mega-${i}`, class: 'absolute left-0 right-0 mx-auto container-wide px-4 hidden', role: 'region', 'aria-label': cat.name, 'data-mega-panel': 'true' });
        const card = this.create('div', { class: 'mega-panel mt-3', role: 'group' });
        const grid = this.create('div', { class: 'mega-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-8' });

        cat.children.forEach(group => {
          const col = this.create('div', { class: 'mega-col' });
          const h = this.create('h3', { class: 'mega-heading text-dark/70' }); h.textContent = this.formatName(group.name); col.appendChild(h);
          const ul = this.create('ul', { class: 'mega-list mt-3 space-y-1' });
          if (group.slug) {
            const all = this.create('a', { href: `/category.html?c=${encodeURIComponent(group.slug)}`, class: 'mega-link mega-link--all' }); all.textContent = `Alles in ${this.formatMidName(group.name)}`;
            ul.appendChild(this.create('li', {}, [all]));
          }
          (group.children || []).forEach(sub => {
            const a = this.create('a', { href: `/subcategory.html?c=${encodeURIComponent(sub.slug || slugify(sub.name))}`, class: 'mega-link' }); a.textContent = this.formatName(sub.name);
            ul.appendChild(this.create('li', {}, [a]));
          });
          col.appendChild(ul); grid.appendChild(col);
        });
        card.appendChild(grid); panel.appendChild(card); host && host.appendChild(panel);
      });

      // Only product categories in the main nav

      const buttons = root.querySelectorAll('[data-idx][aria-haspopup="true"]');
      let openIdx = -1;
      const hideAll = () => {
        buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (host) host.querySelectorAll('[id^="mega-"]').forEach(p => { p.classList.add('hidden'); p.removeAttribute('data-open'); });
        openIdx = -1;
      };
      const open = (i) => {
        if (!host) return; hideAll();
        const btn = root.querySelector(`[data-idx="${i}"]`);
        const panel = document.getElementById(`mega-${i}`);
        if (btn && panel) { btn.setAttribute('aria-expanded', 'true'); panel.classList.remove('hidden'); panel.dataset.open = 'true'; openIdx = i; }
      };
      buttons.forEach((btn, i) => {
        btn.addEventListener('mouseenter', () => open(i));
        btn.addEventListener('focus', () => open(i));
        btn.addEventListener('click', () => (openIdx === i ? hideAll() : open(i)));
        btn.addEventListener('keydown', (e) => {
          const max = buttons.length - 1;
          if (e.key === 'ArrowRight') { e.preventDefault(); buttons[Math.min(i + 1, max)].focus(); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); buttons[Math.max(i - 1, 0)].focus(); }
          if (e.key === 'Escape') { hideAll(); btn.focus(); }
          if (e.key === 'ArrowDown') { e.preventDefault(); const firstLink = document.querySelector(`#mega-${i} a`); firstLink && firstLink.focus(); }
        });
      });
      if (host) {
        host.addEventListener('mouseleave', hideAll);
        document.addEventListener('click', (e) => { if (!host.contains(e.target) && !root.contains(e.target)) hideAll(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideAll(); });
      }
    },

    renderMobile() {
      let wrap = document.getElementById('mobileMenu');
      let offcanvas = document.getElementById('offcanvas');
      const toggles = document.querySelectorAll('[data-nav-toggle]');
      // Fallback: als offcanvas ontbreekt (bijv. partial niet geladen), maak een minimale versie
      if (!offcanvas) {
        offcanvas = document.createElement('div');
        offcanvas.id = 'offcanvas';
        offcanvas.className = 'fixed inset-0 z-50 hidden';
        offcanvas.setAttribute('aria-hidden','true');
        offcanvas.innerHTML = '<div class="absolute inset-0 bg-black/40" data-close="offcanvas" aria-hidden="true"></div>' +
          '<aside class="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-2xl overflow-y-auto offcanvas-panel" role="dialog" aria-modal="true" aria-label="Mobiel menu">' +
          '  <div class="p-4 border-b border-light flex items-center justify-between sticky top-0 bg-white z-10">' +
          '    <h2 class="text-base font-bold">Menu</h2>' +
          '    <button class="p-2 rounded-md border border-light" data-close="offcanvas" aria-label="Sluiten">✕</button>' +
          '  </div>' +
          '  <div class="p-3 border-b border-light">' +
          '    <input type="search" placeholder="Zoek in menu" class="w-full rounded-md border border-light px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal" />' +
          '  </div>' +
          '  <div id="mobileMenu" class="p-2" role="menu" aria-label="Mobiel menu"></div>' +
          '</aside>';
        document.body.appendChild(offcanvas);
      }
      if (!wrap) wrap = offcanvas.querySelector('#mobileMenu');
      wrap.innerHTML = '';

      // Geen data? Houd offcanvas verborgen en doe niets
      if (!this.state.data || this.state.data.length === 0) {
        if (offcanvas) offcanvas.classList.add('hidden');
        return;
      }

      this.state.data.forEach((cat, i) => {
        const hasChildren = cat.children && cat.children.length > 0;
        if (!hasChildren) {
          const a = this.create('a', { href:`/category.html?c=${encodeURIComponent(cat.slug)}`, class:'block px-4 py-4 font-semibold hover:text-brand border-b border-light md:hidden' });
          a.textContent = this.formatName(cat.name); wrap.appendChild(a); return;
        }
        const details = this.create('details', { class:'border-b border-light group md:hidden', 'data-idx':String(i) });
        const summary = this.create('summary', { class:'px-4 py-4 font-semibold cursor-pointer hover:bg-light/40 flex items-center justify-between' });
        summary.innerHTML = `<span>${this.formatName(cat.name)}</span><span class="text-dark/60 group-open:rotate-180 transition-transform">⌄</span>`;
        details.appendChild(summary);
        const inner = this.create('div', { class:'px-2 pb-3' });
        cat.children.forEach(group => {
          const sec = this.create('details', { class:'mt-1 rounded-md' });
          const sum = this.create('summary', { class:'px-3 py-2 text-sm font-semibold text-dark/80 rounded-md hover:bg-light/40 flex items-center justify-between' });
          sum.innerHTML = `<span>${this.formatName(group.name)}</span><span class="text-dark/50">⌄</span>`;
          const ul = this.create('ul', { class:'mt-1 mb-2 space-y-1 text-sm text-dark/80' });
          (group.children || []).forEach(sub => {
            const a = this.create('a', { href:`/subcategory.html?c=${encodeURIComponent(sub.slug || slugify(sub.name))}`, class:'block px-3 py-2 rounded-md hover:bg-light/40' }); a.textContent = this.formatName(sub.name);
            ul.appendChild(this.create('li', {}, [a]));
          });
          sec.appendChild(sum); sec.appendChild(ul); inner.appendChild(sec);
        });
        details.appendChild(inner); wrap.appendChild(details);
      });

      // Only product categories in the mobile menu

      const open = () => {
        if (offcanvas.classList.contains('hidden')) {
          offcanvas.classList.remove('hidden');
          document.documentElement.classList.add('menu-open');
          offcanvas.removeAttribute('aria-hidden');
          toggles.forEach(t => t.setAttribute('aria-expanded','true'));
          const panel = offcanvas.querySelector('.offcanvas-panel');
          this.state.offcanvasUntrap = trapFocus(panel || offcanvas);
        }
      };
      const close = () => {
        offcanvas.classList.add('hidden');
        document.documentElement.classList.remove('menu-open');
        offcanvas.setAttribute('aria-hidden','true');
        toggles.forEach(t => t.setAttribute('aria-expanded','false'));
        if (typeof this.state.offcanvasUntrap === 'function') { this.state.offcanvasUntrap(); this.state.offcanvasUntrap = null; }
      };
      const onToggleClick = () => offcanvas.classList.contains('hidden') ? open() : close();
      toggles.forEach(t => { if (t.dataset.bound) return; t.addEventListener('click', onToggleClick); t.dataset.bound = '1'; });
      offcanvas.querySelectorAll('[data-close="offcanvas"]').forEach(b => { if (b.dataset.bound) return; b.addEventListener('click', close); b.dataset.bound = '1'; });
      // Delegated fallback (werkt ook als knop later in DOM komt)
      if (!document.documentElement.dataset.navDelegated) {
        document.addEventListener('click', (e) => {
          const toggleBtn = e.target.closest && e.target.closest('[data-nav-toggle]');
          if (toggleBtn) { e.preventDefault(); onToggleClick(); }
          const closeBtn = e.target.closest && e.target.closest('[data-close="offcanvas"]');
          if (closeBtn) { e.preventDefault(); close(); }
        });
        document.documentElement.dataset.navDelegated = '1';
      }
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !offcanvas.classList.contains('hidden')) close(); });
      // Prevent scroll bounce when at edges
      offcanvas.addEventListener('wheel', (e) => {
        const panel = offcanvas.querySelector('.offcanvas-panel'); if(!panel) return;
        const atTop = panel.scrollTop === 0;
        const atBottom = Math.ceil(panel.scrollTop + panel.clientHeight) >= panel.scrollHeight;
        if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault();
      }, { passive: false });

      this.state.mobileCloser = close;
    },

    // Cart adapter: ondersteunt meerdere hooks/selectors
    bindCartAdapter() {
      const openMinicart = () => {
        try { document.dispatchEvent(new CustomEvent('cart:toggle', { detail: { open: true } })); } catch {}
        const el = document.getElementById('minicart'); if (el) el.classList.remove('hidden');
      };
      const selectors = ['[data-cart-toggle]', '.js-mini-cart-toggle', '[data-open="minicart"]'];
      selectors.forEach(sel => document.querySelectorAll(sel).forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); openMinicart(); })));
    },

    async init() {
      await this.loadData();
      this.ensureScaffold();
      // In Hyvä server-side menu, data-gedreven rendering is optioneel; behoud interactiviteit
      this.renderDesktop();
      this.renderMobile();
      this.bindCartAdapter();
      window.__remkaMenu = this.state.data;

      // Hide-on-scroll: altijd zichtbaar bij omhoog scrollen; verbergen bij omlaag
      const header = document.querySelector('header[role="banner"]');
      const offcanvas = document.getElementById('offcanvas');
      if (header) {
        // Tuning: minder gevoelig en met hysterese
        if (typeof this.state.scrollAnchor !== 'number') this.state.scrollAnchor = 0;
        const onScroll = () => {
          const y = window.scrollY || 0;
          const delta = y - this.state.lastScrollY;
          const goingDown = delta > 0;
          const goingUp = delta < 0;
          const nearTop = y < 80; // laat dichter bij top altijd zien
          const mobileOpen = offcanvas && !offcanvas.classList.contains('hidden');

          // Minder gevoelig: vereis kleine drempel in delta om te reageren
          const ignoreSmall = Math.abs(delta) < 6;
          if (ignoreSmall) { this.state.lastScrollY = y; return; }

          if (nearTop || (goingUp && !mobileOpen)) {
            if (this.state.hidden) { header.classList.remove('header--hidden'); this.state.hidden = false; }
            this.state.scrollAnchor = y; // reset anker wanneer we tonen
          } else if (goingDown && !mobileOpen) {
            // Verberg pas als we voldoende voorbij het ankerpunt zijn gescrold
            const threshold = 160; // px na laatste show voordat we verbergen
            if (y - (this.state.scrollAnchor || 0) > threshold) {
              if (!this.state.hidden) { header.classList.add('header--hidden'); this.state.hidden = true; }
            }
          }
          this.state.lastScrollY = y;
        };
        window.addEventListener('scroll', debounce(onScroll, 80), { passive: true });
        onScroll();
      }
    }
  };

  window.RemkaHeader = RemkaHeader;
  // Init pas na partials:loaded, met fallback na DOMContentLoaded als er geen partial loader is
  const doInitOnce = () => { if (window.__remkaHeaderBooted) return; window.__remkaHeaderBooted = true; try { RemkaHeader.init(); } catch {} };
  document.addEventListener('partials:loaded', doInitOnce);
  document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (!document.getElementById('menuRoot')) doInitOnce(); }, 0); });

  // Demo cart API (optioneel, blijft voor prototype). In productie Hyvä vervangen door Magento minicart.
  const Cart = {
    key: 'remka_demo_cart',
    read() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; } },
    write(items) { localStorage.setItem(this.key, JSON.stringify(items)); },
    add(item) { const items = this.read(); const existing = items.find(i => i.sku === item.sku); if (existing) existing.qty += item.qty || 1; else items.push({ ...item, qty: item.qty || 1 }); this.write(items); this.renderBadge(); this.renderMinicart(); },
    remove(sku) { const items = this.read().filter(i => i.sku !== sku); this.write(items); this.renderBadge(); this.renderMinicart(); },
    count() { return this.read().reduce((n, i) => n + (i.qty || 0), 0); },
    subtotal() { return this.read().reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0); },
    format(amount) { return `€ ${amount.toFixed(2)}`; },
    renderBadge() { document.querySelectorAll('.header-badge').forEach(el => el.textContent = String(this.count())); },
    renderMinicart() {
      const mc = document.getElementById('minicart'); if (!mc) return;
      const listHost = mc.querySelector('.js-minicart-items'); const subtotalEl = mc.querySelector('.js-minicart-subtotal'); if (!listHost) return;
      listHost.innerHTML = ''; const items = this.read();
      items.forEach(i => {
        const row = document.createElement('div'); row.className = 'flex gap-3 items-start';
        row.innerHTML = `
          <img src="${i.image}" alt="${i.title}" class="w-16 h-16 rounded-md border border-light object-cover" loading="lazy" />
          <div class="flex-1 text-sm">
            <div class="font-semibold truncate">${i.title}</div>
            <div class="text-dark/70">${i.qty} × ${this.format(i.price)}</div>
          </div>
          <button class="text-brand text-sm" data-remove="${i.sku}">Verwijderen</button>
        `; listHost.appendChild(row);
      });
      if (subtotalEl) subtotalEl.textContent = this.format(this.subtotal());
      listHost.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => this.remove(btn.getAttribute('data-remove'))));
    },
    clear() { this.write([]); this.renderBadge(); this.renderMinicart(); }
  };
  window.RemkaCart = Cart;
  const bindCartButtons = () => {
    document.querySelectorAll('[data-add-to-cart]').forEach(btn => btn.addEventListener('click', () => {
      const sku = btn.getAttribute('data-sku') || 'DEMO'; const title = btn.getAttribute('data-title') || 'Product'; const price = parseFloat(btn.getAttribute('data-price') || '9.99'); const image = btn.getAttribute('data-image') || '/assets/images/placeholder-4x3.svg';
      Cart.add({ sku, title, price, image, qty: 1 });
      const mc = document.getElementById('minicart'); if (mc) mc.classList.remove('hidden');
    }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { Cart.renderBadge(); Cart.renderMinicart(); bindCartButtons(); });
  else { Cart.renderBadge(); Cart.renderMinicart(); bindCartButtons(); }
  document.addEventListener('partials:loaded', () => { Cart.renderBadge(); Cart.renderMinicart(); bindCartButtons(); });
})();