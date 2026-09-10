# Reg M‑C verification — Phase 2 blockers

Purpose: pin the facts that shape the `Regulation` schema (Phase 2) to primary
sources before encoding them. Status as of **2026‑09‑10**.

Legend: ✅ pinned to a primary/authoritative source · 🟡 partially pinned
(source disagreement or a secondary-only source) · ❌ open.

---

## 1. Reg M‑C legal Pokémon list + count — 🟡

**Primary source of truth:** Pokémon HOME. The Play! Pokémon VGC Tournament
Handbook (2026) §2.1.1 says regulation-set contents are defined in‑game and
"See Pokémon HOME for the current detailed list of eligible and restricted
Pokémon." There is no officially published _number_.

**What the official announcement confirms**
([pokemon.com, "Get Ready for Regulation Set M‑C"](https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions)):

- Everything legal in M‑A / M‑B stays legal.
- **+24 Pokémon** newly available for battle (e.g. Rillaboom, Salamence,
  Golisopod, Baxcalibur, Cinderace, Inteleon, Alolan Persian, both Indeedee,
  Pawmot).
- Same category bans as M‑A: no Restricted / Box Legendaries, Sub‑Legendaries,
  Mythicals, Paradox, Treasures of Ruin; Koraidon & Miraidon named explicitly.
  (Category list via [pokedaily.net M‑A](https://pokedaily.net/champions/regulations/).)
- Format-wide: **Battle Bond is banned** (Handbook §2.3).

**Total-count estimates (secondary, and they disagree — do not hard-code):**

| Source                                                                               | M‑C legal Pokémon   | M‑C legal items |
| ------------------------------------------------------------------------------------ | ------------------- | --------------- |
| [Pokémon Zone](https://www.pokemon-zone.com/champions/regulations/m-c/)              | 248                 | 154             |
| [MetaVGC](https://metavgc.com/regulations/regulationm-c)                             | 260                 | 166             |
| [Serebii](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml) | "M‑B + ~30 species" | —               |

**Action for Phase 2:** encode the pool as `M‑B pool ∪ {24 new}` minus the
banned categories, and treat the numeric count as _derived_ from the encoded
list, not asserted. Reconcile the final list against Serebii + Victory Road +
Pokémon HOME's in‑game list; flag any species where two sources disagree.

## 2. Full Mega list legal in M‑C + typing changes — 🟡

**Structure (authoritative):** M‑C legal Megas = every Mega legal in M‑A +
M‑B's 16 new Megas + **6 new in M‑C**. Per‑set enumerations:
[Victory Road](https://victoryroad.pro/champions-regulations/),
[Serebii M‑B](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml).

**M‑C's 6 new Megas** (names confirmed by the official announcement; typings
per Serebii — **not yet cross-checked in‑game**, and MetaVGC lists different
typings, so treat as 🟡):

| Mega            | Serebii typing                | Serebii ability         | MetaVGC disagreement     |
| --------------- | ----------------------------- | ----------------------- | ------------------------ |
| Mega Salamence  | Dragon/Flying                 | Aerilate                | —                        |
| Mega Golisopod  | **Bug/Steel** (was Bug/Water) | Tough Claws (from base) | MetaVGC: stays Bug/Water |
| Mega Baxcalibur | Dragon/Ice                    | Thermal Exchange        | —                        |
| Mega Absol Z    | **Dark/Ghost** (Z‑Mega)       | Sharpness               | MetaVGC: Dark/Fairy      |
| Mega Garchomp Z | Dragon (mono)                 | Levitate                | MetaVGC: Dragon/Ground   |
| Mega Lucario Z  | Fighting/Steel                | Aura Guard              | —                        |

**M‑B new Megas** (Serebii): Raichu‑X, Raichu‑Y, Sceptile (+Dragon,
Lightning Rod), Blaziken, Swampert, Mawile, Metagross, Staraptor
(→ Fighting/Flying, Contrary), Scolipede, Scrafty, Eelektross, Pyroar,
Malamar, Barbaracle (→ Rock/Fighting), Dragalge, Falinks.

**Action for Phase 2:** the megadex ETL currently auto-discovers 61 Mega bases
from PokéAPI — that is _not_ the M‑C-legal set. Build an explicit
`megasLegal` list per regulation from the per-set pages above, with a
`typeOverride` / `abilityOverride` per Champions-original Mega, and cite the
in‑game data screen once the game can be checked directly.

## 3. Banned moves / items + new item list — 🟡

**Banned moves:** none found. No M‑series regulation has published a move
ban; the only mechanic-level ban is the **Battle Bond** ability (Handbook
§2.3). Terastallization does not exist in Champions, so no Tera Blast / Tera
type to consider.

**Banned items:** none found beyond the standard **Item Clause** (no two
Pokémon may hold the same item, Handbook §2.2) and "obtainable through normal
gameplay". Mega Stones are legal items; only one Mega Evolution per battle.

**New items in M‑C** — the official announcement says **12 held items** added;
[Serebii](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml)
enumerates them:

> Leek, Rocky Helmet, Air Balloon, Red Card, Binding Band, Eject Button,
> Normal Gem, Terrain Extender, Electric Seed, Psychic Seed, Misty Seed,
> Grassy Seed

(plus the 6 new Mega Stones, counted separately). MetaVGC's "18 new items"
figure folds the Mega Stones in and adds Grassy Seed/Rocky Helmet etc. —
same set, different bookkeeping.

**Action for Phase 2:** encode `itemsLegal` as an allow-list built from the
per-set additions; the numeric "154 vs 166" disagreement dissolves once the
list is explicit. Item Clause + Mega-per-battle are team-validation rules, not
list entries.

## 4. Base-format details (Bo1/Bo3, timers, open sheet) — ✅

Source: **[Play! Pokémon VGC Tournament Handbook, 2026 season (EN)](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-vgc-tournament-handbook-en.pdf)**
(local copy parsed; 22 pp.). These are TPCi-wide, not per-regulation.

| Rule                      | Value                                                                                                                                                                                                  | Handbook §  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| Battle style              | Double Battle                                                                                                                                                                                          | 4.1         |
| Team                      | Register **4–6**, bring **4** (Team Preview picks 4, order sets leads)                                                                                                                                 | 2.1 / 4.1   |
| Level                     | Above/below 50 allowed, auto-set to **Lv. 50** in battle                                                                                                                                               | 2.3         |
| **Bo1 vs Bo3**            | Swiss: **TO's discretion, Bo1 or Bo3**; **Bo3 strongly recommended at Regional level and above**; **any top cut must be Bo3**                                                                          | 4.2         |
| Round time                | **None** — matches run their full course (up to 3 games)                                                                                                                                               | 4.2         |
| Team Preview timer        | **90 seconds**                                                                                                                                                                                         | 4.3.1       |
| Move timer                | **45 seconds** per turn                                                                                                                                                                                | 4.3.1       |
| Player time ("Your Time") | **7 minutes**                                                                                                                                                                                          | 4.3.1       |
| Game time                 | **20 minutes**                                                                                                                                                                                         | 4.3.1       |
| Species Clause            | No two Pokémon with the same **National Pokédex number**                                                                                                                                               | 2.3         |
| Item Clause               | No two Pokémon holding the same item                                                                                                                                                                   | 2.2         |
| Banned ability            | **Battle Bond**                                                                                                                                                                                        | 2.3         |
| Open team sheets          | **Whole 2026 VGC season is open team list.** All team-list info is shared with the opponent **except the Pokémon's stats** (EV/IV "stat alignment" stays hidden). Submitted via RK9 Team List Creator. | 2.4 / 2.4.1 |

Championship Series competitions auto-enforce the four timers above; Play!
Pokémon may revise them mid-season.

## 5. M‑A / M‑B rosters + Megas (for the historical switcher) — 🟡

| Reg     | Active              | Roster                                                                                                                                                                                                               | Megas                                           | Sources                                                                                                                                                                                                                            |
| ------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M‑A** | 8 Apr – 17 Jun 2026 | Limited roster; all Restricted/Legendary/Mythical/Paradox/Treasures-of-Ruin banned, Koraidon & Miraidon explicit; Battle Bond banned                                                                                 | Base-game Megas only, any obtainable Mega Stone | [Serebii M‑A](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-a.shtml), [pokedaily M‑A](https://pokedaily.net/champions/regulations/)                                                                            |
| **M‑B** | 17 Jun – 9 Sep 2026 | M‑A + **~22–27 new** (Vileplume, Sceptile, Blaziken, Swampert, Mawile, Metagross, Staraptor, Scrafty, Eelektross, Pyroar, Malamar, Barbaracle, Dragalge, Grimmsnarl, Annihilape, Gholdengo, …). Used at 2026 Worlds. | M‑A Megas + **16 new** (see §2)                 | [Serebii M‑B](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml), [Victory Road](https://victoryroad.pro/champions-regulations/), [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-B) |

**Action:** the switcher only needs _diffs_ between sets; encode M‑A as the
base list and M‑B / M‑C as `+species` / `+megas` / `+items` deltas. Serebii's
per-set pages are the cleanest enumerated source; Victory Road has the same
data as images.

## 6. Official in-game Battle Data — extractable? — ✅ (via community mirror)

**In-game:** Battle → Battle Data → _Ranked Battles_ or _Online Competitions_;
`X` toggles Singles/Doubles; pick a Pokémon for its top moves / items /
teammates / spreads / abilities. Updated daily. No in-game export.

**Machine-readable mirror:** **[championsbattledata.com](https://championsbattledata.com/)**
— a third-party fan project (explicitly _not_ official) that mirrors the
in-game Battle Data with a documented, **auth-free JSON API**
([API guide](https://championsbattledata.com/api_guide)):

| Endpoint                                               | Returns                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `GET /api` (or `/api/index`)                           | all Pokémon, Showdown IDs, available formats, file paths, sprites, base stats |
| `GET /api/pokemon/:name?format=Doubles&season=Current` | indexed record + daily data                                                   |
| `GET /api/battle/:format/:name`                        | parsed CSV rows: moves, items, teammates, natures, spreads, abilities         |
| `GET /api/metadata/:name`                              | all forms for a Pokémon with stats + abilities                                |
| static                                                 | CSV / JSON / PNG under `/pokemon_champions_assets/`                           |

- `format` = `Doubles` \| `Singles`; `season` = `Current` (default) or an
  archived id like `M4`.
- `?days=N` (1–31) returns the last N daily snapshots in `DD_MM_YYYY` folders,
  newest first.
- Names use Showdown internal ids (`garchomp`, `raichualola`,
  `taurospaldeaaqua`) — matches our existing `toSlug` / override table.
- No stated rate limit; be polite, cache, keep raw payloads (as the Smogon
  ingester already does).

**Action:** add a `championsBattleData` adapter to the `SOURCES` registry in
`scripts/ingest-usage.mjs` (one `normalize(raw, poolNames)` like `smogon`).
This is the closest thing to the "official meta" source. Attribute it clearly
as a fan mirror of in-game data, not official.

## 7. Pikalytics + Pokémon Zone licensing — ✅

### Pikalytics — **OK to ingest, politely + with attribution**

- `robots.txt`: `User-agent: * / Allow: /` (only `/.tmp/`, `/node_modules/`
  disallowed). Explicitly _allows_ AI/data crawlers (ClaudeBot, GPTBot, etc.).
- Publishes **AI-oriented endpoints** for exactly this use:
  `GET /ai/pokedex/[format]/[pokemon]` → Markdown usage stats,
  `/ai/tournaments/...`, `/ai/team-usage`, plus `llms.txt` / `llms-full.txt`
  and Champions sitemaps
  (`sitemapgen9championsvgc2026regmc.xml`, `sitemapbattledataregmbs3.xml`).
- Champions default format id: `battledataregmbs3` (will roll to a `...regmc...`
  id). Formats include "Best of 3 Regulation Set M‑A/M‑B".
- No formal ToS page; footer is only a trademark notice
  ("Pokemon and All Respective Names are Trademark & © of Nintendo 1996‑2026").
  There is a "Support Us" Ko‑fi link.
- **Verdict:** ingest via the `/ai/...` endpoints (they are the sanctioned
  path), low request rate, cache, keep raw payloads, credit Pikalytics with a
  link on every derived view. Adds win rate + rating cutoffs the Smogon source
  lacks. If we ship it publicly, send them a courtesy note via the Ko‑fi /
  Twitter contact.

### Pokémon Zone — **do NOT ingest programmatically**

- ToS prohibits accessing "any website, server, software application, or other
  computer resource owned or licensed by the Company through any robot,
  spider, scraper, crawler or other automated means **for any purpose**."
  ([Terms](https://www.pokemon-zone.com/terms/) — Cloudflare-gated; wording via
  search index.)
- `robots.txt` disallows `/api/`, `*/assets/`, `/champions/set-source/`.
- **Verdict:** drop Pokémon Zone as an _ingest_ source. It can still be cited
  as a human-readable cross-reference in docs, but no automated pull. Use
  championsbattledata.com as the "official-style" source instead and Pikalytics
  for win rate.

---

## Sources

- [Play! Pokémon VGC Tournament Handbook 2026 (EN, PDF)](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-vgc-tournament-handbook-en.pdf)
- [pokemon.com — Get Ready for Regulation Set M‑C](https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions)
- [Victory Road — Champions Regulations](https://victoryroad.pro/champions-regulations/)
- [Serebii — Regulation M‑C](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml) · [M‑B](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml)
- [Pokémon Zone — Reg M‑C](https://www.pokemon-zone.com/champions/regulations/m-c/) · [Terms](https://www.pokemon-zone.com/terms/)
- [MetaVGC — Regulation M‑C](https://metavgc.com/regulations/regulationm-c)
- [pokedaily.net — Champions regulations](https://pokedaily.net/champions/regulations/)
- [Bulbapedia — Regulation Set M‑B](https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-B)
- [championsbattledata.com](https://championsbattledata.com/) · [API guide](https://championsbattledata.com/api_guide)
- [Pikalytics](https://www.pikalytics.com/) · [llms.txt](https://www.pikalytics.com/llms.txt) · [robots.txt](https://www.pikalytics.com/robots.txt)
