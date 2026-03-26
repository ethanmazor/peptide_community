export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  notification_time: string | null  // time as string e.g. "08:00:00"
  reminder_lead_min: number
  // Health info
  age: number | null
  sex: 'male' | 'female' | 'prefer_not_to_say' | null
  height_cm: number | null
  weight_kg: number | null
  body_fat_pct: number | null
  weight_unit: 'lbs' | 'kg'
  // Goals
  goals: string[] | null
  goals_notes: string | null
  // Onboarding
  onboarding_completed: boolean
  created_at: string
}
