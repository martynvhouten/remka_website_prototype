// Lightweight modal to add a product to an existing/new bestellijst
import { OrderLists } from '/assets/js/store/orderLists.js';

function ensureHost(){
  let host = document.getElementById('ol-modal-host');
  if(host) return host;
  host = document.createElement('div');
  host.id = 'ol-modal-host';
  document.body.appendChild(host);
  return host;
}

function template(){
  return `
  <div class="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Toevoegen aan bestellijst">
    <button class="absolute inset-0 bg-black/40" data-close aria-label="Sluiten"></button>
    <div class="absolute inset-0 grid place-items-center p-4">
      <div class="card w-full max-w-md">
        <div class="flex items-center justify-between p-4 border-b border-light">
          <h4 class="font-extrabold">Toevoegen aan bestellijst</h4>
          <button class="p-2" data-close aria-label="Sluiten">✕</button>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <label class="block text-sm font-semibold mb-1">Kies een bestellijst</label>
            <select class="select w-full" data-select></select>
          </div>
          <div>
            <label class="block text-sm font-semibold mb-1" for="ol-new">Of maak een nieuwe lijst</label>
            <div class="flex items-stretch gap-2">
              <input id="ol-new" class="input flex-1" type="text" placeholder="Naam van de bestellijst" />
              <button class="btn btn-outline" data-create>Toevoegen</button>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-light flex justify-end gap-2">
          <button class="btn btn-outline" data-close>Annuleren</button>
          <button class="btn btn-brand" data-confirm>Toevoegen</button>
        </div>
      </div>
    </div>
  </div>`;
}

function fillSelect(sel){
  const { lists } = OrderLists.getState();
  sel.innerHTML = '';
  const opt = document.createElement('option');
  opt.value = '';
  opt.textContent = 'Selecteer een lijst';
  sel.appendChild(opt);
  Object.values(lists).forEach((l) => {
    const o = document.createElement('option');
    o.value = l.id; o.textContent = `${l.name} (${l.items.length})`;
    sel.appendChild(o);
  });
}

export function openAddToOrderListModal(product){
  const host = ensureHost();
  host.innerHTML = template();
  const modal = host.firstElementChild;
  const select = modal.querySelector('[data-select]');
  const newName = modal.querySelector('#ol-new');
  const createBtn = modal.querySelector('[data-create]');
  const confirmBtn = modal.querySelector('[data-confirm]');
  const closeBtns = modal.querySelectorAll('[data-close]');
  fillSelect(select);

  function close(){ if(modal && modal.parentElement){ modal.parentElement.innerHTML = ''; } }
  closeBtns.forEach((b)=> b.addEventListener('click', close));
  modal.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  createBtn.addEventListener('click', () => {
    const name = (newName.value || '').trim();
    if(!name) return;
    const id = OrderLists.createList(name);
    fillSelect(select);
    select.value = id;
    newName.value = '';
  });

  confirmBtn.addEventListener('click', () => {
    let listId = select.value;
    if(!listId){
      const name = (newName.value || '').trim();
      if(!name) return;
      listId = OrderLists.createList(name);
    }
    OrderLists.addItem(listId, {
      sku: product.sku,
      name: product.name,
      price: Number(product.price || 0),
      min: 0, max: 0, current: 0
    });
    close();
  });
}

// Wire global triggers
document.addEventListener('click', (e) => {
  const btn = e.target && e.target.closest('[data-orderlist]');
  if(!btn) return;
  const holder = btn.closest('[data-card]') || document;
  const sku = btn.getAttribute('data-sku') || holder.querySelector('[data-add][data-sku]')?.getAttribute('data-sku') || document.querySelector('[data-add-to-cart][data-sku]')?.getAttribute('data-sku') || '';
  const title = btn.getAttribute('data-title') || holder.querySelector('[data-title]')?.textContent || document.querySelector('h1')?.textContent || 'Product';
  const priceAttr = btn.getAttribute('data-price') || holder.querySelector('[data-add][data-price]')?.getAttribute('data-price') || document.querySelector('[data-add-to-cart][data-price]')?.getAttribute('data-price') || '0';
  openAddToOrderListModal({ sku, name: title, price: Number(priceAttr || 0) });
});


