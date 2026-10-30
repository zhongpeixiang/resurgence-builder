# Client research — 1.66724.0

Versioned, offline evidence for future builder work. **This is not a new source of live item stats.** Nothing in this directory is imported by `app.js`, `database.js`, `builder-data.js` or `builder-engine.js`.

## What was kept

`client-1.66724.0.json` contains:

- **1,337 enum records across 68 types**, retaining exact native identifiers and enum IDs.
- **316 actor-attribute entries** (including the unknown sentinel): weapon handling/damage, crit/head damage, health/armor, skills, healing and resistances.
- **53 global parameter keys**, **9 calculation-mode identifiers**, **47 talent-condition entries**, and gear/weapon/buff/skill classifications. These counts include source sentinels where present.
- **Five curated mechanics descriptions**: armory proficiency and blueprint power tiers; unlocked blueprint capabilities; crafting proficiency and quality; separate specialization/character XP; armor weaknesses and damage types.
- Package/library hashes, extraction-input hashes, native name/value byte offsets, and PAK header/decoded-string offsets.

UI drafts, generic labels, test text, the unverified SHD-point totals, illustrative talent percentages, engine localization and all APK/asset binaries were deliberately excluded. The five descriptions are exact source quotations, including source formatting; titles are editorial navigation labels.

## Appropriate uses

- Find canonical client identifiers before designing a stat model or validating an attribute mapping.
- Identify which talent conditions, skill parameters or gear categories deserve further investigation.
- Use the five descriptions as **research leads** for explanatory documentation after checking them against current gameplay.
- Compare another client version against this version without silently changing existing sourced catalog values.

## Guardrails

- `runtimeEligible: false` applies to the whole dataset and every mechanics description.
- `enumId` means a lookup identifier, **not** a stat magnitude, percentage, coefficient, cap, roll or formula. It is meaningful with its enum type, not as a global item ID.
- Native schema names do not establish active gameplay usage, stacking order or formulas; sentinel, legacy, NPC and unused entries can exist.
- `claimStatus: cooked-ui-default-unverified` means the mechanics prose came from cooked UI authoring/default strings. It can be stale, test content or replaced at runtime.
- Preserve literal identifiers, including typos such as `VERTIAL`; do not guess translations or automatically map source slots such as `HAT`/`THIGH` onto builder UI slots.
- Do not feed this dataset into DPS/build calculations or replace SHD.build/Resurgence Builds catalogs with it. A future runtime integration needs separately verified values, explicit mappings and dedicated tests.

## Provenance and coverage

Downloaded from [Uptodown](https://the-division-resurgence.en.uptodown.com/android/download), standalone variant `/android/download/1231328087-x`:

- Package: `com.ubisoft.the.division.mobile.combat.shooting.open.world.rpg`.
- Version: `1.66724.0`.
- XAPK SHA-256: `8e5b915291d9a821a6986f3c43d97510b15eb66d440c6b2876f303766c514e66`, matched to the published listing.
- Native evidence: `config.arm64_v8a.apk!lib/arm64-v8a/libUE4.so`; its separate SHA-256 is stored in the JSON. Native offsets are file offsets, not virtual addresses.
- UI evidence: `obbassets.apk!assets/main.obb.png!TheDivision/Content/Paks/pakchunk0-Android_ASTC.pak`; header offsets identify physical entries because original filenames remain encrypted. `decodedByteOffset` identifies the start of the quoted FString bytes within a decompressed entry.
- Enum names and signed int64 IDs were checked directly against the native binary. UI strings were checked against their length prefix, full bytes and NUL terminator. Stored compressed-payload hashes and decoded lengths were also checked. One open-source Oodle decoder was used; no independent second decoder comparison was performed.

All four PAK indexes were encrypted. The offline pass inventoried 93,419 physical entries, of which 45,660 had encrypted payloads. It copied/decompressed 25,363 distinct unencrypted entries, including engine/media content. This was **partial recovery**, not an exhaustive extraction. No authoritative gameplay balance tables, Lua implementation or verified AES key were recovered; post-install downloads, server settings and hotfixes remain outside coverage.

This repository stores only the useful normalized research subset, not the original installer, full source dumps, raw binary fragments, credentials or native executables. Game content remains attributable to Ubisoft; importing this evidence does not establish a redistribution license for other game assets.

### UI promotion after corroboration

Three qualitative claims now have a separately curated UI dataset at `data/confirmed-mechanics.js`: weapon proficiency tasks/rewards, matching damage types to enemy armor weaknesses, and separate character/specialization XP tracks. They were cross-checked against Ubisoft publications and October 2026 community guides. Each UI card links its sources, dates historical evidence, and explicitly says it was not independently gameplay-tested. Only this narrow paraphrased guidance is displayed; the research JSON remains non-runtime. Crafting probabilities, blueprint-specific details, refresh timing, enum IDs and all numerical balance claims remain excluded from the UI and calculations.

## Reproduce the import

With the original offline extraction directory available:

```sh
node scripts/import-client-research.mjs /path/to/resurgence-research
# Optional alternate output, without changing the checked-in file:
node scripts/import-client-research.mjs /path/to/resurgence-research /path/to/output.json
npm test
```

Required input files:

- `native-analysis/mechanics_enums.json`.
- `oodle-analysis/mechanics-ui-text-unique.json`.

The importer verifies their pinned SHA-256 values **before parsing**, selects mechanics by exact text digest, retains literal identifiers, rejects malformed/duplicate schema records, and writes deterministically. Raw inputs stay outside the repository (the project's `imports/` directory is already ignored if a local copy is needed). The importer does not re-extract or decrypt the game and does not require binary assets for the normal test suite. To reproduce extraction from the installer itself, retain the separate offline analysis scripts and evidence bundle; those are not distributed as a game-asset dump here.
