import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import type { Protocol, ProtocolPeptide, Peptide, DosePhase } from '@peptide/types'

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
    cycle_length_days?: number | null
    scheduled_days?: number[] | null
    scheduled_time?: string | null
    dose_phases?: DosePhase[] | null
  }>
}

export interface PeptideEntry {
  peptide_id: string
  peptide: Peptide
  dose_mcg: number
  frequency: string
  notes: string | null
  cycle_length_days?: number | null
  scheduled_days?: number[] | null
  scheduled_time?: string | null
  dose_phases?: DosePhase[] | null
  /** Defined when this entry already exists in the DB */
  ppId?: string
}

export function useProtocol(id: string | null) {
  return useQuery({
    queryKey: ['protocol', id],
    queryFn: () => apiFetch<ProtocolWithPeptides>(`/protocols/${id}`),
    enabled: !!id,
  })
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

export interface EditProtocolInput {
  id: string
  name: string
  notes?: string | null
  start_date?: string | null
  end_date?: string | null
  /** Full desired peptide list after editing */
  peptides: PeptideEntry[]
  /** Original peptide list before editing (to compute diff) */
  originalPeptides: PeptideEntry[]
}

export function useEditProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name, notes, start_date, end_date, peptides, originalPeptides }: EditProtocolInput) => {
      // 1. PATCH the protocol fields
      const protocol = await apiFetch<Protocol>(`/protocols/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, notes: notes ?? null, start_date: start_date ?? null, end_date: end_date ?? null }),
      })

      const originalIds = new Set(originalPeptides.map((p) => p.ppId).filter(Boolean))
      const newIds = new Set(peptides.map((p) => p.ppId).filter(Boolean))

      // 2. Delete removed peptides
      const removed = originalPeptides.filter((p) => p.ppId && !newIds.has(p.ppId))
      await Promise.all(
        removed.map((p) =>
          apiFetch(`/protocols/${id}/peptides/${p.ppId}`, { method: 'DELETE' })
        )
      )

      // 3. Add new peptides (those without a ppId)
      const added = peptides.filter((p) => !p.ppId)
      await Promise.all(
        added.map((p) =>
          apiFetch(`/protocols/${id}/peptides`, {
            method: 'POST',
            body: JSON.stringify({
              peptide_id: p.peptide_id,
              dose_mcg: p.dose_mcg,
              frequency: p.frequency,
              notes: p.notes ?? null,
              cycle_length_days: p.cycle_length_days ?? null,
              scheduled_days: p.scheduled_days ?? null,
              scheduled_time: p.scheduled_time ?? null,
              dose_phases: p.dose_phases ?? null,
            }),
          })
        )
      )

      // Return the updated protocol with peptides
      return apiFetch<ProtocolWithPeptides>(`/protocols/${id}`)
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['home'] })
      queryClient.invalidateQueries({ queryKey: ['protocol', vars.id] })
    },
  })
}
