import type { Protocol } from '@peptide/types'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

export interface PeptideCycleProgress {
  day: number
  total: number
  pct: number
}

export function getPeptideCycleProgress(
  item: HomeProtocolPeptide,
  protocol: Protocol
): PeptideCycleProgress | null {
  if (!item.cycle_length_days || !protocol.start_date) return null

  const start = new Date(protocol.start_date)
  const now = new Date()
  const msPerDay = 86400000
  const elapsed = Math.floor((now.getTime() - start.getTime()) / msPerDay)

  const cycleDay = (elapsed % item.cycle_length_days) + 1
  const pct = cycleDay / item.cycle_length_days

  return { day: cycleDay, total: item.cycle_length_days, pct }
}
