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

const pct = (n: number) => Math.max(0, Math.min(100, (n / MAX_STAT) * 100))

interface Props {
  stats: BaseStats
  /**
   * When set, each bar is drawn as the base spread with the Mega change stacked
   * on top: a rainbow segment for a gain, a hatched segment for a drop.
   */
  baseline?: BaseStats
}

export function StatSpread({ stats, baseline }: Props) {
  const diff = Boolean(baseline)
  const hasDrop =
    diff && ROWS.some((r) => stats[r.key] < (baseline as BaseStats)[r.key])

  return (
    <div className={`stat-spread${diff ? ' stat-spread--diff' : ''}`}>
      {ROWS.map((r) => {
        const value = stats[r.key]
        const base = baseline ? baseline[r.key] : value
        const delta = value - base
        // The solid part is whatever base and Mega share; the extra segment is
        // the gain (rainbow) or the drop (hatched) tacked on after it.
        const solidPct = pct(Math.min(base, value))
        const gainPct = delta > 0 ? pct(value) - pct(base) : 0
        const dropPct = delta < 0 ? pct(base) - pct(value) : 0
        return (
          <div className="stat-row" key={r.key}>
            <span className="stat-row__label">{r.label}</span>
            <span className="stat-row__value">{value}</span>
            {diff ? (
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
                style={{
                  width: `${solidPct}%`,
                  backgroundColor: barColor(Math.min(base, value)),
                }}
              />
              {gainPct > 0 ? (
                <span
                  className="stat-row__fill stat-row__fill--gain"
                  style={{ width: `${gainPct}%` }}
                />
              ) : null}
              {dropPct > 0 ? (
                <span
                  className="stat-row__fill stat-row__fill--drop"
                  style={{ width: `${dropPct}%` }}
                />
              ) : null}
            </span>
          </div>
        )
      })}

      {diff ? (
        <p className="stat-spread__legend">
          <span className="legend-item">
            <span className="swatch swatch--base" />
            base
          </span>
          <span className="legend-item">
            <span className="swatch swatch--gain" />
            Mega gain
          </span>
          {hasDrop ? (
            <span className="legend-item">
              <span className="swatch swatch--drop" />
              Mega drop
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
