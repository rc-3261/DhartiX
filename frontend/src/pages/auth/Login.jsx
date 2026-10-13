import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/AuthLayout'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = () => {
    const from = location.state?.from
    if (from) return from
    // default by role handled by AuthContext data
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await login(form)
      const dest = redirectTo()
      navigate(dest || (profile.role === 'FARMER' ? '/farmer' : profile.role === 'BUYER' ? '/buyer' : '/admin'))
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your DhartiX account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <FormInput
          label="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Enter your username"
          autoComplete="username"
          required
        />
        <FormInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div className="mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium text-gray-600">Demo accounts</p>
        <p>Farmer: <code className="text-primary-700">farmer / farmer123</code></p>
        <p>Buyer: <code className="text-primary-700">buyer / buyer123</code></p>
        <p>Admin: <code className="text-primary-700">admin / admin123</code></p>
      </div>
      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-700 hover:underline">
          Register here
        </Link>
      </p>
    </AuthLayout>
  )
}