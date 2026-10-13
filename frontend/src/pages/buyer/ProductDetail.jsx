import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Leaf, Minus, Plus, ShoppingCart } from 'lucide-react'

import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'

import { formatCurrency, imageUrl } from '../../utils/helpers'

export default function ProductDetail() {
  const { id } = useParams()
  const { role } = useAuth()
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getProduct(id)
      setProduct(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load product.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const addToCart = async () => {
    setAdding(true)
    setError('')
    setNotice('')
    try {
      await api.addToCart({ product: product.id, quantity })
      setNotice(`Added ${quantity} ${product.unit} of ${product.name} to your cart.`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add to cart.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <LoadingSpinner full />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!product) return null

  const out = Number(product.quantity) <= 0

  return (
    <div>
      <Link to="/buyer/marketplace" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>
      {error && <ErrorMessage message={error} />}
      {notice && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card !p-0 overflow-hidden">
          {product.image_url
            ? <img src={imageUrl(product.image_url)} alt={product.name} className="h-80 w-full object-cover" />
            : <div className="flex h-80 w-full items-center justify-center bg-gray-50"><Leaf className="h-16 w-16 text-gray-300" /></div>}
        </div>

        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">{product.category_name}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sold by {product.farmer_name}{product.farmer_farm ? ` at ${product.farmer_farm}` : ''}
            {product.location ? ` • ${product.location}` : ''}
          </p>

          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(product.price)}<span className="text-sm font-normal text-gray-500">/{product.unit}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {out ? <span className="font-medium text-red-600">Out of stock</span> : `${product.quantity} ${product.unit} in stock`}
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-gray-600">{product.description || 'Fresh produce straight from the farm.'}</p>

          {role === 'BUYER' && !out && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-gray-200">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5 text-gray-500 hover:text-primary-700" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold text-gray-800">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(Number(product.quantity), q + 1))} className="p-2.5 text-gray-500 hover:text-primary-700" aria-label="Increase"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={addToCart} disabled={adding} className="btn-primary flex-1"><ShoppingCart className="h-4 w-4" /> {adding ? 'Adding…' : 'Add to cart'}</button>
            </div>
          )}
          {role === 'BUYER' && out && <div className="mt-6 text-sm text-red-600">This product is currently unavailable.</div>}

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-50 pt-4 text-center text-xs text-gray-500">
            <div className="rounded-lg bg-gray-50 p-2">🥦 Farm fresh<br /><span className="text-gray-400">Straight from farmers</span></div>
            <div className="rounded-lg bg-gray-50 p-2">🚚 Delivery<br /><span className="text-gray-400">Cash on delivery</span></div>
            <div className="rounded-lg bg-gray-50 p-2">🔒 Secure<br /><span className="text-gray-400">Verified sellers</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}