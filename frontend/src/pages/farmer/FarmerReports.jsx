import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { downloadReport, formatCurrency, formatDate } from '../../utils/helpers'

const TABS = [
  { key: 'farm', label: 'Farm overview' },
  { key: 'crop', label: 'Crop report' },
  { key: 'sensor', label: 'Sensor report' },
  { key: 'sales', label: 'Sales report' },
  { key: 'resource', label: 'Resource report' },
]

export default function FarmerReports() {
  const [active, setActive] = useState('farm')
  const [farms, setFarms] = useState([])
  const [params, setParams] = useState({ farm: '', date_from: '', date_to: '', days: '7' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadFarms = async () => {
    try {
      const res = await api.getFarms({ page_size: 100 })
      setFarms(res.data.results || res.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadFarms()
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const run = async (override = {}) => {
    setLoading(true)
    setError('')
    const p = { ...params, ...override }
    setParams(p)
    try {
      let res
      if (active === 'farm') res = await api.farmReport({ farm: p.farm || undefined })
      else if (active === 'crop') res = await api.cropReport({ farm: p.farm || undefined, status: undefined })
      else if (active === 'sensor') res = await api.sensorReport({ farm: p.farm || undefined, days: p.days })
      else if (active === 'sales') res = await api.salesReport({ farm: p.farm || undefined, date_from: p.date_from || undefined, date_to: p.date_to || undefined })
      else res = await api.resourceReport()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate the report.')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format) => {
    try {
      await downloadReport(active, params, format, `dhartix_${active}_report`)
    } catch (err) {
      setError(err.message || 'Failed to export report.')
    }
  }

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Generate reports on your farm operations, crops, sensors, sales and resources"
        action={
          <div className="flex gap-2">
            <button onClick={() => exportReport('csv')} className="btn-secondary"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={() => exportReport('pdf')} className="btn-primary"><Download className="h-4 w-4" /> PDF</button>
          </div>
        } />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setActive(t.key); setData(null) }}
            className={`badge cursor-pointer ${active === t.key ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active !== 'resource' && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <FormInput label="Farm" type="select" value={params.farm} onChange={(e) => setParams({ ...params, farm: e.target.value })}>
            <option value="">All farms</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </FormInput>
          {active === 'sensor' && (
            <FormInput label="Days" type="select" value={params.days} onChange={(e) => setParams({ ...params, days: e.target.value })}>
              {[1, 7, 14, 30].map((d) => <option key={d} value={d}>{d} days</option>)}
            </FormInput>
          )}
          {active === 'sales' && (
            <>
              <FormInput label="From" type="date" value={params.date_from} onChange={(e) => setParams({ ...params, date_from: e.target.value })} />
              <FormInput label="To" type="date" value={params.date_to} onChange={(e) => setParams({ ...params, date_to: e.target.value })} />
            </>
          )}
          <button onClick={() => run()} className="btn-primary" disabled={loading}>{loading ? 'Generating…' : 'Generate'}</button>
        </div>
      )}

      {error && <ErrorMessage message={error} />}
      {loading && <LoadingSpinner full label="Generating report…" />}
      {data && !loading && (
        <div className="card !p-0 overflow-x-auto">
          {active === 'farm' && (
            <table className="table">
              <thead><tr><th>Farm</th><th>Location</th><th>Area</th><th>Soil</th><th>Irrigation</th><th>Fields</th><th>Crops</th><th>Sensors</th></tr></thead>
              <tbody>
                <tr>
                  <td className="font-semibold text-gray-800">{data.farm.name}</td>
                  <td>{data.farm.location || '-'}</td>
                  <td>{data.farm.area}</td>
                  <td>{data.farm.soil_type}</td>
                  <td>{data.farm.irrigation_type}</td>
                  <td><span className="badge bg-primary-50 text-primary-700">{data.summary.total_fields}</span></td>
                  <td><span className="badge bg-primary-50 text-primary-700">{data.summary.total_crops}</span></td>
                  <td><span className="badge bg-primary-50 text-primary-700">{data.summary.total_sensors}</span></td>
                </tr>
              </tbody>
            </table>
          )}
          {active === 'farm' && data.fields?.length > 0 && (
            <div className="border-t border-gray-100 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Fields ({data.fields.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.fields.map((fld) => (
                  <div key={fld.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="font-medium text-gray-800">{fld.name} <span className="text-xs font-normal text-gray-500">({fld.area} • {fld.soil_type})</span></p>
                    <p className="mt-1 text-xs text-gray-500">
                      {fld.crops.length > 0 ? `Crops: ${fld.crops.map((c) => c.name).join(', ')}` : 'No crops'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'crop' && (
            <table className="table">
              <thead><tr><th>Crop</th><th>Field / Farm</th><th>Planted</th><th>Harvest ETA</th><th>Stage</th><th>Qty</th><th>Status</th></tr></thead>
              <tbody>
                {data.crops.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400">No crops in this report.</td></tr>}
                {data.crops.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-gray-800">{c.name}</td>
                    <td className="text-sm text-gray-600">{c.field} <span className="text-gray-400">({c.farm})</span></td>
                    <td className="text-sm text-gray-600">{c.planting_date ? formatDate(c.planting_date) : '-'}</td>
                    <td className="text-sm text-gray-600">{c.expected_harvest_date ? formatDate(c.expected_harvest_date) : '-'}</td>
                    <td className="text-xs text-gray-600">{c.growth_stage.toLowerCase()}</td>
                    <td className="text-gray-600">{c.quantity}</td>
                    <td><StatusBadge status={c.status} type="crop" /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={7} className="text-right text-xs text-gray-500">Total crops: {data.count}</td></tr></tfoot>
            </table>
          )}

          {active === 'sensor' && (
            <table className="table">
              <thead><tr><th>Device</th><th>Type</th><th>Field</th><th>Readings</th><th>Min</th><th>Max</th><th>Avg</th><th>Latest</th></tr></thead>
              <tbody>
                {data.devices.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400">No sensor readings in the selected period.</td></tr>}
                {data.devices.map((d, i) => (
                  <tr key={i}>
                    <td className="font-medium text-gray-800">{d.device}</td>
                    <td className="text-xs text-gray-600">{d.device_type.replace('_', ' ')}</td>
                    <td className="text-sm text-gray-600">{d.field}</td>
                    <td>{d.count}</td>
                    <td>{d.min}</td><td>{d.max}</td><td>{d.avg}</td><td className="font-semibold">{d.latest}{d.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {active === 'sales' && (
            <table className="table">
              <thead><tr><th>Order</th><th>Product</th><th>Qty</th><th>Price</th><th>Revenue</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400">No sales in this period.</td></tr>}
                {data.items.map((i) => (
                  <tr key={i.id}>
                    <td className="text-sm text-gray-600">#{i.order}</td>
                    <td className="font-medium text-gray-800">{i.product}</td>
                    <td>{i.quantity}</td>
                    <td className="text-gray-600">{formatCurrency(i.price)}</td>
                    <td className="font-semibold text-gray-800">{formatCurrency(i.revenue)}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="text-xs text-gray-500">{formatDate(i.date)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="text-gray-800">Summary</td>
                  <td>{data.summary.total_quantity}</td>
                  <td colSpan={2} className="text-gray-800">{formatCurrency(data.summary.total_revenue)}</td>
                  <td colSpan={2} className="text-xs text-gray-500">{data.summary.total_orders} orders</td>
                </tr>
              </tfoot>
            </table>
          )}

          {active === 'resource' && (
            <table className="table">
              <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Cost</th><th>Low stock</th><th>Expiry</th></tr></thead>
              <tbody>
                {data.resources.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400">No resources tracked.</td></tr>}
                {data.resources.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-800">{r.name}</td>
                    <td><StatusBadge status={r.category} type="generic" /></td>
                    <td className="text-gray-600">{r.quantity} {r.unit}</td>
                    <td>{formatCurrency(r.cost)}</td>
                    <td>{r.low_stock ? <StatusBadge status="WARNING" /> : <span className="text-gray-400">No</span>}</td>
                    <td className="text-sm text-gray-500">{r.expiry_date ? formatDate(r.expiry_date) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={3} className="text-gray-800">Total value: {formatCurrency(data.summary.total_cost)}</td>
                  <td colSpan={3} className="text-right text-xs text-gray-500">{data.summary.low_stock_count} low-stock items</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">Select a report type and click Generate.</p>
        </div>
      )}
    </div>
  )
}