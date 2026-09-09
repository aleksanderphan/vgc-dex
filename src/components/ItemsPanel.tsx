import type { UsageEntry, UsageSnapshot } from '../types'
import { RankedList } from './RankedList'

interface Props {
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

/** "Common held items" — sits directly below the abilities / moves lists. */
export function ItemsPanel({ entry, snapshot }: Props) {
  if (!entry?.items?.length) return null

  const sorted = [...entry.items].sort((a, b) => b.pct - a.pct)
  const label = `Reg ${snapshot.regulation} · ${snapshot.season} · ${snapshot.ratingCutoff} · ${snapshot.source}`

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Common items</h2>
        <span className="pill pill--warn" title={snapshot.disclaimer}>
          sample data
        </span>
      </div>

      <p className="usage__hint">Tap an item for details.</p>

      <div className="usage__stack">
        <RankedList
          title="Held items"
          items={sorted}
          accent="#e0a030"
          kind="item"
        />
      </div>

      <p className="usage__meta">
        {label} · captured {snapshot.capturedAt}
      </p>
    </section>
  )
}
