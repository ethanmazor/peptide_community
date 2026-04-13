import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { ChevronRight, LogOut } from 'lucide-react-native'
import { useSession } from '../../../contexts/SessionContext'
import { supabase } from '../../../lib/supabase'
import { useProfile, useUpdateProfile } from '../../../hooks/useSettings'
import { usePeptides, useUpdatePeptide } from '../../../hooks/usePeptides'
import { useHomeData } from '../../../hooks/useHomeData'
import { colors } from '../../../lib/colors'
import type { Peptide } from '@peptide/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPICAL_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every other day',
  'Every 3 days',
  'Weekly',
  'Twice weekly',
  'Custom',
]

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: colors.text.tertiary,
        paddingHorizontal: 16,
        marginBottom: 8,
        marginTop: 24,
      }}
    >
      {title}
    </Text>
  )
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────

function SettingsRow({
  label,
  value,
  onPress,
  chevron = true,
  destructive = false,
}: {
  label: string
  value?: string
  onPress?: () => void
  chevron?: boolean
  destructive?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border.tertiary,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: destructive ? colors.text.danger : colors.text.primary,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {value !== undefined && (
          <Text style={{ fontSize: 13, color: colors.text.secondary }}>
            {value}
          </Text>
        )}
        {chevron && !!onPress && (
          <ChevronRight size={16} color={colors.text.tertiary} />
        )}
      </View>
    </Pressable>
  )
}

// ─── EditRow (inline text-field row) ─────────────────────────────────────────

function EditRow({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  keyboardType,
  onSave,
  onCancel,
  saveDisabled,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  keyboardType?: 'default' | 'decimal-pad' | 'numeric' | 'numbers-and-punctuation'
  onSave: () => void
  onCancel: () => void
  saveDisabled?: boolean
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border.tertiary,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: colors.text.secondary,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          autoFocus={autoFocus}
          keyboardType={keyboardType ?? 'default'}
          style={{
            flex: 1,
            height: 40,
            paddingHorizontal: 12,
            fontSize: 14,
            color: colors.text.primary,
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.teal,
            borderRadius: 8,
          }}
        />
        <Pressable
          onPress={onSave}
          disabled={saveDisabled}
          style={{
            height: 40,
            paddingHorizontal: 16,
            backgroundColor: colors.teal,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: saveDisabled ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff' }}>
            Save
          </Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={{
            height: 40,
            paddingHorizontal: 12,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 13, color: colors.text.secondary }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

// ─── ProfileSection ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const { session } = useSession()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  function startEdit() {
    setName(profile?.display_name ?? '')
    setEditing(true)
  }

  async function saveEdit() {
    await updateProfile.mutateAsync({ display_name: name })
    setEditing(false)
  }

  if (isLoading) return null

  return (
    <View>
      {editing ? (
        <EditRow
          label="Display name"
          value={name}
          onChangeText={setName}
          placeholder="Display name"
          autoFocus
          onSave={saveEdit}
          onCancel={() => setEditing(false)}
          saveDisabled={updateProfile.isPending}
        />
      ) : (
        <SettingsRow
          label="Display name"
          value={profile?.display_name ?? 'Set name'}
          onPress={startEdit}
        />
      )}
      <SettingsRow
        label="Email"
        value={session?.user.email ?? ''}
        chevron={false}
      />
    </View>
  )
}

// ─── PeptideEditRow ───────────────────────────────────────────────────────────

function PeptideEditRow({ peptide }: { peptide: Peptide }) {
  const updatePeptide = useUpdatePeptide()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(peptide.name)
  const [alias, setAlias] = useState(peptide.alias ?? '')
  const [description, setDescription] = useState(peptide.description ?? '')
  const [dose, setDose] = useState(
    peptide.typical_dose_mcg ? String(peptide.typical_dose_mcg) : ''
  )
  const [frequency, setFrequency] = useState(peptide.typical_frequency ?? '')
  const [halfLife, setHalfLife] = useState(
    peptide.half_life_hours ? String(peptide.half_life_hours) : ''
  )

  function startEdit() {
    setName(peptide.name)
    setAlias(peptide.alias ?? '')
    setDescription(peptide.description ?? '')
    setDose(peptide.typical_dose_mcg ? String(peptide.typical_dose_mcg) : '')
    setFrequency(peptide.typical_frequency ?? '')
    setHalfLife(peptide.half_life_hours ? String(peptide.half_life_hours) : '')
    setEditing(true)
  }

  async function handleSave() {
    await updatePeptide.mutateAsync({
      id: peptide.id,
      name: name.trim() || peptide.name,
      alias: alias.trim() || null,
      description: description.trim() || null,
      typical_dose_mcg: dose ? Number(dose) : null,
      typical_frequency: frequency || null,
      half_life_hours: halfLife ? Number(halfLife) : null,
    })
    setEditing(false)
  }

  // ── Editing form ──────────────────────────────────────────────────────────

  if (editing) {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border.tertiary,
          gap: 8,
        }}
      >
        {/* Name + Alias row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.text.tertiary}
            autoFocus
            style={{
              flex: 1,
              height: 40,
              paddingHorizontal: 12,
              fontSize: 14,
              color: colors.text.primary,
              backgroundColor: colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.teal,
              borderRadius: 8,
            }}
          />
          <TextInput
            value={alias}
            onChangeText={setAlias}
            placeholder="Alias"
            placeholderTextColor={colors.text.tertiary}
            style={{
              width: 96,
              height: 40,
              paddingHorizontal: 12,
              fontSize: 14,
              color: colors.text.primary,
              backgroundColor: colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.border.tertiary,
              borderRadius: 8,
            }}
          />
        </View>

        {/* Description */}
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Description (optional)"
          placeholderTextColor={colors.text.tertiary}
          style={{
            height: 40,
            paddingHorizontal: 12,
            fontSize: 14,
            color: colors.text.primary,
            backgroundColor: colors.bg.secondary,
            borderWidth: 1,
            borderColor: colors.border.tertiary,
            borderRadius: 8,
          }}
        />

        {/* Dose + Half-life row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="Typical dose (mcg)"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              height: 40,
              paddingHorizontal: 12,
              fontSize: 14,
              color: colors.text.primary,
              backgroundColor: colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.border.tertiary,
              borderRadius: 8,
            }}
          />
          <TextInput
            value={halfLife}
            onChangeText={setHalfLife}
            placeholder="Half-life (hr)"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              height: 40,
              paddingHorizontal: 12,
              fontSize: 14,
              color: colors.text.primary,
              backgroundColor: colors.bg.secondary,
              borderWidth: 1,
              borderColor: colors.border.tertiary,
              borderRadius: 8,
            }}
          />
        </View>

        {/* Frequency pill buttons */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Frequency (optional)
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {TYPICAL_FREQUENCIES.map((f) => {
            const selected = frequency === f
            return (
              <Pressable
                key={f}
                onPress={() => setFrequency(selected ? '' : f)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.teal : colors.border.primary,
                  backgroundColor: selected ? colors.teal + '22' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: selected ? colors.teal : colors.text.secondary,
                    fontWeight: selected ? '500' : '400',
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Save / Cancel */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || updatePeptide.isPending}
            style={{
              flex: 1,
              height: 40,
              backgroundColor: colors.teal,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !name.trim() || updatePeptide.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#fff' }}>
              Save
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setEditing(false)}
            style={{
              flex: 1,
              height: 40,
              backgroundColor: colors.bg.secondary,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: colors.text.secondary }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Default (library) row — read-only ─────────────────────────────────────

  if (peptide.is_default) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border.tertiary,
        }}
      >
        <View>
          <Text style={{ fontSize: 14, color: colors.text.primary }}>
            {peptide.name}
          </Text>
          {peptide.typical_dose_mcg !== null && peptide.typical_dose_mcg !== undefined && (
            <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 1 }}>
              {peptide.typical_dose_mcg} mcg · {peptide.typical_frequency ?? ''}
            </Text>
          )}
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 999,
            backgroundColor: colors.bg.secondary,
          }}
        >
          <Text style={{ fontSize: 10, color: colors.text.tertiary }}>
            Library
          </Text>
        </View>
      </View>
    )
  }

  // ── Custom peptide row — tappable ─────────────────────────────────────────

  return (
    <Pressable
      onPress={startEdit}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border.tertiary,
      }}
    >
      <View>
        <Text style={{ fontSize: 14, color: colors.text.primary }}>
          {peptide.name}
        </Text>
        {peptide.typical_dose_mcg !== null && peptide.typical_dose_mcg !== undefined && (
          <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 1 }}>
            {peptide.typical_dose_mcg} mcg · {peptide.typical_frequency ?? ''}
          </Text>
        )}
      </View>
      <ChevronRight size={16} color={colors.text.tertiary} />
    </Pressable>
  )
}

// ─── PeptideLibrarySection ────────────────────────────────────────────────────

function PeptideLibrarySection() {
  const { data: peptides, isLoading } = usePeptides()

  if (isLoading) return null

  return (
    <View>
      {(peptides ?? []).map((p: Peptide) => (
        <PeptideEditRow key={p.id} peptide={p} />
      ))}
    </View>
  )
}

// ─── NotificationsSection ─────────────────────────────────────────────────────

function NotificationsSection() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [editingTime, setEditingTime] = useState(false)
  const [editingLead, setEditingLead] = useState(false)
  const [time, setTime] = useState('')
  const [lead, setLead] = useState('')

  if (isLoading) return null

  // notification_time stored as "HH:MM:SS"
  const displayTime = profile?.notification_time
    ? profile.notification_time.slice(0, 5)
    : 'Not set'
  const displayLead = profile?.reminder_lead_min ?? 15

  async function saveTime() {
    await updateProfile.mutateAsync({
      notification_time: time ? `${time}:00` : null,
    })
    setEditingTime(false)
  }

  async function saveLead() {
    const val = parseInt(lead, 10)
    if (!isNaN(val) && val >= 0) {
      await updateProfile.mutateAsync({ reminder_lead_min: val })
    }
    setEditingLead(false)
  }

  return (
    <View>
      {editingTime ? (
        <EditRow
          label="Reminder time"
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          autoFocus
          keyboardType="numbers-and-punctuation"
          onSave={saveTime}
          onCancel={() => setEditingTime(false)}
          saveDisabled={updateProfile.isPending}
        />
      ) : (
        <SettingsRow
          label="Reminder time"
          value={displayTime}
          onPress={() => {
            setTime(profile?.notification_time?.slice(0, 5) ?? '')
            setEditingTime(true)
          }}
        />
      )}

      {editingLead ? (
        <EditRow
          label="Remind me (minutes before dose)"
          value={lead}
          onChangeText={setLead}
          placeholder="15"
          autoFocus
          keyboardType="numeric"
          onSave={saveLead}
          onCancel={() => setEditingLead(false)}
          saveDisabled={updateProfile.isPending}
        />
      ) : (
        <SettingsRow
          label="Remind me before dose"
          value={`${displayLead} min`}
          onPress={() => {
            setLead(String(displayLead))
            setEditingLead(true)
          }}
        />
      )}
    </View>
  )
}

// ─── HealthSection ────────────────────────────────────────────────────────────

function HealthSection() {
  const { data: profile } = useProfile()

  const age = profile?.age ?? null
  const sex = profile?.sex ?? null
  const heightCm = profile?.height_cm ?? null
  const weightKg = profile?.weight_kg ?? null
  const weightUnit = profile?.weight_unit ?? 'lbs'
  const bodyFat = profile?.body_fat_pct ?? null
  const goals: string[] = (profile?.goals as string[]) ?? []
  const goalsNotes = profile?.goals_notes ?? null

  const weightDisplay =
    weightKg !== null
      ? weightUnit === 'lbs'
        ? `${Math.round(weightKg * 2.20462 * 10) / 10} lbs`
        : `${weightKg} kg`
      : null

  const sexLabel: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    prefer_not_to_say: 'Prefer not to say',
  }

  const summaryParts = [
    sex ? sexLabel[sex] : null,
    age ? `${age} y/o` : null,
    heightCm ? `${heightCm} cm` : null,
    weightDisplay,
    bodyFat ? `${bodyFat}% BF` : null,
  ].filter(Boolean) as string[]

  return (
    <View>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border.tertiary,
        }}
      >
        {summaryParts.length > 0 ? (
          <Text style={{ fontSize: 13, color: colors.text.secondary }}>
            {summaryParts.join(' · ')}
          </Text>
        ) : (
          <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
            Not set
          </Text>
        )}

        {goals.length > 0 && (
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}
          >
            {goals.map((g) => (
              <View
                key={g}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: colors.teal + '1A',
                }}
              >
                <Text style={{ fontSize: 11, color: colors.teal }}>{g}</Text>
              </View>
            ))}
          </View>
        )}

        {goalsNotes && (
          <Text
            style={{
              fontSize: 12,
              color: colors.text.secondary,
              marginTop: 6,
              fontStyle: 'italic',
            }}
          >
            {goalsNotes}
          </Text>
        )}
      </View>

      <Link href="/(app)/onboarding?edit=true" asChild>
        <SettingsRow label="Edit health & goals" />
      </Link>
    </View>
  )
}

// ─── ProtocolSection ──────────────────────────────────────────────────────────

function ProtocolSection() {
  const { data } = useHomeData()
  const protocol = data?.protocol

  return (
    <View>
      {protocol ? (
        <>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border.tertiary,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text.primary }}>
              {protocol.name}
            </Text>
            <Text
              style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}
            >
              Active · Started{' '}
              {new Date(
                (protocol as any).start_date ?? protocol.created_at
              ).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Link href={`/(app)/protocols/${protocol.id}/edit` as any} asChild>
            <SettingsRow label="Edit protocol" />
          </Link>
          <Link href="/(app)/protocols/new" asChild>
            <SettingsRow label="New protocol" />
          </Link>
        </>
      ) : (
        <Link href="/(app)/protocols/new" asChild>
          <SettingsRow label="Create protocol" />
        </Link>
      )}
    </View>
  )
}

// ─── Settings (root screen) ───────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg.primary }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '500', color: colors.text.primary }}>
          Settings
        </Text>
      </View>

      <SectionHeader title="Profile" />
      <ProfileSection />

      <SectionHeader title="Health & Goals" />
      <HealthSection />

      <SectionHeader title="Notifications" />
      <NotificationsSection />

      <SectionHeader title="Peptide library" />
      <PeptideLibrarySection />

      <SectionHeader title="Protocol" />
      <ProtocolSection />

      <SectionHeader title="Account" />
      <SettingsRow
        label="Sign out"
        onPress={handleSignOut}
        chevron={false}
        destructive
      />
    </ScrollView>
  )
}
