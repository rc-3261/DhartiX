import { useEffect, useState } from 'react'
import { Search, Sprout, Pencil, Plus, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'

const SOILS = ['ALLUVIAL', 'BLACK', 'RED', 'LATERITE', 'SANDY', 'CLAY', 'LOAMY', 'SALINE']
const IRRIGATION = ['DRIP', 'SPRINKLER', 'FLOOD', 'CANAL', 'RAINFED', 'MANUAL']
const STATUS = ['ACTIVE', 'IDLE', 'PREPARING', 'RESTING']
const blank = { farm: '', name: '', area: '', area_unit: 'acres', soil_type: 'LOAMY', irrigation_type: 'DRIP', location: '', status: 'ACTIVE' }

export default function Fields() {
  const [fields, setFields] = useState([])
  const [farms, setFarms] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [farmFilter, setFarmFilter] = useState('')
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
      const res = await api.getFields({ page, search: search || undefined, farm: farmFilter || undefined, page_size: 10 })
      setFields(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
      if (!farms.length) {
        const f = await api.getFarms({ page_size: 100 })
        setFarms(f.data.results || f.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load fields.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, farmFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...blank, farm: farmFilter || (farms[0]?.id ?? '') })
    setModal(true)
  }

  const openEdit = (f) => {
    setEditing(f)
    setForm({ id: f.id, farm: f.farm, name: f.name, area: f.area, area_unit: f.area_unit, soil_type: f.soil_type, irrigation_type: f.irrigation_type, location: f.location, status: f.status })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateField(editing.id, form)
      else await api.createField(form)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save field.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteField(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete field.')
    }
  }

  return (
    <div>
      <PageHeader
        title="My Fields"
        subtitle={`${count} field${count === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-48 !pl-9"
                placeholder="Search fields..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input !w-40" value={farmFilter} onChange={(e) => { setFarmFilter(e.target.value); setPage(1) }}>
              <option value="">All farms</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add field</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : fields.length === 0 ? (
        <div className="card"><EmptyState title="No fields yet" message="Add a field under one of your farms to begin growing." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add a field</button>} /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Farm</th>
                <th>Crops</th>
                <th>Area</th>
                <th>Soil / Irrigation</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary-600" />
                      <span className="font-medium text-gray-800">{f.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{f.location}</p>
                  </td>
                  <td className="text-gray-600">{f.farm_name}</td>
                  <td><span className="badge bg-primary-50 text-primary-700">{f.crop_count}</span></td>
                  <td className="text-gray-600">{f.area} {f.area_unit}</td>
                  <td className="text-xs text-gray-600">{f.soil_type}<br />{f.irrigation_type}</td>
                  <td><StatusBadge status={f.status} type="crop" /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(f)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(f)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit field' : 'Add a new field'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="field-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save field'}</button>
          </>
        }>
        <form id="field-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Farm" type="select" value={form.farm} onChange={(e) => setForm({ ...form, farm: e.target.value })} required>
            <option value="">Select a farm</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </FormInput>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Field name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <FormInput label="Area" type="number" step="0.01" min="0" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <FormInput label="Area unit" type="select" value={form.area_unit} onChange={(e) => setForm({ ...form, area_unit: e.target.value })}>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </FormInput>
            <FormInput label="Soil type" type="select" value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}>
              {SOILS.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput label="Irrigation type" type="select" value={form.irrigation_type} onChange={(e) => setForm({ ...form, irrigation_type: e.target.value })}>
              {IRRIGATION.map((i) => <option key={i} value={i}>{i}</option>)}
            </FormInput>
            <FormInput label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete field?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Its crops and sensor history will also be removed.
        </p>
      </Modal>
    </div>
  )
}