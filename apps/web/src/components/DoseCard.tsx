import type { HomeProtocolPeptide } from '../hooks/useHomeData'

type DoseState = 'due' | 'logged' | 'upcoming'

function getDoseState(item: HomeProtocolPeptide): DoseState {
  if (item.todays_logs.length > 0) return 'logged'
  return 'due'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface Props {
  item: HomeProtocolPeptide
  onLog: (item: HomeProtocolPeptide) => void
}

export default function DoseCard({ item, onLog }: Props) {
  const state = getDoseState(item)

  const borderStyle =
    state === 'due'
      ? '1px solid #1D9E75'
      : '0.5px solid var(--color-border-tertiary)'

  const pill =
    state === 'logged' ? (
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{
          background: 'var(--color-background-secondary)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Logged {formatTime(item.todays_logs[0].administered_at)}
      </span>
    ) : (
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white bg-teal"
      >
        Due now
      </span>
    )

  return (
    <button
      onClick={() => state !== 'logged' && onLog(item)}
      disabled={state === 'logged'}
      className="w-full text-left px-4 py-3.5 bg-[var(--color-background-primary)] rounded-lg"
      style={{ border: borderStyle }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate">{item.peptide.name}</p>
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
            {item.dose_mcg} mcg · {item.frequency}
            {item.active_vial && (
              <> · {item.active_vial.concentration_mcg_per_unit.toFixed(1)} mcg/unit</>
            )}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">{pill}</div>
      </div>
    </button>
  )
}
