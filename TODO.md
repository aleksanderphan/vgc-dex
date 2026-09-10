# vgc-dex — TODO

Build plan for a Pokémon Champions VGC Doubles Pokédex with regulation-scoped
data plus usage-rate and move-usage stats. Target regulation: **Reg M‑C**
(9 Sep – 2 Dec 2026). See [README.md](README.md) for context.

Legend: `[ ]` open · `[~]` in progress · `[x]` done · `[?]` blocked / needs a decision

---

## Shipped in the prototype

- Vite + React 18 + TS app, mobile-first plain CSS, dark theme.
- `scripts/build-data.mjs` ETL → `src/data/pokemon.json` (138-Pokémon curated
  pool: the Mega-capable classics + every Showdown-ladder regular ≳0.5%;
  re-runnable). Sprites hotlinked from PokéAPI's GitHub.
- Local Gen VI+ type chart + `strong against` / `weak to` / `resists` / `immune`
  helpers (`src/lib/typechart.ts`).
- Floating **bottom nav dock** (thumb-reachable): search + usage-ordered
  "popular" row + Browse toggle, its results popover opening upward. `#slug`
  deep-linking. The top is left clear for content; on a Pokémon page, once the
  hero scrolls away a compact sprite bar (sprite + name + type dots, styled
  like a search-result row) sticks to the top and taps back to the top.
- Pokémon page: artwork, stat spread (no BST total), type badges, abilities.
  Pokémon with a Mega get a **Base / Mega** form switcher that swaps art, typing,
  ability, Mega Stone, base stats and type matchups
  (`src/data/megadex.m-c.json`, `scripts/build-megadex.mjs`, PokéAPI). The ETL
  auto-discovers every `*-mega[-x|-y|-z]` / `*-primal` variety on the species —
  61 bases now, incl. the Champions-original Megas (Mega Staraptor, Mega Raichu
  X/Y, Mega Delphox/Froslass/Baxcalibur/Clefable/Glimmora/…) and the Z-Megas
  (Garchomp-Z, Absol-Z, Lucario-Z). Mega Stone names come from the item endpoint
  where it has one, else `STONE` overrides, else the card omits the line. A form
  with no artwork renders a "No art yet" placeholder.
- **Real usage data**: `scripts/ingest-usage.mjs` pulls the Pokémon Showdown
  ladder stats for `gen9championsvgc2026` (Smogon monthly "chaos" JSON via
  data.pkmn.cc) → `src/data/usage.m-c.json`. ~120 Pokémon, Mega/Primal formes
  merged into the base, usage-weighted. Now also ingests **common EV spreads**
  (Smogon's bucketed spreads scaled back to approximate real EVs, over-rounding
  shaved to a legal 508) and **common teammates** (co-occurrence % on the same
  team, teammate Mega formes merged into the base). No win-rate (source has
  none); `counters` is empty in this format's payload. The "sample data" pill
  flips to "ladder data" (`components/DataPill.tsx`).
- Usage panel: **common abilities** then **common moves** stacked, then a
  **Common items** section, a **Common EV spreads** section
  (`components/SpreadsPanel.tsx`) and a **Common teammates** section of
  sprite chips that deep-link to each teammate (`components/TeammatesPanel.tsx`).
  Each ability/move/item row expands in place (several at once) to short details
  from `src/data/movedex.m-c.json` / `src/data/itemdex.m-c.json`
  (`build:movedex` / `build:itemdex`, PokéAPI; a Champions-original
  move/ability/item with no PokéAPI record renders as a clearly-labelled stub).
- Dedicated **move / ability / item pages** — hash-routed (`#move/<slug>`,
  `#ability/<slug>`, `#item/<slug>`, deep-linkable) via `App.tsx` +
  `components/EntityPage.tsx`. Shows PokéAPI's long-form effect, structured
  mechanics (multi-hit, drain/recoil, status + %, stat changes, target,
  generation, Fling power) and a curated **competitive notes** block from
  `scripts/reference-notes.mjs` for interactions PokéAPI omits, plus a "run by"
  list back into the usage data.
- No Terastallization: Pokémon Champions doesn't implement it, so there is no
  Tera type / Tera Blast data or UI.
- **Tests + CI**: Vitest suite (`npm test`, 35 tests) over the type chart, the
  name normalizer / lookup helpers, and a usage-snapshot consistency check;
  `.github/workflows/ci.yml` gates `main` + PRs on version / typecheck / test /
  build. `LICENSE` (MIT) + `NOTICE.md` for third-party data.

Biggest gaps: regulation legality filtering (Phase 2), Champions-original Megas,
move dex, additional usage sources (official Battle Data, Pikalytics win-rate).

---

## Verify first (facts to pin to a primary source)

These shape the data model, so resolve them before Phase 2. Full write-up with
citations: **[docs/regulation-verification.md](docs/regulation-verification.md)**.

- [~] Reg M‑C **legal Pokémon list** and count. No official number is published — Pokémon HOME is the source of truth (Handbook §2.1.1). Official announcement: previous sets stay legal **+ 24 new**, same category bans as M‑A (no Restricted/Legendary/Mythical/Paradox/Treasures-of-Ruin; Battle Bond banned). Secondary counts disagree (Pokémon Zone 248, MetaVGC 260) → encode the pool as `M‑B ∪ {24 new}` and derive the count, don't assert it.
- [~] Full **Mega list** legal in M‑C. Structure confirmed: M‑A Megas + M‑B's 16 + **M‑C's 6** (Mega Salamence, Mega Golisopod, Mega Baxcalibur, Z‑Megas Absol‑Z / Garchomp‑Z / Lucario‑Z). Typing changes per Serebii (Golisopod → Bug/Steel, Absol‑Z → Dark/Ghost, Garchomp‑Z → mono‑Dragon) but MetaVGC disagrees — needs an in‑game cross-check. The megadex ETL's 61 auto-discovered bases are NOT the legal set; build an explicit per‑reg `megasLegal` + type/ability overrides.
- [x] Confirm whether **Terastallization** exists in Pokémon Champions — it does **not**. Tera data + UI removed (no Tera types, no Tera Blast).
- [x] **Banned moves / items** for M‑C: none published. Only the Item Clause + the format-wide **Battle Bond** ability ban (Handbook §2.2–2.3). **12 new held items** in M‑C (Serebii list: Leek, Rocky Helmet, Air Balloon, Red Card, Binding Band, Eject Button, Normal Gem, Terrain Extender, Electric/Psychic/Misty/Grassy Seed) + 6 new Mega Stones. Encode `itemsLegal` as an allow-list of per-set additions.
- [x] **Base-format details** pinned to the Play! Pokémon VGC Tournament Handbook 2026 (EN): Double Battles, register 4–6 / bring 4, auto Lv. 50. **Swiss = Bo1 or Bo3 at TO discretion (Bo3 recommended Regional+); all top cut Bo3.** Timers: Team Preview 90s, move 45s, "Your Time" 7 min, game 20 min, no round clock. Species Clause = same Pokédex number; Item Clause. **Whole 2026 season is open team list** — everything shared except the Pokémon's stats (EV/IV).
- [~] **M‑A / M‑B rosters + Megas** for the switcher: sourced (Serebii per-set pages + Victory Road + Bulbapedia) — see the doc's §5 table. M‑A = limited roster, base-game Megas only; M‑B = M‑A + ~22–27 species + 16 new Megas (used at 2026 Worlds). Encode as diffs off M‑A, not full lists.
- [x] Determine whether Pokémon Showdown has a dedicated **Champions format id** — yes: `gen9championsvgc2026` (also `gen9championsbattlestadiumsingles`, `gen9championsou`). Ingested from `data.pkmn.cc/stats/gen9championsvgc2026.json`.
- [x] Official in-game **Battle Data** extraction: no in-game export, but **championsbattledata.com** (3rd-party fan mirror) exposes an auth-free JSON API (`/api/battle/:format/:name`, `?days=N` daily snapshots, Showdown ids, CSV/JSON assets). Wire it as a `SOURCES` adapter; attribute as a fan mirror, not official.
- [x] **Pikalytics / Pokémon Zone licensing.** Pikalytics: **OK** — `robots.txt` allows all + AI crawlers, publishes sanctioned `/ai/pokedex/[format]/[pokemon]` Markdown endpoints + `llms.txt`; no formal ToS, just a trademark notice. Ingest politely, cache, attribute, courtesy-note them. Pokémon Zone: **NOT OK** — ToS bans "robot, spider, scraper, crawler … for any purpose", `robots.txt` disallows `/api/`. Drop it as an ingest source; cite in docs only.

---

## Phase 0 — Project setup & decisions

- [x] Language/runtime: **TypeScript / Node** (keeps `@pkmn/*` in reach).
- [x] App shape: **static site + prebuilt JSON**, no server.
- [x] Datastore: **flat JSON snapshots** in `src/data/` (revisit if it outgrows that).
- [x] Frontend: **React 18 + Vite**, plain CSS.
- [x] Init project (`package.json`, `tsconfig`, Vite). Test runner: **Vitest** (`npm test`). Lint/format: **ESLint 9** flat config (`eslint.config.js`, typescript-eslint + react-hooks + react-refresh, `eslint-config-prettier` last) via `npm run lint`, **Prettier** (`.prettierrc.json`: no semis, single quotes, trailing commas) via `npm run format` / `format:check`; whole tree reformatted once on adoption.
- [x] `.gitignore` — trimmed the VisualStudio boilerplate down to a lean Node / Vite / editor ignore.
- [x] Deploy target: **Vercel** (`vercel.json`; static Vite build, push-to-`main` = production).
- [x] Set up CI — `.github/workflows/ci.yml` runs `version:check` + `lint` + `format:check` + `test` + `build` (build is also the typecheck) on every push to `main` and every PR (Vercel's build still gates deploys).
- [x] Add `LICENSE` (MIT, code only) and `NOTICE.md` (third-party data sources + trademark disclaimer, keyed to each bundled snapshot).
- [x] Repo layout: single app (`scripts/` + `src/`).

## Phase 1 — Reference data layer (PokéAPI + @pkmn)

- [x] ETL pulls from PokéAPI and writes a committed snapshot (`npm run build:data`); the app never calls PokéAPI at runtime.
- [~] Snapshot covers a **curated 138-mon subset** (Mega classics + Showdown-ladder regulars), not the full legal dex — expand to the whole Reg M‑C pool once the list is verified.
- [ ] Pin the ETL to a PokéAPI dataset version / commit for reproducibility.
- [x] Import species, base stats, types, abilities, sprites.
- [~] Import **moves** + **abilities** + **items** — `scripts/build-movedex.mjs` + `scripts/build-itemdex.mjs` cover every name referenced by the usage data → `src/data/movedex.m-c.json` / `itemdex.m-c.json`, now with the long-form effect, structured mechanics (multi-hit, drain/recoil, ailment + %, stat changes, target, generation, Fling power) and curated `scripts/reference-notes.mjs`. Still TODO: whole-dex coverage, a browsable move index, per-source reconciliation. (Type chart is encoded locally.)
- [ ] Add `@pkmn/dex` + `@pkmn/data` for battle-accurate species/move/ability/item data and learnsets.
- [ ] Reconciliation report: diff PokéAPI vs `@pkmn/dex` and pick the source of truth per field.
- [~] Normalized to the internal `Pokemon` type; `MoveInfo` / `AbilityInfo` / `ItemInfo` / `MegaForm` / `PokemonForm` added (`src/types.ts`).
- [~] Mega forms: `scripts/build-megadex.mjs` → `src/data/megadex.m-c.json` (types, base stats, ability, Mega Stone). Auto-discovers every `*-mega[-x|-y|-z]` / `*-primal` variety per species — **61 bases**, incl. Champions-original Megas (Mega Staraptor, Mega Raichu X/Y, Mega Golisopod (→ Steel), Mega Delphox/Froslass/Baxcalibur/Clefable/Glimmora/Excadrill/Chandelure/…) and the Z-Megas (Garchomp-Z, Absol-Z, Lucario-Z), surfaced via the form switcher. `formsFor` backfills a Mega's abilities from the base when PokéAPI lists none (Mega Golisopod). Still TODO: real Mega Stone names for the Champions-original set (PokéAPI has no item for most — `STONE` map in the ETL), per-regulation legality.
- [x] Sprite strategy: hotlink PokéAPI's GitHub sprites/artwork; the PWA service worker runtime-caches them (`CacheFirst`) so they survive offline after first view. (Asset-pinning / self-hosting still an option if the GitHub host is a concern.)
- [x] Unit tests for the normalizer + type chart — Vitest: `src/lib/typechart.test.ts` (effectiveness, dual-type stacking, immunities, matchup bucketing, offensive coverage, `titleCase`) and `src/lib/data.test.ts` (name normalizer case/punctuation-insensitivity, `usersOf` ordering + slug resolution, `popularSlugs`, `formsFor`, `searchPokemon`).

## Phase 2 — Regulation & legality layer

- [ ] Define the `Regulation` schema and encode **Reg M‑C** (legal Pokémon, moves, items, Megas, clauses, dates) from the verified lists — inputs pinned in [docs/regulation-verification.md](docs/regulation-verification.md). Pool = `M‑B ∪ {24 new}` minus banned categories; `itemsLegal` / `megasLegal` as per-set additive allow-lists; count derived from the list, not asserted.
- [ ] Encode **Reg M‑A** and **Reg M‑B** too (for the switcher / historical snapshots) — as diffs off M‑A per the doc's §5 table.
- [ ] `isLegal(pokemon|form|move|item, regulation)` helper + a legality badge value.
- [ ] Movepool filter: given a Pokémon + regulation, return only legal moves.
- [ ] Validate a full team/set against a regulation (species clause, item clause, Mega-per-battle, move legality) — reuse `@pkmn` rules where possible.
- [ ] Tests: legality of borderline cases (a banned Mega, a restricted Pokémon, an illegal move combo).

## Phase 3 — Usage data ingestion

> The app consumes a `UsageSnapshot`; `src/data/usage.m-c.json` is now a real
> **Showdown-ladder ingest**, not the hand-authored placeholder.

- [x] `UsageSnapshot` schema defined (`src/types.ts`).
- [x] Ingester: **Smogon / Showdown** (`data.pkmn.cc/stats/gen9championsvgc2026.json`) — `scripts/ingest-usage.mjs`: usage %, abilities, moves, items, **EV spreads** (bucketed → approx real EVs, capped to 508) and **teammates** (co-occurrence %, teammate Mega formes merged); Mega/Primal merged into the base; labelled as the simulator ladder in the snapshot `source` + `disclaimer` and via the "ladder data" pill. `counters` is empty in this format's payload; `viability`/`happinesses`/`teraTypes` deliberately skipped (no Tera in Champions).
- [ ] Ingester: **official in-game Battle Data** via **championsbattledata.com** (fan mirror, auth-free JSON API: `/api/battle/:format/:name`, `?days=N` daily snapshots, Showdown ids). Canonical "meta" source; attribute as an unofficial mirror, not official. See [docs/regulation-verification.md §6](docs/regulation-verification.md).
- [x] ~~Ingester: **Pokémon Zone**~~ — **dropped.** Their ToS bans automated access "for any purpose" and `robots.txt` disallows `/api/`. Cite as a human cross-reference only, no ingest.
- [ ] Ingester: **Pikalytics** — licensing **cleared** (`robots.txt` allows all + AI crawlers; sanctioned `/ai/pokedex/[format]/[pokemon]` Markdown endpoints + `llms.txt`; Champions format id `battledataregmbs3` → `…regmc…`). Adds win rate + rating cutoffs. Ingest politely, cache, attribute on every derived view, courtesy-note them if shipped publicly.
- [ ] Optional: **Limitless** tournament results / team lists.
- [~] Name-mapping layer: `ingest-usage.mjs` lower-cases + has a small override table, merges Mega/Primal, and **reports** every ≥0.5% Pokémon not in the pool. Still: promote that report to a hard failure once the pool is meant to be complete; handle gender/other forms.
- [x] Per-source normalizer + keep raw payloads for reproducibility — `ingest-usage.mjs` now has a `SOURCES` registry (one adapter per source with `normalize(raw, poolNames)`; only `smogon` wired up, Pikalytics / Zone / official slot in beside it). Each run retains the gzipped raw payload in `data/raw/` (git-ignored; `meta.rawSha256` in the snapshot is the committed provenance record) and records `meta` (sourceId, url, battles, entryCount, sha). `--from <file>` re-normalizes a local raw payload; `--dry-run` writes nothing.
- [x] Snapshot store with history — every ingest appends `data/history/usage.m-c.<date>.json` (committed, never overwritten across days); `src/data/usage.m-c.json` stays the canonical latest the app imports. Retention/pruning is Phase 8.
- [x] Tests + a schema/consistency check — `src/lib/data.test.ts` "usage snapshot consistency": `regulation` matches `REGULATION.code`, source is a real Showdown/Smogon ingest (not the placeholder), every entry key + teammate slug resolves in the pool, all percentages in range, EV spreads legal (sum ≤ 508, each 0–252), every usage-referenced move present in the movedex.

## Phase 4 — Merge / aggregation

- [x] Join reference + usage into the per-Pokémon view (`PokemonView` + `usageFor`).
- [~] "Popular" row sorts by usage %; a full meta leaderboard page is still TODO.
- [x] Move-usage index: `usersOf(kind, name)` in `lib/data.ts` inverts the usage data; the move / ability / item pages show a "Run by" list. Still: a standalone move-usage view.
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
- [x] Search + usage-ordered "popular" row + a **Browse all** grid (`#browse`,
      `components/BrowseGrid.tsx`): a "Browse" toggle by the popular row opens a
      card grid over the whole pool, filterable by type (up to 2, AND) and ability,
      sortable by usage % / BST / any base stat, with an "in usage data" toggle. The
      sticky search box doubles as a name filter for the grid, and its dropdown has
      a "view all N matches" jump. Still: role/archetype filter (needs role data).
- [~] Pokémon page: base stats, typing, abilities done; **Base/Mega form switcher** live (swaps art, typing, ability, Mega Stone, stats, matchups). The Mega/Primal stat block shows the per-stat delta vs the base form. Still: Champions-legal movepool with legality badges.
- [~] Move / ability / item **pages** shipped (`#move|ability|item/<slug>`, `EntityPage`): long-form effect, structured mechanics, curated notes, "run by" list. Still: a browsable move **dex** (grid/filter) and damage-roll numbers.
- [ ] Meta overview page (usage leaderboard, movable cutoff).
- [~] Sample-data pill + snapshot label + footer note; extend "which source" labelling as more sources land.
- [x] Responsive, mobile-first, dark theme (palette tokens in `styles.css`; a light mode / toggle could be added later).
- [x] Installable **PWA** — `vite-plugin-pwa` (Workbox) precaches the shell; fully offline (all data is bundled), sprites runtime-cached `CacheFirst`; `registerType: 'prompt'` shows a Reload toast on a new deploy (`components/UpdateToast.tsx`). Icons: `scripts/make-icons.mjs` (no deps). Still: real screenshots/shortcuts in the manifest, a Lighthouse PWA pass.
- [~] Accessibility pass — ranked-list rows and the form switcher are real buttons with `aria-expanded` / `aria-controls` / `role="tab"` + focus-visible outlines. The search box is now an ARIA combobox (`role="combobox"` + `aria-activedescendant` over a `role="listbox"`): ↑/↓ cycle a highlight through the results and the "view all" row, Enter runs the highlighted row, Escape clears. Still: a wider sweep (browse-grid filter controls, focus handling on hash-route change).

## Phase 7 — Usage & move analytics UI

- [x] Usage panel: usage %, win %, **common abilities** then **common moves** stacked, then a **Common items** section; each row expands in place (multiple at once) to short details, and links to the full move/ability/item page.
- [x] Items %, **EV spreads** and **teammates** shipped from the ladder ingest — `SpreadsPanel` (approx EVs, per-spread %) and `TeammatesPanel` (sprite chips, co-occurrence %, deep-link to each). Still: fold win rate + rating cutoffs in once a source that publishes them lands (Pikalytics).
- [~] Curated competitive-notes layer (`scripts/reference-notes.mjs`) covers a starter set of moves/abilities/items; extend as gaps show up, or replace with `@pkmn/dex` descriptions.
- [ ] Compare view: 2–4 Pokémon side by side.
- [ ] Trend charts: usage over time within a season (needs snapshot history from Phase 3).
- [ ] "Meta shift" diff between two regulations or two dates.

## Phase 8 — Automation

- [x] Scheduled ETL: `.github/workflows/refresh-data.yml` — weekly cron (06:00 UTC Monday) + `workflow_dispatch`. Source (Smogon monthly) only moves ~once a month, so weekly catches the drop within days and the commit-on-change guard makes the other runs cheap no-ops. Runs `ingest:usage` then `build:data` / `build:movedex` / `build:itemdex` / `build:megadex`, runs `npm test` as a schema/consistency guard, then commits `src/data` + `data/history` to `main` on change (with `version:bump`) → Vercel redeploys. `concurrency: refresh-data` (no cancel).
- [~] Alert on ingest failure / schema drift / unmapped names — the refresh workflow opens a GitHub issue on any failed step (`gh issue create` in an `if: failure()` step), and the `npm test` guard catches schema drift. Still: surface the ingester's unmapped-name report as a hard failure (needs an `--strict` flag on `ingest-usage.mjs`).
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
