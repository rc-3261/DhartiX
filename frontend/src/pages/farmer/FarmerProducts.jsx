import { useEffect, useState } from 'react'
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, imageUrl } from '../../utils/helpers'

const blank = { category: '', name: '', description: '', price: '', quantity: '', unit: 'kg', location: '', availability: 'true', status: 'PUBLISHED', image: null }

export default function FarmerProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
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
      const res = await api.getProducts({ page, search: search || undefined, mine: 'true', page_size: 10 })
      setProducts(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
      if (!categories.length) {
        const c = await api.getCategories()
        setCategories(c.data.results || c.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products.')
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
    setForm({ ...blank, category: categories[0]?.id ?? '' })
    setModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      category: p.category, name: p.name, description: p.description, price: p.price,
      quantity: p.quantity, unit: p.unit, location: p.location,
      availability: p.availability, status: p.status, image: null,
    })
    setModal(true)
  }

  const buildPayload = () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'image') {
        if (v) fd.append(k, v)
      } else if (v !== '' && v != null) {
        fd.append(k, v)
      }
    })
    return fd
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateProduct(editing.id, buildPayload())
      else await api.createProduct(buildPayload())
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save product.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch {
      setError('Failed to delete product.')
    }
  }

  return (
    <div>
      <PageHeader
        title="My Products"
        subtitle="Items you are selling on the marketplace"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-48 !pl-9"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add product</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="card"><EmptyState title="No products yet" message="List your produce on the marketplace to start selling." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add a product</button>} /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Availability</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {p.image_url
                        ? <img src={imageUrl(p.image_url)} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><Package className="h-5 w-5" /></div>}
                      <div>
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-gray-400">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td><StatusBadge status={p.category_name || p.category} type="generic" /></td>
                  <td className="font-semibold text-gray-800">{formatCurrency(p.price)}<span className="text-xs font-normal text-gray-500">/{p.unit}</span></td>
                  <td className="text-gray-600">{p.quantity} {p.unit}</td>
                  <td><StatusBadge status={p.availability} type="generic" /></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(p)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'List a new product'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="product-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
          </>
        }>
        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormInput>
            <FormInput label="Price (₹ per unit)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <FormInput label="Unit" type="select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value="kg">kg</option>
              <option value="quintal">quintal</option>
              <option value="bag">bag</option>
              <option value="dozen">dozen</option>
              <option value="piece">piece</option>
            </FormInput>
            <FormInput label="Quantity in stock" type="number" step="0.01" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <FormInput label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <FormInput label="Availability" type="select" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
              <option value="true">Available</option>
              <option value="false">Out of stock</option>
            </FormInput>
            <FormInput label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </FormInput>
          </div>
          <FormInput label="Product photo" type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
          {form.image && <p className="text-xs text-gray-500">Selected: {form.image.name}</p>}
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from your listings?</p>
      </Modal>
    </div>
  )
}