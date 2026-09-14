import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, calculateWeaponDps, createBuildIssueUrl, databaseCatalog, filterItems, calculateBuild, getWeaponHandling, getWeaponTalentPools, itemsForSlot, weaponTalentPool } from '../app.js';
import { weaponCatalog } from '../data/weapons.js';
import { talentCatalog } from '../data/talents.js';
import { brandCatalog } from '../data/brands.js';
import { protocolCatalog } from '../data/os-protocols.js';
import { skillChipCatalog } from '../data/skill-chips.js';
import { specializationCatalog } from '../data/specializations.js';
import { DATA as builderData } from '../builder-data.js';

test('authorized SHD gear import preserves all 72 unique records', () => {
  assert.equal(catalog.length, 72);
  assert.equal(new Set(catalog.map(item => item.id)).size, 72);
  assert.ok(catalog.every(item => item.type === 'Gear' && item.slot && item.fact?.label && item.fact?.value));
});

test('filterItems returns records matching a gear slot and text query', () => {
  assert.deepEqual(
    filterItems(catalog, { slot: 'Backpack', query: 'demeter' }).map(item => item.name),
    ['Demeter Quick-Stash']
  );
});

test('calculateBuild fills the matching equipment slots without inventing a rating', () => {
  const backpack = catalog.find(item => item.name === 'Demeter Quick-Stash');
  const mask = catalog.find(item => item.slot === 'Mask');
  const result = calculateBuild(catalog, { Backpack: backpack.id, Mask: mask.id });
  assert.equal(result.complete, false);
  assert.deepEqual(result.equipped.map(item => item.id), [backpack.id, mask.id]);
  assert.equal('score' in result, false);
});

test('imported records retain source brands and available talents where supplied', () => {
  const item = catalog.find(entry => entry.name === 'Demeter Quick-Stash');
  assert.deepEqual(item.brands, ['Jackpot', 'Long-term Effect']);
  assert.ok(item.talents.includes('Assault Protection'));
});

test('authorized SHD weapon import preserves all 90 unique records and their facts', () => {
  assert.equal(weaponCatalog.length, 90);
  assert.equal(new Set(weaponCatalog.map(item => item.id)).size, 90);
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  assert.equal(warlord.weaponClass, 'AR');
  assert.equal(warlord.damageType, 'Blast');
  assert.equal(warlord.facts[0].value, '1,179–1,179');
  assert.ok(warlord.talents.length > 0);
});

test('weapon DPS uses sourced damage, RPM, magazine, and reload values', () => {
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  assert.deepEqual(calculateWeaponDps(warlord), { burst: '11,790', sustained: '6,431' });
});

test('weapon database talent pools group all sourced options by weapon talent slot', () => {
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  const pools = getWeaponTalentPools(warlord);

  assert.deepEqual(pools.map(pool => pool.slot), ['Weapon 1', 'Weapon 2']);
  assert.equal(pools.flatMap(pool => pool.talents).length, warlord.talents.length);
  assert.ok(pools.every(pool => pool.talents.every(talent => talent.slot === pool.slot && warlord.talents.includes(talent.name))));
});

test('weapon handling reads sourced accuracy and stability meters', () => {
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  assert.deepEqual(getWeaponHandling(warlord), { accuracy: 79, stability: 40 });
});

test('databaseCatalog combines all imported categories, with category filters', () => {
  assert.equal(databaseCatalog.length, 403);
  assert.equal(filterItems(databaseCatalog, { category: 'Specializations' }).length, 3);
  assert.equal(filterItems(databaseCatalog, { category: 'Weapons' }).length, 90);
  assert.equal(filterItems(databaseCatalog, { category: 'Talents' }).length, 120);
  assert.equal(filterItems(databaseCatalog, { category: 'Brands' }).length, 16);
  assert.equal(filterItems(databaseCatalog, { category: 'OS Protocols' }).length, 66);
  assert.equal(filterItems(databaseCatalog, { category: 'Skill Chips' }).length, 36);
});

test('authorized SHD talent import combines both pages into 120 unique records', () => {
  assert.equal(talentCatalog.length, 120);
  assert.equal(new Set(talentCatalog.map(item => item.id)).size, 120);
  const assault = talentCatalog.find(item => item.name === 'Assault Protection');
  assert.equal(assault.slot, 'Backpack');
  assert.match(assault.description, /Extra Health/);
});

test('authorized SHD brand import preserves all 16 brand-set bonuses', () => {
  assert.equal(brandCatalog.length, 16);
  const boom = brandCatalog.find(item => item.name === 'Boom-Shakalaka');
  assert.equal(boom.bonuses[0].label, '2 PIECES');
  assert.match(boom.bonuses[0].value, /Skill Cooldown Recovery/);
});

test('Resurgence Builds OS protocol import preserves all 66 unique source records and full stats', () => {
  assert.equal(protocolCatalog.length, 66);
  assert.equal(new Set(protocolCatalog.map(item => item.id)).size, 66);
  assert.deepEqual(protocolCatalog.reduce((counts, item) => ({ ...counts, [item.core]: (counts[item.core] ?? 0) + 1 }), {}), { Engineering: 28, Firepower: 25, Toughness: 13 });
  const explosiveCharge = protocolCatalog.find(item => item.name === 'Explosive Charge');
  assert.deepEqual(explosiveCharge.mainStat, { label: 'Engineering', value: '+22.50%' });
  assert.equal(explosiveCharge.cooldown, '5 seconds');
  assert.deepEqual(explosiveCharge.attributes, [{ label: 'Engineering', value: '+97' }, { label: 'Skill Damage', value: '+77' }, { label: 'Health', value: '+2,554' }]);
  assert.match(explosiveCharge.talent, /1600% Engineering/);
  assert.equal(explosiveCharge.source, 'https://resurgencebuilds.com/database/os-protocols/');
});

test('Resurgence Builds skill-mod combo import preserves sourced 2- and 3-piece bonuses for all 36 builder records', () => {
  assert.equal(skillChipCatalog.length, 36);
  assert.equal(new Set(skillChipCatalog.map(item => item.id)).size, 36);
  const adaptive = skillChipCatalog.find(item => item.name === 'Adaptive Armor');
  assert.match(adaptive.facts[0].value, /Phalanx Shield/);
  assert.equal(adaptive.facts.find(fact => fact.label === '2-PIECE BONUS').value, 'Skill Health+[4.0%~8.0%]');
  assert.match(adaptive.lines.find(line => line.label === '3-PIECE TALENT').value, /Weapon Critical Hit Damage/);
  const ammoRefill = skillChipCatalog.find(item => item.name === 'Ammo Refill');
  assert.match(ammoRefill.lines.find(line => line.label === '3-PIECE TALENT').value, /18% chance of recovering 4 ammo/);
  const fieldRepairs = skillChipCatalog.find(item => item.name === 'Field Repairs');
  assert.match(fieldRepairs.lines.find(line => line.label === '3-PIECE TALENT').value, /\+4% Rate of Fire/);
  assert.ok(skillChipCatalog.every(item => item.lines.find(line => line.label === '3-PIECE TALENT')?.value !== 'NOT CONFIGURED'));
  assert.ok(skillChipCatalog.every(item => item.source === 'https://resurgencebuilds.com/database/skill-mod-combos/'));
});

test('builder slot options come from imported database catalogs', () => {
  assert.equal(itemsForSlot('Specialization').length, 3);
  assert.equal(itemsForSlot('OS Protocol').length, 66);
  assert.equal(itemsForSlot('Primary Weapon').length, 90);
  assert.ok(itemsForSlot('Backpack').every(item => item.slot === 'Backpack'));
});

test('weapon talent pools only offer sourced talents compatible with the equipped weapon and talent slot', () => {
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  const primaryLoadout = { 'Primary Weapon': warlord.id };
  const firstPool = weaponTalentPool('Primary Weapon Talent 1', primaryLoadout);
  const secondPool = itemsForSlot('Primary Weapon Talent 2', primaryLoadout);

  assert.ok(firstPool.length > 0);
  assert.ok(firstPool.every(talent => talent.slot === 'Weapon 1' && warlord.talents.includes(talent.name)));
  assert.ok(secondPool.every(talent => talent.slot === 'Weapon 2' && warlord.talents.includes(talent.name)));
  assert.deepEqual(itemsForSlot('Primary Weapon Talent 1'), []);
});

test('authorized SHD specializations import preserves all three source records', () => {
  assert.equal(specializationCatalog.length, 3);
  const vanguard = specializationCatalog.find(item => item.name === 'Vanguard');
  assert.match(vanguard.focusPaths, /Commando/);
  assert.match(vanguard.abilities, /Tactical Link/);
});

test('createBuildIssueUrl serializes an equipped build into a GitHub Issue draft', () => {
  const url = new URL(createBuildIssueUrl([{ name: 'Warlord', type: 'Weapon' }, { name: 'Demeter Quick-Stash', type: 'Gear' }]));
  assert.equal(url.origin, 'https://github.com');
  assert.match(url.searchParams.get('title'), /Resurgence build/);
  assert.match(url.searchParams.get('body'), /Warlord/);
  assert.match(url.searchParams.get('labels'), /build/);
});

test('full Build Lab adapter derives every picker source from the local catalog', () => {
  assert.equal(builderData.gear.length, 72);
  assert.equal(builderData.gearSets.length, 16);
  assert.equal(builderData.standardWeapons.length + builderData.exoticWeapons.length, 90);
  assert.equal(builderData.osProtocols.length, 66);
  assert.equal(builderData.skillModCombos.length, 36);
  assert.deepEqual(Object.keys(builderData.specSubclasses).sort(), ['Bulwark', 'Field Medic', 'Vanguard']);
  assert.ok(builderData.gear.every(item => item.slot && item.brands.length));
  assert.ok(builderData.standardWeapons.every(item => item.talents.length));
});
