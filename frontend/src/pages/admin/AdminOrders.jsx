import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, formatDate } from '../../utils/helpers'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getOrders({ page, status: status || undefined, page_size: 10 })
      setOrders(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  return (
    <div>
      <PageHeader
        title="All Orders"
        subtitle={`${count} order${count === 1 ? '' : 's'} placed on the platform`}
        action={
          <select className="input !w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All statuses</option>
            {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      {error && <ErrorMessage message={error} />}
      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="card"><EmptyState title="No orders yet" message="Orders placed by buyers will appear here." /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Placed</th>
                <th>Status</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-semibold text-gray-800">#{o.id}</td>
                  <td className="text-gray-600">{o.buyer_name}</td>
                  <td>
                    <span className="flex items-center gap-1 text-gray-600">
                      <ShoppingBag className="h-4 w-4 text-gray-400" /> {o.items.length}
                    </span>
                  </td>
                  <td className="font-semibold text-gray-800">{formatCurrency(o.total)}</td>
                  <td>
                    <p className="text-xs text-gray-600">{o.payment_method === 'COD' ? 'COD' : 'Online'}</p>
                    <StatusBadge status={o.payment_status} />
                  </td>
                  <td className="text-xs text-gray-500">{formatDate(o.created_at)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <div className="flex justify-end">
                      <Link to={`/admin/orders/${o.id}`} className="btn-secondary !px-3 !py-1 !text-xs">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>
    </div>
  )
}