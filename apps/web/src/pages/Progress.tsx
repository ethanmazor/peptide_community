import { useState, useRef, useEffect } from 'react'
import { Camera, Plus, X, ChevronLeft } from 'lucide-react'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNative } from '../lib/platform'
import {
  BarChart, Bar, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useHistory } from '../hooks/useHistory'
import type { HistoryEntry } from '../hooks/useHistory'
import {
  usePhotos,
  useRecentDoseLogs,
  useUploadPhoto,
  type PhotoEntry,
  type RecentDoseLog,
} from '../hooks/usePhotos'
import { useSearchParams } from 'react-router-dom'

type Section = 'log' | 'stats' | 'photos'
type MetricView = 'weight' | 'bf'

// ─── Shared helpers ──────────────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Log section ─────────────────────────────────────────────────────────────

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
                <Cell key={idx} fill="#1D9E75" fillOpacity={idx === maxIdx ? 1 : 0.4} />
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
    <div className="border-b border-[var(--color-border-tertiary)]" style={{ borderBottomWidth: '0.5px' }}>
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

function LogSection() {
  const { data, isLoading, error } = useHistory()
  const [search, setSearch] = useState('')
  const [metricView, setMetricView] = useState<MetricView>('weight')
  const filtered = (data ?? []).filter((e) =>
    e.peptide?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="px-4 pb-3">
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
        <p className="px-4 text-[13px] text-[var(--color-text-danger)]">Failed to load history.</p>
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

// ─── Stats section ────────────────────────────────────────────────────────────

function StatsSection() {
  const { data, isLoading } = useHistory()

  const withMetrics = (data ?? [])
    .filter((e) => e.body_metric !== null)
    .slice(0, 30)
    .reverse()

  if (isLoading) {
    return (
      <div className="flex justify-center pt-10">
        <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  if (withMetrics.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-[15px] font-medium mb-1">No metrics yet</p>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Log weight or body fat when recording a dose to see trends here.
        </p>
      </div>
    )
  }

  const weightData = withMetrics
    .filter((e) => e.body_metric!.weight_kg !== null)
    .map((e) => ({
      date: new Date(e.administered_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: parseFloat((e.body_metric!.weight_kg! * 2.20462).toFixed(1)),
    }))

  const bfData = withMetrics
    .filter((e) => e.body_metric!.body_fat_pct !== null)
    .map((e) => ({
      date: new Date(e.administered_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: e.body_metric!.body_fat_pct!,
    }))

  const leanData = withMetrics
    .filter((e) => e.body_metric!.lean_mass_kg !== null)
    .map((e) => ({
      date: new Date(e.administered_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: parseFloat(((e.body_metric!.lean_mass_kg ?? 0) * 2.20462).toFixed(1)),
    }))

  const chartStyle = {
    fontSize: 10,
    fill: 'var(--color-text-tertiary)',
  }

  return (
    <div className="px-4 flex flex-col gap-6 pt-2 pb-6">
      {weightData.length > 1 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
            Weight (lbs)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={chartStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={chartStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--color-background-secondary)', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--color-text-secondary)' }}
                itemStyle={{ color: '#1D9E75' }}
              />
              <Line type="monotone" dataKey="value" stroke="#1D9E75" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1D9E75' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {bfData.length > 1 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
            Body fat %
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bfData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={chartStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={chartStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--color-background-secondary)', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--color-text-secondary)' }}
                itemStyle={{ color: '#1D9E75' }}
              />
              <Line type="monotone" dataKey="value" stroke="#1D9E75" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1D9E75' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {leanData.length > 1 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
            Lean mass (lbs)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={leanData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={chartStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={chartStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--color-background-secondary)', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--color-text-secondary)' }}
                itemStyle={{ color: '#1D9E75' }}
              />
              <Line type="monotone" dataKey="value" stroke="#1D9E75" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#1D9E75' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Photos section ───────────────────────────────────────────────────────────

interface UploadSheetProps {
  file: File
  previewUrl: string
  recentLogs: RecentDoseLog[]
  onSave: (doseLogId: string, caption: string | null) => void
  onClose: () => void
  isSaving: boolean
}

function UploadSheet({ file: _file, previewUrl, recentLogs, onSave, onClose, isSaving }: UploadSheetProps) {
  const [selectedLogId, setSelectedLogId] = useState<string>(recentLogs[0]?.id ?? '')
  const [caption, setCaption] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background-primary)]">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[16px] font-medium">Add photo</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-2">
            Attach to dose log
          </label>
          {recentLogs.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-secondary)]">No dose logs yet.</p>
          ) : (
            <div className="rounded-lg border border-[var(--color-border-tertiary)] overflow-hidden">
              {recentLogs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-[var(--color-border-tertiary)] last:border-0 transition-colors ${
                    selectedLogId === log.id ? 'bg-teal/10' : ''
                  }`}
                  style={{ borderBottomWidth: '0.5px' }}
                >
                  <span className="text-[14px] text-[var(--color-text-primary)]">{log.peptide_name}</span>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">{formatDate(log.administered_at)}</span>
                  {selectedLogId === log.id && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-teal shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
            Caption (optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a note…"
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>
      <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)]">
        <button
          onClick={() => onSave(selectedLogId, caption || null)}
          disabled={!selectedLogId || isSaving}
          className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : 'Save photo'}
        </button>
      </div>
    </div>
  )
}

interface ViewerProps {
  photo: PhotoEntry
  publicUrl: string
  onClose: () => void
}

function PhotoViewer({ photo, publicUrl, onClose }: ViewerProps) {
  const peptideName = photo.dose_log?.protocol_peptide?.peptide?.name ?? null
  const administeredAt = photo.dose_log?.administered_at ?? null
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-3">
        <button onClick={onClose} className="text-white/80"><X size={24} /></button>
        {administeredAt && (
          <span className="text-[12px] text-white/60">{formatDate(administeredAt)}</span>
        )}
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <img src={publicUrl} alt={photo.caption ?? ''} className="w-full max-h-full object-contain rounded" />
      </div>
      {(peptideName || photo.caption) && (
        <div className="px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {peptideName && <p className="text-[14px] font-medium text-white">{peptideName}</p>}
          {photo.dose_log && <p className="text-[12px] text-white/60 mt-0.5">{photo.dose_log.dose_mcg} mcg</p>}
          {photo.caption && <p className="text-[13px] text-white/80 mt-1">{photo.caption}</p>}
        </div>
      )}
    </div>
  )
}

function PhotosSection() {
  const { data: photos, isLoading, error } = usePhotos()
  const { data: recentLogs } = useRecentDoseLogs()
  const uploadPhoto = useUploadPhoto()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<PhotoEntry | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleAddPhoto() {
    if (isNative) {
      // Use native camera/gallery picker on iOS & Android
      const image = await CapCamera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        quality: 85,
        allowEditing: false,
        width: 1200,
      })
      if (!image.webPath) return
      const res = await fetch(image.webPath)
      const blob = await res.blob()
      const ext = image.format ?? 'jpeg'
      const file = new File([blob], `photo.${ext}`, { type: `image/${ext}` })
      setPendingFile(file)
      setPreviewUrl(image.webPath)
    } else {
      fileInputRef.current?.click()
    }
  }

  function handleCloseUpload() {
    if (previewUrl && !isNative) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
  }

  async function handleSavePhoto(doseLogId: string, caption: string | null) {
    if (!pendingFile) return
    await uploadPhoto.mutateAsync({ file: pendingFile, doseLogId, caption })
    handleCloseUpload()
  }

  const isEmpty = !isLoading && !error && (photos ?? []).length === 0

  return (
    <div>
      <div className="px-4 pb-3 flex justify-end">
        <button
          onClick={handleAddPhoto}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-teal text-white"
          aria-label="Add photo"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Web-only hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {isLoading && (
        <div className="flex justify-center pt-12">
          <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
        </div>
      )}
      {error && <p className="px-4 text-[13px] text-[var(--color-text-danger)]">Failed to load photos.</p>}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center px-6 pt-12 text-center">
          <Camera size={40} className="text-[var(--color-text-tertiary)] mb-3" strokeWidth={1.25} />
          <p className="text-[16px] font-medium mb-1">No photos yet</p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">Tap + to add your first progress photo.</p>
        </div>
      )}
      {!isLoading && !error && (photos ?? []).length > 0 && (
        <div className="px-4 grid grid-cols-2 gap-2">
          {(photos ?? []).map((photo) => (
            <button
              key={photo.id}
              onClick={() => setViewingPhoto(photo)}
              className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-background-secondary)]"
            >
              <img src={photo.signed_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-[10px] text-white/90">{formatDate(photo.taken_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {pendingFile && previewUrl && (
        <UploadSheet
          file={pendingFile}
          previewUrl={previewUrl}
          recentLogs={recentLogs ?? []}
          onSave={handleSavePhoto}
          onClose={handleCloseUpload}
          isSaving={uploadPhoto.isPending}
        />
      )}
      {viewingPhoto && (
        <PhotoViewer
          photo={viewingPhoto}
          publicUrl={viewingPhoto.signed_url}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  )
}

// ─── Segmented control ────────────────────────────────────────────────────────

function SegmentedControl({
  section,
  onChange,
}: {
  section: Section
  onChange: (s: Section) => void
}) {
  const options: { key: Section; label: string }[] = [
    { key: 'log', label: 'Log' },
    { key: 'stats', label: 'Stats' },
    { key: 'photos', label: 'Photos' },
  ]
  return (
    <div className="flex gap-1 mx-4 mb-4 p-0.5 bg-[var(--color-background-secondary)] rounded-lg">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 h-8 text-[13px] font-medium rounded-md transition-colors ${
            section === key
              ? 'bg-[var(--color-background-primary)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Progress() {
  const [searchParams] = useSearchParams()
  const initialSection = (searchParams.get('section') as Section | null) ?? 'log'
  const [section, setSection] = useState<Section>(initialSection)

  // Sync section if query param changes (e.g. redirect from /photos)
  useEffect(() => {
    const s = searchParams.get('section') as Section | null
    if (s && s !== section) setSection(s)
  }, [searchParams])

  return (
    <div className="pb-10">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-[20px] font-medium">Progress</h1>
      </div>
      <SegmentedControl section={section} onChange={setSection} />
      {section === 'log' && <LogSection />}
      {section === 'stats' && <StatsSection />}
      {section === 'photos' && <PhotosSection />}
    </div>
  )
}
