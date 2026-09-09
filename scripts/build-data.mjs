// ETL: pull reference data from PokéAPI and write src/data/pokemon.json
//
//   npm run build:data
//
// Re-run this whenever the pool in pokemon-list.mjs changes or PokéAPI data
// updates. The app never calls PokéAPI at runtime — it only reads the snapshot
// this script produces.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { REG_MC_POKEMON } from './pokemon-list.mjs'

const API = 'https://pokeapi.co/api/v2'
const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'src', 'data', 'pokemon.json')
const CONCURRENCY = 5

const STAT_KEY = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
}

const REGION_PREFIX = {
  alola: 'Alolan',
  galar: 'Galarian',
  hisui: 'Hisuian',
  paldea: 'Paldean',
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function autoDisplay(slug) {
  const parts = slug.split('-')
  for (const [key, prefix] of Object.entries(REGION_PREFIX)) {
    if (parts.includes(key)) {
      return `${prefix} ${titleCase(parts.filter((p) => p !== key).join('-'))}`
    }
  }
  return titleCase(slug)
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function fetchPokemon(entry) {
  const slug = typeof entry === 'string' ? entry : entry.slug
  const display =
    typeof entry === 'string'
      ? autoDisplay(slug)
      : (entry.display ?? autoDisplay(slug))
  const apiSlug = typeof entry === 'string' ? slug : (entry.api ?? slug)
  const p = await getJSON(`${API}/pokemon/${apiSlug}`)

  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  for (const s of p.stats) {
    const key = STAT_KEY[s.stat.name]
    if (key) baseStats[key] = s.base_stat
  }

  const abilities = [...p.abilities]
    .sort((a, b) => a.slot - b.slot)
    .map((a) => ({
      slug: a.ability.name,
      name: titleCase(a.ability.name),
      isHidden: a.is_hidden,
    }))

  const types = [...p.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)

  const artwork =
    p.sprites?.other?.['official-artwork']?.front_default ??
    p.sprites?.front_default ??
    ''
  const sprite = p.sprites?.front_default ?? artwork

  return {
    id: p.id,
    slug,
    name: display,
    types,
    baseStats,
    abilities,
    sprite,
    artwork,
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
        const slug = typeof items[i] === 'string' ? items[i] : items[i].slug
        process.stdout.write(`  ok  ${slug}\n`)
      } catch (err) {
        const slug = typeof items[i] === 'string' ? items[i] : items[i].slug
        process.stdout.write(`  SKIP ${slug} — ${String(err)}\n`)
        out[i] = null
      }
    }
  }
  await Promise.all(Array.from({ length: size }, worker))
  return out.filter(Boolean)
}

async function main() {
  console.log(`Fetching ${REG_MC_POKEMON.length} Pokémon from PokéAPI…`)
  const pokemon = await pool(REG_MC_POKEMON, CONCURRENCY, fetchPokemon)
  pokemon.sort((a, b) => a.id - b.id)

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'PokéAPI (pokeapi.co) v2',
    count: pokemon.length,
    pokemon,
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`\nWrote ${pokemon.length} Pokémon to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
