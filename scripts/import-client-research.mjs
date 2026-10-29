import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const SOURCE_HASHES = {
  'native-analysis/mechanics_enums.json': 'b86defce944f091e70797152fbda1319105d30daf5ee0269f2f20b510cbac123',
  'oodle-analysis/mechanics-ui-text-unique.json': '751a2c0a8b4f937bbbab10a2e5dbbdfa0c9ecb16d86edbbe43d58c7dd87e485b',
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function normalizeEnumRecords(records) {
  const groups = new Map();
  const identifiers = new Set();
  for (const row of records) {
    if (typeof row.enum_type !== 'string' || !row.enum_type || typeof row.member !== 'string' || !row.member || row.name !== `${row.enum_type}::${row.member}`) throw new Error('Malformed enum identifier');
    if (identifiers.has(row.name)) throw new Error(`Duplicate enum identifier: ${row.name}`);
    identifiers.add(row.name);
    if (!Number.isSafeInteger(row.enum_identifier)) throw new Error(`Invalid enum ID: ${row.name}`);
    const valueOffset = /^0x[0-9a-f]+$/i.test(row.value_file_offset_hex ?? '') ? Number.parseInt(row.value_file_offset_hex, 16) : NaN;
    if (![row.name_file_offset_dec, row.record_file_offset_dec, valueOffset].every(value => Number.isSafeInteger(value) && value >= 0) || valueOffset !== row.record_file_offset_dec + 8) throw new Error(`Invalid evidence offset: ${row.name}`);
    if (!groups.has(row.enum_type)) groups.set(row.enum_type, []);
    groups.get(row.enum_type).push({
      identifier: row.name,
      enumId: row.enum_identifier,
      evidence: {
        nameByteOffset: row.name_file_offset_dec,
        recordByteOffset: row.record_file_offset_dec,
        valueByteOffset: Number.parseInt(row.value_file_offset_hex, 16),
      },
    });
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([enumType, members]) => ({
    enumType,
    evidenceKind: 'native-reflection-enum',
    members: members.sort((a, b) => a.enumId - b.enumId || a.identifier.localeCompare(b.identifier, 'en')),
  }));
}

const mechanicsSelection = [
  ['armory-proficiency', 'Armory proficiency and blueprint power tiers', 'dcfb71330ae7d8938111cc6c88f6c6951a6c789208d625af6e6002f7440e414f'],
  ['blueprint-capabilities', 'Unlocked blueprint capabilities', '522290875a9170ac0d894f67a892ac0a5d064b674aeff1f7ad6bbcd590f523b8'],
  ['crafting-proficiency', 'Crafting proficiency and equipment quality', '5cc992399e508266b9368e48c32df02d60d2311f0f9b244a9bdfbcc44cebf7d5'],
  ['specialization-xp', 'Separate specialization and character XP', '979ef4045cf2b3fd689eb49703775ed9ee342232b3179501c667b598a67e37d4'],
  ['armor-weaknesses', 'Armor weaknesses and damage types', '4a67449f273b3d8965bc5a49cf80b15d990782c269a884a37d1d0846d4b34f62'],
];

export function selectMechanicsText(records) {
  return mechanicsSelection.map(([id, title, hash]) => {
    const matches = records.filter(record => record.text_sha256 === hash);
    if (matches.length > 1) throw new Error(`Ambiguous mechanics text: ${id}`);
    const [row] = matches;
    if (!row || sha256(row.text) !== hash) throw new Error(`Missing or altered mechanics text: ${id}`);
    if (!Array.isArray(row.sources) || !row.sources.length || row.sources.some(source =>
      ![source.entry_number, source.header_offset, source.decoded_byte_offset].every(offset => Number.isSafeInteger(offset) && offset >= 0)
      || !Array.isArray(source.ui_modules) || source.ui_modules.some(module => typeof module !== 'string')
    )) throw new Error(`Invalid mechanics evidence: ${id}`);
    return {
      id, title, exactText: row.text, textSha256: hash,
      claimStatus: 'cooked-ui-default-unverified',
      runtimeEligible: false,
      evidence: row.sources.map(source => ({
        pak: 'pakchunk0-Android_ASTC.pak',
        entryNumber: source.entry_number,
        headerByteOffset: source.header_offset,
        decodedByteOffset: source.decoded_byte_offset,
        uiModules: source.ui_modules,
      })),
    };
  });
}

export function importResearch(sourceDirectory) {
  const inputs = Object.fromEntries(Object.entries(SOURCE_HASHES).map(([name, hash]) => {
    const bytes = fs.readFileSync(path.join(sourceDirectory, name));
    if (sha256(bytes) !== hash) throw new Error(`Source hash mismatch: ${name}`);
    return [name, JSON.parse(bytes)];
  }));
  return {
    schemaVersion: 1,
    clientVersion: '1.66724.0',
    runtimeEligible: false,
    source: {
      downloadPage: 'https://the-division-resurgence.en.uptodown.com/android/download',
      packageName: 'com.ubisoft.the.division.mobile.combat.shooting.open.world.rpg',
      xapkSha256: '8e5b915291d9a821a6986f3c43d97510b15eb66d440c6b2876f303766c514e66',
      nativeLibrary: 'config.arm64_v8a.apk!lib/arm64-v8a/libUE4.so',
      nativeLibrarySha256: '1627a1c61045560cb686c9032a0144a28530d0192c793d019d0198c8c148e70d',
      extractionFiles: SOURCE_HASHES,
    },
    limitations: [
      'Research only: enum IDs are lookup identifiers, not numerical balance values, coefficients, caps, rolls or formulas.',
      'Static reflection can contain sentinel, unused, legacy, developer and NPC-only entries; current gameplay usage is not verified.',
      'Do not use this dataset in builder calculations or replace existing sourced catalogs with it.',
      'Encrypted asset indexes and payloads, post-install data and server-side hotfixes remain outside recovered coverage.',
      'Cooked UI prose is authoring/default text, may be stale or test content, and is not authoritative live balance data.',
      'Embedded Logic/UI module references are not recovered Lua source or implementations.',
    ],
    enumTypes: normalizeEnumRecords(inputs['native-analysis/mechanics_enums.json']),
    mechanics: selectMechanicsText(inputs['oodle-analysis/mechanics-ui-text-unique.json']),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2) throw new Error('Usage: node scripts/import-client-research.mjs <extraction-directory> [output.json]');
  const output = args[1] ? path.resolve(args[1]) : path.join(root, 'data/research/client-1.66724.0.json');
  const data = importResearch(path.resolve(args[0]));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${data.enumTypes.reduce((count, type) => count + type.members.length, 0)} enum records to ${output}`);
}
