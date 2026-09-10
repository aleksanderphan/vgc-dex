import { describe, expect, it } from 'vitest'
import type { TypeName } from '../types'
import {
  TYPES,
  TYPE_COLORS,
  defensiveMatchups,
  defensiveMultiplier,
  effectiveness,
  offensiveCoverage,
  titleCase,
} from './typechart'

describe('effectiveness', () => {
  it('returns known super-effective / resisted / immune pairs', () => {
    expect(effectiveness('fire', 'grass')).toBe(2)
    expect(effectiveness('water', 'fire')).toBe(2)
    expect(effectiveness('fire', 'water')).toBe(0.5)
    expect(effectiveness('normal', 'ghost')).toBe(0)
    expect(effectiveness('ghost', 'normal')).toBe(0)
    expect(effectiveness('electric', 'ground')).toBe(0)
    expect(effectiveness('dragon', 'fairy')).toBe(0)
  })

  it('defaults to 1x for a neutral pair', () => {
    expect(effectiveness('normal', 'normal')).toBe(1)
    expect(effectiveness('fire', 'psychic')).toBe(1)
  })

  it('only ever yields 0, 0.5, 1 or 2', () => {
    for (const a of TYPES) {
      for (const d of TYPES) {
        expect([0, 0.5, 1, 2]).toContain(effectiveness(a, d))
      }
    }
  })
})

describe('defensiveMultiplier', () => {
  it('stacks both halves of a dual typing', () => {
    // classic Salamence: Ice hits Dragon/Flying for 4x
    expect(defensiveMultiplier('ice', ['dragon', 'flying'])).toBe(4)
    // Rock hits Bug/Flying for 4x
    expect(defensiveMultiplier('rock', ['bug', 'flying'])).toBe(4)
  })

  it('a resist and a weakness cancel to neutral', () => {
    // Grass vs Water/Ground: 2x * 2x = 4x (both weak)
    expect(defensiveMultiplier('grass', ['water', 'ground'])).toBe(4)
    // Fire vs Water/Bug: 0.5x * 2x = 1x
    expect(defensiveMultiplier('fire', ['water', 'bug'])).toBe(1)
  })

  it('an immunity zeroes the whole product', () => {
    expect(defensiveMultiplier('ground', ['flying', 'steel'])).toBe(0)
  })
})

describe('defensiveMatchups', () => {
  it('classifies a mono-Water defender', () => {
    const { weak, resist, immune } = defensiveMatchups(['water'])
    expect(weak.map((m) => m.type).sort()).toEqual(['electric', 'grass'])
    expect(resist.map((m) => m.type).sort()).toEqual(
      ['fire', 'ice', 'steel', 'water'].sort(),
    )
    expect(immune).toHaveLength(0)
  })

  it('lists both immunities of a Normal/Ghost-style defender', () => {
    const { immune } = defensiveMatchups(['ghost'])
    expect(immune.map((m) => m.type).sort()).toEqual(['fighting', 'normal'])
    expect(immune.every((m) => m.multiplier === 0)).toBe(true)
  })

  it('sorts weaknesses high-to-low and resists low-to-high', () => {
    const { weak, resist } = defensiveMatchups(['grass', 'ground'])
    for (let i = 1; i < weak.length; i++) {
      expect(weak[i - 1].multiplier).toBeGreaterThanOrEqual(weak[i].multiplier)
    }
    for (let i = 1; i < resist.length; i++) {
      expect(resist[i - 1].multiplier).toBeLessThanOrEqual(resist[i].multiplier)
    }
  })

  it('never puts a type in more than one bucket', () => {
    const { weak, resist, immune } = defensiveMatchups(['dragon', 'flying'])
    const all = [...weak, ...resist, ...immune].map((m) => m.type)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('offensiveCoverage', () => {
  it('reports every type a STAB hits for super-effective', () => {
    const cov = offensiveCoverage(['fire']).map((m) => m.type).sort()
    expect(cov).toEqual(['bug', 'grass', 'ice', 'steel'].sort())
  })

  it('merges coverage across dual STAB and never double-lists a type', () => {
    const cov = offensiveCoverage(['fire', 'ground'])
    const types = cov.map((m) => m.type)
    expect(new Set(types).size).toBe(types.length)
    // steel is hit by both fire and ground — still appears once
    expect(types.filter((t) => t === 'steel')).toHaveLength(1)
  })
})

describe('static tables', () => {
  it('lists all 18 modern types once', () => {
    expect(TYPES).toHaveLength(18)
    expect(new Set(TYPES).size).toBe(18)
  })

  it('has a colour for every type', () => {
    for (const t of TYPES) {
      expect(TYPE_COLORS[t as TypeName]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('titleCase', () => {
  it('splits on -, _ and spaces', () => {
    expect(titleCase('sucker-punch')).toBe('Sucker Punch')
    expect(titleCase('life_orb')).toBe('Life Orb')
    expect(titleCase('choice scarf')).toBe('Choice Scarf')
  })
})
