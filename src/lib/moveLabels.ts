/** Shared move-fact label maps, used by both the full entity page and the compact ranked-list detail. */

/** PokéAPI target values that hit more than one Pokémon in a single use — everything else counts as Single. */
const SPREAD_TARGETS = new Set(['all-opponents', 'all-other-pokemon', 'all-pokemon'])

export function targetLabel(target: string): 'Single' | 'Spread' {
  return SPREAD_TARGETS.has(target) ? 'Spread' : 'Single'
}

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`
}
