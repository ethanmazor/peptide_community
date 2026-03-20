import type { Protocol } from '@peptide/types'

interface Props {
  protocol: Protocol
}

function getDayProgress(protocol: Protocol): { day: number; total: number; pct: number } {
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

export default function CycleProgressBar({ protocol }: Props) {
  const { day, total, pct } = getDayProgress(protocol)

  return (
    <div className="px-4 pt-5 pb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-[var(--color-text-secondary)]">{protocol.name}</span>
        <span className="text-[12px] font-medium text-teal">Day {day} / {total}</span>
      </div>
      <div className="h-[5px] rounded-full bg-[var(--color-background-tertiary)] overflow-hidden">
        <div
          className="h-full rounded-full bg-teal transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
