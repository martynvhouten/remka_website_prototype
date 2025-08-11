(function(){
  function formatPrice(value){
    var n = Number(value || 0);
    return '€ ' + n.toFixed(2).replace('.', ',');
  }

  function stockBadge(state){
    var dot = '<span class="dot"></span>';
    if(state === 'inStock') return '<span class="stock-ok">'+dot+' Op voorraad</span>';
    if(state === 'backorder') return '<span class="stock-backorder">'+dot+' Speciaal voor je besteld</span>';
    if(state === 'outOfStock') return '<span class="stock-out">'+dot+' Niet op voorraad</span>';
    return '';
  }

  function ratingMarkup(value, count){
    if(!value) return '';
    var full = Math.round(Math.max(0, Math.min(5, Number(value))));
    var stars = '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5-full);
    var cnt = count ? ' ('+count+')' : '';
    return '<span aria-label="Beoordeling: '+value+' van 5">'+stars+' <span class="badge--soft">'+(Number(value).toFixed(1))+'</span>'+cnt+'</span>';
  }

  function discountBadge(price, compareAt){
    var p = Number(price), c = Number(compareAt);
    if(!c || !(c>p)) return '';
    var off = Math.round(100 - (p/c)*100);
    return '<span class="badge--soft">-'+off+'%</span>';
  }

  function createCard(data){
    var tpl = document.getElementById('ProductCardTemplate');
    if(!tpl) return null;
    var node = tpl.content.firstElementChild.cloneNode(true);

    var link = node.querySelector('[data-card-link]');
    var img = node.querySelector('[data-image]');
    var ttl = node.querySelector('[data-title]');
    var brandEl = node.querySelector('[data-brand]');
    var priceEl = node.querySelector('[data-price]');
    var stockEl = node.querySelector('[data-stock]');
    var ratingEl = node.querySelector('[data-rating]');
    var view = node.querySelector('[data-view]');
    var add = node.querySelector('[data-add]');
    var badgesHost = node.querySelector('[data-badges]');
    var discountHost = node.querySelector('[data-discount]');

    var url = data.url || '/product.html';
    if(link) { link.href = url; link.setAttribute('aria-label', data.title || 'Product'); }
    if(view) { view.href = url; view.setAttribute('aria-label', 'Bekijk '+(data.title || 'product')); }

    var src = data.imageSrc || '/assets/images/placeholder-square.svg';
    if(img){
      img.src = src;
      img.alt = data.imageAlt || data.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.sizes = '(min-width: 768px) 25vw, 50vw';
      if(data.width) img.setAttribute('width', String(data.width)); else img.setAttribute('width', '400');
      if(data.height) img.setAttribute('height', String(data.height)); else img.setAttribute('height', '400');
    }

    if(ttl) ttl.textContent = data.title || '';
    if(brandEl){
      var brand = data.brand || '';
      if(brand){ brandEl.textContent = brand; brandEl.hidden = false; }
    }

    var hasCompare = (data.compareAtPrice && Number(data.compareAtPrice) > Number(data.price));
    if(priceEl){
      var main = hasCompare
        ? '<div class="flex items-center gap-2"><span>'+formatPrice(data.price)+'</span><s class="text-dark/60">'+formatPrice(data.compareAtPrice)+'</s></div>'
        : '<span>'+formatPrice(data.price)+'</span>';
      var vat = '<div class="text-xs text-dark/70">excl. btw</div>';
      priceEl.innerHTML = main + vat;
    }

    if(stockEl) stockEl.innerHTML = stockBadge(data.availability);

    if(ratingEl){
      var rhtml = ratingMarkup(data.ratingValue, data.ratingCount);
      if(rhtml){ ratingEl.innerHTML = rhtml; ratingEl.classList.remove('hidden'); ratingEl.removeAttribute('aria-hidden'); }
    }

    if(discountHost){ discountHost.innerHTML = discountBadge(data.price, data.compareAtPrice); }

    if(add){
      if(data.availability === 'outOfStock'){
        add.disabled = true;
        add.setAttribute('aria-disabled', 'true');
      }
      add.setAttribute('data-add-to-cart', '');
      if(data.sku) add.setAttribute('data-sku', String(data.sku));
      if(data.title) add.setAttribute('data-title', String(data.title));
      if(data.price) add.setAttribute('data-price', String(data.price));
      if(src) add.setAttribute('data-image', String(src));
    }

    if(data.badges && Array.isArray(data.badges) && badgesHost){
      badgesHost.innerHTML = data.badges.map(function(b){ return '<span class="badge">'+String(b)+'</span>'; }).join('');
    }

    return node;
  }

  function renderCards(parent, items){
    if(!parent) return;
    var frag = document.createDocumentFragment();
    items.forEach(function(it){ var card = createCard(it); if(card) frag.appendChild(card); });
    parent.innerHTML = '';
    parent.appendChild(frag);
  }

  window.ProductCard = { create: createCard, render: renderCards };

  function bootSections(){
    try {
      var homeGrid = document.getElementById('homePopularGrid');
      if(homeGrid && homeGrid.children.length === 0){
        var list = [
          { sku: 'KAI-PO-4', title: 'KAI Biopsy Punch 4 mm', price: 12.95, url: '/product.html', imageSrc: '/assets/images/kai_biopsy_punch_4.jpg', imageAlt: 'KAI Biopsy Punch 4 mm', availability: 'inStock' },
          { sku: 'HART-42080', title: 'Hartmann 42080', price: 8.75, url: '/product.html', imageSrc: '/assets/images/Products/Hartmann/42080_43.jpg', imageAlt: 'Hartmann 42080', availability: 'inStock' },
          { sku: 'HART-38150', title: 'Hartmann 38150', price: 5.40, url: '/product.html', imageSrc: '/assets/images/Products/Hartmann/38150_43.jpg', imageAlt: 'Hartmann 38150', availability: 'inStock' },
          { sku: 'HEINE-BETA200', title: 'HEINE BETA200 Otoscope/Ophthalmoscope Set USB', price: 14.50, url: '/product.html', imageSrc: '/assets/images/Products/HEINE/A-132.27.388-HEINE-BETA200-otoscope-ophtalmoscope-set-usb.jpg', imageAlt: 'HEINE BETA200 Otoscope/Ophthalmoscope Set USB', availability: 'inStock' }
        ];
        renderCards(homeGrid, list);
      }
    } catch {}
    try {
      var relatedGrid = document.getElementById('relatedGrid');
      if(relatedGrid && relatedGrid.children.length === 0){
        var items = [
          { url: '/product.html', title: 'Handschoenen zwart – L', price: 13.95, imageSrc: '/assets/images/Products/Hartmann/37958_43.jpg', imageAlt: 'Handschoenen zwart – L', availability: 'inStock' },
          { url: '/product.html', title: 'Alcohol 70% 5L', price: 32.00, imageSrc: '/assets/images/Products/HEINE/A-095.12.220-HEINE-PowerSource-EN200-main.jpg', imageAlt: 'Alcohol 70% 5L', availability: 'backorder' },
          { url: '/product.html', title: 'Steriele kompressen 5x5', price: 3.10, imageSrc: '/assets/images/Products/Hartmann/42092_43.jpg', imageAlt: 'Steriele kompressen 5x5', availability: 'inStock' },
          { url: '/product.html', title: 'Infrarood thermometer', price: 39.95, imageSrc: '/assets/images/Products/HEINE/A-180.01.000-HEINE-Soft-Pouch-Otoscopes-Ophthalmoscopes-main.jpg', imageAlt: 'Infrarood thermometer', availability: 'outOfStock' }
        ];
        renderCards(relatedGrid, items);
      }
    } catch {}
  }

  var init = function(){ bootSections(); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('partials:loaded', init);
})();


