import { useDecayData, type DecayPeptideResult } from '../hooks/useDecayData'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

function formatClearLabel(timeUntilClearHours: number): string {
  if (timeUntilClearHours <= 0) return 'cleared'
  if (timeUntilClearHours < 1) return 'clears in <1h'
  if (timeUntilClearHours < 24)
    return `clears in ~${Math.round(timeUntilClearHours)}h`
  const days = Math.round(timeUntilClearHours / 24)
  return `clears in ~${days}d`
}

function PeptideDecayRow({ result }: { result: DecayPeptideResult }) {
  const barPct = Math.min(
    100,
    (result.currentRemainingMcg / result.peakRemainingMcg) * 100
  )

  const mcgDisplay =
    result.currentRemainingMcg < 0.5
      ? '< 1 mcg'
      : result.currentRemainingMcg < 1000
      ? `${result.currentRemainingMcg.toFixed(1)} mcg`
      : `${(result.currentRemainingMcg / 1000).toFixed(2)} mg`

  const clearLabel = formatClearLabel(result.timeUntilClearHours)
  const isActive = result.currentRemainingMcg >= 0.5

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
            {result.peptideName}
          </span>
          <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0">
            {clearLabel}
          </span>
        </div>
        <span
          className="text-[12px] font-medium shrink-0 ml-3 tabular-nums"
          style={{ color: isActive ? '#1D9E75' : 'var(--color-text-tertiary)' }}
        >
          {mcgDisplay}
        </span>
      </div>

      {/* Thin decay bar */}
      <div
        className="h-[3px] w-full rounded-full overflow-hidden"
        style={{ background: 'var(--color-background-tertiary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barPct}%`,
            background: isActive ? '#1D9E75' : 'var(--color-text-tertiary)',
          }}
        />
      </div>
    </div>
  )
}

interface Props {
  items: HomeProtocolPeptide[]
}

export default function ActiveInSystemSection({ items }: Props) {
  const { data } = useDecayData(items)
  const activeResults = data?.results ?? []

  if (activeResults.length === 0) return null

  return (
    <div className="px-4 mt-4 mb-1">
      <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
        Active in system
      </p>
      <div className="flex flex-col gap-3.5">
        {activeResults.map((result) => (
          <PeptideDecayRow key={result.protocolPeptideId} result={result} />
        ))}
      </div>
    </div>
  )
}
