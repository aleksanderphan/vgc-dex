import type { ReactNode } from 'react'
import type { AbilityInfo, ItemInfo, MoveInfo } from '../types'
import type { EntityKind } from '../lib/data'
import { entityBySlug, usersOf } from '../lib/data'
import { TypeBadge } from './TypeBadge'
import { DataPill } from './DataPill'
import { titleCase } from '../lib/typechart'

const KIND_LABEL: Record<EntityKind, string> = {
  move: 'Move',
  ability: 'Ability',
  item: 'Item',
}

const STAT_LABEL: Record<string, string> = {
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
  accuracy: 'Accuracy',
  evasion: 'Evasion',
}

const TARGET_LABEL: Record<string, string> = {
  'selected-pokemon': 'One selected target',
  'all-opponents': 'Both opponents',
  'all-other-pokemon': 'All other Pokémon',
  'random-opponent': 'A random opponent',
  'users-field': "User's side",
  'user-and-allies': "User's side",
  'entire-field': 'The whole field',
  'opponents-field': "Opponents' side",
  user: 'The user',
  ally: 'An ally',
  'all-pokemon': 'Every Pokémon',
  'specific-move': 'Depends on the move',
}

function genLabel(gen: string | null): string | null {
  if (!gen) return null
  const roman = gen.replace('generation-', '').toUpperCase()
  return roman ? `Gen ${roman}` : null
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}

/** PokéAPI effect text: blank lines split paragraphs, `* ` lines are bullets. */
function RichText({ text }: { text: string }) {
  const paras = text
    .split('\n\n')
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div className="rich-text">
      {paras.map((para, i) => {
        const lines = para.split('\n')
        if (lines.every((l) => l.startsWith('* '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{para.replace(/\n/g, ' ')}</p>
      })}
    </div>
  )
}

function Notes({ notes }: { notes: string[] }) {
  return (
    <div className="entity-notes">
      <h3 className="entity-notes__title">Competitive notes</h3>
      <ul>
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
      <p className="entity-notes__src">
        Hand-authored — mechanics PokéAPI's text doesn't spell out.
      </p>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="entity-fact">
      <span className="entity-fact__label">{label}</span>
      <span className="entity-fact__value">{value}</span>
    </div>
  )
}

function MoveFacts({ info }: { info: MoveInfo }) {
  const hits =
    info.minHits && info.maxHits
      ? info.minHits === info.maxHits
        ? `${info.minHits}`
        : `${info.minHits}–${info.maxHits}`
      : null

  return (
    <div className="entity-facts">
      <Fact label="Category" value={titleCase(info.category)} />
      <Fact label="Power" value={info.power ?? '—'} />
      <Fact
        label="Accuracy"
        value={info.accuracy == null ? '— (never misses)' : `${info.accuracy}%`}
      />
      <Fact label="PP" value={info.pp ?? '—'} />
      <Fact
        label="Priority"
        value={info.priority === 0 ? '0' : signed(info.priority)}
      />
      {info.target ? (
        <Fact
          label="Target"
          value={TARGET_LABEL[info.target] ?? titleCase(info.target)}
        />
      ) : null}
      {hits ? <Fact label="Hits" value={`${hits}× per use`} /> : null}
      {info.critRate > 0 ? (
        <Fact label="Crit rate" value={`+${info.critRate} stage`} />
      ) : null}
      {info.drain > 0 ? (
        <Fact label="Drain" value={`heals ${info.drain}% of damage dealt`} />
      ) : null}
      {info.drain < 0 ? (
        <Fact
          label="Recoil"
          value={`${Math.abs(info.drain)}% of damage dealt`}
        />
      ) : null}
      {info.healing > 0 ? (
        <Fact label="Heal" value={`${info.healing}% of max HP`} />
      ) : null}
      {info.ailment ? (
        <Fact
          label="Status"
          value={
            info.ailmentChance > 0
              ? `${titleCase(info.ailment)} (${info.ailmentChance}%)`
              : titleCase(info.ailment)
          }
        />
      ) : null}
      {info.flinchChance > 0 ? (
        <Fact label="Flinch" value={`${info.flinchChance}%`} />
      ) : null}
      {info.statChanges.map((sc) => (
        <Fact
          key={sc.stat}
          label={`${STAT_LABEL[sc.stat] ?? titleCase(sc.stat)} ${signed(sc.change)}`}
          value={
            info.statChance > 0 && info.statChance < 100
              ? `${info.statChance}% chance`
              : 'on hit'
          }
        />
      ))}
      {genLabel(info.generation) ? (
        <Fact label="Introduced" value={genLabel(info.generation)} />
      ) : null}
    </div>
  )
}

function ItemFacts({ info }: { info: ItemInfo }) {
  return (
    <div className="entity-facts">
      {info.category ? (
        <Fact label="Category" value={titleCase(info.category)} />
      ) : null}
      {info.flingPower != null ? (
        <Fact label="Fling power" value={info.flingPower} />
      ) : null}
    </div>
  )
}

interface Props {
  kind: EntityKind
  slug: string
  onPickPokemon: (slug: string) => void
}

export function EntityPage({ kind, slug, onPickPokemon }: Props) {
  const info = entityBySlug(kind, slug)

  if (!info) {
    return (
      <article className="entity">
        <button
          type="button"
          className="entity__back"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
        <section className="card">
          <p className="muted-sm">
            No {kind} called “{slug}” in the reference data.
          </p>
        </section>
      </article>
    )
  }

  const users = usersOf(kind, info.name)
  const move = kind === 'move' ? (info as MoveInfo) : null

  return (
    <article className="entity">
      <button
        type="button"
        className="entity__back"
        onClick={() => window.history.back()}
      >
        ← Back
      </button>

      <section className="card">
        <div className="entity__head">
          {kind === 'item' && (info as ItemInfo).sprite ? (
            <img
              className="entity__sprite"
              src={(info as ItemInfo).sprite ?? ''}
              alt=""
              width="48"
              height="48"
            />
          ) : null}
          <div>
            <span className="entity__kind">{KIND_LABEL[kind]}</span>
            <h1 className="entity__title">{info.name}</h1>
            {move ? (
              <div className="badge-wrap entity__badges">
                <TypeBadge type={move.type} size="sm" />
              </div>
            ) : null}
          </div>
        </div>

        {move ? <MoveFacts info={move} /> : null}
        {kind === 'item' ? <ItemFacts info={info as ItemInfo} /> : null}
        {kind === 'ability' && genLabel((info as AbilityInfo).generation) ? (
          <div className="entity-facts">
            <Fact
              label="Introduced"
              value={genLabel((info as AbilityInfo).generation)}
            />
          </div>
        ) : null}

        <h3 className="entity__section">How it works</h3>
        {info.longEffect || info.effect ? (
          <>
            <RichText text={info.longEffect || info.effect} />
            <p className="entity__src">Effect text from PokéAPI.</p>
          </>
        ) : (
          <p className="detail__text detail__text--muted">
            No reference text — {info.unlisted ? 'not in PokéAPI, ' : ''}likely
            a Champions-original {KIND_LABEL[kind].toLowerCase()}.
          </p>
        )}

        {info.notes.length ? <Notes notes={info.notes} /> : null}
      </section>

      {users.length ? (
        <section className="card">
          <div className="section-head">
            <h2>Run by</h2>
            <DataPill />
          </div>
          <ul className="used-by">
            {users.map((u) => (
              <li key={u.slug}>
                <button
                  type="button"
                  className="used-by__row"
                  onClick={() => onPickPokemon(u.slug)}
                >
                  <span className="used-by__name">{u.name}</span>
                  <span className="used-by__pct">{u.pct.toFixed(1)}%</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
