import { NavLink } from 'react-router-dom'
import { classNames } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import {
  BrainCircuit, ClipboardList, Cloud, Droplets, FileBarChart2, Gauge, Home, LayoutDashboard,
  Leaf, Map, Package, Send, ShoppingBag, ShoppingCart, Sprout, Store, Tractor, Users, Warehouse, X,
} from 'lucide-react'

export const getNavItems = (role) => {
  const farmer = [
    { href: '/farmer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { href: '/farmer/farms', label: 'Farms', icon: Map },
    { href: '/farmer/fields', label: 'Fields', icon: Home },
    { href: '/farmer/crops', label: 'Crops', icon: Sprout },
    { href: '/farmer/sensors', label: 'IoT Sensors', icon: Gauge },
    { href: '/farmer/ai-assistant', label: 'AI Assistant', icon: BrainCircuit },
    { href: '/farmer/crop-recommendation', label: 'Crop Suggestions', icon: Leaf },
    { href: '/farmer/irrigation', label: 'Irrigation', icon: Droplets },
    { href: '/farmer/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/farmer/resources', label: 'Resources', icon: Warehouse },
    { href: '/farmer/products', label: 'Products', icon: Package },
    { href: '/farmer/orders', label: 'Orders & Sales', icon: ShoppingBag },
    { href: '/farmer/reports', label: 'Reports', icon: FileBarChart2 },
    { href: '/farmer/weather', label: 'Weather', icon: Cloud },
  ]
  const buyer = [
    { href: '/buyer', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { href: '/buyer/marketplace', label: 'Marketplace', icon: Store },
    { href: '/buyer/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/buyer/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/buyer/complaints', label: 'Complaints', icon: Send },
  ]
  const admin = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: Store },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/complaints', label: 'Complaints', icon: Send },
    { href: '/admin/sensors', label: 'IoT Devices', icon: Gauge },
    { href: '/admin/system-config', label: 'System Config', icon: Tractor },
  ]
  if (role === 'FARMER') return farmer
  if (role === 'BUYER') return buyer
  return admin
}

export function Sidebar({ open, onClose }) {
  const { role, user } = useAuth()
  const items = getNavItems(role)

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary-900 text-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <img src="/leaf.svg" alt="DhartiX" className="h-8 w-8 rounded-lg" />
            <div>
              <p className="text-lg font-bold leading-none">DhartiX</p>
              <p className="text-[10px] text-primary-200">AgroBusiness 4.0</p>
            </div>
          </div>
          <button className="rounded-lg p-1 text-primary-200 lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-5 mb-4 rounded-lg bg-primary-800/50 px-4 py-3">
          <p className="truncate text-sm font-semibold">{user?.username}</p>
          <p className="text-[11px] text-primary-200">{role}</p>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-700 text-white' : 'text-primary-100 hover:bg-primary-800 hover:text-white'
                )
              }
            >
              <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-primary-800 px-5 py-3 text-[11px] text-primary-300">
          AgroBusiness 4.0 • Farmer-focused SaaS
        </div>
      </aside>
    </>
  )
}