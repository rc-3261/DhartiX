import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

import { api } from '../../api'
import AuthLayout from '../../components/AuthLayout'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.forgotPassword(email)
      setSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Please enter a valid email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Forgot password" subtitle="We'll send you a link to reset your password">
      {success ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="text-sm text-green-800">
              <p className="font-medium">{success.detail}</p>
              {success.reset_token && (
                <div className="mt-2 rounded-lg bg-white p-3 text-xs text-gray-600">
                  <p className="mb-1 font-semibold text-gray-700">Development reset token</p>
                  <p>Token: <code className="break-all text-green-700">{success.reset_token}</code></p>
                  <p className="mt-1">UID: <code className="break-all text-green-700">{success.reset_uid}</code></p>
                  <button
                    onClick={() => navigate(`/reset-password?token=${success.reset_token}&uid=${success.reset_uid}`)}
                    className="btn-primary mt-3 w-full"
                  >
                    Go to reset page
                  </button>
                </div>
              )}
            </div>
          </div>
          <Link to="/login" className="btn-secondary w-full">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <FormInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            sub="An email is sent to this address with password reset instructions."
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
      )}
      <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to login
      </Link>
    </AuthLayout>
  )
}