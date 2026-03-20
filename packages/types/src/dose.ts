export interface DoseLog {
  id: string
  protocol_peptide_id: string
  vial_id: string | null
  administered_at: string  // ISO timestamptz
  dose_mcg: number
  units_drawn: number | null
  injection_site: string | null
  notes: string | null
  created_at: string
}

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

export interface Symptom {
  id: string
  dose_log_id: string
  user_id: string
  symptom: string
  severity: number | null
  notes: string | null
  occurred_at: string
}
