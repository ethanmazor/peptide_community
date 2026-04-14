import { useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useProfile, useUpdateProfile } from '../../hooks/useSettings'
import { colors } from '../../lib/colors'
import { FieldLabel } from '../../components/ui/FieldLabel'

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

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-[13px] font-medium uppercase tracking-widest text-txt-tertiary mb-3 mt-6">
      {children}
    </Text>
  )
}

export default function Onboarding() {
  const router = useRouter()
  const params = useLocalSearchParams<{ edit?: string }>()
  const isEdit = params.edit === 'true'

  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

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
  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile?.goals ?? [])
  const [goalsNotes, setGoalsNotes] = useState(profile?.goals_notes ?? '')

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
    router.replace(isEdit ? '/(app)/(tabs)/settings' : '/(app)/(tabs)')
  }

  async function handleSkip() {
    await updateProfile.mutateAsync({ onboarding_completed: true })
    router.replace('/(app)/(tabs)')
  }

  const inputStyle = {
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: colors.bg.secondary,
    borderColor: colors.border.tertiary,
    borderWidth: 1,
    borderRadius: 8,
    color: colors.text.primary,
  }

  return (
    <View className="flex-1 bg-bg-primary">
      <View
        className="px-4 pt-12 pb-4 flex-row items-center gap-3"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}
      >
        {isEdit && (
          <Pressable onPress={() => router.replace('/(app)/(tabs)/settings')}>
            <ChevronLeft size={22} color={colors.text.secondary} />
          </Pressable>
        )}
        <View>
          <Text className="text-[20px] font-medium text-txt-primary">
            {isEdit ? 'Health & Goals' : 'Set up your profile'}
          </Text>
          {!isEdit && (
            <Text className="text-[13px] text-txt-secondary mt-0.5">
              All fields are optional — update anytime in Settings.
            </Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pb-10">
        <SectionTitle>Health info</SectionTitle>

        <View className="mb-4">
          <FieldLabel>Biological sex</FieldLabel>
          <View className="flex-row gap-2">
            {(
              [
                { val: 'male', label: 'Male' },
                { val: 'female', label: 'Female' },
                { val: 'prefer_not_to_say', label: 'Prefer not to say' },
              ] as const
            ).map(({ val, label }) => {
              const selected = sex === val
              return (
                <Pressable
                  key={val}
                  onPress={() => setSex(selected ? '' : val)}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selected ? colors.teal : colors.border.tertiary,
                    backgroundColor: selected ? 'rgba(29,158,117,0.1)' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: selected ? colors.teal : colors.text.secondary,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <FieldLabel>Age</FieldLabel>
            <TextInput
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              placeholder="28"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Height (cm)</FieldLabel>
            <TextInput
              keyboardType="decimal-pad"
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="178"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
        </View>

        <View className="mb-4">
          <FieldLabel>Weight</FieldLabel>
          <View className="flex-row gap-2">
            <TextInput
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              placeholder={weightUnit === 'lbs' ? '185' : '84'}
              placeholderTextColor={colors.text.tertiary}
              style={[inputStyle, { flex: 1 }]}
            />
            <View
              className="flex-row"
              style={{
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border.tertiary,
                overflow: 'hidden',
              }}
            >
              {(['lbs', 'kg'] as const).map((u) => {
                const selected = weightUnit === u
                return (
                  <Pressable
                    key={u}
                    onPress={() => {
                      if (u === weightUnit) return
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
                    style={{
                      width: 48,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.teal : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '500',
                        color: selected ? 'white' : colors.text.secondary,
                      }}
                    >
                      {u}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        <View className="mb-2">
          <FieldLabel>Body fat %</FieldLabel>
          <TextInput
            keyboardType="decimal-pad"
            value={bodyFat}
            onChangeText={setBodyFat}
            placeholder="18"
            placeholderTextColor={colors.text.tertiary}
            style={inputStyle}
          />
        </View>

        <SectionTitle>Goals</SectionTitle>

        <View className="flex-row flex-wrap gap-2 mb-4">
          {GOAL_OPTIONS.map((goal) => {
            const selected = selectedGoals.includes(goal)
            return (
              <Pressable
                key={goal}
                onPress={() => toggleGoal(goal)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? colors.teal : colors.border.tertiary,
                  backgroundColor: selected ? 'rgba(29,158,117,0.1)' : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '500',
                    color: selected ? colors.teal : colors.text.secondary,
                  }}
                >
                  {goal}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View>
          <FieldLabel>Additional notes (optional)</FieldLabel>
          <TextInput
            value={goalsNotes}
            onChangeText={setGoalsNotes}
            placeholder="Anything else you want to track or achieve…"
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
      </ScrollView>

      <View
        className="px-4 pt-3 pb-8"
        style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}
      >
        <Pressable
          onPress={handleSave}
          disabled={updateProfile.isPending}
          className="w-full h-11 bg-teal rounded-lg items-center justify-center"
          style={{ opacity: updateProfile.isPending ? 0.6 : 1 }}
        >
          <Text className="text-[14px] font-medium text-white">
            {updateProfile.isPending
              ? 'Saving…'
              : isEdit
              ? 'Save changes'
              : 'Save & continue'}
          </Text>
        </Pressable>
        {!isEdit && (
          <Pressable
            onPress={handleSkip}
            disabled={updateProfile.isPending}
            className="w-full h-10 items-center justify-center mt-2"
          >
            <Text className="text-[13px] text-txt-secondary">Skip for now</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
