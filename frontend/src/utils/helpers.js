import { getTokens } from '../api/client'

export function formatCurrency(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num)
}

export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ')
}

export function statusColor(status, type = 'generic') {
  const map = {
    generic: {
      ACTIVE: 'bg-green-100 text-green-800',
      ONLINE: 'bg-green-100 text-green-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-green-100 text-green-800',
      RESOLVED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800',
      NORMAL: 'bg-green-100 text-green-800',
      GROWING: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-indigo-100 text-indigo-800',
      OPEN: 'bg-amber-100 text-amber-800',
      PENDING: 'bg-amber-100 text-amber-800',
      PLANNED: 'bg-amber-100 text-amber-800',
      IDLE: 'bg-gray-100 text-gray-600',
      DRAFT: 'bg-gray-100 text-gray-600',
      OFFLINE: 'bg-gray-100 text-gray-600',
      CANCELLED: 'bg-red-100 text-red-700',
      FAILED: 'bg-red-100 text-red-700',
      WARNING: 'bg-orange-100 text-orange-800',
      LOW_MOISTURE: 'bg-orange-100 text-orange-800',
      IRRIGATION_RECOMMENDED: 'bg-red-100 text-red-700',
      HIGH_MOISTURE: 'bg-blue-100 text-blue-800',
      READY: 'bg-emerald-100 text-emerald-800',
      HARVESTED: 'bg-teal-100 text-teal-800',
      RESTING: 'bg-gray-100 text-gray-600',
      PREPARING: 'bg-amber-100 text-amber-800',
      UNKNOWN: 'bg-gray-100 text-gray-600',
    },
    priority: {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-amber-100 text-amber-800',
      LOW: 'bg-blue-100 text-blue-800',
    },
    role: {
      FARMER: 'bg-green-100 text-green-800',
      BUYER: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-purple-100 text-purple-800',
    },
  }
  return (map[type] && map[type][status]) || 'bg-gray-100 text-gray-700'
}

export function formatStatusLabel(value) {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function downloadReport(kind, params, format, filename) {
  const query = new URLSearchParams({ ...params, export: format })
  const { access } = getTokens()
  const res = await fetch(`/api/reports/${kind}/?${query.toString()}`, {
    headers: access ? { Authorization: `Bearer ${access}` } : {},
  })
  if (!res.ok) throw new Error('Failed to generate report')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function imageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.startsWith('/media')) return path
  return path
}