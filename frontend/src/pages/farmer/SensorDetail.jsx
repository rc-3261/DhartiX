import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, Thermometer, CloudRain, WifiOff } from 'lucide-react'

import { api } from '../../api'
import ChartCard from '../../components/ChartCard'
import DashboardCard from '../../components/DashboardCard'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatDate, formatDateTime } from '../../utils/helpers'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const TYPE_ICONS = { SOIL_MOISTURE: CloudRain, TEMPERATURE: Thermometer, HUMIDITY: Activity }

export default function SensorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sensor, setSensor] = useState(null)
  const [history, setHistory] = useState([])
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, h] = await Promise.all([
        api.getSensor(id),
        api.getSensorHistory(id, { days }),
      ])
      setSensor(s.data)
      setHistory(h.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sensor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, days])

  if (loading) return <LoadingSpinner full />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const Icon = TYPE_ICONS[sensor.device_type] || Activity
  const t = sensor.today_stats || {}
  const chartData = history.map((r) => ({ t: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: r.value }))

  return (
    <div>
      <PageHeader
        title={sensor.name}
        subtitle={`${sensor.device_type.replace('_', ' ')} • ${sensor.device_id} • ${sensor.farm_name} / ${sensor.field_name}`}
        action={
          <div className="flex gap-2">
            <Link to="/farmer/sensors" className="btn-secondary"><ArrowLeft className="h-4 w-4" /> Back</Link>
            {sensor.status === 'ONLINE' && (
              <button onClick={async () => { await api.markSensorOffline(sensor.id); load() }} className="btn-secondary"><WifiOff className="h-4 w-4" /> Mark offline</button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Status</p>
          <StatusBadge status={sensor.status} type="sensor" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Battery</p>
          <p className="font-semibold text-gray-800">🔋 {sensor.battery_level}%</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Last reading</p>
          <p className="font-semibold text-gray-800">{sensor.last_reading_at ? formatDateTime(sensor.last_reading_at) : 'Never'}</p>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Location</p>
          <p className="font-semibold text-gray-800">{sensor.location || '-'}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard icon={Icon} label="Current (24h)" value={t.latest != null ? `${t.latest}` : '-'} color="blue" />
        <DashboardCard icon={Icon} label="24h average" value={t.avg != null ? `${t.avg}` : '-'} color="green" />
        <DashboardCard icon={Icon} label="24h max" value={t.max != null ? `${t.max}` : '-'} color="amber" />
        <DashboardCard icon={Icon} label="Readings (24h)" value={t.count ?? 0} color="purple" />
      </div>

      <div className="mt-6">
        <ChartCard
          title="Reading history"
          subtitle={`Last ${days} days`}
          action={
            <div className="flex gap-1">
              {[1, 7, 30].map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`badge cursor-pointer ${days === d ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {d}d
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="t" fontSize={10} minTickGap={30} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="value" name={sensor.device_type} stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent readings</h3>
          <span className="text-xs text-gray-400">Showing latest 20</span>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history
                .filter((r, i) => i < 20)
                .map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-800">{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td><StatusBadge status={r.reading_type} type="sensor" /></td>
                    <td className="font-semibold text-gray-900">{r.value}{r.unit}</td>
                    <td className="text-gray-500">{formatDate(r.timestamp)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}