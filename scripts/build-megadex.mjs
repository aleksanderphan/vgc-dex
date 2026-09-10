// ETL: pull Mega Evolution forms from PokéAPI and write src/data/megadex.m-c.json
//
//   npm run build:megadex
//
// The app never calls PokéAPI at runtime — it only reads this snapshot. Only
// bases that are in scripts/pokemon-list.mjs and actually have a Mega are worth
// listing here. Champions-original Megas that PokéAPI doesn't carry (e.g. Mega
// Baxcalibur, Mega Golisopod) would need to be hand-added to the output.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

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

// base slug (as used across the app) → the Mega form(s) to fetch.
//   api   — PokéAPI /pokemon/<…> slug for the form
//   key   — stable id used by the form switcher
//   label — tab text
//   stone — required Mega Stone (held item)
const M = (base, stone) => [
  { api: `${base}-mega`, key: 'mega', label: 'Mega', stone },
]

const MEGAS = {
  charizard: [
    {
      api: 'charizard-mega-x',
      key: 'mega-x',
      label: 'Mega X',
      stone: 'Charizardite X',
    },
    {
      api: 'charizard-mega-y',
      key: 'mega-y',
      label: 'Mega Y',
      stone: 'Charizardite Y',
    },
  ],
  venusaur: M('venusaur', 'Venusaurite'),
  blastoise: M('blastoise', 'Blastoisinite'),
  blaziken: M('blaziken', 'Blazikenite'),
  swampert: M('swampert', 'Swampertite'),
  gallade: M('gallade', 'Galladite'),
  alakazam: M('alakazam', 'Alakazite'),
  gengar: M('gengar', 'Gengarite'),
  kangaskhan: M('kangaskhan', 'Kangaskhanite'),
  pinsir: M('pinsir', 'Pinsirite'),
  aerodactyl: M('aerodactyl', 'Aerodactylite'),
  ampharos: M('ampharos', 'Ampharosite'),
  steelix: M('steelix', 'Steelixite'),
  heracross: M('heracross', 'Heracronite'),
  houndoom: M('houndoom', 'Houndoominite'),
  sableye: M('sableye', 'Sablenite'),
  mawile: M('mawile', 'Mawilite'),
  aggron: M('aggron', 'Aggronite'),
  medicham: M('medicham', 'Medichamite'),
  manectric: M('manectric', 'Manectite'),
  sharpedo: M('sharpedo', 'Sharpedonite'),
  camerupt: M('camerupt', 'Cameruptite'),
  altaria: M('altaria', 'Altarianite'),
  banette: M('banette', 'Banettite'),
  absol: M('absol', 'Absolite'),
  glalie: M('glalie', 'Glalitite'),
  lopunny: M('lopunny', 'Lopunnite'),
  lucario: M('lucario', 'Lucarionite'),
  beedrill: M('beedrill', 'Beedrillite'),
  pidgeot: M('pidgeot', 'Pidgeotite'),
  slowbro: M('slowbro', 'Slowbronite'),
  abomasnow: M('abomasnow', 'Abomasite'),
  sceptile: M('sceptile', 'Sceptilite'),
  audino: M('audino', 'Audinite'),
  garchomp: M('garchomp', 'Garchompite'),
  gardevoir: M('gardevoir', 'Gardevoirite'),
  gyarados: M('gyarados', 'Gyaradosite'),
  metagross: M('metagross', 'Metagrossite'),
  salamence: M('salamence', 'Salamencite'),
  scizor: M('scizor', 'Scizorite'),
  tyranitar: M('tyranitar', 'Tyranitarite'),
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'vgc-dex-etl' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function fetchForm(baseSlug, spec) {
  const p = await getJSON(`${API}/pokemon/${spec.api}`)

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
    key: spec.key,
    label: spec.label,
    name: `Mega ${titleCase(baseSlug)}${spec.label === 'Mega' ? '' : ` ${spec.label.replace(/^Mega /, '')}`}`,
    stone: spec.stone,
    types,
    baseStats,
    abilities,
    sprite,
    artwork,
  }
}

async function main() {
  const bases = Object.entries(MEGAS)
  console.log(`Fetching Mega forms for ${bases.length} Pokémon from PokéAPI…`)

  const forms = {}
  for (const [baseSlug, specs] of bases) {
    const got = []
    for (const spec of specs) {
      try {
        const form = await fetchForm(baseSlug, spec)
        got.push(form)
        process.stdout.write(`  ok   ${form.name} (${form.types.join('/')})\n`)
      } catch (err) {
        process.stdout.write(
          `  SKIP ${baseSlug} ${spec.api} — ${String(err)}\n`,
        )
      }
    }
    if (got.length) forms[baseSlug] = got
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'PokéAPI (pokeapi.co) v2',
    baseCount: Object.keys(forms).length,
    forms,
  }

  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  console.log(
    `\nWrote Mega forms for ${Object.keys(forms).length} Pokémon to ${OUT}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
