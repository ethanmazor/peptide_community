import { View, Text } from 'react-native'
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg'
import { colors } from '../lib/colors'

interface Props {
  syringeSize: 30 | 50 | 100
  unitsToDraw: number | null
  doseMcg?: number | null
}

function formatUnits(u: number): string {
  return Number.isInteger(u) || u >= 10 ? String(Math.round(u)) : u.toFixed(1)
}

export default function SyringeVisual({ syringeSize, unitsToDraw, doseMcg }: Props) {
  const overflow = unitsToDraw !== null && unitsToDraw > syringeSize
  const fillPct = unitsToDraw !== null ? Math.min(unitsToDraw / syringeSize, 1) : 0
  const majorInterval = syringeSize === 100 ? 10 : 5
  const minorInterval = syringeSize === 100 ? 2 : 1
  const W = 300; const BAR_Y = 16; const BAR_H = 22
  const LABEL_Y = BAR_Y + BAR_H + 12; const SVG_H = LABEL_Y + 4

  const ticks: { u: number; major: boolean }[] = []
  for (let u = minorInterval; u <= syringeSize; u += minorInterval)
    ticks.push({ u, major: u % majorInterval === 0 })
  const xOf = (u: number) => (u / syringeSize) * W

  return (
    <View className="rounded-xl px-4 pt-4 pb-3" style={{ backgroundColor: colors.bg.secondary }}>
      {unitsToDraw !== null && (
        <Text className="text-[13px] text-txt-primary mb-3">
          {doseMcg != null ? `To have a dose of ${doseMcg} mcg pull the syringe to ${formatUnits(unitsToDraw)}`
            : `Pull the syringe to ${formatUnits(unitsToDraw)}`}
        </Text>
      )}
      <Svg width="100%" height={SVG_H} viewBox={`0 0 ${W} ${SVG_H}`}>
        <Rect x={0} y={BAR_Y} width={W} height={BAR_H} rx={3} fill={colors.bg.primary} stroke={colors.border.tertiary} strokeWidth={1} />
        {fillPct > 0 && <Rect x={0} y={BAR_Y} width={fillPct * W} height={BAR_H} rx={3} fill={overflow ? '#ef4444' : '#38bdf8'} />}
        {ticks.map(({ u, major }) => (
          <G key={u}>
            <Line x1={xOf(u)} y1={BAR_Y} x2={xOf(u)} y2={BAR_Y + BAR_H / 2}
              stroke={colors.text.primary} strokeWidth={major ? 1.5 : 0.75} opacity={major ? 0.6 : 0.3} />
            {major && <SvgText x={xOf(u)} y={LABEL_Y} textAnchor="middle" fontSize={9} fill={colors.text.secondary}>{u}</SvgText>}
          </G>
        ))}
        {unitsToDraw !== null && !overflow && unitsToDraw > 0 && (
          <Line x1={xOf(unitsToDraw)} y1={BAR_Y - 1} x2={xOf(unitsToDraw)} y2={BAR_Y + BAR_H + 1} stroke="rgba(0,0,0,0.6)" strokeWidth={2} />
        )}
      </Svg>
      {overflow && <Text className="text-[11px] mt-1" style={{ color: '#ef4444' }}>Exceeds {syringeSize}u capacity — split into multiple draws.</Text>}
    </View>
  )
}
