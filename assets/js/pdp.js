(function(){
  // Minimal PDP data/render helpers (no CSS changes)
  function loadJson(url){ return fetch(url, { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()); }

  async function loadProducts(){
    try { return await loadJson('/data/products.json'); } catch {}
    try { return await loadJson('/fixtures/products.json'); } catch {}
    return [];
  }

  function mapStockToAvailability(stock){
    if(stock === 'out_of_stock') return 'outOfStock';
    if(stock === 'backorder') return 'backorder';
    return 'inStock';
  }

  function getCurrentSku(){
    var btn = document.querySelector('[data-add-to-cart]');
    return btn ? (btn.getAttribute('data-sku') || '').trim() : '';
  }

  function getCurrentName(){
    var btn = document.querySelector('[data-add-to-cart]');
    var h1 = document.querySelector('h1');
    return (btn && btn.getAttribute('data-title')) || (h1 && h1.textContent.trim()) || '';
  }

  function normalizeProduct(p){
    return {
      id: p.id || p.sku || null,
      sku: p.sku || '',
      name: p.title || p.name || '',
      shortDescription: p.shortDescription || '',
      longHtml: p.longDescription || p.longHtml || '',
      attributes: p.attributes || p.specs || null,
      category: Array.isArray(p.categories) ? p.categories : [],
      related: p.related || p.relatedSkus || p.crossSellSkus || [],
      price: p.price,
      image: p.image,
      images: p.images || (p.image ? [p.image] : []),
      stock: p.stock,
      eta: p.eta || null,
      brand: p.brand || ''
    };
  }

  function selectRelated(current, all){
    var cats = new Set(current.category || []);
    var candidates = all.filter(function(p){ return p.sku !== current.sku; });
    if(Array.isArray(current.related) && current.related.length){
      var relSet = new Set(current.related);
      candidates = candidates.filter(function(p){ return relSet.has(p.sku); });
    } else {
      candidates = candidates.filter(function(p){ return p.category.some(function(c){ return cats.has(c); }); });
    }
    candidates.sort(function(a,b){
      var overlapA = a.category.filter(function(c){ return cats.has(c); }).length;
      var overlapB = b.category.filter(function(c){ return cats.has(c); }).length;
      if(overlapA !== overlapB) return overlapB - overlapA;
      return String(a.name).localeCompare(String(b.name), 'nl');
    });
    return candidates.slice(0, 8); // limit 4–8; we’ll render up to 8 and hide if 0
  }

  function renderLongDescription(longHtml){
    var host = document.getElementById('pdpLongDescription');
    if(!host){ return; }
    if(!longHtml){ return; }
    if(/<\w+/.test(longHtml)) { host.innerHTML = longHtml; }
    else { host.textContent = String(longHtml); }
  }

  async function ensureProductCardTemplate(){
    if(document.getElementById('ProductCardTemplate')) return;
    try {
      var res = await fetch('/components/ProductCard.html', { cache: 'no-store' });
      if(!res.ok) return;
      var html = await res.text();
      var div = document.createElement('div');
      div.innerHTML = html;
      var tpl = div.querySelector('#ProductCardTemplate');
      if(tpl) document.body.appendChild(tpl);
    } catch {}
  }

  async function loadDemoRelated(){
    try { return await (await fetch('/data/demoRelated.json', { cache: 'no-store' })).json(); } catch { return []; }
  }

  async function renderRelated(related){
    await ensureProductCardTemplate();
    var section = document.getElementById('relatedGrid') && document.getElementById('relatedGrid').closest('section');
    var grid = document.getElementById('relatedGrid');
    if(!grid){
      // Create a minimal section at the end of main
      var main = document.getElementById('main') || document.body;
      section = document.createElement('section');
      section.className = 'container mx-auto py-8 section';
      section.innerHTML = '<h2 class="text-xl font-bold">Gerelateerde producten</h2><div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4" id="relatedGrid"></div>';
      main.appendChild(section);
      grid = section.querySelector('#relatedGrid');
    }
    // If none, try demo related JSON; if still none, hide section
    if(!Array.isArray(related) || related.length === 0){
      related = await loadDemoRelated();
      if(!Array.isArray(related) || related.length === 0){ if(section) section.hidden = true; return; }
    }
    var items = related.slice(0, Math.min(8, related.length)).map(function(p){
      return {
        url: '/product.html',
        title: p.title || p.name,
        price: p.price,
        imageSrc: p.image || p.imageSrc || '/assets/images/placeholder-square.svg',
        imageAlt: p.name || p.title,
        sku: p.sku,
        availability: mapStockToAvailability(p.stock)
      };
    });
    if(window.ProductCard && typeof window.ProductCard.render === 'function'){
      window.ProductCard.render(grid, items);
      try { console.log('[PDP] related count:', items.length); } catch {}
    }
  }

  async function init(){
    // Run on PDP pages when BuyBox or LongDescription exists
    var isPdp = document.querySelector('[data-partial="pdp/BuyBox"]') || document.getElementById('pdpLongDescription');
    if(!isPdp) return;
    var sku = getCurrentSku();
    var name = getCurrentName();
    var productsRaw = await loadProducts();
    var products = productsRaw.map(normalizeProduct);
    var current = products.find(function(p){ return p.sku === sku; }) || { sku: sku, name: name, category: [] };

    // Long description source detection
    var longHtml = current.longHtml;
    if(!longHtml){
      // fallback candidates: inline shortDescription element on page
      var shortEl = document.getElementById('shortDescription');
      if(shortEl && shortEl.textContent.trim()){ longHtml = shortEl.innerHTML || shortEl.textContent.trim(); }
    }
    renderLongDescription(longHtml);

    // Related strategy
    var related = selectRelated(current, products);
    renderRelated(related);

    // Quantity increment/decrement
    try {
      var qtyInput = document.getElementById('qty');
      var decBtn = document.querySelector('[data-qty-decrement]');
      var incBtn = document.querySelector('[data-qty-increment]');
      function clamp(val){ var n = Math.max(1, Math.floor(Number(val)||1)); return n; }
      if(qtyInput){ qtyInput.value = clamp(qtyInput.value); }
      if(decBtn){ decBtn.addEventListener('click', function(){ if(!qtyInput) return; qtyInput.value = clamp((Number(qtyInput.value)||1) - 1); }); }
      if(incBtn){ incBtn.addEventListener('click', function(){ if(!qtyInput) return; qtyInput.value = clamp((Number(qtyInput.value)||1) + 1); }); }
    } catch {}
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
  document.addEventListener('partials:loaded', function(){ setTimeout(init, 0); });
})();


