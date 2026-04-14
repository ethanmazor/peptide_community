import { useState, useEffect } from 'react'
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react-native'
import type { Peptide } from '@peptide/types'
import { usePeptides } from '../hooks/usePeptides'
import {
  useCreateProtocol,
  useEditProtocol,
  useProtocol,
  type PeptideEntry,
} from '../hooks/useProtocol'
import { colors } from '../lib/colors'
import { FieldLabel } from './ui/FieldLabel'

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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const inputBase = {
  height: 40,
  paddingHorizontal: 12,
  fontSize: 14,
  backgroundColor: colors.bg.secondary,
  borderColor: colors.border.tertiary,
  borderWidth: 1,
  borderRadius: 8,
  color: colors.text.primary,
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <View className="flex-row items-center gap-2 mb-6">
      {([1, 2, 3] as Step[]).map((s) => (
        <View key={s} className="flex-row items-center gap-2">
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                s === step
                  ? colors.teal
                  : s < step
                  ? 'rgba(29,158,117,0.2)'
                  : colors.bg.secondary,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color:
                  s === step ? 'white' : s < step ? colors.teal : colors.text.tertiary,
              }}
            >
              {s}
            </Text>
          </View>
          {s < 3 && (
            <View
              style={{
                width: 32,
                height: 1,
                backgroundColor: s < step ? colors.teal : colors.border.tertiary,
              }}
            />
          )}
        </View>
      ))}
    </View>
  )
}

// ─── AddPeptideSheet ──────────────────────────────────────────────────────────

interface AddPeptideSheetProps {
  peptides: Peptide[]
  onAdd: (entry: PeptideEntry) => void
  onClose: () => void
}

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
  const [dosePhases, setDosePhases] = useState<
    Array<{ start_week: string; end_week: string; dose_mcg: string }>
  >([{ start_week: '1', end_week: '', dose_mcg: '' }])

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

  function updatePhase(
    idx: number,
    field: 'start_week' | 'end_week' | 'dose_mcg',
    value: string
  ) {
    setDosePhases((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    )
  }

  function handleSelectPeptide(p: Peptide) {
    setSelected(p)
    if (p.typical_dose_mcg) {
      setDose(String(p.typical_dose_mcg))
      setDosePhases([
        { start_week: '1', end_week: '', dose_mcg: String(p.typical_dose_mcg) },
      ])
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
    if (scheduledDays.length === 0 || scheduledDays.length === 7) return 'Daily'
    return scheduledDays
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAYS[d])
      .join('/')
  }

  function handleAdd() {
    if (!selected) return
    const firstDose =
      dosingMode === 'phases' ? Number(dosePhases[0]?.dose_mcg) : Number(dose)
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
      scheduled_days:
        scheduleMode === 'days' && scheduledDays.length > 0 ? scheduledDays : null,
      scheduled_time: reminderTime || null,
      dose_phases: phases,
    })
  }

  const canAdd =
    !!selected && (dosingMode === 'single' ? !!dose : !!dosePhases[0]?.dose_mcg)

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-bg-primary">
        <View
          className="flex-row items-center gap-3 px-4 pt-12 pb-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}
        >
          <Pressable onPress={onClose}>
            <ChevronLeft size={22} color={colors.text.secondary} />
          </Pressable>
          <Text className="text-[16px] font-medium text-txt-primary">Add peptide</Text>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <FieldLabel>Peptide</FieldLabel>
            <TextInput
              value={search}
              onChangeText={(v) => {
                setSearch(v)
                if (selected && v !== selected.name) setSelected(null)
              }}
              placeholder="Search peptide library…"
              placeholderTextColor={colors.text.tertiary}
              style={[inputBase, { marginBottom: 4 }]}
            />
            {!selected && search ? (
              <View
                style={{
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border.tertiary,
                  overflow: 'hidden',
                }}
              >
                {filtered.slice(0, 8).map((p, idx) => (
                  <Pressable
                    key={p.id}
                    onPress={() => handleSelectPeptide(p)}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: idx < Math.min(filtered.length, 8) - 1 ? 0.5 : 0,
                      borderBottomColor: colors.border.tertiary,
                    }}
                  >
                    <Text className="text-[14px] text-txt-primary">{p.name}</Text>
                    {p.alias ? (
                      <Text className="text-[11px] text-txt-tertiary">{p.alias}</Text>
                    ) : null}
                  </Pressable>
                ))}
                {filtered.length === 0 && (
                  <Text className="px-3 py-2.5 text-[13px] text-txt-secondary">
                    No results
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <View>
            <FieldLabel>Schedule</FieldLabel>
            <View
              className="flex-row rounded-lg overflow-hidden mb-2"
              style={{ borderWidth: 1, borderColor: colors.border.tertiary }}
            >
              {(['frequency', 'days'] as const).map((mode) => {
                const sel = scheduleMode === mode
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setScheduleMode(mode)}
                    style={{
                      flex: 1,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: sel ? colors.teal : colors.bg.secondary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: sel ? 'white' : colors.text.secondary,
                      }}
                    >
                      {mode === 'frequency' ? 'Frequency' : 'Days of week'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {scheduleMode === 'frequency' ? (
              <View className="flex-row flex-wrap gap-2">
                {FREQUENCIES.map((f) => {
                  const sel = frequency === f
                  return (
                    <Pressable
                      key={f}
                      onPress={() => setFrequency(f)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: sel ? colors.teal : colors.border.tertiary,
                        backgroundColor: sel
                          ? 'rgba(29,158,117,0.1)'
                          : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: sel ? colors.teal : colors.text.secondary,
                        }}
                      >
                        {f}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : (
              <View className="flex-row gap-2">
                {DAYS.map((label, dow) => {
                  const sel = scheduledDays.includes(dow)
                  return (
                    <Pressable
                      key={dow}
                      onPress={() => toggleDay(dow)}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: sel ? colors.teal : colors.bg.secondary,
                        borderWidth: sel ? 0 : 1,
                        borderColor: colors.border.tertiary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '500',
                          color: sel ? 'white' : colors.text.secondary,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          <View>
            <View className="flex-row items-center justify-between mb-1">
              <FieldLabel>Dose (mcg)</FieldLabel>
              <Pressable
                onPress={() => {
                  const next = dosingMode === 'single' ? 'phases' : 'single'
                  setDosingMode(next)
                  if (next === 'phases') {
                    setDosePhases([
                      { start_week: '1', end_week: '', dose_mcg: dose },
                    ])
                  }
                }}
              >
                <Text
                  style={{ fontSize: 11, color: colors.teal, fontWeight: '500' }}
                >
                  {dosingMode === 'single' ? '+ Add dose changes' : '− Single dose'}
                </Text>
              </Pressable>
            </View>

            {dosingMode === 'single' ? (
              <TextInput
                value={dose}
                onChangeText={setDose}
                keyboardType="decimal-pad"
                placeholder="250"
                placeholderTextColor={colors.text.tertiary}
                style={inputBase}
              />
            ) : (
              <View className="gap-2">
                {dosePhases.map((phase, idx) => (
                  <View key={idx} className="flex-row items-center gap-2">
                    <Text className="text-[12px] text-txt-tertiary">Wk</Text>
                    <TextInput
                      value={phase.start_week}
                      onChangeText={(v) => updatePhase(idx, 'start_week', v)}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={colors.text.tertiary}
                      style={[inputBase, { width: 48, height: 36, textAlign: 'center', paddingHorizontal: 4 }]}
                    />
                    <Text className="text-[12px] text-txt-tertiary">–</Text>
                    <TextInput
                      value={phase.end_week}
                      onChangeText={(v) => updatePhase(idx, 'end_week', v)}
                      keyboardType="number-pad"
                      placeholder="end"
                      placeholderTextColor={colors.text.tertiary}
                      style={[inputBase, { width: 52, height: 36, textAlign: 'center', paddingHorizontal: 4 }]}
                    />
                    <TextInput
                      value={phase.dose_mcg}
                      onChangeText={(v) => updatePhase(idx, 'dose_mcg', v)}
                      keyboardType="decimal-pad"
                      placeholder="mcg"
                      placeholderTextColor={colors.text.tertiary}
                      style={[inputBase, { flex: 1, height: 36, paddingHorizontal: 8 }]}
                    />
                    {idx > 0 && (
                      <Pressable onPress={() => removePhase(idx)}>
                        <Trash2 size={14} color={colors.text.tertiary} />
                      </Pressable>
                    )}
                  </View>
                ))}
                <Pressable onPress={addPhase} className="flex-row items-center gap-1">
                  <Plus size={14} color={colors.teal} />
                  <Text style={{ color: colors.teal, fontSize: 13, fontWeight: '500' }}>
                    Add week range
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View>
            <FieldLabel>Notes (optional)</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes…"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                backgroundColor: colors.bg.secondary,
                borderColor: colors.border.tertiary,
                borderWidth: 1,
                borderRadius: 8,
                color: colors.text.primary,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

          <View>
            <FieldLabel>Cycle length (days, optional)</FieldLabel>
            <TextInput
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="number-pad"
              placeholder="e.g. 30"
              placeholderTextColor={colors.text.tertiary}
              style={inputBase}
            />
            <Text className="text-[11px] text-txt-tertiary mt-1">
              If set, shows this peptide's own progress independent of the protocol end date.
            </Text>
          </View>

          <View>
            <FieldLabel>Reminder time (HH:MM — optional)</FieldLabel>
            <TextInput
              value={reminderTime}
              onChangeText={setReminderTime}
              placeholder="08:00"
              placeholderTextColor={colors.text.tertiary}
              style={inputBase}
            />
          </View>
        </ScrollView>

        <View
          className="px-4 pt-3 pb-8"
          style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}
        >
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            className="w-full h-11 bg-teal rounded-lg items-center justify-center"
            style={{ opacity: canAdd ? 1 : 0.4 }}
          >
            <Text className="text-[14px] font-medium text-white">Add to protocol</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

// ─── Main builder component ────────────────────────────────────────────────────

export default function ProtocolBuilder({ editId }: { editId?: string }) {
  const router = useRouter()
  const isEditing = !!editId

  const { data: peptides } = usePeptides()
  const { data: existingProtocol, isLoading: loadingProtocol } = useProtocol(
    editId ?? null
  )
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

  useEffect(() => {
    if (existingProtocol && !prefilled) {
      setName(existingProtocol.name)
      setStartDate(
        existingProtocol.start_date ?? new Date().toISOString().split('T')[0]
      )
      setEndDate(existingProtocol.end_date ?? '')
      setNotes(existingProtocol.notes ?? '')
      const mapped: PeptideEntry[] = (existingProtocol.protocol_peptides ?? []).map(
        (pp) => ({
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
        })
      )
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
      router.replace('/(app)/(tabs)/settings')
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
      router.replace({
        pathname: '/(app)/vial-setup',
        params: { data: JSON.stringify(protocol.protocol_peptides) },
      })
    }
  }

  const isPending = createProtocol.isPending || editProtocol.isPending

  if (isEditing && loadingProtocol && !prefilled) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <View
          style={{
            width: 20,
            height: 20,
            borderWidth: 2,
            borderColor: colors.teal,
            borderTopColor: 'transparent',
            borderRadius: 10,
          }}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-bg-primary">
      <View
        className="flex-row items-center gap-3 px-4 pt-12 pb-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}
      >
        <Pressable
          onPress={() => {
            if (step === 1) router.back()
            else setStep((s) => (s - 1) as Step)
          }}
        >
          <ChevronLeft size={22} color={colors.text.secondary} />
        </Pressable>
        <Text className="text-[16px] font-medium text-txt-primary">
          {isEditing ? 'Edit protocol' : 'New protocol'}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-5"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator step={step} />

        {step === 1 && (
          <View className="gap-4">
            <View>
              <FieldLabel>Protocol name</FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. BPC-157 + TB-500 Stack"
                placeholderTextColor={colors.text.tertiary}
                style={inputBase}
              />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldLabel>Start date (YYYY-MM-DD)</FieldLabel>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="2026-04-14"
                  placeholderTextColor={colors.text.tertiary}
                  style={inputBase}
                />
              </View>
              <View className="flex-1">
                <FieldLabel>End date (optional)</FieldLabel>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.tertiary}
                  style={inputBase}
                />
              </View>
            </View>
            <View>
              <FieldLabel>Notes (optional)</FieldLabel>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Goals, context, or reminders…"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  backgroundColor: colors.bg.secondary,
                  borderColor: colors.border.tertiary,
                  borderWidth: 1,
                  borderRadius: 8,
                  color: colors.text.primary,
                  minHeight: 96,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="gap-3">
            {entries.length === 0 && (
              <Text className="text-[14px] text-txt-secondary">
                Add at least one peptide to continue.
              </Text>
            )}
            {entries.map((entry, idx) => (
              <View
                key={entry.ppId ?? idx}
                className="flex-row items-center justify-between p-3 rounded-lg bg-bg-secondary"
              >
                <View>
                  <Text className="text-[14px] font-medium text-txt-primary">
                    {entry.peptide.name}
                  </Text>
                  <Text className="text-[11px] text-txt-secondary mt-0.5">
                    {entry.dose_mcg} mcg · {entry.frequency}
                  </Text>
                </View>
                <Pressable onPress={() => removeEntry(idx)} className="p-1.5">
                  <Trash2 size={16} color={colors.text.tertiary} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => setShowAddSheet(true)}
              className="flex-row items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border.tertiary,
              }}
            >
              <Plus size={16} color={colors.teal} />
              <Text style={{ color: colors.teal, fontSize: 14 }}>Add peptide</Text>
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <View className="rounded-lg bg-bg-secondary p-4 gap-3">
              <View>
                <Text className="text-[12px] text-txt-tertiary uppercase tracking-widest mb-1">
                  Protocol
                </Text>
                <Text className="text-[15px] font-medium text-txt-primary">{name}</Text>
                {startDate ? (
                  <Text className="text-[12px] text-txt-secondary mt-0.5">
                    {new Date(startDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {endDate
                      ? ` → ${new Date(endDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}`
                      : ''}
                  </Text>
                ) : null}
                {notes ? (
                  <Text className="text-[12px] text-txt-secondary mt-1">{notes}</Text>
                ) : null}
              </View>
              <View
                style={{ borderTopWidth: 0.5, borderTopColor: colors.border.tertiary }}
              />
              <View>
                <Text className="text-[12px] text-txt-tertiary uppercase tracking-widest mb-2">
                  Peptides
                </Text>
                <View className="gap-2">
                  {entries.map((entry, idx) => (
                    <View key={entry.ppId ?? idx}>
                      <Text className="text-[14px] font-medium text-txt-primary">
                        {entry.peptide.name}
                      </Text>
                      <Text className="text-[12px] text-txt-secondary">
                        {entry.dose_mcg} mcg · {entry.frequency}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        className="px-4 pt-3 pb-8"
        style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}
      >
        {step < 3 ? (
          <Pressable
            onPress={() => setStep((s) => (s + 1) as Step)}
            disabled={step === 1 ? !name.trim() : entries.length === 0}
            className="w-full h-11 bg-teal rounded-lg items-center justify-center"
            style={{
              opacity:
                (step === 1 ? !name.trim() : entries.length === 0) ? 0.4 : 1,
            }}
          >
            <Text className="text-[14px] font-medium text-white">Next</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSave}
            disabled={isPending}
            className="w-full h-11 bg-teal rounded-lg items-center justify-center"
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            <Text className="text-[14px] font-medium text-white">
              {isPending
                ? isEditing
                  ? 'Saving…'
                  : 'Activating…'
                : isEditing
                ? 'Save changes'
                : 'Activate protocol'}
            </Text>
          </Pressable>
        )}
      </View>

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
    </View>
  )
}
