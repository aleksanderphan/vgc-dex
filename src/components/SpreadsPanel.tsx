import type { BaseStats, UsageEntry, UsageSnapshot } from '../types'

interface Props {
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

const EV_ROWS: { key: keyof BaseStats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
]

function evLine(evs: BaseStats) {
  return EV_ROWS.filter((r) => evs[r.key] > 0)
    .map((r) => `${evs[r.key]} ${r.label}`)
    .join(' / ')
}

/** "Common EV spreads" — from the Showdown ladder ingest (approximate EVs). */
export function SpreadsPanel({ entry }: Props) {
  if (!entry?.spreads?.length) return null

  const sorted = [...entry.spreads].sort((a, b) => b.pct - a.pct)
  const max = sorted.reduce((m, s) => Math.max(m, s.pct), 0) || 100

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Common EV spreads</h2>
      </div>

      <p className="usage__hint">
        Smogon buckets EVs coarsely — treat these as approximate shapes, not
        exact sheets.
      </p>

      <ol className="spread-list">
        {sorted.map((s, i) => (
          <li className="spread" key={`${s.nature}-${i}`}>
            <div className="spread__top">
              <span className="spread__nature">{s.nature}</span>
              <span className="spread__pct">{s.pct.toFixed(1)}%</span>
            </div>
            <span className="spread__track">
              <span
                className="spread__fill"
                style={{ width: `${(s.pct / max) * 100}%` }}
              />
            </span>
            <p className="spread__evs">{evLine(s.evs) || 'No EVs'}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
