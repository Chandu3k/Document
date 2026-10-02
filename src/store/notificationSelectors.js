import { createSelector } from '@reduxjs/toolkit'
import { selectDocuments, selectReminders, selectSubscriptions } from './selectors'
import { daysUntil } from '../utils/dates'
import { money } from '../utils/format'

const selectLeadDays = (s) => s.preferences.reminderLeadDays
const selectReadIds = (s) => s.notifications.readIds

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const when = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`)
const RANK = { danger: 0, warn: 1, neutral: 2 }

export const selectNotifications = createSelector(
  [selectDocuments, selectSubscriptions, selectReminders, selectLeadDays, selectReadIds],
  (documents, subscriptions, reminders, leadDays, readIds) => {
    const items = []

    documents.forEach((d) => {
      if (d.status !== 'active' || !d.expiryDate) return
      const days = daysUntil(d.expiryDate)
      if (days < 0) {
        items.push({
          id: `doc-expired:${d.id}:${d.expiryDate}`,
          kind: 'document',
          tone: 'danger',
          title: d.title,
          text: `Expired ${plural(-days, 'day')} ago`,
          to: `/documents/${d.id}`,
          days,
        })
      } else if (days <= leadDays) {
        items.push({
          id: `doc-soon:${d.id}:${d.expiryDate}`,
          kind: 'document',
          tone: 'warn',
          title: d.title,
          text: days === 0 ? 'Expires today' : `Expires ${when(days)}`,
          to: `/documents/${d.id}`,
          days,
        })
      }
    })

    subscriptions.forEach((s) => {
      if (s.status !== 'active') return
      const days = daysUntil(s.nextBillingDate)
      if (days >= 0 && days <= leadDays) {
        items.push({
          id: `sub:${s.id}:${s.nextBillingDate}`,
          kind: 'subscription',
          tone: 'neutral',
          title: s.name,
          text: `Renews ${when(days)} · ${money(s.amount)}`,
          to: `/subscriptions/${s.id}`,
          days,
        })
      }
    })

    reminders.forEach((r) => {
      if (r.done) return
      const days = daysUntil(r.date)
      if (days <= leadDays) {
        items.push({
          id: `rem:${r.id}:${r.date}`,
          kind: 'reminder',
          tone: days < 0 ? 'danger' : 'neutral',
          title: r.message,
          text:
            days < 0
              ? `Overdue by ${plural(-days, 'day')}`
              : days === 0
                ? 'Due today'
                : `Due ${when(days)}`,
          to: '/reminders',
          days,
        })
      }
    })

    return items
      .sort((a, b) => RANK[a.tone] - RANK[b.tone] || a.days - b.days)
      .map((n) => ({ ...n, read: readIds.includes(n.id) }))
  }
)

export const selectUnreadCount = createSelector(
  [selectNotifications],
  (items) => items.filter((n) => !n.read).length
)