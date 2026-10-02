import { createSelector } from '@reduxjs/toolkit'
import { daysUntil, monthlyEquivalent } from '../utils/dates'
import { getEventsInRange } from '../utils/events'

// ---------- basic reads ----------
export const selectDocuments = (s) => s.documents.items
export const selectSubscriptions = (s) => s.subscriptions.items
export const selectReminders = (s) => s.reminders.items
export const selectCategories = (s) => s.categories.items
export const selectFilters = (s) => s.filters
export const selectSelectedDate = (s) => s.calendar.selectedDate
const selectLeadDays = (s) => s.preferences.reminderLeadDays

export const selectCategoryMap = createSelector([selectCategories], (cats) =>
  Object.fromEntries(cats.map((c) => [c.id, c]))
)

// ---------- overview ----------
export const selectExpiringSoon = createSelector(
  [selectDocuments, selectLeadDays],
  (docs, leadDays) =>
    docs
      .filter((d) => {
        if (d.status !== 'active' || !d.expiryDate) return false
        const days = daysUntil(d.expiryDate)
        return days >= 0 && days <= leadDays
      })
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
)

export const selectExpiredDocuments = createSelector([selectDocuments], (docs) =>
  docs.filter((d) => d.status === 'active' && d.expiryDate && daysUntil(d.expiryDate) < 0)
)

export const selectRecentDocuments = createSelector([selectDocuments], (docs) =>
  docs
    .filter((d) => d.status === 'active')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
)

export const selectActiveSubscriptions = createSelector([selectSubscriptions], (subs) =>
  subs.filter((s) => s.status === 'active')
)

export const selectUpcomingRenewals = createSelector(
  [selectActiveSubscriptions, selectLeadDays],
  (subs, leadDays) =>
    subs
      .filter((s) => {
        const days = daysUntil(s.nextBillingDate)
        return days >= 0 && days <= leadDays
      })
      .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate))
)

export const selectMonthlyTotal = createSelector([selectActiveSubscriptions], (subs) =>
  subs.reduce((sum, s) => sum + monthlyEquivalent(s.amount, s.billingCycle), 0)
)

// ---------- calendar ----------
export const selectSelectedDayEvents = createSelector(
  [selectDocuments, selectSubscriptions, selectReminders, selectSelectedDate],
  (docs, subs, reminders, date) => getEventsInRange(docs, subs, reminders, date, date)
)

// ---------- search + filters ----------
function documentStatus(doc) {
  if (doc.status === 'archived') return 'archived'
  const days = daysUntil(doc.expiryDate)
  return days !== null && days < 0 ? 'expired' : 'active'
}

function matchesExpiry(date, expiry) {
  if (expiry === 'any') return true
  if (expiry === 'none') return !date
  if (!date) return false
  const days = daysUntil(date)
  if (expiry === 'expired') return days < 0
  return days >= 0 && days <= Number(expiry)
}

// Documents and subscriptions in one shape, so one search/filter works on both
export const selectAllRecords = createSelector(
  [selectDocuments, selectSubscriptions],
  (docs, subs) => [
    ...docs.map((d) => ({
      kind: 'document',
      id: d.id,
      title: d.title,
      category: d.category,
      status: documentStatus(d),
      date: d.expiryDate,
      notes: d.notes,
      extra: Object.values(d.metadata || {}).join(' '),
    })),
    ...subs.map((s) => ({
      kind: 'subscription',
      id: s.id,
      title: s.name,
      category: s.category,
      status: s.status,
      date: s.nextBillingDate,
      notes: s.notes,
      extra: s.billingCycle,
    })),
  ]
)

export const selectFilteredRecords = createSelector(
  [selectAllRecords, selectFilters, selectCategoryMap],
  (records, f, categoryMap) => {
    const q = f.search.trim().toLowerCase()
    return records
      .filter((r) => {
        if (f.type !== 'all' && r.kind !== f.type) return false
        if (f.category !== 'all' && r.category !== f.category) return false
        if (f.status === 'all' ? r.status === 'archived' : r.status !== f.status) return false
        if (!matchesExpiry(r.date, f.expiry)) return false
        if (q) {
          const text = [r.title, r.notes, r.extra, categoryMap[r.category]?.name]
            .join(' ')
            .toLowerCase()
          if (!text.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return a.date.localeCompare(b.date)
      })
  }
)