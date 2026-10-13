import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import Header from './Header'
import { Sidebar } from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { role } = useAuth()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const titles = {
    FARMER: 'Farmer Dashboard',
    BUYER: 'Buyer Dashboard',
    ADMIN: 'Admin Dashboard',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={titles[role] || 'Dashboard'} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}