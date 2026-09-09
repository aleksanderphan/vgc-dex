import { useRef, useState } from 'react'
import type { Pokemon } from '../types'
import { TYPE_COLORS } from '../lib/typechart'

interface Props {
  value: string
  onChange: (v: string) => void
  results: Pokemon[]
  onPick: (slug: string) => void
}

export function SearchBar({ value, onChange, results, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<number | undefined>(undefined)

  const shown = value.trim() ? results.slice(0, 8) : []

  function pick(slug: string) {
    onPick(slug)
    onChange('')
    setOpen(false)
  }

  return (
    <header className="search">
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
            placeholder="Search Pokémon…"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              blurTimer.current = window.setTimeout(() => setOpen(false), 120)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && shown[0]) pick(shown[0].slug)
              if (e.key === 'Escape') {
                onChange('')
                setOpen(false)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
        </div>

        {open && shown.length > 0 && (
          <ul
            className="search__results"
            onMouseDown={() => window.clearTimeout(blurTimer.current)}
          >
            {shown.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  className="search__result"
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
          </ul>
        )}
      </div>
    </header>
  )
}
