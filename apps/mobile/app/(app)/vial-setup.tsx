import { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import type { ProtocolPeptide, Peptide } from '@peptide/types'
import { useCreateVial } from '../../hooks/useCreateVial'
import { colors } from '../../lib/colors'
import { FieldLabel } from '../../components/ui/FieldLabel'

type PP = ProtocolPeptide & { peptide: Peptide }

export default function VialSetup() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    data?: string
    prefilledVialMg?: string
    prefilledBacMl?: string
  }>()
  const createVial = useCreateVial()

  const peptides = useMemo<PP[]>(() => {
    if (!params.data) return []
    try {
      return JSON.parse(params.data) as PP[]
    } catch {
      return []
    }
  }, [params.data])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [vialMg, setVialMg] = useState(params.prefilledVialMg ?? '')
  const [bacMl, setBacMl] = useState(params.prefilledBacMl ?? '')
  const [vendorName, setVendorName] = useState('')
  const [vendorUrl, setVendorUrl] = useState('')
  const [reconstitutedAt, setReconstitutedAt] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (peptides.length === 0) router.replace('/(app)/(tabs)')
  }, [peptides, router])

  const current = peptides[currentIdx]
  const vialMgNum = parseFloat(vialMg)
  const bacMlNum = parseFloat(bacMl)
  const concPerUnit =
    vialMgNum > 0 && bacMlNum > 0 ? (vialMgNum * 1000) / (bacMlNum * 100) : null

  function resetForm() {
    setVialMg('')
    setBacMl('')
    setVendorName('')
    setVendorUrl('')
    setReconstitutedAt(new Date().toISOString().split('T')[0])
    const d = new Date()
    d.setDate(d.getDate() + 60)
    setExpiresAt(d.toISOString().split('T')[0])
  }

  async function handleSave() {
    if (!current) return
    await createVial.mutateAsync({
      protocol_peptide_id: current.id,
      vial_size_mg: vialMgNum,
      bac_water_ml: bacMlNum,
      vendor_name: vendorName || null,
      vendor_url: vendorUrl || null,
      reconstituted_at: reconstitutedAt || null,
      expires_at: expiresAt || null,
    })
    if (currentIdx + 1 < peptides.length) {
      setCurrentIdx((i) => i + 1)
      resetForm()
    } else {
      router.replace('/(app)/(tabs)')
    }
  }

  function handleSkip() {
    if (currentIdx + 1 < peptides.length) {
      setCurrentIdx((i) => i + 1)
      resetForm()
    } else {
      router.replace('/(app)/(tabs)')
    }
  }

  if (!current) return null

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
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border.primary }}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[16px] font-medium text-txt-primary">Vial setup</Text>
          {peptides.length > 1 && (
            <Text className="text-[12px] text-txt-secondary">
              {currentIdx + 1} of {peptides.length}
            </Text>
          )}
        </View>
        <Text className="text-[20px] font-medium" style={{ color: colors.teal }}>
          {current.peptide.name}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 py-5"
        contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
      >
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FieldLabel>Vial size (mg)</FieldLabel>
            <TextInput
              keyboardType="decimal-pad"
              value={vialMg}
              onChangeText={setVialMg}
              placeholder="5"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>BAC water (mL)</FieldLabel>
            <TextInput
              keyboardType="decimal-pad"
              value={bacMl}
              onChangeText={setBacMl}
              placeholder="2"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
        </View>

        {concPerUnit !== null && (
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-lg bg-bg-secondary px-3 py-2">
              <Text className="text-[16px] font-medium text-txt-primary">
                {((vialMgNum * 1000) / bacMlNum).toFixed(0)}
              </Text>
              <Text className="text-[10px] text-txt-tertiary">mcg / mL</Text>
            </View>
            <View className="flex-1 rounded-lg bg-bg-secondary px-3 py-2">
              <Text className="text-[16px] font-medium text-txt-primary">
                {concPerUnit.toFixed(2)}
              </Text>
              <Text className="text-[10px] text-txt-tertiary">mcg / unit</Text>
            </View>
          </View>
        )}

        <View>
          <FieldLabel>Vendor name (optional)</FieldLabel>
          <TextInput
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="e.g. Peptide Sciences"
            placeholderTextColor={colors.text.tertiary}
            style={inputStyle}
          />
        </View>
        <View>
          <FieldLabel>Vendor URL (optional)</FieldLabel>
          <TextInput
            value={vendorUrl}
            onChangeText={setVendorUrl}
            placeholder="https://…"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="none"
            keyboardType="url"
            style={inputStyle}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FieldLabel>Reconstituted (YYYY-MM-DD)</FieldLabel>
            <TextInput
              value={reconstitutedAt}
              onChangeText={setReconstitutedAt}
              placeholder="2026-04-14"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Expires (YYYY-MM-DD)</FieldLabel>
            <TextInput
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="2026-06-13"
              placeholderTextColor={colors.text.tertiary}
              style={inputStyle}
            />
          </View>
        </View>
      </ScrollView>

      <View
        className="px-4 pt-3 pb-8"
        style={{ borderTopWidth: 1, borderTopColor: colors.border.primary }}
      >
        <Pressable
          onPress={handleSave}
          disabled={!vialMg || !bacMl || createVial.isPending}
          className="w-full h-11 bg-teal rounded-lg items-center justify-center"
          style={{ opacity: !vialMg || !bacMl || createVial.isPending ? 0.4 : 1 }}
        >
          <Text className="text-[14px] font-medium text-white">
            {createVial.isPending
              ? 'Saving…'
              : currentIdx + 1 < peptides.length
              ? 'Save & next'
              : 'Save vial'}
          </Text>
        </Pressable>
        <Pressable onPress={handleSkip} className="w-full h-9 items-center justify-center mt-2">
          <Text className="text-[13px] text-txt-secondary">Skip for now</Text>
        </Pressable>
      </View>
    </View>
  )
}
