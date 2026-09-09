# vgc-dex — TODO

Build plan for a Pokémon Champions VGC Doubles Pokédex with regulation-scoped
data plus usage-rate and move-usage stats. Target regulation: **Reg M‑C**
(9 Sep – 2 Dec 2026). See [README.md](README.md) for context.

Legend: `[ ]` open · `[~]` in progress · `[x]` done · `[?]` blocked / needs a decision

---

## Shipped in the prototype

- Vite + React 18 + TS app, mobile-first plain CSS, dark theme.
- `scripts/build-data.mjs` ETL → `src/data/pokemon.json` (56-Pokémon curated
  Reg M‑C pool; re-runnable). Sprites hotlinked from PokéAPI's GitHub.
- Local Gen VI+ type chart + `strong against` / `weak to` / `resists` / `immune`
  helpers (`src/lib/typechart.ts`).
- Sticky top search + `#slug` deep-linking + usage-ordered "popular" row.
- Pokémon page: artwork, stat spread + BST, type badges, abilities.
- Usage panel: usage % / win %, **common abilities** and **common moves** ranked
  by % — reading `src/data/usage.m-c.json` (**labelled SAMPLE**,
  `source: "placeholder"`). Each ability/move row expands to its details from
  `src/data/movedex.m-c.json` (`scripts/build-movedex.mjs`, PokéAPI).
- No Terastallization: Pokémon Champions doesn't implement it, so there is no
  Tera type / Tera Blast data or UI.

Biggest gaps: real usage ingest (Phase 3), regulation legality filtering
(Phase 2), Mega forms, move dex, full browsable grid.

---

## Verify first (facts to pin to a primary source)

These shape the data model, so resolve them before Phase 2.

- [ ] Confirm the exact Reg M‑C **legal Pokémon list** and count (README says ~248) against Serebii / Victory Road / in-game rules.
- [ ] Confirm the full **Mega Evolution list** legal in M‑C (base Megas + Z‑Megas) and any typing changes (e.g. Mega Golisopod → Steel).
- [x] Confirm whether **Terastallization** exists in Pokémon Champions — it does **not**. Tera data + UI removed (no Tera types, no Tera Blast).
- [ ] Confirm **banned moves / banned items** for M‑C (if any) and the newly added item list.
- [ ] Confirm the base-format details: Bo1 vs Bo3 by round, timer values, open-sheet policy.
- [ ] Confirm the M‑A and M‑B rosters/Megas for the historical regulation switcher.
- [ ] Determine whether Pokémon Showdown has a dedicated **Champions / Reg M‑C format id** (affects `@pkmn/smogon` + Smogon stats URLs); note that VGC format names are reused across series.
- [ ] Check whether the official in-game **Battle Data** is exportable or exposed anywhere machine-readable; document the extraction method.
- [ ] Check licensing / terms for Pikalytics and Pokémon Zone before ingesting their data programmatically.

---

## Phase 0 — Project setup & decisions

- [x] Language/runtime: **TypeScript / Node** (keeps `@pkmn/*` in reach).
- [x] App shape: **static site + prebuilt JSON**, no server.
- [x] Datastore: **flat JSON snapshots** in `src/data/` (revisit if it outgrows that).
- [x] Frontend: **React 18 + Vite**, plain CSS.
- [x] Init project (`package.json`, `tsconfig`, Vite). Still: lint/format + test runner.
- [~] `.gitignore` — appended a Node/Vite section; the VisualStudio boilerplate above it can still be trimmed.
- [x] Deploy target: **Vercel** (`vercel.json`; static Vite build, push-to-`main` = production).
- [ ] Set up CI (typecheck + build + tests) — currently only Vercel's build gates merges.
- [ ] Add `LICENSE` and a `NOTICE`/disclaimer file (disclaimer currently only in README + app footer).
- [x] Repo layout: single app (`scripts/` + `src/`).

## Phase 1 — Reference data layer (PokéAPI + @pkmn)

- [x] ETL pulls from PokéAPI and writes a committed snapshot (`npm run build:data`); the app never calls PokéAPI at runtime.
- [~] Snapshot covers a **curated 56-mon subset**, not the full legal dex — expand to the whole Reg M‑C pool once the list is verified.
- [ ] Pin the ETL to a PokéAPI dataset version / commit for reproducibility.
- [x] Import species, base stats, types, abilities, sprites.
- [~] Import **moves** + **abilities** (type/category/power/accuracy/PP/priority/effect) — `scripts/build-movedex.mjs` covers every name referenced by the usage data → `src/data/movedex.m-c.json`. Still TODO: whole-dex coverage + a move index / move page. (Type chart is encoded locally.)
- [ ] Add `@pkmn/dex` + `@pkmn/data` for battle-accurate species/move/ability/item data and learnsets.
- [ ] Reconciliation report: diff PokéAPI vs `@pkmn/dex` and pick the source of truth per field.
- [~] Normalized to the internal `Pokemon` type; `MoveInfo` / `AbilityInfo` added (`src/types.ts`). `Form` (Mega) type still to add.
- [ ] Handle Mega forms explicitly (typing + base-stat overrides, required Mega Stone).
- [x] Sprite strategy: hotlink PokéAPI's GitHub sprites/artwork (revisit if offline/asset-pinning is needed).
- [ ] Unit tests for the normalizer + type chart (a manual sanity check was done, no runner yet).

## Phase 2 — Regulation & legality layer

- [ ] Define the `Regulation` schema and encode **Reg M‑C** (legal Pokémon, moves, items, Megas, clauses, dates) from the verified lists.
- [ ] Encode **Reg M‑A** and **Reg M‑B** too (for the switcher / historical snapshots).
- [ ] `isLegal(pokemon|form|move|item, regulation)` helper + a legality badge value.
- [ ] Movepool filter: given a Pokémon + regulation, return only legal moves.
- [ ] Validate a full team/set against a regulation (species clause, item clause, Mega-per-battle, move legality) — reuse `@pkmn` rules where possible.
- [ ] Tests: legality of borderline cases (a banned Mega, a restricted Pokémon, an illegal move combo).

## Phase 3 — Usage data ingestion

> The app already consumes a `UsageSnapshot` — everything here is about
> **replacing the placeholder** `src/data/usage.m-c.json` with real data.

- [x] `UsageSnapshot` schema defined (`src/types.ts`) + a hand-authored sample the UI reads.
- [ ] Ingester: **Smogon / `@pkmn/smogon`** (`data.pkmn.cc/stats/<format>.json`) — moves, items, abilities, spreads, teammates, checks. Machine-readable baseline. Label as "simulator ladder".
- [ ] Ingester: **official in-game Battle Data** — per the extraction method found in Verify. Canonical "meta" source.
- [ ] Ingester: **Pokémon Zone** Champions Ranked Seasons (Singles + Doubles) — pending licensing check.
- [ ] Ingester: **Pikalytics** `/champions` (usage %, win rate, moves, items, abilities, teammates, cutoffs) — pending licensing check.
- [ ] Optional: **Limitless** tournament results / team lists.
- [ ] Name-mapping layer: reconcile each source's naming (forms, Megas, "Urshifu-*") to internal ids; fail loudly on unmapped names.
- [ ] Per-source normalizer → `UsageSnapshot`; keep raw payloads for reproducibility.
- [ ] Snapshot store with history (don't overwrite; append dated snapshots).
- [ ] Tests + a schema/consistency check (percentages sane, ids resolve, no source mixing).

## Phase 4 — Merge / aggregation

- [x] Join reference + usage into the per-Pokémon view (`PokemonView` + `usageFor`).
- [~] "Popular" row sorts by usage %; a full meta leaderboard page is still TODO.
- [ ] Move-usage index: invert usage data to "which Pokémon carry move X and at what %".
- [~] Source provenance shown on the usage panel + footer; not yet on every derived view.
- [x] Empty state when a Pokémon has no usage entry (`UsagePanel` fallback).
- [ ] Empty state for a whole regulation with no usage snapshot yet.

## Phase 5 — API / backend (if server route chosen)

- [ ] `GET /regulations`, `GET /regulations/:code`
- [ ] `GET /pokemon?regulation=M-C` (list, legal only) and `GET /pokemon/:id?regulation=M-C&season=&cutoff=&source=`
- [ ] `GET /moves` and `GET /moves/:id?regulation=M-C` (incl. usage index)
- [ ] `GET /meta?regulation=M-C&season=&cutoff=&source=` (leaderboard)
- [ ] Response caching + ETags; all data served from the local store.
- [ ] OpenAPI doc.

## Phase 6 — Dex UI

- [ ] Regulation switcher (default: current = M‑C) + season / rating-cutoff / source selectors.
- [~] Search + usage-ordered "popular" row exist; still need a full browsable/filterable grid (by type/ability/role).
- [~] Pokémon page: base stats, typing, abilities done. Still: Mega toggle + typing changes, Champions-legal movepool with legality badges.
- [ ] Move dex + move page (base data + usage distribution + top users).
- [ ] Meta overview page (usage leaderboard, movable cutoff).
- [~] Sample-data pill + snapshot label + footer note; extend "which source" labelling as more sources land.
- [x] Responsive, mobile-first, dark theme (palette tokens in `styles.css`; a light mode / toggle could be added later).
- [~] Accessibility pass — ranked-list rows are now real buttons with `aria-expanded` / `aria-controls` + focus-visible outline. Still: keyboard nav in the search results list, a wider sweep.

## Phase 7 — Usage & move analytics UI

- [x] Usage panel: usage %, win %, abilities % and moves % ranked side by side; each row expands to move/ability details (`movedex.m-c.json`).
- [ ] Add items %, teammates, and sample EV spreads to the panel (schema already allows items).
- [ ] Compare view: 2–4 Pokémon side by side.
- [ ] Trend charts: usage over time within a season (needs snapshot history from Phase 3).
- [ ] "Meta shift" diff between two regulations or two dates.

## Phase 8 — Automation

- [ ] Scheduled ETL (usage refresh on the source's cadence — Smogon monthly, Battle Data daily).
- [ ] Alert on ingest failure / schema drift / unmapped names.
- [ ] Auto-open the next regulation (M‑D…) as a config entry, not a code change.
- [ ] Snapshot retention policy.

## Phase 9 — Quality, docs, launch

- [ ] End-to-end test on one regulation with fixture data.
- [ ] Data-quality dashboard (coverage: % of legal Pokémon with usage data).
- [ ] Contributor docs: how to add a regulation, how to add a usage source.
- [x] README "Getting started" filled in.
- [ ] Perf pass (bundle size, snapshot size, query latency).
- [ ] Double-check attribution/disclaimer requirements for every data source used.

---

## Backlog / ideas

- [ ] Damage calculator (via `@pkmn/sim` / `@pkmn/calc`) seeded with common sets.
- [ ] Team builder with live legality + usage-informed suggestions.
- [ ] Import a PokéPaste / replica-team code and annotate each set with meta usage.
- [ ] "Counters" view from Smogon checks-&-counters data.
- [ ] Speed-tier table for the current regulation.
- [ ] Public read-only data API / downloadable snapshots.
- [ ] i18n (Pokémon names per language from PokéAPI).
