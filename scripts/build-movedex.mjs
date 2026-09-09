// ETL: pull move + ability reference data from PokéAPI and write
// src/data/movedex.m-c.json
//
//   npm run build:movedex
//
// Re-run this whenever src/data/usage.m-c.json gains a move or ability that
// isn't in the movedex yet. The app never calls PokéAPI at runtime — it only
// reads the snapshot this script produces. Every move/ability referenced by the
// usage data gets an entry: a short line for the inline row, plus a long-form
// effect + structured mechanics + curated notes for its dedicated page.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ABILITY_NOTES, MOVE_NOTES } from './reference-notes.mjs'

const API = 'https://pokeapi.co/api/v2'
const HERE = dirname(fileURLToPath(import.meta.url))
const USAGE = join(HERE, '..', 'src', 'data', 'usage.m-c.json')
const OUT = join(HERE, '..', 'src', 'data', 'movedex.m-c.json')
const CONCURRENCY = 8

// PokéAPI resource names are mostly the display name lowercased with spaces →
// hyphens and punctuation dropped. Overrides cover the few that aren't.
const MOVE_SLUG_OVERRIDES = {}
const ABILITY_SLUG_OVERRIDES = {}

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

function subChance(text, chance) {
  return text.replace(
    /\$effect_chance%/g,
    chance != null ? `${chance}%` : 'a chance to',
  )
}

class NotFound extends Error {}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (res.status === 404) throw new NotFound(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// Champions has original moves / abilities PokéAPI will never carry. Emit a
// minimal record for those so the row + page still render (just without the
// mechanical breakdown) instead of failing the whole build.
function moveStub(name, slug) {
  return {
    name,
    slug,
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: null,
    pp: null,
    priority: 0,
    target: null,
    generation: null,
    minHits: null,
    maxHits: null,
    drain: 0,
    healing: 0,
    critRate: 0,
    ailment: null,
    ailmentChance: 0,
    flinchChance: 0,
    statChance: 0,
    statChanges: [],
    effect: '',
    longEffect: '',
    notes: MOVE_NOTES[name] ?? [],
    unlisted: true,
  }
}

function abilityStub(name, slug) {
  return {
    name,
    slug,
    generation: null,
    effect: '',
    longEffect: '',
    notes: ABILITY_NOTES[name] ?? [],
    unlisted: true,
  }
}

async function fetchMove(name) {
  const slug = MOVE_SLUG_OVERRIDES[name] ?? slugify(name)
  let m
  try {
    m = await getJSON(`${API}/move/${slug}`)
  } catch (err) {
    if (err instanceof NotFound) return moveStub(name, slug)
    throw err
  }
  const meta = m.meta ?? {}
  const flavor = oneLine(m.flavor_text_entries, 'flavor_text')
  const short = subChance(oneLine(m.effect_entries, 'short_effect'), m.effect_chance)
  const long = subChance(multiLine(m.effect_entries, 'effect'), m.effect_chance)

  return {
    name,
    slug,
    type: m.type.name,
    category: m.damage_class?.name ?? 'status', // physical | special | status
    power: m.power ?? null,
    accuracy: m.accuracy ?? null, // null = never misses
    pp: m.pp ?? null,
    priority: m.priority ?? 0,
    target: m.target?.name ?? null,
    generation: m.generation?.name ?? null,
    minHits: meta.min_hits ?? null,
    maxHits: meta.max_hits ?? null,
    drain: meta.drain ?? 0, // >0 heals from damage dealt, <0 recoil
    healing: meta.healing ?? 0, // % of user max HP
    critRate: meta.crit_rate ?? 0, // crit-stage boost
    ailment:
      meta.ailment && meta.ailment.name !== 'none' ? meta.ailment.name : null,
    ailmentChance: meta.ailment_chance ?? 0,
    flinchChance: meta.flinch_chance ?? 0,
    statChance: meta.stat_chance ?? 0,
    statChanges: (m.stat_changes ?? []).map((s) => ({
      stat: s.stat.name,
      change: s.change,
    })),
    effect: short || flavor,
    longEffect: long || short || flavor,
    notes: MOVE_NOTES[name] ?? [],
  }
}

async function fetchAbility(name) {
  const slug = ABILITY_SLUG_OVERRIDES[name] ?? slugify(name)
  let a
  try {
    a = await getJSON(`${API}/ability/${slug}`)
  } catch (err) {
    if (err instanceof NotFound) return abilityStub(name, slug)
    throw err
  }
  const flavor = oneLine(a.flavor_text_entries, 'flavor_text')
  const short = oneLine(a.effect_entries, 'short_effect')
  const long = multiLine(a.effect_entries, 'effect')

  return {
    name,
    slug,
    generation: a.generation?.name ?? null,
    effect: short || flavor,
    longEffect: long || short || flavor,
    notes: ABILITY_NOTES[name] ?? [],
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
  const moveNames = new Set()
  const abilityNames = new Set()
  for (const entry of Object.values(usage.entries)) {
    for (const m of entry.moves ?? []) moveNames.add(m.name)
    for (const a of entry.abilities ?? []) abilityNames.add(a.name)
  }

  const moveList = [...moveNames].sort()
  const abilityList = [...abilityNames].sort()
  console.log(
    `Fetching ${moveList.length} moves + ${abilityList.length} abilities from PokéAPI…`,
  )

  const [moves, abilities] = await Promise.all([
    pool(moveList, CONCURRENCY, fetchMove),
    pool(abilityList, CONCURRENCY, fetchAbility),
  ])

  // Genuinely dropped (network errors, not 404s) — worth a loud warning.
  const dropped = [
    ...moveList.filter((n) => !moves.some((m) => m.name === n)),
    ...abilityList.filter((n) => !abilities.some((a) => a.name === n)),
  ]
  if (dropped.length) {
    console.error(`\nDROPPED (retry the ETL): ${dropped.join(', ')}`)
    process.exit(1)
  }

  const stubs = [...moves, ...abilities].filter((x) => x.unlisted).map((x) => x.name)
  if (stubs.length) {
    console.log(
      `\nNot in PokéAPI (likely Champions-original) — stubbed: ${stubs.join(', ')}`,
    )
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'PokéAPI (pokeapi.co) v2',
    moveCount: moves.length,
    abilityCount: abilities.length,
    moves: moves.sort((a, b) => a.name.localeCompare(b.name)),
    abilities: abilities.sort((a, b) => a.name.localeCompare(b.name)),
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(
    `\nWrote ${moves.length} moves + ${abilities.length} abilities to ${OUT}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
