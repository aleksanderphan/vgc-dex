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
  'Fairy Feather': 'Held: Fairy-type moves from the holder do 20% more damage.',
  'Ability Shield': "Held: the holder's Ability cannot be changed or suppressed.",
  'Punching Glove':
    'Held: punching moves do 10% more damage and no longer make contact.',
  'Loaded Dice':
    'Held: the holder’s multi-hit moves always hit at least four times.',
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

class NotFound extends Error {}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (res.status === 404) throw new NotFound(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function fetchItem(name) {
  const slug = SLUG_OVERRIDES[name] ?? slugify(name)
  let d
  try {
    d = await getJSON(`${API}/item/${slug}`)
  } catch (err) {
    if (err instanceof NotFound) {
      // Champions-original item PokéAPI doesn't carry.
      return {
        name,
        slug,
        category: null,
        sprite: null,
        flingPower: null,
        effect: EFFECT_OVERRIDES[name] || '',
        longEffect: LONG_OVERRIDES[name] || EFFECT_OVERRIDES[name] || '',
        notes: ITEM_NOTES[name] ?? [],
        unlisted: true,
      }
    }
    throw err
  }
  // Champions adds Mega Stones for its original Megas; PokéAPI carries the item
  // but no text. Synthesise the standard "lets X Mega Evolve" line.
  const isStone =
    d.category?.name === 'all-mega-stones' || /ite( [XY])?$/.test(name)
  const stoneText = isStone
    ? `Held: lets the matching Pokémon Mega Evolve.`
    : ''

  const short =
    EFFECT_OVERRIDES[name] ||
    oneLine(d.effect_entries, 'short_effect') ||
    oneLine(d.flavor_text_entries, 'text') ||
    stoneText
  const long =
    multiLine(d.effect_entries, 'effect') ||
    LONG_OVERRIDES[name] ||
    short ||
    oneLine(d.flavor_text_entries, 'text') ||
    stoneText
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

  const dropped = list.filter((n) => !items.some((it) => it.name === n))
  if (dropped.length) {
    console.error(`\nDROPPED (retry the ETL): ${dropped.join(', ')}`)
    process.exit(1)
  }

  const stubs = items.filter((it) => it.unlisted).map((it) => it.name)
  if (stubs.length) {
    console.log(
      `\nNot in PokéAPI (likely Champions-original) — stubbed: ${stubs.join(', ')}`,
    )
  }
  const noEffect = items
    .filter((it) => !it.effect && !it.unlisted)
    .map((it) => it.name)
  if (noEffect.length) {
    console.warn(`\nNo effect text for: ${noEffect.join(', ')}`)
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
