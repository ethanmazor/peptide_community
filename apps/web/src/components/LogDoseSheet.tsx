import { useState, useEffect } from 'react'
import { Drawer } from 'vaul'
import { useLogDose } from '../hooks/useLogDose'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

const INJECTION_SITES = [
  'Left abdomen',
  'Right abdomen',
  'Left thigh',
  'Right thigh',
  'Left deltoid',
  'Right deltoid',
  'Custom...',
]

interface Props {
  item: HomeProtocolPeptide | null
  open: boolean
  onClose: () => void
  onDepleted?: (item: HomeProtocolPeptide) => void
}

export default function LogDoseSheet({ item, open, onClose, onDepleted }: Props) {
  const logDose = useLogDose()

  const [injectionSite, setInjectionSite] = useState('')
  const [customSite, setCustomSite] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')
  const [time, setTime] = useState('')

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      const now = new Date()
      setTime(now.toTimeString().slice(0, 5))
      setInjectionSite('')
      setCustomSite('')
      setWeightLbs('')
      setBodyFat('')
      setNotes('')
    }
  }, [item])

  if (!item) return null

  const concentration = item.active_vial?.concentration_mcg_per_unit ?? null
  const unitsDrawn = concentration ? item.dose_mcg / concentration : null
  const isDepletingVial =
    item.active_vial &&
    unitsDrawn !== null &&
    (item.active_vial.units_remaining ?? 0) - unitsDrawn <= 0

  const today = new Date().toISOString().split('T')[0]
  const administeredAt = time ? `${today}T${time}:00` : new Date().toISOString()

  const resolvedSite = injectionSite === 'Custom...' ? customSite : injectionSite

  async function handleSave() {
    if (!item) return

    await logDose.mutateAsync({
      protocol_peptide_id: item.id,
      vial_id: item.active_vial?.id ?? null,
      administered_at: administeredAt,
      dose_mcg: item.dose_mcg,
      units_drawn: unitsDrawn,
      injection_site: resolvedSite || null,
      notes: notes || null,
      weight_lbs: weightLbs ? Number(weightLbs) : null,
      body_fat_pct: bodyFat ? Number(bodyFat) : null,
    })

    if (isDepletingVial && onDepleted) {
      onClose()
      onDepleted(item)
    } else {
      onClose()
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} snapPoints={['95%']}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center focus:outline-none"
          style={{ height: '95dvh' }}
        >
          <div className="w-full max-w-[480px] flex flex-col rounded-t-xl bg-[var(--color-background-primary)] overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-8 h-[3px] rounded-full bg-[var(--color-border-secondary)]" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            <Drawer.Title className="text-[16px] font-medium mt-2 mb-5">
              Log {item.peptide.name}
            </Drawer.Title>

            <div className="flex flex-col gap-4">
              {/* Dose + Units row */}
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Dose
                  </label>
                  <div
                    className="h-10 px-3 flex items-center text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg text-[var(--color-text-tertiary)]"
                  >
                    {item.dose_mcg} mcg
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Units drawn
                  </label>
                  <div
                    className="h-10 px-3 flex items-center text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg text-[var(--color-text-tertiary)]"
                  >
                    {unitsDrawn !== null ? unitsDrawn.toFixed(2) : '—'}
                  </div>
                  {concentration && (
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      Based on {concentration.toFixed(1)} mcg/unit
                    </p>
                  )}
                </div>
              </div>

              {/* Time + Site row */}
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Site
                  </label>
                  <select
                    value={injectionSite}
                    onChange={(e) => setInjectionSite(e.target.value)}
                    className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: injectionSite ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}
                  >
                    <option value="">Select…</option>
                    {INJECTION_SITES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom site */}
              {injectionSite === 'Custom...' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Custom site
                  </label>
                  <input
                    type="text"
                    value={customSite}
                    onChange={(e) => setCustomSite(e.target.value)}
                    placeholder="e.g. Lower back"
                    className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>
              )}

              {/* Vial depletion warning */}
              {isDepletingVial && (
                <div
                  className="px-3 py-2.5 rounded-lg text-[13px]"
                  style={{
                    background: 'var(--color-background-warning)',
                    color: 'var(--color-text-warning)',
                  }}
                >
                  This will finish your vial. You'll be prompted to set up a new one after saving.
                </div>
              )}

              {/* Optional section */}
              <div className="border-t border-[var(--color-border-tertiary)] pt-4 mt-1 flex flex-col gap-4">
                <p className="text-[11px] text-[var(--color-text-tertiary)] -mb-2">Optional</p>

                {/* Weight + BF row */}
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(e.target.value)}
                      placeholder="185"
                      className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                      Body fat %
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      placeholder="18"
                      className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                      style={{ color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any observations…"
                    rows={3}
                    className="px-3 py-2.5 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal resize-none"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)] shrink-0">
            <button
              onClick={handleSave}
              disabled={logDose.isPending}
              className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-60"
            >
              {logDose.isPending ? 'Saving…' : 'Save dose'}
            </button>
          </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
