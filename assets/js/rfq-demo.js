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

  // Modal wrapper powered by BaseDialog
  function createModal(opts){
    var instance = null;
    var api = {
      el: null,
      open: function(){
        if(instance) return instance;
        var body = (opts && opts.content) || '';
        var footer = '<div class="flex justify-end gap-2">'
          + '<button class="btn btn-outline" data-close="basedialog">Annuleren</button>'
          + '<button class="btn btn-brand" data-submit="rfq">Versturen</button>'
          + '</div>';
        instance = (window.BaseDialog && window.BaseDialog.open({
          title: (opts && opts.title) || 'Offerte',
          ariaLabel: (opts && opts.ariaLabel) || 'Offerteformulier',
          size: 'md',
          offsetTop: 36,
          body: body,
          footer: footer,
          onClose: function(){ instance = null; api.el = null; }
        })) || null;
        api.el = instance ? instance.el : null;
        return instance;
      },
      close: function(){ if(instance && instance.close) instance.close(); }
    };
    return api;
  }

  function bindOfferte(btn){
    var addBtn = document.querySelector('[data-add-to-cart]');
    if(!addBtn) return;
    btn.addEventListener('click', function(){
      var sku = addBtn.getAttribute('data-sku') || '';
      var title = addBtn.getAttribute('data-title') || (document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '');

      var content = ''
        + '<div class="space-y-4">'
        +   '<p class="text-sm text-dark/80">Vul je aanvraag in. We nemen zo snel mogelijk contact met je op met een passende offerte.</p>'
        +   '<div class="grid md:grid-cols-2 gap-3">'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-qty">Aantal <span class="text-brand" aria-hidden="true">*</span></label>'
        +       '<input id="rfq-qty" class="input w-full" type="number" min="1" step="1" value="1" required aria-required="true" />'
        +     '</div>'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-org">Organisatietype <span class="text-brand" aria-hidden="true">*</span></label>'
        +       '<select id="rfq-org" class="select w-full" required aria-required="true">'
        +         '<option value="">Selecteer een type</option>'
        +         '<option>Huisartsenpraktijk</option>'
        +         '<option>Kliniek</option>'
        +         '<option>Ziekenhuis</option>'
        +         '<option>Tandartspraktijk</option>'
        +         '<option>Verloskunde</option>'
        +         '<option>Anders</option>'
        +       '</select>'
        +     '</div>'
        +   '</div>'
        +   '<div class="grid md:grid-cols-2 gap-3">'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-contact">Contactpersoon <span class="text-brand" aria-hidden="true">*</span></label>'
        +       '<input id="rfq-contact" class="input w-full" type="text" placeholder="Voor- en achternaam" required aria-required="true" />'
        +     '</div>'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-email">E‑mail <span class="text-brand" aria-hidden="true">*</span></label>'
        +       '<input id="rfq-email" class="input w-full" type="email" inputmode="email" autocomplete="email" placeholder="naam@organisatie.nl" required aria-required="true" />'
        +     '</div>'
        +   '</div>'
        +   '<div class="grid md:grid-cols-2 gap-3">'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-phone">Telefoonnummer <span class="text-dark/60">(optioneel)</span></label>'
        +       '<input id="rfq-phone" class="input w-full" type="tel" inputmode="tel" placeholder="+31 6 1234 5678" />'
        +     '</div>'
        +     '<div>'
        +       '<label class="block text-sm font-semibold" for="rfq-delivery">Levervoorkeur</label>'
        +       '<select id="rfq-delivery" class="select w-full">'
        +         '<option>Zo snel mogelijk</option>'
        +         '<option>Specifieke datum</option>'
        +         '<option>Flexibel</option>'
        +       '</select>'
        +     '</div>'
        +   '</div>'
        +   '<div>'
        +     '<label class="block text-sm font-semibold" for="rfq-note">Extra notities of specifieke wensen</label>'
        +     '<textarea id="rfq-note" class="textarea" rows="4" placeholder="Beschrijf varianten, gewenste levertijd, of aanvullende vragen"></textarea>'
        +   '</div>'
        +   '<div>'
        +     '<label class="block text-sm font-semibold" for="rfq-file">Bestand toevoegen <span class="text-dark/60">(optioneel, PDF/Excel)</span></label>'
        +     '<input id="rfq-file" class="input w-full" type="file" accept="application/pdf,.pdf,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx" />'
        +     '<div class="mt-1 text-xs text-dark/70">Bijlagen kunnen niet automatisch worden meegestuurd via e‑mailkoppeling; we vermelden de bestandsnaam in je aanvraag.</div>'
        +   '</div>'
        +   '<div class="rounded-md border border-light bg-light/20 p-3 text-xs text-dark/70">'
        +     '<div>Deze aanvraag wordt als e‑mail voorbereid aan <span class="font-semibold">'+MAIL_TO+'</span>. Je ziet je e‑mailclient openen om te versturen.</div>'
        +   '</div>'
        + '</div>';

      var modal = createModal({ title: 'Offerte aanvragen', ariaLabel: 'Offerteformulier', content: content });
      modal.open();

      var qtyEl = modal.el && modal.el.querySelector('#rfq-qty');
      var orgEl = modal.el && modal.el.querySelector('#rfq-org');
      var contactEl = modal.el && modal.el.querySelector('#rfq-contact');
      var emailEl = modal.el && modal.el.querySelector('#rfq-email');
      var phoneEl = modal.el && modal.el.querySelector('#rfq-phone');
      var deliveryEl = modal.el && modal.el.querySelector('#rfq-delivery');
      var noteEl = modal.el && modal.el.querySelector('#rfq-note');
      var fileEl = modal.el && modal.el.querySelector('#rfq-file');
      var submitBtn = modal.el && modal.el.querySelector('[data-submit="rfq"]');

      // Prefill from demo user if available
      (function(){
        try {
          var c = tryGetContact();
          if(c){
            if(c.name && contactEl && !contactEl.value) contactEl.value = c.name;
            if(c.email && emailEl && !emailEl.value) emailEl.value = c.email;
          }
        } catch(_){ }
      })();

      function submit(){
        var qty = parseInt((qtyEl && qtyEl.value) || '1', 10) || 1;
        var org = (orgEl && orgEl.value || '').trim();
        var person = (contactEl && contactEl.value || '').trim();
        var email = (emailEl && emailEl.value || '').trim();
        var phone = (phoneEl && phoneEl.value || '').trim();
        var delivery = (deliveryEl && deliveryEl.value) || '';
        var note = (noteEl && noteEl.value || '').trim();
        var fileName = '';
        try { fileName = (fileEl && fileEl.files && fileEl.files[0] && fileEl.files[0].name) || ''; } catch(_){ fileName=''; }

        // Minimal validation for required fields
        if(!org){ try{ window.toast && window.toast.warning('Kies een organisatietype.'); }catch{} if(orgEl) orgEl.focus(); return; }
        if(!person){ try{ window.toast && window.toast.warning('Vul de contactpersoon in.'); }catch{} if(contactEl) contactEl.focus(); return; }
        if(!email){ try{ window.toast && window.toast.warning('Vul je e‑mail in.'); }catch{} if(emailEl) emailEl.focus(); return; }
        var lines = [];
        lines.push('Product: ' + title);
        if(sku) lines.push('SKU: ' + sku);
        lines.push('Aantal: ' + qty);
        if(note) lines.push('Opmerking: ' + note);
        try { lines.push('URL: ' + window.location.href); } catch {}
        lines.push('');
        lines.push('Organisatie: ' + org);
        lines.push('Contactpersoon: ' + person);
        lines.push('E‑mail: ' + email);
        if(phone) lines.push('Telefoon: ' + phone);
        if(delivery) lines.push('Levervoorkeur: ' + delivery);
        if(fileName) lines.push('Bijlage (bestandsnaam): ' + fileName);
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
      // Insert only in the dedicated secondary actions row if present
      var host = document.getElementById('pdpSecondaryActions') || document.querySelector('[data-rfq-host]');
      if(!host) return; // avoid inserting in the first row
      offerteBtn = document.createElement('button');
      offerteBtn.className = 'btn btn-outline btn--rfq btn--no-shrink inline-flex items-center gap-2 whitespace-nowrap';
      offerteBtn.setAttribute('type','button');
      offerteBtn.setAttribute('aria-label','Offerte');
      offerteBtn.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 2H8a2 2 0 0 0-2 2v3H4v2h2v10a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V4a2 2 0 0 0-2-2Zm0 18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7h11ZM10 9h7v2h-7Zm0 4h7v2h-7Zm0 4h5v2h-5Z"/></svg><span>Offerte</span>';
      host.appendChild(offerteBtn);
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


