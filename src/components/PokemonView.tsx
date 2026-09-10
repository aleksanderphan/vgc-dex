import { useState } from 'react'
import type { Pokemon, UsageSnapshot } from '../types'
import { StatSpread } from './StatSpread'
import { TypeMatchups } from './TypeMatchups'
import { TypeBadge } from './TypeBadge'
import { UsagePanel } from './UsagePanel'
import { ItemsPanel } from './ItemsPanel'
import { SpreadsPanel } from './SpreadsPanel'
import { TeammatesPanel } from './TeammatesPanel'
import { formsFor, usageFor } from '../lib/data'

interface Props {
  pokemon: Pokemon
  snapshot: UsageSnapshot
}

export function PokemonView({ pokemon, snapshot }: Props) {
  const entry = usageFor(pokemon.slug)
  const forms = formsFor(pokemon)

  // Which form tab is selected — pinned to the Pokémon it was chosen for, so
  // navigating to another Pokémon falls straight back to its base form.
  const [picked, setPicked] = useState({ slug: pokemon.slug, key: 'base' })
  const formKey = picked.slug === pokemon.slug ? picked.key : 'base'
  const form = forms.find((f) => f.key === formKey) ?? forms[0]
  const hasForms = forms.length > 1

  return (
    <article className="poke">
      <section className="card poke__hero">
        <div className="poke__art">
          {form.artwork || form.sprite ? (
            <img
              key={form.artwork || form.sprite}
              src={form.artwork || form.sprite}
              alt={form.name}
              width="220"
              height="220"
              decoding="async"
            />
          ) : (
            <div className="poke__art-blank" role="img" aria-label={`${form.name} — no art`}>
              No art yet
            </div>
          )}
        </div>

        {hasForms && (
          <div className="form-tabs" role="tablist" aria-label="Forms">
            {forms.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={f.key === form.key}
                className={`form-tab${f.key === form.key ? ' is-active' : ''}`}
                onClick={() => setPicked({ slug: pokemon.slug, key: f.key })}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="poke__id">
          <span className="poke__no">
            #{String(pokemon.id).padStart(4, '0')}
          </span>
          <h1 className="poke__name">{form.name}</h1>
          <div className="badge-wrap">
            {form.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <div className="poke__abilities">
            {form.abilities.map((a) => (
              <span
                key={a.slug}
                className={`ability-chip${a.isHidden ? ' ability-chip--hidden' : ''}`}
              >
                {a.name}
                {a.isHidden ? <i> (H)</i> : null}
              </span>
            ))}
          </div>
          {form.stone ? (
            <p className="poke__stone">
              Mega Stone: <b>{form.stone}</b>
            </p>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Base stats{form.key !== 'base' ? ` — ${form.label}` : ''}</h2>
        </div>
        <StatSpread stats={form.baseStats} />
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Type matchups</h2>
        </div>
        <TypeMatchups types={form.types} />
      </section>

      <UsagePanel name={pokemon.name} entry={entry} snapshot={snapshot} />
      <ItemsPanel entry={entry} snapshot={snapshot} />
      <SpreadsPanel entry={entry} snapshot={snapshot} />
      <TeammatesPanel entry={entry} snapshot={snapshot} />
    </article>
  )
}
