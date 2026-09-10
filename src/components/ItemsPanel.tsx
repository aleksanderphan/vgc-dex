import type { UsageEntry, UsageSnapshot } from '../types'
import { RankedList } from './RankedList'

interface Props {
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

/** "Common held items" — sits directly below the abilities / moves lists. */
export function ItemsPanel({ entry }: Props) {
  if (!entry?.items?.length) return null

  const sorted = [...entry.items].sort((a, b) => b.pct - a.pct)

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Common items</h2>
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
    </section>
  )
}
