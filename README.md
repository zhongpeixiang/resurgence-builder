# Resurgence Builder

A static, source-backed equipment database and a separate **SHD Build Lab** for Division Resurgence.

## Pages

- `index.html` — preserved local equipment database with search and category filters.
- `builder.html` — a Build Lab styled after [Resurgence Builds’ public builder](https://resurgencebuilds.com/builder/), powered only by this project’s local catalog modules.

The database links directly to the builder via an `Equip in Build Lab` action. The Build Lab mirrors the full SHD terminal structure: agent specialization/focus, six-slot gear rig, primary and secondary weapons, source-compatible weapon talents, OS Protocol, three skill mods, build overview, ISAC analysis, stats telemetry, active set bonuses, build card, reset, and URL-shareable state. Every picker is supplied from this project’s local catalog modules.

## Data provenance

The builder imports the same committed modules as the database:

- `data/gear.js`, `data/weapons.js`, `data/talents.js`, and `data/brands.js` — authorized SHD.build imports.
- `data/os-protocols.js` and `data/skill-chips.js` — Resurgence Builds sources.
- `data/specializations.js` — authorized SHD.build import.

No separate copied builder data payload is used.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` for the database or `http://localhost:8000/builder.html` for the Build Lab.

## Test

```bash
npm test
```
