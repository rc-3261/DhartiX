import { useEffect, useState } from 'react'
import { Cpu, Database, RefreshCw, Settings } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'

function ConfigRow({ label, value, ok = true }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex items-center gap-2 text-sm">
        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{String(value)}</code>
        <StatusBadge status={ok ? 'ACTIVE' : 'OFFLINE'} />
      </div>
    </div>
  )
}

export default function AdminSystemConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.systemConfig()
      setConfig(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load system config.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) return <LoadingSpinner full />
  if (!config) return <ErrorMessage message={error} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="System Configuration"
        subtitle="Status of key service integrations"
        action={
          <button onClick={refresh} className="btn-secondary" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card !p-0">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <Database className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-800">Database</h3>
          </div>
          <ConfigRow label="Engine" value={config.database} ok={config.database === 'mysql'} />
          <div className="border-t border-gray-50"><ConfigRow label="Debug mode" value={config.debug ? 'ON' : 'OFF'} ok={!config.debug} /></div>
        </div>

        <div className="card !p-0">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <Cpu className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-800">AI & Weather services</h3>
          </div>
          <ConfigRow label="AI API key" value={config.ai_configured ? 'Configured' : 'Not configured'} ok={config.ai_configured} />
          <div className="border-t border-gray-50"><ConfigRow label="AI model" value={config.ai_model} /></div>
          <div className="border-t border-gray-50">
            <ConfigRow label="Weather API key" value={config.weather_configured ? 'Configured' : 'Not configured'} ok={config.weather_configured} />
          </div>
        </div>

        <div className="card !p-0">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <Settings className="h-4 w-4 text-primary-600" />
            <h3 className="font-semibold text-gray-800">Security & integrations</h3>
          </div>
          <ConfigRow label="IoT device token" value={config.iot_token_configured ? 'Set' : 'Not set'} ok={config.iot_token_configured} />
          <div className="border-t border-gray-50">
            <ConfigRow label="CORS origins" value={config.cors_origins?.join(', ') || 'None'} />
          </div>
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold text-gray-800">Notes</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• All non-secret settings are read from the environment variable <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">DB_ENGINE</code>, <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">AI_API_KEY</code>, <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">WEATHER_API_KEY</code> and <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">IOT_DEVICE_TOKEN</code> set in the backend's <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">.env</code> file.</li>
            <li>• When AI and weather API keys are missing, the app automatically falls back to built-in rule-based advisors and demo weather data, so all features keep working.</li>
            <li>• Sensor data is ingested through the public endpoint <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">POST /api/sensors/iot/reading/</code> using the shared device token.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}