import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'No data found', message = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-medium text-gray-700">{title}</p>
      {message && <p className="max-w-sm text-sm text-gray-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}