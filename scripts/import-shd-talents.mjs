import fs from 'node:fs';
import path from 'node:path';

const sourcePaths = process.argv.slice(2);
if (sourcePaths.length !== 2) throw new Error('Usage: node scripts/import-shd-talents.mjs <page-1.html> <page-2.html>');
function extractItems(sourcePath) {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const start = source.indexOf('items:');
  if (start < 0) throw new Error(`Could not find items payload in ${sourcePath}.`);
  const arrayStart = start + 'items:'.length;
  let depth = 0, end = -1, quote = '', escaped = false;
  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i];
    if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === '[') depth += 1;
    else if (char === ']' && --depth === 0) { end = i + 1; break; }
  }
  if (end < 0) throw new Error(`Could not isolate items in ${sourcePath}.`);
  return Function(`return (${source.slice(arrayStart, end)})`)();
}
const slotFor = kicker => kicker.replace(/\s+TALENT$/i, '').replace(/^WEAPON\s+(\d)$/i, 'Weapon $1').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
const sourceItems = sourcePaths.flatMap(extractItems);
const catalog = sourceItems.map(item => ({
  id: item.id,
  name: item.name,
  type: 'Talent',
  kicker: item.kicker,
  slot: slotFor(item.kicker),
  description: item.description ?? '',
  secondaryDescription: item.secondaryDescription ?? '',
  facts: item.facts ?? [],
  attributes: item.afterLines ?? [],
  source: 'SHD.build database/talents pages provided by authorized contributor'
}));
if (catalog.length !== 120 || new Set(catalog.map(item => item.id)).size !== 120) throw new Error(`Unexpected catalog shape: ${catalog.length} records.`);
const output = `// Generated from authorized SHD.build talent-page sources. Do not edit by hand.\nexport const talentCatalog = ${JSON.stringify(catalog, null, 2)};\n`;
const outputPath = path.resolve('data/talents.js');
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${catalog.length} records to ${outputPath}`);
