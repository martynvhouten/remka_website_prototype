// Unified Toast system (vanilla JS, Hyvä-friendly)
(function(){
  var VISIBLE_MAX = 3;
  var DEFAULT_TIMEOUT = 3500;
  var queue = [];
  var active = [];

  function ensureHost(){
    var host = document.getElementById('toasts');
    if(!host){
      host = document.createElement('div');
      host.id = 'toasts';
      host.className = 'toasts';
      host.setAttribute('aria-live','polite');
      host.setAttribute('aria-atomic','true');
      document.body.appendChild(host);
    }
    return host;
  }

  function iconSvg(kind){
    var map = {
      success: '<path d="M9.707 13.293 8.293 14.707 11 17.414l7-7-1.414-1.414L11 14.586z"/>',
      error: '<path d="M13.414 12l4.95-4.95-1.414-1.414L12 10.586 7.05 5.636 5.636 7.05 10.586 12l-4.95 4.95 1.414 1.414L12 13.414l4.95 4.95 1.414-1.414z"/>',
      warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
      info: '<path d="M11 17h2v-6h-2v6zm0-8h2V7h-2v2z"/>',
      cart: '<path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 .001 3.999A2 2 0 0 0 17 18zM6.2 6l.31 2h11.11a1 1 0 0 1 .98 1.2l-1 5a1 1 0 0 1-.98.8H8.09a1 1 0 0 1-.98-.8L6.03 7H4V5h2.2z"/>'
    };
    var path = map[kind] || map.info;
    return '<svg class="toast__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+path+'</svg>';
  }

  function closeButton(){ return '<button class="toast__close" type="button" aria-label="Sluiten">✕</button>'; }

  function render(kind, content){
    var host = ensureHost();
    var div = document.createElement('div');
    div.className = 'toast toast--'+kind;
    div.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    div.setAttribute('tabindex','-1');
    div.innerHTML = content;
    host.appendChild(div);
    // animate
    requestAnimationFrame(function(){ div.setAttribute('data-state','open'); });
    return div;
  }

  function mount(toast){
    active.push(toast);
    updateStacking();
    if(typeof toast.onMount === 'function') toast.onMount();
  }

  function unmount(toast){
    var idx = active.indexOf(toast);
    if(idx !== -1) active.splice(idx,1);
    if(toast.el && toast.el.parentNode){ toast.el.parentNode.removeChild(toast.el); }
    flushQueue();
  }

  function updateStacking(){
    // keep at most VISIBLE_MAX in DOM; others in queue
    while(active.length > VISIBLE_MAX){
      var t = active.shift();
      if(t && t.el && t.el.parentNode){ t.el.parentNode.removeChild(t.el); }
    }
  }

  function flushQueue(){
    while(active.length < VISIBLE_MAX && queue.length){
      var next = queue.shift();
      if(next && typeof next.show === 'function') next.show();
    }
  }

  function schedule(toast, ms){
    if(ms <= 0){ return; }
    toast.remaining = ms;
    toast.startTime = Date.now();
    toast.timer = setTimeout(function(){ toast.close(); }, ms);
  }

  function pause(toast){
    if(!toast.timer) return;
    clearTimeout(toast.timer);
    toast.timer = null;
    var elapsed = Date.now() - (toast.startTime || 0);
    toast.remaining = Math.max(0, (toast.remaining || 0) - elapsed);
  }

  function resume(toast){
    if(toast.timer || (toast.remaining||0) <= 0) return;
    schedule(toast, toast.remaining);
  }

  function makeBase(kind, title, text, opts){
    opts = opts || {};
    var timeout = 'timeout' in opts ? opts.timeout : DEFAULT_TIMEOUT;
    var actionHtml = '';
    if(opts.actionLabel){
      actionHtml = '<div class="toast__actions"><button class="btn btn-outline btn-sm" data-toast-action="primary">'+opts.actionLabel+'</button></div>';
    }
    var body = iconSvg(kind)
      + '<div class="toast__body">'
      +   '<div class="toast__title">'+(title||'Melding')+'</div>'
      +   (text?'<div class="toast__text">'+text+'</div>':'')
      + '</div>'
      + actionHtml
      + closeButton();
    var el = null;
    var api = {
      el: null,
      timer: null,
      remaining: timeout,
      startTime: 0,
      close: function(){ if(!api.el) return; api.el.removeAttribute('data-state'); setTimeout(function(){ unmount(api); }, 200); },
      show: function(){
        el = render(kind, body); api.el = el;
        var closeBtn = el.querySelector('.toast__close'); if(closeBtn){ closeBtn.addEventListener('click', function(){ api.close(); }); closeBtn.setAttribute('tabindex','0'); }
        var act = el.querySelector('[data-toast-action="primary"]'); if(act && typeof opts.onAction === 'function'){ act.addEventListener('click', function(){ try { opts.onAction(); } catch {} api.close(); }); }
        el.addEventListener('mouseenter', function(){ pause(api); });
        el.addEventListener('mouseleave', function(){ resume(api); });
        schedule(api, timeout);
        mount(api);
      },
      onMount: function(){ /* noop */ }
    };
    return api;
  }

  function makeCart(payload, opts){
    opts = opts || {};
    var p = payload || {};
    var title = p.title || 'Toegevoegd aan winkelmand';
    var details = [];
    if(p.qty) details.push('Aantal: '+p.qty);
    if(p.sku) details.push('SKU: '+p.sku);
    var text = details.length ? details.join(' • ') : '';
    var thumb = p.thumbnail ? '<img class="toast__thumb" src="'+p.thumbnail+'" alt="" aria-hidden="true" />' : '';
    var viewLabel = (opts.actionText || 'Bekijk winkelwagen');
    var body = iconSvg('cart')
      + thumb
      + '<div class="toast__body">'
      +   '<div class="toast__title">'+title+'</div>'
      +   (text?'<div class="toast__text">'+text+'</div>':'')
      + '</div>'
      + '<div class="toast__actions">'
      +   '<button class="btn btn-outline btn-sm" data-toast-action="view-cart">'+viewLabel+'</button>'
      +   '<button class="btn btn-brand btn-sm" data-toast-action="continue">Verder winkelen</button>'
      + '</div>'
      + closeButton();
    var timeout = 'timeout' in opts ? opts.timeout : DEFAULT_TIMEOUT;
    var api = {
      el: null,
      timer: null,
      remaining: timeout,
      startTime: 0,
      close: function(){ if(!api.el) return; api.el.removeAttribute('data-state'); setTimeout(function(){ unmount(api); }, 200); },
      show: function(){
        api.el = render('cart', body);
        var closeBtn = api.el.querySelector('.toast__close'); if(closeBtn){ closeBtn.addEventListener('click', function(){ api.close(); }); closeBtn.setAttribute('tabindex','0'); }
        var btnView = api.el.querySelector('[data-toast-action="view-cart"]');
        var btnCont = api.el.querySelector('[data-toast-action="continue"]');
        if(btnView){ btnView.addEventListener('click', function(){ try { if (window.openMinicart) window.openMinicart(); else location.assign('/cart.html'); } catch(_) { try { location.assign('/cart'); } catch{} } api.close(); }); }
        if(btnCont){ btnCont.addEventListener('click', function(){ api.close(); }); }
        api.el.addEventListener('mouseenter', function(){ pause(api); });
        api.el.addEventListener('mouseleave', function(){ resume(api); });
        schedule(api, timeout);
        mount(api);
      },
      onMount: function(){ /* noop */ }
    };
    return api;
  }

  function enqueue(toast){
    if(active.length < VISIBLE_MAX){ toast.show(); }
    else { queue.push(toast); }
  }

  // Public API
  var api = {
    success: function(message, opts){ enqueue(makeBase('success', message || 'Gelukt', '', opts)); },
    error: function(message, opts){ enqueue(makeBase('error', message || 'Mislukt', '', opts)); },
    warning: function(message, opts){ enqueue(makeBase('warning', message || 'Let op', '', opts)); },
    info: function(message, opts){ enqueue(makeBase('info', message || 'Info', '', opts)); },
    cart: function(payload, opts){ enqueue(makeCart(payload, opts)); }
  };

  // ESC closes latest toast
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && active.length){ var top = active[active.length - 1]; if(top && typeof top.close === 'function') top.close(); }
  });

  // Expose
  window.toast = api;

  // Replace legacy demo hook for add-to-cart
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
    if(!btn) return;
    var title = btn.getAttribute('data-title') || 'Product';
    var qty = parseInt(btn.getAttribute('data-qty') || '1', 10) || 1;
    var thumb = btn.getAttribute('data-image') || '';
    toast.cart({ title: title, qty: qty, thumbnail: thumb }, { actionText: 'Bekijk winkelwagen' });
  });
})();


