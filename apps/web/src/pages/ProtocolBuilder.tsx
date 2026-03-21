import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { usePeptides } from '../hooks/usePeptides'
import { useCreateProtocol } from '../hooks/useProtocol'
import type { Peptide } from '@peptide/types'

type Step = 1 | 2 | 3

interface ProtocolPeptideEntry {
  peptide: Peptide
  dose_mcg: number
  frequency: string
  notes: string
}

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
  onAdd: (entry: ProtocolPeptideEntry) => void
  onClose: () => void
}

function AddPeptideSheet({ peptides, onAdd, onClose }: AddPeptideSheetProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Peptide | null>(null)
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('Once daily')
  const [notes, setNotes] = useState('')

  const filtered = peptides.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelectPeptide(p: Peptide) {
    setSelected(p)
    if (p.typical_dose_mcg) setDose(String(p.typical_dose_mcg))
    if (p.typical_frequency) {
      const matched = FREQUENCIES.find(
        (f) => f.toLowerCase() === p.typical_frequency?.toLowerCase()
      )
      setFrequency(matched ?? 'Once daily')
    }
    setSearch(p.name)
  }

  function handleAdd() {
    if (!selected || !dose) return
    onAdd({
      peptide: selected,
      dose_mcg: Number(dose),
      frequency,
      notes,
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
        {/* Search / select */}
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

        {/* Dose */}
        <div>
          <FieldLabel>Dose (mcg)</FieldLabel>
          {textInput(dose, setDose, '250', 'number')}
        </div>

        {/* Frequency */}
        <div>
          <FieldLabel>Frequency</FieldLabel>
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
        </div>

        {/* Notes */}
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
      </div>

      <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)]">
        <button
          onClick={handleAdd}
          disabled={!selected || !dose}
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
  const { data: peptides } = usePeptides()
  const createProtocol = useCreateProtocol()

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState<ProtocolPeptideEntry[]>([])
  const [showAddSheet, setShowAddSheet] = useState(false)

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleActivate() {
    const protocol = await createProtocol.mutateAsync({
      name,
      notes: notes || null,
      start_date: startDate || null,
      end_date: endDate || null,
      peptides: entries.map((e) => ({
        peptide_id: e.peptide.id,
        dose_mcg: e.dose_mcg,
        frequency: e.frequency,
        notes: e.notes || null,
      })),
    })

    navigate('/vial-setup', {
      state: {
        protocolId: protocol.id,
        protocolPeptides: protocol.protocol_peptides,
      },
    })
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[var(--color-background-primary)]">
      {/* Nav */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep((s) => (s - 1) as Step))}
          className="text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[16px] font-medium">New protocol</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32">
        <StepIndicator step={step} />

        {/* Step 1 — Details */}
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

        {/* Step 2 — Peptides */}
        {step === 2 && (
          <div className="flex flex-col gap-3">
            {entries.length === 0 && (
              <p className="text-[14px] text-[var(--color-text-secondary)]">
                Add at least one peptide to continue.
              </p>
            )}

            {entries.map((entry, idx) => (
              <div
                key={idx}
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

        {/* Step 3 — Review */}
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
                    <div key={idx}>
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

      {/* Bottom CTA */}
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
            onClick={handleActivate}
            disabled={createProtocol.isPending}
            className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-60"
          >
            {createProtocol.isPending ? 'Activating…' : 'Activate protocol'}
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
