import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency, imageUrl } from '../../utils/helpers'

const ITEM_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function FarmerOrders() {
  const [items, setItems] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.farmerOrderItems({ status: statusFilter || undefined })
      setItems(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const updateStatus = async (item, status) => {
    setUpdating(item.id)
    setError('')
    try {
      await api.updateOrderItemStatus(item.order, { item_id: item.id, status })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.')
    } finally {
      setUpdating(null)
    }
  }

  const totalRevenue = items.reduce((s, i) => s + Number(i.subtotal), 0)

  return (
    <div>
      <PageHeader
        title="Sales & Incoming Orders"
        subtitle={`${items.length} order item${items.length === 1 ? '' : 's'} • ${formatCurrency(totalRevenue)} total`}
        action={
          <select className="input !w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="card"><EmptyState title="No orders yet" message="When buyers place orders for your products, they'll show up here." /></div>
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Order #</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Status</th>
                <th className="text-right">Update</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {item.product_image
                        ? <img src={imageUrl(item.product_image)} alt={item.product_name} className="h-9 w-9 rounded-lg object-cover" />
                        : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><ShoppingBag className="h-4 w-4" /></div>}
                      <span className="font-medium text-gray-800">{item.product_name}</span>
                    </div>
                  </td>
                  <td><Link to={`/farmer/orders/${item.order}`} className="text-primary-700 hover:underline">#{item.order}</Link></td>
                  <td className="text-gray-600">{item.quantity}</td>
                  <td className="font-semibold text-gray-800">{formatCurrency(item.subtotal)}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <div className="flex justify-end">
                      <select
                        className="input !w-32 !py-1 !text-xs"
                        value={item.status}
                        disabled={updating === item.id}
                        onChange={(e) => updateStatus(item, e.target.value)}
                      >
                        {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}