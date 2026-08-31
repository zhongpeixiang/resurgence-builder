import fs from 'node:fs';
const source = fs.readFileSync(process.argv[2], 'utf8');
const start = source.indexOf('items:') + 6;
if (start < 6) throw new Error('Could not find items payload.');
let depth = 0, end = -1, quote = '', escaped = false;
for (let i = start; i < source.length; i += 1) { const char = source[i]; if (quote) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === quote) quote = ''; } else if (char === '"' || char === "'") quote = char; else if (char === '[') depth += 1; else if (char === ']' && --depth === 0) { end = i + 1; break; } }
const records = Function(`return (${source.slice(start, end)})`)().map(item => ({ id:item.id, name:item.name, type:'Skill Chip', kicker:item.kicker, facts:item.facts ?? [], description:item.description ?? '', attributes:item.afterLines ?? [], source:'SHD.build database/skill-chips page provided by authorized contributor' }));
if (records.length !== 36 || new Set(records.map(item => item.id)).size !== 36) throw new Error(`Unexpected catalog shape: ${records.length}`);
fs.writeFileSync('data/skill-chips.js', `// Generated from an authorized SHD.build Skill Chips-page source. Do not edit by hand.\nexport const skillChipCatalog = ${JSON.stringify(records, null, 2)};\n`);
console.log(`Wrote ${records.length} records to data/skill-chips.js`);
