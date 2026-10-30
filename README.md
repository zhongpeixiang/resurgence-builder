# Resurgence Builder

A static, source-backed equipment database and a separate **SHD Build Lab** for Division Resurgence.

## Pages

- `index.html` — preserved local equipment database with search and category filters.
- `builder.html` — a Build Lab styled after [Resurgence Builds’ public builder](https://resurgencebuilds.com/builder/), powered only by this project’s local catalog modules.
- Both pages include a **Mechanics** section with three source-checked qualitative tips: weapon proficiency, armor weakness matching, and separate specialization XP. Expand each card for Ubisoft/community sources and verification limits; no unverified numerical values enter calculations.

The database links directly to the builder via an `Equip in Build Lab` action. The Build Lab mirrors the full SHD terminal structure: agent specialization/focus, six-slot gear rig, primary and secondary weapons, source-compatible weapon talents, OS Protocol, three skill mods, build overview, ISAC analysis, stats telemetry, active set bonuses, build card, reset, and URL-shareable state. Every picker is supplied from this project’s local catalog modules.

## Data provenance

The builder imports the same committed modules as the database:

- `data/gear.js`, `data/weapons.js`, `data/talents.js`, and `data/brands.js` — authorized SHD.build imports.
- `data/os-protocols.js` and `data/skill-chips.js` — Resurgence Builds sources.
- `data/specializations.js` — authorized SHD.build import.

No separate copied builder data payload is used.

### Offline client research (not runtime stats)

[`data/research/`](data/research/README.md) preserves a versioned `1.66724.0` client-research dataset: 1,337 native schema identifiers across 68 types and five curated mechanics-related UI descriptions, with hashes, binary offsets and explicit uncertainty labels. Enum IDs are **not balance values**; cooked UI defaults are **not verified current rules**. This dataset is intentionally separate from all database catalogs and builder calculations. See its README for coverage limits and the repeatable import command.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` for the database or `http://localhost:8000/builder.html` for the Build Lab.

## Test

```bash
npm test
```
