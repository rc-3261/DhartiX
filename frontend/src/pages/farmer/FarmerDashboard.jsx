import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Droplets, FileBarChart2, Gauge, Home, IndianRupee, Map, Package, ShoppingBag, Sprout, Thermometer,
} from 'lucide-react'

import { api } from '../../api'
import ChartCard from '../../components/ChartCard'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/helpers'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function FarmerDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [range, setRange] = useState('daily')

  useEffect(() => {
    api.farmerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'))
  }, [])

  if (error) return <ErrorMessage message={error} />
  if (!data) return <LoadingSpinner full label="Loading farmer dashboard..." />

  const t = data.totals
  const salesData = data.sales_charts[range] || []
  const sensorChart = data.sensor_chart || []
  const cropByStatus = Object.entries(
    (data.crop_performance || []).reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <PageHeader
        title="Farmer Dashboard"
        subtitle="An overview of everything happening across your farms"
        action={
          <div className="flex gap-2">
            <Link to="/farmer/farms" className="btn-secondary">Manage farms</Link>
            <Link to="/farmer/ai-assistant" className="btn-primary">Ask AI Assistant</Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardCard icon={Map} label="Farms" value={t.farms} color="green" sub={`${t.fields} fields`} />
        <DashboardCard icon={Sprout} label="Active Crops" value={t.active_crops} color="green" sub={`${t.crops ?? 0} total`} />
        <DashboardCard icon={Gauge} label="Sensors" value={t.sensors} color="blue" sub={`${t.active_sensors} online`} />
        <DashboardCard icon={Home} label="Pending Tasks" value={t.pending_tasks} color="amber" />
        <DashboardCard icon={Package} label="Products Listed" value={t.products_listed} color="purple" />
        <DashboardCard icon={IndianRupee} label="Revenue" value={formatCurrency(t.revenue)} color="green" sub={`${t.sales} sales`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Sensor cards */}
        <div className="card">
          <h3 className="mb-3 font-semibold text-gray-800">Live Field Conditions</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Droplets className="h-4 w-4" /><span className="text-xs font-semibold">Soil Moisture</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{data.sensor_stats.soil_moisture.latest ?? '-'}%</p>
              <p className="text-xs text-gray-500">avg {data.sensor_stats.soil_moisture.avg ?? '-'}%</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <Thermometer className="h-4 w-4" /><span className="text-xs font-semibold">Temperature</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{data.sensor_stats.temperature.latest ?? '-'}°C</p>
              <p className="text-xs text-gray-500">avg {data.sensor_stats.temperature.avg ?? '-'}°C</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-700">
                <FileBarChart2 className="h-4 w-4" /><span className="text-xs font-semibold">Humidity</span>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{data.sensor_stats.humidity.latest ?? '-'}%</p>
              <p className="text-xs text-gray-500">avg {data.sensor_stats.humidity.avg ?? '-'}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold text-gray-800">Sales Analytics</h3>
          <div className="mb-3 flex gap-2">
            {['daily', 'weekly', 'monthly'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`badge cursor-pointer capitalize ${range === r ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Sensor trends (7 days)" subtitle="Soil moisture, temperature & humidity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="soil_moisture" name="Moisture %" stroke="#2563eb" />
              <Line type="monotone" dataKey="temperature" name="Temp °C" stroke="#ea580c" />
              <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#16a34a" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Crop performance" subtitle="Crops by status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cropByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis allowDecimals={false} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" name="Crops" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Pending Tasks</h3>
            <Link to="/farmer/tasks" className="text-xs font-medium text-primary-700 hover:underline">View all</Link>
          </div>
          {(data.pending_tasks || []).length === 0 && <EmptyState message="No pending tasks. Great!" />}
          <div className="space-y-2">
            {(data.pending_tasks || []).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.task_type.replace('_', ' ')} • due {formatDate(task.due_date)}</p>
                </div>
                <StatusBadge status={task.priority} type="priority" />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Sales</h3>
            <Link to="/farmer/orders" className="text-xs font-medium text-primary-700 hover:underline">View all</Link>
          </div>
          {(data.recent_sales || []).length === 0 && <EmptyState message="No sales yet. List products on the marketplace!" />}
          <div className="space-y-2">
            {(data.recent_sales || []).map((s) => (
              <div key={`${s.order_id}-${s.product}`} className="flex items-center justify-between rounded-lg border border-gray-50 bg-gray-50/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.product} × {s.quantity}</p>
                    <p className="text-xs text-gray-500">Order #{s.order_id} • {formatDate(s.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(s.revenue)}</p>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}