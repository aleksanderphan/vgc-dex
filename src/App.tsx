import { useEffect, useMemo, useState } from 'react'
import { SearchBar } from './components/SearchBar'
import { PokemonView } from './components/PokemonView'
import { BrowseGrid } from './components/BrowseGrid'
import { EntityPage } from './components/EntityPage'
import type { EntityKind } from './lib/data'
import {
  POKEMON,
  POKEMON_GENERATED_AT,
  POKEMON_SOURCE,
  REGULATION,
  USAGE,
  USAGE_IS_SAMPLE,
  findPokemon,
  popularSlugs,
  searchPokemon,
} from './lib/data'

const FALLBACK_SLUG = POKEMON[0]?.slug ?? ''

type Route =
  | { kind: 'browse' }
  | { kind: 'pokemon'; slug: string }
  | { kind: EntityKind; slug: string }

const ENTITY_KINDS: EntityKind[] = ['move', 'ability', 'item']

function parseHash(): Route {
  const raw = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim()
  if (raw === 'browse') return { kind: 'browse' }
  const slash = raw.indexOf('/')
  if (slash > 0) {
    const head = raw.slice(0, slash)
    const rest = raw.slice(slash + 1)
    if ((ENTITY_KINDS as string[]).includes(head) && rest) {
      return { kind: head as EntityKind, slug: rest }
    }
  }
  return { kind: 'pokemon', slug: raw && findPokemon(raw) ? raw : '' }
}

export function App() {
  const [query, setQuery] = useState('')
  const [route, setRoute] = useState<Route>(parseHash)
  const [pokeSlug, setPokeSlug] = useState<string>(
    () =>
      (route.kind === 'pokemon' && route.slug) ||
      popularSlugs(1)[0] ||
      FALLBACK_SLUG,
  )

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Remember the last Pokémon viewed so returning from a move/ability/item page
  // lands back on it.
  useEffect(() => {
    if (route.kind === 'pokemon' && route.slug) setPokeSlug(route.slug)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [route])

  function select(next: string) {
    window.location.hash = next
  }

  const results = useMemo(() => searchPokemon(query), [query])
  const activeSlug =
    route.kind === 'pokemon' && route.slug ? route.slug : pokeSlug
  const pokemon = findPokemon(activeSlug) ?? POKEMON[0]
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
        onSeeAll={() => select('browse')}
      />

      <div className="subnav">
        <nav className="popular" aria-label="Popular Pokémon">
          {popular.map((s) => {
            const p = findPokemon(s)
            if (!p) return null
            const isActive = route.kind === 'pokemon' && s === activeSlug
            return (
              <button
                key={s}
                type="button"
                className={`popular__chip${isActive ? ' is-active' : ''}`}
                onClick={() => select(s)}
              >
                <img
                  src={p.sprite}
                  alt=""
                  width="28"
                  height="28"
                  loading="lazy"
                />
                {p.name}
              </button>
            )
          })}
        </nav>
        <button
          type="button"
          className={`subnav__all${route.kind === 'browse' ? ' is-active' : ''}`}
          aria-pressed={route.kind === 'browse'}
          onClick={() =>
            select(route.kind === 'browse' ? activeSlug || FALLBACK_SLUG : 'browse')
          }
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
            />
          </svg>
          Browse
        </button>
      </div>

      <main className="content">
        {route.kind === 'browse' ? (
          <BrowseGrid
            query={query}
            onPick={select}
            onClearQuery={() => setQuery('')}
          />
        ) : route.kind === 'pokemon' ? (
          pokemon ? (
            <PokemonView pokemon={pokemon} snapshot={USAGE} />
          ) : (
            <p className="muted-sm">No Pokémon in the dataset.</p>
          )
        ) : (
          <EntityPage kind={route.kind} slug={route.slug} onPickPokemon={select} />
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
          generated {generatedLabel}.{' '}
          {USAGE_IS_SAMPLE
            ? 'Usage figures are illustrative sample data — not live stats.'
            : `Usage from ${USAGE.source} (${USAGE.season}) — the simulator ladder, not the official in-game one.`}{' '}
          Unofficial fan project; not affiliated with Nintendo / The Pokémon
          Company.
        </p>
        <p className="foot__version">v{__APP_VERSION__}</p>
      </footer>
    </div>
  )
}
