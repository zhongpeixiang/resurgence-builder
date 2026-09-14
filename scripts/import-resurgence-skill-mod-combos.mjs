import fs from 'node:fs';
import { skillChipCatalog } from '../data/skill-chips.js';

const [sourcePath, patchNotesPath] = process.argv.slice(2);
if (!sourcePath || !patchNotesPath) throw new Error('Usage: node scripts/import-resurgence-skill-mod-combos.mjs <source-html> <season-2-patch-notes.json>');
const source = fs.readFileSync(sourcePath, 'utf8');
const patchNotes = JSON.parse(fs.readFileSync(patchNotesPath, 'utf8'));
const patchText = Object.values(patchNotes.query?.pages ?? {})
  .flatMap(page => page.revisions ?? [])
  .map(revision => revision.slots?.main?.['*'] ?? '')
  .join('\n');
const ammoRefillPatch = 'Decreased chance to trigger from 72% to 18%.\n** Increased amount of bullets given back from 1 to 4.';
if (!patchText.includes('Skill Mod Combo Set "Field Repair"') || !patchText.includes('Weapon Damage was given instead of Fire Rate') || !patchText.includes(ammoRefillPatch)) {
  throw new Error('Season 2 Phase 1 patch notes did not contain the expected skill-mod updates.');
}
const seasonTwoOverrides = new Map([[
  'Ammo Refill',
  'Every shot during the first 6 seconds of Tactical Link grants 18% chance of recovering 4 ammo. Duration resets at each kill.'
]]);
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
    ? { ...line, value: seasonTwoOverrides.get(combo.name) ?? combo.threePieceBonus }
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

fs.writeFileSync('data/skill-chips.js', `// Generated from Resurgence Builds Skill Mod Combos with Season 2 Phase 1 patch overrides. Do not edit by hand.\nexport const skillChipCatalog = ${JSON.stringify(records, null, 2)};\n`);
console.log(`Updated ${records.length} skill chips from ${cards.length} Resurgence Builds combos and Season 2 Phase 1 patch notes.`);
