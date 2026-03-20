export interface Vial {
  id: string
  protocol_peptide_id: string
  vial_size_mg: number
  bac_water_ml: number
  concentration_mcg_per_unit: number  // generated column
  units_remaining: number | null
  vendor_name: string | null
  vendor_url: string | null
  reconstituted_at: string | null  // ISO date
  expires_at: string | null        // ISO date
  is_active: boolean
  created_at: string
}
