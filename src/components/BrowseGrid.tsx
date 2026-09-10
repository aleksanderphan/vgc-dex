import { useMemo, useState } from 'react'
import type { BaseStats, Pokemon, TypeName } from '../types'
import { POKEMON, usageFor } from '../lib/data'
import { TYPES, TYPE_COLORS, titleCase } from '../lib/typechart'
import { TypeBadge } from './TypeBadge'

type StatKey = keyof BaseStats
type SortKey = 'usage' | 'name' | 'bst' | StatKey

const SORT_LABELS: Record<SortKey, string> = {
  usage: 'Usage %',
  name: 'Name (A–Z)',
  bst: 'Base stat total',
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
}

const bst = (p: Pokemon) =>
  p.baseStats.hp +
  p.baseStats.atk +
  p.baseStats.def +
  p.baseStats.spa +
  p.baseStats.spd +
  p.baseStats.spe

interface Props {
  /** Shared with the sticky search bar — narrows the grid by name too. */
  query: string
  onPick: (slug: string) => void
  onClearQuery: () => void
}

export function BrowseGrid({ query, onPick, onClearQuery }: Props) {
  const [types, setTypes] = useState<Set<TypeName>>(new Set())
  const [ability, setAbility] = useState('')
  const [sort, setSort] = useState<SortKey>('usage')
  const [onlyUsed, setOnlyUsed] = useState(false)

  const abilities = useMemo(() => {
    const seen = new Set<string>()
    for (const p of POKEMON) for (const a of p.abilities) seen.add(a.name)
    return [...seen].sort((a, b) => a.localeCompare(b))
  }, [])

  const q = query.trim().toLowerCase()

  const list = useMemo(() => {
    const wanted = [...types]
    const matched = POKEMON.filter((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.slug.replace(/-/g, ' ').includes(q)
      )
        return false
      if (wanted.length && !wanted.every((t) => p.types.includes(t)))
        return false
      if (ability && !p.abilities.some((a) => a.name === ability)) return false
      if (onlyUsed && !usageFor(p.slug)) return false
      return true
    })

    const pct = (p: Pokemon) => usageFor(p.slug)?.usagePct ?? -1
    return matched.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'usage':
          return pct(b) - pct(a) || a.name.localeCompare(b.name)
        case 'bst':
          return bst(b) - bst(a) || a.name.localeCompare(b.name)
        default:
          return (
            b.baseStats[sort] - a.baseStats[sort] ||
            a.name.localeCompare(b.name)
          )
      }
    })
  }, [q, types, ability, sort, onlyUsed])

  function toggleType(t: TypeName) {
    setTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else if (next.size < 2) next.add(t) // no Pokémon has 3 types
      return next
    })
  }

  const filtered = types.size > 0 || ability !== '' || onlyUsed || q !== ''

  function clearAll() {
    setTypes(new Set())
    setAbility('')
    setOnlyUsed(false)
    onClearQuery()
  }

  const showPct = sort === 'usage' || sort === 'name'

  return (
    <div className="browse">
      <section className="card browse__filters">
        <div className="browse__types" role="group" aria-label="Filter by type">
          {TYPES.map((t) => {
            const on = types.has(t)
            return (
              <button
                key={t}
                type="button"
                className={`type-filter${on ? ' is-on' : ''}`}
                style={{ backgroundColor: TYPE_COLORS[t] }}
                aria-pressed={on}
                onClick={() => toggleType(t)}
              >
                {titleCase(t)}
              </button>
            )
          })}
        </div>

        <div className="browse__controls">
          <label className="browse__control">
            <span>Ability</span>
            <select
              value={ability}
              onChange={(e) => setAbility(e.target.value)}
            >
              <option value="">Any</option>
              {abilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="browse__control">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>

          <label className="browse__check">
            <input
              type="checkbox"
              checked={onlyUsed}
              onChange={(e) => setOnlyUsed(e.target.checked)}
            />
            <span>In usage data</span>
          </label>
        </div>

        <div className="browse__summary">
          <span>
            {list.length} of {POKEMON.length} Pokémon
          </span>
          {filtered ? (
            <button type="button" className="browse__clear" onClick={clearAll}>
              Clear all
            </button>
          ) : null}
        </div>
      </section>

      {list.length === 0 ? (
        <p className="muted-sm">No Pokémon match those filters.</p>
      ) : (
        <ul className="grid">
          {list.map((p) => {
            const usage = usageFor(p.slug)?.usagePct
            const metric = showPct
              ? usage != null
                ? `${usage.toFixed(1)}%`
                : '—'
              : sort === 'bst'
                ? `BST ${bst(p)}`
                : `${sort.toUpperCase()} ${p.baseStats[sort]}`
            return (
              <li key={p.slug}>
                <button
                  type="button"
                  className="grid__card"
                  onClick={() => onPick(p.slug)}
                >
                  <img
                    src={p.sprite}
                    alt=""
                    width="72"
                    height="72"
                    loading="lazy"
                  />
                  <span className="grid__no">
                    #{String(p.id).padStart(4, '0')}
                  </span>
                  <span className="grid__name">{p.name}</span>
                  <span className="grid__types">
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </span>
                  <span
                    className={`grid__metric${
                      showPct && usage == null ? ' grid__metric--none' : ''
                    }`}
                  >
                    {metric}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
