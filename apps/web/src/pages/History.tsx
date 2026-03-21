import { useState } from 'react'
import { BarChart, Bar, Cell } from 'recharts'
import { useHistory } from '../hooks/useHistory'
import type { HistoryEntry } from '../hooks/useHistory'

type MetricView = 'weight' | 'bf'

function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  if (date.toDateString() === today.toDateString()) return `Today, ${timeStr}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function MetricCards({
  entries,
  view,
  onToggle,
}: {
  entries: HistoryEntry[]
  view: MetricView
  onToggle: (v: MetricView) => void
}) {
  const withMetrics = entries.filter((e) => e.body_metric !== null)
  const latest = withMetrics[0]?.body_metric

  const weightKg = latest?.weight_kg ?? null
  const weightLbs = weightKg !== null ? (weightKg * 2.20462).toFixed(1) : null
  const bf = latest?.body_fat_pct ?? null

  // Chart data — last 7 entries with body_metrics
  const chartEntries = withMetrics.slice(0, 7).reverse()
  const chartData = chartEntries.map((e) => ({
    value:
      view === 'weight'
        ? e.body_metric!.weight_kg !== null
          ? e.body_metric!.weight_kg * 2.20462
          : null
        : e.body_metric!.body_fat_pct,
  }))

  const maxIdx = chartData.length - 1

  if (withMetrics.length === 0) return null

  return (
    <div className="px-4 mb-4">
      {/* Stat cards */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onToggle('weight')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
            view === 'weight'
              ? 'bg-[var(--color-background-secondary)] ring-1 ring-teal'
              : 'bg-[var(--color-background-secondary)]'
          }`}
        >
          <p className="text-[18px] font-medium text-[var(--color-text-primary)]">
            {weightLbs !== null ? weightLbs : '—'}
          </p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">lbs</p>
        </button>
        <button
          onClick={() => onToggle('bf')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
            view === 'bf'
              ? 'bg-[var(--color-background-secondary)] ring-1 ring-teal'
              : 'bg-[var(--color-background-secondary)]'
          }`}
        >
          <p className="text-[18px] font-medium text-[var(--color-text-primary)]">
            {bf !== null ? `${bf}%` : '—'}
          </p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">Body fat</p>
        </button>
      </div>

      {/* Mini bar chart */}
      {chartData.length > 1 && (
        <div className="h-16 w-full">
          <BarChart
            width={343}
            height={64}
            data={chartData}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
            barCategoryGap="20%"
          >
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.map((_, idx) => (
                <Cell
                  key={idx}
                  fill="#1D9E75"
                  fillOpacity={idx === maxIdx ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      )}
    </div>
  )
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="border-b border-[var(--color-border-tertiary)]"
      style={{ borderBottomWidth: '0.5px' }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between py-[10px] text-left"
      >
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {entry.peptide?.name ?? '—'}
          </p>
          {entry.injection_site && (
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              {entry.injection_site}
            </p>
          )}
        </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] shrink-0 ml-2">
          {formatRelativeDate(entry.administered_at)}
        </p>
      </button>

      {expanded && (
        <div className="pb-3 text-[12px] text-[var(--color-text-secondary)] flex flex-col gap-1">
          <p>
            <span className="text-[var(--color-text-tertiary)]">Dose: </span>
            {entry.dose_mcg} mcg
            {entry.units_drawn !== null && ` · ${entry.units_drawn} units`}
          </p>
          {entry.body_metric?.weight_kg && (
            <p>
              <span className="text-[var(--color-text-tertiary)]">Weight: </span>
              {(entry.body_metric.weight_kg * 2.20462).toFixed(1)} lbs
              {entry.body_metric.body_fat_pct !== null &&
                ` · ${entry.body_metric.body_fat_pct}% BF`}
            </p>
          )}
          {entry.notes && (
            <p>
              <span className="text-[var(--color-text-tertiary)]">Notes: </span>
              {entry.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function History() {
  const { data, isLoading, error } = useHistory()
  const [search, setSearch] = useState('')
  const [metricView, setMetricView] = useState<MetricView>('weight')

  const filtered = (data ?? []).filter((e) =>
    e.peptide?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-[20px] font-medium mb-3">History</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by peptide…"
          className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
          style={{ color: 'var(--color-text-primary)' }}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center pt-10">
          <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
        </div>
      )}

      {error && (
        <p className="px-4 text-[13px] text-[var(--color-text-danger)]">
          Failed to load history.
        </p>
      )}

      {!isLoading && !error && (
        <>
          <MetricCards entries={data ?? []} view={metricView} onToggle={setMetricView} />

          <div className="px-4">
            {filtered.length === 0 ? (
              <p className="text-[14px] text-[var(--color-text-secondary)] pt-4">
                {search ? 'No results.' : 'No doses logged yet.'}
              </p>
            ) : (
              filtered.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
            )}
          </div>
        </>
      )}
    </div>
  )
}
