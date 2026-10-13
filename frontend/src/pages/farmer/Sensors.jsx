import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudRain, Gauge, Activity, Plus, Thermometer, Trash2, Wifi, WifiOff } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'

const TYPE_ICONS = { SOIL_MOISTURE: CloudRain, TEMPERATURE: Thermometer, HUMIDITY: Activity }

export default function Sensors() {
  const [sensors, setSensors] = useState([])
  const [fields, setFields] = useState([])
  const [deviceType, setDeviceType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ field: '', name: '', device_type: 'SOIL_MOISTURE', location: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getSensors({ page_size: 100, device_type: deviceType || undefined })
      setSensors(res.data.results || res.data || [])
      if (!fields.length) {
        const f = await api.getFields({ page_size: 100 })
        setFields(f.data.results || f.data || [])
      }
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

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createSensor(form)
      setModal(false)
      setForm({ field: '', name: '', device_type: 'SOIL_MOISTURE', location: '' })
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save sensor.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteSensor(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete sensor.')
    }
  }

  const handleMarkOffline = async (s) => {
    try {
      await api.markSensorOffline(s.id)
      load()
    } catch {
      setError('Failed to update sensor status.')
    }
  }

  return (
    <div>
      <PageHeader
        title="IoT Sensors"
        subtitle={`${sensors.length} device${sensors.length === 1 ? '' : 's'} registered`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select className="input !w-44" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
              <option value="">All types</option>
              <option value="SOIL_MOISTURE">Soil moisture</option>
              <option value="TEMPERATURE">Temperature</option>
              <option value="HUMIDITY">Humidity</option>
            </select>
            <button onClick={() => { setModal(true); setForm({ ...form, field: fields[0]?.id ?? '' }) }} className="btn-primary"><Plus className="h-4 w-4" /> Register device</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : sensors.length === 0 ? (
        <div className="card"><EmptyState title="No sensors yet" message="Register an IoT device to start collecting field data." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sensors.map((s) => {
            const Icon = TYPE_ICONS[s.device_type] || Gauge
            const latest = s.latest_reading
            return (
              <div key={s.id} className="card flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.device_type.replace('_', ' ')} • {s.device_id}</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} type="sensor" />
                </div>
                <Link to={`/farmer/sensors/${s.id}`} className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">Latest reading</p>
                  {latest ? (
                    <p className="text-xl font-bold text-gray-900">{latest.value}{latest.unit} <span className="text-xs font-normal text-gray-500">{latest.reading_type.replace('_', ' ').toLowerCase()}</span></p>
                  ) : (
                    <p className="text-sm text-gray-400">No readings yet</p>
                  )}
                </Link>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{s.farm_name} · {s.field_name}</span>
                  <span>🔋 {s.battery_level}%</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex gap-1">
                    <Link to={`/farmer/sensors/${s.id}`} className="btn-secondary !px-3 !py-1 !text-xs">View</Link>
                    {s.status === 'ONLINE' && (
                      <button onClick={() => handleMarkOffline(s)} title="Mark offline" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><WifiOff className="h-4 w-4" /></button>
                    )}
                  </div>
                  <button onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <Wifi className="h-4 w-4 shrink-0" />
        <p>Devices push data to <code className="bg-white px-1 py-0.5 rounded">POST /api/sensors/iot/reading/</code> using the shared device token header <code className="bg-white px-1 py-0.5 rounded">X-Device-Token</code>.</p>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Register IoT device"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="sensor-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Register device'}</button>
          </>
        }>
        <form id="sensor-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Field" type="select" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} required>
            <option value="">Select a field</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.farm_name})</option>)}
          </FormInput>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Device name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Device type" type="select" value={form.device_type} onChange={(e) => setForm({ ...form, device_type: e.target.value })}>
              <option value="SOIL_MOISTURE">Soil moisture</option>
              <option value="TEMPERATURE">Temperature</option>
              <option value="HUMIDITY">Humidity</option>
            </FormInput>
          </div>
          <FormInput label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete sensor?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong> along with its reading history?
        </p>
      </Modal>
    </div>
  )
}