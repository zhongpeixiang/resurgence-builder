import fs from 'node:fs';
import path from 'node:path';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node scripts/import-shd-os-protocols.mjs <page-source.html>');
const source = fs.readFileSync(sourcePath, 'utf8');
const start = source.indexOf('items:');
if (start < 0) throw new Error('Could not find items payload.');
const arrayStart = start + 'items:'.length;
let depth = 0, end = -1, quote = '', escaped = false;
for (let i = arrayStart; i < source.length; i += 1) {
  const char = source[i];
  if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; }
  else if (char === '"' || char === "'") quote = char;
  else if (char === '[') depth += 1;
  else if (char === ']' && --depth === 0) { end = i + 1; break; }
}
if (end < 0) throw new Error('Could not isolate items array.');
const sourceItems = Function(`return (${source.slice(arrayStart, end)})`)();
const catalog = sourceItems.map(item => ({
  id: item.id,
  name: item.name,
  type: 'OS Protocol',
  core: item.kicker.split(' // ')[0],
  description: item.description ?? '',
  secondaryDescription: item.secondaryDescription ?? '',
  attributes: item.afterLines ?? [],
  source: 'SHD.build database/os-protocols page provided by authorized contributor'
}));
if (catalog.length !== 17 || new Set(catalog.map(item => item.id)).size !== 17) throw new Error(`Unexpected catalog shape: ${catalog.length} records.`);
const outputPath = path.resolve('data/os-protocols.js');
fs.writeFileSync(outputPath, `// Generated from an authorized SHD.build OS Protocols-page source. Do not edit by hand.\nexport const protocolCatalog = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(`Wrote ${catalog.length} records to ${outputPath}`);
