import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { Protocol, ProtocolPeptide, Peptide } from '@peptide/types'

export interface ProtocolWithPeptides extends Protocol {
  protocol_peptides: Array<ProtocolPeptide & { peptide: Peptide }>
}

export interface CreateProtocolInput {
  name: string
  notes?: string | null
  start_date?: string | null
  end_date?: string | null
  peptides: Array<{
    peptide_id: string
    dose_mcg: number
    frequency: string
    notes?: string | null
  }>
}

export function useCreateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: CreateProtocolInput) =>
      apiFetch<ProtocolWithPeptides>('/protocols', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
}
