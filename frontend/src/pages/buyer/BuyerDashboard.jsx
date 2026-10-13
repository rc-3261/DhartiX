import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IndianRupee, Package, ShoppingCart, ShoppingBag, Truck } from 'lucide-react'

import { api } from '../../api'
import ChartCard from '../../components/ChartCard'
import DashboardCard from '../../components/DashboardCard'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatCurrency } from '../../utils/helpers'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'

export default function BuyerDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.buyerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard.'))
  }, [])

  if (error) return <ErrorMessage message={error} />
  if (!data) return <LoadingSpinner full label="Loading buyer dashboard..." />

  const t = data.totals

  return (
    <div>
      <PageHeader
        title="Buyer Dashboard"
        subtitle="Track your orders and discover fresh farm produce"
        action={<Link to="/buyer/marketplace" className="btn-primary"><ShoppingBag className="h-4 w-4" /> Browse marketplace</Link>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardCard icon={Package} label="Marketplace items" value={t.marketplace_products} color="green" />
        <DashboardCard icon={ShoppingCart} label="Cart items" value={t.cart_items} color="blue" />
        <DashboardCard icon={ShoppingBag} label="Total orders" value={t.orders} color="purple" />
        <DashboardCard icon={Truck} label="Delivered" value={t.delivered_orders} color="green" />
        <DashboardCard icon={IndianRupee} label="Total spent" value={formatCurrency(t.total_spent)} color="amber" />
        <DashboardCard icon={ShoppingBag} label="Pending" value={t.pending_orders} color="gray" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Spending by order" subtitle="Your most recent orders">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.spending_chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="order" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" name="Order total" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by status" subtitle="How your purchases are going">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.orders_by_status}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="status" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Orders" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Recent orders</h3>
          <Link to="/buyer/orders" className="text-xs font-medium text-primary-700 hover:underline">View all</Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <EmptyState title="No orders yet" message="Head to the marketplace to place your first order." action={<Link to="/buyer/marketplace" className="btn-primary">Browse products</Link>} />
        ) : (
          <div className="space-y-2">
            {data.recent_orders.map((o) => (
              <Link key={o.id} to={`/buyer/orders/${o.id}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 transition hover:bg-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">Order #{o.id}</p>
                  <p className="text-xs text-gray-500">{o.items} item{o.items === 1 ? '' : 's'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(o.total)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}