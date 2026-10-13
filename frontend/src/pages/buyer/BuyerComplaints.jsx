import { useEffect, useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/helpers'

const TYPES = ['PRODUCT', 'ORDER', 'PAYMENT', 'ACCOUNT', 'TECHNICAL', 'OTHER']

export default function BuyerComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', complaint_type: 'PRODUCT' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getComplaints()
      setComplaints(res.data.results || res.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createComplaint(form)
      setModal(false)
      setForm({ subject: '', description: '', complaint_type: 'PRODUCT' })
      load()
    } catch (err) {
      const data = err.response?.data
      const msg = data && typeof data === 'object' ? Object.values(data)[0] : 'Failed to submit complaint.'
      setError(Array.isArray(msg) ? msg.join('. ') : String(msg))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Complaints"
        subtitle="Report issues with products, orders or your account"
        action={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> File complaint</button>}
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : complaints.length === 0 ? (
        <div className="card"><EmptyState title="No complaints" message="Great! You haven't had to report anything yet." action={<button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> File a complaint</button>} /></div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{c.subject}</p>
                    <p className="text-xs text-gray-500">{c.complaint_type.replace('_', ' ')} • {formatDateTime(c.created_at)}</p>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-3 text-sm text-gray-600">{c.description}</p>
              {c.admin_response && (
                <div className="mt-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">Admin response</p>
                  {c.admin_response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="File a complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" form="complaint-form" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit'}</button>
          </>
        }
      >
        <form id="complaint-form" onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput label="Type" type="select" value={form.complaint_type} onChange={(e) => setForm({ ...form, complaint_type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </FormInput>
          <FormInput label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required
            sub="Provide as much detail as possible so we can help you quickly." />
        </form>
      </Modal>
    </div>
  )
}