import { useEffect, useState } from 'react'
import { Pencil, Search, Trash2 } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { formatDate } from '../../utils/helpers'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.adminUsers({ page, search: search || undefined, role: role || undefined, page_size: 10 })
      setUsers(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role])

  const openEdit = (u) => {
    setEditing(u)
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, phone: u.phone, role: u.role, password: '' })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      await api.adminUpdateUser(editing.id, payload)
      setEditing(null)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to update user.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    try {
      await api.adminDeleteUser(u.id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${count} registered users`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-40 !pl-9"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input !w-40" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
              <option value="">All roles</option>
              <option value="FARMER">Farmers</option>
              <option value="BUYER">Buyers</option>
              <option value="ADMIN">Admins</option>
            </select>
            <button onClick={load} className="btn-primary">Filter</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Verified</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-medium text-gray-800">{u.first_name} {u.last_name} <span className="text-xs font-normal text-gray-400">@{u.username}</span></p>
                  </td>
                  <td><StatusBadge status={u.role} type="role" /></td>
                  <td className="text-gray-600">{u.email}</td>
                  <td className="text-gray-600">{u.phone || '-'}</td>
                  <td className="text-xs text-gray-500">{formatDate(u.date_joined)}</td>
                  <td>{u.is_verified ? <StatusBadge status="ACTIVE" /> : <span className="text-gray-400">No</span>}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-700" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit user"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" form="user-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
          </>
        }>
        <form id="user-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <FormInput label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <FormInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <FormInput label="Role" type="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="FARMER">Farmer</option>
              <option value="BUYER">Buyer</option>
              <option value="ADMIN">Admin</option>
            </FormInput>
            <FormInput label="New password (optional)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user?"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={() => handleDelete(deleteTarget)}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This will also remove their farms, orders and data.
        </p>
      </Modal>
    </div>
  )
}