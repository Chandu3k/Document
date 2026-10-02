import { daysUntil } from '../utils/dates'

const styles = {
  neutral: 'bg-black/5 text-muted',
  good: 'bg-accent-soft text-accent',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
}

function describeDocument(status, date, soonDays) {
  if (status === 'archived') return ['neutral', 'Archived']
  if (!date) return ['neutral', 'No expiry']
  const days = daysUntil(date)
  if (days < 0) return ['danger', 'Expired']
  if (days === 0) return ['warn', 'Expires today']
  if (days <= soonDays) return ['warn', `Expires in ${days} ${days === 1 ? 'day' : 'days'}`]
  return ['good', 'Active']
}

function describeSubscription(status) {
  if (status === 'active') return ['good', 'Active']
  if (status === 'paused') return ['warn', 'Paused']
  if (status === 'cancelled') return ['neutral', 'Cancelled']
  return ['neutral', 'Archived']
}

export default function StatusBadge({ kind = 'document', status, date, soonDays = 30 }) {
  const [tone, label] =
    kind === 'subscription'
      ? describeSubscription(status)
      : describeDocument(status, date, soonDays)

  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {label}
    </span>
  )
}