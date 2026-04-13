import { View, Text } from 'react-native'
import { useDecayData, type DecayPeptideResult } from '../hooks/useDecayData'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import { colors } from '../lib/colors'

function formatClearLabel(h: number): string {
  if (h <= 0) return 'cleared'
  if (h < 1) return 'clears in <1h'
  if (h < 24) return `clears in ~${Math.round(h)}h`
  return `clears in ~${Math.round(h / 24)}d`
}

function PeptideDecayRow({ result }: { result: DecayPeptideResult }) {
  const barPct = Math.min(100, (result.currentRemainingMcg / result.peakRemainingMcg) * 100)
  const mcgDisplay = result.currentRemainingMcg < 0.5 ? '< 1 mcg'
    : result.currentRemainingMcg < 1000 ? `${result.currentRemainingMcg.toFixed(1)} mcg`
    : `${(result.currentRemainingMcg / 1000).toFixed(2)} mg`
  const isActive = result.currentRemainingMcg >= 0.5

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-1.5">
        <View className="flex-row items-baseline gap-2 flex-1">
          <Text className="text-[13px] font-medium text-txt-primary" numberOfLines={1}>{result.peptideName}</Text>
          <Text className="text-[11px] text-txt-tertiary">{formatClearLabel(result.timeUntilClearHours)}</Text>
        </View>
        <Text className="text-xs font-medium ml-3" style={{ color: isActive ? colors.teal : colors.text.tertiary, fontVariant: ['tabular-nums'] }}>{mcgDisplay}</Text>
      </View>
      <View className="h-[3px] w-full rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.tertiary }}>
        <View className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: isActive ? colors.teal : colors.text.tertiary }} />
      </View>
    </View>
  )
}

export default function ActiveInSystemSection({ items }: { items: HomeProtocolPeptide[] }) {
  const { data } = useDecayData(items)
  const activeResults = data?.results ?? []
  if (activeResults.length === 0) return null

  return (
    <View className="px-4 mt-4 mb-1">
      <Text className="text-[13px] font-medium uppercase tracking-widest text-txt-tertiary mb-3">Active in system</Text>
      <View className="gap-3.5">
        {activeResults.map((r) => <PeptideDecayRow key={r.protocolPeptideId} result={r} />)}
      </View>
    </View>
  )
}
