import { gearCatalog } from './data/gear.js';
import { weaponCatalog } from './data/weapons.js';
import { talentCatalog } from './data/talents.js';
import { brandCatalog } from './data/brands.js';
import { protocolCatalog } from './data/os-protocols.js';
import { skillChipCatalog } from './data/skill-chips.js';

export const catalog = gearCatalog;
export const databaseCatalog = [...gearCatalog, ...weaponCatalog, ...talentCatalog, ...brandCatalog, ...protocolCatalog, ...skillChipCatalog];
export const slots = ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask', 'Primary Weapon', 'Secondary Weapon'];

export function filterItems(items, { category = 'All', slot = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => {
    const itemCategory = item.type === 'Gear' ? 'Gear' : item.type === 'Weapon' ? 'Weapons' : item.type === 'Talent' ? 'Talents' : item.type === 'Brand' ? 'Brands' : item.type === 'OS Protocol' ? 'OS Protocols' : 'Skill Chips';
    const group = item.slot ?? item.weaponClass ?? item.core;
    const values = item.type === 'Skill Chip'
      ? [item.name, item.kicker, item.description, ...item.facts.flatMap(fact => [fact.label, fact.value]), ...item.attributes.flatMap(attribute => [attribute.label, attribute.value])]
      : item.type === 'Gear'
      ? [item.name, item.slot, item.tier, ...item.brands, ...item.talents]
      : item.type === 'Weapon'
        ? [item.name, item.weaponClass, item.damageType, ...item.badges, ...item.facts.flatMap(fact => [fact.label, fact.value]), ...item.talents]
        : item.type === 'Talent'
          ? [item.name, item.kicker, item.slot, item.description, item.secondaryDescription, ...item.attributes.flatMap(attribute => [attribute.label, attribute.value])]
          : item.type === 'Brand'
            ? [item.name, item.kicker, ...item.bonuses.flatMap(bonus => [bonus.label, bonus.value])]
            : [item.name, item.core, item.description, item.secondaryDescription, ...item.attributes.flatMap(attribute => [attribute.label, attribute.value])];
    return (category === 'All' || itemCategory === category) && (slot === 'All' || group === slot) &&
      (!needle || values.join(' ').toLowerCase().includes(needle));
  });
}

export function calculateBuild(items, loadout) {
  const equipped = slots.map(slot => items.find(item => item.id === loadout[slot])).filter(Boolean);
  return { equipped, complete: slots.every(slot => Boolean(loadout[slot])) };
}

export function createBuildIssueUrl(equipped) {
  const body = ['## Fieldkit build', '', ...equipped.map(item => `- **${item.type}:** ${item.name}`), '', '_Published from Fieldkit._'].join('\n');
  const query = new URLSearchParams({ title: `Fieldkit build — ${equipped.length} equipped`, body, labels: 'build' });
  return `https://github.com/zhongpeixiang/resurgence-builder/issues/new?${query}`;
}

if (typeof document !== 'undefined') {
  const state = { category: 'Gear', slot: 'All', query: '', loadout: Object.fromEntries(slots.map(slot => [slot, ''])) };
  const $ = selector => document.querySelector(selector);
  const items = $('#item-list');
  const resultCount = $('#result-count');
  const buildScore = $('#build-score');
  const buildStatus = $('#build-status');
  const slotFilter = $('#filter-slot');
  const groups = { Gear: ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask'], Weapons: [...new Set(weaponCatalog.map(item => item.weaponClass))], Talents: [...new Set(talentCatalog.map(item => item.slot))], Brands: [], 'OS Protocols': [...new Set(protocolCatalog.map(item => item.core))], 'Skill Chips': [] };
  const totals = { Gear: gearCatalog.length, Weapons: weaponCatalog.length, Talents: talentCatalog.length, Brands: brandCatalog.length, 'OS Protocols': protocolCatalog.length, 'Skill Chips': skillChipCatalog.length };

  function renderSlotOptions() {
    slotFilter.innerHTML = ['All', ...(groups[state.category] ?? [])].map(value => `<option>${value}</option>`).join('');
    state.slot = 'All';
  }
  function gearCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">${item.tier}</span></p><h3>${item.name}</h3><p class="tags">${item.modSlots.map(tag => `<span>${tag}</span>`).join('')}</p></div><div class="gear-detail"><p><small>${item.fact.label}</small><b>${item.fact.value}</b><em>${item.fact.note}</em></p><p class="tags"><span>Brands: ${item.brands.join(', ') || '—'}</span><span>Talents: ${item.talents.join(', ') || '—'}</span></p></div><button class="add" data-item="${item.id}" data-target="${item.slot}">Equip ${item.slot}</button></article>`; }
  function weaponCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.weaponClass}</span><span class="tag ghost">${item.damageType}</span></p><h3>${item.name}</h3><p class="tags">${item.badges.map(tag => `<span>${tag}</span>`).join('')}</p></div><div class="gear-detail"><p><small>${item.facts[0]?.label ?? '—'}</small><b>${item.facts[0]?.value ?? '—'}</b><em>${item.facts[0]?.note ?? ''}</em></p><p class="tags">${item.facts.slice(1, 3).map(fact => `<span>${fact.label}: ${fact.value}</span>`).join('')}</p></div><div class="weapon-actions"><button class="add" data-item="${item.id}" data-target="Primary Weapon">Equip primary</button><button class="add" data-item="${item.id}" data-target="Secondary Weapon">Equip secondary</button></div></article>`; }
  function talentCard(item) { return `<article class="item-card talent-card"><div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">Talent</span></p><h3>${item.name}</h3><p class="talent-copy">${item.description || 'No primary description supplied.'}</p></div><div class="gear-detail"><p><small>ATTRIBUTE DETAILS</small><b>${item.attributes.length || 0}</b><em>tracked properties</em></p><p class="tags">${item.attributes.map(attribute => `<span>${attribute.label}: ${attribute.value}</span>`).join('') || '<span>No additional attributes</span>'}</p></div></article>`; }
  function brandCard(item) { return `<article class="item-card brand-card"><div><p class="eyebrow"><span class="tag">Brand Set</span><span class="tag ghost">Equipment</span></p><h3>${item.name}</h3><p class="talent-copy">Sourced equipment-set bonuses.</p></div><div class="gear-detail"><p><small>SET BONUSES</small><b>${item.bonuses.length}</b><em>piece thresholds</em></p><p class="tags">${item.bonuses.map(bonus => `<span>${bonus.label}: ${bonus.value}</span>`).join('')}</p></div></article>`; }
  function protocolCard(item) { return `<article class="item-card protocol-card"><div><p class="eyebrow"><span class="tag">${item.core}</span><span class="tag ghost">OS Protocol</span></p><h3>${item.name}</h3><p class="talent-copy">${item.description || 'No primary description supplied.'}</p></div><div class="gear-detail"><p><small>ATTRIBUTE DETAILS</small><b>${item.attributes.length || 0}</b><em>tracked properties</em></p><p class="tags">${item.attributes.map(attribute => `<span>${attribute.label}: ${attribute.value}</span>`).join('') || '<span>No additional attributes</span>'}</p></div></article>`; }
  function skillChipCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">Skill Chip Set</span>${item.badges.map(badge => `<span class="tag ghost">${badge}</span>`).join('')}</p><h3>${item.name}</h3><p class="talent-copy">${item.kicker}</p></div><div class="gear-detail"><p><small>CHIP DETAILS</small><b>${item.facts.length}</b><em>sourced fields</em></p><p class="tags">${[...item.facts, ...item.lines].map(detail => `<span>${detail.label}: ${detail.value}</span>`).join('')}</p></div></article>`; }
  function renderDatabase() {
    const visible = filterItems(databaseCatalog, state);
    resultCount.textContent = `${visible.length} / ${state.category === 'All' ? databaseCatalog.length : totals[state.category]} records`;
    items.innerHTML = visible.map(item => item.type === 'Gear' ? gearCard(item) : item.type === 'Weapon' ? weaponCard(item) : item.type === 'Talent' ? talentCard(item) : item.type === 'Brand' ? brandCard(item) : item.type === 'OS Protocol' ? protocolCard(item) : skillChipCard(item)).join('') || '<p class="empty">No equipment matches this search.</p>';
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
    $('#save-build').href = createBuildIssueUrl(summary.equipped);
    $('#save-build').classList.toggle('disabled', summary.equipped.length === 0);
  }
  $('#search').addEventListener('input', event => { state.query = event.target.value; renderDatabase(); });
  $('#filter-category').addEventListener('change', event => { state.category = event.target.value; renderSlotOptions(); renderDatabase(); });
  slotFilter.addEventListener('change', event => { state.slot = event.target.value; renderDatabase(); });
  items.addEventListener('click', event => { const id = event.target.dataset.item, target = event.target.dataset.target; if (!id || !target) return; state.loadout[target] = id; renderBuild(); });
  document.querySelectorAll('.slot').forEach(button => button.addEventListener('click', () => { state.loadout[button.dataset.slot] = ''; renderBuild(); }));
  renderSlotOptions(); renderDatabase(); renderBuild();
}
