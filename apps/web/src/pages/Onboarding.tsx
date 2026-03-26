import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useProfile, useUpdateProfile } from '../hooks/useSettings'

const GOAL_OPTIONS = [
  'Lose body fat',
  'Build muscle',
  'Improve recovery',
  'Anti-aging',
  'Injury healing',
  'Hormonal support',
  'Improve sleep',
  'Cognitive enhancement',
  'General wellness',
]

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1.5">
      {children}
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3 mt-6">
      {children}
    </p>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === 'true'

  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  // ── Local state seeded from existing profile ─────────────────────────────
  const [sex, setSex] = useState<'male' | 'female' | 'prefer_not_to_say' | ''>(
    profile?.sex ?? ''
  )
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '')
  const [heightCm, setHeightCm] = useState(
    profile?.height_cm ? String(profile.height_cm) : ''
  )
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>(
    profile?.weight_unit ?? 'lbs'
  )
  const [weight, setWeight] = useState(() => {
    if (!profile?.weight_kg) return ''
    const unit = profile.weight_unit ?? 'lbs'
    return unit === 'lbs'
      ? String(Math.round(profile.weight_kg * 2.20462 * 10) / 10)
      : String(profile.weight_kg)
  })
  const [bodyFat, setBodyFat] = useState(
    profile?.body_fat_pct ? String(profile.body_fat_pct) : ''
  )
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    profile?.goals ?? []
  )
  const [goalsNotes, setGoalsNotes] = useState(profile?.goals_notes ?? '')

  // ── Helpers ───────────────────────────────────────────────────────────────
  function toggleGoal(goal: string) {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  function toKg(val: string, unit: 'lbs' | 'kg'): number | null {
    const n = parseFloat(val)
    if (isNaN(n) || n <= 0) return null
    return unit === 'lbs' ? n / 2.20462 : n
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    await updateProfile.mutateAsync({
      sex: (sex || null) as 'male' | 'female' | 'prefer_not_to_say' | null,
      age: age ? parseInt(age, 10) : null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      weight_kg: toKg(weight, weightUnit),
      weight_unit: weightUnit,
      body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
      goals: selectedGoals.length > 0 ? selectedGoals : null,
      goals_notes: goalsNotes.trim() || null,
      onboarding_completed: true,
    })
    navigate(isEdit ? '/settings' : '/', { replace: true })
  }

  async function handleSkip() {
    await updateProfile.mutateAsync({ onboarding_completed: true })
    navigate('/', { replace: true })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh bg-[var(--color-background-primary)]">
      {/* Header */}
      <div className="px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-4 flex items-center gap-3 border-b border-[var(--color-border-primary)]">
        {isEdit && (
          <button
            onClick={() => navigate('/settings')}
            className="text-[var(--color-text-secondary)]"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div>
          <h1 className="text-[20px] font-medium">
            {isEdit ? 'Health & Goals' : 'Set up your profile'}
          </h1>
          {!isEdit && (
            <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
              All fields are optional — update anytime in Settings.
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 pb-10">

        {/* ── Health info ── */}
        <SectionTitle>Health info</SectionTitle>

        {/* Sex */}
        <div className="mb-4">
          <FieldLabel>Biological sex</FieldLabel>
          <div className="flex gap-2">
            {(
              [
                { val: 'male', label: 'Male' },
                { val: 'female', label: 'Female' },
                { val: 'prefer_not_to_say', label: 'Prefer not to say' },
              ] as const
            ).map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setSex(sex === val ? '' : val)}
                className={`flex-1 h-10 rounded-lg text-[13px] font-medium border transition-colors ${
                  sex === val
                    ? 'bg-teal/10 border-teal text-teal'
                    : 'border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Age + Height row */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <FieldLabel>Age</FieldLabel>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="28"
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex-1">
            <FieldLabel>Height (cm)</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="178"
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Weight + unit toggle */}
        <div className="mb-4">
          <FieldLabel>Weight</FieldLabel>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={weightUnit === 'lbs' ? '185' : '84'}
              className="flex-1 h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <div className="flex rounded-lg border border-[var(--color-border-tertiary)] overflow-hidden">
              {(['lbs', 'kg'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => {
                    if (u === weightUnit) return
                    // Convert existing value to new unit
                    const n = parseFloat(weight)
                    if (!isNaN(n)) {
                      setWeight(
                        u === 'kg'
                          ? String(Math.round((n / 2.20462) * 10) / 10)
                          : String(Math.round(n * 2.20462 * 10) / 10)
                      )
                    }
                    setWeightUnit(u)
                  }}
                  className={`w-12 h-10 text-[13px] font-medium transition-colors ${
                    weightUnit === u
                      ? 'bg-teal text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body fat */}
        <div className="mb-2">
          <FieldLabel>Body fat %</FieldLabel>
          <input
            type="number"
            inputMode="decimal"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="18"
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* ── Goals ── */}
        <SectionTitle>Goals</SectionTitle>

        <div className="flex flex-wrap gap-2 mb-4">
          {GOAL_OPTIONS.map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                selectedGoals.includes(goal)
                  ? 'bg-teal/10 border-teal text-teal'
                  : 'border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)]'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>

        <div>
          <FieldLabel>Additional notes (optional)</FieldLabel>
          <textarea
            value={goalsNotes}
            onChange={(e) => setGoalsNotes(e.target.value)}
            placeholder="Anything else you want to track or achieve…"
            rows={3}
            className="w-full px-3 py-2.5 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal resize-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      {/* Footer buttons */}
      <div className="px-4 pb-[calc(24px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)] flex flex-col gap-2">
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-60"
        >
          {updateProfile.isPending
            ? 'Saving…'
            : isEdit
            ? 'Save changes'
            : 'Save & continue'}
        </button>
        {!isEdit && (
          <button
            onClick={handleSkip}
            disabled={updateProfile.isPending}
            className="w-full h-10 text-[13px] text-[var(--color-text-secondary)]"
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
