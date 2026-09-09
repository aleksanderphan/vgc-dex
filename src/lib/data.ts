import type {
  AbilityInfo,
  MoveDex,
  MoveInfo,
  Pokemon,
  PokemonSnapshot,
  Regulation,
  UsageEntry,
  UsageSnapshot,
} from '../types'
import pokemonJson from '../data/pokemon.json'
import usageJson from '../data/usage.m-c.json'
import regulationJson from '../data/regulation.m-c.json'
import movedexJson from '../data/movedex.m-c.json'

const snapshot = pokemonJson as unknown as PokemonSnapshot

export const POKEMON_SOURCE = snapshot.source
export const POKEMON_GENERATED_AT = snapshot.generatedAt

export const POKEMON: Pokemon[] = [...snapshot.pokemon].sort((a, b) =>
  a.name.localeCompare(b.name),
)

export const USAGE = usageJson as unknown as UsageSnapshot
export const REGULATION = regulationJson as unknown as Regulation
export const MOVEDEX = movedexJson as unknown as MoveDex

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '')

const moveByName = new Map(MOVEDEX.moves.map((m) => [normalize(m.name), m]))
const abilityByName = new Map(
  MOVEDEX.abilities.map((a) => [normalize(a.name), a]),
)

export function moveInfo(name: string): MoveInfo | undefined {
  return moveByName.get(normalize(name))
}

export function abilityInfo(name: string): AbilityInfo | undefined {
  return abilityByName.get(normalize(name))
}

const bySlug = new Map(POKEMON.map((p) => [p.slug, p]))

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
