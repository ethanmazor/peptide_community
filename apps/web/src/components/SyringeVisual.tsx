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

  // Tick configuration
  const majorInterval = syringeSize === 100 ? 10 : 5
  const minorInterval = syringeSize === 100 ? 2 : 1

  // SVG layout constants (viewBox units)
  const W = 300
  const BAR_Y = 16   // top of bar
  const BAR_H = 22   // bar height
  const LABEL_Y = BAR_Y + BAR_H + 12  // label baseline
  const SVG_H = LABEL_Y + 4
  const MAJOR_TICK_TOP = 2
  const MINOR_TICK_TOP = BAR_Y - 7

  const ticks: { u: number; major: boolean }[] = []
  for (let u = minorInterval; u <= syringeSize; u += minorInterval) {
    ticks.push({ u, major: u % majorInterval === 0 })
  }

  const xOf = (u: number) => (u / syringeSize) * W

  return (
    <div className="rounded-xl bg-[var(--color-background-secondary)] px-4 pt-4 pb-3">
      {unitsToDraw !== null && (
        <p className="text-[13px] mb-3 text-[var(--color-text-primary)]">
          {doseMcg != null ? (
            <>
              To have a dose of <strong>{doseMcg}</strong> mcg pull the syringe to{' '}
              <strong className={overflow ? 'text-red-500' : undefined}>
                {formatUnits(unitsToDraw)}
              </strong>
            </>
          ) : (
            <>
              Pull the syringe to{' '}
              <strong className={overflow ? 'text-red-500' : undefined}>
                {formatUnits(unitsToDraw)}
              </strong>
            </>
          )}
        </p>
      )}

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${SVG_H}`}
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Bar background */}
        <rect
          x={0}
          y={BAR_Y}
          width={W}
          height={BAR_H}
          rx={3}
          fill="var(--color-background-primary)"
          stroke="var(--color-border-tertiary)"
          strokeWidth={1}
        />

        {/* Fill */}
        {fillPct > 0 && (
          <rect
            x={0}
            y={BAR_Y}
            width={fillPct * W}
            height={BAR_H}
            rx={3}
            fill={overflow ? '#ef4444' : '#38bdf8'}
          />
        )}

        {/* Ticks and labels */}
        {ticks.map(({ u, major }) => {
          const x = xOf(u)
          return (
            <g key={u}>
              <line
                x1={x}
                y1={BAR_Y}
                x2={x}
                y2={BAR_Y + BAR_H / 2}
                stroke="var(--color-text-primary)"
                strokeWidth={major ? 1.5 : 0.75}
                opacity={major ? 0.6 : 0.3}
              />
              {major && (
                <text
                  x={x}
                  y={LABEL_Y}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-text-secondary)"
                  fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
                >
                  {u}
                </text>
              )}
            </g>
          )
        })}

        {/* Target line */}
        {unitsToDraw !== null && !overflow && unitsToDraw > 0 && (
          <line
            x1={xOf(unitsToDraw)}
            y1={BAR_Y - 1}
            x2={xOf(unitsToDraw)}
            y2={BAR_Y + BAR_H + 1}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth={2}
          />
        )}
      </svg>

      {overflow && (
        <p className="text-[11px] text-red-500 mt-1">
          Exceeds {syringeSize}u capacity — split into multiple draws.
        </p>
      )}
    </div>
  )
}
