// ETL: pull held-item reference data from PokéAPI and write
// src/data/itemdex.m-c.json
//
//   npm run build:itemdex
//
// Re-run this whenever src/data/usage.m-c.json gains an item that isn't in the
// itemdex yet. The app never calls PokéAPI at runtime — it only reads the
// snapshot this script produces. Every item named in the usage data gets an
// entry so the "Common items" section can expand a row into its details.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ITEM_NOTES } from './reference-notes.mjs'

const API = 'https://pokeapi.co/api/v2'
const HERE = dirname(fileURLToPath(import.meta.url))
const USAGE = join(HERE, '..', 'src', 'data', 'usage.m-c.json')
const OUT = join(HERE, '..', 'src', 'data', 'itemdex.m-c.json')
const CONCURRENCY = 8

const SLUG_OVERRIDES = {}

// PokéAPI has no effect / flavor text for some newer items — fill those in.
const EFFECT_OVERRIDES = {
  'Clear Amulet':
    "Held: prevents the holder's stats from being lowered by other Pokémon.",
  'Covert Cloak':
    'Held: protects the holder from the additional effects of attacking moves.',
  'Loaded Dice':
    'Held: the holder’s multi-hit moves always hit at least four times.',
  'Mirror Herb':
    "Held: when an opposing Pokémon's stats rise, the holder copies the boost once, then the herb is used up.",
  'Booster Energy':
    'Held: activates the holder’s Protosynthesis or Quark Drive, boosting its highest stat.',
}

// Long-form fallback where PokéAPI has no `effect` entry at all.
const LONG_OVERRIDES = {
  'Clear Amulet':
    "Held: the holder's stats cannot be lowered by any other Pokémon — Intimidate, Snarl, Icy Wind, Parting Shot, Sticky Web, etc.\nSelf-inflicted drops (Close Combat, Draco Meteor, Overheat, Superpower) still apply.",
  'Covert Cloak':
    'Held: the holder ignores the additional effects of attacking moves used against it — flinch (Rock Slide, Fake Out), burn (Scald), stat drops (Make It Rain), Salt Cure residual, and so on.\nThe primary effect of a status move is unaffected (Thunder Wave still paralyses).',
  'Loaded Dice':
    'Held: multi-hit moves that would roll 2–5 hits instead hit 4–5 times.\nFor Triple Axel and Triple Kick it removes the accuracy check on the later hits rather than adding hits.',
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[’'.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** One-line text: newlines → spaces, whitespace collapsed. */
function oneLine(entries, key) {
  const en = entries.filter((e) => e.language.name === 'en')
  const val = (en[en.length - 1] ?? en[0])?.[key] ?? ''
  return val.replace(/\s+/g, ' ').trim()
}

/** Multi-line text: paragraph breaks kept, runs of spaces/newlines tidied. */
function multiLine(entries, key) {
  const en = entries.filter((e) => e.language.name === 'en')
  const val = (en[en.length - 1] ?? en[0])?.[key] ?? ''
  return val
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function fetchItem(name) {
  const slug = SLUG_OVERRIDES[name] ?? slugify(name)
  const d = await getJSON(`${API}/item/${slug}`)
  const short =
    EFFECT_OVERRIDES[name] ||
    oneLine(d.effect_entries, 'short_effect') ||
    oneLine(d.flavor_text_entries, 'text')
  const long =
    multiLine(d.effect_entries, 'effect') ||
    LONG_OVERRIDES[name] ||
    short ||
    oneLine(d.flavor_text_entries, 'text')
  return {
    name,
    slug,
    category: d.category?.name ?? null,
    sprite: d.sprites?.default ?? null,
    flingPower: d.fling_power ?? null,
    effect: short,
    longEffect: long,
    notes: ITEM_NOTES[name] ?? [],
  }
}

async function pool(items, size, fn) {
  const out = new Array(items.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++
      try {
        out[i] = await fn(items[i])
        process.stdout.write(`  ok   ${items[i]}\n`)
      } catch (err) {
        process.stdout.write(`  SKIP ${items[i]} — ${String(err)}\n`)
        out[i] = null
      }
    }
  }
  await Promise.all(Array.from({ length: size }, worker))
  return out.filter(Boolean)
}

async function main() {
  const usage = JSON.parse(await readFile(USAGE, 'utf8'))
  const names = new Set()
  for (const entry of Object.values(usage.entries)) {
    for (const it of entry.items ?? []) names.add(it.name)
  }

  const list = [...names].sort()
  console.log(`Fetching ${list.length} items from PokéAPI…`)
  const items = await pool(list, CONCURRENCY, fetchItem)

  const missing = list.filter((n) => !items.some((it) => it.name === n))
  if (missing.length) {
    console.error(
      `\n${missing.length} item(s) did not resolve — add a slug override:\n  ${missing.join('\n  ')}`,
    )
    process.exit(1)
  }

  const noEffect = items.filter((it) => !it.effect).map((it) => it.name)
  if (noEffect.length) {
    console.warn(
      `\nNo effect text for: ${noEffect.join(', ')} — add to EFFECT_OVERRIDES.`,
    )
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'PokéAPI (pokeapi.co) v2',
    itemCount: items.length,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`\nWrote ${items.length} items to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
