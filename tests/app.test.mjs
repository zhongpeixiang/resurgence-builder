import test from 'node:test';
import assert from 'node:assert/strict';
import { filterItems, calculateBuild } from '../app.js';

const catalog = [
  { id: 'scar', name: 'ACR-E', type: 'Assault rifle', rarity: 'High-end', score: 78, tags: ['Crit', 'Rifle'] },
  { id: 'famas', name: 'FAMAS 2010', type: 'Assault rifle', rarity: 'High-end', score: 82, tags: ['RPM', 'Rifle'] },
  { id: 'm870', name: 'M870', type: 'Shotgun', rarity: 'Superior', score: 61, tags: ['Close range'] }
];

test('filterItems returns records matching type and text query', () => {
  assert.deepEqual(
    filterItems(catalog, { type: 'Assault rifle', query: 'famas' }).map(item => item.id),
    ['famas']
  );
});

test('calculateBuild totals equipped item scores and detects an incomplete loadout', () => {
  const result = calculateBuild(catalog, { primary: 'famas', secondary: 'm870', gear: '' });
  assert.equal(result.score, 143);
  assert.equal(result.complete, false);
});

test('calculateBuild is complete when every slot is filled', () => {
  const result = calculateBuild(catalog, { primary: 'famas', secondary: 'm870', gear: 'scar' });
  assert.equal(result.complete, true);
});
