import { gearCatalog } from './data/gear.js';

export const catalog = gearCatalog;
export const slots = ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask'];

export function filterItems(items, { slot = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => (slot === 'All' || item.slot === slot) &&
    (!needle || [item.name, item.slot, item.tier, ...item.brands, ...item.talents].join(' ').toLowerCase().includes(needle)));
}

export function calculateBuild(items, loadout) {
  const equipped = slots.map(slot => items.find(item => item.id === loadout[slot])).filter(Boolean);
  return { equipped, complete: slots.every(slot => Boolean(loadout[slot])) };
}

if (typeof document !== 'undefined') {
  const state = { slot: 'All', query: '', loadout: Object.fromEntries(slots.map(slot => [slot, ''])) };
  const $ = selector => document.querySelector(selector);
  const items = $('#item-list');
  const resultCount = $('#result-count');
  const buildScore = $('#build-score');
  const buildStatus = $('#build-status');

  function renderDatabase() {
    const visible = filterItems(catalog, state);
    resultCount.textContent = `${visible.length} / ${catalog.length} records`;
    items.innerHTML = visible.map(item => `<article class="item-card">
      <div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">${item.tier}</span></p>
      <h3>${item.name}</h3><p class="tags">${item.modSlots.map(tag => `<span>${tag}</span>`).join('')}</p></div>
      <div class="gear-detail"><p><small>${item.fact.label}</small><b>${item.fact.value}</b><em>${item.fact.note}</em></p>
      <p class="tags"><span>Brands: ${item.brands.join(', ') || '—'}</span><span>Talents: ${item.talents.join(', ') || '—'}</span></p></div>
      <button class="add" data-item="${item.id}" aria-label="Equip ${item.name}">Equip ${item.slot}</button>
    </article>`).join('') || '<p class="empty">No equipment matches this search.</p>';
  }

  function renderBuild() {
    const summary = calculateBuild(catalog, state.loadout);
    for (const slot of slots) {
      const item = catalog.find(entry => entry.id === state.loadout[slot]);
      const target = $(`[data-slot="${slot}"]`);
      target.classList.toggle('filled', Boolean(item));
      target.innerHTML = item ? `<strong>${slot}</strong><span>${item.name}</span><small>${item.tier} · ${item.fact.label}: ${item.fact.value}</small>` : `<strong>${slot}</strong><span>Empty slot</span><small>Choose a ${slot.toLowerCase()} from the database</small>`;
    }
    buildScore.textContent = `${summary.equipped.length}/6`;
    buildStatus.textContent = summary.complete ? 'Six-piece loadout ready' : `${summary.equipped.length} of 6 slots equipped`;
  }

  $('#search').addEventListener('input', event => { state.query = event.target.value; renderDatabase(); });
  $('#filter-slot').addEventListener('change', event => { state.slot = event.target.value; renderDatabase(); });
  items.addEventListener('click', event => {
    const id = event.target.dataset.item;
    if (!id) return;
    const item = catalog.find(entry => entry.id === id);
    state.loadout[item.slot] = id;
    renderBuild();
  });
  document.querySelectorAll('.slot').forEach(button => button.addEventListener('click', () => {
    state.loadout[button.dataset.slot] = '';
    renderBuild();
  }));
  renderDatabase(); renderBuild();
}
