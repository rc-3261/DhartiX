import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

import { api } from '../api'
import { formatDateTime } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  const load = async () => {
    try {
      const [list, count] = await Promise.all([
        api.getNotifications({ page_size: 8 }),
        api.unreadCount(),
      ])
      setNotifications(list.data.results || list.data || [])
      setUnread(count.data.unread_count || 0)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (user) load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    try {
      await api.markAllRead()
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (e) {
      // ignore
    }
  }

  const typeIcon = (type) => {
    const icons = {
      SOIL_MOISTURE: '💧', SENSOR_OFFLINE: '📡', TASK_DUE: '⏰', NEW_ORDER: '🛒',
      ORDER_STATUS: '📦', LOW_STOCK: '📉', PRODUCT_SOLD: '✅', WEATHER: '🌦️', INFO: 'ℹ️',
    }
    return icons[type] || '🔔'
  }

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`flex gap-3 border-b border-gray-50 px-4 py-3 ${n.is_read ? 'opacity-60' : 'bg-primary-50/40'}`}>
                <span className="mt-0.5 text-base">{typeIcon(n.notification_type)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}