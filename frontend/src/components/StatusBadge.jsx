import { classNames, formatStatusLabel, statusColor } from '../utils/helpers'

export default function StatusBadge({ status, type = 'generic' }) {
  if (!status) return null
  return (
    <span className={classNames('badge', statusColor(status, type))}>
      {formatStatusLabel(status)}
    </span>
  )
}