import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Plus, Search } from 'lucide-react'

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

const TYPES = ['IRRIGATION', 'FERTILIZER', 'PEST_INSPECTION', 'CROP_INSPECTION', 'HARVESTING', 'EQUIPMENT_MAINTENANCE', 'OTHER']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const blank = { title: '', description: '', task_type: 'OTHER', due_date: '', priority: 'MEDIUM', status: 'PENDING', farm: '', field: '', crop: '' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [farms, setFarms] = useState([])
  const [fields, setFields] = useState([])
  const [crops, setCrops] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const loadRefs = async () => {
    if (!farms.length) {
      const f = await api.getFarms({ page_size: 100 })
      setFarms(f.data.results || f.data || [])
    }
    if (!fields.length) {
      const f = await api.getFields({ page_size: 100 })
      setFields(f.data.results || f.data || [])
    }
    if (!crops.length) {
      const c = await api.getCrops({ page_size: 100 })
      setCrops(c.data.results || c.data || [])
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getTasks({ page, search: search || undefined, status: statusFilter || undefined, page_size: 10 })
      setTasks(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
      loadRefs()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...blank, farm: farms[0]?.id ?? '' })
    setModal(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({
      title: t.title, description: t.description, task_type: t.task_type, due_date: t.due_date || '',
      priority: t.priority, status: t.status, farm: t.farm ?? '', field: t.field ?? '', crop: t.crop ?? '',
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
    try {
      if (editing) await api.updateTask(editing.id, payload)
      else await api.createTask(payload)
      setModal(false)
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to save task.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  const toggleComplete = async (t) => {
    try {
      await api.updateTask(t.id, { status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' })
      load()
    } catch {
      setError('Failed to update task.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Tasks & Schedules"
        subtitle={`${count} task${count === 1 ? '' : 's'}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-48 !pl-9"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input !w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add task</button>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <div className="card"><EmptyState title="No tasks yet" message="Plan irrigations, inspections, harvests and more." action={<button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Add a task</button>} /></div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className={`card flex items-center justify-between gap-3 ${t.status === 'COMPLETED' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleComplete(t)} className="mt-0.5 text-gray-300 hover:text-primary-600" aria-label={`Mark ${t.status === 'COMPLETED' ? 'pending' : 'complete'}`}>
                  {t.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5" />}
                </button>
                <div>
                  <p className={`font-medium text-gray-800 ${t.status === 'COMPLETED' ? 'line-through' : ''}`}>{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {t.task_type.replace('_', ' ')} {t.meta ? `• ${t.meta}` : ''}
                    {t.due_date && <span className="ml-1">• due {formatDate(t.due_date)}</span>}
                  </p>
                  {t.description && <p className="mt-1 line-clamp-2 text-xs text-gray-400">{t.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <StatusBadge status={t.priority} type="priority" />
                  <div className="mt-1"><StatusBadge status={t.status} /></div>
                </div>
                <button onClick={() => openEdit(t)} className="btn-secondary !px-3 !py-1 !text-xs">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit task' : 'Add a new task'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="task-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save task'}</button>
          </>
        }>
        <form id="task-form" onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Task type" type="select" value={form.task_type} onChange={(e) => setForm({ ...form, task_type: e.target.value })}>
              {TYPES.map((tp) => <option key={tp} value={tp}>{tp.replace('_', ' ')}</option>)}
            </FormInput>
            <FormInput label="Priority" type="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </FormInput>
            <FormInput label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormInput label="Farm (optional)" type="select" value={form.farm} onChange={(e) => setForm({ ...form, farm: e.target.value })}>
              <option value="">None</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </FormInput>
            <FormInput label="Field (optional)" type="select" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}>
              <option value="">None</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </FormInput>
            <FormInput label="Crop (optional)" type="select" value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
              <option value="">None</option>
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormInput>
          </div>
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>
    </div>
  )
}