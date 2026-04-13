import { View, Text } from 'react-native'
import type { Protocol } from '@peptide/types'
import { colors } from '../lib/colors'

function getDayProgress(protocol: Protocol) {
  const today = new Date()
  const start = protocol.start_date ? new Date(protocol.start_date) : null
  const end = protocol.end_date ? new Date(protocol.end_date) : null
  if (!start || !end) return { day: 1, total: 1, pct: 0 }
  const totalMs = end.getTime() - start.getTime()
  const elapsedMs = today.getTime() - start.getTime()
  const total = Math.round(totalMs / (1000 * 60 * 60 * 24)) + 1
  const day = Math.max(1, Math.min(total, Math.round(elapsedMs / (1000 * 60 * 60 * 24)) + 1))
  const pct = Math.min(100, Math.max(0, ((day - 1) / (total - 1)) * 100))
  return { day, total, pct }
}

export default function CycleProgressBar({ protocol }: { protocol: Protocol }) {
  const { day, total, pct } = getDayProgress(protocol)
  return (
    <View className="px-4 pt-5 pb-3">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-xs text-txt-secondary">{protocol.name}</Text>
        <Text className="text-xs font-medium text-teal">Day {day} / {total}</Text>
      </View>
      <View className="h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: colors.bg.tertiary }}>
        <View className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}
