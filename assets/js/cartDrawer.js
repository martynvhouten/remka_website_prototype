(function(){
  // Cart Drawer (right-side, accessible, optimistic UI)
  var HOST_ID = 'cart-drawer-host';
  var OPEN_CLASS = 'dialog-open';

  function ensureHost(){
    var host = document.getElementById(HOST_ID);
    if(host) return host;
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
    return host;
  }

  function lockScroll(){ try { document.documentElement.classList.add(OPEN_CLASS); } catch(_) {} }
  function unlockScroll(){ try { document.documentElement.classList.remove(OPEN_CLASS); } catch(_) {} }

  function fmtCurrency(amount, currency){
    try { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 2 }).format(Number(amount||0)); }
    catch(_) { var n=(Number(amount||0)).toFixed(2).replace('.', ','); return '€ ' + n; }
  }
  function sanitizeUrl(url){ try { return String(url||''); } catch(_) { return ''; } }

  function getFocusables(container){
    var f = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(f, function(el){ return !el.hasAttribute('disabled') && el.offsetParent !== null; });
  }

  // Lightweight state for optimistic UI
  var state = { items: [], currency: 'EUR' };

  function findIndexBySku(sku){ return state.items.findIndex(function(x){ return x.sku === sku; }); }
  function addOrMergeItem(it){
    var idx = findIndexBySku(it.sku);
    if(idx >= 0){ state.items[idx].qty += Number(it.qty||1); }
    else { state.items.push({
      id: it.id || it.sku,
      sku: String(it.sku||''),
      name: String(it.name||'Product'),
      url: sanitizeUrl(it.url || '/product.html'),
      thumbnail: sanitizeUrl(it.thumbnail || it.image || '/assets/images/placeholder-square.svg'),
      attributes: it.attributes || null,
      unitPrice: Number(it.unitPrice || it.price || 0),
      qty: Number(it.qty || 1)
    }); }
  }
  function removeBySku(sku){ var i = findIndexBySku(sku); if(i>=0) state.items.splice(i,1); }
  function subtotal(){ return state.items.reduce(function(sum, it){ return sum + (it.unitPrice * it.qty); }, 0); }

  async function loadProducts(){
    try { var r = await fetch('/data/products.json', { cache: 'no-store' }); if(r.ok) return await r.json(); } catch{}
    try { var r2 = await fetch('/fixtures/products.json', { cache: 'no-store' }); if(r2.ok) return await r2.json(); } catch{}
    return [];
  }
  function normalizeProduct(p){
    return {
      id: p && (p.id || p.sku) || null,
      sku: p && p.sku || '',
      name: p && (p.title || p.name) || '',
      image: p && (p.image || p.imageSrc) || '/assets/images/placeholder-square.svg',
      price: p && p.price,
      categories: Array.isArray(p && p.categories) ? p.categories : [],
      url: '/product.html'
    };
  }
  function selectRecommendations(addedItem, all){
    var items = Array.isArray(all) ? all : [];
    var cats = new Set(Array.isArray(addedItem && addedItem.category) ? addedItem.category : []);
    var filtered = items.filter(function(p){ return p.sku !== (addedItem && addedItem.sku); });
    if(cats.size){ filtered = filtered.filter(function(p){ return Array.isArray(p.categories) && p.categories.some(function(c){ return cats.has(c); }); }); }
    filtered.sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||''), 'nl'); });
    return filtered.slice(0, 8).map(normalizeProduct);
  }

  function renderAttrs(attrs){
    if(!attrs) return '';
    try {
      var html = '';
      Object.keys(attrs).forEach(function(k){ var v = attrs[k]; if(v==null||v==='') return; html += '<span class="pill pill--sm pill--neutral">'+String(k)+': '+String(v)+'</span> '; });
      return html;
    } catch(_) { return ''; }
  }

  function template(){
    var itemsHtml = state.items.map(function(it){
      var line = it.unitPrice * it.qty;
      return ''
        + '<div class="flex items-start gap-3 border-b border-light pb-3" data-line data-sku="'+it.sku+'">'
        +   '<img src="'+sanitizeUrl(it.thumbnail)+'" alt="'+String(it.name)+'" loading="lazy" decoding="async" width="64" height="64" class="w-16 h-16 object-contain rounded"/>'
        +   '<div class="min-w-0 flex-1">'
        +     '<a href="'+sanitizeUrl(it.url)+'" class="font-semibold link-cta">'+String(it.name)+'</a>'
        +     (it.attributes ? ('<div class="mt-1 space-x-1">'+renderAttrs(it.attributes)+'</div>') : '')
        +     '<div class="mt-2 flex items-center justify-between gap-3">'
        +       '<div class="inline-flex items-center gap-1 border border-light rounded qty-control" role="group" aria-label="Aantal">'
        +         '<button class="btn-sm" data-qty-dec aria-label="Minder">−</button>'
        +         '<input type="number" class="input input-sm w-14 text-center" data-qty-input min="1" step="1" value="'+String(it.qty)+'" aria-label="Aantal" />'
        +         '<button class="btn-sm" data-qty-inc aria-label="Meer">+</button>'
        +       '</div>'
        +       '<div class="text-sm font-semibold" data-line-total>'+fmtCurrency(line, state.currency)+'</div>'
        +     '</div>'
        +     '<div class="mt-2 text-sm text-dark/70">'
        +       '<span>'+String(it.qty)+' × '+fmtCurrency(it.unitPrice, state.currency)+'</span>'
        +     '</div>'
        +     '<div class="mt-2">'
        +       '<button class="btn btn-outline btn-sm" data-remove aria-label="Verwijder">Verwijderen</button>'
        +     '</div>'
        +   '</div>'
        + '</div>';
    }).join('');
    if(!itemsHtml){ itemsHtml = '<div class="empty"><div class="empty__title">Je winkelwagen is leeg</div><div class="empty__text">Voeg producten toe om verder te gaan.</div></div>'; }

    return ''
    + '<div class="cartdrawer" role="dialog" aria-modal="true" aria-labelledby="cartDrawerTitle" data-state="closed">'
    +   '<button class="drawer-overlay" data-close="drawer" aria-label="Sluiten"></button>'
    +   '<div class="cart-drawer__panel" data-cart-panel tabindex="-1">'
    +     '<div class="flex items-center justify-between px-4 py-3 border-b border-light">'
    +       '<h2 id="cartDrawerTitle" class="text-lg font-extrabold">Winkelwagen</h2>'
    +       '<button class="p-2 rounded-md border border-light" data-close="drawer" aria-label="Sluiten">✕</button>'
    +     '</div>'
    +     '<div class="flex-1 overflow-auto p-4 space-y-4" data-items>'+itemsHtml+'</div>'
    +     '<div class="border-t border-light p-4 space-y-3">'
    +       '<div class="flex items-center justify-between text-sm"><span>Subtotaal</span><span data-subtotal>'+fmtCurrency(subtotal(), state.currency)+'</span></div>'
    +       '<div class="flex gap-2">'
    +         '<a href="/checkout-shipping.html" class="btn btn-brand w-1/2" data-cta="checkout">Afrekenen</a>'
    +         '<a href="/cart.html" class="btn btn-outline w-1/2" data-cta="view-cart">Bekijk winkelwagen</a>'
    +       '</div>'
    +       '<button type="button" class="btn btn-glass w-full" data-cta="continue">Verder winkelen</button>'
    +       '<div class="divider"></div>'
    +       '<div>'
    +         '<div class="font-extrabold">Aanbevolen voor jou</div>'
    +         '<div class="mt-3 h-scroll -mx-1 px-1" data-reco-rail>'
    +           '<div class="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-3" data-reco-items></div>'
    +         '</div>'
    +       '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div class="sr-only" aria-live="polite" id="cartDrawerLive"></div>'
    + '</div>';
  }

  function renderRecoItem(p){
    var html = ''
      + '<div class="card p-3 flex flex-col" data-reco-item>'
      +   '<a href="'+sanitizeUrl(p.url)+'" class="block">'
      +     '<img src="'+sanitizeUrl(p.image)+'" alt="'+String(p.name||'')+'" loading="lazy" decoding="async" width="160" height="160" class="w-full h-32 object-contain rounded" />'
      +     '<div class="mt-2 text-sm font-semibold line-clamp-2">'+String(p.name||'')+'</div>'
      +   '</a>'
      +   '<div class="mt-1 text-sm font-semibold">'+fmtCurrency(p.price, 'EUR')+'</div>'
      +   '<button class="btn btn-card mt-2" data-reco-add data-sku="'+String(p.sku||'')+'">Toevoegen</button>'
      + '</div>';
    var div = document.createElement('div');
    div.innerHTML = html; return div.firstElementChild;
  }

  function openDrawer(opts){
    // Merge added item into state
    if(opts && opts.addedItem){ addOrMergeItem(opts.addedItem); }

    var host = ensureHost();
    host.innerHTML = template();
    var root = host.firstElementChild;
    var panel = root && root.querySelector('[data-cart-panel]');
    var itemsEl = root && root.querySelector('[data-items]');
    var subEl = root && root.querySelector('[data-subtotal]');
    var live = root && root.querySelector('#cartDrawerLive');
    if(live && opts && opts.addedItem){ live.textContent = 'Toegevoegd '+(opts.addedItem.name||'product')+' aan je winkelwagen.'; }

    function close(){ try { root.setAttribute('data-state','closed'); } catch{} try { unlockScroll(); } catch{} setTimeout(function(){ if(host) host.innerHTML=''; returnFocus(); }, 220); }
    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    function onOverlayClick(e){ if(e.target && e.target.getAttribute('data-close') === 'drawer'){ e.preventDefault(); close(); } }
    root.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', onKey);

    // Focus trap
    var untrap = null;
    function trap(){
      var focusables = getFocusables(root);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      function onTrap(e){
        if(e.key !== 'Tab') return;
        if(focusables.length === 0) return;
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
      document.addEventListener('keydown', onTrap);
      setTimeout(function(){ (first || panel || root).focus(); }, 0);
      untrap = function(){ document.removeEventListener('keydown', onTrap); document.removeEventListener('keydown', onKey); };
    }
    var invoker = (opts && opts.invoker) || document.activeElement;
    function returnFocus(){ try { if(invoker && typeof invoker.focus === 'function') invoker.focus(); } catch{} }

    // Open animation
    lockScroll();
    try { root.setAttribute('data-state','open'); } catch{}
    trap();

    function updateTotals(){ if(subEl) subEl.textContent = fmtCurrency(subtotal(), state.currency); }

    // Line actions
    root.addEventListener('click', function(e){
      var line = e.target && e.target.closest('[data-line]');
      if(!line) return;
      var sku = line.getAttribute('data-sku');
      var idx = findIndexBySku(sku);
      if(idx < 0) return;
      if(e.target.closest('[data-remove]')){ e.preventDefault(); removeBySku(sku); line.parentNode.removeChild(line); updateTotals(); if(itemsEl && !itemsEl.querySelector('[data-line]')){ itemsEl.innerHTML = '<div class="empty"><div class="empty__title">Je winkelwagen is leeg</div><div class="empty__text">Voeg producten toe om verder te gaan.</div></div>'; } return; }
      if(e.target.closest('[data-qty-inc]')){ e.preventDefault(); state.items[idx].qty += 1; rerenderLine(line, state.items[idx]); updateTotals(); return; }
      if(e.target.closest('[data-qty-dec]')){ e.preventDefault(); state.items[idx].qty = Math.max(1, state.items[idx].qty - 1); rerenderLine(line, state.items[idx]); updateTotals(); return; }
    });
    root.addEventListener('input', function(e){
      var input = e.target && e.target.matches('[data-qty-input]') ? e.target : null;
      if(!input) return;
      var line = input.closest('[data-line]'); if(!line) return;
      var sku = line.getAttribute('data-sku'); var idx = findIndexBySku(sku); if(idx<0) return;
      var val = Math.max(1, Number(input.value||'1')||1); state.items[idx].qty = val; rerenderLine(line, state.items[idx]); updateTotals();
    });

    function rerenderLine(lineEl, it){
      try {
        var totalEl = lineEl.querySelector('[data-line-total]'); if(totalEl) totalEl.textContent = fmtCurrency(it.unitPrice * it.qty, state.currency);
        var qtyInputs = lineEl.querySelectorAll('[data-qty-input]'); qtyInputs.forEach(function(i){ i.value = it.qty; });
        var meta = lineEl.querySelector('.text-sm.text-dark\/70 span'); if(meta) meta.textContent = String(it.qty)+' × '+fmtCurrency(it.unitPrice, state.currency);
      } catch{}
    }

    // Header close button
    root.addEventListener('click', function(e){ var btn = e.target && e.target.closest('[data-close="drawer"]'); if(!btn) return; e.preventDefault(); close(); });

    // CTA buttons
    root.addEventListener('click', function(e){ var cta = e.target && e.target.closest('[data-cta]'); if(!cta) return; var kind = cta.getAttribute('data-cta'); if(kind==='continue'){ e.preventDefault(); close(); } });

    // Recommendations (lazy)
    (function(){
      var rail = root.querySelector('[data-reco-items]'); if(!rail) return;
      loadProducts().then(function(all){
        var base = (state.items[state.items.length-1] || {});
        var recos = selectRecommendations(base, all);
        if(!recos.length){ var empty=document.createElement('div'); empty.className='text-sm text-dark/70'; empty.textContent='Geen aanbevelingen beschikbaar.'; rail.parentElement.appendChild(empty); return; }
        recos.forEach(function(p){ rail.appendChild(renderRecoItem(p)); });
        try { rail.parentElement.setAttribute('data-loaded','true'); } catch{}
        root.addEventListener('click', function(e){ var add = e.target && e.target.closest('[data-reco-add]'); if(!add) return; e.preventDefault(); var sku = add.getAttribute('data-sku')||''; var found = (Array.isArray(all)? all.find(function(x){return x.sku===sku;}) : null); var p = found ? normalizeProduct(found) : { sku: sku, name: 'Product', price: 0, image: '/assets/images/placeholder-square.svg', url: '/product.html' }; addOrMergeItem({ id: p.id, sku: p.sku, name: p.name, thumbnail: p.image, qty: 1, unitPrice: Number(p.price||0), attributes: null, url: p.url }); // re-render body
          var sc = itemsEl; if(sc){ // append last item line
            sc.insertAdjacentHTML('beforeend', template().match(/<div class=\"flex-1 overflow-auto p-4 space-y-4\" data-items>[\s\S]*?<\/div>/)[0].replace(/^.*data-items>/,'').replace(/<\/div>$/,''));
          }
          // safer: rebuild items and subtotal
          host.innerHTML = template();
          root = host.firstElementChild; panel = root.querySelector('[data-cart-panel]'); itemsEl = root.querySelector('[data-items]'); subEl = root.querySelector('[data-subtotal]'); try { root.setAttribute('data-state','open'); } catch{}
        });
      });
    })();

    return { close: close };
  }

  function deriveFromButton(btn){
    var holder = btn.closest('[data-card]') || document;
    var qtyEl = document.getElementById('qty');
    var qtyAttr = btn.getAttribute('data-qty');
    var qty = Number((qtyEl && qtyEl.value) || qtyAttr || '1') || 1;
    var sku = btn.getAttribute('data-sku') || holder.querySelector('[data-sku]')?.getAttribute('data-sku') || '';
    var name = btn.getAttribute('data-title') || holder.querySelector('[data-title]')?.textContent || document.querySelector('h1')?.textContent || 'Product';
    var priceAttr = btn.getAttribute('data-price') || holder.querySelector('[data-price]')?.getAttribute('data-price') || '0';
    var image = btn.getAttribute('data-image') || holder.querySelector('img')?.getAttribute('src') || '/assets/images/placeholder-square.svg';
    return { sku: sku, name: name, qty: qty, price: Number(priceAttr || 0), image: image };
  }

  function openForButton(btn){
    var p = deriveFromButton(btn);
    openDrawer({ addedItem: { id: p.sku, sku: p.sku, name: p.name, thumbnail: p.image, qty: p.qty, unitPrice: p.price, attributes: null, url: '/product.html' }, invoker: btn });
  }

  // Wire triggers (keep existing data flow)
  document.addEventListener('click', function(e){ var btn = e.target && e.target.closest('[data-add-to-cart]'); if(!btn) return; e.preventDefault(); openForButton(btn); });
  window.addEventListener('cart:addItems', function(e){ try { var items = (e && e.detail) || []; items.forEach(function(it){ addOrMergeItem({ id: it.id||it.sku, sku: it.sku, name: it.name, thumbnail: it.image||'/assets/images/placeholder-square.svg', qty: Number(it.qty||1), unitPrice: Number(it.price||0), attributes: it.attributes||null, url: '/product.html' }); }); openDrawer({ invoker: document.activeElement }); } catch(_) {} });

  // Public API
  window.CartDrawer = { open: openDrawer, addItem: function(it){ addOrMergeItem(it); openDrawer({}); } };
})();


