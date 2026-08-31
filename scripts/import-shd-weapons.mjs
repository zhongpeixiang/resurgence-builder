import fs from 'node:fs';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node scripts/import-shd-weapons.mjs <saved-page-source.html>');
const source = fs.readFileSync(sourcePath, 'utf8');
const start = source.indexOf('items:');
if (start < 0) throw new Error('Could not find items payload in the saved page source.');
const arrayStart = start + 'items:'.length;
let depth = 0, end = -1, quote = '', escaped = false;
for (let i = arrayStart; i < source.length; i += 1) {
  const char = source[i];
  if (quote) {
    if (escaped) escaped = false;
    else if (char === '\\') escaped = true;
    else if (char === quote) quote = '';
  } else if (char === '"' || char === "'") quote = char;
  else if (char === '[') depth += 1;
  else if (char === ']' && --depth === 0) { end = i + 1; break; }
}
if (end < 0) throw new Error('Could not isolate the items array.');
const sourceItems = Function(`return (${source.slice(arrayStart, end)})`)();
const groupNames = item => [...new Set(item.iconGroups.flatMap(group => group.items.map(entry => entry.name)))];
const catalog = sourceItems.map(item => {
  const [weaponClass, damageType] = item.kicker.split(' // ');
  return {
    id: item.id,
    name: item.name,
    type: 'Weapon',
    weaponClass,
    damageType,
    badges: item.headerBadges,
    facts: item.facts.map(fact => ({ label: fact.label, value: fact.value, note: fact.note ?? '', meters: fact.meters ?? [] })),
    talents: groupNames(item),
    source: 'SHD.build database/weapons page provided by authorized contributor'
  };
});
if (catalog.length !== 90 || new Set(catalog.map(item => item.id)).size !== 90) throw new Error(`Unexpected catalog shape: ${catalog.length} records.`);
const output = `// Generated from an authorized SHD.build weapons-page source. Do not edit by hand.\nexport const weaponCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
const outputPath = path.resolve('data/weapons.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${catalog.length} records to ${outputPath}`);
