import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { formatDate } from '../../utils/helpers'

const STAGES = ['PREPARATION', 'GERMINATION', 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY', 'HARVESTED']
const STATUS = ['PLANNED', 'GROWING', 'READY', 'HARVESTED']
const blank = { field: '', name: '', variety: '', planting_date: '', expected_harvest_date: '', current_growth_stage: 'PREPARATION', quantity: '', quantity_unit: 'kg', status: 'PLANNED', notes: '' }

export default function Crops() {
  const [crops, setCrops] = useState([])
  const [fields, setFields] = useState([])
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
      const res = await api.getCrops({ page, search: search || undefined, page_size: 10 })
      setCrops(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
      if (!fields.length) {
        const f = await api.getFields({ page_size: 100 })
        setFields(f.data.results || f.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load crops.')
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
    setForm({ ...blank, field: fields[0]?.id ?? '' })
    setModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      field: c.field, name: c.name, variety: c.variety, planting_date: c.planting_date || '',
      expected_harvest_date: c.expected_harvest_date || '', current_growth_stage: c.current_growth_stage,
      quantity: c.quantity, quantity_unit: c.quantity_unit, status: c.status, notes: c.notes,
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateCrop(editing.id, form)
      else await api.createCrop(form)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save crop.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteCrop(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete crop.')
    }
  }

  return (
    <div>
      <PageHeader
        title="My Crops"
        subtitle={`${count} crop${count === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-56 !pl-9"
                placeholder="Search crops..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add crop</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : crops.length === 0 ? (
        <div className="card"><EmptyState title="No crops yet" message="Add a crop to a field to start tracking its growth." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add a crop</button>} /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Crop</th>
                <th>Field / Farm</th>
                <th>Planted</th>
                <th>Harvest ETA</th>
                <th>Est. yield</th>
                <th>Stage</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {crops.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary-600" />
                      <span className="font-medium text-gray-800">{c.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{c.variety}</p>
                  </td>
                  <td>
                    <p className="text-gray-700">{c.field_name}</p>
                    <p className="text-xs text-gray-400">{c.farm_name}</p>
                  </td>
                  <td className="text-gray-600">{c.planting_date ? formatDate(c.planting_date) : '-'}</td>
                  <td className="text-gray-600">{c.expected_harvest_date ? formatDate(c.expected_harvest_date) : '-'}</td>
                  <td className="text-gray-600">{c.quantity} {c.quantity_unit}</td>
                  <td className="text-xs text-gray-600">{c.current_growth_stage.toLowerCase()}</td>
                  <td><StatusBadge status={c.status} type="crop" /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit crop' : 'Add a new crop'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="crop-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save crop'}</button>
          </>
        }>
        <form id="crop-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Field" type="select" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} required>
            <option value="">Select a field</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.farm_name})</option>)}
          </FormInput>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Crop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Variety" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
            <FormInput label="Planting date" type="date" value={form.planting_date} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} />
            <FormInput label="Expected harvest" type="date" value={form.expected_harvest_date} onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })} />
            <FormInput label="Expected yield" type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <FormInput label="Yield unit" type="select" value={form.quantity_unit} onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="tonnes">tonnes</option>
              <option value="quintals">quintals</option>
              <option value="pieces">pieces</option>
            </FormInput>
            <FormInput label="Growth stage" type="select" value={form.current_growth_stage} onChange={(e) => setForm({ ...form, current_growth_stage: e.target.value })}>
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
          </div>
          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete crop?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}