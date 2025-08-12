// Minimal vanilla store for Bestellijsten with localStorage persistence
// Store shape:
// {
//   lists: Record<id, { id, name, notify: 'none'|'daily'|'weekly',
//     items: Array<{ id, sku, name, price, min, max, current }> }>
// }

const STORAGE_KEY = 'remka_order_lists_v1';

function uid(prefix) {
  return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
}

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function write(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const listeners = new Set();
function notify() { listeners.forEach((fn) => { try { fn(getState()); } catch {} }); }

let state = { lists: {} };

function hydrate() {
  const data = read();
  if (data && typeof data === 'object') state = { lists: data.lists || {} };
  else state = { lists: {} };
}

function getState() { return clone(state); }

function setState(next) {
  state = next;
  write(state);
  notify();
}

function createList(name) {
  const id = uid('list');
  const list = { id, name: String(name || 'Nieuwe lijst'), notify: 'none', items: [] };
  const next = getState();
  next.lists[id] = list;
  setState(next);
  return id;
}

function deleteList(id) {
  const next = getState();
  delete next.lists[id];
  setState(next);
}

function renameList(id, name) {
  const next = getState();
  if (!next.lists[id]) return;
  next.lists[id].name = String(name || '');
  setState(next);
}

function getList(id) {
  const s = getState();
  return s.lists[id] || null;
}

function addItem(listId, item) {
  const next = getState();
  const list = next.lists[listId];
  if (!list) return;
  const id = item.id || uid('item');
  const exists = list.items.find((x) => x.sku === item.sku);
  if (exists) {
    // merge by SKU; keep min/max/current if provided
    exists.min = item.min ?? exists.min ?? 0;
    exists.max = item.max ?? exists.max ?? 0;
    exists.current = item.current ?? exists.current ?? 0;
    exists.price = item.price ?? exists.price ?? 0;
  } else {
    list.items.push({
      id,
      sku: String(item.sku),
      name: String(item.name || ''),
      price: Number(item.price || 0),
      min: Number(item.min || 0),
      max: Number(item.max || 0),
      current: Number(item.current || 0)
    });
  }
  setState(next);
}

function removeItem(listId, itemId) {
  const next = getState();
  const list = next.lists[listId];
  if (!list) return;
  list.items = list.items.filter((x) => x.id !== itemId);
  setState(next);
}

function updateItem(listId, itemId, patch) {
  const next = getState();
  const list = next.lists[listId];
  if (!list) return;
  const target = list.items.find((x) => x.id === itemId);
  if (!target) return;
  Object.assign(target, patch || {});
  // Coerce and validate minimal constraints
  if (target.min > target.max) target.min = target.max;
  if (target.current < 0) target.current = 0;
  setState(next);
}

function computeTotals(listId) {
  const list = getList(listId);
  if (!list) return { items: 0, adviceQty: 0, sum: 0 };
  let adviceQty = 0, sum = 0;
  list.items.forEach((it) => {
    const q = Math.max(0, Number(it.max || 0) - Number(it.current || 0));
    adviceQty += q;
    sum += q * Number(it.price || 0);
  });
  return { items: list.items.length, adviceQty, sum };
}

function addAllToCart(listId) {
  const list = getList(listId);
  if (!list) return;
  const items = list.items.map((it) => ({ sku: it.sku, qty: Math.max(0, Number(it.max || 0) - Number(it.current || 0)) }))
    .filter((x) => x.qty > 0);
  try { window.dispatchEvent(new CustomEvent('cart:addItems', { detail: items })); } catch {}
}

function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

hydrate();

export const OrderLists = {
  getState, getList, subscribe,
  createList, deleteList, renameList,
  addItem, removeItem, updateItem,
  computeTotals, addAllToCart,
  setNotify(listId, value){
    const next = getState();
    if(next.lists[listId]){
      next.lists[listId].notify = (value === 'daily' || value === 'weekly') ? value : 'none';
      setState(next);
    }
  }
};


