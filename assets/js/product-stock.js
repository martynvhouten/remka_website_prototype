(function(){
  function fillStock(){
    const host = document.getElementById('stockArea'); if(!host) return;
    const stock = document.body.getAttribute('data-stock') || new URLSearchParams(location.search).get('stock') || 'in_stock';
    const eta = document.body.getAttribute('data-eta') || new URLSearchParams(location.search).get('eta') || '';
    let badge = '';
    let note = '';
    if(stock === 'in_stock'){
      badge = '<span class="stock-ok"><span class="dot"></span> Op voorraad</span>';
      note = '<div class="mt-2 text-sm text-dark/70">Voor 15:00 besteld = volgende werkdag geleverd</div>';
    } else if(stock === 'backorder'){
      badge = '<span class="stock-backorder"><span class="dot"></span> Speciaal voor je besteld</span>';
      note = '<div class="mt-2 text-sm text-dark/70">Levering binnen 3–6 werkdagen</div>';
    } else if(stock === 'out_of_stock'){
      badge = '<span class="stock-out"><span class="dot"></span> Niet op voorraad</span>';
      const etaText = eta ? `Verwacht op ${eta}` : 'Verwachte leverdatum op aanvraag';
      note = `<div class=\"mt-2 text-sm text-dark/70\">${etaText}</div>`;
    } else {
      badge = '<span class="badge">Beschikbaarheid onbekend</span>';
    }
    host.innerHTML = badge + note;
  }

  // Run after DOM ready and after partials are injected
  const run = () => fillStock();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
  document.addEventListener('partials:loaded', run);
})();


