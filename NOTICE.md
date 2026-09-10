# NOTICE — third-party data & trademarks

`vgc-dex` is an **unofficial fan project**. It is not affiliated with, endorsed
by, or sponsored by Nintendo, The Pokémon Company, Game Freak, or Creatures Inc.
Pokémon, Pokémon character names, and Pokémon Champions are trademarks of
Nintendo / The Pokémon Company. They are used here for identification and
commentary only.

The project's own source code is MIT-licensed ([LICENSE](LICENSE)). The bundled
data and hotlinked assets below are **not** the project's to relicense — each
keeps the terms of its source.

## Bundled / referenced data sources

| Source | What it provides | Where it lives | Terms |
| --- | --- | --- | --- |
| [PokéAPI](https://pokeapi.co) | Species, base stats, types, abilities, moves, items, Mega form data | `src/data/pokemon.json`, `movedex.m-c.json`, `itemdex.m-c.json`, `megadex.m-c.json` (built by `scripts/build-*.mjs`) | Free, non-commercial; see <https://pokeapi.co/docs/v2#fairuse>. Data cached at build time — never called at runtime. |
| PokéAPI sprite repo (`raw.githubusercontent.com/PokeAPI/sprites`) | Pokémon artwork / sprites | Hotlinked at runtime, service-worker `CacheFirst` | Sprites are property of their respective owners (Nintendo / Game Freak); redistributed by PokéAPI for community use. |
| [Smogon](https://www.smogon.com/stats/) usage stats, via [`data.pkmn.cc`](https://pkmn.github.io/smogon/) (`@pkmn/smogon`) | Monthly "chaos" usage: usage %, abilities, moves, items, EV spreads, teammates for `gen9championsvgc2026` | `src/data/usage.m-c.json` (built by `scripts/ingest-usage.mjs`) | Smogon / Pokémon Showdown community data. This is the **simulator ladder**, not the official in-game ladder — the UI labels it as such. |
| [@pkmn](https://pkmn.dev) packages | Referenced in docs / planned for battle-accurate legality (not yet a runtime dep) | — | MIT. |

## Curated content

`scripts/reference-notes.mjs` competitive notes and any hand-authored
Champions-original move/ability/item/Mega stubs are original editorial content by
this project's contributors, covered by [LICENSE](LICENSE).

## Regeneration

Every bundled JSON snapshot is reproducible from its `scripts/*.mjs` builder
against the upstream source. Re-run `npm run build:data`, `npm run build:movedex`,
`npm run build:itemdex`, `npm run build:megadex`, and `npm run ingest:usage` to
refresh.
