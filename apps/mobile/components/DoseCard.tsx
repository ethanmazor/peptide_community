import { View, Text, Pressable } from 'react-native'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'
import type { PeptideCycleProgress } from '../lib/cycleUtils'
import { colors } from '../lib/colors'

type DoseState = 'due' | 'logged'

function getDoseState(item: HomeProtocolPeptide): DoseState {
  return item.todays_logs.length > 0 ? 'logged' : 'due'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface Props {
  item: HomeProtocolPeptide
  onLog: (item: HomeProtocolPeptide) => void
  peptideCycle?: PeptideCycleProgress | null
}

export default function DoseCard({ item, onLog, peptideCycle }: Props) {
  const state = getDoseState(item)
  return (
    <Pressable onPress={() => state !== 'logged' && onLog(item)} disabled={state === 'logged'}
      className="w-full px-4 py-3.5 rounded-lg"
      style={{ backgroundColor: colors.bg.primary, borderWidth: state === 'due' ? 1 : 0.5, borderColor: state === 'due' ? colors.teal : colors.border.tertiary }}>
      <View className="flex-row justify-between items-start gap-3">
        <View className="flex-1">
          <Text className="text-sm font-medium text-txt-primary" numberOfLines={1}>{item.peptide.name}</Text>
          <Text className="text-xs text-txt-secondary mt-0.5">
            {item.dose_mcg} mcg · {item.frequency}
            {item.active_vial ? ` · ${item.active_vial.concentration_mcg_per_unit.toFixed(1)} mcg/unit` : ''}
          </Text>
          {peptideCycle && (
            <View className="mt-1.5">
              <Text className="text-[11px] text-txt-tertiary mb-0.5">Day {peptideCycle.day} / {peptideCycle.total}</Text>
              <View className="h-1 w-24 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.secondary }}>
                <View className="h-full rounded-full" style={{ width: `${Math.min(peptideCycle.pct * 100, 100)}%`, backgroundColor: 'rgba(29,158,117,0.5)' }} />
              </View>
            </View>
          )}
        </View>
        <View className="pt-0.5">
          {state === 'logged' ? (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg.secondary }}>
              <Text className="text-[10px] font-medium text-txt-secondary">Logged {formatTime(item.todays_logs[0].administered_at)}</Text>
            </View>
          ) : (
            <View className="px-2 py-0.5 rounded-full bg-teal">
              <Text className="text-[10px] font-medium text-white">Due now</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}
