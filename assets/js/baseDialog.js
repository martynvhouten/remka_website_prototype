(function(){
  // BaseDialog: reusable centered modal with glass panel and focus trap
  var OPEN_CLASS = 'dialog-open';

  function uid(){ return 'bdlg-' + Math.random().toString(36).slice(2, 8); }

  function lockScroll(){ try { document.documentElement.classList.add(OPEN_CLASS); } catch(_) {} }
  function unlockScroll(){ try { document.documentElement.classList.remove(OPEN_CLASS); } catch(_) {} }

  function getFocusables(container){
    var f = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    return Array.prototype.filter.call(f, function(el){ return !el.hasAttribute('disabled') && el.offsetParent !== null; });
  }

  function ensureContainer(opts){
    var id = uid();
    var titleId = opts && opts.ariaLabelledby ? String(opts.ariaLabelledby) : ('bdlg-title-' + id);
    var labelledbyAttr = opts && opts.ariaLabelledby ? ' aria-labelledby="'+titleId+'"' : '';
    var describedbyAttr = opts && opts.ariaDescribedby ? ' aria-describedby="'+String(opts.ariaDescribedby)+'"' : '';
    var ariaLabelAttr = (!labelledbyAttr && opts && opts.ariaLabel) ? ' aria-label="'+String(opts.ariaLabel)+'"' : '';
    var sizeClass = 'dialog--' + (opts && opts.size ? String(opts.size) : 'md');
    var offset = typeof opts.offsetTop === 'number' ? opts.offsetTop : 24;

    var root = document.createElement('div');
    root.className = 'fixed inset-0 z-50 dialog-root';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    if(labelledbyAttr){ root.setAttribute('aria-labelledby', titleId); }
    if(describedbyAttr){ root.setAttribute('aria-describedby', String(opts.ariaDescribedby)); }
    if(ariaLabelAttr && !labelledbyAttr){ root.setAttribute('aria-label', String(opts.ariaLabel || 'Dialoog')); }
    root.innerHTML = ''
      + '<button class="dialog-overlay" data-close="basedialog" aria-label="Sluiten"></button>'
      + '<div class="dialog-viewport" style="--dialog-offset-top:'+String(offset)+'px">'
      +   '<div class="dialog-panel '+sizeClass+'" data-panel tabindex="-1">'
      +     '<div data-slot="header"></div>'
      +     '<div data-slot="body" class="p-4"></div>'
      +     '<div data-slot="footer" class="p-4 border-t border-light"></div>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(root);

    // Slots
    var panel = root.querySelector('[data-panel]');
    var headerEl = root.querySelector('[data-slot="header"]');
    var bodyEl = root.querySelector('[data-slot="body"]');
    var footerEl = root.querySelector('[data-slot="footer"]');

    // Default header with title + close
    var headerHtml = '';
    if (opts && opts.header != null) {
      headerHtml = typeof opts.header === 'string' ? opts.header : '';
    } else {
      var title = (opts && (opts.title != null)) ? String(opts.title) : '';
      headerHtml = ''
        + '<div class="flex items-center justify-between px-4 py-3 border-b border-light">'
        +   (title ? ('<h2 id="'+titleId+'" class="text-lg font-extrabold">'+title+'</h2>') : '<span class="sr-only" id="'+titleId+'">Dialoog</span>')
        +   '<button class="p-2 rounded-md border border-light" data-close="basedialog" aria-label="Sluiten">✕</button>'
        + '</div>';
    }
    if(headerHtml){ headerEl.innerHTML = headerHtml; } else { headerEl.parentNode.removeChild(headerEl); }

    if(opts && opts.body != null){ if(typeof opts.body === 'string') bodyEl.innerHTML = opts.body; else if(opts.body instanceof Node) bodyEl.appendChild(opts.body); }
    if(opts && opts.footer != null){ if(typeof opts.footer === 'string') footerEl.innerHTML = opts.footer; else if(opts.footer instanceof Node) footerEl.appendChild(opts.footer); }
    else { footerEl.parentNode.removeChild(footerEl); }

    return { root: root, panel: panel };
  }

  function open(options){
    var invoker = (options && options.invoker) || document.activeElement;
    var onClose = (options && options.onClose) || null;
    var parts = ensureContainer(options || {});
    var root = parts.root;
    var panel = parts.panel;
    var overlay = root.querySelector('.dialog-overlay');

    function close(){
      try { root.setAttribute('data-state','closing'); } catch{}
      try { overlay && overlay.setAttribute('data-state','closed'); } catch{}
      try { panel && panel.setAttribute('data-state','closed'); } catch{}
      try { unlockScroll(); } catch{}
      setTimeout(function(){ if(root && root.parentNode){ root.parentNode.removeChild(root); if(typeof onClose === 'function'){ try { onClose(); } catch(_) {} } try { if(invoker && invoker.focus) invoker.focus(); } catch{} } }, 180);
    }

    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    root.addEventListener('click', function(e){ var btn = e.target && e.target.closest('[data-close="basedialog"]'); if(btn){ e.preventDefault(); close(); } });
    document.addEventListener('keydown', onKey);

    // Focus trap
    var untrap = null;
    function trap(){
      var focusables = getFocusables(panel || root);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      function onTrap(e){
        if(e.key !== 'Tab') return;
        if(focusables.length === 0) return;
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last && last.focus && last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first && first.focus && first.focus(); }
      }
      document.addEventListener('keydown', onTrap);
      setTimeout(function(){ (first || panel || root).focus(); }, 0);
      untrap = function(){ document.removeEventListener('keydown', onTrap); document.removeEventListener('keydown', onKey); };
    }

    // Animate open
    lockScroll();
    try { overlay && overlay.setAttribute('data-state','open'); panel && panel.setAttribute('data-state','open'); } catch{}
    trap();

    return { el: root, panel: panel, close: close };
  }

  function create(opts){
    // alias for open with isOpen
    return open(opts);
  }

  // Public API
  window.BaseDialog = { open: open, create: create };
})();


