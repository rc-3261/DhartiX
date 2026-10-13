import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/AuthLayout'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    role: 'BUYER',
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    farm_name: '',
    location: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const profile = await register(form)
      navigate(profile.role === 'FARMER' ? '/farmer' : '/buyer')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first.join('. ') : String(first))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join DhartiX as a farmer or buyer">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => update('role', 'FARMER')}
            className={`rounded-lg border p-3 text-center transition ${form.role === 'FARMER' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            <p className="font-semibold">Farmer</p>
            <p className="text-xs">Sell produce, manage farms</p>
          </button>
          <button
            type="button"
            onClick={() => update('role', 'BUYER')}
            className={`rounded-lg border p-3 text-center transition ${form.role === 'BUYER' ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}
          >
            <p className="font-semibold">Buyer</p>
            <p className="text-xs">Buy fresh farm products</p>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormInput label="First name" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
          <FormInput label="Last name" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Username" value={form.username} onChange={(e) => update('username', e.target.value)} required />
          <FormInput label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <FormInput label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />

        {form.role === 'FARMER' && (
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Farm name" value={form.farm_name} onChange={(e) => update('farm_name', e.target.value)} />
            <FormInput label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} />
          </div>
        )}
        {form.role === 'BUYER' && (
          <FormInput label="Delivery address" value={form.address} onChange={(e) => update('address', e.target.value)} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormInput label="Password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <FormInput label="Confirm password" type="password" value={form.password2} onChange={(e) => update('password2', e.target.value)} required />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}