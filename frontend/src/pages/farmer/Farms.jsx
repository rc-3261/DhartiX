import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Map, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { formatDate } from '../../utils/helpers'

const blank = { name: '', location: '', area: '', area_unit: 'acres', soil_type: 'LOAMY', irrigation_type: 'DRIP' }

const SOILS = ['ALLUVIAL', 'BLACK', 'RED', 'LATERITE', 'SANDY', 'CLAY', 'LOAMY', 'SALINE']
const IRRIGATION = ['DRIP', 'SPRINKLER', 'FLOOD', 'CANAL', 'RAINFED', 'MANUAL']

export default function Farms() {
  const [farms, setFarms] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getFarms({ page, search: search || undefined, page_size: 10 })
      setFarms(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load farms.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const openCreate = () => {
    setEditing(null)
    setForm(blank)
    setModal(true)
  }

  const openEdit = (farm) => {
    setEditing(farm)
    setForm({ ...farm, area: farm.area || '' })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await api.updateFarm(editing.id, form)
      else await api.createFarm(form)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save farm.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteFarm(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete farm.')
    }
  }

  return (
    <div>
      <PageHeader
        title="My Farms"
        subtitle={`${count} farm${count === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-56 !pl-9"
                placeholder="Search farms..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add farm</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : farms.length === 0 ? (
        <div className="card"><EmptyState title="No farms yet" message="Create your first farm to start managing fields and crops." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Create a farm</button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {farms.map((farm) => (
            <div key={farm.id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                    <p className="text-xs text-gray-500">{farm.location || 'No location set'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="font-bold text-gray-800">{farm.field_count}</p>
                  <p className="text-gray-500">Fields</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="font-bold text-gray-800">{farm.crop_count}</p>
                  <p className="text-gray-500">Crops</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="font-bold text-gray-800">{farm.area || 0}{farm.area_unit === 'acres' ? ' ac' : ` ${farm.area_unit}`}</p>
                  <p className="text-gray-500">Area</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-400">Added {formatDate(farm.created_at)}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(farm)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(farm)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit farm' : 'Add a new farm'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="farm-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save farm'}</button>
          </>
        }>
        <form id="farm-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Farm name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Area" type="number" step="0.01" min="0" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <FormInput label="Area unit" type="select" value={form.area_unit} onChange={(e) => setForm({ ...form, area_unit: e.target.value })}>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
              <option value="sqft">Sq ft</option>
            </FormInput>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Soil type" type="select" value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}>
              {SOILS.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput label="Irrigation type" type="select" value={form.irrigation_type} onChange={(e) => setForm({ ...form, irrigation_type: e.target.value })}>
              {IRRIGATION.map((i) => <option key={i} value={i}>{i}</option>)}
            </FormInput>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete farm?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also delete its fields and crops.
        </p>
      </Modal>
    </div>
  )
}