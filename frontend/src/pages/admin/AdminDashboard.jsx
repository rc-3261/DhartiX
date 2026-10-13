import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IndianRupee, Package, ShoppingBag, Sprout, Users, Wifi } from 'lucide-react'

import { api } from '../../api'
import ChartCard from '../../components/ChartCard'
import DashboardCard from '../../components/DashboardCard'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.adminDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'))
  }, [])

  if (error) return <ErrorMessage message={error} />
  if (!data) return <LoadingSpinner full label="Loading admin dashboard..." />

  const t = data.totals
  const c = data.charts

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide overview of DhartiX" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <DashboardCard icon={Users} label="Users" value={t.users} color="blue" sub={`${t.farmers} farmers`} />
        <DashboardCard icon={Sprout} label="Farms" value={t.farms} color="green" />
        <DashboardCard icon={Package} label="Products" value={t.products} color="purple" />
        <DashboardCard icon={ShoppingBag} label="Orders" value={t.orders} color="amber" />
        <DashboardCard icon={IndianRupee} label="Revenue" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(t.revenue || 0)} color="green" />
        <DashboardCard icon={Wifi} label="IoT devices" value={t.active_iot_devices} color="blue" sub="active" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="User growth" subtitle="New users by month">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={c.user_growth}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="count" name="Users" stroke="#2563eb" fill="url(#ug)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by month" subtitle="Orders revenue trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={c.revenue_by_month}>
              <defs>
                <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fill="url(#rv)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by status" subtitle="Distribution of order statuses">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={c.orders_by_status} dataKey="count" nameKey="status" fill="#16a34a" outerRadius={90} label />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sensor device status" subtitle="Online vs offline IoT devices">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={c.sensor_activity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="status" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Devices" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800">Quick actions</p>
          <p className="text-sm text-gray-500">Manage users, products, categories and complaints</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/users" className="btn-secondary">Users</Link>
          <Link to="/admin/products" className="btn-secondary">Products</Link>
          <Link to="/admin/complaints" className="btn-secondary">Complaints</Link>
          <Link to="/admin/system-config" className="btn-primary">System config</Link>
        </div>
      </div>
    </div>
  )
}