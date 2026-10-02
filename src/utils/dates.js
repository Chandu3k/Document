import { parseISO, differenceInCalendarDays, addMonths, format } from 'date-fns'

export const toISODate = (date) => format(date, 'yyyy-MM-dd')
export const todayISO = () => toISODate(new Date())

// Days from today until the date (negative = already passed). null if no date.
export function daysUntil(dateStr) {
  if (!dateStr) return null
  return differenceInCalendarDays(parseISO(dateStr), new Date())
}

const MONTHS_PER_CYCLE = { monthly: 1, quarterly: 3, yearly: 12 }

export function monthlyEquivalent(amount, cycle) {
  return amount / MONTHS_PER_CYCLE[cycle]
}

// Every billing date of an active subscription between two ISO dates.
// Counts forward from nextBillingDate, stepping by the billing cycle.
export function billingDatesInRange(sub, fromISO, toISOStr) {
  if (sub.status !== 'active') return []
  const step = MONTHS_PER_CYCLE[sub.billingCycle]
  const base = parseISO(sub.nextBillingDate)
  const from = parseISO(fromISO)
  const to = parseISO(toISOStr)
  const dates = []
  for (let k = 0; k < 600; k++) {
    const date = addMonths(base, k * step)
    if (date > to) break
    if (date >= from) dates.push(toISODate(date))
  }
  return dates
}