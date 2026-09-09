# vgc-dex

A Pokédex built for **competitive Pokémon VGC Double Battles** under the
**Pokémon Champions** regulation sets. It scopes the dex to whatever regulation
is currently legal, and puts real **usage rate** and **move usage** data next to
each Pokémon's stats, typing, abilities, and (Champions-legal) movepool.

Current target regulation: **Regulation Set M‑C** (9 September 2026 – 2 December 2026).

> Status: **working prototype** — mobile-first React app with search, a Pokémon
> page (sprite, stat spread, type matchups), and a usage panel (abilities & moves
> ranked by %). Reference data is live from PokéAPI; usage data is a labelled
> sample pending a real ingest. See [TODO.md](TODO.md) for what's left.

---

## Why this exists

General Pokédex sites show every Pokémon and every move. A VGC player only cares
about what is **legal right now** and what people are **actually bringing**. This
project combines three things that normally live in separate places:

1. Accurate reference data (base stats, types, abilities, moves, sprites).
2. The Pokémon Champions **regulation ruleset** (what is legal in Reg M‑C).
3. Live **usage statistics** from the Champions ranked ladder / tournaments
   (usage %, win rate, move usage %, item %, ability %, teammates).

---

## The format: Pokémon Champions VGC

**Pokémon Champions** is the standalone competitive battling game (Nintendo Switch
+ iOS + Android, released 8 April 2026). Pokémon are imported from Pokémon HOME.
Official Play! Pokémon VGC events run on its regulation sets, and the game exposes
an in-game **Battle Data** tab with daily usage rates for Ranked Battles and
Online Competitions.

### Base format (all "M‑series" regulations)

| Rule | Value |
| --- | --- |
| Battle style | Double Battles |
| Team | Bring 6, pick 4 at Team Preview |
| Level | All Pokémon auto-set to Level 50 |
| Team Preview | 90 seconds |
| Move selection | 45 seconds per turn |
| Player time bank | 7 minutes |
| Max game length | 20 minutes |
| Species Clause | No two Pokémon with the same Pokédex number |
| Item Clause | No two Pokémon holding the same item |
| Team sheets | Open Team Sheets at official TPCi events |
| Mega Evolution | Multiple Mega Stones allowed; only one Mega Evolution per battle |

### Regulation set timeline (Year 1)

| Reg | Active | Notes |
| --- | --- | --- |
| **M‑A** | 8 Apr – 17 Jun 2026 | Mega Evolution reintroduced as the marquee mechanic. All Legendary / Mythical / Restricted Pokémon banned. Limited roster. |
| **M‑B** | 17 Jun – 9 Sep 2026 | M‑A roster + ~22 new Pokémon; M‑A Megas + ~16 new Megas. Used at the 2026 World Championships. |
| **M‑C** | 9 Sep – 2 Dec 2026 | **Current.** Same restrictions as M‑A (no Legendaries/Restricteds). ~248 Pokémon legal. Adds ~24 Pokémon (incl. Rillaboom, Baxcalibur, Cinderace, Inteleon, Persian‑Alola). Adds Mega Salamence, Mega Golisopod (→ Steel), Mega Baxcalibur, and the Z‑Megas Absol‑Z, Garchomp‑Z, Lucario‑Z. New items: Terrain Extender, terrain seeds, Rocky Helmet, Eject Button. |

> ⚠️ Roster counts and banned-move/item lists for Reg M‑C still need to be pinned
> to a primary source — see the **Verify** section in [TODO.md](TODO.md). Treat the
> table above as a working draft. Pokémon Champions does **not** implement
> Terastallization, so there is no Tera data or Tera UI in this project.

---

## Data sources

### Reference / Pokédex data — **PokéAPI** (primary)

[PokéAPI](https://pokeapi.co) (`https://pokeapi.co/api/v2/`) is the most complete
free, open Pokédex API: species, forms, base stats, typing, abilities, moves
(power / accuracy / PP / effect / priority), the type chart, evolution chains, and
sprites. No API key. REST v2 plus a GraphQL endpoint
(`https://beta.pokeapi.co/graphql/v1beta`). It also ships the whole dataset as
static files, so we can vendor a pinned snapshot instead of hammering the API.

```
GET https://pokeapi.co/api/v2/pokemon/garchomp
GET https://pokeapi.co/api/v2/pokemon-species/garchomp
GET https://pokeapi.co/api/v2/move/earthquake
GET https://pokeapi.co/api/v2/type/dragon
```

Fair-use: cache aggressively; never call PokéAPI at request time from the app.

### Battle-accurate data & legality — **@pkmn** (Pokémon Showdown data layer)

PokéAPI does not model Champions legality, Mega mechanics, or competitive
learnset legality. The [@pkmn](https://pkmn.dev) TypeScript packages do:

| Package | Use |
| --- | --- |
| `@pkmn/dex` + `@pkmn/data` | Battle-accurate species/moves/abilities/items, type chart, learnsets, format rules |
| `@pkmn/sets` | Parse / serialize PokéPaste-style sets |
| `@pkmn/smogon` | Wrapper over `data.pkmn.cc` for Smogon analyses + usage stats |
| `@pkmn/sim` (optional) | Battle engine, for future damage-calc / legality validation |

**Plan:** PokéAPI is the display/reference layer; `@pkmn/dex` is the correctness
layer for stats, learnsets, and "is this legal in Reg M‑C". Both sit behind one
internal data-access module so a Champions-specific dataset can be swapped in as
it becomes available.

### Usage rate & move usage — Pokémon Champions ladder / tournament data

| Source | What it gives | Access |
| --- | --- | --- |
| **Official in-game Battle Data** (Battle Menu → Battle Data) | Source of truth: most-used Pokémon / moves / items / abilities, tournament winners, per Ranked Season & Online Competition, updated daily | No public API — manual export / community mirror |
| **Pokémon Zone – Champions Ranked Seasons** | Per-season Singles & Doubles usage derived from official data | Web (structured pages) |
| **Pikalytics – `/champions`** | Usage %, win rate, top moves, items, abilities, teammates; ladder (Glicko cutoffs 0+/1500+/1630+/1760+) + tournaments | Web / undocumented JSON |
| **Smogon usage stats** via `@pkmn/smogon` / `data.pkmn.cc/stats/<format>.json` | Machine-readable monthly "chaos" JSON: moves, items, abilities, spreads, teammates, checks & counters — **Pokémon Showdown simulator ladder, not the official in-game ladder** | Free HTTP / npm |
| **Limitless / VGCPastes** | Tournament team lists & placements | Limitless tournaments API / spreadsheets |

**Plan:** Treat the **official in-game Battle Data** as canonical for the "meta"
view. Use Smogon/`@pkmn/smogon` as the always-available machine-readable
baseline. Ingest Pikalytics / Pokémon Zone as secondary corroboration. Every
usage snapshot is stored tagged with `{regulation, season, rating_cutoff,
captured_at, source}` so views never mix sources silently.

---

## Features

Built (prototype):

- **Search-first, mobile-first UI** — sticky search bar on top; a horizontally
  scrolling "popular" row (ordered by usage); deep-linkable via `#slug`.
- **Pokémon page** — official artwork, base-stat spread with a BST total,
  type badges, and abilities.
- **Type matchups** — "Strong against" (what its STAB hits super-effectively) and
  "Weak to" / "Resists" / "Immune to" defensively, each with ×4/×2/×½/×¼/×0 tags.
- **Usage panel** — usage rate %, win rate, **common abilities** and **common
  moves** ranked by percentage side by side. Tap any ability or move to expand
  it: abilities show their effect; moves show type, category, power, accuracy,
  PP, priority and effect (reference data from `src/data/movedex.m-c.json`,
  built by `npm run build:movedex`).

Planned — see [TODO.md](TODO.md):

- Regulation-scoped legality (show only Reg M‑C-legal species / moves / items /
  Megas, with a legality badge) and a **real usage ingest** to replace the sample.
- **Move dex** — per move: distribution across the meta and top users.
- **Meta overview** — usage leaderboard with a rating-cutoff toggle.
- **Regulation switcher** — M‑A / M‑B / M‑C snapshots; usage **trends** over time.
- Mega forms (typing / stat overrides), EV spreads, teammates.

---

## Architecture (proposed)

```
PokéAPI snapshot ─┐
@pkmn/dex data  ─┼─► ETL / normalize ─► local store ─► API ─► dex UI
usage snapshots ─┘     (regulation +      (versioned    (read   (Pokémon page,
 (official Battle       legality merge)    by reg +      only)    move dex,
  Data, Smogon,                            season)               meta board)
  Pikalytics, …)
```

- **ETL job** pulls each source, normalizes to the internal schema, and writes a
  versioned snapshot. Never live-calls a third party from a request handler.
- **Store** keeps: reference data (per National Dex + form), regulation
  definitions + legality lists, and usage snapshots keyed by
  `regulation / season / cutoff / source / date`.
- **App** reads only from the store.

### Data model sketch

```
Pokemon        { id, natId, name, forms[], types[], baseStats, abilities[], sprites }
Form           { key, name, typesOverride?, baseStatsOverride?, isMega, megaStone? }
Move           { name, slug, type, category, power, accuracy, pp, priority, effect } // implemented (movedex.m-c.json)
Ability        { name, slug, effect }                                                // implemented (movedex.m-c.json)
Regulation     { code: "M-C", startsOn, endsOn, format: "doubles",
                 legalPokemon[], legalMoves[], legalItems[], megasAllowed[],
                 clauses[], notes }
UsageSnapshot  { regulation, season, ratingCutoff, source, capturedAt, disclaimer?,
                 entries: {                       // keyed by Pokémon slug
                   "<slug>": { usagePct?, winPct?,
                               abilities: [{ name, pct }],   // implemented
                               moves:     [{ name, pct }],   // implemented
                               items?:     [{ name, pct }],
                               /* teammates, spreads — planned */ } } }
```

## Tech stack

- **App:** Vite + React 18 + TypeScript, plain CSS (mobile-first, dark theme, no
  UI framework). No runtime calls to any third-party API — the app only reads
  bundled JSON snapshots.
- **ETL:** a plain Node script (`scripts/build-data.mjs`) that pulls reference
  data from PokéAPI and writes `src/data/pokemon.json`. Re-runnable any time the
  source data changes.
- **Type chart:** the Gen VI+ 18-type chart is encoded locally in
  `src/lib/typechart.ts` (stable data, no API call needed).
- Chosen TypeScript/Node so the competitive data tooling (`@pkmn/*`) can be
  dropped in later for battle-accurate learnsets and Reg M‑C legality.

### Project layout

```
scripts/
  pokemon-list.mjs     curated Reg M-C pool (edit + re-run the ETL)
  build-data.mjs       PokéAPI ETL -> src/data/pokemon.json
src/
  data/
    pokemon.json       generated reference snapshot
    usage.m-c.json     usage snapshot (labelled SAMPLE — swap for a real ingest)
    regulation.m-c.json regulation metadata
  lib/
    typechart.ts       type effectiveness + strong/weak-against helpers
    data.ts            loads + indexes the snapshots
  components/          SearchBar, PokemonView, StatSpread, TypeMatchups, UsagePanel, TypeBadge
  App.tsx  main.tsx  styles.css
```

---

## Getting started

Requires Node 20+.

```bash
npm install
npm run build:data   # optional — refresh src/data/pokemon.json from PokéAPI
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build), `npm run preview`,
`npm run typecheck`.

To change the Pokémon pool, edit `scripts/pokemon-list.mjs` and re-run
`npm run build:data`. To wire in real usage numbers, replace
`src/data/usage.m-c.json` (same shape) — the UI reads whatever is there and shows
the `source` / `capturedAt` it carries.

---

## Deployment (Vercel)

The app is a static Vite build with no server, so it drops straight onto Vercel.
[`vercel.json`](vercel.json) pins the framework, build command (`npm run build`,
which typechecks first), output dir (`dist`), and an SPA rewrite.

**One-time connect** — either:

- **Dashboard:** <https://vercel.com/new> → import `aleksanderphan/vgc-dex` →
  keep the auto-detected settings → Deploy. Pushes to `main` then ship to
  production automatically; other branches/PRs get preview URLs.
- **CLI:** `npx vercel` (links the project, first run prompts a login) then
  `npx vercel --prod`.

The build fetches nothing external — `src/data/*.json` is committed — so
`npm run build:data` does **not** run on Vercel. Refresh the data locally and
commit the updated JSON to trigger a redeploy.

## Data accuracy & disclaimers

- Author's knowledge baseline predates the Pokémon Champions launch; all
  Champions-specific rules and data here come from third-party sources retrieved
  September 2026 and must be verified against primary sources (Serebii / Victory
  Road / the in-game rules screen) before being treated as authoritative. Open
  items are tracked in [TODO.md](TODO.md).
- Smogon / Pokémon Showdown usage reflects a **simulator ladder**, which differs
  from the official Pokémon Champions in-game ladder. The UI must label which
  ladder a number came from.
- This is an unofficial fan project. Not affiliated with, endorsed by, or
  sponsored by Nintendo, The Pokémon Company, Game Freak, or Creatures Inc.
  Pokémon and Pokémon character names are trademarks of Nintendo.

## Attribution

- Reference data: [PokéAPI](https://pokeapi.co) and the
  [@pkmn / Pokémon Showdown](https://pkmn.dev) data packages.
- Usage data: official Pokémon Champions Battle Data, plus
  [Pokémon Zone](https://www.pokemon-zone.com/champions/),
  [Pikalytics](https://www.pikalytics.com/champions), and
  [Smogon usage stats](https://www.smogon.com/stats/).

## Links

- Regulations: <https://victoryroad.pro/champions-regulations/> ·
  <https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml>
- Usage: <https://www.pokemon-zone.com/champions/ranked-seasons/> ·
  <https://www.pikalytics.com/champions>
- APIs: <https://pokeapi.co/docs/v2> · <https://github.com/pkmn/smogon> ·
  <https://pkmn.github.io/smogon/>
