import { useEffect, useRef, useState } from 'react'
import type { Pokemon, UsageSnapshot } from '../types'
import { StatSpread } from './StatSpread'
import { DataPill } from './DataPill'
import { TypeMatchups } from './TypeMatchups'
import { TypeBadge } from './TypeBadge'
import { UsagePanel } from './UsagePanel'
import { ItemsPanel } from './ItemsPanel'
import { SpreadsPanel } from './SpreadsPanel'
import { TeammatesPanel } from './TeammatesPanel'
import { formsFor, usageFor } from '../lib/data'
import { TYPE_COLORS } from '../lib/typechart'

interface Props {
  pokemon: Pokemon
  snapshot: UsageSnapshot
}

// Compact offence/speed readout for the sticky mini bar.
const MINI_STATS: { key: 'atk' | 'spa' | 'spe'; label: string }[] = [
  { key: 'atk', label: 'Atk' },
  { key: 'spa', label: 'SpA' },
  { key: 'spe', label: 'Spe' },
]

export function PokemonView({ pokemon, snapshot }: Props) {
  const entry = usageFor(pokemon.slug)
  const forms = formsFor(pokemon)

  // Which form tab is selected — pinned to the Pokémon it was chosen for, so
  // navigating to another Pokémon falls straight back to its base form.
  const [picked, setPicked] = useState({ slug: pokemon.slug, key: 'base' })
  const formKey = picked.slug === pokemon.slug ? picked.key : 'base'
  const form = forms.find((f) => f.key === formKey) ?? forms[0]
  const hasForms = forms.length > 1

  // Collapse the hero into a sticky mini-bar (sprite + name + types, styled like
  // a search-result row) once the full hero has scrolled out of view.
  const heroRef = useRef<HTMLElement>(null)
  const [mini, setMini] = useState(false)
  useEffect(() => {
    setMini(false)
    const el = heroRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => setMini(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [pokemon.slug])

  return (
    <article className="poke">
      {mini && (
        <button
          type="button"
          className="poke-mini"
          onClick={() => window.scrollTo({ top: 0 })}
          aria-label={`${form.name} — back to top`}
        >
          {form.sprite || form.artwork ? (
            <img
              src={form.sprite || form.artwork}
              alt=""
              width="36"
              height="36"
            />
          ) : null}
          <span className="poke-mini__name">{form.name}</span>
          <span className="poke-mini__stats" aria-hidden="true">
            {MINI_STATS.map((s) => (
              <span className="poke-mini__stat" key={s.key}>
                <span className="poke-mini__stat-lbl">{s.label}</span>
                {form.baseStats[s.key]}
              </span>
            ))}
          </span>
          <span className="poke-mini__types">
            {form.types.map((t) => (
              <i
                key={t}
                className="dot"
                style={{ backgroundColor: TYPE_COLORS[t] }}
                title={t}
              />
            ))}
          </span>
          <span className="poke-mini__hint" aria-hidden="true">
            ↑
          </span>
        </button>
      )}

      <section className="card poke__hero" ref={heroRef}>
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
            <div
              className="poke__art-blank"
              role="img"
              aria-label={`${form.name} — no art`}
            >
              No art yet
            </div>
          )}
        </div>

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
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Base stats{form.key !== 'base' ? ` — ${form.label}` : ''}</h2>
          {form.key !== 'base' ? (
            <span className="section-note">vs base form</span>
          ) : null}
        </div>
        <StatSpread
          stats={form.baseStats}
          baseline={form.key !== 'base' ? forms[0].baseStats : undefined}
        />
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

      <p className="usage__meta usage__meta--foot">
        <DataPill />{' '}
        {`Reg ${snapshot.regulation} · ${snapshot.season} · ${snapshot.ratingCutoff} · ${snapshot.source}`}{' '}
        · captured {snapshot.capturedAt}
      </p>
    </article>
  )
}
