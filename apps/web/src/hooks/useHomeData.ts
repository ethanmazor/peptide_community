import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import type { Protocol, ProtocolPeptide, Peptide, Vial, DoseLog } from '@peptide/types'

const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true'

const today = new Date().toISOString()

const MOCK_DATA: HomeData = {
  protocol: {
    id: 'mock-protocol',
    user_id: 'mock-user',
    name: 'BPC-157 + TB-500 Stack',
    notes: null,
    start_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 44 * 86400000).toISOString().split('T')[0],
    status: 'active',
    is_public: false,
    shared_at: null,
    created_at: today,
  },
  items: [
    {
      id: 'mock-pp-1',
      protocol_id: 'mock-protocol',
      peptide_id: 'mock-peptide-1',
      dose_mcg: 250,
      frequency: 'twice daily',
      notes: null,
      peptide: {
        id: 'mock-peptide-1',
        created_by_user_id: null,
        name: 'BPC-157',
        alias: 'BPC',
        description: null,
        typical_dose_mcg: 250,
        typical_frequency: 'twice daily',
        half_life_hours: 4,
        is_default: true,
        is_active: true,
        created_at: today,
      },
      active_vial: {
        id: 'mock-vial-1',
        protocol_peptide_id: 'mock-pp-1',
        vial_size_mg: 5,
        bac_water_ml: 2,
        concentration_mcg_per_unit: 25,
        units_remaining: 72,
        vendor_name: 'Peptide Sciences',
        vendor_url: null,
        reconstituted_at: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 23 * 86400000).toISOString().split('T')[0],
        is_active: true,
        created_at: today,
      },
      todays_logs: [],
    },
    {
      id: 'mock-pp-2',
      protocol_id: 'mock-protocol',
      peptide_id: 'mock-peptide-2',
      dose_mcg: 2500,
      frequency: 'twice weekly',
      notes: null,
      peptide: {
        id: 'mock-peptide-2',
        created_by_user_id: null,
        name: 'TB-500',
        alias: 'TB4',
        description: null,
        typical_dose_mcg: 2500,
        typical_frequency: 'twice weekly',
        half_life_hours: 168,
        is_default: true,
        is_active: true,
        created_at: today,
      },
      active_vial: {
        id: 'mock-vial-2',
        protocol_peptide_id: 'mock-pp-2',
        vial_size_mg: 5,
        bac_water_ml: 1,
        concentration_mcg_per_unit: 50,
        units_remaining: 30,
        vendor_name: 'Peptide Sciences',
        vendor_url: null,
        reconstituted_at: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 27 * 86400000).toISOString().split('T')[0],
        is_active: true,
        created_at: today,
      },
      todays_logs: [
        {
          id: 'mock-log-1',
          protocol_peptide_id: 'mock-pp-2',
          vial_id: 'mock-vial-2',
          administered_at: new Date(Date.now() - 2 * 3600000).toISOString(),
          dose_mcg: 2500,
          units_drawn: 50,
          injection_site: 'Left abdomen',
          notes: null,
          created_at: today,
        },
      ],
    },
    {
      id: 'mock-pp-3',
      protocol_id: 'mock-protocol',
      peptide_id: 'mock-peptide-3',
      dose_mcg: 200,
      frequency: 'three times daily',
      notes: null,
      peptide: {
        id: 'mock-peptide-3',
        created_by_user_id: null,
        name: 'Ipamorelin',
        alias: 'Ipa',
        description: null,
        typical_dose_mcg: 200,
        typical_frequency: 'three times daily',
        half_life_hours: 2,
        is_default: true,
        is_active: true,
        created_at: today,
      },
      active_vial: null,
      todays_logs: [],
    },
  ],
}

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
    queryFn: () => PREVIEW_MODE ? Promise.resolve(MOCK_DATA) : fetchHomeData(userId),
    enabled: PREVIEW_MODE || !!userId,
  })
}
