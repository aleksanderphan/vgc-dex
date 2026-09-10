import type { BaseStats } from '../types'

const ROWS: { key: keyof BaseStats; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'Atk' },
  { key: 'def', label: 'Def' },
  { key: 'spa', label: 'SpA' },
  { key: 'spd', label: 'SpD' },
  { key: 'spe', label: 'Spe' },
]

// Rough colour cut-offs so the bars read at a glance.
function barColor(value: number): string {
  if (value >= 130) return '#2fb170'
  if (value >= 100) return '#7bc043'
  if (value >= 70) return '#f0c000'
  if (value >= 50) return '#f08b33'
  return '#e5533d'
}

const MAX_STAT = 200 // bar scale ceiling; a few mons exceed this and clamp full

interface Props {
  stats: BaseStats
  /** When set, show the per-stat change from this spread (e.g. base → Mega). */
  baseline?: BaseStats
}

export function StatSpread({ stats, baseline }: Props) {
  return (
    <div className={`stat-spread${baseline ? ' stat-spread--diff' : ''}`}>
      {ROWS.map((r) => {
        const value = stats[r.key]
        const pct = Math.min(100, (value / MAX_STAT) * 100)
        const delta = baseline ? value - baseline[r.key] : 0
        return (
          <div className="stat-row" key={r.key}>
            <span className="stat-row__label">{r.label}</span>
            <span className="stat-row__value">{value}</span>
            {baseline ? (
              <span
                className={`stat-row__delta${
                  delta > 0 ? ' is-up' : delta < 0 ? ' is-down' : ' is-flat'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta < 0 ? delta : '±0'}
              </span>
            ) : null}
            <span className="stat-row__track">
              <span
                className="stat-row__fill"
                style={{ width: `${pct}%`, backgroundColor: barColor(value) }}
              />
            </span>
          </div>
        )
      })}
    </div>
  )
}
