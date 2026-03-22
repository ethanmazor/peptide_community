import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomeData } from '../hooks/useHomeData'
import SyringeVisual from '../components/SyringeVisual'

export default function Calculator() {
  const navigate = useNavigate()
  const { data: homeData } = useHomeData()
  const [vialMg, setVialMg] = useState('')
  const [bacMl, setBacMl] = useState('')
  const [targetMcg, setTargetMcg] = useState('')
  const [syringeSize, setSyringeSize] = useState<30 | 50 | 100>(100)

  const vialMgNum = parseFloat(vialMg)
  const bacMlNum = parseFloat(bacMl)
  const targetMcgNum = parseFloat(targetMcg)

  const activeProtocol = homeData?.protocol ?? null
  const protocolPeptides = homeData?.items ?? []

  const concPerMl =
    vialMgNum > 0 && bacMlNum > 0 ? (vialMgNum * 1000) / bacMlNum : null
  const concPerUnit =
    vialMgNum > 0 && bacMlNum > 0
      ? (vialMgNum * 1000) / (bacMlNum * 100)
      : null
  const unitsToDraw =
    concPerUnit && targetMcgNum > 0 ? targetMcgNum / concPerUnit : null

  return (
    <div className="px-4 pt-5 pb-10 max-w-[480px]">
      <h1 className="text-[20px] font-medium mb-6">Calculator</h1>

      {/* Inputs */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
              Vial size (mg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={vialMg}
              onChange={(e) => setVialMg(e.target.value)}
              placeholder="5"
              className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
              BAC water (mL)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={bacMl}
              onChange={(e) => setBacMl(e.target.value)}
              placeholder="2"
              className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        {/* Output cards */}
        <div className="flex gap-3 mt-1">
          <div className="flex-1 rounded-lg bg-[var(--color-background-secondary)] px-3 py-2.5">
            <p className="text-[18px] font-medium text-[var(--color-text-primary)]">
              {concPerMl !== null ? concPerMl.toFixed(0) : '—'}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              mcg / mL
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-[var(--color-background-secondary)] px-3 py-2.5">
            <p className="text-[18px] font-medium text-[var(--color-text-primary)]">
              {concPerUnit !== null ? concPerUnit.toFixed(2) : '—'}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              mcg / unit
            </p>
          </div>
        </div>

        {/* Syringe size selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
            Syringe size
          </label>
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-tertiary)]">
            {([30, 50, 100] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSyringeSize(size)}
                className={`flex-1 h-9 text-[13px] font-medium transition-colors ${
                  syringeSize === size
                    ? 'bg-teal text-white'
                    : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {size}u
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--color-border-tertiary)] my-1" />

        {/* Target dose */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-secondary)]">
            Target dose (mcg)
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={targetMcg}
            onChange={(e) => setTargetMcg(e.target.value)}
            placeholder="250"
            className="h-10 px-3 text-[14px] bg-[var(--color-background-secondary)] border border-[var(--color-border-tertiary)] rounded-lg focus:outline-none focus:border-teal"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Units to draw result */}
        <div
          className="rounded-lg px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--color-background-secondary)' }}
        >
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            Units to draw
          </span>
          <span className="text-[20px] font-medium text-teal">
            {unitsToDraw !== null ? unitsToDraw.toFixed(2) : '—'}
          </span>
        </div>

        {/* Syringe visual */}
        {unitsToDraw !== null && (
          <SyringeVisual
            syringeSize={syringeSize}
            unitsToDraw={unitsToDraw}
            doseMcg={targetMcgNum > 0 ? targetMcgNum : null}
          />
        )}

        {/* Save to vial */}
        {concPerUnit !== null && activeProtocol && (
          <button
            onClick={() =>
              navigate('/vial-setup', {
                state: {
                  protocolId: activeProtocol.id,
                  protocolPeptides: protocolPeptides.map((item) => ({
                    ...item,
                    peptide: item.peptide,
                  })),
                  prefilledVialMg: vialMg,
                  prefilledBacMl: bacMl,
                },
              })
            }
            className="w-full h-11 border border-teal text-teal text-[14px] font-medium rounded-lg"
          >
            Save to vial
          </button>
        )}
      </div>
    </div>
  )
}
