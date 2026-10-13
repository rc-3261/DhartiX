import { useState } from 'react'
import { Camera } from 'lucide-react'

import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/helpers'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    farm_name: user?.farmer_profile?.farm_name || '',
    location: user?.farmer_profile?.location || '',
    bio: user?.farmer_profile?.bio || '',
    address: user?.buyer_profile?.address || '',
    city: user?.buyer_profile?.city || '',
    avatar: null,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      const data = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== null))
      await api.updateProfile(data)
      await refreshUser()
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and update your account information" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-700 text-3xl font-bold text-white">
                {(user?.username || 'U')[0].toUpperCase()}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white shadow">
                <Camera className="h-3.5 w-3.5 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => update('avatar', e.target.files[0])}
                />
              </label>
            </div>
            <h2 className="mt-3 text-lg font-bold text-gray-900">{user?.first_name || user?.username} {user?.last_name}</h2>
            <p className="text-sm text-gray-500">@{user?.username}</p>
            <div className="mt-2"><StatusBadge status={user?.role} type="role" /></div>
            <div className="mt-4 w-full space-y-2 text-sm text-gray-600">
              <div className="flex justify-between"><span>Email</span><span className="text-gray-800">{user?.email}</span></div>
              <div className="flex justify-between"><span>Joined</span><span className="text-gray-800">{formatDate(user?.date_joined)}</span></div>
              <div className="flex justify-between"><span>Phone</span><span className="text-gray-800">{user?.phone || '-'}</span></div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-gray-800">Edit profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorMessage message={error} />}
            {success && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Profile updated successfully.</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput label="First name" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
              <FormInput label="Last name" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
              <FormInput label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            {user?.role === 'FARMER' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput label="Farm name" value={form.farm_name} onChange={(e) => update('farm_name', e.target.value)} />
                  <FormInput label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} />
                </div>
                <FormInput label="Bio" type="textarea" value={form.bio} onChange={(e) => update('bio', e.target.value)} />
              </>
            )}
            {user?.role === 'BUYER' && (
              <>
                <FormInput label="Delivery address" value={form.address} onChange={(e) => update('address', e.target.value)} />
                <FormInput label="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}