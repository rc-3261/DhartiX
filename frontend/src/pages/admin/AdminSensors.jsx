import { useEffect, useState } from 'react'
import { Activity, CloudRain, Gauge, Thermometer, WifiOff } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'

const TYPE_ICONS = { SOIL_MOISTURE: CloudRain, TEMPERATURE: Thermometer, HUMIDITY: Activity }

export default function AdminSensors() {
  const [sensors, setSensors] = useState([])
  const [deviceType, setDeviceType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getSensors({ page_size: 100, device_type: deviceType || undefined })
      setSensors(res.data.results || res.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sensors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceType])

  const markOffline = async (s) => {
    try {
      await api.markSensorOffline(s.id)
      load()
    } catch {
      setError('Failed to update sensor.')
    }
  }

  return (
    <div>
      <PageHeader
        title="IoT Sensor Fleet"
        subtitle={`${sensors.length} device${sensors.length === 1 ? '' : 's'} across all farms`}
        action={
          <select className="input !w-44" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
            <option value="">All types</option>
            <option value="SOIL_MOISTURE">Soil moisture</option>
            <option value="TEMPERATURE">Temperature</option>
            <option value="HUMIDITY">Humidity</option>
          </select>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : sensors.length === 0 ? (
        <div className="card"><EmptyState title="No sensors registered" message="Farmers haven't registered any IoT devices yet." /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Type</th>
                <th>Farmer</th>
                <th>Farm / Field</th>
                <th>Battery</th>
                <th>Last reading</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((s) => {
                const Icon = TYPE_ICONS[s.device_type] || Gauge
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary-600" />
                        <div>
                          <p className="font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.device_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-gray-600">{s.device_type.replace('_', ' ')}</td>
                    <td className="text-gray-600">{s.farmer_username || s.farmer}</td>
                    <td className="text-xs text-gray-600">{s.farm_name} / {s.field_name}</td>
                    <td className="text-gray-600">🔋 {s.battery_level}%</td>
                    <td className="text-xs text-gray-500">
                      {s.latest_reading ? `${s.latest_reading.value}${s.latest_reading.unit}` : '—'}
                    </td>
                    <td><StatusBadge status={s.status} type="sensor" /></td>
                    <td>
                      <div className="flex justify-end">
                        {s.status === 'ONLINE' && (
                          <button onClick={() => markOffline(s)} className="btn-secondary !px-3 !py-1 !text-xs"><WifiOff className="h-3.5 w-3.5" /> Offline</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}