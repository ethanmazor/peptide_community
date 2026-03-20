export interface Peptide {
  id: string
  created_by_user_id: string | null
  name: string
  alias: string | null
  description: string | null
  typical_dose_mcg: number | null
  typical_frequency: string | null
  half_life_hours: number | null
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface Protocol {
  id: string
  user_id: string
  name: string
  notes: string | null
  start_date: string | null  // ISO date string
  end_date: string | null    // ISO date string
  status: 'active' | 'completed' | 'paused'
  is_public: boolean
  shared_at: string | null
  created_at: string
}

export interface ProtocolPeptide {
  id: string
  protocol_id: string
  peptide_id: string
  dose_mcg: number
  frequency: string
  notes: string | null
  // joined fields
  peptide?: Peptide
  protocol?: Protocol
}
