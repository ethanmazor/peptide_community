import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useHomeData } from '../hooks/useHomeData'
import CycleProgressBar from '../components/CycleProgressBar'
import DoseCard from '../components/DoseCard'
import LogDoseSheet from '../components/LogDoseSheet'
import FAB from '../components/FAB'
import ActiveInSystemSection from '../components/ActiveInSystemSection'
import { getPeptideCycleProgress } from '../lib/cycleUtils'
import type { HomeProtocolPeptide } from '../hooks/useHomeData'

export default function Home() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useHomeData()
  const [sheetItem, setSheetItem] = useState<HomeProtocolPeptide | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function openSheet(item: HomeProtocolPeptide) {
    setSheetItem(item)
    setSheetOpen(true)
  }

  function openFABSheet() {
    // Use first unlogged item, or first item if all are logged (off-schedule extra dose)
    const unlogged = data?.items.find((i) => i.todays_logs.length === 0)
    const target = unlogged ?? data?.items[0] ?? null
    setSheetItem(target)
    setSheetOpen(true)
  }

  function handleDepleted(item: HomeProtocolPeptide) {
    navigate('/vial-setup', {
      state: {
        protocolId: item.protocol_id,
        protocolPeptides: [{ ...item, peptide: item.peptide }],
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="w-5 h-5 border-2 border-teal rounded-full border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 pt-10 text-[13px] text-[var(--color-text-danger)]">
        Failed to load data.
      </div>
    )
  }

  const { protocol, items } = data ?? { protocol: null, items: [] }

  if (!protocol) {
    return (
      <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
        <p className="text-[16px] font-medium mb-2">No active protocol</p>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
          Create a protocol to start tracking your doses.
        </p>
        <Link
          to="/settings/protocols/new"
          className="h-11 px-6 flex items-center justify-center bg-teal text-white text-[14px] font-medium rounded-lg"
        >
          Create protocol
        </Link>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="px-4 pt-5">
        <h1 className="text-[20px] font-medium">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </h1>
      </div>

      <CycleProgressBar protocol={protocol} />

      <ActiveInSystemSection items={items} />

      <div className="px-4 mt-1 flex flex-col gap-2.5 pb-6">
        <p className="text-[13px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
          Doses
        </p>
        {items.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            No peptides in this protocol.
          </p>
        ) : (
          items.map((item) => (
            <DoseCard
              key={item.id}
              item={item}
              onLog={openSheet}
              peptideCycle={getPeptideCycleProgress(item, protocol)}
            />
          ))
        )}
      </div>

      <FAB onClick={openFABSheet} />

      <LogDoseSheet
        item={sheetItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onDepleted={handleDepleted}
      />
    </div>
  )
}
