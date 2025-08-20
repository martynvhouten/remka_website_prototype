(function(){
  // Add-to-Cart Dialog (vanilla JS, Hyvä-friendly)
  // Replaces cart toast UX with an accessible dialog and recommendations

  var HOST_ID = 'atc-dialog-host';
  var OPEN_CLASS = 'dialog-open';

  function ensureHost(){
    var host = document.getElementById(HOST_ID);
    if(host) return host;
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
    return host;
  }

  function fmtCurrency(amount, currency){
    try {
      return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 2 }).format(Number(amount||0));
    } catch(_) {
      var n = (Number(amount||0)).toFixed(2).replace('.', ',');
      return '€ ' + n;
    }
  }

  function sanitizeUrl(url){ try { return String(url||''); } catch(_) { return ''; } }

  function pushAnalytics(eventName, payload){
    try {
      if(!window.dataLayer || !Array.isArray(window.dataLayer)) return;
      window.dataLayer.push({ event: eventName, ...payload });
    } catch(_) {}
  }

  function lockScroll(){ try { document.documentElement.classList.add(OPEN_CLASS); } catch(_) {} }
  function unlockScroll(){ try { document.documentElement.classList.remove(OPEN_CLASS); } catch(_) {} }

  function getFocusables(container){
    var f = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(f, function(el){ return !el.hasAttribute('disabled') && el.offsetParent !== null; });
  }

  function formatAttributes(attrs){
    if(!attrs) return '';
    try {
      var parts = [];
      Object.keys(attrs).forEach(function(k){
        var v = attrs[k];
        if(v == null || v === '') return;
        parts.push('<span class="pill pill--sm pill--neutral">' + String(k) + ': ' + String(v) + '</span>');
      });
      return parts.join(' ');
    } catch(_) { return ''; }
  }

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
      badges: p && p.badges || [],
      availability: p && p.stock || 'in_stock',
      url: '/product.html'
    };
  }

  function selectRecommendations(addedItem, allProducts){
    var items = Array.isArray(allProducts) ? allProducts : [];
    var cats = new Set(Array.isArray(addedItem && addedItem.category) ? addedItem.category : []);
    var filtered = items.filter(function(p){ return p.sku !== (addedItem && addedItem.sku); });
    if(cats.size){
      filtered = filtered.filter(function(p){ return Array.isArray(p.categories) && p.categories.some(function(c){ return cats.has(c); }); });
    }
    filtered.sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||''), 'nl'); });
    return filtered.slice(0, 8).map(normalizeProduct);
  }

  function template(opts){
    var title = 'Toegevoegd aan je winkelwagen';
    var added = opts.addedItem || {};
    var summary = opts.cartSummary || { itemsCount: added.qty || 1, subtotal: (added.qty||1) * (added.unitPrice||0), currency: 'EUR' };
    var linePrice = (added.qty||1) * (added.unitPrice||0);
    var attrsHtml = formatAttributes(added.attributes);
    var thumb = sanitizeUrl(added.thumbnail || '/assets/images/placeholder-square.svg');
    var itemName = String(added.name || 'Product');
    var itemUrl = sanitizeUrl(added.url || '/product.html');

    return ''
      + '<div class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="atcTitle">'
      +   '<div class="absolute inset-0 atc-overlay" data-close="atc" aria-label="Sluiten"></div>'
      +   '<div class="absolute inset-0 grid place-items-center p-4">'
      +     '<div class="card w-full max-w-xl atc-container" data-atc-container>'
      +       '<div class="flex items-center justify-between p-4 border-b border-light">'
      +         '<h4 id="atcTitle" class="font-extrabold">'+title+'</h4>'
      +         '<button class="p-2" data-close="atc" aria-label="Sluiten">✕</button>'
      +       '</div>'
      +       '<div class="p-4 space-y-4">'
      +         '<div class="flex items-start gap-3 atc-item">'
      +           '<img src="'+thumb+'" alt="'+itemName+'" loading="lazy" decoding="async" width="64" height="64" class="w-16 h-16 object-contain border border-light rounded"/>'
      +           '<div class="min-w-0 flex-1">'
      +             '<a href="'+itemUrl+'" class="font-semibold link-cta">'+itemName+'</a>'
      +             (attrsHtml ? ('<div class="mt-1 space-x-1">'+attrsHtml+'</div>') : '')
      +             '<div class="mt-1 text-sm text-dark/70">'
      +               '<span>'+String(added.qty||1)+' × '+fmtCurrency(added.unitPrice||0, summary.currency||'EUR')+'</span>'
      +               '<span class="ml-2 font-semibold">= '+fmtCurrency(linePrice, summary.currency||'EUR')+'</span>'
      +             '</div>'
      +           '</div>'
      +         '</div>'
      +         '<div class="p-3 rounded-md border border-light flex items-center justify-between">'
      +           '<div class="text-sm text-dark/80">Totaal artikelen: <span class="font-semibold">'+String(summary.itemsCount||1)+'</span></div>'
      +           '<div class="text-sm">Subtotaal: <span class="font-semibold">'+fmtCurrency(summary.subtotal||linePrice, summary.currency||'EUR')+'</span></div>'
      +         '</div>'
      +         '<div class="flex flex-col sm:flex-row sm:justify-end gap-2">'
      +           '<a href="/checkout-shipping.html" class="btn btn-brand sm:w-auto w-full" data-cta="checkout">Ga naar afrekenen</a>'
      +           '<a href="/cart.html" class="btn btn-glass sm:w-auto w-full" data-cta="view-cart">Bekijk winkelwagen</a>'
      +           '<button type="button" class="btn btn-glass sm:w-auto w-full" data-cta="continue">Verder winkelen</button>'
      +         '</div>'
      +         '<div class="divider"></div>'
      +         '<div>'
      +           '<div class="font-extrabold">Aanbevolen voor jou</div>'
      +           '<div class="mt-3 h-scroll -mx-1 px-1 atc-reco" data-reco-rail>'
      +             '<div class="grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-3" data-reco-items></div>'
      +           '</div>'
      +         '</div>'
      +       '</div>'
      +     '</div>'
      +     '<div class="sr-only" aria-live="polite" id="atcLive"></div>'
      +   '</div>'
      + '</div>';
  }

  function renderRecoItem(p){
    var html = ''
      + '<div class="card p-3 flex flex-col" data-reco-item>'
      +   '<a href="'+sanitizeUrl(p.url)+'" class="block">'
      +     '<img src="'+sanitizeUrl(p.image)+'" alt="'+String(p.name||'')+'" loading="lazy" decoding="async" width="160" height="160" class="w-full h-32 object-contain border border-light rounded" />'
      +     '<div class="mt-2 text-sm font-semibold line-clamp-2">'+String(p.name||'')+'</div>'
      +   '</a>'
      +   '<div class="mt-1 text-sm font-semibold">'+fmtCurrency(p.price, 'EUR')+'</div>'
      +   '<button class="btn btn-card mt-2" data-reco-add data-sku="'+String(p.sku||'')+'">Toevoegen</button>'
      + '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }

  function openDialog(opts){
    var t0 = performance.now ? performance.now() : Date.now();
    var host = ensureHost();
    host.innerHTML = template(opts);
    var overlay = host.firstElementChild;
    var container = overlay && overlay.querySelector('[data-atc-container]');
    var live = overlay && overlay.querySelector('#atcLive');
    if(live){ live.textContent = 'Toegevoegd '+(opts && opts.addedItem && opts.addedItem.name ? opts.addedItem.name : 'product')+' aan je winkelwagen.'; }

    function close(){
      try { overlay.classList.add('hidden'); } catch {}
      try { unlockScroll(); } catch {}
      setTimeout(function(){ if(host) host.innerHTML=''; returnFocus(); }, 180);
    }

    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    overlay.addEventListener('click', function(e){ if(e.target && e.target.getAttribute('data-close') === 'atc'){ close(); } });
    overlay.addEventListener('click', function(e){ var c = e.target && e.target.closest('[data-close="atc"]'); if(c){ e.preventDefault(); close(); } });
    document.addEventListener('keydown', onKey);

    var untrap = null;
    function trap(){
      var focusables = getFocusables(container || overlay);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      function onTrap(e){
        if(e.key !== 'Tab') return;
        if(focusables.length === 0) return;
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
      document.addEventListener('keydown', onTrap);
      setTimeout(function(){ (first || container || overlay).focus(); }, 0);
      untrap = function(){ document.removeEventListener('keydown', onTrap); document.removeEventListener('keydown', onKey); };
    }

    var invoker = (opts && opts.invoker) || document.activeElement;
    function returnFocus(){ try { if(invoker && typeof invoker.focus === 'function') invoker.focus(); } catch{} }

    lockScroll();
    // Mark open state for CSS-driven animations
    try {
      var overlayEl = overlay && overlay.querySelector('.atc-overlay');
      if(overlayEl) overlayEl.setAttribute('data-state','open');
      if(container) container.setAttribute('data-state','open');
    } catch{}
    trap();

    // CTA handlers
    overlay.addEventListener('click', function(e){
      var ctaEl = e.target && e.target.closest('[data-cta]');
      if(!ctaEl) return;
      var cta = ctaEl.getAttribute('data-cta');
      pushAnalytics('add_to_cart_dialog_cta_click', { cta: cta });
      if(cta === 'continue'){ e.preventDefault(); close(); }
      // view-cart/checkout use anchors
    });

    // Recommendations (lazy)
    (function(){
      var rail = overlay.querySelector('[data-reco-items]');
      if(!rail) return;
      loadProducts().then(function(all){
        var recos = selectRecommendations(opts.addedItem || {}, all);
        if(!Array.isArray(recos) || recos.length === 0){
          var empty = document.createElement('div');
          empty.className = 'text-sm text-dark/70';
          empty.textContent = 'Geen aanbevelingen beschikbaar.';
          rail.parentElement.appendChild(empty);
          return;
        }
        recos.forEach(function(p){ rail.appendChild(renderRecoItem(p)); });
        try { rail.parentElement.setAttribute('data-loaded','true'); } catch{}
        overlay.addEventListener('click', function(e){
          var add = e.target && e.target.closest('[data-reco-add]');
          if(!add) return;
          e.preventDefault();
          var sku = add.getAttribute('data-sku') || '';
          pushAnalytics('add_to_cart_dialog_reco_add', { sku: sku });
          // Optimistic: show the dialog again for the reco item with qty 1
          var found = (Array.isArray(all) ? all.find(function(p){ return p.sku === sku; }) : null);
          var p = found ? normalizeProduct(found) : { sku: sku, name: 'Product', price: 0, image: '/assets/images/placeholder-square.svg', url: '/product.html' };
          close();
          setTimeout(function(){
            openDialog({
              addedItem: { id: p.id, sku: p.sku, name: p.name, thumbnail: p.image, qty: 1, unitPrice: Number(p.price||0), linePrice: Number(p.price||0), attributes: null, url: p.url },
              cartSummary: { itemsCount: (opts.cartSummary && (Number(opts.cartSummary.itemsCount||0)+1)) || 2, subtotal: (opts.cartSummary && Number(opts.cartSummary.subtotal||0) + Number(p.price||0)) || Number(p.price||0), currency: 'EUR' },
              invoker: add
            });
          }, 50);
        });
      });
    })();

    var t1 = performance.now ? performance.now() : Date.now();
    pushAnalytics('add_to_cart_dialog_open', { sku: (opts && opts.addedItem && opts.addedItem.sku) || '', timeToOpenMs: Math.max(0, Math.round((t1 - t0))) });

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
    openDialog({
      addedItem: { id: p.sku, sku: p.sku, name: p.name, thumbnail: p.image, qty: p.qty, unitPrice: p.price, linePrice: p.qty * p.price, attributes: null, url: '/product.html' },
      cartSummary: { itemsCount: p.qty, subtotal: p.qty * p.price, currency: 'EUR' },
      invoker: btn
    });
  }

  // Wire global triggers
  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest('[data-add-to-cart]');
    if(!btn) return;
    e.preventDefault();
    openForButton(btn);
  });

  // Bulk add fallback from Bestellijsten
  window.addEventListener('cart:addItems', function(e){
    try {
      var items = (e && e.detail) || [];
      var totalQty = items.reduce(function(sum, it){ return sum + (Number(it && it.qty || 0)); }, 0);
      if(totalQty <= 0) return;
      openDialog({
        addedItem: { id: 'bulk', sku: 'bulk', name: 'Meerdere artikelen', thumbnail: '/assets/images/placeholder-square.svg', qty: totalQty, unitPrice: 0, linePrice: 0, attributes: null, url: '/cart.html' },
        cartSummary: { itemsCount: totalQty, subtotal: 0, currency: 'EUR' },
        invoker: document.activeElement
      });
    } catch(_) {}
  });

  // Public API
  window.AddToCartDialog = { open: openDialog, openForButton: openForButton };
})();


