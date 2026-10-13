import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, HandCoins } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import { formatCurrency } from '../../utils/helpers'

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [done, setDone] = useState(null)
  const [form, setForm] = useState({
    shipping_address: '',
    payment_method: 'COD',
    notes: '',
  })

  useEffect(() => {
    api.getCart()
      .then((res) => {
        setCart(res.data)
        setForm((f) => ({ ...f, shipping_address: res.data?.items?.[0]?.product_detail?.location || '' }))
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load cart.'))
      .finally(() => setLoading(false))
  }, [])

  const placeOrder = async (e) => {
    e.preventDefault()
    setPlacing(true)
    setError('')
    try {
      const res = await api.checkout(form)
      setDone(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed.')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <LoadingSpinner full />

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Order placed!</h1>
        <p className="mt-1 text-gray-600">Your order <span className="font-semibold">#{done.id}</span> has been placed successfully.</p>
        <div className="card mt-6 text-left">
          <div className="flex justify-between text-sm text-gray-600"><span>Total</span><span className="font-semibold text-gray-900">{formatCurrency(done.total)}</span></div>
          <div className="mt-2 flex justify-between text-sm text-gray-600"><span>Payment</span><span className="font-semibold text-gray-900">{done.payment_method === 'COD' ? 'Cash on delivery' : `Online (ref: ${done.payment_reference})`}</span></div>
          <div className="mt-2 flex justify-between text-sm text-gray-600"><span>Status</span><span className="font-semibold text-gray-900">{done.status}</span></div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => navigate(`/buyer/orders/${done.id}`)} className="btn-primary">View order</button>
          <Link to="/buyer/marketplace" className="btn-secondary">Continue shopping</Link>
        </div>
      </div>
    )
  }

  const items = cart?.items || []

  if (items.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-600">Your cart is empty. <Link to="/buyer/marketplace" className="font-medium text-primary-700">Go to marketplace</Link></p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Checkout" subtitle="Review your items and place the order" />
      {error && <ErrorMessage message={error} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={placeOrder} className="card space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-gray-800">Delivery details</h3>
          <FormInput
            label="Shipping address"
            value={form.shipping_address}
            onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
            required
          />
          <FormInput
            label="Order notes (optional)"
            type="textarea"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <h3 className="pt-2 font-semibold text-gray-800">Payment method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, payment_method: 'COD' })}
              className={`rounded-xl border p-4 text-left transition ${form.payment_method === 'COD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
            >
              <HandCoins className="h-6 w-6 text-primary-700" />
              <p className="mt-2 font-semibold text-gray-800">Cash on delivery</p>
              <p className="text-xs text-gray-500">Pay when your order arrives</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, payment_method: 'ONLINE' })}
              className={`rounded-xl border p-4 text-left transition ${form.payment_method === 'ONLINE' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
            >
              <CreditCard className="h-6 w-6 text-primary-700" />
              <p className="mt-2 font-semibold text-gray-800">Online (demo)</p>
              <p className="text-xs text-gray-500">Simulated gateway payment</p>
            </button>
          </div>

          <button type="submit" disabled={placing} className="btn-primary w-full">
            {placing ? 'Placing order…' : `Place order • ${formatCurrency(cart?.total)}`}
          </button>
        </form>

        <div className="card h-fit">
          <h3 className="mb-3 font-semibold text-gray-800">Items ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.product_detail?.name} × {item.quantity}</span>
                <span className="font-medium text-gray-800">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-lg font-bold text-gray-900">
            <span>Total</span><span>{formatCurrency(cart?.total)}</span>
          </div>
          <Link to="/buyer/cart" className="btn-secondary mt-4 w-full">Back to cart</Link>
        </div>
      </div>
    </div>
  )
}