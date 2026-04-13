import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { Peptide } from '@peptide/types'

export function usePeptides() {
  return useQuery({
    queryKey: ['peptides'],
    queryFn: () => apiFetch<Peptide[]>('/peptides'),
  })
}

export function useCreatePeptide() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: Partial<Peptide>) =>
      apiFetch<Peptide>('/peptides', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peptides'] })
    },
  })
}

export function useUpdatePeptide() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Peptide> & { id: string }) =>
      apiFetch<Peptide>(`/peptides/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peptides'] })
    },
  })
}
