import type { Pokemon, UsageSnapshot } from '../types'
import { StatSpread } from './StatSpread'
import { TypeMatchups } from './TypeMatchups'
import { TypeBadge } from './TypeBadge'
import { UsagePanel } from './UsagePanel'
import { usageFor } from '../lib/data'

interface Props {
  pokemon: Pokemon
  snapshot: UsageSnapshot
}

export function PokemonView({ pokemon, snapshot }: Props) {
  const entry = usageFor(pokemon.slug)

  return (
    <article className="poke">
      <section className="card poke__hero">
        <div className="poke__art">
          <img
            src={pokemon.artwork || pokemon.sprite}
            alt={pokemon.name}
            width="220"
            height="220"
          />
        </div>
        <div className="poke__id">
          <span className="poke__no">#{String(pokemon.id).padStart(4, '0')}</span>
          <h1 className="poke__name">{pokemon.name}</h1>
          <div className="badge-wrap">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <div className="poke__abilities">
            {pokemon.abilities.map((a) => (
              <span
                key={a.slug}
                className={`ability-chip${a.isHidden ? ' ability-chip--hidden' : ''}`}
              >
                {a.name}
                {a.isHidden ? <i> (H)</i> : null}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Base stats</h2>
        </div>
        <StatSpread stats={pokemon.baseStats} />
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Type matchups</h2>
        </div>
        <TypeMatchups types={pokemon.types} />
      </section>

      <UsagePanel name={pokemon.name} entry={entry} snapshot={snapshot} />
    </article>
  )
}
