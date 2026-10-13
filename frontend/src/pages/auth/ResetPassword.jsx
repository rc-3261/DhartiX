import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

import { api } from '../../api'
import AuthLayout from '../../components/AuthLayout'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const uid = searchParams.get('uid') || ''
  const [form, setForm] = useState({ token, uid, new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.new_password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword({ token: form.token, uid: form.uid, new_password: form.new_password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to reset password. The link may be invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account">
      {success ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <p className="text-sm text-green-800">Your password has been reset successfully. You can now sign in.</p>
          </div>
          <Link to="/login" className="btn-primary w-full">Go to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput
            label="New password"
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
          />
          <FormInput
            label="Confirm new password"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}