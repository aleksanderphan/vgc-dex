import { useEffect, useMemo, useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { PokemonView } from './components/PokemonView'
import {
  POKEMON,
  POKEMON_GENERATED_AT,
  POKEMON_SOURCE,
  REGULATION,
  USAGE,
  findPokemon,
  popularSlugs,
  searchPokemon,
} from './lib/data'

const FALLBACK_SLUG = POKEMON[0]?.slug ?? ''

function slugFromHash(): string {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim()
  return h && findPokemon(h) ? h : ''
}

export function App() {
  const [query, setQuery] = useState('')
  const [slug, setSlug] = useState<string>(
    () => slugFromHash() || popularSlugs(1)[0] || FALLBACK_SLUG,
  )

  useEffect(() => {
    const onHash = () => {
      const s = slugFromHash()
      if (s) setSlug(s)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function select(next: string) {
    setSlug(next)
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const results = useMemo(() => searchPokemon(query), [query])
  const pokemon = findPokemon(slug) ?? POKEMON[0]
  const popular = useMemo(() => popularSlugs(12), [])

  const generated = new Date(POKEMON_GENERATED_AT)
  const generatedLabel = Number.isNaN(generated.valueOf())
    ? POKEMON_GENERATED_AT
    : generated.toISOString().slice(0, 10)

  return (
    <div className="app">
      <SearchBar
        value={query}
        onChange={setQuery}
        results={results}
        onPick={select}
      />

      <nav className="popular" aria-label="Popular Pokémon">
        {popular.map((s) => {
          const p = findPokemon(s)
          if (!p) return null
          return (
            <button
              key={s}
              type="button"
              className={`popular__chip${s === slug ? ' is-active' : ''}`}
              onClick={() => select(s)}
            >
              <img src={p.sprite} alt="" width="28" height="28" loading="lazy" />
              {p.name}
            </button>
          )
        })}
      </nav>

      <main className="content">
        {pokemon ? (
          <PokemonView pokemon={pokemon} snapshot={USAGE} />
        ) : (
          <p className="muted-sm">No Pokémon in the dataset.</p>
        )}
      </main>

      <footer className="foot">
        <p>
          <strong>{REGULATION.name}</strong> — {REGULATION.format}
          <br />
          Active {REGULATION.startsOn} → {REGULATION.endsOn}. {REGULATION.notes}
        </p>
        <p className="foot__meta">
          {POKEMON.length} Pokémon · reference data from {POKEMON_SOURCE},
          generated {generatedLabel}. Usage figures are illustrative sample data —
          not live stats. Unofficial fan project; not affiliated with Nintendo /
          The Pokémon Company.
        </p>
      </footer>
    </div>
  )
}
