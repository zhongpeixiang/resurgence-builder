import { databaseCatalog, filterItems, calculateWeaponDps, getWeaponHandling } from './app.js';
import { weaponCatalog } from './data/weapons.js';
import { talentCatalog } from './data/talents.js';
import { protocolCatalog } from './data/os-protocols.js';

const $ = selector => document.querySelector(selector);
const state = { category: 'Gear', slot: 'All', query: '' };
const groups = { Gear: ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask'], Weapons: [...new Set(weaponCatalog.map(x => x.weaponClass))], Talents: [...new Set(talentCatalog.map(x => x.slot))], Brands: [], 'OS Protocols': [...new Set(protocolCatalog.map(x => x.core))], 'Skill Chips': [], Specializations: [] };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;' })[char]);
function details(item) {
  if (item.type === 'Gear') return `${esc(item.fact.label)}: ${esc(item.fact.value)} · ${item.brands.map(esc).join(', ')}`;
  if (item.type === 'Weapon') { const dps = calculateWeaponDps(item), h = getWeaponHandling(item); return `${esc(item.damageType)} · Burst ${dps.burst} · Sustained ${dps.sustained} · Accuracy ${h.accuracy}`; }
  if (item.type === 'Talent') return esc(item.description || 'No source description supplied.');
  if (item.type === 'Brand') return item.bonuses.map(x => `${esc(x.label)}: ${esc(x.value)}`).join(' · ');
  if (item.type === 'OS Protocol') return `${esc(item.core)} · ${esc(item.mainStat?.label)} ${esc(item.mainStat?.value)} · ${esc(item.talent)}`;
  if (item.type === 'Specialization') return `${esc(item.focusPaths)} · ${esc(item.abilities)}`;
  return [...item.facts, ...item.lines].map(x => `${esc(x.label)}: ${esc(x.value)}`).join(' · ');
}
function renderOptions() { $('#filter-slot').innerHTML = ['All', ...(groups[state.category] ?? [])].map(x => `<option>${esc(x)}</option>`).join(''); state.slot = 'All'; }
function render() {
  const shown = filterItems(databaseCatalog, state);
  $('#result-count').textContent = `${shown.length} / ${databaseCatalog.length} records`;
  $('#item-list').innerHTML = shown.map(item => `<article class="item-card"><div><p class="eyebrow"><span class="tag">${esc(item.type)}</span><span class="tag ghost">${esc(item.slot ?? item.weaponClass ?? item.core ?? item.rarity ?? '')}</span></p><h3>${esc(item.name)}</h3><p class="talent-copy">${details(item)}</p></div><a class="add" href="builder.html?equip=${encodeURIComponent(item.id)}">Equip in Build Lab →</a></article>`).join('') || '<p class="empty">No equipment matches this search.</p>';
}
$('#search').addEventListener('input', e => { state.query = e.target.value; render(); });
$('#filter-category').addEventListener('change', e => { state.category = e.target.value; renderOptions(); render(); });
$('#filter-slot').addEventListener('change', e => { state.slot = e.target.value; render(); });
renderOptions(); render();
