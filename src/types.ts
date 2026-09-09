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
  teraTypes?: UsageItem[]
  items?: UsageItem[]
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
