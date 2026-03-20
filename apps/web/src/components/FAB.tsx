import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
}

export default function FAB({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Log dose"
      className="absolute right-4 bg-teal text-white rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
      style={{
        width: 40,
        height: 40,
        bottom: 'calc(68px + env(safe-area-inset-bottom))',
      }}
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  )
}
