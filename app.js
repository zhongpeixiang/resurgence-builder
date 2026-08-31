import { gearCatalog } from './data/gear.js';
import { weaponCatalog } from './data/weapons.js';

export const catalog = gearCatalog;
export const databaseCatalog = [...gearCatalog, ...weaponCatalog];
export const slots = ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask', 'Primary Weapon', 'Secondary Weapon'];

export function filterItems(items, { category = 'All', slot = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => {
    const itemCategory = item.type === 'Gear' ? 'Gear' : 'Weapons';
    const group = item.slot ?? item.weaponClass;
    const values = item.type === 'Gear'
      ? [item.name, item.slot, item.tier, ...item.brands, ...item.talents]
      : [item.name, item.weaponClass, item.damageType, ...item.badges, ...item.facts.flatMap(fact => [fact.label, fact.value]), ...item.talents];
    return (category === 'All' || itemCategory === category) && (slot === 'All' || group === slot) &&
      (!needle || values.join(' ').toLowerCase().includes(needle));
  });
}

export function calculateBuild(items, loadout) {
  const equipped = slots.map(slot => items.find(item => item.id === loadout[slot])).filter(Boolean);
  return { equipped, complete: slots.every(slot => Boolean(loadout[slot])) };
}

if (typeof document !== 'undefined') {
  const state = { category: 'Gear', slot: 'All', query: '', loadout: Object.fromEntries(slots.map(slot => [slot, ''])) };
  const $ = selector => document.querySelector(selector);
  const items = $('#item-list');
  const resultCount = $('#result-count');
  const buildScore = $('#build-score');
  const buildStatus = $('#build-status');
  const slotFilter = $('#filter-slot');
  const groups = { Gear: ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask'], Weapons: [...new Set(weaponCatalog.map(item => item.weaponClass))] };

  function renderSlotOptions() {
    slotFilter.innerHTML = ['All', ...(groups[state.category] ?? [])].map(value => `<option>${value}</option>`).join('');
    state.slot = 'All';
  }
  function gearCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">${item.tier}</span></p><h3>${item.name}</h3><p class="tags">${item.modSlots.map(tag => `<span>${tag}</span>`).join('')}</p></div><div class="gear-detail"><p><small>${item.fact.label}</small><b>${item.fact.value}</b><em>${item.fact.note}</em></p><p class="tags"><span>Brands: ${item.brands.join(', ') || '—'}</span><span>Talents: ${item.talents.join(', ') || '—'}</span></p></div><button class="add" data-item="${item.id}" data-target="${item.slot}">Equip ${item.slot}</button></article>`; }
  function weaponCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.weaponClass}</span><span class="tag ghost">${item.damageType}</span></p><h3>${item.name}</h3><p class="tags">${item.badges.map(tag => `<span>${tag}</span>`).join('')}</p></div><div class="gear-detail"><p><small>${item.facts[0]?.label ?? '—'}</small><b>${item.facts[0]?.value ?? '—'}</b><em>${item.facts[0]?.note ?? ''}</em></p><p class="tags">${item.facts.slice(1, 3).map(fact => `<span>${fact.label}: ${fact.value}</span>`).join('')}</p></div><div class="weapon-actions"><button class="add" data-item="${item.id}" data-target="Primary Weapon">Equip primary</button><button class="add" data-item="${item.id}" data-target="Secondary Weapon">Equip secondary</button></div></article>`; }
  function renderDatabase() {
    const visible = filterItems(databaseCatalog, state);
    resultCount.textContent = `${visible.length} / ${state.category === 'All' ? databaseCatalog.length : state.category === 'Gear' ? gearCatalog.length : weaponCatalog.length} records`;
    items.innerHTML = visible.map(item => item.type === 'Gear' ? gearCard(item) : weaponCard(item)).join('') || '<p class="empty">No equipment matches this search.</p>';
  }
  function renderBuild() {
    const summary = calculateBuild(databaseCatalog, state.loadout);
    for (const slot of slots) {
      const item = databaseCatalog.find(entry => entry.id === state.loadout[slot]);
      const target = $(`[data-slot="${slot}"]`);
      target.classList.toggle('filled', Boolean(item));
      const detail = item ? (item.type === 'Gear' ? `${item.tier} · ${item.fact.label}: ${item.fact.value}` : `${item.weaponClass} · ${item.facts[0]?.label}: ${item.facts[0]?.value}`) : `Choose a ${slot.toLowerCase()} from the database`;
      target.innerHTML = item ? `<strong>${slot}</strong><span>${item.name}</span><small>${detail}</small>` : `<strong>${slot}</strong><span>Empty slot</span><small>${detail}</small>`;
    }
    buildScore.textContent = `${summary.equipped.length}/8`;
    buildStatus.textContent = summary.complete ? 'Eight-slot loadout ready' : `${summary.equipped.length} of 8 slots equipped`;
  }
  $('#search').addEventListener('input', event => { state.query = event.target.value; renderDatabase(); });
  $('#filter-category').addEventListener('change', event => { state.category = event.target.value; renderSlotOptions(); renderDatabase(); });
  slotFilter.addEventListener('change', event => { state.slot = event.target.value; renderDatabase(); });
  items.addEventListener('click', event => { const id = event.target.dataset.item, target = event.target.dataset.target; if (!id || !target) return; state.loadout[target] = id; renderBuild(); });
  document.querySelectorAll('.slot').forEach(button => button.addEventListener('click', () => { state.loadout[button.dataset.slot] = ''; renderBuild(); }));
  renderSlotOptions(); renderDatabase(); renderBuild();
}
