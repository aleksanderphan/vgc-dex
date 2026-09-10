import type {
  AbilityInfo,
  ItemDex,
  ItemInfo,
  MegaDex,
  MegaForm,
  MoveDex,
  MoveInfo,
  Pokemon,
  PokemonForm,
  PokemonSnapshot,
  Regulation,
  UsageEntry,
  UsageSnapshot,
} from '../types'
import pokemonJson from '../data/pokemon.json'
import usageJson from '../data/usage.m-c.json'
import regulationJson from '../data/regulation.m-c.json'
import movedexJson from '../data/movedex.m-c.json'
import itemdexJson from '../data/itemdex.m-c.json'
import megadexJson from '../data/megadex.m-c.json'

const snapshot = pokemonJson as unknown as PokemonSnapshot

export const POKEMON_SOURCE = snapshot.source
export const POKEMON_GENERATED_AT = snapshot.generatedAt

export const POKEMON: Pokemon[] = [...snapshot.pokemon].sort((a, b) =>
  a.name.localeCompare(b.name),
)

const bySlug = new Map(POKEMON.map((p) => [p.slug, p]))

export const USAGE = usageJson as unknown as UsageSnapshot
export const REGULATION = regulationJson as unknown as Regulation
export const MOVEDEX = movedexJson as unknown as MoveDex
export const ITEMDEX = itemdexJson as unknown as ItemDex
export const MEGADEX = megadexJson as unknown as MegaDex

/** true while the usage snapshot is the hand-authored placeholder, not an ingest. */
export const USAGE_IS_SAMPLE = /placeholder|sample/i.test(USAGE.source)

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

const moveByName = new Map(MOVEDEX.moves.map((m) => [normalize(m.name), m]))
const abilityByName = new Map(
  MOVEDEX.abilities.map((a) => [normalize(a.name), a]),
)
const itemByName = new Map(ITEMDEX.items.map((i) => [normalize(i.name), i]))

const moveBySlug = new Map(MOVEDEX.moves.map((m) => [m.slug, m]))
const abilityBySlug = new Map(MOVEDEX.abilities.map((a) => [a.slug, a]))
const itemBySlug = new Map(ITEMDEX.items.map((i) => [i.slug, i]))

export function moveInfo(name: string): MoveInfo | undefined {
  return moveByName.get(normalize(name))
}

export function abilityInfo(name: string): AbilityInfo | undefined {
  return abilityByName.get(normalize(name))
}

export function itemInfo(name: string): ItemInfo | undefined {
  return itemByName.get(normalize(name))
}

export type EntityKind = 'move' | 'ability' | 'item'

/** Look up a move / ability / item by its dedicated-page slug. */
export function entityBySlug(
  kind: EntityKind,
  slug: string,
): MoveInfo | AbilityInfo | ItemInfo | undefined {
  if (kind === 'move') return moveBySlug.get(slug)
  if (kind === 'ability') return abilityBySlug.get(slug)
  return itemBySlug.get(slug)
}

export interface EntityUser {
  slug: string
  name: string
  pct: number
}

/** Pokémon in the usage snapshot that run this move / ability / item. */
export function usersOf(kind: EntityKind, name: string): EntityUser[] {
  const key = normalize(name)
  const field =
    kind === 'move' ? 'moves' : kind === 'ability' ? 'abilities' : 'items'
  const out: EntityUser[] = []
  for (const [slug, entry] of Object.entries(USAGE.entries)) {
    const hit = (entry[field] ?? []).find((x) => normalize(x.name) === key)
    if (hit)
      out.push({ slug, name: bySlug.get(slug)?.name ?? slug, pct: hit.pct })
  }
  return out.sort((a, b) => b.pct - a.pct)
}

/** Mega Evolution forms for a Pokémon, or [] if it has none. */
export function megaFormsFor(slug: string): MegaForm[] {
  return MEGADEX.forms[slug] ?? []
}

/**
 * The base Pokémon plus any Mega forms, as a uniform list for the form switcher.
 * A single-element result means "no forms to switch between".
 */
export function formsFor(pokemon: Pokemon): PokemonForm[] {
  const base: PokemonForm = {
    key: 'base',
    label: 'Base',
    name: pokemon.name,
    types: pokemon.types,
    baseStats: pokemon.baseStats,
    abilities: pokemon.abilities,
    sprite: pokemon.sprite,
    artwork: pokemon.artwork,
  }
  // A few Mega forms come through with no ability listed (e.g. Mega Golisopod);
  // fall back to the base Pokémon's abilities so the switcher never shows a
  // blank ability row.
  const megas = megaFormsFor(pokemon.slug).map((m) =>
    m.abilities.length ? m : { ...m, abilities: pokemon.abilities },
  )
  return [base, ...megas]
}

export function findPokemon(slug: string): Pokemon | undefined {
  return bySlug.get(slug)
}

export function searchPokemon(query: string): Pokemon[] {
  const q = query.trim().toLowerCase()
  if (!q) return POKEMON
  return POKEMON.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.slug.replace(/-/g, ' ').includes(q) ||
      p.slug.includes(q),
  )
}

export function usageFor(slug: string): UsageEntry | undefined {
  return USAGE.entries[slug]
}

/** Slugs ordered by usage %, for the "popular" quick-pick row. */
export function popularSlugs(limit = 12): string[] {
  return Object.entries(USAGE.entries)
    .filter(([slug]) => bySlug.has(slug))
    .sort(([, a], [, b]) => (b.usagePct ?? 0) - (a.usagePct ?? 0))
    .slice(0, limit)
    .map(([slug]) => slug)
}
