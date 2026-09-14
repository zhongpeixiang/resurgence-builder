import { gearCatalog } from './data/gear.js';
import { weaponCatalog } from './data/weapons.js';
import { talentCatalog } from './data/talents.js';
import { brandCatalog } from './data/brands.js';
import { protocolCatalog } from './data/os-protocols.js';
import { skillChipCatalog } from './data/skill-chips.js';
import { specializationCatalog } from './data/specializations.js';

const specializationForChip = chip => chip.facts.find(fact => fact.label === 'SPECIALIZATION ABILITY')?.value.split('·').at(-1)?.trim() ?? '';
const attributes = [...new Set([...protocolCatalog.flatMap(item => item.attributes.map(attribute => attribute.label)), 'Weapon Damage', 'Weapon Critical Hit Chance', 'Weapon Critical Hit Damage', 'Armor', 'Max Health', 'Damage Reduction', 'Received Healing', 'Skill Duration', 'Skill Intensity', 'Skill Radius', 'Skill Health', 'Skill Multi-Shot Chance'])];

export const DATA = {
  // The builder consumes only records from the project’s committed data modules.
  gearSets: brandCatalog.map(brand => ({ id: brand.id, name: brand.name, bonus2: brand.bonuses.find(x => x.label === '2 PIECES')?.value ?? '', bonus3: brand.bonuses.find(x => x.label === '3 PIECES')?.value ?? '', bonus4: brand.bonuses.find(x => x.label === '4 PIECES')?.value ?? '' })),
  gear: gearCatalog,
  weaponTalents: talentCatalog.filter(talent => talent.slot === 'Weapon 1' || talent.slot === 'Weapon 2'),
  bodyArmorTalents: talentCatalog.filter(talent => talent.slot === 'Body Armor'),
  backpackTalents: talentCatalog.filter(talent => talent.slot === 'Backpack'),
  osProtocols: protocolCatalog.map(item => ({ id: item.id, name: item.name, specialization: item.core, rarity: item.rarity, mainStat: item.mainStat?.label ?? '', mainValue: item.mainStat?.value ?? '', attr1: item.attributes[0]?.label ?? '', val1: item.attributes[0]?.value ?? '', attr2: item.attributes[1]?.label ?? '', val2: item.attributes[1]?.value ?? '', attr3: item.attributes[2]?.label ?? '', val3: item.attributes[2]?.value ?? '', talentDescription: item.talent ?? '', cooldown: item.cooldown ?? '' })),
  skillModCombos: skillChipCatalog.map(item => ({ id: item.id, name: item.name, specialization: specializationForChip(item), bonus2: item.facts.find(x => x.label === '2-PIECE BONUS')?.value ?? '', bonus3: item.lines.find(x => x.label === '3-PIECE TALENT')?.value ?? '' })).filter(item => item.specialization),
  standardWeapons: weaponCatalog.filter(item => !item.badges.includes('EXOTIC')).map(item => ({ id: item.id, name: item.name, type: item.weaponClass, rpm: item.facts.find(x => x.label === 'RATE / MAG')?.value.match(/\d+(?= RPM)/)?.[0] ?? '—', mag: item.facts.find(x => x.label === 'RATE / MAG')?.value.match(/\d+(?= MAG)/)?.[0] ?? '—', dmgType: item.damageType, talents: item.talents })),
  exoticWeapons: weaponCatalog.filter(item => item.badges.includes('EXOTIC')).map(item => ({ id: item.id, name: item.name, type: item.weaponClass, rpm: item.facts.find(x => x.label === 'RATE / MAG')?.value.match(/\d+(?= RPM)/)?.[0] ?? '—', mag: item.facts.find(x => x.label === 'RATE / MAG')?.value.match(/\d+(?= MAG)/)?.[0] ?? '—', talentName: item.talents[0] ?? 'Exotic Talent', talentDescription: item.talents.join(' · '), damage: item.facts.find(x => x.label === 'DAMAGE')?.value ?? '—', talents: item.talents })),
  templates: [],
  allAttributes: attributes,
  specSubclasses: Object.fromEntries(specializationCatalog.map(item => [item.name, item.focusPaths.split(', ').filter(Boolean)]))
};
