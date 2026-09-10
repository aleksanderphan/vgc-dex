import { describe, expect, it } from 'vitest'
import {
  MOVEDEX,
  POKEMON,
  REGULATION,
  USAGE,
  USAGE_IS_SAMPLE,
  abilityInfo,
  entityBySlug,
  findPokemon,
  formsFor,
  moveInfo,
  popularSlugs,
  searchPokemon,
  usageFor,
  usersOf,
} from './data'

describe('name normalizer (moveInfo / abilityInfo)', () => {
  it('is case- and punctuation-insensitive', () => {
    const canon = moveInfo('Protect')
    expect(canon).toBeDefined()
    expect(moveInfo('protect')).toBe(canon)
    expect(moveInfo('PROTECT')).toBe(canon)

    const sp = moveInfo('Sucker Punch')
    expect(sp).toBeDefined()
    expect(moveInfo('sucker-punch')).toBe(sp)
    expect(moveInfo('suckerpunch')).toBe(sp)
  })

  it('returns undefined for an unknown name', () => {
    expect(moveInfo('Not A Real Move')).toBeUndefined()
    expect(abilityInfo('Not A Real Ability')).toBeUndefined()
  })

  it('resolves the same record by slug as by name', () => {
    const byName = moveInfo('Protect')!
    expect(entityBySlug('move', byName.slug)).toBe(byName)
  })
})

describe('usersOf', () => {
  const users = usersOf('move', 'Protect')

  it('finds Pokémon that run the move', () => {
    expect(users.length).toBeGreaterThan(0)
  })

  it('is sorted by pct descending and every slug resolves', () => {
    for (let i = 1; i < users.length; i++) {
      expect(users[i - 1].pct).toBeGreaterThanOrEqual(users[i].pct)
    }
    for (const u of users) {
      expect(findPokemon(u.slug)).toBeDefined()
      expect(u.pct).toBeGreaterThanOrEqual(0)
      expect(u.pct).toBeLessThanOrEqual(101)
    }
  })
})

describe('popularSlugs', () => {
  it('honours the limit and every slug is a real Pokémon', () => {
    const top = popularSlugs(5)
    expect(top.length).toBeLessThanOrEqual(5)
    for (const slug of top) expect(findPokemon(slug)).toBeDefined()
  })

  it('is ordered by usage % descending', () => {
    const top = popularSlugs()
    const pcts = top.map((s) => usageFor(s)?.usagePct ?? 0)
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i - 1]).toBeGreaterThanOrEqual(pcts[i])
    }
  })
})

describe('formsFor', () => {
  it('always yields the base form first', () => {
    for (const p of POKEMON.slice(0, 25)) {
      const forms = formsFor(p)
      expect(forms.length).toBeGreaterThanOrEqual(1)
      expect(forms[0].key).toBe('base')
      expect(forms[0].name).toBe(p.name)
    }
  })

  it('gives Charizard its two Megas', () => {
    const zard = findPokemon('charizard')
    if (zard) {
      const keys = formsFor(zard).map((f) => f.key)
      expect(keys).toContain('base')
      expect(keys.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('carries the Champions-original Megas (Staraptor, Raichu X/Y)', () => {
    const star = findPokemon('staraptor')
    expect(star && formsFor(star).map((f) => f.name)).toContain('Mega Staraptor')

    const raichu = findPokemon('raichu')
    if (raichu) {
      const keys = formsFor(raichu).map((f) => f.key)
      expect(keys).toEqual(expect.arrayContaining(['base', 'mega-x', 'mega-y']))
    }
  })
})

describe('searchPokemon', () => {
  it('returns the whole pool for an empty query', () => {
    expect(searchPokemon('')).toHaveLength(POKEMON.length)
    expect(searchPokemon('   ')).toHaveLength(POKEMON.length)
  })

  it('returns nothing for gibberish', () => {
    expect(searchPokemon('zzzznotapokemon')).toHaveLength(0)
  })

  it('matches on name substring', () => {
    const hits = searchPokemon('char')
    expect(hits.some((p) => p.slug === 'charizard')).toBe(true)
  })
})

describe('POKEMON pool', () => {
  it('is sorted by name with unique slugs', () => {
    const slugs = POKEMON.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const names = POKEMON.map((p) => p.name)
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names)
  })
})

describe('usage snapshot consistency', () => {
  it('is a real ingest for this regulation, not the placeholder', () => {
    expect(USAGE_IS_SAMPLE).toBe(false)
    expect(USAGE.regulation).toBe(REGULATION.code)
    expect(USAGE.source).toMatch(/showdown|smogon/i)
  })

  it('every entry key resolves to a Pokémon in the pool', () => {
    for (const slug of Object.keys(USAGE.entries)) {
      expect(findPokemon(slug), slug).toBeDefined()
    }
  })

  it('all percentages are in range', () => {
    for (const [slug, e] of Object.entries(USAGE.entries)) {
      if (e.usagePct != null) {
        expect(e.usagePct, slug).toBeGreaterThanOrEqual(0)
        expect(e.usagePct, slug).toBeLessThanOrEqual(100)
      }
      for (const list of [e.abilities, e.moves, e.items ?? []]) {
        for (const x of list) {
          expect(x.pct, `${slug} ${x.name}`).toBeGreaterThanOrEqual(0)
          expect(x.pct, `${slug} ${x.name}`).toBeLessThanOrEqual(101)
        }
      }
    }
  })

  it('EV spreads are legal (sum ≤ 508, each 0–252)', () => {
    for (const [slug, e] of Object.entries(USAGE.entries)) {
      for (const sp of e.spreads ?? []) {
        const evs = Object.values(sp.evs)
        const total = evs.reduce((a, b) => a + b, 0)
        expect(total, `${slug} ${sp.nature}`).toBeLessThanOrEqual(508)
        for (const v of evs) {
          expect(v, `${slug} ${sp.nature}`).toBeGreaterThanOrEqual(0)
          expect(v, `${slug} ${sp.nature}`).toBeLessThanOrEqual(252)
        }
      }
    }
  })

  it('teammates resolve and co-occurrence % is in range', () => {
    for (const [slug, e] of Object.entries(USAGE.entries)) {
      for (const m of e.teammates ?? []) {
        expect(findPokemon(m.slug), `${slug} -> ${m.slug}`).toBeDefined()
        expect(m.pct, `${slug} -> ${m.slug}`).toBeGreaterThanOrEqual(0)
        expect(m.pct, `${slug} -> ${m.slug}`).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('movedex integrity', () => {
  it('reported counts match the arrays', () => {
    expect(MOVEDEX.moves).toHaveLength(MOVEDEX.moveCount)
    expect(MOVEDEX.abilities).toHaveLength(MOVEDEX.abilityCount)
  })

  it('every usage-referenced move exists in the movedex', () => {
    const missing = new Set<string>()
    for (const e of Object.values(USAGE.entries)) {
      for (const m of e.moves) if (!moveInfo(m.name)) missing.add(m.name)
    }
    expect([...missing]).toEqual([])
  })
})
