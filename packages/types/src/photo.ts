export interface Photo {
  id: string
  dose_log_id: string
  user_id: string
  storage_path: string
  caption: string | null
  taken_at: string
}
