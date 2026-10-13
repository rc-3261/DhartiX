import { useState } from 'react'

import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import PageHeader from '../components/PageHeader'

export default function ChangePassword() {
  const { logout } = useAuth()
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (form.new_password !== form.confirm) {
      setError('New passwords do not match.')
      return
    }
    if (form.new_password.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await api.changePassword({ old_password: form.old_password, new_password: form.new_password })
      setSuccess(true)
      setForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      const data = err.response?.data
      if (data?.old_password) setError(data.old_password[0])
      else if (data?.new_password) setError(data.new_password[0])
      else setError(data?.detail || 'Unable to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Change password" subtitle="Update the password used to sign in to your account" />
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Password changed successfully.
            </div>
          )}
          <FormInput
            label="Current password"
            type="password"
            value={form.old_password}
            onChange={(e) => update('old_password', e.target.value)}
            required
          />
          <FormInput
            label="New password"
            type="password"
            value={form.new_password}
            onChange={(e) => update('new_password', e.target.value)}
            required
          />
          <FormInput
            label="Confirm new password"
            type="password"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            required
          />
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}