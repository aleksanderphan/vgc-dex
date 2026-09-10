import type { TypeName } from '../types'

export const TYPES: TypeName[] = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
]

export const TYPE_COLORS: Record<TypeName, string> = {
  normal: '#9fa19f',
  fire: '#e62829',
  water: '#2980ef',
  electric: '#fac000',
  grass: '#3fa129',
  ice: '#3dcef3',
  fighting: '#ff8000',
  poison: '#9141cb',
  ground: '#915121',
  flying: '#81b9ef',
  psychic: '#ef4179',
  bug: '#91a119',
  rock: '#afa981',
  ghost: '#704170',
  dragon: '#5060e1',
  dark: '#6d5a52',
  steel: '#60a1b8',
  fairy: '#ef70ef',
}

// Attacking type -> defending type -> multiplier. Only non-1x pairs listed.
// Gen VI+ chart (Fairy included, Steel no longer resists Ghost/Dark).
const CHART: Partial<Record<TypeName, Partial<Record<TypeName, number>>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
}

export function effectiveness(
  attacking: TypeName,
  defending: TypeName,
): number {
  return CHART[attacking]?.[defending] ?? 1
}

/** Combined multiplier of an attacking type against a (mono/dual) defender. */
export function defensiveMultiplier(
  attacking: TypeName,
  defenderTypes: TypeName[],
): number {
  return defenderTypes.reduce(
    (mult, t) => mult * effectiveness(attacking, t),
    1,
  )
}

export interface Matchup {
  type: TypeName
  multiplier: number
}

/** How this Pokémon takes hits: what it's weak to / resists / is immune to. */
export function defensiveMatchups(defenderTypes: TypeName[]): {
  weak: Matchup[]
  resist: Matchup[]
  immune: Matchup[]
} {
  const weak: Matchup[] = []
  const resist: Matchup[] = []
  const immune: Matchup[] = []

  for (const t of TYPES) {
    const m = defensiveMultiplier(t, defenderTypes)
    if (m === 0) immune.push({ type: t, multiplier: 0 })
    else if (m > 1) weak.push({ type: t, multiplier: m })
    else if (m < 1) resist.push({ type: t, multiplier: m })
  }

  weak.sort((a, b) => b.multiplier - a.multiplier)
  resist.sort((a, b) => a.multiplier - b.multiplier)
  return { weak, resist, immune }
}

/**
 * "Strong against": defending types that at least one of this Pokémon's own
 * (STAB) types hits for super-effective damage.
 */
export function offensiveCoverage(attackerTypes: TypeName[]): Matchup[] {
  const out: Matchup[] = []
  for (const d of TYPES) {
    let best = 0
    for (const a of attackerTypes) best = Math.max(best, effectiveness(a, d))
    if (best >= 2) out.push({ type: d, multiplier: best })
  }
  out.sort(
    (a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type),
  )
  return out
}

export function titleCase(slug: string): string {
  return slug
    .split(/[-_ ]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
