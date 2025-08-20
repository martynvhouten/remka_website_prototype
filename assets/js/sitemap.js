(function(){
  const icon = {
    home: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 3l9 6v12H3V9l9-6Zm0 2.2L5 10v9h14v-9l-7-4.8Z"/></svg>',
    category: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 7v-7h7v7h-7Z"/></svg>',
    sub: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M4 11h7V4H4v7Zm0 9h7v-7H4v7Zm9 0h7v-7h-7v7Zm0-16v7h7V4h-7Z"/></svg>',
    product: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21 7 12 2 3 7v10l9 5 9-5V7Zm-9 3.18L6.47 7.4 12 4.72l5.53 2.68L12 10.18Z"/></svg>'
  };

  // Icons for expand/collapse state on tree toggles
  const iconMinus = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 11h10v2H7z"/></svg>';
  const iconPlus = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M11 7v10h2V7z"/><path d="M7 11h10v2H7z"/></svg>';

  const slugify = (s) => (s || '').toLowerCase()
    .normalize('NFD').replace(/[\p{Diacritic}]/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/(^-|-$)/g, '');

  function withSlugs(node){
    return {
      name: node.name,
      slug: node.slug || slugify(node.name||''),
      children: Array.isArray(node.children) ? node.children.map(withSlugs) : []
    };
  }

  async function loadCategories(){
    try {
      const res = await fetch('/data/categories.json', { cache: 'no-store' });
      if(res.ok){
        const json = await res.json();
        return Array.isArray(json.children) ? json : { children: json.children || [] };
      }
    } catch {}
    return { children: [] };
  }

  async function loadProducts(){
    try{ const res = await fetch('/data/products.json', { cache: 'no-store' }); if(res.ok) return await res.json(); } catch{}
    return [];
  }

  async function loadFeatured(){
    try{ const res = await fetch('/data/featured.json', { cache: 'no-store' }); if(res.ok) return await res.json(); } catch{}
    return { shortcuts: [], cats: [], products: [] };
  }

  function collectProductsByCategory(products){
    const map = new Map();
    products.forEach(p => {
      const cats = Array.isArray(p.categories) ? p.categories : [];
      cats.forEach(c => {
        if(!map.has(c)) map.set(c, []);
        if(map.get(c).length < 3) map.get(c).push(p); // max 3 demo items per cat
      });
    });
    return map;
  }

  function renderTree(rootNode, productsByCat){
    const host = document.getElementById('sitemapTree'); if(!host) return;
    host.innerHTML = '';

    const makeToggle = () => {
      const btn = document.createElement('button');
      btn.className = 'w-6 h-6 shrink-0 rounded-md border border-light text-dark/80 grid place-items-center hover:bg-light/40';
      // default collapsed
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = iconPlus;
      btn.dataset.toggle = 'tree';
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        // switch to plus when collapsed, minus when expanded
        btn.innerHTML = expanded ? iconPlus : iconMinus;
        const next = btn.parentElement && btn.parentElement.nextElementSibling;
        if(next) next.classList.toggle('hidden');
      });
      return btn;
    };

    const createItem = (label, href, level = 0, kind = 'category') => {
      const row = document.createElement('div');
      const ml = level <= 0 ? '' : (level === 1 ? 'ml-4' : (level === 2 ? 'ml-8' : 'ml-12'));
      row.className = `flex items-center gap-2 ${ml}`.trim();
      const iconWrap = document.createElement('span'); iconWrap.className = 'w-6 h-6 text-brand grid place-items-center'; iconWrap.innerHTML = icon[kind] || icon.category;
      const link = document.createElement('a');
      link.className = 'inline-flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-light/40 focus:outline-none focus:ring-2 focus:ring-brand';
      link.href = href; link.innerHTML = `<span class=\"font-semibold\">${label}</span>`;
      link.setAttribute('aria-label', label);
      row.appendChild(iconWrap); row.appendChild(link);
      return row;
    };

    const createChildrenWrap = () => {
      const box = document.createElement('div');
      box.className = 'ml-8 pl-3 border-l border-light space-y-2';
      return box;
    };

    const tree = document.createElement('div');
    tree.className = 'space-y-2';

    // Root: Home -> Assortment -> Main categories
    const home = createItem('Home', '/index.html', 0, 'home');
    tree.appendChild(home);

    const assort = createItem('Assortiment', '/category.html', 0, 'category');
    const assortLine = document.createElement('div'); assortLine.className = 'flex items-center gap-2';
    const toggleAssort = makeToggle();
    assortLine.appendChild(toggleAssort); assortLine.appendChild(assort);
    tree.appendChild(assortLine);

    const assortChildren = createChildrenWrap();
    // default collapsed
    assortChildren.classList.add('hidden');
    tree.appendChild(assortChildren);

    const nodes = Array.isArray(rootNode) ? rootNode : (rootNode.children || []);
    nodes.forEach(cat => {
      const catRowWrap = document.createElement('div'); catRowWrap.className = 'space-y-2';
      const catLine = document.createElement('div'); catLine.className = 'flex items-center gap-2';
      const t = makeToggle();
      const catRow = createItem(cat.name, `/c/${encodeURIComponent(cat.slug)}`, 0, 'category');
      catLine.appendChild(t); catLine.appendChild(catRow);
      catRowWrap.appendChild(catLine);
      const catChildren = createChildrenWrap();
      // default collapsed
      catChildren.classList.add('hidden');

      // Subcategories
      (cat.children || []).forEach(sub => {
        const subWrap = document.createElement('div'); subWrap.className = 'space-y-2';
        const subLine = document.createElement('div'); subLine.className = 'flex items-center gap-2';
        const t2 = makeToggle();
        const subRow = createItem(sub.name, `/c/${encodeURIComponent(cat.slug)}/${encodeURIComponent(sub.slug)}`, 1, 'sub');
        subLine.appendChild(t2); subLine.appendChild(subRow);
        subWrap.appendChild(subLine);
        const prodWrap = createChildrenWrap();
        // default collapsed
        prodWrap.classList.add('hidden');

        // Optional: show up to 3 product links for this subcategory
        const prods = productsByCat.get(sub.slug) || [];
        const prodList = document.createElement('div'); prodList.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2';
        prods.forEach(p => {
          const a = document.createElement('a');
          // Route to demo variants based on stock where possible
           let href = '/product.html';
          if(p.stock === 'in_stock') href = '/product.html?stock=in_stock';
          else if(p.stock === 'backorder') href = '/product.html?stock=backorder';
          else if(p.stock === 'out_of_stock') href = '/product.html?stock=out_of_stock';
          a.href = href;
          a.className = 'card card--hover p-2 flex items-center justify-between gap-2';
          a.setAttribute('aria-label', p.title);
          const left = document.createElement('div'); left.className = 'flex items-center gap-2 min-w-0';
          const img = document.createElement('img'); img.src = p.image || '/assets/images/placeholder-4x3.svg'; img.alt = p.title; img.loading = 'lazy'; img.className = 'w-10 h-10 object-contain border border-light rounded';
          const txt = document.createElement('span'); txt.className = 'text-sm line-clamp-2'; txt.textContent = p.title;
          left.appendChild(img); left.appendChild(txt); a.appendChild(left);
          const badge = document.createElement('span');
          const dot = '<span class="dot"></span>';
          if(p.stock === 'in_stock'){ badge.className = 'stock-ok'; badge.innerHTML = `${dot} Op voorraad`; }
          else if(p.stock === 'backorder'){ badge.className = 'stock-backorder'; badge.innerHTML = `${dot} Speciaal voor je besteld`; }
          else if(p.stock === 'out_of_stock'){ badge.className = 'stock-out'; badge.innerHTML = `${dot} Niet op voorraad`; }
          else { badge.className = 'badge'; badge.textContent = 'Onbekend'; }
          a.appendChild(badge);
          prodList.appendChild(a);
        });
        if (prods.length) prodWrap.appendChild(prodList);
        subWrap.appendChild(prodWrap);
        catChildren.appendChild(subWrap);
      });

      catRowWrap.appendChild(catChildren);
      assortChildren.appendChild(catRowWrap);
    });

    // Controls: expand/collapse all
    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2 mb-3';
    const btnExpandAll = document.createElement('button');
    btnExpandAll.type = 'button';
    btnExpandAll.className = 'pill pill--sm';
    btnExpandAll.innerHTML = '<span class="dot"></span> Alles uitklappen';
    const btnCollapseAll = document.createElement('button');
    btnCollapseAll.type = 'button';
    btnCollapseAll.className = 'pill pill--sm';
    btnCollapseAll.innerHTML = '<span class="dot"></span> Alles inklappen';

    function setAll(expanded){
      const toggles = tree.querySelectorAll('button[aria-expanded]');
      toggles.forEach(btn => {
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        btn.innerHTML = expanded ? iconMinus : iconPlus;
        const next = btn.parentElement && btn.parentElement.nextElementSibling;
        if(next){
          if(expanded) next.classList.remove('hidden');
          else next.classList.add('hidden');
        }
      });
    }
    btnExpandAll.addEventListener('click', () => setAll(true));
    btnCollapseAll.addEventListener('click', () => setAll(false));
    controls.appendChild(btnExpandAll);
    controls.appendChild(btnCollapseAll);

    host.appendChild(controls);
    host.appendChild(tree);
  }

  function renderFeatured(data){
    const section = document.getElementById('featuredSection');
    const shortcuts = document.getElementById('featuredShortcuts');
    const catsHost = document.getElementById('featuredCats');
    const prodsHost = document.getElementById('featuredProds');
    if(!section || !shortcuts || !catsHost || !prodsHost) return;
    const { shortcuts: sc = [], cats = [], products = [] } = data || {};
    section.hidden = !(sc.length || cats.length || products.length);
    shortcuts.innerHTML = '';
    sc.forEach(s => {
      const a = document.createElement('a');
      a.href = s.href; a.className = 'pill'; a.innerHTML = `<span class="dot"></span> ${s.label}`; shortcuts.appendChild(a);
    });
    catsHost.innerHTML = '';
    cats.forEach(c => {
      const a = document.createElement('a');
      a.href = c.href || `/c/${encodeURIComponent(c.slug||'')}`;
      a.className = 'card card--hover p-3'; a.innerHTML = `<div class="font-semibold">${c.label || c.name}</div>`;
      catsHost.appendChild(a);
    });
    prodsHost.innerHTML = '';
    products.forEach(p => {
      const a = document.createElement('a'); a.href = p.href || '/product.html'; a.className = 'card card--hover p-3 flex items-center gap-3';
     a.innerHTML = `<img src="${p.image || '/assets/images/placeholder-square.svg'}" alt="${p.label||''}" loading="lazy" decoding="async" width="48" height="48" class="w-12 h-12 object-contain border border-light rounded"/><div class="font-semibold">${p.label}</div>`;
      prodsHost.appendChild(a);
    });
  }

  async function init(){
    try {
      const catsRaw = await loadCategories();
      const nodes = Array.isArray(catsRaw) ? catsRaw : (catsRaw.children || []);
      const nodesWithSlugs = nodes.map(withSlugs);
      const products = await loadProducts();
      const productsByCat = collectProductsByCategory(products);
      renderTree(nodesWithSlugs, productsByCat);
      const featured = await loadFeatured();
      renderFeatured(featured);
    } catch {}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
  document.addEventListener('partials:loaded', init);
})();


