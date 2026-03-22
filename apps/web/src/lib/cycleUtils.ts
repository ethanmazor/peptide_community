import type { Protocol } from '@peptide/types'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

export interface PeptideCycleProgress {
  day: number
  total: number
  pct: number
}

/**
 * Returns per-peptide cycle progress if `item.cycle_length_days` is set.
 * Returns null if the peptide has no independent cycle length (protocol-level applies).
 */
export function getPeptideCycleProgress(
  item: HomeProtocolPeptide,
  protocol: Protocol
): PeptideCycleProgress | null {
  if (!item.cycle_length_days || !protocol.start_date) return null

  const start = new Date(protocol.start_date)
  const now = new Date()
  const msPerDay = 86400000
  const elapsed = Math.floor((now.getTime() - start.getTime()) / msPerDay)

  // Compute which day within the current cycle we're on (1-indexed)
  const cycleDay = (elapsed % item.cycle_length_days) + 1
  const pct = cycleDay / item.cycle_length_days

  return { day: cycleDay, total: item.cycle_length_days, pct }
}
