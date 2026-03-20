import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import type { Protocol, ProtocolPeptide, Peptide, Vial, DoseLog } from '@peptide/types'

export interface HomeProtocolPeptide extends ProtocolPeptide {
  peptide: Peptide
  active_vial: Vial | null
  todays_logs: DoseLog[]
}

export interface HomeData {
  protocol: Protocol | null
  items: HomeProtocolPeptide[]
}

async function fetchHomeData(userId: string): Promise<HomeData> {
  const today = new Date().toISOString().split('T')[0]

  // Fetch active protocol
  const { data: protocols, error: protoError } = await supabase
    .from('protocols')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (protoError) throw protoError

  const protocol: Protocol | null = protocols?.[0] ?? null
  if (!protocol) return { protocol: null, items: [] }

  // Fetch protocol_peptides with peptide info
  const { data: ppRows, error: ppError } = await supabase
    .from('protocol_peptides')
    .select('*, peptide:peptides(*)')
    .eq('protocol_id', protocol.id)

  if (ppError) throw ppError

  const items: HomeProtocolPeptide[] = await Promise.all(
    (ppRows ?? []).map(async (pp) => {
      // Active vial
      const { data: vials } = await supabase
        .from('vials')
        .select('*')
        .eq('protocol_peptide_id', pp.id)
        .eq('is_active', true)
        .limit(1)

      const active_vial: Vial | null = vials?.[0] ?? null

      // Today's dose logs
      const { data: logs } = await supabase
        .from('dose_logs')
        .select('*')
        .eq('protocol_peptide_id', pp.id)
        .gte('administered_at', `${today}T00:00:00`)
        .lt('administered_at', `${today}T23:59:59.999`)

      return {
        ...pp,
        peptide: pp.peptide as Peptide,
        active_vial,
        todays_logs: (logs ?? []) as DoseLog[],
      }
    })
  )

  return { protocol, items }
}

export function useHomeData() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''

  return useQuery({
    queryKey: ['home', userId],
    queryFn: () => fetchHomeData(userId),
    enabled: !!userId,
  })
}
