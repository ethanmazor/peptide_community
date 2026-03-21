import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, LogOut } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import { supabase } from '../lib/supabase'
import { useProfile, useUpdateProfile } from '../hooks/useSettings'
import { usePeptides, useCreatePeptide } from '../hooks/usePeptides'
import { useHomeData } from '../hooks/useHomeData'
import type { Peptide } from '@peptide/types'

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] px-4 mb-2 mt-6">
      {title}
    </p>
  )
}

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
    <button
      onClick={onPress}
      disabled={!onPress}
      className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)]"
      style={{ borderBottomWidth: '0.5px' }}
    >
      <span
        className="text-[14px]"
        style={{ color: destructive ? 'var(--color-text-danger)' : 'var(--color-text-primary)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1">
        {value && (
          <span className="text-[13px] text-[var(--color-text-secondary)]">{value}</span>
        )}
        {chevron && onPress && (
          <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
        )}
      </div>
    </button>
  )
}

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
    <div>
      {editing ? (
        <div className="px-4 py-3 border-b border-[var(--color-border-tertiary)]" style={{ borderBottomWidth: '0.5px' }}>
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
            Display name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-teal rounded-lg focus:outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={saveEdit}
              disabled={updateProfile.isPending}
              className="h-10 px-4 bg-teal text-white text-[13px] font-medium rounded-lg disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="h-10 px-3 text-[13px] text-[var(--color-text-secondary)] rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
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
    </div>
  )
}

function PeptideLibrarySection() {
  const { data: peptides, isLoading } = usePeptides()
  const createPeptide = useCreatePeptide()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAlias, setNewAlias] = useState('')
  const [newDose, setNewDose] = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    await createPeptide.mutateAsync({
      name: newName.trim(),
      alias: newAlias.trim() || null,
      typical_dose_mcg: newDose ? Number(newDose) : null,
    })
    setNewName('')
    setNewAlias('')
    setNewDose('')
    setShowAdd(false)
  }

  if (isLoading) return null

  return (
    <div>
      {(peptides ?? []).map((p: Peptide) => (
        <div
          key={p.id}
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)]"
          style={{ borderBottomWidth: '0.5px' }}
        >
          <div>
            <p className="text-[14px] text-[var(--color-text-primary)]">{p.name}</p>
            {p.typical_dose_mcg && (
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                {p.typical_dose_mcg} mcg · {p.typical_frequency ?? ''}
              </p>
            )}
          </div>
          {p.is_default && (
            <span className="text-[10px] text-[var(--color-text-tertiary)] bg-[var(--color-background-secondary)] px-2 py-0.5 rounded-full">
              Default
            </span>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="px-4 py-3 flex flex-col gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (required)"
            autoFocus
            className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              placeholder="Alias (optional)"
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <input
              type="number"
              inputMode="decimal"
              value={newDose}
              onChange={(e) => setNewDose(e.target.value)}
              placeholder="Dose (mcg)"
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || createPeptide.isPending}
              className="flex-1 h-10 bg-teal text-white text-[13px] font-medium rounded-lg disabled:opacity-60"
            >
              Add
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 h-10 text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-background-secondary)] rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center gap-2 px-4 py-3 text-teal text-[14px]"
        >
          <Plus size={16} />
          Add peptide
        </button>
      )}
    </div>
  )
}

function NotificationsSection() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const [editingTime, setEditingTime] = useState(false)
  const [editingLead, setEditingLead] = useState(false)
  const [time, setTime] = useState('')
  const [lead, setLead] = useState('')

  if (isLoading) return null

  // notification_time stored as "HH:MM:SS", input needs "HH:MM"
  const displayTime = profile?.notification_time
    ? profile.notification_time.slice(0, 5)
    : 'Not set'
  const displayLead = profile?.reminder_lead_min ?? 15

  async function saveTime() {
    await updateProfile.mutateAsync({ notification_time: time ? `${time}:00` : null })
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
    <div>
      {editingTime ? (
        <div className="px-4 py-3 border-b border-[var(--color-border-tertiary)]" style={{ borderBottomWidth: '0.5px' }}>
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
            Reminder time
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              autoFocus
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-teal rounded-lg focus:outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={saveTime}
              disabled={updateProfile.isPending}
              className="h-10 px-4 bg-teal text-white text-[13px] font-medium rounded-lg disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => setEditingTime(false)}
              className="h-10 px-3 text-[13px] text-[var(--color-text-secondary)] rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
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
        <div className="px-4 py-3 border-b border-[var(--color-border-tertiary)]" style={{ borderBottomWidth: '0.5px' }}>
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
            Remind me (minutes before dose)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              autoFocus
              placeholder="15"
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-teal rounded-lg focus:outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={saveLead}
              disabled={updateProfile.isPending}
              className="h-10 px-4 bg-teal text-white text-[13px] font-medium rounded-lg disabled:opacity-60"
            >
              Save
            </button>
            <button
              onClick={() => setEditingLead(false)}
              className="h-10 px-3 text-[13px] text-[var(--color-text-secondary)] rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
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
    </div>
  )
}

function ProtocolSection() {
  const { data } = useHomeData()
  const protocol = data?.protocol

  return (
    <div>
      {protocol ? (
        <>
          <div
            className="px-4 py-3 border-b border-[var(--color-border-tertiary)]"
            style={{ borderBottomWidth: '0.5px' }}
          >
            <p className="text-[14px] text-[var(--color-text-primary)]">{protocol.name}</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
              Active · Started {new Date(protocol.start_date ?? protocol.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <Link to="/settings/protocols/new">
            <SettingsRow label="New protocol" />
          </Link>
        </>
      ) : (
        <Link to="/settings/protocols/new">
          <SettingsRow label="Create protocol" />
        </Link>
      )}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="pb-10">
      <div className="px-4 pt-5 pb-2">
        <h1 className="text-[20px] font-medium">Settings</h1>
      </div>

      <SectionHeader title="Profile" />
      <ProfileSection />

      <SectionHeader title="Notifications" />
      <NotificationsSection />

      <SectionHeader title="Peptide library" />
      <PeptideLibrarySection />

      <SectionHeader title="Protocol" />
      <ProtocolSection />

      <SectionHeader title="Account" />
      <SettingsRow label="Sign out" onPress={handleSignOut} chevron={false} destructive />
    </div>
  )
}
