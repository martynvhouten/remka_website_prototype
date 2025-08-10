(function(){
  let initialized = false;
  const SELECTORS = {
    header: '#site-header',
    desktopMenu: '#desktopMenu',
    mobileHost: '#mobileMenuHost',
    mobileRoot: '#mobileMenu',
    mobileOverlay: '#mobileMenu [data-overlay]',
    mobileDrawer: '#mobileMenu [data-drawer]',
    burger: '[data-nav="open"]',
    close: '[data-nav="close"]'
  };

  let MENU = [
    { label: 'Producten', href: '/category.html' },
    { label: 'Merken', href: '/brands.html' },
    { label: 'Services', href: '/onderhoud-technische-dienst.html' },
    { label: 'Over ons', href: '/over-ons.html' },
    { label: 'Contact', href: '/contact.html' }
  ];

  // Remember expanded state while the drawer is open
  // Reset on drawer close to keep sessions clean per spec
  const accordionExpanded = new Set(); // stores numeric indices of open top-level items
  const showMoreExpanded = new Set();  // stores numeric indices where "Meer tonen" is expanded

  const FOCUSABLE = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container) {
    if (!container) return () => {};
    const prev = document.activeElement;
    const get = () => Array.from(container.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null || el === container);
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const list = get(); if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || a === container)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => { (get()[0] || container).focus(); });
    return () => { document.removeEventListener('keydown', onKey); try { prev && prev.focus && prev.focus(); } catch {} };
  }

  let untrap = null;
  let lastScrollY = 0;
  let headerVisible = true;
  let revealAnchor = 0;

  function openMobile(sourceBtn){
    const root = document.querySelector(SELECTORS.mobileRoot);
    const overlay = document.querySelector(SELECTORS.mobileOverlay);
    const drawer = document.querySelector(SELECTORS.mobileDrawer);
    const burgers = document.querySelectorAll(SELECTORS.burger);
    if (!root || !overlay || !drawer) return;
    if (!root.classList.contains('hidden')) return;
    root.classList.remove('hidden');
    root.classList.add('pointer-events-auto');
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
    try { overlay.style.pointerEvents = 'auto'; } catch {}
    drawer.classList.remove('-translate-x-full');
    drawer.classList.add('translate-x-0');
    try { drawer.style.zIndex = '10'; overlay.style.zIndex = '0'; } catch {}
    root.removeAttribute('aria-hidden');
    try { document.documentElement.classList.add('menu-open'); } catch {}
    burgers.forEach(b => b.setAttribute('aria-expanded','true'));
    // class hooks per requirements
    try { drawer.classList.add('is-open'); overlay.classList.add('is-open'); } catch {}
    untrap = trapFocus(drawer);
    if (sourceBtn) try { sourceBtn.dataset.returnFocus = '1'; } catch {}
  }

  function closeMobile(){
    const root = document.querySelector(SELECTORS.mobileRoot);
    const overlay = document.querySelector(SELECTORS.mobileOverlay);
    const drawer = document.querySelector(SELECTORS.mobileDrawer);
    const burgers = document.querySelectorAll(SELECTORS.burger);
    if (!root || root.classList.contains('hidden')) return;
    overlay.classList.add('opacity-0');
    overlay.classList.remove('opacity-100');
    try { overlay.style.pointerEvents = 'none'; } catch {}
    drawer.classList.add('-translate-x-full');
    drawer.classList.remove('translate-x-0');
    try { drawer.classList.remove('is-open'); overlay.classList.remove('is-open'); } catch {}
    root.setAttribute('aria-hidden','true');
    try { document.documentElement.classList.remove('menu-open'); } catch {}
    burgers.forEach(b => b.setAttribute('aria-expanded','false'));
    if (typeof untrap === 'function') { untrap(); untrap = null; }
    setTimeout(() => { root.classList.add('hidden'); root.classList.remove('pointer-events-auto'); }, 200);
    try { const ret = document.querySelector(`${SELECTORS.burger}[data-return-focus="1"]`); ret && ret.focus && ret.focus(); burgers.forEach(b => b.removeAttribute('data-return-focus')); } catch {}

    // Reset accordion + show-more state after close to match “remember until drawer closes”
    try {
      const host = document.querySelector(SELECTORS.mobileHost);
      // Defer slightly to avoid fighting with closing animation
      setTimeout(() => {
        if (!host) return;
        host.querySelectorAll('button[aria-controls]').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
        host.querySelectorAll('[id^="m-acc-"]').forEach((panel) => { panel.hidden = true; panel.style.maxHeight = ''; panel.style.transition = ''; });
        host.querySelectorAll('[data-more-wrap]').forEach((el) => { el.hidden = true; });
        host.querySelectorAll('[data-showmore]').forEach((btn) => { btn.textContent = 'Meer tonen'; });
        accordionExpanded.clear();
        showMoreExpanded.clear();
      }, 240);
    } catch {}
  }

  function buildMenus(){
    const ul = document.querySelector(SELECTORS.desktopMenu);
    if (ul) {
      ul.innerHTML = '';
      MENU.forEach((item, i) => {
        const li = document.createElement('li'); li.setAttribute('role','none');
        const a = document.createElement('a');
        a.href = item.href || '#'; a.className = 'px-3 py-2 rounded-md hover:bg-light/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand text-white mainnav-link';
        a.textContent = item.label; a.setAttribute('role','menuitem');
        if (item.children && item.children.length) {
          a.setAttribute('aria-haspopup','true'); a.setAttribute('aria-expanded','false'); a.dataset.idx = String(i); a.dataset.trigger = '1';
        }
        li.appendChild(a); ul.appendChild(li);
      });
    }
    const mobileHost = document.querySelector(SELECTORS.mobileHost);
    if (mobileHost) {
      mobileHost.innerHTML = '';
      // Popular shortlist as a horizontal chip row under the sticky search
      // One-line, horizontally scrollable; small label title
      const popular = document.createElement('section');
      popular.setAttribute('aria-label','Populair');
      popular.className = 'pb-1';
      const popularTitle = document.createElement('div');
      popularTitle.className = 'px-3 pt-2 pb-1 text-xs font-semibold text-dark/70';
      popularTitle.textContent = 'Populair';
      const rowScroll = document.createElement('div');
      rowScroll.className = 'h-scroll px-3 pb-2';
      const row = document.createElement('div');
      row.className = 'flex flex-nowrap gap-2';
      MENU.filter(m => m.children && m.children.length).slice(0, 10).forEach(m => {
        const chip = document.createElement('a');
        chip.href = m.href || '#'; chip.className = 'pill pill--sm';
        chip.innerHTML = '<span class="dot"></span>' + (m.label || 'Categorie');
        row.appendChild(chip);
      });
      if (row.children.length) { rowScroll.appendChild(row); popular.appendChild(popularTitle); popular.appendChild(rowScroll); mobileHost.appendChild(popular); }

      // All categories accordion
      const allWrap = document.createElement('section');
      const allTitle = document.createElement('div');
      allTitle.className = 'px-3 pt-2 pb-1 text-xs font-semibold text-dark/70';
      allTitle.textContent = 'Alle categorieën';
      const all = document.createElement('div');
      all.setAttribute('aria-label','Alle categorieën');
      all.className = 'divide-y divide-light';

      MENU.forEach((item, i) => {
        const row = document.createElement('div');
        const hasChildren = !!(item.children && item.children.length);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full flex items-center justify-between px-4 py-3 min-h-[44px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
        const isInitiallyOpen = accordionExpanded.has(i);
        btn.setAttribute('aria-expanded', isInitiallyOpen ? 'true' : 'false');
        btn.setAttribute('aria-controls', `m-acc-${i}`);
        btn.innerHTML = `<span class="text-sm font-semibold leading-snug">${item.label}</span>
          <svg class="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;

        const panel = document.createElement('div');
        panel.id = `m-acc-${i}`; panel.hidden = !isInitiallyOpen; panel.className = 'px-3 pb-3 space-y-1 overflow-hidden';

        if (hasChildren) {
          (item.children || []).slice(0, 8).forEach(child => {
            const a = document.createElement('a');
            a.href = child.href || `/category.html?c=${encodeURIComponent(child.slug || child.name || child.label || '')}`;
            a.className = 'block px-3 py-2 rounded hover:bg-light/40 mobile-subitem';
            a.textContent = child.name || child.label;
            panel.appendChild(a);
          });
          if ((item.children || []).length > 8) {
            const moreWrap = document.createElement('div');
            moreWrap.hidden = !showMoreExpanded.has(i);
            moreWrap.setAttribute('data-more-wrap', '');
            (item.children || []).slice(8).forEach(child => {
              const a = document.createElement('a');
              a.href = child.href || `/category.html?c=${encodeURIComponent(child.slug || child.name || child.label || '')}`;
              a.className = 'block px-3 py-2 rounded hover:bg-light/40 mobile-subitem';
              a.textContent = child.name || child.label;
              moreWrap.appendChild(a);
            });
            const showMore = document.createElement('button');
            showMore.type = 'button';
            showMore.className = 'mt-1 ml-3 text-sm text-brand font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand';
            showMore.setAttribute('data-showmore', '');
            showMore.textContent = showMoreExpanded.has(i) ? 'Minder tonen' : 'Meer tonen';
            showMore.addEventListener('click', () => {
              const hidden = moreWrap.hidden;
              moreWrap.hidden = !hidden;
              if (hidden) showMoreExpanded.add(i); else showMoreExpanded.delete(i);
              showMore.textContent = hidden ? 'Minder tonen' : 'Meer tonen';
            });
            panel.appendChild(moreWrap);
            panel.appendChild(showMore);
          }
        } else {
          const a = document.createElement('a');
          a.href = item.href || '#';
          a.className = 'block px-3 py-2 rounded hover:bg-light/40 mobile-subitem';
          a.textContent = 'Bekijk categorie';
          panel.appendChild(a);
        }

        // Smooth expand/collapse with height animation
        const togglePanel = () => {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          const icon = btn.querySelector('svg');
          const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (expanded) {
            // collapse
            if (!reduce) {
              const start = panel.scrollHeight;
              panel.style.maxHeight = start + 'px';
              requestAnimationFrame(() => { panel.style.transition = 'max-height .18s ease-out'; panel.style.maxHeight = '0px'; });
              setTimeout(() => { panel.hidden = true; panel.style.transition = ''; panel.style.maxHeight = ''; }, 200);
            } else { panel.hidden = true; }
            btn.setAttribute('aria-expanded','false');
            accordionExpanded.delete(i);
            if (icon) icon.style.transform = 'rotate(0deg)';
          } else {
            // expand
            panel.hidden = false;
            if (!reduce) {
              panel.style.maxHeight = '0px';
              const target = () => panel.scrollHeight;
              requestAnimationFrame(() => { panel.style.transition = 'max-height .18s ease-out'; panel.style.maxHeight = target() + 'px'; });
              setTimeout(() => { panel.style.transition = ''; panel.style.maxHeight = ''; }, 220);
            }
            btn.setAttribute('aria-expanded','true');
            accordionExpanded.add(i);
            if (icon) icon.style.transform = 'rotate(180deg)';
          }
        };
        btn.addEventListener('click', togglePanel);

        row.appendChild(btn); row.appendChild(panel); all.appendChild(row);
      });
      allWrap.appendChild(allTitle);
      allWrap.appendChild(all);
      mobileHost.appendChild(allWrap);
    }
  }

  function fmtLabel(s){
    return String(s || '').trim();
  }

  function renderMega(){
    const nav = document.getElementById('mainNav');
    const host = document.getElementById('megaHost');
    const ul = document.querySelector(SELECTORS.desktopMenu);
    if (!nav || !host || !ul) return;
    host.innerHTML = '';

    const rail = document.createElement('div');
    rail.className = 'mega-wrap';
    host.appendChild(rail);

    MENU.forEach((item, i) => {
      if (!item.children || !item.children.length) return;
      const wrap = document.createElement('div');
      wrap.className = 'container mx-auto px-4 hidden';
      wrap.dataset.panel = String(i);

      const panel = document.createElement('div');
      panel.className = 'mega-panel mt-2';
      panel.setAttribute('role','region');
      panel.setAttribute('aria-label', fmtLabel(item.label));
      panel.setAttribute('aria-hidden','true');

      const grid = document.createElement('div');
      grid.className = 'mega-grid';

      item.children.forEach(group => {
        const col = document.createElement('div');
        const h = document.createElement('h3'); h.className = 'mega-heading'; h.textContent = fmtLabel(group.name || group.label);
        const ul2 = document.createElement('ul'); ul2.className = 'mega-list';
        (group.children || []).forEach(sub => {
          const li2 = document.createElement('li');
          const a2 = document.createElement('a'); a2.className = 'mega-link';
          a2.href = sub.href || `/subcategory.html?c=${encodeURIComponent(sub.slug || sub.name || sub.label || '')}`; a2.textContent = fmtLabel(sub.name || sub.label);
          li2.appendChild(a2); ul2.appendChild(li2);
        });
        col.appendChild(h); col.appendChild(ul2); grid.appendChild(col);
      });
      panel.appendChild(grid); wrap.appendChild(panel); rail.appendChild(wrap);
    });

    // interactions with intent (open delay ~120ms, close delay ~200ms)
    let intentOpenTimer = null;
    let intentCloseTimer = null;
    let currentOpen = null;

    const clearTimers = () => { if (intentOpenTimer) { clearTimeout(intentOpenTimer); intentOpenTimer = null; } if (intentCloseTimer) { clearTimeout(intentCloseTimer); intentCloseTimer = null; } };

    const closeAll = () => {
      clearTimers();
      currentOpen = null;
      ul.querySelectorAll('a[data-trigger]').forEach(a => a.setAttribute('aria-expanded','false'));
      host.querySelectorAll('[data-panel]').forEach(p => {
        p.classList.add('hidden');
        const card = p.querySelector('.mega-panel');
        if (card) { card.setAttribute('aria-hidden','true'); card.removeAttribute('data-state'); }
      });
    };

    const doOpen = (idx, trigger) => {
      if (currentOpen === idx) return;
      currentOpen = idx;
      ul.querySelectorAll('a[data-trigger]').forEach(a => a.setAttribute('aria-expanded','false'));
      host.querySelectorAll('[data-panel]').forEach(p => {
        const isTarget = p.dataset.panel === String(idx);
        p.classList.toggle('hidden', !isTarget);
        const card = p.querySelector('.mega-panel');
        if (card) {
          if (isTarget) { card.setAttribute('data-state','open'); card.setAttribute('aria-hidden','false'); }
          else { card.removeAttribute('data-state'); card.setAttribute('aria-hidden','true'); }
        }
      });
      if (trigger) trigger.setAttribute('aria-expanded','true');
    };

    const scheduleOpen = (idx, trigger) => {
      if (intentOpenTimer) clearTimeout(intentOpenTimer);
      intentOpenTimer = setTimeout(() => { doOpen(idx, trigger); }, 120);
    };
    const scheduleClose = () => {
      if (intentCloseTimer) clearTimeout(intentCloseTimer);
      intentCloseTimer = setTimeout(() => { closeAll(); }, 200);
    };

    // Hover/click/focus intent on triggers
    ul.addEventListener('mouseover', (e) => {
      const t = e.target.closest && e.target.closest('a[data-trigger]'); if (!t) return;
      scheduleOpen(t.dataset.idx, t);
    });
    ul.addEventListener('focusin', (e) => {
      const t = e.target.closest && e.target.closest('a[data-trigger]'); if (!t) return;
      doOpen(t.dataset.idx, t);
    });
    ul.addEventListener('mouseleave', () => { scheduleClose(); });
    ul.addEventListener('mouseenter', () => { if (intentCloseTimer) { clearTimeout(intentCloseTimer); intentCloseTimer = null; } });
    ul.addEventListener('click', (e) => {
      const t = e.target.closest && e.target.closest('a[data-trigger]'); if (!t) return;
      e.preventDefault(); doOpen(t.dataset.idx, t);
    });

    // Keep open while pointer over panel; close with delay after leaving
    host.addEventListener('mouseenter', () => { if (intentCloseTimer) { clearTimeout(intentCloseTimer); intentCloseTimer = null; } });
    host.addEventListener('mouseleave', () => { scheduleClose(); });

    // Outside click closes immediately
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!host.contains(target) && !ul.contains(target)) closeAll();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

    // Bridge safe zone and pointer-intent tracking (geometry-based)
    const hasFocusInside = () => {
      const a = document.activeElement;
      return !!(a && (ul.contains(a) || host.contains(a)));
    };
    const getOpenPanelRect = () => {
      if (currentOpen == null) return null;
      const wrap = host.querySelector(`[data-panel="${currentOpen}"]`);
      if (!wrap || wrap.classList.contains('hidden')) return null;
      const card = wrap.querySelector('.mega-panel');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      // Expand upwards to create a hover-safe bridge (approx 12px)
      return { left: r.left, right: r.right, top: r.top - 12, bottom: r.bottom };
    };
    const getNavRect = () => ul.getBoundingClientRect();
    const pointInRect = (x, y, r) => r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    const onMouseMove = (e) => {
      if (currentOpen == null) return;
      const navR = getNavRect();
      const panR = getOpenPanelRect();
      const inside = pointInRect(e.clientX, e.clientY, navR) || pointInRect(e.clientX, e.clientY, panR) || hasFocusInside();
      if (inside) {
        if (intentCloseTimer) { clearTimeout(intentCloseTimer); intentCloseTimer = null; }
      } else {
        scheduleClose();
      }
    };
    document.addEventListener('mousemove', onMouseMove);
  }

  function wire(){
    const header = document.querySelector(SELECTORS.header);
    if (!header) return;

    // Sticky hide/show on scroll (intent-based, single class .is-hidden)
    let lastY = window.scrollY || 0;
    let anchorY = lastY; // last reveal point
    let isHidden = false;
    const HIDE_AFTER_PX = 72; // slower to hide; header remains longer
    const REVEAL_AFTER_PX = 14; // tiny increase to match feel
    let ticking = false;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const setHidden = (hidden) => {
      if (hidden === isHidden) return;
      isHidden = hidden;
      if (prefersReduced) header.style.transition = 'none';
      header.classList.toggle('is-hidden', hidden);
      if (prefersReduced) {
        // restore asynchronously to avoid disabling future transitions completely
        requestAnimationFrame(() => { header.style.transition = ''; });
      }
    };

    const updateHeader = () => {
      ticking = false;
      const y = window.scrollY || 0;
      const delta = y - lastY;
      lastY = y;

      const mobileRoot = document.querySelector(SELECTORS.mobileRoot);
      const mobileOpen = mobileRoot && !mobileRoot.classList.contains('hidden');
      const focusInsideHeader = header.contains(document.activeElement);
      if (mobileOpen || focusInsideHeader) {
        setHidden(false);
        anchorY = y;
        return;
      }

      // Reveal on small upward scroll
      if (delta < 0 && Math.abs(delta) >= REVEAL_AFTER_PX) {
        setHidden(false);
        anchorY = y; // reset anchor to new reveal point
        return;
      }

      // Hide only after threshold downward from last reveal point
      if (delta > 0 && (y - anchorY) >= HIDE_AFTER_PX) {
        setHidden(true);
        return;
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    setHidden(false);

    // Mobile drawer
    // Direct bindings (in addition to delegation) for reliability
    const burgers = document.querySelectorAll(SELECTORS.burger);
    burgers.forEach((btn) => {
      btn.addEventListener('click', (e) => { e.preventDefault(); openMobile(btn); });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMobile(btn); }
      });
    });
    const closer = document.querySelector(SELECTORS.close);
    if (closer) {
      closer.addEventListener('click', (e) => { e.preventDefault(); closeMobile(); });
      closer.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeMobile(); } });
    }

    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest && e.target.closest(SELECTORS.burger);
      if (openBtn) { e.preventDefault(); openMobile(openBtn); return; }
      const closeBtn = e.target.closest && e.target.closest(SELECTORS.close);
      if (closeBtn) { e.preventDefault(); closeMobile(); return; }
      const overlay = e.target.closest && e.target.closest(SELECTORS.mobileOverlay);
      if (overlay) { e.preventDefault(); closeMobile(); return; }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMobile(); }, { passive: true });
    const mobile = document.querySelector(SELECTORS.mobileRoot);
    if (mobile) mobile.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (a) closeMobile(); });

    // Ensure mega closes when leaving header context
    try {
      const desktopMenu = document.querySelector(SELECTORS.desktopMenu);
      const megaHost = document.getElementById('megaHost');
      const closeAll = () => {
        desktopMenu?.querySelectorAll('a[data-trigger]')?.forEach(a => a.setAttribute('aria-expanded','false'));
        megaHost?.querySelectorAll('[data-panel]')?.forEach(p => {
          p.classList.add('hidden');
          const card = p.querySelector('.mega-panel');
          if (card) { card.removeAttribute('data-state'); card.setAttribute('aria-hidden','true'); }
        });
      };
      document.addEventListener('mouseleave', (e) => {
        if (!megaHost?.contains(e.target) && !desktopMenu?.contains(e.target)) closeAll();
      });
    } catch {}
  }

  async function init(){
    if (initialized) return; initialized = true;
    // Ensure mobile menu structure exists even if omitted in server template
    try {
      const root = document.querySelector(SELECTORS.mobileRoot);
      if (root) {
        let overlay = root.querySelector('[data-overlay]');
        let drawer = root.querySelector('[data-drawer]');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.setAttribute('data-overlay', '');
          overlay.className = 'absolute inset-0 bg-black/40 opacity-0 transition-opacity hdr-overlay';
          root.appendChild(overlay);
        }
        if (!drawer) {
          drawer = document.createElement('aside');
          drawer.setAttribute('data-drawer', '');
          drawer.setAttribute('role', 'dialog');
          drawer.setAttribute('aria-modal', 'true');
          drawer.setAttribute('aria-label', 'Mobiel menu');
          drawer.className = 'absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-2xl overflow-y-auto -translate-x-full transition-transform hdr-drawer';
          const head = document.createElement('div');
          head.className = 'p-4 border-b border-light flex items-center justify-between sticky top-0 bg-white z-10';
          head.innerHTML = '<h2 class="text-base font-bold">Menu</h2>';
          const closeBtn = document.createElement('button');
          closeBtn.className = 'p-2 rounded-md border border-light';
          closeBtn.setAttribute('data-nav', 'close');
          closeBtn.setAttribute('aria-label', 'Sluiten');
          closeBtn.textContent = '✕';
          head.appendChild(closeBtn);
          const searchWrap = document.createElement('div');
          // sticky compact search bar under the header inside the drawer
          searchWrap.className = 'p-3 border-b border-light sticky top-0 bg-white z-10';
          searchWrap.innerHTML = '<form action="/search.html" class="flex gap-2"><label for="mobile-search" class="sr-only">Zoeken</label><input id="mobile-search" name="q" type="search" placeholder="Zoek producten" class="w-full rounded-md border border-light px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" /><button class="btn btn-brand text-xs" aria-label="Zoeken">Zoek</button></form>';
          const nav = document.createElement('nav');
          nav.className = 'p-2';
          nav.setAttribute('aria-label', 'Mobiel menu');
          const host = document.createElement('div'); host.id = 'mobileMenuHost'; host.className = 'space-y-1';
          nav.appendChild(host);
          drawer.appendChild(head); drawer.appendChild(searchWrap); drawer.appendChild(nav);
          root.appendChild(drawer);
        } else {
          // Ensure host exists
          if (!drawer.querySelector('#mobileMenuHost')) {
            const nav = drawer.querySelector('nav') || (()=>{ const n=document.createElement('nav'); n.className='p-2'; n.setAttribute('aria-label','Mobiel menu'); drawer.appendChild(n); return n; })();
            const host = document.createElement('div'); host.id = 'mobileMenuHost'; host.className = 'space-y-1'; nav.appendChild(host);
          }
        }
      }
    } catch {}
    // Try to load categories tree for mega menu
    try {
      const res = await fetch('/data/categories.json', { cache: 'no-store' });
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); }
      catch {
        const start = text.indexOf('categories =');
        if (start !== -1) {
          const brace = text.indexOf('{', start);
          let depth = 0, end = -1;
          for (let i = brace; i < text.length; i++) {
            const ch = text[i];
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
          }
          if (brace !== -1 && end !== -1) {
            const jsonLike = text.slice(brace, end + 1).replace(/,(\s*[}\]])/g, '$1');
            parsed = JSON.parse(jsonLike);
          }
        }
      }
      const nodes = Array.isArray(parsed) ? parsed : (parsed && parsed.children) || [];
      if (nodes && nodes.length) {
        MENU = nodes.map(n => ({ label: n.name || n.label, href: `/category.html?c=${encodeURIComponent(n.slug || n.name || n.label || '')}`, children: n.children || [] }));
      }
    } catch {}

    buildMenus();
    renderMega();
    wire();
  }

  // Boot after header partial is injected
  document.addEventListener('partials:loaded', init, { once: true });
  function initWhenReady(){
    const tryInit = () => {
      if (initialized) return;
      if (document.querySelector(SELECTORS.header)) { init(); return; }
      setTimeout(tryInit, 100);
    };
    tryInit();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWhenReady);
  else initWhenReady();
})();


