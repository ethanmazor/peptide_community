import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useLogDose } from '../hooks/useLogDose'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import { colors } from '../lib/colors'
import { FieldLabel } from './ui/FieldLabel'

const INJECTION_SITES = ['Left abdomen', 'Right abdomen', 'Left thigh', 'Right thigh', 'Left deltoid', 'Right deltoid']

interface Props {
  item: HomeProtocolPeptide | null
  open: boolean
  onClose: () => void
  onDepleted?: (item: HomeProtocolPeptide) => void
}

export default function LogDoseSheet({ item, open, onClose, onDepleted }: Props) {
  const logDose = useLogDose()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['85%'], [])

  const [injectionSite, setInjectionSite] = useState('')
  const [weightLbs, setWeightLbs] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) { setInjectionSite(''); setWeightLbs(''); setBodyFat(''); setNotes('') }
  }, [item])

  useEffect(() => {
    if (open) bottomSheetRef.current?.expand()
    else bottomSheetRef.current?.close()
  }, [open])

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
  ), [])

  if (!item) return null

  const concentration = item.active_vial?.concentration_mcg_per_unit ?? null
  const unitsDrawn = concentration ? item.dose_mcg / concentration : null
  const isDepletingVial = item.active_vial && unitsDrawn !== null && (item.active_vial.units_remaining ?? 0) - unitsDrawn <= 0

  async function handleSave() {
    if (!item) return
    const today = new Date().toISOString().split('T')[0]
    const administeredAt = `${today}T${new Date().toTimeString().slice(0, 5)}:00`
    await logDose.mutateAsync({
      protocol_peptide_id: item.id, vial_id: item.active_vial?.id ?? null,
      administered_at: administeredAt, dose_mcg: item.dose_mcg, units_drawn: unitsDrawn,
      injection_site: injectionSite || null, notes: notes || null,
      weight_lbs: weightLbs ? Number(weightLbs) : null, body_fat_pct: bodyFat ? Number(bodyFat) : null,
    })
    if (isDepletingVial && onDepleted) { onClose(); onDepleted(item) } else { onClose() }
  }

  return (
    <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose
      onClose={onClose} backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg.primary }}
      handleIndicatorStyle={{ backgroundColor: colors.border.secondary }}>
      <ScrollView className="flex-1 px-4 pb-6">
        <Text className="text-base font-medium text-txt-primary mt-2 mb-5">Log {item.peptide.name}</Text>
        <View className="gap-4">
          {/* Dose + Units read-only */}
          <View className="flex-row gap-2">
            <View className="flex-1 gap-1">
              <FieldLabel>Dose</FieldLabel>
              <View className="h-10 px-3 justify-center bg-bg-secondary rounded-lg" style={{ borderWidth: 1, borderColor: colors.border.tertiary }}>
                <Text className="text-sm text-txt-tertiary">{item.dose_mcg} mcg</Text>
              </View>
            </View>
            <View className="flex-1 gap-1">
              <FieldLabel>Units drawn</FieldLabel>
              <View className="h-10 px-3 justify-center bg-bg-secondary rounded-lg" style={{ borderWidth: 1, borderColor: colors.border.tertiary }}>
                <Text className="text-sm text-txt-tertiary">{unitsDrawn !== null ? unitsDrawn.toFixed(2) : '—'}</Text>
              </View>
            </View>
          </View>

          {/* Injection site pills */}
          <View className="gap-1">
            <FieldLabel>Injection site</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {INJECTION_SITES.map((site) => (
                <Pressable key={site} onPress={() => setInjectionSite(injectionSite === site ? '' : site)}
                  className="px-3 py-1.5 rounded-full"
                  style={{ borderWidth: 1, borderColor: injectionSite === site ? colors.teal : colors.border.tertiary,
                    backgroundColor: injectionSite === site ? 'rgba(29,158,117,0.1)' : 'transparent' }}>
                  <Text className="text-[13px]" style={{ color: injectionSite === site ? colors.teal : colors.text.secondary }}>{site}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {isDepletingVial && (
            <View className="px-3 py-2.5 rounded-lg" style={{ backgroundColor: colors.warning.bg }}>
              <Text className="text-[13px]" style={{ color: colors.warning.text }}>This will finish your vial. You'll be prompted to set up a new one after saving.</Text>
            </View>
          )}

          {/* Optional section */}
          <View className="pt-4 mt-1 gap-4" style={{ borderTopWidth: 1, borderTopColor: colors.border.tertiary }}>
            <Text className="text-[11px] text-txt-tertiary -mb-2">Optional</Text>
            <View className="flex-row gap-2">
              <View className="flex-1 gap-1">
                <FieldLabel>Weight (lbs)</FieldLabel>
                <TextInput value={weightLbs} onChangeText={setWeightLbs} keyboardType="decimal-pad" placeholder="185"
                  placeholderTextColor={colors.text.tertiary}
                  className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border.tertiary }} />
              </View>
              <View className="flex-1 gap-1">
                <FieldLabel>Body fat %</FieldLabel>
                <TextInput value={bodyFat} onChangeText={setBodyFat} keyboardType="decimal-pad" placeholder="18"
                  placeholderTextColor={colors.text.tertiary}
                  className="h-10 px-3 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                  style={{ borderWidth: 1, borderColor: colors.border.tertiary }} />
              </View>
            </View>
            <View className="gap-1">
              <FieldLabel>Notes</FieldLabel>
              <TextInput value={notes} onChangeText={setNotes} placeholder="Any observations..." multiline numberOfLines={3}
                placeholderTextColor={colors.text.tertiary}
                className="px-3 py-2.5 text-sm text-txt-primary bg-bg-secondary rounded-lg"
                style={{ borderWidth: 1, borderColor: colors.border.tertiary, minHeight: 80, textAlignVertical: 'top' }} />
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="px-4 pb-8 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}>
        <Pressable onPress={handleSave} disabled={logDose.isPending}
          className="w-full h-11 bg-teal rounded-lg items-center justify-center" style={{ opacity: logDose.isPending ? 0.6 : 1 }}>
          <Text className="text-sm font-medium text-white">{logDose.isPending ? 'Saving...' : 'Save dose'}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}
