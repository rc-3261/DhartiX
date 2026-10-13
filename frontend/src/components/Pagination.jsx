import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, setPage, count, pageSize = 10 }) {
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize))
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} ({count} results)
      </p>
      <div className="flex gap-1">
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          className="btn-secondary !px-2 !py-1"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}