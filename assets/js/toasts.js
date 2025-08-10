// Lightweight toast utility (no framework, Hyvä-friendly)
(function(){
  function ensureHost(){
    var host = document.getElementById('toasts');
    if(!host){ host = document.createElement('div'); host.id = 'toasts'; host.className = 'toasts'; document.body.appendChild(host); }
    return host;
  }
  function iconSvg(){ return '<svg class="toast__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z"/></svg>'; }
  function closeButton(){ return '<button class="toast__close" type="button" aria-label="Sluiten">✕</button>'; }
  function showToast(title, text, opts){
    var host = ensureHost();
    var div = document.createElement('div');
    div.className = 'toast';
    div.innerHTML = iconSvg() + '<div><div class="toast__title">'+(title||'Melding')+'</div>' + (text?'<div class="toast__text">'+text+'</div>':'') + '</div>' + closeButton();
    host.appendChild(div);
    var close = function(){ if(div && div.parentNode){ div.parentNode.removeChild(div); } };
    var btn = div.querySelector('.toast__close'); if(btn) btn.addEventListener('click', close);
    var ms = (opts && opts.timeout) || 2400; if(ms>0) setTimeout(close, ms);
  }
  window.RemkaToasts = { show: showToast };
  // Hook add-to-cart demo buttons for feedback
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
    if(!btn) return;
    var title = 'Toegevoegd aan winkelmand';
    var name = btn.getAttribute('data-title') || 'Product';
    showToast(title, name, { timeout: 2600 });
  });
})();


