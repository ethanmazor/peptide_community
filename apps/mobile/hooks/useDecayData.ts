import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import type { DoseLog } from '@peptide/types'
import type { HomeProtocolPeptide } from './useHomeData'

export interface DecayPeptideResult {
  protocolPeptideId: string
  peptideName: string
  halfLifeHours: number
  currentRemainingMcg: number
  peakRemainingMcg: number
  timeUntilClearHours: number
}

export interface DecayData {
  results: DecayPeptideResult[]
  computedAt: Date
}

export function computeDecay(
  logs: Pick<DoseLog, 'administered_at' | 'dose_mcg'>[],
  halfLifeHours: number,
  nowMs: number
): { currentRemainingMcg: number; timeUntilClearHours: number } {
  let currentRemainingMcg = 0

  for (const log of logs) {
    const elapsedHours =
      (nowMs - new Date(log.administered_at).getTime()) / 3_600_000
    currentRemainingMcg += log.dose_mcg * Math.pow(0.5, elapsedHours / halfLifeHours)
  }

  const timeUntilClearHours =
    currentRemainingMcg > 1
      ? halfLifeHours * Math.log2(currentRemainingMcg)
      : 0

  return { currentRemainingMcg, timeUntilClearHours }
}

async function fetchDecayData(
  items: HomeProtocolPeptide[],
  userId: string
): Promise<DecayData> {
  const eligibleItems = items.filter((i) => i.peptide.half_life_hours !== null)
  if (eligibleItems.length === 0) return { results: [], computedAt: new Date() }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const ppIds = eligibleItems.map((i) => i.id)

  const { data: logs, error } = await supabase
    .from('dose_logs')
    .select('id, protocol_peptide_id, administered_at, dose_mcg')
    .in('protocol_peptide_id', ppIds)
    .gte('administered_at', sevenDaysAgo)
    .order('administered_at', { ascending: false })

  if (error) throw error

  const logsByPpId = new Map<string, typeof logs>()
  for (const log of logs ?? []) {
    const arr = logsByPpId.get(log.protocol_peptide_id) ?? []
    arr.push(log)
    logsByPpId.set(log.protocol_peptide_id, arr)
  }

  const nowMs = Date.now()
  const results: DecayPeptideResult[] = []

  for (const item of eligibleItems) {
    const halfLifeHours = item.peptide.half_life_hours!
    const itemLogs = logsByPpId.get(item.id) ?? []
    const { currentRemainingMcg, timeUntilClearHours } = computeDecay(
      itemLogs,
      halfLifeHours,
      nowMs
    )

    if (currentRemainingMcg < 0.01) continue

    const peakRemainingMcg =
      itemLogs.length > 0
        ? Math.max(...itemLogs.map((l) => l.dose_mcg))
        : item.dose_mcg

    results.push({
      protocolPeptideId: item.id,
      peptideName: item.peptide.name,
      halfLifeHours,
      currentRemainingMcg,
      peakRemainingMcg: Math.max(peakRemainingMcg, 0.001),
      timeUntilClearHours,
    })
  }

  return { results, computedAt: new Date() }
}

export function useDecayData(items: HomeProtocolPeptide[]) {
  const { session } = useSession()
  const userId = session?.user.id ?? ''
  const ppIds = items.map((i) => i.id).sort().join(',')

  return useQuery({
    queryKey: ['decay', userId, ppIds],
    queryFn: () => fetchDecayData(items, userId),
    enabled: !!userId && items.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}
