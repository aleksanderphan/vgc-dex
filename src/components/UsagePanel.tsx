import { useId, useState } from 'react'
import type {
  AbilityInfo,
  MoveInfo,
  UsageEntry,
  UsageItem,
  UsageSnapshot,
} from '../types'
import { abilityInfo, moveInfo } from '../lib/data'
import { TypeBadge } from './TypeBadge'
import { titleCase } from '../lib/typechart'

function MoveDetail({ info }: { info: MoveInfo }) {
  return (
    <div className="detail">
      <div className="detail__facts">
        <TypeBadge type={info.type} size="sm" />
        <span className="detail__fact">{titleCase(info.category)}</span>
        <span className="detail__fact">
          Power <b>{info.power ?? '—'}</b>
        </span>
        <span className="detail__fact">
          Acc <b>{info.accuracy == null ? '—' : `${info.accuracy}%`}</b>
        </span>
        <span className="detail__fact">
          PP <b>{info.pp ?? '—'}</b>
        </span>
        {info.priority !== 0 ? (
          <span className="detail__fact">
            Priority <b>{info.priority > 0 ? `+${info.priority}` : info.priority}</b>
          </span>
        ) : null}
      </div>
      <p className="detail__text">{info.effect}</p>
    </div>
  )
}

function AbilityDetail({ info }: { info: AbilityInfo }) {
  return (
    <div className="detail">
      <p className="detail__text">{info.effect}</p>
    </div>
  )
}

function RankedList({
  title,
  items,
  accent,
  kind,
}: {
  title: string
  items: UsageItem[]
  accent: string
  kind: 'ability' | 'move'
}) {
  const [open, setOpen] = useState<string | null>(null)
  const baseId = useId()
  const max = items.reduce((m, it) => Math.max(m, it.pct), 0) || 100

  return (
    <div className="ranked">
      <h3 className="ranked__title">{title}</h3>
      <ol className="ranked__list">
        {items.map((it, i) => {
          const info =
            kind === 'move' ? moveInfo(it.name) : abilityInfo(it.name)
          const isOpen = open === it.name
          const panelId = `${baseId}-${i}`
          return (
            <li className="ranked__item" key={it.name}>
              <button
                type="button"
                className={`ranked__row${isOpen ? ' is-open' : ''}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : it.name)}
              >
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
                <span className="ranked__chevron" aria-hidden="true">
                  ›
                </span>
              </button>
              {isOpen ? (
                <div className="ranked__detail" id={panelId}>
                  {info ? (
                    kind === 'move' ? (
                      <MoveDetail info={info as MoveInfo} />
                    ) : (
                      <AbilityDetail info={info as AbilityInfo} />
                    )
                  ) : (
                    <p className="detail__text detail__text--muted">
                      No details for {it.name} yet.
                    </p>
                  )}
                </div>
              ) : null}
            </li>
          )
        })}
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

      <p className="usage__hint">Tap an ability or move for details.</p>

      <div className="usage__grid">
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

      <p className="usage__meta">
        {label} · captured {snapshot.capturedAt}
      </p>
    </section>
  )
}
