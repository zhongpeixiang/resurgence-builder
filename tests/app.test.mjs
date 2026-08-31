import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, filterItems, calculateBuild } from '../app.js';

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
