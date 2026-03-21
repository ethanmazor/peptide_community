import { Camera } from 'lucide-react'

export default function Photos() {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
      <Camera size={40} className="text-[var(--color-text-tertiary)] mb-3" strokeWidth={1.25} />
      <p className="text-[16px] font-medium mb-1">Progress photos</p>
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        Photo upload coming soon.
      </p>
    </div>
  )
}
