import fs from 'node:fs';
import { skillChipCatalog } from '../data/skill-chips.js';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: node scripts/import-resurgence-skill-mod-combos.mjs <source-html>');
const source = fs.readFileSync(sourcePath, 'utf8');
const decodeHtml = value => value
  .replace(/<[^>]+>/g, '')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replace(/\s+/g, ' ')
  .trim();

const cards = [...source.matchAll(/<a href="\/database\/skill-mod-combos\/([^/]+)\/"[^>]*data-spec="([^"]+)"[^>]*>\s*<article[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<p class="bonus-text">([\s\S]*?)<\/p>[\s\S]*?<p class="bonus-text">([\s\S]*?)<\/p>[\s\S]*?<\/article>\s*<\/a>/g)]
  .map(match => ({
    slug: match[1],
    specialization: decodeHtml(match[2]),
    name: decodeHtml(match[3]),
    twoPieceBonus: decodeHtml(match[4]),
    threePieceBonus: decodeHtml(match[5])
  }));

if (cards.length !== 90 || new Set(cards.map(card => card.slug)).size !== 90) {
  throw new Error(`Unexpected source catalog shape: ${cards.length} records`);
}

const byName = new Map(cards.map(card => [card.name, card]));
const nameCorrections = new Map([['Provacateur', 'Provocateur']]);
const records = skillChipCatalog.map(item => {
  const sourceName = nameCorrections.get(item.name) ?? item.name;
  const combo = byName.get(sourceName);
  if (!combo) throw new Error(`No Resurgence Builds combo found for ${item.name}`);
  const facts = item.facts.map(fact => fact.label === '2-PIECE BONUS'
    ? { ...fact, value: combo.twoPieceBonus }
    : fact);
  const lines = item.lines.map(line => line.label === '3-PIECE TALENT'
    ? { ...line, value: combo.threePieceBonus }
    : line);
  return {
    ...item,
    name: combo.name,
    facts,
    lines,
    source: 'https://resurgencebuilds.com/database/skill-mod-combos/'
  };
});

if (records.length !== 36 || new Set(records.map(item => item.id)).size !== 36) {
  throw new Error(`Unexpected target catalog shape: ${records.length} records`);
}
if (records.some(item => item.lines.find(line => line.label === '3-PIECE TALENT')?.value === 'NOT CONFIGURED')) {
  throw new Error('Every skill chip must have a sourced 3-piece bonus.');
}

fs.writeFileSync('data/skill-chips.js', `// Generated from Resurgence Builds Skill Mod Combos. Do not edit by hand.\nexport const skillChipCatalog = ${JSON.stringify(records, null, 2)};\n`);
console.log(`Updated ${records.length} skill chips from ${cards.length} Resurgence Builds combos.`);
