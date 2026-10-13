import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function BuyerOrders() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.myOrders()
      .then((res) => setOrders(res.data.results || res.data || []))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = status ? orders.filter((o) => o.status === status) : orders

  return (
    <div>
      <PageHeader
        title="My Orders"
        subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'}`}
        action={
          <select className="input !w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="card"><EmptyState title="No orders yet" message="Head to the marketplace to place your first order." action={<Link to="/buyer/marketplace" className="btn-primary">Browse marketplace</Link>} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><p className="text-sm text-gray-500">No orders with status <strong>{status}</strong>.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <Link key={o.id} to={`/buyer/orders/${o.id}`} className="card flex items-center justify-between transition hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order #{o.id}</p>
                  <p className="text-xs text-gray-500">{formatDate(o.created_at)} • {o.items.length} item{o.items.length === 1 ? '' : 's'} • {o.payment_method === 'COD' ? 'COD' : 'Online'}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {o.items.map((i) => (
                      <span key={i.id} className="badge bg-gray-100 text-xs text-gray-600">{i.product_name} × {i.quantity}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(o.total)}</p>
                <div className="mt-1"><StatusBadge status={o.status} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}