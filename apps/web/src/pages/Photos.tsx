import { useRef, useState } from 'react'
import { Camera, Plus, X, ChevronLeft } from 'lucide-react'
import {
  usePhotos,
  useRecentDoseLogs,
  useUploadPhoto,
  useGetPhotoUrl,
  type PhotoEntry,
  type RecentDoseLog,
} from '../hooks/usePhotos'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

// --- Upload flow sheet ---

interface UploadSheetProps {
  file: File
  previewUrl: string
  recentLogs: RecentDoseLog[]
  onSave: (doseLogId: string, caption: string | null) => void
  onClose: () => void
  isSaving: boolean
}

function UploadSheet({ file, previewUrl, recentLogs, onSave, onClose, isSaving }: UploadSheetProps) {
  const [selectedLogId, setSelectedLogId] = useState<string>(recentLogs[0]?.id ?? '')
  const [caption, setCaption] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <button onClick={onClose} className="text-[var(--color-text-secondary)]">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[16px] font-medium">Add photo</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {/* Preview */}
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full max-h-64 object-cover rounded-lg"
        />

        {/* Attach to dose log */}
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
                  <span className="text-[14px] text-[var(--color-text-primary)]">
                    {log.peptide_name}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-secondary)]">
                    {formatDate(log.administered_at)}
                  </span>
                  {selectedLogId === log.id && (
                    <span className="ml-2 w-2 h-2 rounded-full bg-teal shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
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

// --- Full-screen viewer ---

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
        <button onClick={onClose} className="text-white/80">
          <X size={24} />
        </button>
        {administeredAt && (
          <span className="text-[12px] text-white/60">{formatDate(administeredAt)}</span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <img src={publicUrl} alt={photo.caption ?? ''} className="w-full max-h-full object-contain rounded" />
      </div>

      {(peptideName || photo.caption) && (
        <div className="px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {peptideName && (
            <p className="text-[14px] font-medium text-white">{peptideName}</p>
          )}
          {photo.dose_log && (
            <p className="text-[12px] text-white/60 mt-0.5">{photo.dose_log.dose_mcg} mcg</p>
          )}
          {photo.caption && (
            <p className="text-[13px] text-white/80 mt-1">{photo.caption}</p>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Photos screen ---

export default function Photos() {
  const { data: photos, isLoading, error } = usePhotos()
  const { data: recentLogs } = useRecentDoseLogs()
  const uploadPhoto = useUploadPhoto()
  const getPublicUrl = useGetPhotoUrl()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<PhotoEntry | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    // Reset input so the same file can be picked again
    e.target.value = ''
  }

  function handleCloseUpload() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
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
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-[20px] font-medium">Photos</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-teal text-white"
          aria-label="Add photo"
        >
          <Plus size={18} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* States */}
      {isLoading && (
        <div className="flex justify-center pt-12">
          <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
        </div>
      )}

      {error && (
        <p className="px-4 text-[13px] text-[var(--color-text-danger)]">Failed to load photos.</p>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
          <Camera size={40} className="text-[var(--color-text-tertiary)] mb-3" strokeWidth={1.25} />
          <p className="text-[16px] font-medium mb-1">No photos yet</p>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            Tap + to add your first progress photo.
          </p>
        </div>
      )}

      {/* 2-column grid */}
      {!isLoading && !error && (photos ?? []).length > 0 && (
        <div className="px-4 grid grid-cols-2 gap-2">
          {(photos ?? []).map((photo) => {
            const url = getPublicUrl(photo.storage_path)
            return (
              <button
                key={photo.id}
                onClick={() => setViewingPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-background-secondary)]"
              >
                <img src={url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[10px] text-white/90">{formatDate(photo.taken_at)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Upload sheet */}
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

      {/* Full-screen viewer */}
      {viewingPhoto && (
        <PhotoViewer
          photo={viewingPhoto}
          publicUrl={getPublicUrl(viewingPhoto.storage_path)}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  )
}
