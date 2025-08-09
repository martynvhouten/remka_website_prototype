/*
  Mega menu data + rendering + a11y behavior
  Hyvä-friendly: minimal vanilla JS, Tailwind classes in markup, no external deps
*/

const menuData = [
  {
    title: 'Apparatuur',
    items: [
      { title: 'Diagnostiek', links: ['Stethoscopen', 'Bloeddrukmeters', 'Otoskopen'] },
      { title: 'Behandelapparatuur', links: ['Electrochirurgie', 'Zuigpompen', 'Instrumentverwarmers'] },
      { title: 'Sterilisatie', links: ['Autoclaaf', 'Sealapparaten', 'Indicatoren'] },
      { title: 'Meetapparatuur', links: ['Thermometers', 'Weegschalen', 'Saturatiemeters'] },
      { title: 'Onderhoud', links: ['Kalibratie', 'Reparatie', 'Reservematerialen'] },
      { title: 'Accessoires', links: ['Manchetten', 'Batterijen', 'Sensoren'] }
    ]
  },
  {
    title: 'Medische Instrumenten',
    items: [
      { title: 'Chirurgisch', links: ['Scharen', 'Pincetten', 'Klemmen', 'Naaldvoerders'] },
      { title: 'Onderzoek', links: ['Tongspatels', 'Specula', 'Sondes'] },
      { title: 'Dermatologie', links: ['Curetten', 'Bioptie', 'Lancetten'] },
      { title: 'Steriel', links: ['Setjes', 'Verpakkingen'] },
      { title: 'Re-usable', links: ['RVS instrumenten', 'Reiniging'] }
    ]
  },
  {
    title: 'Laboratorium',
    items: [
      { title: 'Verbruik', links: ['Pipetpunten', 'Buisjes', 'Cuvetten'] },
      { title: 'Glaswerk', links: ['Bekers', 'Kolven', 'Pipetten'] },
      { title: 'Chemie', links: ['Bufferoplossingen', 'Reagentia'] },
      { title: 'Opslag', links: ['Rekjes', 'Dozen', 'Cryo-opslag'] }
    ]
  },
  {
    title: 'Injectiematerialen',
    items: [
      { title: 'Naalden', links: ['Subcutaan', 'Intradermal', 'Veiligheidsnaalden'] },
      { title: 'Spuiten', links: ['2-delig', '3-delig', 'Insuline'] },
      { title: 'Infusie', links: ['Infuussets', 'Kranen', 'Katheters'] },
      { title: 'Prikbussen', links: ['Naaldcontainers', 'Afsluiters'] }
    ]
  },
  {
    title: 'Verbandmiddelen',
    items: [
      { title: 'Kompressen', links: ['Steriel', 'Niet-steriel'] },
      { title: 'Fixatie', links: ['Hechtpleisters', 'Zwachtels'] },
      { title: 'Wondzorg', links: ['Hydrogel', 'Foam', 'Alginaat'] },
      { title: 'Hechten', links: ['Hechtdraad', 'Nietjes', 'Hechtstrips'] }
    ]
  },
  {
    title: 'Verbruiksmaterialen',
    items: [
      { title: 'Handschoenen', links: ['Nitril', 'Latex', 'Vinyl'] },
      { title: 'Hygiëne', links: ['Doekjes', 'Desinfectie', 'Papier'] },
      { title: 'Bekers & bakjes', links: ['Samplecups', 'Patiëntenbekers'] },
      { title: 'Bescherming', links: ['Mondmaskers', 'Schorten', 'Haarnetten'] }
    ]
  },
  {
    title: 'Praktijkinrichting',
    items: [
      { title: 'Meubilair', links: ['Behandelbanken', 'Krukken', 'Kasten'] },
      { title: 'Verlichting', links: ['Onderzoekslampen', 'LED'] },
      { title: 'Opslag', links: ['Medikast', 'Lades', 'Dispensers'] }
    ]
  },
  {
    title: 'Anatomie',
    items: [
      { title: 'Modellen', links: ['Skelet', 'Spieren', 'Organsets'] },
      { title: 'Posters', links: ['Skelet', 'Spieren', 'Zintuigen'] },
      { title: 'Oefenmateriaal', links: ['Injectietrainers', 'Hechtpads'] }
    ]
  },
  {
    title: 'Drogisterij artikelen',
    items: [
      { title: 'Verzorging', links: ['Pleisters', 'Paracetamol', 'Cold/Hot packs'] },
      { title: 'EHBO', links: ['Sets', 'Navullingen'] },
      { title: 'Huid', links: ['Crèmes', 'Zalven'] }
    ]
  }
];

function createEl(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  children.forEach(c => el.appendChild(c));
  return el;
}

function renderDesktopMenu() {
  const root = document.getElementById('menuRoot');
  const host = document.getElementById('megaHost');
  if (!root || !host) return;

  menuData.forEach((m, idx) => {
    const li = createEl('li');
    const btn = createEl('button', {
      class: 'px-3 py-2 rounded-md hover:text-brand focus-ring',
      'data-idx': String(idx),
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
      'aria-controls': `mega-${idx}`
    });
    btn.textContent = m.title;
    li.appendChild(btn);
    root.appendChild(li);

    const panel = createEl('div', {
      id: `mega-${idx}`,
      class: 'absolute left-0 right-0 mx-auto container-wide px-4 hidden',
      role: 'region',
      'aria-label': m.title
    });
    const card = createEl('div', { class: 'mt-2 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden' });
    const grid = createEl('div', { class: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6' });
    m.items.forEach(col => {
      const h = createEl('h3', { class: 'font-semibold text-dark' });
      h.textContent = col.title;
      const ul = createEl('ul', { class: 'mt-2 space-y-1 text-sm text-gray-700' });
      col.links.forEach(l => {
        const a = createEl('a', { href: '#', class: 'hover:text-brand' }); a.textContent = l;
        const li = createEl('li', {}, [a]); ul.appendChild(li);
      });
      const wrap = createEl('div', {}, [h, ul]);
      grid.appendChild(wrap);
    });
    card.appendChild(grid);
    panel.appendChild(card);
    host.appendChild(panel);
  });

  // Interactions
  const buttons = root.querySelectorAll('button[aria-haspopup="true"]');
  let openIdx = null;
  function openPanel(idx) {
    closeAll();
    openIdx = idx;
    const btn = root.querySelector(`button[data-idx="${idx}"]`);
    const panel = document.getElementById(`mega-${idx}`);
    if (btn && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.remove('hidden');
      panel.dataset.open = 'true';
    }
  }
  function closeAll() {
    buttons.forEach(b => b.setAttribute('aria-expanded', 'false'));
    host.querySelectorAll('[id^="mega-"]').forEach(p => { p.classList.add('hidden'); p.removeAttribute('data-open'); });
    openIdx = null;
  }

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
  document.addEventListener('click', (e) => {
    if (!host.contains(e.target) && !root.contains(e.target)) closeAll();
  });

  // Focus trap inside open panel
  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const open = host.querySelector('[data-open="true"]');
    if (!open) return;
    const focusables = open.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

function renderMobileMenu() {
  const wrap = document.getElementById('mobileMenu');
  if (!wrap) return;
  menuData.forEach((m, idx) => {
    const details = createEl('details', { class: 'border-b border-gray-200', 'data-idx': String(idx) });
    const summary = createEl('summary', { class: 'px-3 py-3 font-semibold cursor-pointer hover:bg-gray-50' });
    summary.textContent = m.title;
    const inner = createEl('div', { class: 'px-3 pb-3 grid grid-cols-1 gap-4' });
    m.items.forEach(col => {
      const h = createEl('h3', { class: 'text-sm font-semibold text-dark mt-2' }); h.textContent = col.title;
      const ul = createEl('ul', { class: 'mt-1 space-y-1 text-sm text-gray-700' });
      col.links.forEach(l => { const a = createEl('a', { href: '#', class: 'hover:text-brand' }); a.textContent = l; ul.appendChild(createEl('li', {}, [a])); });
      inner.appendChild(createEl('div', {}, [h, ul]));
    });
    details.appendChild(summary);
    details.appendChild(inner);
    wrap.appendChild(details);
  });

  const toggle = document.getElementById('navToggle');
  const offcanvas = document.getElementById('offcanvas');
  const open = () => { offcanvas.classList.remove('hidden'); document.documentElement.classList.add('menu-open'); toggle.setAttribute('aria-expanded','true'); };
  const close = () => { offcanvas.classList.add('hidden'); document.documentElement.classList.remove('menu-open'); toggle.setAttribute('aria-expanded','false'); };
  toggle.addEventListener('click', () => offcanvas.classList.contains('hidden') ? open() : close());
  offcanvas.querySelectorAll('[data-close="offcanvas"]').forEach(b => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

async function loadPartials() {
  const headerPh = document.getElementById('header-placeholder');
  const footerPh = document.getElementById('footer-placeholder');
  if (headerPh) {
    try {
      const res = await fetch('/partials/header.html');
      headerPh.outerHTML = await res.text();
    } catch {}
  }
  if (footerPh) {
    try {
      const res = await fetch('/partials/footer.html');
      footerPh.outerHTML = await res.text();
    } catch {}
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadPartials();
  if (window.RemkaMenu && typeof window.RemkaMenu.init === 'function') {
    await window.RemkaMenu.init();
  }
});

// Export for devs to map Magento categories later
window.__remkaMenu = menuData;
// Placeholder for future enhancements\n