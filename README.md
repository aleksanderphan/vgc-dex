# vgc-dex

A Pokédex built for **competitive Pokémon VGC Double Battles** under the
**Pokémon Champions** regulation sets. It scopes the dex to whatever regulation
is currently legal, and puts real **usage rate** and **move usage** data next to
each Pokémon's stats, typing, abilities, and (Champions-legal) movepool.

Current target regulation: **Regulation Set M‑C** (9 September 2026 – 2 December 2026).

> Status: **working prototype** — installable, offline-capable mobile-first React
> app with search, a Pokémon page (sprite, stat spread, type matchups, Base/Mega
> switcher), a usage panel (abilities, moves and items ranked by %), and dedicated
> move / ability / item pages. Reference data is built from PokéAPI; **usage data
> is a real ingest from the Pokémon Showdown ladder** (Smogon monthly stats for
> the `gen9championsvgc2026` format). See [TODO.md](TODO.md) for what's left.

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

- iOS + Android, released 8 April 2026). Pokémon are imported from Pokémon HOME.
  Official Play! Pokémon VGC events run on its regulation sets, and the game exposes
  an in-game **Battle Data** tab with daily usage rates for Ranked Battles and
  Online Competitions.

### Base format (all "M‑series" regulations)

| Rule             | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Battle style     | Double Battles                                                   |
| Team             | Bring 6, pick 4 at Team Preview                                  |
| Level            | All Pokémon auto-set to Level 50                                 |
| Team Preview     | 90 seconds                                                       |
| Move selection   | 45 seconds per turn                                              |
| Player time bank | 7 minutes                                                        |
| Max game length  | 20 minutes                                                       |
| Species Clause   | No two Pokémon with the same Pokédex number                      |
| Item Clause      | No two Pokémon holding the same item                             |
| Team sheets      | Open Team Sheets at official TPCi events                         |
| Mega Evolution   | Multiple Mega Stones allowed; only one Mega Evolution per battle |

### Regulation set timeline (Year 1)

| Reg     | Active              | Notes                                                                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M‑A** | 8 Apr – 17 Jun 2026 | Mega Evolution reintroduced as the marquee mechanic. All Legendary / Mythical / Restricted Pokémon banned. Limited roster.                                                                                                                                                                                                                                          |
| **M‑B** | 17 Jun – 9 Sep 2026 | M‑A roster + ~22 new Pokémon; M‑A Megas + ~16 new Megas. Used at the 2026 World Championships.                                                                                                                                                                                                                                                                      |
| **M‑C** | 9 Sep – 2 Dec 2026  | **Current.** Same restrictions as M‑A (no Legendaries/Restricteds). ~248 Pokémon legal. Adds ~24 Pokémon (incl. Rillaboom, Baxcalibur, Cinderace, Inteleon, Persian‑Alola). Adds Mega Salamence, Mega Golisopod (→ Steel), Mega Baxcalibur, and the Z‑Megas Absol‑Z, Garchomp‑Z, Lucario‑Z. New items: Terrain Extender, terrain seeds, Rocky Helmet, Eject Button. |

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

| Package                    | Use                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `@pkmn/dex` + `@pkmn/data` | Battle-accurate species/moves/abilities/items, type chart, learnsets, format rules |
| `@pkmn/sets`               | Parse / serialize PokéPaste-style sets                                             |
| `@pkmn/smogon`             | Wrapper over `data.pkmn.cc` for Smogon analyses + usage stats                      |
| `@pkmn/sim` (optional)     | Battle engine, for future damage-calc / legality validation                        |

**Plan:** PokéAPI is the display/reference layer; `@pkmn/dex` is the correctness
layer for stats, learnsets, and "is this legal in Reg M‑C". Both sit behind one
internal data-access module so a Champions-specific dataset can be swapped in as
it becomes available.

### Usage rate & move usage — Pokémon Champions ladder / tournament data

| Source                                                                         | What it gives                                                                                                                                                                  | Access                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| **Official in-game Battle Data** (Battle Menu → Battle Data)                   | Source of truth: most-used Pokémon / moves / items / abilities, tournament winners, per Ranked Season & Online Competition, updated daily                                      | No public API — manual export / community mirror |
| **Pokémon Zone – Champions Ranked Seasons**                                    | Per-season Singles & Doubles usage derived from official data                                                                                                                  | Web (structured pages)                           |
| **Pikalytics – `/champions`**                                                  | Usage %, win rate, top moves, items, abilities, teammates; ladder (Glicko cutoffs 0+/1500+/1630+/1760+) + tournaments                                                          | Web / undocumented JSON                          |
| **Smogon usage stats** via `@pkmn/smogon` / `data.pkmn.cc/stats/<format>.json` | Machine-readable monthly "chaos" JSON: moves, items, abilities, spreads, teammates, checks & counters — **Pokémon Showdown simulator ladder, not the official in-game ladder** | Free HTTP / npm                                  |
| **Limitless / VGCPastes**                                                      | Tournament team lists & placements                                                                                                                                             | Limitless tournaments API / spreadsheets         |

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
- **Browse all** (`#browse`) — a "Browse" toggle by the popular row opens a card
  grid over the whole pool, filterable by type (up to two, AND) and ability,
  sortable by usage % / base-stat total / any single base stat, with an
  "in usage data" toggle. The search box doubles as a live name filter for the
  grid, and its dropdown offers a "view all N matches" jump into it.
- **Pokémon page** — official artwork, base-stat spread, type badges, and
  abilities. Pokémon with a Mega Evolution get a form switcher beneath the
  artwork (**Base / Mega**, or **Base / Mega X / Mega Y** for Charizard) that
  swaps the art, typing, ability, Mega Stone, base stats and type matchups
  (`src/data/megadex.m-c.json`, `npm run build:megadex` — auto-discovers every
  Mega / Primal / Z-Mega variety per species; 61 bases in the curated pool,
  including the Champions-original Megas such as Mega Staraptor and Mega Raichu
  X/Y).
- **Type matchups** — "Strong against" (what its STAB hits super-effectively) and
  "Weak to" / "Resists" / "Immune to" defensively, each with ×4/×2/×½/×¼/×0 tags.
- **Usage panel** — usage rate %, **common abilities** then **common moves**
  ranked by percentage, followed by **Common items**, **Common EV spreads** and
  **Common teammates** sections — from a real ingest of the Pokémon Showdown
  ladder (`scripts/ingest-usage.mjs`, Smogon monthly stats via `data.pkmn.cc`;
  ~120 Pokémon, Mega/Primal formes merged into the base species). Spreads are
  Smogon's coarse buckets scaled back to approximate real EVs (over-rounding
  shaved to a legal 508 total); teammate % is co-occurrence on the same team,
  with teammate Mega formes merged and each chip deep-linking to that Pokémon.
  No win rate — that source doesn't publish one. Tap any ability, move or item to
  expand it in place (several can stay open at once).
- **Move / ability / item pages** — the expanded row links through to a
  deep-linkable page (`#move/<slug>`, `#ability/<slug>`, `#item/<slug>`) with the
  full mechanical breakdown: PokéAPI's long-form effect text, structured stats
  (multi-hit count, drain/recoil, status + chance, stat changes, target,
  generation, Fling power), a hand-authored **competitive notes** block for
  interactions PokéAPI's text omits (e.g. Triple Axel's 20→40→60 BP ramp,
  Prankster failing vs Dark types, Life Orb's 1.3× / 10% recoil), and a "run by"
  list of Pokémon in the usage data that carry it. Reference data from
  `src/data/movedex.m-c.json` / `src/data/itemdex.m-c.json` + curated
  `scripts/reference-notes.mjs` (`npm run build:movedex`, `npm run build:itemdex`).
- **Installable PWA / offline** — `vite-plugin-pwa` (Workbox) precaches the whole
  app shell. Since every dataset is bundled into the JS, the app works fully
  offline after the first load; the hotlinked PokéAPI sprites are runtime-cached
  (`CacheFirst`). `registerType: 'prompt'` — a small toast offers **Reload** when
  a new build is deployed. Icons are generated dependency-free by
  `npm run build:icons` (`scripts/make-icons.mjs`).

Planned — see [TODO.md](TODO.md):

- Regulation-scoped legality (show only Reg M‑C-legal species / moves / items /
  Megas, with a legality badge).
- A source closer to the **official in-game** Champions ladder (Pikalytics /
  Pokémon Zone / Battle Data).
- **Move dex** — per move: distribution across the meta and top users.
- **Meta overview** — usage leaderboard with a rating-cutoff toggle.
- **Regulation switcher** — M‑A / M‑B / M‑C snapshots; usage **trends** over time.
- Real Mega Stone names for the Champions-original Megas.
- Compare view (2–4 Pokémon side by side).

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
MegaForm       { key, label, name, stone, types, baseStats, abilities, sprite, artwork } // implemented (megadex.m-c.json)
Move           { name, slug, type, category, power, accuracy, pp, priority, target,      // implemented (movedex.m-c.json)
                 generation, minHits, maxHits, drain, healing, critRate, ailment,
                 ailmentChance, flinchChance, statChance, statChanges[], effect,
                 longEffect, notes[] }
Ability        { name, slug, generation, effect, longEffect, notes[] }                   // implemented (movedex.m-c.json)
Item           { name, slug, category, sprite, flingPower, effect, longEffect, notes[] } // implemented (itemdex.m-c.json)
Regulation     { code: "M-C", startsOn, endsOn, format: "doubles",
                 legalPokemon[], legalMoves[], legalItems[], megasAllowed[],
                 clauses[], notes }
UsageSnapshot  { regulation, season, ratingCutoff, source, capturedAt, disclaimer?,
                 entries: {                       // keyed by Pokémon slug, usage-ordered
                   "<slug>": { usagePct,         // winPct absent — Showdown stats have none
                               abilities: [{ name, pct }],   // ingested from the Showdown ladder
                               moves:     [{ name, pct }],
                               items:     [{ name, pct }],
                               spreads:   [{ nature, evs, pct }],   // approx real EVs
                               teammates: [{ slug, name, pct }] } } } // co-occurrence %
```

## Tech stack

- **App:** Vite + React 18 + TypeScript, plain CSS (mobile-first, dark theme, no
  UI framework). No runtime calls to any third-party API — the app only reads
  bundled JSON snapshots.
- **PWA:** `vite-plugin-pwa` (Workbox) — installable, offline-capable, with a
  reload-on-new-build prompt. Config lives in `vite.config.ts`.
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
  pokemon-list.mjs     curated Reg M-C pool (edit + re-run build:data)
  build-data.mjs       PokéAPI ETL -> src/data/pokemon.json
  ingest-usage.mjs     Showdown/Smogon ladder ETL -> src/data/usage.m-c.json
  build-movedex.mjs    PokéAPI ETL -> src/data/movedex.m-c.json  (moves + abilities in the usage data)
  build-itemdex.mjs    PokéAPI ETL -> src/data/itemdex.m-c.json  (items in the usage data)
  build-megadex.mjs    PokéAPI ETL -> src/data/megadex.m-c.json  (Mega forms for the pool)
  reference-notes.mjs  hand-authored competitive notes, merged into movedex/itemdex by the ETLs
  make-icons.mjs       dependency-free PNG generator -> public/ PWA icons (npm run build:icons)
data/
  history/             dated copies of every usage ingest (usage.m-c.<date>.json) — appended, never overwritten
  raw/                 gzipped raw upstream payloads (git-ignored; sha256 recorded in the snapshot `meta`)
public/                pwa-192.png, pwa-512.png, pwa-maskable-512.png, apple-touch-icon.png, favicon.svg
src/
  data/
    pokemon.json       generated reference snapshot
    usage.m-c.json     usage snapshot — ingested from the Showdown ladder (data.pkmn.cc)
    movedex.m-c.json   generated move + ability reference
    itemdex.m-c.json   generated held-item reference
    megadex.m-c.json   generated Mega Evolution reference
    regulation.m-c.json regulation metadata
  lib/
    typechart.ts       type effectiveness + strong/weak-against helpers
    data.ts            loads + indexes the snapshots
  components/          SearchBar, PokemonView, BrowseGrid, StatSpread, TypeMatchups,
                       UsagePanel, ItemsPanel, SpreadsPanel, TeammatesPanel,
                       RankedList, EntityPage, DataPill, UpdateToast, TypeBadge
  vite-env.d.ts        Vite + vite-plugin-pwa ambient types
  App.tsx  main.tsx  styles.css   (App.tsx also does the hash routing: #slug vs #browse vs #move|ability|item/<slug>)
```

---

## Getting started

Requires Node 20+.

```bash
npm install
npm run build:data   # optional — refresh src/data/pokemon.json from PokéAPI
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + production build, incl. the PWA
service worker), `npm run preview` (serve the built PWA locally — the SW only
runs on a real build), `npm run typecheck`, `npm test` (Vitest — type chart,
lookup helpers, usage-snapshot consistency; `npm run test:watch` to iterate),
`npm run build:icons` (regenerate `public/` PWA icons), and
`npm run version:bump` (see [Versioning](#versioning)).

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `version:check`,
`typecheck`, `test`, and `build` on every push to `main` and every PR.

**Refreshing the data** (all offline-safe, re-runnable):

```bash
npm run build:data      # reference: PokéAPI -> pokemon.json  (edit pokemon-list.mjs first)
npm run ingest:usage    # usage: Showdown/Smogon ladder -> usage.m-c.json (+ data/history + data/raw)
npm run build:movedex   # then rebuild the detail dexes so every
npm run build:itemdex   #   move / ability / item in usage.m-c.json resolves
npm run build:megadex   # Mega forms for the pool
```

`ingest:usage` uses a `SOURCES` registry (one adapter per usage source; only
`smogon` is wired up). Each run retains the gzipped raw payload in `data/raw/`
(git-ignored; `meta.rawSha256` in the snapshot is the committed provenance
record) and appends a dated copy to `data/history/`. Flags:
`--from <file>` normalizes a local raw payload instead of fetching;
`--dry-run` normalizes and writes nothing.

`ingest:usage` prints any Pokémon with ≥0.5% usage that isn't in the reference
pool — add those to `scripts/pokemon-list.mjs` and re-run `build:data`.

---

## Versioning

`<Major>.<Minor>.<Patch>`, where **Patch = total git commit count**. It lives in
[`package.json`](package.json) (`version`), is injected into the bundle at build
time via `__APP_VERSION__` ([`vite.config.ts`](vite.config.ts)), and shows in the
app footer as `v0.0.x`.

- **Every commit bumps Patch by one.** Run `npm run version:bump` immediately
  before `git commit` — it writes `0.0.<commits + 1>` into `package.json` so the
  new commit ships with its own version — then stage `package.json` in that same
  commit.
- `npm run version:check` asserts `package.json` matches the current commit count
  (post-commit / CI guard). `node scripts/version.mjs --print` just prints it.
- **Major / Minor are hand-managed** — edit `package.json` directly to roll them;
  the script keeps writing `0.0.x` until you do.

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

Source code is MIT-licensed ([LICENSE](LICENSE)); bundled third-party data keeps
its own terms — see [NOTICE.md](NOTICE.md) for the per-source breakdown and the
trademark disclaimer.

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
