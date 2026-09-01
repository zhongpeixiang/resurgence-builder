import { gearCatalog } from './data/gear.js';
import { weaponCatalog } from './data/weapons.js';
import { talentCatalog } from './data/talents.js';
import { brandCatalog } from './data/brands.js';
import { protocolCatalog } from './data/os-protocols.js';
import { skillChipCatalog } from './data/skill-chips.js';
import { specializationCatalog } from './data/specializations.js';

export const catalog = gearCatalog;
export const databaseCatalog = [...gearCatalog, ...weaponCatalog, ...talentCatalog, ...brandCatalog, ...protocolCatalog, ...skillChipCatalog, ...specializationCatalog];
export const slots = ['Specialization', 'OS Protocol', 'Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask', 'Primary Weapon', 'Secondary Weapon'];

export function filterItems(items, { category = 'All', slot = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => {
    const itemCategory = item.type === 'Gear' ? 'Gear' : item.type === 'Weapon' ? 'Weapons' : item.type === 'Talent' ? 'Talents' : item.type === 'Brand' ? 'Brands' : item.type === 'OS Protocol' ? 'OS Protocols' : item.type === 'Skill Chip' ? 'Skill Chips' : 'Specializations';
    const group = item.slot ?? item.weaponClass ?? item.core ?? item.type;
    const values = item.type === 'Specialization'
      ? [item.name, item.focusPaths, item.abilities, item.description, ...item.facts.flatMap(fact => [fact.label, fact.value])]
      : item.type === 'Skill Chip'
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

export function itemsForSlot(slot) {
  if (slot === 'Primary Weapon' || slot === 'Secondary Weapon') return weaponCatalog;
  if (slot === 'Specialization') return specializationCatalog;
  if (slot === 'OS Protocol') return protocolCatalog;
  return gearCatalog.filter(item => item.slot === slot);
}

export function calculateWeaponDps(weapon) {
  const damage = weapon.facts.find(fact => fact.label === 'DAMAGE')?.value ?? '';
  const rateMag = weapon.facts.find(fact => fact.label === 'RATE / MAG')?.value ?? '';
  const reload = weapon.facts.find(fact => fact.label === 'RELOAD')?.value ?? '';
  const [low, high] = damage.replaceAll(',', '').split(/[–-]/).map(Number);
  const rpm = Number(rateMag.match(/(\d+)\s*RPM/)?.[1]);
  const magazine = Number(rateMag.match(/(\d+)\s*MAG/)?.[1]);
  const reloadSeconds = Number(reload.match(/[\d.]+/)?.[0]);
  if (![low, high, rpm, magazine, reloadSeconds].every(Number.isFinite)) return { burst: '—', sustained: '—' };
  const roundsPerSecond = rpm / 60;
  const formatRange = fn => { const values = [fn(low), fn(high)].map(value => Math.round(value).toLocaleString('en-US')); return values[0] === values[1] ? values[0] : values.join('–'); };
  return {
    burst: formatRange(damageValue => damageValue * roundsPerSecond),
    sustained: formatRange(damageValue => (damageValue * magazine) / ((magazine / roundsPerSecond) + reloadSeconds))
  };
}

export function getWeaponHandling(weapon) {
  const meters = weapon.facts.find(fact => fact.label === 'HANDLING')?.meters ?? [];
  return {
    accuracy: meters.find(meter => meter.label === 'ACCURACY')?.value ?? 0,
    stability: meters.find(meter => meter.label === 'STABILITY')?.value ?? 0
  };
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
  const groups = { Gear: ['Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask'], Weapons: [...new Set(weaponCatalog.map(item => item.weaponClass))], Talents: [...new Set(talentCatalog.map(item => item.slot))], Brands: [], 'OS Protocols': [...new Set(protocolCatalog.map(item => item.core))], 'Skill Chips': [], Specializations: [] };
  const totals = { Gear: gearCatalog.length, Weapons: weaponCatalog.length, Talents: talentCatalog.length, Brands: brandCatalog.length, 'OS Protocols': protocolCatalog.length, 'Skill Chips': skillChipCatalog.length, Specializations: specializationCatalog.length };

  function renderSlotOptions() {
    slotFilter.innerHTML = ['All', ...(groups[state.category] ?? [])].map(value => `<option>${value}</option>`).join('');
    state.slot = 'All';
  }
  function gearCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">${item.tier}</span></p><h3>${item.name}</h3><p class="tags">${item.modSlots.map(tag => `<span>${tag}</span>`).join('')}</p></div><div class="gear-detail"><p><small>${item.fact.label}</small><b>${item.fact.value}</b><em>${item.fact.note}</em></p><p class="tags"><span>Brands: ${item.brands.join(', ') || '—'}</span><span>Talents: ${item.talents.join(', ') || '—'}</span></p></div><button class="add" data-item="${item.id}" data-target="${item.slot}">Equip ${item.slot}</button></article>`; }
  function weaponCard(item) {
    const dps = calculateWeaponDps(item);
    const handling = getWeaponHandling(item);
    return `<article class="item-card"><div><p class="eyebrow"><span class="tag">${item.weaponClass}</span><span class="tag ghost">${item.damageType}</span></p><h3>${item.name}</h3><p class="tags">${item.badges.map(tag => `<span>${tag}</span>`).join('')}<span>BURST DPS: ${dps.burst}</span><span>SUSTAINED DPS: ${dps.sustained}</span><span>ACCURACY: ${handling.accuracy}</span><span>STABILITY: ${handling.stability}</span></p></div><div class="gear-detail"><p><small>${item.facts[0]?.label ?? '—'}</small><b>${item.facts[0]?.value ?? '—'}</b><em>${item.facts[0]?.note ?? ''}</em></p><p class="tags">${item.facts.slice(1, 3).map(fact => `<span>${fact.label}: ${fact.value}</span>`).join('')}</p></div><div class="weapon-actions"><button class="add" data-item="${item.id}" data-target="Primary Weapon">Equip primary</button><button class="add" data-item="${item.id}" data-target="Secondary Weapon">Equip secondary</button></div></article>`;
  }
  function talentCard(item) { return `<article class="item-card talent-card"><div><p class="eyebrow"><span class="tag">${item.slot}</span><span class="tag ghost">Talent</span></p><h3>${item.name}</h3><p class="talent-copy">${item.description || 'No primary description supplied.'}</p></div><div class="gear-detail"><p><small>ATTRIBUTE DETAILS</small><b>${item.attributes.length || 0}</b><em>tracked properties</em></p><p class="tags">${item.attributes.map(attribute => `<span>${attribute.label}: ${attribute.value}</span>`).join('') || '<span>No additional attributes</span>'}</p></div></article>`; }
  function brandCard(item) { return `<article class="item-card brand-card"><div><p class="eyebrow"><span class="tag">Brand Set</span><span class="tag ghost">Equipment</span></p><h3>${item.name}</h3><p class="talent-copy">Sourced equipment-set bonuses.</p></div><div class="gear-detail"><p><small>SET BONUSES</small><b>${item.bonuses.length}</b><em>piece thresholds</em></p><p class="tags">${item.bonuses.map(bonus => `<span>${bonus.label}: ${bonus.value}</span>`).join('')}</p></div></article>`; }
  function protocolCard(item) { return `<article class="item-card protocol-card"><div><p class="eyebrow"><span class="tag">${item.core}</span><span class="tag ghost">OS Protocol</span></p><h3>${item.name}</h3><p class="talent-copy">${item.description || 'No primary description supplied.'}</p></div><div class="gear-detail"><p><small>ATTRIBUTE DETAILS</small><b>${item.attributes.length || 0}</b><em>tracked properties</em></p><p class="tags">${item.attributes.map(attribute => `<span>${attribute.label}: ${attribute.value}</span>`).join('') || '<span>No additional attributes</span>'}</p></div><button class="add" data-item="${item.id}" data-target="OS Protocol">Equip OS protocol</button></article>`; }
  function specializationCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">Specialization</span></p><h3>${item.name}</h3><p class="talent-copy">${item.description}</p></div><div class="gear-detail"><p><small>FOCUS PATHS</small><b>${item.focusPaths}</b><em>${item.abilities}</em></p></div><button class="add" data-item="${item.id}" data-target="Specialization">Equip specialization</button></article>`; }
  function skillChipCard(item) { return `<article class="item-card"><div><p class="eyebrow"><span class="tag">Skill Chip Set</span>${item.badges.map(badge => `<span class="tag ghost">${badge}</span>`).join('')}</p><h3>${item.name}</h3><p class="talent-copy">${item.kicker}</p></div><div class="gear-detail"><p><small>CHIP DETAILS</small><b>${item.facts.length}</b><em>sourced fields</em></p><p class="tags">${[...item.facts, ...item.lines].map(detail => `<span>${detail.label}: ${detail.value}</span>`).join('')}</p></div></article>`; }
  function renderDatabase() {
    const visible = filterItems(databaseCatalog, state);
    resultCount.textContent = `${visible.length} / ${state.category === 'All' ? databaseCatalog.length : totals[state.category]} records`;
    items.innerHTML = visible.map(item => item.type === 'Gear' ? gearCard(item) : item.type === 'Weapon' ? weaponCard(item) : item.type === 'Talent' ? talentCard(item) : item.type === 'Brand' ? brandCard(item) : item.type === 'OS Protocol' ? protocolCard(item) : item.type === 'Specialization' ? specializationCard(item) : skillChipCard(item)).join('') || '<p class="empty">No equipment matches this search.</p>';
  }
  function renderBuild() {
    const summary = calculateBuild(databaseCatalog, state.loadout);
    for (const slot of slots) {
      const item = databaseCatalog.find(entry => entry.id === state.loadout[slot]);
      const target = $(`[data-slot="${slot}"]`);
      target.classList.toggle('filled', Boolean(item));
      const detail = item ? (item.type === 'Gear' ? `${item.tier} · ${item.fact.label}: ${item.fact.value}` : item.type === 'Weapon' ? `${item.weaponClass} · ${item.facts[0]?.label}: ${item.facts[0]?.value}` : item.type === 'OS Protocol' ? `${item.core} · OS protocol` : item.type === 'Specialization' ? item.focusPaths : item.type) : `Choose a ${slot.toLowerCase()} from the database`;
      const options = itemsForSlot(slot).map(option => `<option value="${option.id}" ${option.id === state.loadout[slot] ? 'selected' : ''}>${option.name}</option>`).join('');
      target.innerHTML = `<strong>${slot}</strong><span>${item?.name ?? 'Empty slot'}</span><small>${detail}</small><select class="slot-select" data-slot-select="${slot}"><option value="">Select from database…</option>${options}</select>`;
    }
    buildScore.textContent = `${summary.equipped.length}/${slots.length}`;
    buildStatus.textContent = summary.complete ? 'Loadout ready' : `${summary.equipped.length} of ${slots.length} slots equipped`;
    $('#save-build').href = createBuildIssueUrl(summary.equipped);
    $('#save-build').classList.toggle('disabled', summary.equipped.length === 0);
  }
  $('#search').addEventListener('input', event => { state.query = event.target.value; renderDatabase(); });
  $('#filter-category').addEventListener('change', event => { state.category = event.target.value; renderSlotOptions(); renderDatabase(); });
  slotFilter.addEventListener('change', event => { state.slot = event.target.value; renderDatabase(); });
  items.addEventListener('click', event => { const id = event.target.dataset.item, target = event.target.dataset.target; if (!id || !target) return; state.loadout[target] = id; renderBuild(); });
  document.querySelector('.slots').addEventListener('change', event => { const slot = event.target.dataset.slotSelect; if (!slot) return; state.loadout[slot] = event.target.value; renderBuild(); });
  renderSlotOptions(); renderDatabase(); renderBuild();
}
