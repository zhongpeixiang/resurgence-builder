import { gearCatalog } from './data/gear.js';
import { weaponCatalog } from './data/weapons.js';
import { talentCatalog } from './data/talents.js';
import { brandCatalog } from './data/brands.js';
import { protocolCatalog } from './data/os-protocols.js';
import { skillChipCatalog } from './data/skill-chips.js';
import { specializationCatalog } from './data/specializations.js';

export const catalog = gearCatalog;
export const databaseCatalog = [...gearCatalog, ...weaponCatalog, ...talentCatalog, ...brandCatalog, ...protocolCatalog, ...skillChipCatalog, ...specializationCatalog];
export const weaponTalentSlotConfig = {
  'Primary Weapon Talent 1': { weaponSlot: 'Primary Weapon', talentSlot: 'Weapon 1' },
  'Primary Weapon Talent 2': { weaponSlot: 'Primary Weapon', talentSlot: 'Weapon 2' },
  'Secondary Weapon Talent 1': { weaponSlot: 'Secondary Weapon', talentSlot: 'Weapon 1' },
  'Secondary Weapon Talent 2': { weaponSlot: 'Secondary Weapon', talentSlot: 'Weapon 2' }
};
export const slots = ['Specialization', 'OS Protocol', 'Backpack', 'Body Armor', 'Gloves', 'Holster', 'Knee Pads', 'Mask', 'Primary Weapon', 'Primary Weapon Talent 1', 'Primary Weapon Talent 2', 'Secondary Weapon', 'Secondary Weapon Talent 1', 'Secondary Weapon Talent 2'];

const categoryFor = item => item.type === 'Gear' ? 'Gear' : item.type === 'Weapon' ? 'Weapons' : item.type === 'Talent' ? 'Talents' : item.type === 'Brand' ? 'Brands' : item.type === 'OS Protocol' ? 'OS Protocols' : item.type === 'Skill Chip' ? 'Skill Chips' : 'Specializations';
export function filterItems(items, { category = 'All', slot = 'All', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => {
    const group = item.slot ?? item.weaponClass ?? item.core ?? item.type;
    const values = [item.name, item.kicker, item.description, item.secondaryDescription, item.slot, item.weaponClass, item.core, item.rarity, item.talent, ...(item.brands ?? []), ...(item.talents ?? []), ...(item.badges ?? []), ...(item.facts ?? []).flatMap(x => [x.label, x.value]), ...(item.attributes ?? []).flatMap(x => [x.label, x.value]), ...(item.bonuses ?? []).flatMap(x => [x.label, x.value])];
    return (category === 'All' || categoryFor(item) === category) && (slot === 'All' || group === slot) && (!needle || values.join(' ').toLowerCase().includes(needle));
  });
}
export function calculateBuild(items, loadout) { const equipped = slots.map(slot => items.find(item => item.id === loadout[slot])).filter(Boolean); return { equipped, complete: slots.every(slot => Boolean(loadout[slot])) }; }
export function getWeaponTalentPools(weapon) { return ['Weapon 1', 'Weapon 2'].map(slot => ({ slot, talents: talentCatalog.filter(talent => talent.slot === slot && weapon.talents.includes(talent.name)) })); }
export function weaponTalentPool(slot, loadout = {}) { const config = weaponTalentSlotConfig[slot]; const weapon = config && weaponCatalog.find(item => item.id === loadout[config.weaponSlot]); return weapon ? getWeaponTalentPools(weapon).find(pool => pool.slot === config.talentSlot).talents : []; }
export function itemsForSlot(slot, loadout = {}) { if (weaponTalentSlotConfig[slot]) return weaponTalentPool(slot, loadout); if (slot === 'Primary Weapon' || slot === 'Secondary Weapon') return weaponCatalog; if (slot === 'Specialization') return specializationCatalog; if (slot === 'OS Protocol') return protocolCatalog; return gearCatalog.filter(item => item.slot === slot); }
export function calculateWeaponDps(weapon) {
  const damage = weapon.facts.find(fact => fact.label === 'DAMAGE')?.value ?? ''; const rateMag = weapon.facts.find(fact => fact.label === 'RATE / MAG')?.value ?? ''; const reload = weapon.facts.find(fact => fact.label === 'RELOAD')?.value ?? '';
  const [low, high] = damage.replaceAll(',', '').split(/[–-]/).map(Number); const rpm = Number(rateMag.match(/(\d+)\s*RPM/)?.[1]); const magazine = Number(rateMag.match(/(\d+)\s*MAG/)?.[1]); const reloadSeconds = Number(reload.match(/[\d.]+/)?.[0]);
  if (![low, high, rpm, magazine, reloadSeconds].every(Number.isFinite)) return { burst: '—', sustained: '—' };
  const rps = rpm / 60; const range = fn => [fn(low), fn(high)].map(x => Math.round(x).toLocaleString('en-US')).join('–').replace(/^(\d[\d,]*)–\1$/, '$1');
  return { burst: range(d => d * rps), sustained: range(d => (d * magazine) / ((magazine / rps) + reloadSeconds)) };
}
export function getWeaponHandling(weapon) { const meters = weapon.facts.find(fact => fact.label === 'HANDLING')?.meters ?? []; return { accuracy: meters.find(m => m.label === 'ACCURACY')?.value ?? 0, stability: meters.find(m => m.label === 'STABILITY')?.value ?? 0 }; }
export function createBuildIssueUrl(equipped) { const body = ['## Resurgence build', '', ...equipped.map(item => `- **${item.type}:** ${item.name}`), '', '_Published from the Resurgence Build Lab._'].join('\n'); return `https://github.com/zhongpeixiang/resurgence-builder/issues/new?${new URLSearchParams({ title: `Resurgence build — ${equipped.length} equipped`, body, labels: 'build' })}`; }
