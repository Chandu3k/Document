import { billingDatesInRange } from './dates'

// Everything happening between two ISO dates (inclusive), sorted by date.
export function getEventsInRange(documents, subscriptions, reminders, from, to) {
  const events = []

  documents.forEach((doc) => {
    if (doc.status === 'active' && doc.expiryDate && doc.expiryDate >= from && doc.expiryDate <= to) {
      events.push({
        key: `doc-${doc.id}`,
        kind: 'document',
        id: doc.id,
        date: doc.expiryDate,
        title: doc.title,
        category: doc.category,
        label: 'Expires',
      })
    }
  })

  subscriptions.forEach((sub) => {
    billingDatesInRange(sub, from, to).forEach((date) => {
      events.push({
        key: `sub-${sub.id}-${date}`,
        kind: 'subscription',
        id: sub.id,
        date,
        title: sub.name,
        category: sub.category,
        label: 'Renews',
        amount: sub.amount,
      })
    })
  })

  reminders.forEach((r) => {
    if (r.date >= from && r.date <= to) {
      events.push({
        key: `rem-${r.id}`,
        kind: 'reminder',
        id: r.id,
        date: r.date,
        title: r.message,
        label: 'Reminder',
        done: r.done,
      })
    }
  })

  return events.sort((a, b) => a.date.localeCompare(b.date))
}