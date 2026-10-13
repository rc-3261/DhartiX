import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Receipt } from 'lucide-react'

import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatCurrency, formatDateTime, imageUrl } from '../utils/helpers'

export default function OrderDetail() {
  const { id } = useParams()
  const { role } = useAuth()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = async () => {
    setError('')
    try {
      const res = await api.getOrder(id)
      setOrder(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load order.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!order) return <LoadingSpinner full />

  const backHref = role === 'ADMIN' ? '/admin/orders' : role === 'FARMER' ? '/farmer/orders' : '/buyer/orders'

  return (
    <div>
      <Link to={backHref} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-sm text-gray-500">Placed {formatDateTime(order.created_at)} by {order.buyer_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card !p-0 overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th>Status</th></tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {item.product_image
                          ? <img src={imageUrl(item.product_image)} alt={item.product_name} className="h-10 w-10 rounded-lg object-cover" />
                          : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><Receipt className="h-5 w-5" /></div>}
                        <span className="font-medium text-gray-800">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{item.quantity}</td>
                    <td className="text-gray-600">{formatCurrency(item.price)}</td>
                    <td className="font-semibold text-gray-800">{formatCurrency(item.subtotal)}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(role === 'FARMER' || role === 'ADMIN') && (
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-800">Update item status</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-700">{item.product_name} × {item.quantity}</span>
                    <select
                      className="input !w-36 !py-1 !text-xs"
                      value={item.status}
                      disabled={updating === item.id}
                      onChange={async (e) => {
                        setUpdating(item.id)
                        try {
                          await api.updateOrderItemStatus(order.id, { item_id: item.id, status: e.target.value })
                          await load()
                        } catch (err) {
                          setError(err.response?.data?.detail || 'Failed to update status.')
                        } finally {
                          setUpdating(null)
                        }
                      }}
                    >
                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-3 font-semibold text-gray-800">Delivery</h3>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <p>{order.shipping_address || 'No address provided'}</p>
            </div>
            {order.notes && <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-500">Notes: {order.notes}</p>}
          </div>

          <div className="card">
            <h3 className="mb-3 font-semibold text-gray-800">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Method</span><span className="font-medium text-gray-800">{order.payment_method === 'COD' ? 'Cash on delivery' : 'Online'}</span></div>
              <div className="flex justify-between text-gray-600"><span>Status</span><StatusBadge status={order.payment_status} /></div>
              {order.payment_reference && (
                <div className="flex justify-between text-gray-600"><span>Reference</span><span className="text-gray-700">{order.payment_reference}</span></div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-gray-900">
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}