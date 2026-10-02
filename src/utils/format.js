export const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

export const cycleUnit = { monthly: 'month', quarterly: 'quarter', yearly: 'year' }

// 0 -> "Today", 1 -> "Tomorrow", 5 -> "In 5 days", -3 -> "3 days ago"
export function relativeDays(days) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${days} days` : `${-days} days ago`
}