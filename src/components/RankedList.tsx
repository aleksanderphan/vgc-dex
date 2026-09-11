import { useId, useState } from 'react'
import type { AbilityInfo, ItemInfo, MoveInfo, UsageItem } from '../types'
import { abilityInfo, itemInfo, moveInfo } from '../lib/data'
import { TypeBadge } from './TypeBadge'
import { titleCase, TYPE_COLORS } from '../lib/typechart'
import { targetLabel, signed } from '../lib/moveLabels'

export type RankedKind = 'ability' | 'move' | 'item'

function Unlisted({ kind }: { kind: RankedKind }) {
  return (
    <p className="detail__text detail__text--muted">
      Champions-original {kind} — not in PokéAPI. Open the page for notes.
    </p>
  )
}

function MoveDetail({ info }: { info: MoveInfo }) {
  if (info.unlisted) return <Unlisted kind="move" />
  return (
    <>
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
            Priority <b>{signed(info.priority)}</b>
          </span>
        ) : null}
        {info.target ? (
          <span className="detail__fact">
            Target <b>{targetLabel(info.target)}</b>
          </span>
        ) : null}
      </div>
      <p className="detail__text">{info.effect}</p>
    </>
  )
}

function AbilityDetail({ info }: { info: AbilityInfo }) {
  if (info.unlisted) return <Unlisted kind="ability" />
  return <p className="detail__text">{info.effect}</p>
}

function ItemDetail({ info }: { info: ItemInfo }) {
  return (
    <div className="detail__item">
      {info.sprite ? (
        <img
          className="detail__item-sprite"
          src={info.sprite}
          alt=""
          width="40"
          height="40"
          loading="lazy"
        />
      ) : null}
      <p className="detail__text">
        {info.effect || 'No description available.'}
      </p>
    </div>
  )
}

function MoreLink({ kind, slug }: { kind: RankedKind; slug: string }) {
  return (
    <a
      className="detail__more"
      href={`#${kind}/${slug}`}
      title="Full details & competitive notes"
      aria-label="Full details & competitive notes"
    >
      <svg
        className="detail__more-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M9 5l7 7-7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  )
}

function detailFor(kind: RankedKind, name: string) {
  if (kind === 'move') {
    const info = moveInfo(name)
    if (!info) return null
    return (
      <>
        <MoveDetail info={info} />
        <MoreLink kind={kind} slug={info.slug} />
      </>
    )
  }
  if (kind === 'item') {
    const info = itemInfo(name)
    if (!info) return null
    return (
      <>
        <ItemDetail info={info} />
        <MoreLink kind={kind} slug={info.slug} />
      </>
    )
  }
  const info = abilityInfo(name)
  if (!info) return null
  return (
    <>
      <AbilityDetail info={info} />
      <MoreLink kind={kind} slug={info.slug} />
    </>
  )
}

interface Props {
  title: string
  items: UsageItem[]
  accent: string
  kind: RankedKind
}

/**
 * A ranked usage list whose rows expand in place to show reference details.
 * Multiple rows can be open at once — opening one never closes another.
 */
export function RankedList({ title, items, accent, kind }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set<string>())
  const baseId = useId()
  const max = items.reduce((m, it) => Math.max(m, it.pct), 0) || 100

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div className={`ranked ranked--${kind}`}>
      <h3 className="ranked__title">{title}</h3>
      <ol className="ranked__list">
        {items.map((it, i) => {
          const isOpen = open.has(it.name)
          const panelId = `${baseId}-${i}`
          const detail = isOpen ? detailFor(kind, it.name) : null
          const itemSprite =
            kind === 'item' ? itemInfo(it.name)?.sprite : undefined
          const moveType = kind === 'move' ? moveInfo(it.name)?.type : undefined
          return (
            <li className="ranked__item" key={it.name}>
              <button
                type="button"
                className={`ranked__row${isOpen ? ' is-open' : ''}`}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(it.name)}
              >
                {itemSprite ? (
                  <img
                    className="ranked__item-sprite"
                    src={itemSprite}
                    alt=""
                    width="24"
                    height="24"
                    loading="lazy"
                  />
                ) : moveType ? (
                  <span
                    className="ranked__dot"
                    style={{ backgroundColor: TYPE_COLORS[moveType] }}
                    title={titleCase(moveType)}
                  />
                ) : (
                  <span className="ranked__rank">{i + 1}</span>
                )}
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
                  {detail ?? (
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
