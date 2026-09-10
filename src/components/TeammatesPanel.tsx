import type { UsageEntry, UsageSnapshot } from '../types'
import { findPokemon } from '../lib/data'
import { DataPill } from './DataPill'

interface Props {
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

/** "Common teammates" — co-occurrence on the same team, from the ladder ingest. */
export function TeammatesPanel({ entry, snapshot }: Props) {
  if (!entry?.teammates?.length) return null

  const sorted = [...entry.teammates].sort((a, b) => b.pct - a.pct)
  const label = `Reg ${snapshot.regulation} · ${snapshot.season} · ${snapshot.ratingCutoff} · ${snapshot.source}`

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Common teammates</h2>
        <DataPill />
      </div>

      <p className="usage__hint">
        Share of this Pokémon's teams that also carry each one. Tap to open it.
      </p>

      <ul className="teammates">
        {sorted.map((t) => {
          const p = findPokemon(t.slug)
          return (
            <li key={t.slug}>
              <a className="teammate" href={`#${t.slug}`}>
                {p ? (
                  <img
                    className="teammate__sprite"
                    src={p.sprite}
                    alt=""
                    width="32"
                    height="32"
                    loading="lazy"
                  />
                ) : null}
                <span className="teammate__name">{t.name}</span>
                <span className="teammate__pct">{t.pct.toFixed(1)}%</span>
              </a>
            </li>
          )
        })}
      </ul>

      <p className="usage__meta">
        {label} · captured {snapshot.capturedAt}
      </p>
    </section>
  )
}
