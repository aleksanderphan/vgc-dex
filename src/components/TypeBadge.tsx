import type { TypeName } from '../types'
import { TYPE_COLORS, titleCase } from '../lib/typechart'

interface Props {
  type: TypeName
  /** Optional trailing tag, e.g. "×2" or "×¼". */
  tag?: string
  size?: 'sm' | 'md'
}

export function TypeBadge({ type, tag, size = 'md' }: Props) {
  return (
    <span
      className={`type-badge type-badge--${size}`}
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {titleCase(type)}
      {tag ? <span className="type-badge__tag">{tag}</span> : null}
    </span>
  )
}
