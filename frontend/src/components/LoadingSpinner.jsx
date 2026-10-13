import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ label = 'Loading...', full = false }) {
  if (full) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <p className="text-sm">{label}</p>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}