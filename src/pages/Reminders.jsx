import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Bell, Check, Plus, Trash2 } from 'lucide-react'
import {
  deleteReminder,
  fetchReminders,
  updateReminder,
} from '../store/remindersSlice'
import { selectDocuments, selectReminders, selectSubscriptions } from '../store/selectors'
import { daysUntil, todayISO } from '../utils/dates'
import { relativeDays } from '../utils/format'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import Modal from '../components/Modal'
import ReminderForm from '../components/ReminderForm'
import ConfirmDialog from '../components/ConfirmDialog'

function Group({ title, count, tone = 'text-ink', children }) {
  return (
    <section className="mt-8">
      <h2 className={`font-display text-xl font-semibold ${tone}`}>
        {title} <span className="ml-1 text-sm font-normal text-muted">{count}</span>
      </h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">{children}</ul>
    </section>
  )
}

export default function Reminders() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((s) => s.reminders)
  const reminders = useSelector(selectReminders)
  const documents = useSelector(selectDocuments)
  const subscriptions = useSelector(selectSubscriptions)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null) // the reminder being edited, or null for a new one
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const today = todayISO()
  const overdue = reminders
    .filter((r) => !r.done && r.date < today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = reminders
    .filter((r) => !r.done && r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const done = reminders
    .filter((r) => r.done)
    .sort((a, b) => b.date.localeCompare(a.date))

  const openForm = (reminder = null) => {
    setEditing(reminder)
    setFormOpen(true)
  }
  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const toggleDone = async (reminder) => {
    try {
      setActionError('')
      await dispatch(
        updateReminder({ id: reminder.id, changes: { done: !reminder.done } })
      ).unwrap()
    } catch (err) {
      setActionError(err.message || 'Could not update the reminder.')
    }
  }

  const handleDelete = async () => {
    try {
      setBusy(true)
      setActionError('')
      await dispatch(deleteReminder(deleting.id)).unwrap()
      setDeleting(null)
    } catch (err) {
      setActionError(err.message || 'Could not delete the reminder.')
    } finally {
      setBusy(false)
    }
  }

  // What a reminder is linked to, if that record still exists
  const linkFor = (r) => {
    if (r.targetType === 'document') {
      const doc = documents.find((d) => d.id === r.targetId)
      return doc ? { to: `/documents/${doc.id}`, label: doc.title } : null
    }
    if (r.targetType === 'subscription') {
      const sub = subscriptions.find((s) => s.id === r.targetId)
      return sub ? { to: `/subscriptions/${sub.id}`, label: sub.name } : null
    }
    return null
  }

  const renderRow = (r, state) => {
    const link = linkFor(r)
    const days = daysUntil(r.date)
    const dateTone =
      state === 'overdue' ? 'text-danger' : state === 'done' ? 'text-muted' : 'text-muted'

    return (
      <li key={r.id} className="group flex items-start gap-3 py-3.5">
        <button
          role="checkbox"
          aria-checked={r.done}
          aria-label={r.done ? 'Mark as not done' : 'Mark as done'}
          onClick={() => toggleDone(r)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
            r.done
              ? 'border-accent bg-accent text-white'
              : 'border-line bg-surface text-transparent hover:border-accent hover:text-accent/40'
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </button>

        <button onClick={() => openForm(r)} className="min-w-0 flex-1 text-left">
          <p
            className={`text-[16px] font-medium ${r.done ? 'text-muted line-through' : ''}`}
          >
            {r.message}
          </p>
          <p className={`mt-0.5 text-[13px] ${dateTone}`}>
            {format(parseISO(r.date), 'd MMM yyyy')}
            {!r.done && ` · ${relativeDays(days)}`}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {link && (
            <Link
              to={link.to}
              className="hidden max-w-[160px] truncate rounded-full bg-black/5 px-2.5 py-1 text-xs text-muted transition hover:bg-accent-soft hover:text-accent sm:inline-block"
            >
              {link.label}
            </Link>
          )}
          <button
            onClick={() => {
              setActionError('')
              setDeleting(r)
            }}
            aria-label="Delete reminder"
            className="rounded-lg p-2 text-muted transition hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="page-enter">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Reminders</h1>
          <p className="mt-2 text-muted">
            {status === 'succeeded'
              ? `${overdue.length + upcoming.length} open · ${done.length} done`
              : 'Never miss a deadline.'}
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95"
        >
          <Plus size={18} /> Add reminder
        </button>
      </header>

      {actionError && !deleting && (
        <p className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {actionError}
        </p>
      )}

      {(status === 'idle' || status === 'loading') && (
        <div className="mt-8">
          <ListSkeleton rows={4} />
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-8">
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your reminders"
            text={error || 'Something went wrong. Please try again.'}
            actionLabel="Try again"
            onAction={() => dispatch(fetchReminders())}
          />
        </div>
      )}

      {status === 'succeeded' && reminders.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Bell}
            title="No reminders yet"
            text="Add a reminder for anything you don't want to forget, like renewing a policy or checking a price."
            actionLabel="Add reminder"
            onAction={() => openForm()}
          />
        </div>
      )}

      {status === 'succeeded' && reminders.length > 0 && (
        <>
          {overdue.length > 0 && (
            <Group title="Overdue" count={overdue.length} tone="text-danger">
              {overdue.map((r) => renderRow(r, 'overdue'))}
            </Group>
          )}

          <Group title="Upcoming" count={upcoming.length}>
            {upcoming.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">
                Nothing upcoming. You're all caught up.
              </li>
            ) : (
              upcoming.map((r) => renderRow(r, 'upcoming'))
            )}
          </Group>

          {done.length > 0 && (
            <Group title="Done" count={done.length} tone="text-muted">
              {done.map((r) => renderRow(r, 'done'))}
            </Group>
          )}
        </>
      )}

      {formOpen && (
        <Modal title={editing ? 'Edit reminder' : 'Add reminder'} onClose={closeForm}>
          <ReminderForm record={editing || undefined} onClose={closeForm} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this reminder?"
          text={`“${deleting.message}” will be removed. This can't be undone.`}
          confirmLabel="Delete"
          busy={busy}
          error={actionError}
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleting(null)
            setActionError('')
          }}
        />
      )}
    </div>
  )
}