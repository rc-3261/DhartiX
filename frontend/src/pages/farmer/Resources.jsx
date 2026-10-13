import { useEffect, useState } from 'react'
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/helpers'

const CATEGORIES = ['SEED', 'FERTILIZER', 'PESTICIDE', 'TOOL', 'EQUIPMENT', 'OTHER']
const blank = { name: '', category: 'OTHER', quantity: '', unit: 'kg', purchase_date: '', expiry_date: '', cost: '', low_stock_threshold: '10', notes: '' }

export default function Resources() {
  const [resources, setResources] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
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
      const res = await api.getResources({ page, search: search || undefined, category: category || undefined, low_stock: lowOnly || undefined, page_size: 10 })
      setResources(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load resources.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, lowOnly])

  const openCreate = () => { setEditing(null); setForm(blank); setModal(true) }

  const openEdit = (r) => {
    setEditing(r)
    setForm({
      name: r.name, category: r.category, quantity: r.quantity, unit: r.unit,
      purchase_date: r.purchase_date || '', expiry_date: r.expiry_date || '', cost: r.cost,
      low_stock_threshold: r.low_stock_threshold, notes: r.notes,
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateResource(editing.id, form)
      else await api.createResource(form)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save resource.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteResource(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete resource.')
    }
  }

  const lowCount = resources.filter((r) => r.is_low_stock).length

  return (
    <div>
      <PageHeader
        title="Resources & Inventory"
        subtitle={`${count} item${count === 1 ? '' : 's'} ${lowCount ? `• ${lowCount} low on stock` : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-48 !pl-9"
                placeholder="Search resources..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input !w-40" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={() => setLowOnly((v) => !v)}
              className={`badge cursor-pointer ${lowOnly ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> Low stock only
            </button>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add item</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : resources.length === 0 ? (
        <div className="card"><EmptyState title="No resources yet" message="Track seeds, fertilizers, tools and equipment you have on hand." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add an item</button>} /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Cost</th>
                <th>Expiry</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className={r.is_low_stock ? 'bg-amber-50/60' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{r.name}</span>
                      {r.is_low_stock && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                    {r.notes && <p className="max-w-[180px] truncate text-xs text-gray-400">{r.notes}</p>}
                  </td>
                  <td><StatusBadge status={r.category} type="generic" /></td>
                  <td>
                    <span className={`font-semibold ${r.is_low_stock ? 'text-amber-700' : 'text-gray-800'}`}>
                      {r.quantity} {r.unit}
                    </span>
                    {r.is_low_stock && <div className="text-[10px] text-amber-600">LOW STOCK</div>}
                  </td>
                  <td className="text-gray-600">{r.low_stock_threshold} {r.unit}</td>
                  <td className="text-gray-600">{formatCurrency(r.cost)}</td>
                  <td className="text-gray-600">{r.expiry_date ? formatDate(r.expiry_date) : '-'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(r)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit resource' : 'Add a new resource'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="resource-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save item'}</button>
          </>
        }>
        <form id="resource-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormInput>
            <FormInput label="Quantity" type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <FormInput label="Unit" type="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="litres">litres</option>
              <option value="pieces">pieces</option>
              <option value="bags">bags</option>
              <option value="units">units</option>
            </FormInput>
            <FormInput label="Cost (₹)" type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            <FormInput label="Low stock alert at" type="number" step="0.01" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
            <FormInput label="Purchase date" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            <FormInput label="Expiry date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete resource?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
      </Modal>
    </div>
  )
}