import { AlertTriangle } from 'lucide-react'

export default function ErrorMessage({ message = 'Something went wrong. Please try again.' , onRetry = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-8 text-center">
      <AlertTriangle className="h-7 w-7 text-red-500" />
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 text-sm font-medium text-red-700 underline">
          Try again
        </button>
      )}
    </div>
  )
}