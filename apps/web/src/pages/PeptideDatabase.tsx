import { useState } from 'react'
import { Search } from 'lucide-react'
import { usePeptides } from '../hooks/usePeptides'
import type { Peptide } from '@peptide/types'

function formatHalfLife(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

function PeptideCard({
  peptide,
  expanded,
  onToggle,
}: {
  peptide: Peptide
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-[var(--color-background-secondary)] rounded-xl px-4 py-3 transition-colors active:bg-[var(--color-background-tertiary)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--color-text-primary)]">{peptide.name}</span>
            {peptide.alias && (
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-teal/10 text-teal font-medium">
                {peptide.alias}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
            {peptide.half_life_hours !== null && (
              <span>t½ {formatHalfLife(peptide.half_life_hours)}</span>
            )}
            {peptide.typical_dose_mcg !== null && (
              <span>
                {peptide.typical_dose_mcg >= 1000
                  ? `${peptide.typical_dose_mcg / 1000}mg`
                  : `${peptide.typical_dose_mcg}mcg`}
                {peptide.typical_frequency ? ` · ${peptide.typical_frequency}` : ''}
              </span>
            )}
          </div>
        </div>
        <span className="text-[var(--color-text-tertiary)] text-sm mt-0.5">
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)] space-y-2">
          {peptide.description && (
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {peptide.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                peptide.is_default
                  ? 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                  : 'bg-teal/10 text-teal'
              }`}
            >
              {peptide.is_default ? 'Library' : 'Your peptide'}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}

export default function PeptideDatabase() {
  const { data: peptides = [], isLoading } = usePeptides()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = peptides
    .filter(p => {
      if (!query) return true
      const q = query.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.alias ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  return (
    <div className="pb-10">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Peptides</h1>
      </div>

      <div className="px-4 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            type="text"
            placeholder="Search by name or alias…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--color-background-secondary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
      </div>

      <div className="px-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-teal rounded-full border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-text-tertiary)] py-12">
            No peptides found
          </p>
        ) : (
          filtered.map(peptide => (
            <PeptideCard
              key={peptide.id}
              peptide={peptide}
              expanded={expandedId === peptide.id}
              onToggle={() => setExpandedId(expandedId === peptide.id ? null : peptide.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
