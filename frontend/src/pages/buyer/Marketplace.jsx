import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Leaf, Package, Plus, Search } from 'lucide-react'

import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import Pagination from '../../components/Pagination'
import { formatCurrency, imageUrl } from '../../utils/helpers'

export default function Marketplace() {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getProducts({ page, search: search || undefined, category: category || undefined, ordering: sort || undefined, page_size: 12 })
      setProducts(res.data.results || res.data || [])
      setCount(res.data.count ?? res.data.length)
      if (!categories.length) {
        const c = await api.getCategories()
        setCategories(c.data.results || c.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category, sort])

  const addToCart = async (product) => {
    setAdding(product.id)
    setError('')
    try {
      await api.addToCart({ product: product.id, quantity: 1 })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not add to cart.')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Marketplace"
        subtitle={`${count} fresh products from local farmers`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="input !w-48 !pl-9"
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </div>
            <select className="input !w-44" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input !w-40" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
              <option value="">Sort by</option>
              <option value="price">Price: low to high</option>
              <option value="-price">Price: high to low</option>
              <option value="name">Name A–Z</option>
              <option value="-created_at">Newest</option>
            </select>
          </div>
        }
      />

      {error && <ErrorMessage message={error} onRetry={load} />}
      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="card"><EmptyState title="No products found" message="Try a different search or category." /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="card flex flex-col overflow-hidden">
              <Link to={`/buyer/marketplace/${p.id}`} className="block h-40 bg-gray-50">
                {p.image_url
                  ? <img src={imageUrl(p.image_url)} alt={p.name} className="h-full w-full object-cover transition hover:scale-105" />
                  : <div className="flex h-full items-center justify-center"><Leaf className="h-10 w-10 text-gray-300" /></div>}
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <p className="text-xs text-gray-400">{p.category_name} • {p.farmer_name}{p.farmer_farm ? ` (${p.farmer_farm})` : ''}</p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 flex-1 text-xs text-gray-500">{p.description || 'Fresh from the farm.'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(p.price)}<span className="text-xs font-normal text-gray-500">/{p.unit}</span></p>
                    <p className="text-xs text-gray-500">{p.quantity} {p.unit} available{p.location ? ` • ${p.location}` : ''}</p>
                  </div>
                  {role === 'BUYER' ? (
                    <button onClick={() => addToCart(p)} disabled={adding === p.id || Number(p.quantity) <= 0} className="btn-primary !rounded-full !p-2.5" aria-label="Add to cart">
                      {adding === p.id ? '...' : <Plus className="h-4 w-4" />}
                    </button>
                  ) : (
                    <Link to={`/buyer/marketplace/${p.id}`} className="btn-secondary !px-3 !py-1 !text-xs">View</Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4"><Pagination page={page} setPage={setPage} count={count} /></div>
    </div>
  )
}