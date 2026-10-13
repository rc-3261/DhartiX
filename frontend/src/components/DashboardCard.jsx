import { classNames } from '../utils/helpers'

export default function DashboardCard({ icon: Icon, label, value, sub, color = 'green', loading }) {
  const colors = {
    green: 'bg-primary-50 text-primary-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={classNames('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', colors[color] || colors.green)}>
        {Icon && <Icon className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        {loading ? (
          <div className="mt-1 h-6 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="truncate text-2xl font-bold text-gray-900">{value ?? '-'}</p>
        )}
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}