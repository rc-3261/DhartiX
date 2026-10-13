import { useEffect, useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'

const blank = { name: '', description: '' }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
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
      const res = await api.getCategories()
      setCategories(res.data.results || res.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(blank)
    setModal(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, description: c.description })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await api.updateCategory(editing.id, form)
      else await api.createCategory(form)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save category.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} product categories`}
        action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add category</button>}
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <div className="card"><EmptyState title="No categories yet" message="Create categories so farmers can organize their products." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add a category</button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <FolderTree className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <p className="text-xs text-gray-400">/{c.slug}</p>
                  </div>
                </div>
                <span className="badge bg-primary-50 text-primary-700">{c.product_count} products</span>
              </div>
              <p className="mt-3 flex-1 text-sm text-gray-600">{c.description || 'No description'}</p>
              <div className="mt-3 flex justify-end gap-1 border-t border-gray-50 pt-3">
                <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit category' : 'Add a category'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="category-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save category'}</button>
          </>
        }>
        <form id="category-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete category?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Products in it will keep their data but lose the category.
        </p>
      </Modal>
    </div>
  )
}