import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useHomeData } from '../../../hooks/useHomeData'
import SyringeVisual from '../../../components/SyringeVisual'
import { FieldLabel } from '../../../components/ui/FieldLabel'
import { colors } from '../../../lib/colors'

const SYRINGE_SIZES = [30, 50, 100] as const

export default function CalculatorScreen() {
  const router = useRouter()
  const { data: homeData } = useHomeData()

  const [vialMg, setVialMg] = useState('')
  const [bacMl, setBacMl] = useState('')
  const [targetMcg, setTargetMcg] = useState('')
  const [syringeSize, setSyringeSize] = useState<30 | 50 | 100>(100)

  const vialMgNum = parseFloat(vialMg)
  const bacMlNum = parseFloat(bacMl)
  const targetMcgNum = parseFloat(targetMcg)

  const activeProtocol = homeData?.protocol ?? null
  const protocolPeptides = homeData?.items ?? []

  const concPerMl =
    vialMgNum > 0 && bacMlNum > 0 ? (vialMgNum * 1000) / bacMlNum : null
  const concPerUnit =
    vialMgNum > 0 && bacMlNum > 0 ? (vialMgNum * 1000) / (bacMlNum * 100) : null
  const unitsToDraw =
    concPerUnit && targetMcgNum > 0 ? targetMcgNum / concPerUnit : null

  function handleSaveToVial() {
    if (!activeProtocol) return
    router.push({
      pathname: '/(app)/vial-setup',
      params: {
        protocolId: activeProtocol.id,
        data: JSON.stringify(protocolPeptides),
        prefilledVialMg: vialMg,
        prefilledBacMl: bacMl,
      },
    })
  }

  const hasConc = concPerMl !== null && concPerUnit !== null

  return (
    <ScrollView
      className="flex-1 bg-bg-primary"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <Text className="text-xl font-medium text-txt-primary">Calculator</Text>
        <Text className="text-[13px] text-txt-secondary mt-0.5">
          Reconstitution &amp; dose helper
        </Text>
      </View>

      {/* Reconstitution inputs */}
      <View
        className="mx-4 rounded-xl p-4 mb-3"
        style={{ backgroundColor: colors.bg.secondary }}
      >
        <Text className="text-[13px] font-semibold text-txt-primary mb-3">
          Reconstitution
        </Text>

        <View className="mb-3">
          <FieldLabel>Peptide amount (mg)</FieldLabel>
          <TextInput
            className="h-10 px-3 rounded-lg text-[14px]"
            style={{
              backgroundColor: colors.bg.tertiary,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.primary,
            }}
            placeholder="e.g. 5"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            value={vialMg}
            onChangeText={setVialMg}
            returnKeyType="next"
          />
        </View>

        <View>
          <FieldLabel>BAC water added (mL)</FieldLabel>
          <TextInput
            className="h-10 px-3 rounded-lg text-[14px]"
            style={{
              backgroundColor: colors.bg.tertiary,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.primary,
            }}
            placeholder="e.g. 2"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            value={bacMl}
            onChangeText={setBacMl}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Concentration result cards */}
      {hasConc && (
        <View className="mx-4 flex-row gap-3 mb-3">
          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: colors.bg.secondary }}
          >
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-1">
              mcg / mL
            </Text>
            <Text className="text-lg font-semibold text-txt-primary">
              {concPerMl!.toFixed(0)}
            </Text>
          </View>
          <View
            className="flex-1 rounded-xl p-4"
            style={{ backgroundColor: colors.bg.secondary }}
          >
            <Text className="text-[10px] font-medium uppercase tracking-widest text-txt-secondary mb-1">
              mcg / unit
            </Text>
            <Text className="text-lg font-semibold text-txt-primary">
              {concPerUnit!.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Target dose input */}
      <View
        className="mx-4 rounded-xl p-4 mb-3"
        style={{ backgroundColor: colors.bg.secondary }}
      >
        <Text className="text-[13px] font-semibold text-txt-primary mb-3">
          Dose
        </Text>

        <View className="mb-4">
          <FieldLabel>Target dose (mcg)</FieldLabel>
          <TextInput
            className="h-10 px-3 rounded-lg text-[14px]"
            style={{
              backgroundColor: colors.bg.tertiary,
              color: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border.primary,
            }}
            placeholder="e.g. 250"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="decimal-pad"
            value={targetMcg}
            onChangeText={setTargetMcg}
            returnKeyType="done"
          />
        </View>

        {/* Syringe size selector */}
        <FieldLabel>Syringe size (units)</FieldLabel>
        <View className="flex-row gap-2 mt-1">
          {SYRINGE_SIZES.map((size) => {
            const active = syringeSize === size
            return (
              <Pressable
                key={size}
                onPress={() => setSyringeSize(size)}
                className="flex-1 h-9 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: active ? colors.teal : colors.bg.tertiary,
                  borderWidth: 1,
                  borderColor: active ? colors.teal : colors.border.primary,
                }}
              >
                <Text
                  className="text-[13px] font-medium"
                  style={{ color: active ? '#ffffff' : colors.text.secondary }}
                >
                  {size}u
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Syringe visual */}
      {hasConc && (
        <View className="mx-4 mb-3">
          <SyringeVisual
            syringeSize={syringeSize}
            unitsToDraw={unitsToDraw}
            doseMcg={targetMcgNum > 0 ? targetMcgNum : null}
          />
        </View>
      )}

      {/* Units to draw result */}
      {unitsToDraw !== null && (
        <View
          className="mx-4 rounded-xl p-4 mb-3 flex-row items-center justify-between"
          style={{ backgroundColor: colors.bg.secondary }}
        >
          <Text className="text-[13px] text-txt-secondary">Units to draw</Text>
          <Text className="text-lg font-semibold text-txt-primary">
            {unitsToDraw > syringeSize
              ? `${unitsToDraw.toFixed(1)} ⚠️`
              : unitsToDraw >= 10
              ? String(Math.round(unitsToDraw))
              : unitsToDraw.toFixed(1)}
          </Text>
        </View>
      )}

      {/* Save to vial button */}
      {hasConc && activeProtocol && (
        <View className="mx-4">
          <Pressable
            onPress={handleSaveToVial}
            className="h-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.teal }}
          >
            <Text className="text-sm font-medium text-white">
              Save to Vial Setup
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}
