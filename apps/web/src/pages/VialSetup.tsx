import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ProtocolPeptide, Peptide } from '@peptide/types'
import { useCreateVial } from '../hooks/useCreateVial'

interface LocationState {
  protocolId: string
  protocolPeptides: Array<ProtocolPeptide & { peptide: Peptide }>
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)] block mb-1">
      {children}
    </label>
  )
}

export default function VialSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const createVial = useCreateVial()

  const peptides = state?.protocolPeptides ?? []
  const [currentIdx, setCurrentIdx] = useState(0)

  const [vialMg, setVialMg] = useState('')
  const [bacMl, setBacMl] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorUrl, setVendorUrl] = useState('')
  const [reconstitutedAt, setReconstitutedAt] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 60)
    return d.toISOString().split('T')[0]
  })

  const current = peptides[currentIdx]

  const vialMgNum = parseFloat(vialMg)
  const bacMlNum = parseFloat(bacMl)
  const concPerUnit =
    vialMgNum > 0 && bacMlNum > 0
      ? (vialMgNum * 1000) / (bacMlNum * 100)
      : null

  function resetForm() {
    setVialMg('')
    setBacMl('')
    setVendorName('')
    setVendorUrl('')
    setReconstitutedAt(new Date().toISOString().split('T')[0])
    const d = new Date()
    d.setDate(d.getDate() + 60)
    setExpiresAt(d.toISOString().split('T')[0])
  }

  async function handleSave() {
    if (!current) return

    await createVial.mutateAsync({
      protocol_peptide_id: current.id,
      vial_size_mg: vialMgNum,
      bac_water_ml: bacMlNum,
      vendor_name: vendorName || null,
      vendor_url: vendorUrl || null,
      reconstituted_at: reconstitutedAt || null,
      expires_at: expiresAt || null,
    })

    if (currentIdx + 1 < peptides.length) {
      setCurrentIdx((i) => i + 1)
      resetForm()
    } else {
      navigate('/', { replace: true })
    }
  }

  function handleSkip() {
    if (currentIdx + 1 < peptides.length) {
      setCurrentIdx((i) => i + 1)
      resetForm()
    } else {
      navigate('/', { replace: true })
    }
  }

  if (!current || peptides.length === 0) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[var(--color-background-primary)]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[16px] font-medium">Vial setup</h1>
          {peptides.length > 1 && (
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              {currentIdx + 1} of {peptides.length}
            </span>
          )}
        </div>
        <p className="text-[20px] font-medium text-teal">{current.peptide.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-32 flex flex-col gap-4">
        {/* Vial size + BAC */}
        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>Vial size (mg)</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              value={vialMg}
              onChange={(e) => setVialMg(e.target.value)}
              placeholder="5"
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex-1">
            <FieldLabel>BAC water (mL)</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              value={bacMl}
              onChange={(e) => setBacMl(e.target.value)}
              placeholder="2"
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Live concentration */}
        {concPerUnit !== null && (
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg bg-[var(--color-background-secondary)] px-3 py-2">
              <p className="text-[16px] font-medium text-[var(--color-text-primary)]">
                {((vialMgNum * 1000) / bacMlNum).toFixed(0)}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">mcg / mL</p>
            </div>
            <div className="flex-1 rounded-lg bg-[var(--color-background-secondary)] px-3 py-2">
              <p className="text-[16px] font-medium text-[var(--color-text-primary)]">
                {concPerUnit.toFixed(2)}
              </p>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">mcg / unit</p>
            </div>
          </div>
        )}

        {/* Vendor */}
        <div>
          <FieldLabel>Vendor name (optional)</FieldLabel>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="e.g. Peptide Sciences"
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
        <div>
          <FieldLabel>Vendor URL (optional)</FieldLabel>
          <input
            type="url"
            value={vendorUrl}
            onChange={(e) => setVendorUrl(e.target.value)}
            placeholder="https://…"
            className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Dates */}
        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>Reconstituted</FieldLabel>
            <input
              type="date"
              value={reconstitutedAt}
              onChange={(e) => setReconstitutedAt(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex-1">
            <FieldLabel>Expires</FieldLabel>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 border-t border-[var(--color-border-primary)] bg-[var(--color-background-primary)] flex flex-col gap-2">
        <button
          onClick={handleSave}
          disabled={!vialMg || !bacMl || createVial.isPending}
          className="w-full h-11 bg-teal text-white text-[14px] font-medium rounded-lg disabled:opacity-40"
        >
          {createVial.isPending
            ? 'Saving…'
            : currentIdx + 1 < peptides.length
            ? 'Save & next'
            : 'Save vial'}
        </button>
        <button
          onClick={handleSkip}
          className="w-full h-9 text-[13px] text-[var(--color-text-secondary)]"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
