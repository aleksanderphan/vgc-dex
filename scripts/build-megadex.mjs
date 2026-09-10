// ETL: pull every Mega Evolution / Primal form for the pool from PokéAPI and
// write src/data/megadex.m-c.json
//
//   npm run build:megadex
//
// The app never calls PokéAPI at runtime — it only reads this snapshot.
//
// Forms are auto-discovered: for each base in scripts/pokemon-list.mjs we read
// the species' `varieties` and keep any that look like `<base>-mega[-x|-y|-z]`
// or `<base>-primal`. That means Champions-original Megas (Mega Staraptor, Mega
// Raichu X/Y, Mega Delphox, the Z-Megas …) come through automatically as long as
// PokéAPI carries them — no per-Pokémon list to maintain here.
//
// Mega Stone names: STONE has the ones we want to pin; otherwise we probe the
// PokéAPI item endpoint for the obvious slugs and fall back to a derived name
// (logged, so a wrong guess is easy to spot and add to STONE).

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { REG_MC_POKEMON } from './pokemon-list.mjs'

const API = 'https://pokeapi.co/api/v2'
const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'src', 'data', 'megadex.m-c.json')

const STAT_KEY = {
  hp: 'hp',
  attack: 'atk',
  defense: 'def',
  'special-attack': 'spa',
  'special-defense': 'spd',
  speed: 'spe',
}

// base slug → { <form key> : <Mega Stone display name> }. Anything not listed is
// resolved from the item endpoint or a derived guess.
const STONE = {
  charizard: { 'mega-x': 'Charizardite X', 'mega-y': 'Charizardite Y' },
  venusaur: { mega: 'Venusaurite' },
  blastoise: { mega: 'Blastoisinite' },
  blaziken: { mega: 'Blazikenite' },
  swampert: { mega: 'Swampertite' },
  gallade: { mega: 'Galladite' },
  alakazam: { mega: 'Alakazite' },
  gengar: { mega: 'Gengarite' },
  kangaskhan: { mega: 'Kangaskhanite' },
  pinsir: { mega: 'Pinsirite' },
  aerodactyl: { mega: 'Aerodactylite' },
  ampharos: { mega: 'Ampharosite' },
  steelix: { mega: 'Steelixite' },
  heracross: { mega: 'Heracronite' },
  houndoom: { mega: 'Houndoominite' },
  sableye: { mega: 'Sablenite' },
  mawile: { mega: 'Mawilite' },
  aggron: { mega: 'Aggronite' },
  medicham: { mega: 'Medichamite' },
  manectric: { mega: 'Manectite' },
  sharpedo: { mega: 'Sharpedonite' },
  camerupt: { mega: 'Cameruptite' },
  altaria: { mega: 'Altarianite' },
  banette: { mega: 'Banettite' },
  absol: { mega: 'Absolite' },
  glalie: { mega: 'Glalitite' },
  lopunny: { mega: 'Lopunnite' },
  lucario: { mega: 'Lucarionite' },
  beedrill: { mega: 'Beedrillite' },
  pidgeot: { mega: 'Pidgeotite' },
  slowbro: { mega: 'Slowbronite' },
  abomasnow: { mega: 'Abomasite' },
  sceptile: { mega: 'Sceptilite' },
  audino: { mega: 'Audinite' },
  garchomp: { mega: 'Garchompite' },
  gardevoir: { mega: 'Gardevoirite' },
  gyarados: { mega: 'Gyaradosite' },
  metagross: { mega: 'Metagrossite' },
  salamence: { mega: 'Salamencite' },
  scizor: { mega: 'Scizorite' },
  tyranitar: { mega: 'Tyranitarite' },
}

function titleCase(slug) {
  return slug
    .split(/[-\s]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function itemExists(slug) {
  try {
    const it = await getJSON(`${API}/item/${slug}`)
    const en = it.names?.find((n) => n.language?.name === 'en')?.name
    return en || titleCase(slug)
  } catch {
    return null
  }
}

// Turn a variety name like "raichu-mega-x" / "kyogre-primal" into the switcher
// key, tab label and display name, relative to the base slug used in the app.
function classify(variety, baseSlug) {
  const m = variety.match(/-(mega-x|mega-y|mega-z|mega|primal)$/)
  const kind = m ? m[1] : 'mega'
  const Base = titleCase(baseSlug)
  switch (kind) {
    case 'mega-x':
      return { key: 'mega-x', label: 'Mega X', name: `Mega ${Base} X` }
    case 'mega-y':
      return { key: 'mega-y', label: 'Mega Y', name: `Mega ${Base} Y` }
    case 'mega-z':
      return { key: 'mega-z', label: 'Mega Z', name: `${Base}-Z` }
    case 'primal':
      return { key: 'primal', label: 'Primal', name: `Primal ${Base}` }
    default:
      return { key: 'mega', label: 'Mega', name: `Mega ${Base}` }
  }
}

// Best-effort Mega Stone name for a form.
async function resolveStone(baseSlug, key) {
  const pinned = STONE[baseSlug]?.[key]
  if (pinned) return pinned
  if (key === 'primal') return '' // held Orb, not a stone

  const suffix = key === 'mega-x' ? 'x' : key === 'mega-y' ? 'y' : key === 'mega-z' ? 'z' : ''
  const itemSuffix = suffix ? `-${suffix}` : ''
  const candidates = [
    `${baseSlug}ite${itemSuffix}`,
    `${baseSlug}nite${itemSuffix}`,
    `${baseSlug}ite-mega${itemSuffix}`,
  ]
  for (const c of candidates) {
    const name = await itemExists(c)
    if (name) return name
  }
  // PokéAPI carries no stone item for this form — don't invent a name. The card
  // just omits the Mega Stone line; pin the real name in STONE when known.
  console.log(`     (stone: none on PokéAPI for ${baseSlug} ${key} — add to STONE when known)`)
  return ''
}

async function fetchForm(baseSlug, variety) {
  const p = await getJSON(`${API}/pokemon/${variety}`)
  const meta = classify(variety, baseSlug)

  const baseStats = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
  for (const s of p.stats) {
    const k = STAT_KEY[s.stat.name]
    if (k) baseStats[k] = s.base_stat
  }

  const abilities = [...p.abilities]
    .sort((a, b) => a.slot - b.slot)
    .map((a) => ({
      slug: a.ability.name,
      name: titleCase(a.ability.name),
      isHidden: a.is_hidden,
    }))

  const types = [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)

  const artwork =
    p.sprites?.other?.['official-artwork']?.front_default ??
    p.sprites?.front_default ??
    ''
  const sprite = p.sprites?.front_default ?? artwork

  const stone = await resolveStone(baseSlug, meta.key)

  return {
    key: meta.key,
    label: meta.label,
    name: meta.name,
    stone,
    types,
    baseStats,
    abilities,
    sprite,
    artwork,
  }
}

// Discover the Mega/Primal varieties for one pool entry.
async function discover(entry) {
  const slug = typeof entry === 'string' ? entry : entry.slug
  const api = typeof entry === 'string' ? entry : (entry.api ?? entry.slug)
  let species
  try {
    const p = await getJSON(`${API}/pokemon/${api}`)
    species = await getJSON(p.species.url)
  } catch {
    return null
  }

  const varieties = species.varieties.map((v) => v.pokemon.name)
  const isForm = api !== species.name // e.g. tatsugiri-curly, basculegion-male
  let megas = varieties.filter((n) => /-(mega(-[xyz])?|primal)$/.test(n))
  if (isForm) {
    // Keep only the megas that belong to this specific form; if none are
    // form-scoped, fall back to the plain species mega.
    const scoped = megas.filter((n) => n.startsWith(`${api}-`))
    megas = scoped.length ? scoped : megas.filter((n) => n === `${species.name}-mega`)
  }
  if (!megas.length) return null

  const forms = []
  for (const variety of megas) {
    try {
      const form = await fetchForm(slug, variety)
      forms.push(form)
      console.log(`  ok   ${form.name} (${form.types.join('/')})  stone: ${form.stone || '—'}`)
    } catch (err) {
      console.log(`  SKIP ${slug} ${variety} — ${String(err)}`)
    }
  }
  // Stable order: Mega, Mega X, Mega Y, Mega Z, Primal.
  const ORDER = { mega: 0, 'mega-x': 1, 'mega-y': 2, 'mega-z': 3, primal: 4 }
  forms.sort((a, b) => (ORDER[a.key] ?? 9) - (ORDER[b.key] ?? 9))
  return forms.length ? [slug, forms] : null
}

async function main() {
  console.log(`Scanning ${REG_MC_POKEMON.length} Pokémon for Mega / Primal forms…`)

  const forms = {}
  for (const entry of REG_MC_POKEMON) {
    const got = await discover(entry)
    if (got) forms[got[0]] = got[1]
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'PokéAPI (pokeapi.co) v2',
    baseCount: Object.keys(forms).length,
    forms,
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(`\nWrote Mega / Primal forms for ${Object.keys(forms).length} Pokémon to ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
