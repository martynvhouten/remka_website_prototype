(function(){
  // RFQ DEMO FLAGS (default off). Read from window.__ENV or localStorage. No Vite at runtime in this prototype.
  function readFlag(key, def){
    try {
      var fromWindow = (window.__ENV && typeof window.__ENV[key] !== 'undefined') ? String(window.__ENV[key]) : null;
      var fromStorage = localStorage.getItem(key);
      var raw = fromWindow != null ? fromWindow : (fromStorage != null ? fromStorage : String(def));
      return String(raw).toLowerCase() === 'true';
    } catch(_) { return !!def; }
  }
  function readValue(key, def){
    try {
      var fromWindow = (window.__ENV && typeof window.__ENV[key] !== 'undefined') ? String(window.__ENV[key]) : null;
      var fromStorage = localStorage.getItem(key);
      if(fromWindow != null) return fromWindow;
      if(fromStorage != null) return fromStorage;
      return def;
    } catch(_) { return def; }
  }

  var FEATURE_RFQ = readFlag('VITE_FEATURE_RFQ_DEMO', true);
  var FEATURE_MULTI = readFlag('VITE_RFQ_DEMO_MULTI', false);
  var MAIL_TO = readValue('VITE_RFQ_MAIL_TO', 'info@remka.nl');
  var MAIL_BCC = readValue('VITE_RFQ_MAIL_BCC', '');

  // Escapes for URI components
  function enc(v){ return encodeURIComponent(String(v||'')); }

  function tryGetContact(){
    // Best-effort: read demo user if present (legacy prototype key)
    try {
      var txt = localStorage.getItem('remka_demo_user');
      if(!txt) return null;
      var u = JSON.parse(txt);
      if(!u) return null;
      return {
        name: [u.firstName||'', u.lastName||''].join(' ').trim() || (u.company||''),
        email: u.email || ''
      };
    } catch(_) { return null; }
  }

  function buildMailto(subject, body){
    var parts = [];
    if(MAIL_BCC && MAIL_BCC.trim()){ parts.push('bcc='+enc(MAIL_BCC.trim())); }
    parts.push('subject='+enc(subject||''));
    parts.push('body='+enc(body||''));
    var query = parts.join('&');
    return 'mailto:' + MAIL_TO + (query ? ('?' + query) : '');
  }

  function copyToClipboard(text){
    return new Promise(function(resolve){
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(resolve).catch(function(){
          fallback();
        });
      } else { fallback(); }
      function fallback(){
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        } catch(_) {}
        resolve();
      }
    });
  }

  // Accessible modal primitive (focus trap + ESC)
  function createModal(opts){
    var overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 hidden';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label', opts && opts.ariaLabel ? opts.ariaLabel : 'Dialoog');
    overlay.innerHTML = ''
      + '<div class="absolute inset-0 bg-black/40" data-close="rfq"></div>'
      + '<div class="absolute inset-0 grid place-items-center p-4">'
      +   '<div class="card w-full max-w-md">'
      +     '<div class="flex items-center justify-between p-4 border-b border-light">'
      +       '<h4 class="font-extrabold">'+(opts && opts.title ? opts.title : 'Offerte')+'</h4>'
      +       '<button class="p-2" data-close="rfq" aria-label="Sluiten">✕</button>'
      +     '</div>'
      +     '<div class="p-4">'+(opts && opts.content ? opts.content : '')+'</div>'
      +     '<div class="p-4 border-t border-light flex justify-end gap-2">'
      +       '<button class="btn btn-outline" data-close="rfq">Annuleren</button>'
      +       '<button class="btn btn-brand" data-submit="rfq">Versturen</button>'
      +     '</div>'
      +   '</div>'
      + '</div>';

    document.body.appendChild(overlay);

    function getFocusables(container){
      var f = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      return Array.prototype.filter.call(f, function(el){ return !el.hasAttribute('disabled') && el.offsetParent !== null; });
    }

    var untrap = null;
    function trap(){
      var focusables = getFocusables(overlay);
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      function onKey(e){
        if(e.key === 'Escape'){ close(); }
        if(e.key !== 'Tab') return;
        if(focusables.length === 0) return;
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
      document.addEventListener('keydown', onKey);
      setTimeout(function(){ (first || overlay).focus(); }, 0);
      untrap = function(){ document.removeEventListener('keydown', onKey); };
    }

    function open(){ overlay.classList.remove('hidden'); trap(); }
    function close(){ overlay.classList.add('hidden'); if(untrap) { untrap(); untrap = null; } setTimeout(function(){ if(overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200); }

    overlay.addEventListener('click', function(e){
      if(e.target.closest('[data-close="rfq"]')){ close(); }
      if(e.target.getAttribute && e.target.getAttribute('data-close') === 'rfq'){ close(); }
    });
    return { el: overlay, open: open, close: close };
  }

  function bindOfferte(btn){
    var addBtn = document.querySelector('[data-add-to-cart]');
    if(!addBtn) return;
    btn.addEventListener('click', function(){
      var sku = addBtn.getAttribute('data-sku') || '';
      var title = addBtn.getAttribute('data-title') || (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '');

      var content = ''
        + '<div class="space-y-3">'
        +   '<label class="block text-sm font-semibold" for="rfq-qty">Aantal</label>'
        +   '<input id="rfq-qty" class="input" type="number" min="1" step="1" value="1" />'
        +   '<label class="block text-sm font-semibold" for="rfq-note">Opmerking <span class="text-dark/60">(optioneel)</span></label>'
        +   '<textarea id="rfq-note" class="textarea" rows="4" placeholder="Beschrijf je aanvraag of stel je vraag"></textarea>'
        + '</div>';

      var modal = createModal({ title: 'Offerte aanvragen', ariaLabel: 'Offerteformulier', content: content });
      modal.open();

      var qtyEl = modal.el.querySelector('#rfq-qty');
      var noteEl = modal.el.querySelector('#rfq-note');
      var submitBtn = modal.el.querySelector('[data-submit="rfq"]');

      function submit(){
        var qty = parseInt((qtyEl && qtyEl.value) || '1', 10) || 1;
        var note = (noteEl && noteEl.value || '').trim();
        var contact = tryGetContact();
        var lines = [];
        lines.push('Product: ' + title);
        if(sku) lines.push('SKU: ' + sku);
        lines.push('Aantal: ' + qty);
        if(note) lines.push('Opmerking: ' + note);
        try { lines.push('URL: ' + window.location.href); } catch {}
        if(contact && (contact.name || contact.email)){
          lines.push('');
          lines.push('Contact:');
          if(contact.name) lines.push('Naam: ' + contact.name);
          if(contact.email) lines.push('E-mail: ' + contact.email);
        }
        var body = lines.join('\n');
        var subject = 'Offerte — ' + (sku || '') + (sku && title ? ' — ' : '') + (title || '');
        var mailto = buildMailto(subject, body);

        try { if(window.toast) window.toast.success('Toegevoegd aan je offerte.'); } catch {}

        if(mailto.length > 1800){
          copyToClipboard(body).then(function(){
            modal.close();
            var info = createModal({
              title: 'Offerte is te lang',
              ariaLabel: 'Offerte melding',
              content: '<div class="text-sm text-dark/80">Je offerte is te lang voor een automatische e-mail. De inhoud is gekopieerd—plak in een e-mail aan <a href="mailto:'+MAIL_TO+'" class="link-cta">'+MAIL_TO+'</a>.</div>'
            });
            info.open();
          });
        } else {
          try { if(window.toast) window.toast.info('Je e-mail wordt geopend.'); } catch {}
          modal.close();
          // Open default mail client
          window.location.href = mailto;
        }
      }

      if(submitBtn){ submitBtn.addEventListener('click', function(e){ e.preventDefault(); submit(); }); }
      if(qtyEl){ qtyEl.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); submit(); } }); }
    });
  }

  function mountPdpButton(){
    var addBtn = document.querySelector('[data-add-to-cart]');
    if(!addBtn) return; // not on PDP
    // Prefer existing partial-provided button
    var offerteBtn = document.querySelector('[data-rfq-demo]');
    if(!offerteBtn){
      if(!FEATURE_RFQ) return;
      var btnRow = addBtn.closest('.flex');
      if(!btnRow) return;
      offerteBtn = document.createElement('button');
      offerteBtn.className = 'btn btn-outline inline-flex items-center gap-2';
      offerteBtn.setAttribute('type','button');
      offerteBtn.setAttribute('aria-label','Offerte');
      offerteBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 2H8a2 2 0 0 0-2 2v3H4v2h2v10a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V4a2 2 0 0 0-2-2Zm0 18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7h11ZM10 9h7v2h-7Zm0 4h7v2h-7Zm0 4h5v2h-5Z"/></svg><span>Offerte</span>';
      btnRow.appendChild(offerteBtn);
    }
    if(offerteBtn) bindOfferte(offerteBtn);
  }

  function mountStyleGuideAnchors(){
    if(!FEATURE_RFQ) return;
    var isSg = /\bstyle-guide\.html(\?|$)/.test(location.pathname) || document.title.toLowerCase().indexOf('style guide') !== -1;
    if(!isSg) return;
    var main = document.getElementById('main');
    if(!main) return;
    var target = main.querySelector('.space-y-10');
    if(!target) return;
    var wrap = document.createElement('section');
    wrap.className = 'sg-section';
    wrap.innerHTML = ''
      + '<h2 id="rfq-demo-pdp" class="text-2xl font-black">RFQ demo – PDP</h2>'
      + '<p class="mt-1 text-sm text-dark/70">Wanneer de RFQ demo-flag actief is, verschijnt een tertiaire knop “Offerte” naast “In winkelwagen” op de PDP (focus-trap, ESC, toasts).</p>'
      + (FEATURE_MULTI ? '<h2 id="rfq-demo-page" class="text-2xl font-black mt-8">RFQ demo – Multi</h2><p class="mt-1 text-sm text-dark/70">Multi-product demo pagina beschikbaar op <code>/demo/offerte</code>.</p>' : '');
    target.appendChild(wrap);
  }

  function mountMultiPage(){
    if(!(FEATURE_RFQ && FEATURE_MULTI)) return;
    // Only on /demo/offerte
    if(!/\/demo\/offerte(\.html)?$/.test(location.pathname)) return;
    var host = document.getElementById('rfqMulti');
    if(!host) return;

    function rowTemplate(index){
      return ''
        + '<tr>'
        +   '<td class="py-2 px-3"><input aria-label="SKU" class="input w-full" data-col="sku" placeholder="SKU" /></td>'
        +   '<td class="py-2 px-3"><input aria-label="Productnaam" class="input w-full" data-col="name" placeholder="Productnaam" /></td>'
        +   '<td class="py-2 px-3"><input aria-label="Aantal" class="input w-24" data-col="qty" type="number" min="1" step="1" value="1" /></td>'
        +   '<td class="py-2 px-3"><input aria-label="Opmerking" class="input w-full" data-col="note" placeholder="Opmerking (optioneel)" /></td>'
        +   '<td class="py-2 px-3 text-right"><button type="button" class="btn btn-outline btn-sm" data-action="del">Verwijderen</button></td>'
        + '</tr>';
    }

    host.innerHTML = ''
      + '<div class="card p-4">'
      +   '<div class="flex items-start justify-between gap-3">'
      +     '<div><div class="font-extrabold text-lg">Demo – Offerte</div><div class="text-sm text-dark/70">Voeg meerdere regels toe en genereer een e-mail.</div></div>'
      +     '<div class="flex items-center gap-2"><button class="btn btn-outline btn-sm" data-action="add">Regel toevoegen</button><button class="btn btn-brand btn-sm" data-action="send">Offerte versturen</button></div>'
      +   '</div>'
      +   '<div class="mt-4 overflow-auto">'
      +     '<table class="min-w-full text-sm">'
      +       '<thead><tr><th class="text-left py-2 px-3">SKU</th><th class="text-left py-2 px-3">Productnaam</th><th class="text-left py-2 px-3">Aantal</th><th class="text-left py-2 px-3">Opmerking</th><th class="py-2 px-3"></th></tr></thead>'
      +       '<tbody id="rfqRows"></tbody>'
      +     '</table>'
      +   '</div>'
      + '</div>';

    var tbody = document.getElementById('rfqRows');
    function addRow(){ var tr = document.createElement('tr'); tr.innerHTML = rowTemplate(Date.now()); tbody.appendChild(tr); }
    // seed 3 rows
    addRow(); addRow(); addRow();

    host.addEventListener('click', function(e){
      var add = e.target.closest('[data-action="add"]');
      var del = e.target.closest('[data-action="del"]');
      var send = e.target.closest('[data-action="send"]');
      if(add){ e.preventDefault(); addRow(); return; }
      if(del){ e.preventDefault(); var tr = e.target.closest('tr'); if(tr && tr.parentNode) tr.parentNode.removeChild(tr); return; }
      if(send){ e.preventDefault(); sendEmail(); return; }
    });

    function sendEmail(){
      var rows = Array.prototype.map.call(tbody.querySelectorAll('tr'), function(tr){
        var get = function(sel){ var el = tr.querySelector(sel); return el ? el.value.trim() : ''; };
        return { sku: get('[data-col="sku"]'), name: get('[data-col="name"]'), qty: get('[data-col="qty"]') || '1', note: get('[data-col="note"]') };
      }).filter(function(r){ return r.sku || r.name; });
      if(rows.length === 0){ try { if(window.toast) window.toast.warning('Voeg minimaal één regel toe.'); } catch {} return; }
      var contact = tryGetContact();
      var lines = [];
      rows.forEach(function(r, i){
        lines.push('— Regel ' + (i+1));
        if(r.name) lines.push('Product: ' + r.name);
        if(r.sku) lines.push('SKU: ' + r.sku);
        lines.push('Aantal: ' + (parseInt(r.qty,10)||1));
        if(r.note) lines.push('Opmerking: ' + r.note);
        lines.push('');
      });
      if(contact && (contact.name || contact.email)){
        lines.push('Contact:');
        if(contact.name) lines.push('Naam: ' + contact.name);
        if(contact.email) lines.push('E-mail: ' + contact.email);
      }
      var body = lines.join('\n');
      var subject = 'Offerteaanvraag — meerdere producten';
      var mailto = buildMailto(subject, body);
      try { if(window.toast) window.toast.success('Toegevoegd aan je offerte.'); } catch {}
      if(mailto.length > 1800){
        copyToClipboard(body).then(function(){
          var info = createModal({
            title: 'Offerte is te lang',
            ariaLabel: 'Offerte melding',
            content: '<div class="text-sm text-dark/80">Je offerte is te lang voor een automatische e-mail. De inhoud is gekopieerd—plak in een e-mail aan <a href="mailto:'+MAIL_TO+'" class="link-cta">'+MAIL_TO+'</a>.</div>'
          });
          info.open();
        });
      } else {
        try { if(window.toast) window.toast.info('Je e-mail wordt geopend.'); } catch {}
        window.location.href = mailto;
      }
    }
  }

  function init(){
    if(!FEATURE_RFQ){
      // If we are on /demo/offerte and feature is off, show disabled note
      if(/\/demo\/offerte(\.html)?$/.test(location.pathname)){
        var host = document.getElementById('rfqMulti');
        if(host){ host.innerHTML = '<div class="card p-4 text-sm text-dark/80">RFQ demo is uitgeschakeld.</div>'; }
      }
      return; // do nothing when feature flag disabled
    }
    // Mount PDP after partials have loaded (prototype uses partial injection)
    var ready = false;
    function tryMount(){ if(ready) return; ready = true; mountPdpButton(); mountStyleGuideAnchors(); mountMultiPage(); }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(function(){ tryMount(); }, 0); });
    } else { setTimeout(function(){ tryMount(); }, 0); }
    document.addEventListener('partials:loaded', function(){ setTimeout(function(){ mountPdpButton(); }, 0); });
  }

  init();
})();


