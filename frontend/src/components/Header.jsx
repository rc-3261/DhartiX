import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Settings, User } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { classNames } from '../utils/helpers'

export default function Header({ onMenuClick, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/80 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="hidden text-[10px] rounded bg-primary-50 px-2 py-0.5 font-semibold text-primary-700 uppercase tracking-wide sm:inline">
          {user?.role}
        </span>
        <h1 className="truncate text-base font-semibold text-gray-800">{title}</h1>
      </div>

      <NotificationBell />

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-800">{user?.first_name || user?.username}{user?.last_name ? ` ${user.last_name}` : ''}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setMenuOpen(false); navigate('/profile') }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" /> Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); navigate('/change-password') }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" /> Change Password
              </button>
              <button
                onClick={handleLogout}
                className={classNames('flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50')}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}