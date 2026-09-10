import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Pokemon } from '../types'
import { TYPE_COLORS } from '../lib/typechart'

interface Props {
  value: string
  onChange: (v: string) => void
  results: Pokemon[]
  onPick: (slug: string) => void
  /** Jump to the browse grid, keeping the current query as a filter. */
  onSeeAll?: () => void
}

export function SearchBar({
  value,
  onChange,
  results,
  onPick,
  onSeeAll,
}: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const blurTimer = useRef<number | undefined>(undefined)

  const shown = value.trim() ? results.slice(0, 8) : []
  const showSeeAll = Boolean(onSeeAll) && results.length > shown.length
  // Flat list of keyboard-navigable rows: each Pokémon, then an optional
  // "view all" row.
  const rows: Array<{ kind: 'pick'; slug: string } | { kind: 'all' }> = [
    ...shown.map((p) => ({ kind: 'pick' as const, slug: p.slug })),
    ...(showSeeAll ? [{ kind: 'all' as const }] : []),
  ]
  const listOpen = open && rows.length > 0

  // Reset the highlight whenever the query text changes.
  useEffect(() => {
    setActive(-1)
  }, [value])

  function pick(slug: string) {
    onPick(slug)
    onChange('')
    setOpen(false)
  }

  function seeAll() {
    onSeeAll?.()
    setOpen(false)
  }

  function runRow(i: number) {
    const row = rows[i]
    if (!row) return
    if (row.kind === 'pick') pick(row.slug)
    else seeAll()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (rows.length ? (i + 1) % rows.length : -1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (rows.length ? (i <= 0 ? rows.length - 1 : i - 1) : -1))
      return
    }
    if (e.key === 'Enter') {
      if (active >= 0) runRow(active)
      else if (shown[0]) pick(shown[0].slug)
      return
    }
    if (e.key === 'Escape') {
      onChange('')
      setOpen(false)
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div className="search">
      <div className="search__inner">
        <div className="search__field">
          <svg
            className="search__icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"
            />
          </svg>
          <input
            className="search__input"
            type="search"
            inputMode="search"
            autoComplete="off"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="search-results"
            aria-autocomplete="list"
            aria-activedescendant={
              listOpen && active >= 0 ? `search-opt-${active}` : undefined
            }
            placeholder="Search Pokémon…"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => {
                setOpen(false)
                setActive(-1)
              }, 120)
            }}
            onKeyDown={onKeyDown}
          />
        </div>

        {listOpen && (
          <ul
            className="search__results"
            id="search-results"
            role="listbox"
            aria-label="Search results"
            onMouseDown={() => window.clearTimeout(blurTimer.current)}
          >
            {shown.map((p, i) => (
              <li key={p.slug} role="presentation">
                <button
                  type="button"
                  id={`search-opt-${i}`}
                  role="option"
                  aria-selected={active === i}
                  className={
                    'search__result' + (active === i ? ' is-active' : '')
                  }
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(p.slug)}
                >
                  <img
                    src={p.sprite}
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                  />
                  <span className="search__result-name">{p.name}</span>
                  <span className="search__result-types">
                    {p.types.map((t) => (
                      <i
                        key={t}
                        className="dot"
                        style={{ backgroundColor: TYPE_COLORS[t] }}
                        title={t}
                      />
                    ))}
                  </span>
                  <span className="search__result-no">
                    #{String(p.id).padStart(4, '0')}
                  </span>
                </button>
              </li>
            ))}
            {showSeeAll && (
              <li role="presentation">
                <button
                  type="button"
                  id={`search-opt-${shown.length}`}
                  role="option"
                  aria-selected={active === shown.length}
                  className={
                    'search__result search__result--all' +
                    (active === shown.length ? ' is-active' : '')
                  }
                  onMouseEnter={() => setActive(shown.length)}
                  onClick={seeAll}
                >
                  View all {results.length} matches in the grid →
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
