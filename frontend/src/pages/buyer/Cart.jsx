import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { api } from '../../api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import { formatCurrency, imageUrl } from '../../utils/helpers'

export default function Cart() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getCart()
      setCart(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load cart.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateQty = async (item, delta) => {
    const q = item.quantity + delta
    if (q < 1) return
    try {
      await api.updateCartItem(item.id, { quantity: q })
      load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update cart.')
    }
  }

  const remove = async (item) => {
    try {
      await api.removeCartItem(item.id)
      load()
    } catch {
      setError('Failed to remove item.')
    }
  }

  const clear = async () => {
    try {
      await api.clearCart()
      load()
    } catch {
      setError('Failed to clear cart.')
    }
  }

  if (loading) return <LoadingSpinner full />
  const items = cart?.items || []

  return (
    <div>
      <PageHeader
        title="Shopping Cart"
        subtitle={`${cart?.item_count ?? 0} item${cart?.item_count === 1 ? '' : 's'} in your cart`}
        action={items.length > 0 && (
          <button onClick={clear} className="btn-secondary"><Trash2 className="h-4 w-4" /> Clear cart</button>
        )}
      />

      {error && <ErrorMessage message={error} />}

      {items.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Your cart is empty"
            message="Browse the marketplace and add some fresh produce."
            action={<Link to="/buyer/marketplace" className="btn-primary"><ShoppingCart className="h-4 w-4" /> Browse marketplace</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4">
                {item.product_detail?.image_url
                  ? <img src={imageUrl(item.product_detail.image_url)} alt={item.product_detail.name} className="h-16 w-16 rounded-xl object-cover" />
                  : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-gray-400"><ShoppingCart className="h-6 w-6" /></div>}
                <div className="flex-1">
                  <Link to={`/buyer/marketplace/${item.product}`} className="font-semibold text-gray-800 hover:text-primary-700">
                    {item.product_detail?.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.product_detail?.price)}/{item.product_detail?.unit} • by {item.product_detail?.farmer_name}
                  </p>
                  <p className="text-xs text-gray-400">Stock: {item.product_detail?.quantity} {item.product_detail?.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-gray-200">
                    <button onClick={() => updateQty(item, -1)} className="p-2 text-gray-500 hover:text-primary-700" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-semibold text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQty(item, 1)} disabled={item.quantity >= Number(item.product_detail?.quantity)} className="p-2 text-gray-500 hover:text-primary-700" aria-label="Increase"><Plus className="h-4 w-4" /></button>
                  </div>
                  <button onClick={() => remove(item)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="w-24 text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card h-fit">
            <h3 className="mb-4 font-semibold text-gray-800">Order summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items</span><span>{cart?.item_count}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="text-green-600">Free</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-gray-900">
                <span>Total</span><span>{formatCurrency(cart?.total)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/buyer/checkout')} className="btn-primary mt-5 w-full">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/buyer/marketplace" className="btn-secondary mt-2 w-full">Continue shopping</Link>
          </div>
        </div>
      )}
    </div>
  )
}