import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, calculateWeaponDps, createBuildIssueUrl, databaseCatalog, filterItems, calculateBuild, getWeaponHandling, itemsForSlot } from '../app.js';
import { weaponCatalog } from '../data/weapons.js';
import { talentCatalog } from '../data/talents.js';
import { brandCatalog } from '../data/brands.js';
import { protocolCatalog } from '../data/os-protocols.js';
import { skillChipCatalog } from '../data/skill-chips.js';
import { specializationCatalog } from '../data/specializations.js';

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

test('weapon handling reads sourced accuracy and stability meters', () => {
  const warlord = weaponCatalog.find(item => item.name === 'Warlord');
  assert.deepEqual(getWeaponHandling(warlord), { accuracy: 79, stability: 40 });
});

test('databaseCatalog combines all imported categories, with category filters', () => {
  assert.equal(databaseCatalog.length, 354);
  assert.equal(filterItems(databaseCatalog, { category: 'Specializations' }).length, 3);
  assert.equal(filterItems(databaseCatalog, { category: 'Weapons' }).length, 90);
  assert.equal(filterItems(databaseCatalog, { category: 'Talents' }).length, 120);
  assert.equal(filterItems(databaseCatalog, { category: 'Brands' }).length, 16);
  assert.equal(filterItems(databaseCatalog, { category: 'OS Protocols' }).length, 17);
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

test('authorized SHD OS protocol import preserves all 17 records', () => {
  assert.equal(protocolCatalog.length, 17);
  const collateral = protocolCatalog.find(item => item.name === 'Collateral Damage');
  assert.equal(collateral.core, 'Engineering');
  assert.match(collateral.description, /3000% Engineering/);
});

test('authorized SHD skill-chip import preserves all 36 records', () => {
  assert.equal(skillChipCatalog.length, 36);
  const adaptive = skillChipCatalog.find(item => item.name === 'Adaptive Armor');
  assert.match(adaptive.facts[0].value, /Phalanx Shield/);
  assert.deepEqual(adaptive.badges, ['SUPERIOR', 'HIGH-END']);
  assert.equal(adaptive.lines[0].label, '3-PIECE TALENT');
});

test('builder slot options come from imported database catalogs', () => {
  assert.equal(itemsForSlot('Specialization').length, 3);
  assert.equal(itemsForSlot('OS Protocol').length, 17);
  assert.equal(itemsForSlot('Primary Weapon').length, 90);
  assert.ok(itemsForSlot('Backpack').every(item => item.slot === 'Backpack'));
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
  assert.match(url.searchParams.get('title'), /Fieldkit build/);
  assert.match(url.searchParams.get('body'), /Warlord/);
  assert.match(url.searchParams.get('labels'), /build/);
});
