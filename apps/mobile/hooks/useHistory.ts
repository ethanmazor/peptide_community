import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import type { DoseLog, Peptide } from '@peptide/types'

export interface BodyMetric {
  id: string
  dose_log_id: string
  user_id: string
  weight_kg: number | null
  body_fat_pct: number | null
  lean_mass_kg: number | null
  notes: string | null
  created_at: string
}

export interface HistoryEntry extends DoseLog {
  peptide: Peptide
  body_metric: BodyMetric | null
}

async function fetchHistory(userId: string): Promise<HistoryEntry[]> {
  // Fetch dose_logs joined to protocol_peptides -> peptides
  const { data: logs, error } = await supabase
    .from('dose_logs')
    .select(`
      *,
      protocol_peptide:protocol_peptides(
        *,
        peptide:peptides(*)
      )
    `)
    .order('administered_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const logIds = (logs ?? []).map((l) => l.id)

  let metricsMap: Record<string, BodyMetric> = {}
  if (logIds.length > 0) {
    const { data: metrics } = await supabase
      .from('body_metrics')
      .select('*')
      .in('dose_log_id', logIds)

    for (const m of metrics ?? []) {
      metricsMap[m.dose_log_id] = m as BodyMetric
    }
  }

  return (logs ?? []).map((log) => ({
    ...log,
    peptide: (log.protocol_peptide as { peptide: Peptide }).peptide,
    body_metric: metricsMap[log.id] ?? null,
  })) as HistoryEntry[]
}

export function useHistory() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''

  return useQuery({
    queryKey: ['history', userId],
    queryFn: () => fetchHistory(userId),
    enabled: !!userId,
  })
}
