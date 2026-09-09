import type { UsageEntry, UsageItem, UsageSnapshot } from '../types'

function RankedList({
  title,
  items,
  accent,
}: {
  title: string
  items: UsageItem[]
  accent: string
}) {
  const max = items.reduce((m, it) => Math.max(m, it.pct), 0) || 100
  return (
    <div className="ranked">
      <h3 className="ranked__title">{title}</h3>
      <ol className="ranked__list">
        {items.map((it, i) => (
          <li className="ranked__row" key={it.name}>
            <span className="ranked__rank">{i + 1}</span>
            <span className="ranked__name">{it.name}</span>
            <span className="ranked__track">
              <span
                className="ranked__fill"
                style={{
                  width: `${(it.pct / max) * 100}%`,
                  backgroundColor: accent,
                }}
              />
            </span>
            <span className="ranked__pct">{it.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface Props {
  name: string
  entry: UsageEntry | undefined
  snapshot: UsageSnapshot
}

export function UsagePanel({ name, entry, snapshot }: Props) {
  const label = `Reg ${snapshot.regulation} · ${snapshot.season} · ${snapshot.ratingCutoff} · ${snapshot.source}`

  if (!entry) {
    return (
      <section className="card usage">
        <div className="section-head">
          <h2>Usage</h2>
          <span className="pill pill--warn">sample data</span>
        </div>
        <p className="muted-sm">
          No usage data yet for {name}. Pending live ingest from the Pokémon
          Champions Battle Data — see the project TODO.
        </p>
        <p className="usage__meta">{label}</p>
      </section>
    )
  }

  const sortedAbilities = [...entry.abilities].sort((a, b) => b.pct - a.pct)
  const sortedMoves = [...entry.moves].sort((a, b) => b.pct - a.pct)

  return (
    <section className="card usage">
      <div className="section-head">
        <h2>Usage</h2>
        <span className="pill pill--warn" title={snapshot.disclaimer}>
          sample data
        </span>
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

      <div className="usage__grid">
        <RankedList
          title="Common abilities"
          items={sortedAbilities}
          accent="#6c8cff"
        />
        <RankedList title="Common moves" items={sortedMoves} accent="#2fb170" />
      </div>

      {entry.teraTypes?.length ? (
        <div className="usage__tera">
          <h3 className="ranked__title">Common Tera types</h3>
          <div className="badge-wrap">
            {[...entry.teraTypes]
              .sort((a, b) => b.pct - a.pct)
              .map((t) => (
                <span className="tera-chip" key={t.name}>
                  {t.name} <b>{t.pct.toFixed(1)}%</b>
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <p className="usage__meta">
        {label} · captured {snapshot.capturedAt}
      </p>
    </section>
  )
}
