import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'
import { useSession } from '../contexts/SessionContext'
import type { DoseLog } from '@peptide/types'

export interface LogDoseInput {
  protocol_peptide_id: string
  vial_id: string | null
  administered_at: string
  dose_mcg: number
  units_drawn: number | null
  injection_site: string | null
  notes: string | null
  weight_lbs: number | null
  body_fat_pct: number | null
}

export function useLogDose() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const userId = session?.user.id ?? ''

  return useMutation({
    mutationFn: async (input: LogDoseInput) => {
      const { weight_lbs, body_fat_pct, ...doseFields } = input

      const doseLog = await apiFetch<DoseLog>('/doses', {
        method: 'POST',
        body: JSON.stringify(doseFields),
      })

      // If body metrics provided, save them directly to Supabase
      if (weight_lbs !== null || body_fat_pct !== null) {
        const weight_kg = weight_lbs !== null ? weight_lbs / 2.20462 : null
        const lean_mass_kg =
          weight_kg !== null && body_fat_pct !== null
            ? weight_kg * (1 - body_fat_pct / 100)
            : null

        await supabase.from('body_metrics').insert({
          dose_log_id: doseLog.id,
          user_id: userId,
          weight_kg,
          body_fat_pct,
          lean_mass_kg,
        })
      }

      return doseLog
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home', userId] })
    },
  })
}
