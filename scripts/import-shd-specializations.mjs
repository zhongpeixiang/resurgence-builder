import fs from 'node:fs';
const source = fs.readFileSync(process.argv[2], 'utf8');
const start = source.indexOf('items:') + 6;
if (start < 6) throw new Error('Could not find items payload.');
let depth = 0, end = -1, quote = '', escaped = false;
for (let i = start; i < source.length; i += 1) { const char = source[i]; if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; } else if (char === '"' || char === "'") quote = char; else if (char === '[') depth += 1; else if (char === ']' && --depth === 0) { end = i + 1; break; } }
const records = Function(`return (${source.slice(start, end)})`)().map(item => ({
  id: item.id, name: item.name, type: 'Specialization', kicker: item.kicker, iconUrl: item.iconUrl ?? '', facts: item.facts ?? [], lines: item.lines ?? [], description: item.description ?? '',
  focusPaths: item.lines?.find(line => line.label === 'FOCUS PATHS')?.value ?? '',
  abilities: item.lines?.find(line => line.label === 'ABILITIES')?.value ?? '',
  source: 'SHD.build database/specializations page provided by authorized contributor'
}));
if (records.length !== 3 || new Set(records.map(item => item.id)).size !== 3) throw new Error(`Unexpected catalog shape: ${records.length}`);
fs.writeFileSync('data/specializations.js', `// Generated from an authorized SHD.build Specializations-page source. Do not edit by hand.\nexport const specializationCatalog = ${JSON.stringify(records, null, 2)};\n`);
console.log(`Wrote ${records.length} records to data/specializations.js`);
