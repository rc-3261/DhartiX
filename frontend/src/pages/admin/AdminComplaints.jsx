import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/helpers'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [active, setActive] = useState(null)
  const [response, setResponse] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getComplaints({ status: statusFilter || undefined })
      setComplaints(res.data.results || res.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const openComplaint = (c) => {
    setActive(c)
    setResponse(c.admin_response || '')
  }

  const submitResponse = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.updateComplaint(active.id, { admin_response: response, status: document.getElementById('cs').value })
      setActive(null)
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update complaint.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle={`${complaints.length} complaint${complaints.length === 1 ? '' : 's'} received`}
        action={
          <select className="input !w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : complaints.length === 0 ? (
        <div className="card"><EmptyState title="No complaints" message="Everything is running smoothly!" /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>User</th>
                <th>Type</th>
                <th>Submitted</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="max-w-[300px]">
                    <p className="font-medium text-gray-800">{c.subject}</p>
                    <p className="truncate text-xs text-gray-400">{c.description}</p>
                  </td>
                  <td className="text-gray-600">{c.user_name}</td>
                  <td className="text-xs text-gray-600">{c.complaint_type.replace('_', ' ')}</td>
                  <td className="text-xs text-gray-500">{formatDateTime(c.created_at)}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    <div className="flex justify-end">
                      <button onClick={() => openComplaint(c)} className="btn-secondary !px-3 !py-1 !text-xs">Respond</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title="Handle complaint"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setActive(null)}>Cancel</button>
            <button className="btn-primary" form="cresponse-form" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save response'}</button>
          </>
        }>
        {active && (
          <form id="cresponse-form" onSubmit={submitResponse} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-gray-800">
                <MessageSquare className="h-4 w-4 text-primary-600" />
                <p className="font-semibold">{active.subject}</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">by {c.user_name} • {c.complaint_type.replace('_', ' ')}</p>
              <p className="mt-2 text-sm text-gray-600">{active.description}</p>
            </div>
            <FormInput label="Status" type="select" defaultValue={active.status} id="cs">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormInput>
            <FormInput label="Response" type="textarea" value={response} onChange={(e) => setResponse(e.target.value)} required />
          </form>
        )}
      </Modal>
    </div>
  )
}