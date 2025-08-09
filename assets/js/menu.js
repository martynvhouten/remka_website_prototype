// Mega menu module – data-gedreven, Hyvä-vriendelijk
(function () {
  const RemkaMenu = {
    data: null,
    showZeroCount: false,
    async loadData() {
      try {
        const res = await fetch('/data/categories.json', { cache: 'no-store' });
        if (!res.ok) throw new Error('no json');
        const json = await res.json();
        // Filter items met count===0
        const filterTree = (nodes) => nodes
          .filter(n => this.showZeroCount || (n.count ?? 0) > 0 || (n.children && n.children.some(c => (c.count ?? 0) > 0)))
          .map(n => ({
            id: n.id,
            name: n.name,
            slug: n.slug,
            count: n.count ?? 0,
            children: n.children ? filterTree(n.children) : []
          }));
        this.data = filterTree(json);
      } catch (e) {
        // Fallback naar ingebouwde data
        this.data = [
          { name: 'Apparatuur', slug: 'apparatuur', children: [
            { name: 'Diagnostiek', slug: 'diagnostiek', children: [ { name: 'Stethoscopen', slug: 'stethoscopen' }, { name: 'Bloeddrukmeters', slug: 'bloeddrukmeters' }, { name: 'Otoskopen', slug: 'otoskopen' } ] }
          ]},
          { name: 'Medische Instrumenten', slug: 'medische-instrumenten', children: [ { name: 'Chirurgisch', slug: 'chirurgisch', children: [ { name: 'Scharen', slug: 'scharen' }, { name: 'Pincetten', slug: 'pincetten' } ] } ]},
          { name: 'Laboratorium', slug: 'laboratorium', children: [ { name: 'Verbruik', slug: 'verbruik', children: [ { name: 'Pipetpunten', slug: 'pipetpunten' } ] } ]},
          { name: 'Injectiematerialen', slug: 'injectiematerialen', children: [ { name: 'Naalden', slug: 'naalden', children: [ { name: 'Subcutaan', slug: 'subcutaan' } ] } ]},
          { name: 'Verbandmiddelen', slug: 'verbandmiddelen', children: [ { name: 'Kompressen', slug: 'kompressen', children: [ { name: 'Steriel', slug: 'steriel' } ] } ]},
          { name: 'Verbruiksmaterialen', slug: 'verbruiksmaterialen', children: [ { name: 'Handschoenen', slug: 'handschoenen', children: [ { name: 'Nitril', slug: 'nitril' } ] } ]},
          { name: 'Praktijkinrichting', slug: 'praktijkinrichting', children: [ { name: 'Meubilair', slug: 'meubilair', children: [ { name: 'Behandelbanken', slug: 'behandelbanken' } ] } ]},
          { name: 'Anatomie', slug: 'anatomie', children: [ { name: 'Modellen', slug: 'modellen', children: [ { name: 'Skelet', slug: 'skelet' } ] } ]},
          { name: 'Drogisterij artikelen', slug: 'drogisterij-artikelen', children: [ { name: 'Verzorging', slug: 'verzorging', children: [ { name: 'Pleisters', slug: 'pleisters' } ] } ]}
        ];
      }
    },
    createEl(tag, props = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([k, v]) => {
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v);
      });
      children.forEach(c => el.appendChild(c));
      return el;
    },
    renderDesktop() {
      const root = document.getElementById('menuRoot');
      const host = document.getElementById('megaHost');
      if (!root || !host) return;
      root.innerHTML = '';
      host.innerHTML = '';
      this.data.forEach((cat, idx) => {
        const li = this.createEl('li');
        const btn = this.createEl('button', {
          class: 'px-3 py-2 rounded-md hover:text-brand focus-ring',
          'data-idx': String(idx), 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': `mega-${idx}`
        });
        btn.textContent = cat.name;
        li.appendChild(btn); root.appendChild(li);

        const panel = this.createEl('div', { id: `mega-${idx}`, class: 'absolute left-0 right-0 mx-auto container-wide px-4 hidden', role: 'region', 'aria-label': cat.name });
        const card = this.createEl('div', { class: 'mt-2 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden' });
        const grid = this.createEl('div', { class: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6' });
        (cat.children || []).forEach(group => {
          const h = this.createEl('h3', { class: 'font-semibold text-dark' }); h.textContent = group.name;
          const ul = this.createEl('ul', { class: 'mt-2 space-y-1 text-sm text-gray-700' });
          (group.children || []).forEach(sub => {
            const a = this.createEl('a', { href: `#/${sub.slug || ''}`, class: 'hover:text-brand' }); a.textContent = sub.name; ul.appendChild(this.createEl('li', {}, [a]));
          });
          grid.appendChild(this.createEl('div', {}, [h, ul]));
        });
        card.appendChild(grid); panel.appendChild(card); host.appendChild(panel);
      });

      const buttons = root.querySelectorAll('button[aria-haspopup="true"]');
      let openIdx = null;
      const closeAll = () => {
        buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
        host.querySelectorAll('[id^="mega-"]').forEach(p => { p.classList.add('hidden'); p.removeAttribute('data-open'); });
        openIdx = null;
      };
      const openPanel = (i) => {
        closeAll(); openIdx = i;
        const btn = root.querySelector(`button[data-idx="${i}"]`);
        const panel = document.getElementById(`mega-${i}`);
        if (btn && panel) { btn.setAttribute('aria-expanded','true'); panel.classList.remove('hidden'); panel.dataset.open = 'true'; }
      };

      buttons.forEach((btn, i) => {
        btn.addEventListener('mouseenter', () => openPanel(i));
        btn.addEventListener('focus', () => openPanel(i));
        btn.addEventListener('click', () => (openIdx === i ? closeAll() : openPanel(i)));
        btn.addEventListener('keydown', (e) => {
          const max = buttons.length - 1;
          if (e.key === 'ArrowRight') { e.preventDefault(); buttons[Math.min(i + 1, max)].focus(); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); buttons[Math.max(i - 1, 0)].focus(); }
          if (e.key === 'Escape') { closeAll(); btn.focus(); }
          if (e.key === 'ArrowDown') { e.preventDefault(); const firstLink = document.querySelector(`#mega-${i} a`); firstLink && firstLink.focus(); }
        });
      });
      host.addEventListener('mouseleave', closeAll);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
      document.addEventListener('click', (e) => { if (!host.contains(e.target) && !root.contains(e.target)) closeAll(); });

      // Focus trap in open desktop panel
      host.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const open = host.querySelector('[data-open="true"]'); if (!open) return;
        const focusables = open.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'); if (!focusables.length) return;
        const first = focusables[0]; const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    },
    renderMobile() {
      const wrap = document.getElementById('mobileMenu');
      const toggle = document.getElementById('navToggle');
      const offcanvas = document.getElementById('offcanvas');
      if (!wrap || !toggle || !offcanvas) return;
      wrap.innerHTML = '';
      this.data.forEach((cat, idx) => {
        const details = this.createEl('details', { class: 'border-b border-gray-200', 'data-idx': String(idx) });
        const summary = this.createEl('summary', { class: 'px-3 py-3 font-semibold cursor-pointer hover:bg-gray-50' });
        summary.textContent = cat.name;
        const inner = this.createEl('div', { class: 'px-3 pb-3 grid grid-cols-1 gap-4' });
        (cat.children || []).forEach(group => {
          const h = this.createEl('h3', { class: 'text-sm font-semibold text-dark mt-2' }); h.textContent = group.name;
          const ul = this.createEl('ul', { class: 'mt-1 space-y-1 text-sm text-gray-700' });
          (group.children || []).forEach(sub => { const a = this.createEl('a', { href: `#/${sub.slug || ''}`, class: 'hover:text-brand' }); a.textContent = sub.name; ul.appendChild(this.createEl('li', {}, [a])); });
          inner.appendChild(this.createEl('div', {}, [h, ul]));
        });
        details.appendChild(summary); details.appendChild(inner); wrap.appendChild(details);
      });

      const open = () => { offcanvas.classList.remove('hidden'); document.documentElement.classList.add('menu-open'); toggle.setAttribute('aria-expanded','true');
        // Focus trap setup
        const dialog = offcanvas.querySelector('aside');
        if (!dialog) return;
        const focusables = dialog.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusables[0]; const last = focusables[focusables.length - 1];
        first && first.focus();
        function onKey(e){
          if (e.key === 'Escape') { close(); return; }
          if (e.key !== 'Tab') return;
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last && last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first && first.focus(); }
        }
        offcanvas._trapHandler = onKey; document.addEventListener('keydown', onKey);
      };
      const close = () => { offcanvas.classList.add('hidden'); document.documentElement.classList.remove('menu-open'); toggle.setAttribute('aria-expanded','false');
        if (offcanvas._trapHandler) { document.removeEventListener('keydown', offcanvas._trapHandler); offcanvas._trapHandler = null; }
        toggle.focus();
      };
      toggle.addEventListener('click', () => offcanvas.classList.contains('hidden') ? open() : close());
      offcanvas.querySelectorAll('[data-close="offcanvas"]').forEach(b => b.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !offcanvas.classList.contains('hidden')) close(); });
    },
    async init() {
      await this.loadData();
      this.renderDesktop();
      this.renderMobile();
      window.__remkaMenu = this.data; // voor devs
    }
  };

  window.RemkaMenu = RemkaMenu;
})();


