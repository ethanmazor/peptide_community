import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { usePeptides } from '../hooks/usePeptides'
import { useCreateProtocol, useEditProtocol, useProtocol, type PeptideEntry } from '../hooks/useProtocol'
import type { Peptide } from '@peptide/types'

type Step = 1 | 2 | 3

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every other day',
  'Every 3 days',
  'Weekly',
  'Twice weekly',
  'Custom',
]

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
              s === step
                ? 'bg-teal text-white'
                : s < step
                ? 'bg-teal/20 text-teal'
                : 'bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)]'
            }`}
          >
            {s}
          </div>
          {s < 3 && (
            <div
              className={`flex-1 h-px w-8 ${s < step ? 'bg-teal' : 'bg-[var(--color-border-tertiary)]'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
      {children}
    </label>
  )
}

function textInput(
  value: string,
  onChange: (v: string) => void,
  placeholder: string,
  type = 'text'
) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
      style={{ color: 'var(--color-text-primary)' }}
    />
  )
}

interface AddPeptideSheetProps {
  peptides: Peptide[]
  onAdd: (entry: PeptideEntry) => void
  onClose: () => void
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function AddPeptideSheet({ peptides, onAdd, onClose }: AddPeptideSheetProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Peptide | null>(null)
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('Once daily')
  const [notes, setNotes] = useState('')
  const [cycleLength, setCycleLength] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'frequency' | 'days'>('frequency')
  const [scheduledDays, setScheduledDays] = useState<number[]>([])
  const [reminderTime, setReminderTime] = useState('')
  const [dosingMode, setDosingMode] = useState<'single' | 'phases'>('single')
  const [dosePhases, setDosePhases] = useState<Array<{ start_week: string; end_week: string; dose_mcg: string }>>([
    { start_week: '1', end_week: '', dose_mcg: '' },
  ])

  const filtered = peptides.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function addPhase() {
    setDosePhases((prev) => {
      const last = prev[prev.length - 1]
      const nextStart = last.end_week ? String(Number(last.end_week) + 1) : ''
      return [...prev, { start_week: nextStart, end_week: '', dose_mcg: '' }]
    })
  }

  function removePhase(idx: number) {
    setDosePhases((prev) => prev.filter((_, i) => i !== idx))
  }

  function updatePhase(idx: number, field: 'start_week' | 'end_week' | 'dose_mcg', value: string) {
    setDosePhases((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  function handleSelectPeptide(p: Peptide) {
    setSelected(p)
    if (p.typical_dose_mcg) {
      setDose(String(p.typical_dose_mcg))
      setDosePhases([{ start_week: '1', end_week: '', dose_mcg: String(p.typical_dose_mcg) }])
    }
    if (p.typical_frequency) {
      const matched = FREQUENCIES.find(
        (f) => f.toLowerCase() === p.typical_frequency?.toLowerCase()
      )
      setFrequency(matched ?? 'Once daily')
    }
    setSearch(p.name)
  }

  function toggleDay(dow: number) {
    setScheduledDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    )
  }

  function derivedFrequency(): string {
    if (scheduleMode === 'frequency') return frequency
    if (scheduledDays.length === 0) return 'Daily'
    if (scheduledDays.length === 7) return 'Daily'
    return scheduledDays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAYS[d])
      .join('/')
  }

  function handleAdd() {
    if (!selected) return
    const firstDose = dosingMode === 'phases' ? Number(dosePhases[0]?.dose_mcg) : Number(dose)
    if (!firstDose) return

    const phases =
      dosingMode === 'phases'
        ? dosePhases
            .filter((p) => p.dose_mcg)
            .map((p) => ({
              start_week: Number(p.start_week) || 1,
              end_week: p.end_week ? Number(p.end_week) : null,
              dose_mcg: Number(p.dose_mcg),
            }))
        : null

    onAdd({
      peptide_id: selected.id,
      peptide: selected,
      dose_mcg: firstDose,
      frequency: derivedFrequency(),
      notes: notes || null,
      cycle_length_days: cycleLength ? Number(cycleLength) : null,
      scheduled_days: scheduleMode === 'days' && scheduledDays.length > 0 ? scheduledDays : null,
      scheduled_time: reminderTime || null,
      dose_phases: phases,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background-primary)]">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[16px] font-medium">Add peptide</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <div>
          <FieldLabel>Peptide</FieldLabel>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (selected && e.target.value !== selected.name) setSelected(null)
            }}
            placeholder="Search peptide library…"
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {!selected && search && (
            <div className="rounded-lg border border-[var(--color-border-tertiary)] overflow-hidden">
              {filtered.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPeptide(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-[var(--color-border-tertiary)] last:border-0"
                  style={{ borderBottomWidth: '0.5px' }}
                >
                  <span className="text-[14px] text-[var(--color-text-primary)]">{p.name}</span>
                  {p.alias && (
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">{p.alias}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2.5 text-[13px] text-[var(--color-text-secondary)]">
                  No results
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Schedule</FieldLabel>
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-tertiary)] mb-2">
            {(['frequency', 'days'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScheduleMode(mode)}
                className={`flex-1 h-9 text-[13px] font-medium transition-colors ${
                  scheduleMode === mode
                    ? 'bg-teal text-white'
                    : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {mode === 'frequency' ? 'Frequency' : 'Days of week'}
              </button>
            ))}
          </div>

          {scheduleMode === 'frequency' ? (
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          ) : (
            <div className="flex gap-2">
              {DAYS.map((label, dow) => (
                <button
                  key={dow}
                  type="button"
                  onClick={() => toggleDay(dow)}
                  className={`flex-1 h-8 rounded-md text-[12px] font-medium transition-colors ${
                    scheduledDays.includes(dow)
                      ? 'bg-teal text-white'
                      : 'bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dose */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <FieldLabel>Dose (mcg)</FieldLabel>
            <button
              type="button"
              onClick={() => {
                const next = dosingMode === 'single' ? 'phases' : 'single'
                setDosingMode(next)
                if (next === 'phases') {
                  setDosePhases([{ start_week: '1', end_week: '', dose_mcg: dose }])
                }
              }}
              className="text-[11px] text-teal font-medium"
            >
              {dosingMode === 'single' ? '+ Add dose changes' : '− Single dose'}
            </button>
          </div>

          {dosingMode === 'single' ? (
            textInput(dose, setDose, '250', 'number')
          ) : (
            <div className="flex flex-col gap-2">
              {dosePhases.map((phase, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[12px] text-[var(--color-text-tertiary)] shrink-0">Wk</span>
                  <input
                    type="number"
                    value={phase.start_week}
                    onChange={(e) => updatePhase(idx, 'start_week', e.target.value)}
                    placeholder="1"
                    className="w-12 h-9 px-2 text-[13px] text-center bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <span className="text-[12px] text-[var(--color-text-tertiary)]">–</span>
                  <input
                    type="number"
                    value={phase.end_week}
                    onChange={(e) => updatePhase(idx, 'end_week', e.target.value)}
                    placeholder="end"
                    className="w-12 h-9 px-2 text-[13px] text-center bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <input
                    type="number"
                    value={phase.dose_mcg}
                    onChange={(e) => updatePhase(idx, 'dose_mcg', e.target.value)}
                    placeholder="mcg"
                    className="flex-1 h-9 px-2 text-[13px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0">mcg</span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removePhase(idx)}
                      className="text-[var(--color-text-tertiary)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhase}
                className="flex items-center gap-1 text-teal text-[13px] font-medium"
              >
                <Plus size={14} />
                Add week range
              </button>
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Notes (optional)</FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes…"
            rows={3}
            className="w-full px-3 py-2.5 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal resize-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        <div>
          <FieldLabel>Cycle length (days, optional)</FieldLabel>
          {textInput(cycleLength, setCycleLength, 'e.g. 30', 'number')}
          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-1">
            If set, shows this peptide's own progress independent of the protocol end date.
          </p>
        </div>


        <div>
          <FieldLabel>Reminder time (optional — overrides your default)</FieldLabel>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)]">
        <button
          onClick={handleAdd}
          disabled={!selected || (dosingMode === 'single' ? !dose : !dosePhases[0]?.dose_mcg)}
          className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-40"
        >
          Add to protocol
        </button>
      </div>
    </div>
  )
}

export default function ProtocolBuilder() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const isEditing = !!editId

  const { data: peptides } = usePeptides()
  const { data: existingProtocol, isLoading: loadingProtocol } = useProtocol(editId ?? null)
  const createProtocol = useCreateProtocol()
  const editProtocol = useEditProtocol()

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<PeptideEntry[]>([])
  const [originalEntries, setOriginalEntries] = useState<PeptideEntry[]>([])
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Pre-fill form when editing an existing protocol
  useEffect(() => {
    if (existingProtocol && !prefilled) {
      setName(existingProtocol.name)
      setStartDate(existingProtocol.start_date ?? new Date().toISOString().split('T')[0])
      setEndDate(existingProtocol.end_date ?? '')
      setNotes(existingProtocol.notes ?? '')
      const mapped: PeptideEntry[] = (existingProtocol.protocol_peptides ?? []).map((pp) => ({
        ppId: pp.id,
        peptide_id: pp.peptide_id,
        peptide: pp.peptide!,
        dose_mcg: pp.dose_mcg,
        frequency: pp.frequency,
        notes: pp.notes,
        cycle_length_days: pp.cycle_length_days,
        scheduled_days: pp.scheduled_days,
        scheduled_time: pp.scheduled_time,
        dose_phases: pp.dose_phases,
      }))
      setEntries(mapped)
      setOriginalEntries(mapped)
      setPrefilled(true)
    }
  }, [existingProtocol, prefilled])

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (isEditing && editId) {
      await editProtocol.mutateAsync({
        id: editId,
        name,
        notes: notes || null,
        start_date: startDate || null,
        end_date: endDate || null,
        peptides: entries,
        originalPeptides: originalEntries,
      })
      navigate('/settings', { replace: true })
    } else {
      const protocol = await createProtocol.mutateAsync({
        name,
        notes: notes || null,
        start_date: startDate || null,
        end_date: endDate || null,
        peptides: entries.map((e) => ({
          peptide_id: e.peptide_id,
          dose_mcg: e.dose_mcg,
          frequency: e.frequency,
          notes: e.notes ?? null,
          cycle_length_days: e.cycle_length_days ?? null,
          scheduled_days: e.scheduled_days ?? null,
          scheduled_time: e.scheduled_time ?? null,
          dose_phases: e.dose_phases ?? null,
        })),
      })

      navigate('/vial-setup', {
        state: {
          protocolId: protocol.id,
          protocolPeptides: protocol.protocol_peptides,
        },
      })
    }
  }

  const isPending = createProtocol.isPending || editProtocol.isPending

  if (isEditing && loadingProtocol && !prefilled) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[var(--color-background-primary)]">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => (s - 1) as Step))}
          className="text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[16px] font-medium">{isEditing ? 'Edit protocol' : 'New protocol'}</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32">
        <StepIndicator step={step} />

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Protocol name</FieldLabel>
              {textInput(name, setName, 'e.g. BPC-157 + TB-500 Stack')}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>Start date</FieldLabel>
                {textInput(startDate, setStartDate, '', 'date')}
              </div>
              <div className="flex-1">
                <FieldLabel>End date (optional)</FieldLabel>
                {textInput(endDate, setEndDate, '', 'date')}
              </div>
            </div>
            <div>
              <FieldLabel>Notes (optional)</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Goals, context, or reminders…"
                rows={4}
                className="w-full px-3 py-2.5 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal resize-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            {entries.length === 0 && (
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Add at least one peptide to continue.
              </p>
            )}

            {entries.map((entry, idx) => (
              <div
                key={entry.ppId ?? idx}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-background-secondary)]"
              >
                <div>
                  <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                    {entry.peptide.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                    {entry.dose_mcg} mcg · {entry.frequency}
                  </p>
                </div>
                <button
                  onClick={() => removeEntry(idx)}
                  className="p-1.5 text-[var(--color-text-tertiary)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--color-border-tertiary)] text-teal text-[14px]"
            >
              <Plus size={16} />
              Add peptide
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-[var(--color-background-secondary)] p-4 flex flex-col gap-3">
              <div>
                <p className="text-[12px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">
                  Protocol
                </p>
                <p className="text-[15px] font-medium text-[var(--color-text-primary)]">{name}</p>
                {startDate && (
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
                    {new Date(startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    {endDate &&
                      ` → ${new Date(endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                )}
                {notes && (
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">{notes}</p>
                )}
              </div>

              <div className="border-t border-[var(--color-border-tertiary)]" style={{ borderTopWidth: '0.5px' }} />

              <div>
                <p className="text-[12px] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">
                  Peptides
                </p>
                <div className="flex flex-col gap-2">
                  {entries.map((entry, idx) => (
                    <div key={entry.ppId ?? idx}>
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                        {entry.peptide.name}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">
                        {entry.dose_mcg} mcg · {entry.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)]">
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 1 ? !name.trim() : entries.length === 0}
            className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-60"
          >
            {isPending
              ? isEditing ? 'Saving…' : 'Activating…'
              : isEditing ? 'Save changes' : 'Activate protocol'}
          </button>
        )}
      </div>

      {showAddSheet && (
        <AddPeptideSheet
          peptides={peptides ?? []}
          onAdd={(entry) => {
            setEntries((prev) => [...prev, entry])
            setShowAddSheet(false)
          }}
          onClose={() => setShowAddSheet(false)}
        />
      )}
    </div>
  )
}
