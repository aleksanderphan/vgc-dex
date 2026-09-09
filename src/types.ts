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

export interface UsageItem {
  name: string
  pct: number
}

export interface UsageEntry {
  usagePct?: number
  winPct?: number
  abilities: UsageItem[]
  moves: UsageItem[]
  items?: UsageItem[]
}

export type MoveCategory = 'physical' | 'special' | 'status'

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
  effect: string
}

export interface AbilityInfo {
  name: string
  slug: string
  effect: string
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
