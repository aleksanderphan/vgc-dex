import type { TypeName } from '../types'
import {
  defensiveMatchups,
  offensiveCoverage,
  type Matchup,
} from '../lib/typechart'
import { TypeBadge } from './TypeBadge'

function mult(m: number): string {
  switch (m) {
    case 4:
      return '×4'
    case 2:
      return '×2'
    case 0.5:
      return '×½'
    case 0.25:
      return '×¼'
    case 0:
      return '×0'
    default:
      return `×${m}`
  }
}

function Group({
  title,
  hint,
  items,
  empty,
}: {
  title: string
  hint: string
  items: Matchup[]
  empty: string
}) {
  return (
    <div className="matchup-group">
      <div className="matchup-group__head">
        <h3>{title}</h3>
        <span className="matchup-group__hint">{hint}</span>
      </div>
      {items.length ? (
        <div className="badge-wrap">
          {items.map((it) => (
            <TypeBadge
              key={it.type}
              type={it.type}
              size="sm"
              tag={mult(it.multiplier)}
            />
          ))}
        </div>
      ) : (
        <p className="muted-sm">{empty}</p>
      )}
    </div>
  )
}

export function TypeMatchups({ types }: { types: TypeName[] }) {
  const { weak, resist, immune } = defensiveMatchups(types)
  const strong = offensiveCoverage(types)

  return (
    <div className="matchups">
      <Group
        title="Strong against"
        hint="its STAB hits these super-effectively"
        items={strong}
        empty="No super-effective STAB coverage."
      />
      <Group
        title="Weak to"
        hint="takes extra damage from"
        items={weak}
        empty="No type weaknesses."
      />
      <Group
        title="Resists"
        hint="takes reduced damage from"
        items={resist}
        empty="Resists nothing."
      />
      <Group
        title="Immune to"
        hint="takes no damage from"
        items={immune}
        empty="No immunities."
      />
    </div>
  )
}
