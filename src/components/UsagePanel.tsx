import type { UsageEntry, UsageSnapshot } from '../types'
import { RankedList } from './RankedList'

interface Props {
  name: string
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

export function UsagePanel({ name, entry, snapshot }: Props) {
  if (!entry) {
    return (
      <section className="card usage">
        <div className="section-head">
          <h2>Usage</h2>
        </div>
        <p className="muted-sm">
          No usage data for {name} in this snapshot — it sees little or no play
          on the {snapshot.season} ladder.
        </p>
      </section>
    )
  }

  const sortedAbilities = [...entry.abilities].sort((a, b) => b.pct - a.pct)
  const sortedMoves = [...entry.moves].sort((a, b) => b.pct - a.pct)

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Usage</h2>
      </div>

      {(entry.usagePct != null || entry.winPct != null) && (
        <div className="usage__stats">
          {entry.usagePct != null && (
            <div className="usage__stat">
              <span className="usage__stat-num">
                {entry.usagePct.toFixed(1)}%
              </span>
              <span className="usage__stat-lbl">usage rate</span>
            </div>
          )}
          {entry.winPct != null && (
            <div className="usage__stat">
              <span className="usage__stat-num">
                {entry.winPct.toFixed(1)}%
              </span>
              <span className="usage__stat-lbl">win rate</span>
            </div>
          )}
        </div>
      )}

      <p className="usage__hint">Tap an ability or move for details.</p>

      <div className="usage__stack">
        <RankedList
          title="Common abilities"
          items={sortedAbilities}
          accent="#6c8cff"
          kind="ability"
        />
        <RankedList
          title="Common moves"
          items={sortedMoves}
          accent="#2fb170"
          kind="move"
        />
      </div>
    </section>
  )
}
