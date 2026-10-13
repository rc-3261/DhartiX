import { useEffect, useState } from 'react'
import { Package, Pencil, Search, Trash2 } from 'lucide-react'

import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
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

export default function AdminProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getProducts({ page, search: search || undefined, page_size: 10 })
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

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      category: p.category, name: p.name, description: p.description, price: p.price,
      quantity: p.quantity, unit: p.unit, location: p.location,
      availability: p.availability ? 'true' : 'false', status: p.status, image: null,
    })
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
      await api.updateProduct(editing.id, buildPayload())
      setEditing(null)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save product.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p) => {
    try {
      await api.deleteProduct(p.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete product.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${count} products across the marketplace`}
        action={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="input !w-56 !pl-9"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
        }
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="card"><EmptyState title="No products yet" message="Farmers haven't listed any products yet." /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Farmer</th>
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
                      <span className="font-medium text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category_name}</td>
                  <td className="text-gray-600">{p.farmer_name}</td>
                  <td className="font-semibold text-gray-800">{formatCurrency(p.price)}</td>
                  <td className="text-gray-600">{p.quantity} {p.unit}</td>
                  <td>{p.availability ? <StatusBadge status="ACTIVE" /> : <StatusBadge status="OFFLINE" />}</td>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit product${user?.username ? '' : ''}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="aprod-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </>
        }>
        <form id="aprod-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormInput label="Category" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormInput>
            <FormInput label="Price (₹/unit)" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
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
          <FormInput label="Replace photo (optional)" type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(deleteTarget)}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">Are you sure you want to remove <strong>{deleteTarget?.name}</strong>?</p>
      </Modal>
    </div>
  )
}