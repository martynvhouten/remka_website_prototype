(function(){
  const slugify = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/(^-|-$)/g, '');

  function formatTitle(raw){
    if(!raw) return '';
    let out = String(raw).trim().toLowerCase();
    const reps = [
      ['ecg','ECG'],['crp','CRP'],['hba1c','HbA1c'],['aed','AED'],['kno','KNO'],['ph ','pH '],['ph-','pH-'],['covid-19','COVID-19']
    ];
    reps.forEach(([k,v])=>{ out = out.replace(new RegExp(k,'g'), v); });
    return out.charAt(0).toUpperCase()+out.slice(1);
  }

  function withSlugs(node){
    return { name: node.name, slug: node.slug || slugify(node.name||''), children: Array.isArray(node.children)?node.children.map(withSlugs):[] };
  }

  async function loadCategories(){
    // Hyvä/Magento: categories are provided server-side; fallback to demo categories if present
    try {
      const res = await fetch('/data/categories.json', { cache: 'no-store' });
      if(res.ok){
        const json = await res.json();
        return Array.isArray(json.children) ? json : { children: json.children || [] };
      }
    } catch {}
    return { children: [] };
  }

  function findBySlug(nodes, slug){
    for(const n of nodes){ if(n.slug===slug) return n; const m = findBySlug(n.children||[], slug); if(m) return m; }
    return null;
  }

  async function loadProducts(){
    try {
      const res = await fetch('/data/products.json', { cache: 'no-store' });
      if(res.ok){ return await res.json(); }
    } catch {}
    return [];
  }

  function collectSubtreeSlugs(node){
    const out = new Set();
    const walk = (n) => {
      if(!n) return;
      if(n.slug) out.add(n.slug);
      (n.children||[]).forEach(walk);
    };
    walk(node);
    return out;
  }

  function renderBreadcrumbs(node){
    const leaf = document.getElementById('crumbLeaf');
    const sep = document.getElementById('crumbSep');
    const wrap = document.getElementById('crumbLeafWrap');
    const crumbCat = document.getElementById('crumbCat');
    if(leaf && sep && wrap){ leaf.textContent = node.name; sep.classList.remove('hidden'); wrap.classList.remove('hidden'); }
    if(crumbCat){ crumbCat.textContent = node.name; }
    const title = document.getElementById('catTitle'); if(title) title.textContent = node.name;
    const count = document.getElementById('catCount'); if(count) count.textContent = '0';
    const shortDesc = document.getElementById('catShortDesc'); if(shortDesc) shortDesc.textContent = 'SHORT_DESC';
  }

  function renderSubcategoryGrid(node){
    const host = document.getElementById('subcatGrid'); if(!host) return;
    const section = document.getElementById('subcatSection');
    host.innerHTML = '';
    const fallback = '/assets/images/placeholder-square.svg';
    const chips = document.getElementById('subcatChips'); if (chips) chips.innerHTML = '';
    const children = (node.children||[]);
    if(section) section.hidden = children.length === 0;
    const limit = 16;
    children.forEach((ch, idx) => {
      const a = document.createElement('a');
      a.href = `/subcategory.html?c=${encodeURIComponent(ch.slug)}`;
      a.className = 'card card--hover p-4 flex flex-col items-center text-center';
      a.innerHTML = `<img src="${fallback}" alt="${ch.name}" loading="lazy" class="rounded-md border border-light object-cover aspect-square" /><span class="mt-3 font-medium">${ch.name}</span>`;
      if(idx < limit) host.appendChild(a);
      if (chips) {
        const chip = document.createElement('a'); chip.href = a.href; chip.className = 'pill pill--sm'; chip.innerHTML = `<span class="dot"></span>${ch.name}`; chips.appendChild(chip);
      }
    });
    const btn = document.getElementById('showMoreSubcats');
    if(btn){
      btn.hidden = children.length <= 16;
      btn.addEventListener('click', ()=>{
        host.innerHTML = '';
        children.forEach((ch) => {
          const a = document.createElement('a');
          a.href = `/subcategory.html?c=${encodeURIComponent(ch.slug)}`;
          a.className = 'card card--hover p-4 flex flex-col items-center text-center';
          a.innerHTML = `<img src="${fallback}" alt="${ch.name}" loading="lazy" class="rounded-md border border-light object-cover aspect-square" /><span class="mt-3 font-medium">${ch.name}</span>`;
          host.appendChild(a);
        });
        btn.remove();
      }, { once: true });
    }
  }

  function renderCategoryDynamicBlocks(node){
    const host = document.getElementById('categoryDynamic'); if(!host) return;
    host.innerHTML = '';
    const makeCard = (title, text) => {
      const el = document.createElement('article'); el.className = 'card p-4';
      el.innerHTML = `<h3 class="font-semibold">${title}</h3><p class="mt-2 text-sm text-dark/80">${text}</p>`; return el;
    };
    const wrap = document.createElement('section'); wrap.className = 'grid md:grid-cols-3 gap-4';
    const name = (node && node.name || '').toLowerCase();
    if(name.includes('handschoen')){
      wrap.appendChild(makeCard('Welke maat kies je?', 'Meet handbreedte en gebruik maattabellen van het merk. Poedervrij is vaak geschikt voor algemene zorgtoepassingen.'));
      wrap.appendChild(makeCard('Materiaalkeuze', 'Nitril voor hoge bestendigheid en allergievriendelijk; latex voor tactiel gevoel; vinyl voor kortdurend gebruik.'));
      wrap.appendChild(makeCard('Voorraadadvies', 'Bepaal verbruik per maand en plan herhaalbestellingen om leverzekerheid te borgen.'));
    } else if(name.includes('desinfect')){
      wrap.appendChild(makeCard('Alcohol vs. alcoholvrij', 'Alcohol 70% voor snelle werking; alcoholvrij voor gevoelige oppervlakken of materialen.'));
      wrap.appendChild(makeCard('Dispensers', 'Kies navulbare dispensers voor lagere kosten en minder afval.'));
      wrap.appendChild(makeCard('Veilig gebruik', 'Volg inwerktijd op het etiket; voorkom menging van middelen.'));
    } else {
      wrap.appendChild(makeCard('Aankooptips', 'Let op compatibiliteit, onderhoud en levertijd.'));
      wrap.appendChild(makeCard('Veelgekozen', 'Bekijk populaire keuzes op basis van bestellingen en reviews.'));
      wrap.appendChild(makeCard('Service', 'Onderhoud en technische dienst beschikbaar voor diverse apparatuur.'));
    }
    const section = document.createElement('section'); section.className = 'container mx-auto px-0';
    section.appendChild(wrap); host.appendChild(section);
  }

  function demoProductsForCategory(node, count = 24){
    const catalog = {
      handschoenen: [
        { brand: 'Remka', title: 'Nitril handschoenen blauw – S', price: 11.95 },
        { brand: 'Remka', title: 'Nitril handschoenen blauw – M', price: 12.95 },
        { brand: 'CleanLab', title: 'Latex handschoenen gepoederd – L', price: 9.95 },
        { brand: 'Medico', title: 'Vinyl handschoenen transparant – M', price: 7.80 }
      ],
      desinfectie: [
        { brand: 'CleanLab', title: 'Alcohol 70% 1L', price: 8.75 },
        { brand: 'CleanLab', title: 'Handdesinfectie 500ml pomp', price: 6.90 },
        { brand: 'Remka', title: 'Oppervlakte reiniger 5L', price: 19.50 },
        { brand: 'ThermoCheck', title: 'Doekjes alcoholvrij – 200 st', price: 5.95 }
      ],
      verband: [
        { brand: 'Medico', title: 'Steriele gaaskompressen 10x10 – 100 st', price: 5.40 },
        { brand: 'Medico', title: 'Pleisters textiel – assorti', price: 3.95 },
        { brand: 'Remka', title: 'Elastische zwachtel 8cm', price: 2.60 },
        { brand: 'Remka', title: 'Wondfolie transparant 10x12', price: 7.20 }
      ],
      meetinstrumenten: [
        { brand: 'ThermoCheck', title: 'Digitale thermometer', price: 14.50 },
        { brand: 'ThermoCheck', title: 'Infrarood oor thermometer', price: 29.90 },
        { brand: 'Remka', title: 'Bloeddrukmeter manchet – M', price: 24.50 },
        { brand: 'Remka', title: 'Pulsoximeter', price: 39.00 }
      ]
    };
    const key = (node && node.slug) || '';
    const pool = catalog[key] || [...catalog.handschoenen, ...catalog.desinfectie, ...catalog.verband, ...catalog.meetinstrumenten];
    return Array.from({ length: count }).map((_, i) => {
      const base = pool[i % pool.length];
      return { sku: `DEMO-${key || 'GEN'}-${i+1}`, brand: base.brand, title: base.title, price: base.price };
    });
  }

  function stockBadge(product){
    const wrap = document.createElement('span');
    const dot = '<span class="dot"></span>';
    const stock = (product && product.stock) || 'in_stock';
    if(stock === 'in_stock'){
      wrap.className = 'stock-ok'; wrap.innerHTML = `${dot} Op voorraad`;
    } else if(stock === 'backorder'){
      wrap.className = 'stock-backorder'; wrap.innerHTML = `${dot} Speciaal voor je besteld`;
    } else if(stock === 'out_of_stock'){
      wrap.className = 'stock-out';
      const eta = product.eta ? ` – verwacht ${product.eta}` : '';
      wrap.innerHTML = `${dot} Niet op voorraad${eta}`;
    } else {
      wrap.className = 'badge'; wrap.textContent = 'Beschikbaarheid onbekend';
    }
    return wrap.outerHTML;
  }

  function renderProducts(products){
    const grid = document.getElementById('productGrid'); if(!grid) return;
    const section = document.getElementById('productsSection');
    const skel = document.getElementById('productGridSkeletons');
    const empty = document.getElementById('productEmpty');
    if(skel) skel.classList.add('hidden');
    grid.innerHTML = '';
    products.forEach(p=>{
      var card = (window.ProductCard && window.ProductCard.create) ? window.ProductCard.create({
        url: '/product.html',
        title: p.title,
        imageSrc: p.image || '/assets/images/placeholder-square.svg',
        imageAlt: p.title,
        price: p.price,
        sku: p.sku,
        availability: p.stock === 'out_of_stock' ? 'outOfStock' : (p.stock === 'backorder' ? 'backorder' : 'inStock'),
        badges: ['Topper']
      }) : null;
      if(card) grid.appendChild(card);
    });
    const count = document.getElementById('resultCount'); if(count) count.textContent = `${products.length} producten`;
    if(empty) empty.classList.toggle('hidden', products.length !== 0);
    if(section) section.hidden = false;

    // Persist for Recently Viewed (simulate when clicking)
    grid.querySelectorAll('[data-add-to-cart]').forEach(btn => {
      btn.addEventListener('click', () => rememberRecent({ sku: btn.getAttribute('data-sku'), title: btn.getAttribute('data-title'), price: parseFloat(btn.getAttribute('data-price')||'0'), image: btn.getAttribute('data-image') }));
    });
  }

  function renderPagination(current, total, onChange){
    const pag = document.getElementById('pagination'); if(!pag) return;
    const list = document.getElementById('pageList'); if(!list) return;
    list.innerHTML = '';
    pag.hidden = total <= 1;
    const makeBtn = (label, page, opts={}) => {
      const btn = document.createElement('button');
      btn.className = 'px-3 py-2 rounded-md border border-light bg-white text-sm hover:bg-light/40';
      btn.textContent = label;
      if(opts.current){ btn.className = 'px-3 py-2 rounded-md border border-light bg-brand text-white text-sm'; btn.setAttribute('aria-current','page'); }
      if(opts.disabled){ btn.setAttribute('disabled','disabled'); btn.classList.add('opacity-50','cursor-not-allowed'); }
      btn.addEventListener('click', ()=> onChange(page));
      return btn;
    };
    const prevLi = document.createElement('li'); prevLi.appendChild(makeBtn('Vorige', Math.max(1, current-1), { disabled: current===1 })); list.appendChild(prevLi);
    const maxPages = 5;
    let start = Math.max(1, current - Math.floor(maxPages/2));
    let end = Math.min(total, start + maxPages - 1);
    if(end - start + 1 < maxPages){ start = Math.max(1, end - maxPages + 1); }
    for(let p=start; p<=end; p++){
      const li = document.createElement('li'); li.appendChild(makeBtn(String(p), p, { current: p===current })); list.appendChild(li);
    }
    const nextLi = document.createElement('li'); nextLi.appendChild(makeBtn('Volgende', Math.min(total, current+1), { disabled: current===total })); list.appendChild(nextLi);
  }

  function rememberRecent(item){
    try {
      const key = 'remka_recent_items';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = list.filter(i => i.sku !== item.sku);
      filtered.unshift(item);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 12)));
    } catch {}
  }

  function renderBestRated(products){
    const host = document.getElementById('bestRatedStrip'); if(!host) return;
    const section = document.getElementById('bestRatedSection');
    host.innerHTML = '';
    const top = products.slice(0, 8);
    top.forEach(p => {
      const card = document.createElement('a'); card.href = '/product.html'; card.className = 'card card--hover p-4 flex flex-col';
      const stars = '★★★★★'.slice(0, 5); // dummy 5/5
      card.innerHTML = `
        <div class="card-product__media"><img src="${p.image || '/assets/images/placeholder-4x3.svg'}" alt="${p.title}" loading="lazy" class="media-img"/></div>
        <div class="mt-3 text-sm text-dark/70">${p.brand}</div>
        <h3 class="mt-1 font-semibold text-dark line-clamp-2">${p.title}</h3>
        <div class="mt-1 text-sm text-dark/80">${stars} <span class="badge--soft">5.0</span></div>
        <div class="mt-2 font-semibold">€ ${p.price.toFixed(2)}</div>
      `;
      host.appendChild(card);
    });
    if(section) section.hidden = top.length === 0;
  }

  function renderRecentlyViewed(){
    const host = document.getElementById('recentlyViewedStrip'); if(!host) return;
    const section = document.getElementById('recentlyViewedSection');
    host.innerHTML = '';
    let items = [];
    try { items = JSON.parse(localStorage.getItem('remka_recent_items') || '[]'); } catch {}
    if(section) section.hidden = items.length === 0;
    if(!items.length){ return; }
    items.slice(0, 12).forEach(p => {
      const card = document.createElement('a'); card.href = '/product.html'; card.className = 'card card--hover p-3 flex flex-col';
      card.innerHTML = `
        <div class="card-product__media"><img src="${p.image || '/assets/images/placeholder-4x3.svg'}" alt="${p.title}" loading="lazy" class="media-img"/></div>
        <div class="mt-2 text-sm text-dark/70">${p.title}</div>
      `; host.appendChild(card);
    });
  }

  function buildBrandFacet(allProducts, onChange){
    const host = document.getElementById('facetHost'); if(!host) return;
    host.innerHTML = '';
    const brands = Array.from(new Set(allProducts.map(p=>p.brand))).sort();
    const block = document.createElement('div');
    block.innerHTML = `<div class="font-semibold">Merk</div>`;
    const list = document.createElement('div'); list.className = 'mt-2 space-y-1';
    brands.forEach(b=>{
      const id = `facet-brand-${b.toLowerCase()}`;
      const row = document.createElement('label'); row.className = 'flex items-center gap-2 text-sm';
      row.innerHTML = `<input type="checkbox" class="rounded border-light" value="${b}" id="${id}"/><span>${b}</span>`;
      list.appendChild(row);
    });
    block.appendChild(list); host.appendChild(block);
    host.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change', onChange));
    const reset = document.getElementById('resetFilters'); if(reset) reset.addEventListener('click', ()=>{ host.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false); onChange(); });

    // Mirror to mobile overlay
    const mobile = document.getElementById('facetHostMobile');
    if (mobile) { mobile.innerHTML = block.outerHTML; mobile.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change', onChange)); }

    // Mobile overlay open/close
    const overlay = document.getElementById('filterOverlay');
    const openBtn = document.getElementById('openFilters');
    const closeBtn = document.getElementById('closeOverlay');
    const clearMobile = document.getElementById('clearFiltersMobile');
    const countBadge = document.getElementById('activeFilterCount');
    const updateCount = () => { const n = document.querySelectorAll('#facetHost input[type="checkbox"]:checked').length; if (countBadge) countBadge.textContent = String(n); };
    document.addEventListener('change', (e)=>{ if((e.target instanceof HTMLInputElement) && e.target.type==='checkbox') updateCount(); }); updateCount();
    const open = () => { if(!overlay) return; overlay.dataset.open = 'true'; overlay.removeAttribute('aria-hidden'); document.documentElement.classList.add('menu-open'); try { overlay.querySelector('input,button,select,textarea,a[href]')?.focus(); } catch {} };
    const close = () => { if(!overlay) return; overlay.dataset.open = 'false'; overlay.setAttribute('aria-hidden','true'); document.documentElement.classList.remove('menu-open'); };
    openBtn && openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    overlay && overlay.addEventListener('click', (e)=>{ const onBackdrop = e.target && e.target.getAttribute && e.target.getAttribute('data-close')==='overlay'; if(onBackdrop) close(); });
    clearMobile && clearMobile.addEventListener('click', ()=>{ document.querySelectorAll('#facetHost input[type="checkbox"]').forEach(cb => cb.checked = false); document.querySelectorAll('#facetHostMobile input[type="checkbox"]').forEach(cb => cb.checked = false); onChange(); updateCount(); });
    const applyBtn = document.getElementById('applyFiltersMobile');
    if(applyBtn){
      const updateApplyLabel = () => {
        const filters = document.querySelectorAll('#facetHost input[type="checkbox"]:checked').length;
        const countEl = document.getElementById('resultCount');
        const text = countEl ? countEl.textContent : '';
        applyBtn.textContent = filters ? `Toon resultaten (${text || ''})` : `Toon resultaten`;
      };
      document.addEventListener('change', (e)=>{ if((e.target instanceof HTMLInputElement) && e.target.type==='checkbox') updateApplyLabel(); });
      applyBtn.addEventListener('click', ()=>{ onChange(); close(); });
      updateApplyLabel();
    }
  }

  function syncUrl(params){
    const url = new URL(location.href);
    Object.entries(params).forEach(([k,v])=>{
      if(v === undefined || v === null || v === '' || (Array.isArray(v) && v.length===0)) url.searchParams.delete(k);
      else if(Array.isArray(v)) url.searchParams.set(k, v.join(','));
      else url.searchParams.set(k, String(v));
    });
    history.replaceState(null, '', url);
  }

  function parseArray(val){ return (String(val||'').split(',').map(s=>s.trim()).filter(Boolean)); }

  function bindToolbar(state){
    const select = document.getElementById('sortSelect');
    const gridBtn = document.getElementById('viewGrid');
    const listBtn = document.getElementById('viewList');
    const grid = document.getElementById('productGrid');
    const chipsHost = document.getElementById('activeChips');
    const url = new URL(location.href);
    // hydrate from URL
    const sortFromUrl = url.searchParams.get('sort');
    const viewFromUrl = url.searchParams.get('view');
    const brandsFromUrl = parseArray(url.searchParams.get('brand'));
    const pageFromUrl = parseInt(url.searchParams.get('page')||'1', 10);
    if(select && sortFromUrl) select.value = sortFromUrl;
    if(viewFromUrl === 'list' && grid){ grid.className = 'mt-4 grid grid-cols-1 gap-4'; }
    // pre-check brands
    if(brandsFromUrl.length){
      document.querySelectorAll('#facetHost input[type="checkbox"]').forEach(cb=>{ cb.checked = brandsFromUrl.includes(cb.value); });
      document.querySelectorAll('#facetHostMobile input[type="checkbox"]').forEach(cb=>{ cb.checked = brandsFromUrl.includes(cb.value); });
    }
    const apply = () => {
      const filters = Array.from(document.querySelectorAll('#facetHost input[type="checkbox"]:checked')).map(el=>el.value);
      let items = state.allProducts.filter(p => filters.length ? filters.includes(p.brand) : true);
      const value = select ? select.value : 'popularity';
      if(value==='price-asc') items.sort((a,b)=>a.price-b.price);
      else if(value==='price-desc') items.sort((a,b)=>b.price-a.price);
      else if(value==='new') items = items.slice().reverse();
      // pagination
      const perPage = grid && grid.className.includes('grid-cols-1') ? 12 : 16;
      const totalPages = Math.max(1, Math.ceil(items.length / perPage));
      let currentPage = Math.min(Math.max(1, pageFromUrl || 1), totalPages);
      const start = (currentPage - 1) * perPage;
      const pageItems = items.slice(start, start + perPage);
      renderProducts(pageItems);
      renderPagination(currentPage, totalPages, (p)=>{ url.searchParams.set('page', String(p)); history.replaceState(null,'',url); apply(); });
      syncUrl({ sort: value, brand: filters, view: grid && grid.className.includes('grid-cols-1') ? 'list' : 'grid', page: currentPage });
      // active chips
      if(chipsHost){
        chipsHost.innerHTML = '';
        filters.forEach(f=>{
          const chip = document.createElement('button');
          chip.className = 'pill pill--sm';
          chip.innerHTML = `<span class="dot"></span>${f}`;
          chip.addEventListener('click', ()=>{
            const cb = document.querySelector(`#facetHost input[type=checkbox][value="${f}"]`);
            const cbm = document.querySelector(`#facetHostMobile input[type=checkbox][value="${f}"]`);
            if(cb) cb.checked = false; if(cbm) cbm.checked = false; apply();
          });
          chipsHost.appendChild(chip);
        });
        if(filters.length){
          const clear = document.getElementById('clearAllFilters');
          if(clear){ clear.classList.remove('hidden'); clear.addEventListener('click', ()=>{
            document.querySelectorAll('#facetHost input[type=checkbox]').forEach(cb=>cb.checked=false);
            document.querySelectorAll('#facetHostMobile input[type=checkbox]').forEach(cb=>cb.checked=false);
            apply();
          }); }
        }
      }
    };
    if(select) select.addEventListener('change', apply);
    if(grid && gridBtn && listBtn){
      const setView = (mode) => {
        if(mode==='list'){
          grid.className = 'mt-4 grid grid-cols-1 gap-4';
          gridBtn.setAttribute('aria-pressed','false');
          listBtn.setAttribute('aria-pressed','true');
        } else {
          grid.className = 'mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
          gridBtn.setAttribute('aria-pressed','true');
          listBtn.setAttribute('aria-pressed','false');
        }
      };
      gridBtn.addEventListener('click', ()=> { setView('grid'); apply(); });
      listBtn.addEventListener('click', ()=> { setView('list'); apply(); });
      if(viewFromUrl){ setView(viewFromUrl); }
    }
    return apply;
  }

  function detectLevel(node){
    const depth = (node && Array.isArray(node.children)) ? 1 + Math.max(0, ...node.children.map(ch => detectLevel(ch))) : 1;
    // Using breadcrumb depth: root (level1), child (level2), leaf (level3)
    const isLeaf = !node || !Array.isArray(node.children) || node.children.length === 0;
    // If current node has children -> treat as level 1 or 2 depending on parentlessness. For simplicity: if node has children and parent is root -> level 2; if node is root -> level 1
    return { isLeaf, depth };
  }

  function applyLevelLayout(level){
    const left = document.getElementById('categoryLeftCol');
    const productsSection = document.getElementById('productsSection');
    const subcatSection = document.getElementById('subcatSection');
    const brandsStrip = document.getElementById('brandsStrip');
    const bestRatedSection = document.getElementById('bestRatedSection');
    const recentlyViewedSection = document.getElementById('recentlyViewedSection');
    const toolbar = document.querySelector('[data-partial="category-toolbar"]');
    const filtersBar = document.querySelector('[data-partial="category-filters"]');
    const longdesc = document.querySelector('[data-partial="category-longdesc"]');
    // level: 1, 2, 3
    if(level === 1){
      if(left) left.style.display = 'none';
      if(productsSection) productsSection.hidden = false;
      if(subcatSection) subcatSection.hidden = false;
      if(brandsStrip) brandsStrip.hidden = false;
      if(bestRatedSection) bestRatedSection.hidden = false;
      if(recentlyViewedSection) recentlyViewedSection.hidden = false;
      if(toolbar) toolbar.removeAttribute('hidden');
      if(filtersBar) filtersBar.setAttribute('hidden','true');
      if(longdesc) longdesc.removeAttribute('hidden');
    } else if(level === 2){
      if(left) left.style.display = '';
      if(productsSection) productsSection.hidden = false;
      if(subcatSection) subcatSection.hidden = true;
      if(brandsStrip) brandsStrip.hidden = false; // optional compact
      if(bestRatedSection) bestRatedSection.hidden = true;
      if(recentlyViewedSection) recentlyViewedSection.hidden = true;
      if(toolbar) toolbar.removeAttribute('hidden');
      if(filtersBar) filtersBar.removeAttribute('hidden');
      if(longdesc) longdesc.removeAttribute('hidden');
    } else { // level 3
      if(left) left.style.display = '';
      if(productsSection) productsSection.hidden = false;
      if(subcatSection) subcatSection.hidden = true;
      if(brandsStrip) brandsStrip.hidden = true;
      if(bestRatedSection) bestRatedSection.hidden = true;
      if(recentlyViewedSection) recentlyViewedSection.hidden = true;
      if(toolbar) toolbar.removeAttribute('hidden');
      if(filtersBar) filtersBar.removeAttribute('hidden');
      if(longdesc) longdesc.removeAttribute('hidden');
    }
  }

  async function init(){
    try {
      const data = await loadCategories();
      const nodes = Array.isArray(data)?data:(data.children||[]);
      const nodesWithSlugs = nodes.map(withSlugs);
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('c');
      const node = slug ? findBySlug(nodesWithSlugs, slug) : nodesWithSlugs[0];
      if(!node) return;
      renderBreadcrumbs(node);
      renderSubcategoryGrid(node);
      renderCategoryDynamicBlocks(node);
      // level detection based on taxonomy depth and presence of children
      const isLeaf = !node.children || node.children.length === 0;
      const isRoot = !slug;
      const level = isRoot ? 1 : (isLeaf ? 3 : 2);
      applyLevelLayout(level);
      // Show skeletons while preparing
      const skel = document.getElementById('productGridSkeletons'); if(skel) skel.classList.remove('hidden');
      const allProducts = await loadProducts();
      const subtreeSlugs = collectSubtreeSlugs(node);
      const productsForCategory = allProducts.filter(p => Array.isArray(p.categories) && p.categories.some(c => subtreeSlugs.has(c)));
      const products = productsForCategory.length ? productsForCategory : allProducts.slice(0, 16);
      const state = { allProducts: products };
      renderProducts(products);
      renderBestRated(products);
      renderRecentlyViewed();
      buildBrandFacet(products, () => apply());
      const apply = bindToolbar(state);
      apply && apply();
      const clear = document.getElementById('clearAllFilters');
      if(clear){ clear.addEventListener('click', ()=>{
        document.querySelectorAll('#facetHost input[type="checkbox"]').forEach(cb=> cb.checked=false);
        document.querySelectorAll('#facetHostMobile input[type="checkbox"]').forEach(cb=> cb.checked=false);
        if(typeof apply === 'function') apply();
      }); }
      const count = document.getElementById('catCount'); if(count) count.textContent = String(products.length);
      // long desc toggle
      const longSection = document.getElementById('longDescSection');
      const longBody = document.getElementById('longDescBody');
      const toggleLong = document.getElementById('toggleLongDesc');
      if(longSection && longBody && toggleLong){
        longSection.hidden = false;
        const collapse = () => { longBody.style.maxHeight = '8rem'; longBody.style.overflow = 'hidden'; toggleLong.setAttribute('aria-expanded','false'); toggleLong.textContent = 'Lees meer'; };
        const expand = () => { longBody.style.maxHeight = ''; longBody.style.overflow = ''; toggleLong.setAttribute('aria-expanded','true'); toggleLong.textContent = 'Minder tonen'; };
        collapse();
        toggleLong.addEventListener('click', ()=>{
          const expanded = toggleLong.getAttribute('aria-expanded') === 'true';
          if(expanded) collapse(); else expand();
        });
      }
    } catch (e) {
    const title = document.getElementById('catTitle'); if(title) title.textContent = 'Assortiment';
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


