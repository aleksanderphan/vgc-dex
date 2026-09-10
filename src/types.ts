export type TypeName =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface Ability {
  slug: string
  name: string
  isHidden: boolean
}

export interface Pokemon {
  id: number
  slug: string
  name: string
  types: TypeName[]
  baseStats: BaseStats
  abilities: Ability[]
  sprite: string
  artwork: string
}

export interface PokemonSnapshot {
  generatedAt: string
  source: string
  count: number
  pokemon: Pokemon[]
}

/** A Mega Evolution form, layered over its base Pokémon. */
export interface MegaForm {
  key: string
  label: string
  name: string
  stone: string
  types: TypeName[]
  baseStats: BaseStats
  abilities: Ability[]
  sprite: string
  artwork: string
}

export interface MegaDex {
  generatedAt: string
  source: string
  baseCount: number
  forms: Record<string, MegaForm[]>
}

/**
 * One selectable form in the Pokémon page's form switcher — the base Pokémon or
 * one of its Mega Evolutions, normalised to the same shape.
 */
export interface PokemonForm {
  key: string
  label: string
  name: string
  types: TypeName[]
  baseStats: BaseStats
  abilities: Ability[]
  sprite: string
  artwork: string
  stone?: string
}

export interface UsageItem {
  name: string
  pct: number
}

/** A common EV spread from the usage snapshot (EVs are approximate — see ingest). */
export interface UsageSpread {
  nature: string
  evs: BaseStats
  pct: number
}

/** A common teammate: `pct` is co-occurrence on the same team. */
export interface UsageTeammate {
  slug: string
  name: string
  pct: number
}

export interface UsageEntry {
  usagePct?: number
  winPct?: number
  abilities: UsageItem[]
  moves: UsageItem[]
  items?: UsageItem[]
  spreads?: UsageSpread[]
  teammates?: UsageTeammate[]
}

export type MoveCategory = 'physical' | 'special' | 'status'

export interface MoveStatChange {
  stat: string
  change: number
}

export interface MoveInfo {
  name: string
  slug: string
  type: TypeName
  category: MoveCategory
  /** null for status / variable-power moves. */
  power: number | null
  /** null means the move never misses. */
  accuracy: number | null
  pp: number | null
  priority: number
  target: string | null
  generation: string | null
  minHits: number | null
  maxHits: number | null
  /** >0 heals from damage dealt, <0 recoil, as a % of the amount. */
  drain: number
  /** flat heal as a % of the user's max HP. */
  healing: number
  critRate: number
  ailment: string | null
  ailmentChance: number
  flinchChance: number
  statChance: number
  statChanges: MoveStatChange[]
  /** one-liner for the inline row. */
  effect: string
  /** long-form effect for the move's page; may contain blank-line paragraphs. */
  longEffect: string
  /** curated competitive notes PokéAPI's text doesn't cover. */
  notes: string[]
  /** true when PokéAPI has no record (likely a Champions-original move). */
  unlisted?: boolean
}

export interface AbilityInfo {
  name: string
  slug: string
  generation: string | null
  effect: string
  longEffect: string
  notes: string[]
  unlisted?: boolean
}

export interface ItemInfo {
  name: string
  slug: string
  category: string | null
  sprite: string | null
  flingPower: number | null
  effect: string
  longEffect: string
  notes: string[]
  unlisted?: boolean
}

export interface ItemDex {
  generatedAt: string
  source: string
  itemCount: number
  items: ItemInfo[]
}

export interface MoveDex {
  generatedAt: string
  source: string
  moveCount: number
  abilityCount: number
  moves: MoveInfo[]
  abilities: AbilityInfo[]
}

export interface UsageSnapshot {
  regulation: string
  season: string
  ratingCutoff: string
  source: string
  capturedAt: string
  disclaimer?: string
  entries: Record<string, UsageEntry>
}

export interface Regulation {
  code: string
  name: string
  startsOn: string
  endsOn: string
  format: string
  notes: string
}
