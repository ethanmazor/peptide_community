export interface Profile {
  id: string
  display_name: string | null
  email: string | null
  notification_time: string | null  // time as string e.g. "08:00:00"
  reminder_lead_min: number
  created_at: string
}
