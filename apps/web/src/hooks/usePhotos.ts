import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import { useSession } from '../contexts/SessionContext'

export interface PhotoEntry {
  id: string
  dose_log_id: string
  user_id: string
  storage_path: string
  caption: string | null
  taken_at: string
  dose_log: {
    id: string
    administered_at: string
    dose_mcg: number
    notes: string | null
    protocol_peptide: {
      peptide: { id: string; name: string }
    }
  } | null
}

export interface RecentDoseLog {
  id: string
  administered_at: string
  peptide_name: string
}

async function fetchPhotos(): Promise<PhotoEntry[]> {
  const { data, error } = await supabase
    .from('photos')
    .select(`
      *,
      dose_log:dose_logs(
        id,
        administered_at,
        dose_mcg,
        notes,
        protocol_peptide:protocol_peptides(
          peptide:peptides(id, name)
        )
      )
    `)
    .order('taken_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PhotoEntry[]
}

async function fetchRecentDoseLogs(): Promise<RecentDoseLog[]> {
  const { data, error } = await supabase
    .from('dose_logs')
    .select(`
      id,
      administered_at,
      protocol_peptide:protocol_peptides(
        peptide:peptides(name)
      )
    `)
    .order('administered_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((log: any) => ({
    id: log.id,
    administered_at: log.administered_at,
    peptide_name: log.protocol_peptide?.peptide?.name ?? 'Unknown',
  }))
}

export function usePhotos() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''

  return useQuery({
    queryKey: ['photos', userId],
    queryFn: fetchPhotos,
    enabled: !!userId,
  })
}

export function useRecentDoseLogs() {
  const { session } = useSession()
  const userId = session?.user.id ?? ''

  return useQuery({
    queryKey: ['recent-dose-logs', userId],
    queryFn: fetchRecentDoseLogs,
    enabled: !!userId,
  })
}

export function useGetPhotoUrl() {
  return (storagePath: string) => {
    const { data } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(storagePath)
    return data.publicUrl
  }
}

export function useUploadPhoto() {
  const queryClient = useQueryClient()
  const { session } = useSession()

  return useMutation({
    mutationFn: async ({
      file,
      doseLogId,
      caption,
    }: {
      file: File
      doseLogId: string
      caption: string | null
    }) => {
      // 1. Get signed upload URL from API
      const { upload_url, storage_path } = await apiFetch<{
        upload_url: string
        storage_path: string
      }>('/photos/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, content_type: file.type }),
      })

      // 2. Upload file directly to Supabase Storage
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      // 3. Save photo record via API
      return apiFetch('/photos', {
        method: 'POST',
        body: JSON.stringify({
          dose_log_id: doseLogId,
          storage_path,
          caption: caption || null,
          taken_at: new Date().toISOString(),
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', session?.user.id] })
    },
  })
}
