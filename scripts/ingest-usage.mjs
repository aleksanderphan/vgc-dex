// Ingest real usage stats for the Pokémon Champions VGC format and write
// src/data/usage.m-c.json (replacing the hand-authored sample).
//
//   npm run ingest:usage
//
// Source: Pokémon Showdown ladder usage, mirrored as clean monthly JSON by
// data.pkmn.cc (Smogon "chaos" stats). This is the SIMULATOR ladder, not the
// official in-game Champions ladder, and it carries no win-rate — both facts go
// in the snapshot's `disclaimer`.
//
// After running this, re-run `npm run build:movedex` and `npm run build:itemdex`
// so every move / ability / item the ingest introduces gets a detail entry.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const FORMAT = 'gen9championsvgc2026'
const SRC = `https://data.pkmn.cc/stats/${FORMAT}.json`
const HERE = dirname(fileURLToPath(import.meta.url))
const POKEMON = join(HERE, '..', 'src', 'data', 'pokemon.json')
const OUT = join(HERE, '..', 'src', 'data', 'usage.m-c.json')

// Keep the lists tight enough to stay readable in the UI (and the generated
// movedex / itemdex small) — a VGC set is only 4 moves, so anything below a few
// percent is deep noise.
const CAPS = { abilities: 5, moves: 12, items: 8 }
const MIN_PCT = { abilities: 1.0, moves: 3.0, items: 3.0 }

// Showdown display name → our internal slug, only where lower-casing isn't
// enough. (Most names — incl. "Rotom-Wash", "Ninetales-Alola" — map cleanly.)
const NAME_OVERRIDES = {
  'Basculegion-F': 'basculegion', // we model the male form as the species
  'Indeedee-F': 'indeedee',
  'Tatsugiri-Droopy': 'tatsugiri',
  'Tatsugiri-Stretchy': 'tatsugiri',
  'Maushold-Four': 'maushold',
}

const toSlug = (name) =>
  NAME_OVERRIDES[name] ??
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

// "Charizard-Mega-Y" / "Groudon-Primal" → base display name.
const baseName = (name) => name.replace(/-(Mega(-[XY])?|Primal)$/, '')
const isForme = (name) => /-(Mega(-[XY])?|Primal)$/.test(name)

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

/** Usage-weighted merge of a {name: fraction} map across a group of formes. */
function mergeDist(group, key, totalWeight) {
  const acc = new Map()
  for (const e of group) {
    const w = e.usage.weighted
    for (const [k, frac] of Object.entries(e[key] ?? {})) {
      if (!k || k === 'Nothing' || k === '') continue
      acc.set(k, (acc.get(k) ?? 0) + frac * w)
    }
  }
  return [...acc]
    .map(([name, wsum]) => ({ name, pct: (wsum / totalWeight) * 100 }))
    .sort((a, b) => b.pct - a.pct)
}

function trim(list, kind) {
  return list
    .filter((it) => it.pct >= MIN_PCT[kind])
    .slice(0, CAPS[kind])
    .map((it) => ({ name: it.name, pct: Math.round(it.pct * 10) / 10 }))
}

async function main() {
  const pool = new Set(
    JSON.parse(await readFile(POKEMON, 'utf8')).pokemon.map((p) => p.slug),
  )

  console.log(`Fetching ${SRC} …`)
  const stats = await getJSON(SRC)
  const mons = stats.pokemon

  // Group each base species with its Mega / Primal formes.
  const groups = new Map()
  for (const [name, entry] of Object.entries(mons)) {
    const base = baseName(name)
    if (!groups.has(base)) groups.set(base, [])
    groups.get(base).push({ name, forme: isForme(name), ...entry })
  }

  const entries = {}
  const unmapped = []
  for (const [base, group] of groups) {
    const slug = toSlug(base)
    if (!pool.has(slug)) {
      const use = group.reduce((s, e) => s + e.usage.weighted, 0) * 100
      unmapped.push({ base, slug, use })
      continue
    }
    const totalW = group.reduce((s, e) => s + e.usage.weighted, 0)
    if (totalW <= 0) continue

    entries[slug] = {
      usagePct: Math.round(totalW * 100 * 10) / 10,
      abilities: trim(mergeDist(group, 'abilities', totalW), 'abilities'),
      moves: trim(mergeDist(group, 'moves', totalW), 'moves'),
      items: trim(mergeDist(group, 'items', totalW), 'items'),
    }
  }

  // Deterministic order: highest usage first.
  const ordered = Object.fromEntries(
    Object.entries(entries).sort((a, b) => b[1].usagePct - a[1].usagePct),
  )

  const today = new Date().toISOString().slice(0, 10)
  const payload = {
    regulation: 'M-C',
    season: `${FORMAT} (Showdown ladder)`,
    ratingCutoff: 'weighted (Smogon default)',
    source: 'Pokémon Showdown ladder — Smogon monthly stats (data.pkmn.cc)',
    capturedAt: today,
    disclaimer:
      `Usage from the Pokémon Showdown SIMULATOR ladder for the ${FORMAT} format ` +
      `(Smogon monthly "chaos" stats via data.pkmn.cc), not the official in-game ` +
      `Champions ladder. Percentages are usage-weighted; Mega/Primal formes are ` +
      `merged into the base species. No win-rate is published for this source.`,
    entries: ordered,
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')

  console.log(
    `\nWrote ${Object.keys(ordered).length} entries to ${OUT} ` +
      `(${stats.battles.toLocaleString()} battles in the source).`,
  )
  unmapped.sort((a, b) => b.use - a.use)
  const notable = unmapped.filter((u) => u.use >= 0.5)
  if (notable.length) {
    console.log(
      `\n${notable.length} Pokémon with ≥0.5% usage are NOT in the reference ` +
        `pool (add them to scripts/pokemon-list.mjs to cover them):`,
    )
    for (const u of notable.slice(0, 20)) {
      console.log(`  ${u.use.toFixed(2).padStart(6)}%  ${u.base}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
