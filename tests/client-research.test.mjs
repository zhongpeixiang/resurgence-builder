import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { normalizeEnumRecords, selectMechanicsText } from '../scripts/import-client-research.mjs';

const datasetUrl = new URL('../data/research/client-1.66724.0.json', import.meta.url);
const enumFixture = {
  enum_type: 'ERes_EnmResActorAttrType', member: 'RES_ACTOR_BASE_ATTR_VERTIAL_STABILIZE_DEGREE',
  name: 'ERes_EnmResActorAttrType::RES_ACTOR_BASE_ATTR_VERTIAL_STABILIZE_DEGREE',
  enum_identifier: 5, name_file_offset_dec: 39215097, record_file_offset_dec: 164553656,
  value_file_offset_hex: '0x9cee3c0',
};

test('enum import fails closed on duplicate identifiers and malformed evidence without repairing source tokens', () => {
  assert.throws(() => normalizeEnumRecords([enumFixture, enumFixture]), /duplicate/i);
  assert.throws(() => normalizeEnumRecords([{ ...enumFixture, name: 'repaired spelling' }]), /identifier/i);
  assert.throws(() => normalizeEnumRecords([{ ...enumFixture, name_file_offset_dec: -1 }]), /offset/i);
  assert.throws(() => normalizeEnumRecords([{ ...enumFixture, value_file_offset_hex: '0x9cee3c0junk' }]), /offset/i);
  assert.throws(() => normalizeEnumRecords([{ ...enumFixture, enum_identifier: Number.MAX_SAFE_INTEGER + 1 }]), /enum ID/i);
  const [group] = normalizeEnumRecords([enumFixture]);
  assert.equal(group.members[0].identifier, enumFixture.name);
  assert.equal(group.members[0].enumId, 5);
});

test('versioned client research preserves useful schemas without claiming balance values', () => {
  assert.ok(fs.existsSync(datasetUrl), 'versioned client research dataset is missing');
  const data = JSON.parse(fs.readFileSync(datasetUrl, 'utf8'));
  assert.equal(data.clientVersion, '1.66724.0');
  assert.equal(data.runtimeEligible, false);
  assert.equal(data.source.xapkSha256, '8e5b915291d9a821a6986f3c43d97510b15eb66d440c6b2876f303766c514e66');
  assert.equal(data.enumTypes.length, 68);
  assert.equal(data.enumTypes.flatMap(type => type.members).length, 1337);
  const actor = data.enumTypes.find(type => type.enumType === 'ERes_EnmResActorAttrType');
  assert.equal(actor.members.length, 316);
  assert.equal(new Set(actor.members.map(member => member.identifier)).size, 316);
  assert.ok(actor.members.every(member => Number.isSafeInteger(member.enumId) && Number.isSafeInteger(member.evidence.nameByteOffset)));
  assert.match(data.limitations.join(' '), /not.*balance/i);
});

test('curated mechanics keep exact useful UI prose, offsets and an explicit non-authoritative status', () => {
  const data = JSON.parse(fs.readFileSync(datasetUrl, 'utf8'));
  assert.ok(Array.isArray(data.mechanics), 'curated mechanics are missing');
  assert.deepEqual(data.mechanics.map(row => row.id), ['armory-proficiency', 'blueprint-capabilities', 'crafting-proficiency', 'specialization-xp', 'armor-weaknesses']);
  for (const row of data.mechanics) {
    assert.equal(row.claimStatus, 'cooked-ui-default-unverified');
    assert.equal(row.runtimeEligible, false);
    assert.equal(createHash('sha256').update(row.exactText).digest('hex'), row.textSha256);
    assert.ok(row.evidence.length > 0);
    assert.ok(row.evidence.every(source => source.pak === 'pakchunk0-Android_ASTC.pak' && Number.isSafeInteger(source.headerByteOffset) && Number.isSafeInteger(source.decodedByteOffset)));
  }
  assert.match(data.mechanics.find(row => row.id === 'crafting-proficiency').exactText, /higher the crafting proficiency/);
  assert.match(data.mechanics.find(row => row.id === 'armor-weaknesses').exactText, /periodically refresh/);
  assert.doesNotMatch(JSON.stringify(data), /\/root\/|stockings teen|Current weapon drawing tier/);
});

test('mechanics selection rejects ambiguous, changed, missing or malformed source evidence', () => {
  const data = JSON.parse(fs.readFileSync(datasetUrl, 'utf8'));
  const raw = data.mechanics.map(row => ({
    text_sha256: row.textSha256, text: row.exactText,
    sources: row.evidence.map(source => ({ entry_number: source.entryNumber, header_offset: source.headerByteOffset, decoded_byte_offset: source.decodedByteOffset, ui_modules: source.uiModules })),
  }));
  assert.throws(() => selectMechanicsText([...raw, raw[0]]), /ambiguous/i);
  assert.throws(() => selectMechanicsText(raw.slice(1)), /missing/i);
  assert.throws(() => selectMechanicsText(raw.map((row, i) => i ? row : { ...row, text: 'changed' })), /altered/i);
  assert.throws(() => selectMechanicsText(raw.map((row, i) => i ? row : { ...row, sources: [] })), /evidence/i);
  const invalid = structuredClone(raw);
  invalid[0].sources[0].header_offset = -1;
  assert.throws(() => selectMechanicsText(invalid), /evidence/i);
  assert.deepEqual(selectMechanicsText(raw), data.mechanics);
});

test('research data remains outside the production database and builder import graph', () => {
  const queue = ['app.js', 'database.js', 'builder-data.js', 'builder-engine.js'].map(file => new URL(`../${file}`, import.meta.url));
  const visited = new Set();
  while (queue.length) {
    const url = queue.pop();
    if (visited.has(url.href)) continue;
    visited.add(url.href);
    assert.doesNotMatch(url.pathname, /\/data\/research\//);
    const source = fs.readFileSync(url, 'utf8');
    const specifiers = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const specifier of specifiers.filter(name => name.startsWith('.'))) queue.push(new URL(specifier, url));
    assert.doesNotMatch(source, /client-1\.66724\.0\.json/);
  }
});
