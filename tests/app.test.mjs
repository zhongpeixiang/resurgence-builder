import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, databaseCatalog, filterItems, calculateBuild } from '../app.js';
import { weaponCatalog } from '../data/weapons.js';
import { talentCatalog } from '../data/talents.js';

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

test('databaseCatalog combines all imported categories, with category filters', () => {
  assert.equal(databaseCatalog.length, 282);
  assert.equal(filterItems(databaseCatalog, { category: 'Weapons' }).length, 90);
  assert.equal(filterItems(databaseCatalog, { category: 'Talents' }).length, 120);
});

test('authorized SHD talent import combines both pages into 120 unique records', () => {
  assert.equal(talentCatalog.length, 120);
  assert.equal(new Set(talentCatalog.map(item => item.id)).size, 120);
  const assault = talentCatalog.find(item => item.name === 'Assault Protection');
  assert.equal(assault.slot, 'Backpack');
  assert.match(assault.description, /Extra Health/);
});
