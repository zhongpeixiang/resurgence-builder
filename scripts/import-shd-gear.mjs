import fs from 'node:fs';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node scripts/import-shd-gear.mjs <saved-page-source.html>');
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
const groupNames = (item, label) => (item.iconGroups.find(group => group.label === label)?.items ?? []).map(entry => entry.name);
const catalog = sourceItems.map(item => {
  const [slot, tier] = item.kicker.split(' // ');
  const fact = item.facts[0] ?? { label: '—', value: '—', note: '' };
  return {
    id: item.id,
    name: item.name,
    type: 'Gear',
    slot,
    tier,
    modSlots: item.headerBadges,
    fact: { label: fact.label, value: fact.value, note: fact.note ?? '' },
    brands: groupNames(item, 'BRAND OPTIONS'),
    talents: groupNames(item, 'AVAILABLE TALENTS'),
    source: 'SHD.build database/gear page provided by authorized contributor'
  };
});
if (catalog.length !== 72 || new Set(catalog.map(item => item.id)).size !== 72) throw new Error(`Unexpected catalog shape: ${catalog.length} records.`);
const output = `// Generated from an authorized SHD.build gear-page source. Do not edit by hand.\nexport const gearCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
const outputPath = path.resolve('data/gear.js');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${catalog.length} records to ${outputPath}`);
