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

export interface DosePhase {
  start_week: number        // 1-indexed week number from protocol start
  end_week: number | null   // null = open-ended (runs to protocol end or next phase)
  dose_mcg: number
}

export interface ProtocolPeptide {
  id: string
  protocol_id: string
  peptide_id: string
  dose_mcg: number
  frequency: string
  notes: string | null
  cycle_length_days: number | null
  scheduled_days: number[] | null   // JS getDay() values (0=Sun–6=Sat); null = every day
  scheduled_time: string | null     // "HH:MM:SS" UTC; null = use user default
  dose_phases: DosePhase[] | null   // null = single fixed dose; array = escalation schedule
  // joined fields
  peptide?: Peptide
  protocol?: Protocol
}
