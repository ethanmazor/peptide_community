import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { Vial } from '@peptide/types'

export interface CreateVialInput {
  protocol_peptide_id: string
  vial_size_mg: number
  bac_water_ml: number
  vendor_name?: string | null
  vendor_url?: string | null
  reconstituted_at?: string | null
  expires_at?: string | null
}

export function useCreateVial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateVialInput) =>
      apiFetch<Vial>('/vials', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
