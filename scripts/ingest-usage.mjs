// Ingest real usage stats for the Pokémon Champions VGC format and write
// src/data/usage.m-c.json (replacing the hand-authored sample).
//
//   npm run ingest:usage                     fetch + write canonical + history
//   node scripts/ingest-usage.mjs --from f   normalize a local raw payload
//   node scripts/ingest-usage.mjs --dry-run  normalize, write nothing
//
// Structure: a `SOURCES` registry maps a source id to an adapter that knows how
// to fetch that source and `normalize(raw, poolNames)` it into our schema. Only
// `smogon` is wired up today; Pikalytics / Pokémon Zone / official Battle Data
// slot in as sibling adapters without touching `main()`.
//
// Every run:
//   - retains the raw upstream payload gzipped in data/raw/ (git-ignored local
//     cache; its sha256 is recorded in the snapshot `meta` for verification)
//   - writes the canonical src/data/usage.m-c.json (the app imports this)
//   - appends a dated copy to data/history/ (never overwritten across days)
//
// After a real run, re-run `npm run build:movedex` and `npm run build:itemdex`
// if the move / ability / item lists changed, so every name resolves to a
// detail entry.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const POKEMON = join(ROOT, 'src', 'data', 'pokemon.json')
const OUT = join(ROOT, 'src', 'data', 'usage.m-c.json')
const RAW_DIR = join(ROOT, 'data', 'raw')
const HISTORY_DIR = join(ROOT, 'data', 'history')

const REGULATION = 'M-C'
const FORMAT = 'gen9championsvgc2026'

// Keep the lists tight enough to stay readable in the UI (and the generated
// movedex / itemdex small) — a VGC set is only 4 moves, so anything below a few
// percent is deep noise.
const CAPS = { abilities: 5, moves: 12, items: 8, spreads: 5, teammates: 10 }
const MIN_PCT = { abilities: 1.0, moves: 3.0, items: 3.0, spreads: 3.0, teammates: 8.0 }

const round1 = (n) => Math.round(n * 10) / 10
const EV_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']

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
    .map((it) => ({ name: it.name, pct: round1(it.pct) }))
}

// Smogon's "chaos" spreads store each EV bucketed to ~1/8 of the real value
// (so "32" ≈ 252, and every spread's buckets sum to 66). Scale back up, snap to
// a legal multiple of 4, cap at 252, then shave the rounding overflow off the
// least-invested stats so the spread lands on a legal 508 total. Approximate.
function realEvs(evStr) {
  const parts = String(evStr).split('/').map(Number)
  const evs = EV_KEYS.map((_, i) =>
    Math.min(252, Math.round(((parts[i] || 0) * 8) / 4) * 4),
  )
  let over = evs.reduce((a, b) => a + b, 0) - 508
  while (over > 0) {
    let idx = -1
    evs.forEach((v, i) => {
      if (v > 0 && (idx < 0 || v < evs[idx])) idx = i
    })
    if (idx < 0) break
    const cut = Math.min(evs[idx], Math.ceil(over / 4) * 4)
    evs[idx] -= cut
    over -= cut
  }
  return Object.fromEntries(EV_KEYS.map((k, i) => [k, evs[i]]))
}

/** Usage-weighted merge of the "Nature:evs" spread map across a group of formes. */
function mergeSpreads(group, totalWeight) {
  const acc = new Map()
  for (const e of group) {
    const w = e.usage.weighted
    for (const [k, frac] of Object.entries(e.spreads ?? {})) {
      if (!k || k === 'Other') continue
      acc.set(k, (acc.get(k) ?? 0) + frac * w)
    }
  }
  return [...acc]
    .map(([raw, wsum]) => {
      const [nature, evStr = ''] = raw.split(':')
      return { nature, evs: realEvs(evStr), pct: (wsum / totalWeight) * 100 }
    })
    .filter((s) => s.pct >= MIN_PCT.spreads)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, CAPS.spreads)
    .map((s) => ({ nature: s.nature, evs: s.evs, pct: round1(s.pct) }))
}

/**
 * Merge the teammate map across the subject's formes into base-species slugs.
 * Smogon stores each teammate as a "lift" over its own base usage; adding that
 * usage back gives the fraction of the subject's teams that carry the teammate.
 */
function mergeTeammates(group, totalWeight, poolNames, rawWeighted) {
  const acc = new Map()
  for (const e of group) {
    const w = e.usage.weighted
    for (const [tname, lift] of Object.entries(e.teammates ?? {})) {
      const tslug = toSlug(baseName(tname))
      if (!poolNames.has(tslug)) continue
      const coOcc = lift + (rawWeighted.get(tname) ?? 0)
      if (coOcc <= 0) continue
      acc.set(tslug, (acc.get(tslug) ?? 0) + coOcc * w)
    }
  }
  return [...acc]
    .map(([slug, wsum]) => ({
      slug,
      name: poolNames.get(slug),
      pct: Math.min(100, (wsum / totalWeight) * 100),
    }))
    .filter((t) => t.pct >= MIN_PCT.teammates)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, CAPS.teammates)
    .map((t) => ({ slug: t.slug, name: t.name, pct: round1(t.pct) }))
}

// ── Per-source adapters ───────────────────────────────────────────────────────
// Each adapter: { id, label, season, ratingCutoff, url, disclaimer,
//                 battlesOf(raw), normalize(raw, poolNames) -> {entries, unmapped} }

const smogon = {
  id: 'smogon',
  label: 'Pokémon Showdown ladder — Smogon monthly stats (data.pkmn.cc)',
  season: `${FORMAT} (Showdown ladder)`,
  ratingCutoff: 'weighted (Smogon default)',
  url: `https://data.pkmn.cc/stats/${FORMAT}.json`,
  disclaimer:
    `Usage from the Pokémon Showdown SIMULATOR ladder for the ${FORMAT} format ` +
    `(Smogon monthly "chaos" stats via data.pkmn.cc), not the official in-game ` +
    `Champions ladder. Percentages are usage-weighted; Mega/Primal formes are ` +
    `merged into the base species. No win-rate is published for this source. ` +
    `Teammate % is co-occurrence on the same team; EV spreads are Smogon's ` +
    `bucketed spreads scaled back to approximate real EVs.`,
  battlesOf: (raw) => raw.battles ?? null,

  normalize(raw, poolNames) {
    const mons = raw.pokemon

    // Every raw Showdown forme name → its own weighted usage, for un-lifting the
    // teammate correlations back into plain co-occurrence percentages.
    const rawWeighted = new Map(
      Object.entries(mons).map(([name, e]) => [name, e.usage?.weighted ?? 0]),
    )

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
      if (!poolNames.has(slug)) {
        const use = group.reduce((s, e) => s + e.usage.weighted, 0) * 100
        unmapped.push({ base, slug, use })
        continue
      }
      const totalW = group.reduce((s, e) => s + e.usage.weighted, 0)
      if (totalW <= 0) continue

      const spreads = mergeSpreads(group, totalW)
      const teammates = mergeTeammates(
        group,
        totalW,
        poolNames,
        rawWeighted,
      ).filter((t) => t.slug !== slug)

      entries[slug] = {
        usagePct: round1(totalW * 100),
        abilities: trim(mergeDist(group, 'abilities', totalW), 'abilities'),
        moves: trim(mergeDist(group, 'moves', totalW), 'moves'),
        items: trim(mergeDist(group, 'items', totalW), 'items'),
        ...(spreads.length ? { spreads } : {}),
        ...(teammates.length ? { teammates } : {}),
      }
    }

    // Deterministic order: highest usage first.
    const ordered = Object.fromEntries(
      Object.entries(entries).sort((a, b) => b[1].usagePct - a[1].usagePct),
    )
    return { entries: ordered, unmapped }
  },
}

const SOURCES = { smogon }

// ─────────────────────────────────────────────────────────────────────────────

function reportUnmapped(unmapped) {
  unmapped.sort((a, b) => b.use - a.use)
  const notable = unmapped.filter((u) => u.use >= 0.5)
  if (!notable.length) return
  console.log(
    `\n${notable.length} Pokémon with ≥0.5% usage are NOT in the reference ` +
      `pool (add them to scripts/pokemon-list.mjs to cover them):`,
  )
  for (const u of notable.slice(0, 20)) {
    console.log(`  ${u.use.toFixed(2).padStart(6)}%  ${u.base}`)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const argVal = (name) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  const sourceId = argVal('--source') ?? 'smogon'
  const fromFile = argVal('--from')
  const dryRun = args.includes('--dry-run')

  const source = SOURCES[sourceId]
  if (!source) {
    throw new Error(
      `unknown --source "${sourceId}"; known: ${Object.keys(SOURCES).join(', ')}`,
    )
  }

  const poolNames = new Map(
    JSON.parse(await readFile(POKEMON, 'utf8')).pokemon.map((p) => [
      p.slug,
      p.name,
    ]),
  )

  let raw
  if (fromFile) {
    console.log(`Reading raw payload from ${fromFile} …`)
    raw = JSON.parse(await readFile(fromFile, 'utf8'))
  } else {
    console.log(`Fetching ${source.url} …`)
    raw = await getJSON(source.url)
  }

  const capturedAt = new Date().toISOString().slice(0, 10)
  const { entries, unmapped } = source.normalize(raw, poolNames)
  const rawBytes = Buffer.from(JSON.stringify(raw))
  const rawSha256 = createHash('sha256').update(rawBytes).digest('hex')

  const payload = {
    regulation: REGULATION,
    season: source.season,
    ratingCutoff: source.ratingCutoff,
    source: source.label,
    capturedAt,
    disclaimer: source.disclaimer,
    meta: {
      sourceId: source.id,
      sourceUrl: source.url,
      fetchedFrom: fromFile ? `local:${basename(fromFile)}` : source.url,
      battles: source.battlesOf(raw),
      entryCount: Object.keys(entries).length,
      rawSha256,
      rawPayload: null,
      generator: 'scripts/ingest-usage.mjs',
    },
    entries,
  }

  if (dryRun) {
    console.log(
      `[dry-run] ${payload.meta.entryCount} entries, ` +
        `raw sha256 ${rawSha256.slice(0, 12)}… — nothing written.`,
    )
    reportUnmapped(unmapped)
    return
  }

  // Retain the raw payload (gzipped) for local reproducibility. data/raw/ is
  // git-ignored — the sha256 above is the committed provenance record.
  await mkdir(RAW_DIR, { recursive: true })
  const rawName = `${source.id}.${FORMAT}.${capturedAt}.json.gz`
  await writeFile(join(RAW_DIR, rawName), gzipSync(rawBytes))
  payload.meta.rawPayload = `data/raw/${rawName}`

  const json = JSON.stringify(payload, null, 2) + '\n'

  // Canonical snapshot the app imports.
  await writeFile(OUT, json)

  // Dated history copy — one per capture day, never overwritten across days.
  await mkdir(HISTORY_DIR, { recursive: true })
  const histName = `usage.${REGULATION.toLowerCase()}.${capturedAt}.json`
  await writeFile(join(HISTORY_DIR, histName), json)

  const battles = source.battlesOf(raw)
  console.log(
    `\nWrote ${payload.meta.entryCount} entries:\n` +
      `  ${OUT}\n` +
      `  ${join(HISTORY_DIR, histName)}\n` +
      `  ${join(RAW_DIR, rawName)} (raw, gzipped)` +
      (battles ? `\n${battles.toLocaleString()} battles in the source.` : ''),
  )
  reportUnmapped(unmapped)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
