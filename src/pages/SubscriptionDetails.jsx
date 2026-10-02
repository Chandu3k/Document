import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addMonths, format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  FileQuestion,
  Pause,
  Pencil,
  Play,
  Trash2,
} from 'lucide-react'
import {
  deleteSubscription,
  fetchSubscriptions,
  updateSubscription,
} from '../store/subscriptionsSlice'
import { daysUntil, monthlyEquivalent } from '../utils/dates'
import { cycleUnit, money } from '../utils/format'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import Modal from '../components/Modal'
import SubscriptionForm from '../components/SubscriptionForm'
import ConfirmDialog from '../components/ConfirmDialog'

const STEP = { monthly: 1, quarterly: 3, yearly: 12 }

const formatDate = (iso) => (iso ? format(parseISO(iso), 'd MMMM yyyy') : '—')

// The next few billing dates, counted forward from nextBillingDate by the cycle
function upcomingDates(sub, count = 3) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const base = parseISO(sub.nextBillingDate)
  const dates = []
  for (let k = 0; dates.length < count && k < 600; k++) {
    const date = addMonths(base, k * STEP[sub.billingCycle])
    if (date >= today) dates.push(date)
  }
  return dates
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 py-3 sm:grid-cols-[170px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  )
}

export default function SubscriptionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, status, error } = useSelector((s) => s.subscriptions)

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const sub = items.find((s) => s.id === id)

  if (status === 'idle' || status === 'loading') return <ListSkeleton rows={4} />

  if (status === 'failed') {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this subscription"
        text={error || 'Something went wrong. Please try again.'}
        actionLabel="Try again"
        onAction={() => dispatch(fetchSubscriptions())}
      />
    )
  }

  if (!sub) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Subscription not found"
        text="It may have been deleted, or the link is wrong."
        actionLabel="Back to subscriptions"
        onAction={() => navigate('/subscriptions')}
      />
    )
  }

  const isActive = sub.status === 'active'
  const isPaused = sub.status === 'paused'
  const isCancelled = sub.status === 'cancelled'
  const isArchived = sub.status === 'archived'

  const monthly = monthlyEquivalent(sub.amount, sub.billingCycle)
  const days = daysUntil(sub.nextBillingDate)
  const nextDates = isActive ? upcomingDates(sub) : []

  const change = async (changes) => {
    try {
      setBusy(true)
      setActionError('')
      await dispatch(updateSubscription({ id: sub.id, changes })).unwrap()
    } catch (err) {
      setActionError(err.message || 'Could not update the subscription.')
    } finally {
      setBusy(false)
    }
  }

  // Archiving remembers the old status so Restore can bring it back exactly
  const toggleArchive = () =>
    isArchived
      ? change({ status: sub.previousStatus || 'active', previousStatus: null })
      : change({ status: 'archived', previousStatus: sub.status })

  const handleDelete = async () => {
    try {
      setBusy(true)
      setActionError('')
      await dispatch(deleteSubscription(sub.id)).unwrap()
      navigate('/subscriptions', { replace: true })
    } catch (err) {
      setActionError(err.message || 'Could not delete the subscription.')
      setBusy(false)
    }
  }

  const actionButton =
    'inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.03] active:scale-95 disabled:opacity-60'

  let daysText 
  if (isActive) {
    if (days < 0) daysText = `Billing date passed ${-days} ${-days === 1 ? 'day' : 'days'} ago. Edit to update it`
    else if (days === 0) daysText = 'Renews today'
    else daysText = `Renews in ${days} ${days === 1 ? 'day' : 'days'}`
  } else if (isPaused) {
    daysText = 'Paused. You are not being counted for renewals.'
  } else if (isCancelled) {
    daysText = 'Cancelled. No further renewals.'
  } else {
    daysText = 'Archived. Restore it to bring it back.'
  }

  return (
    <div className="page-enter">
      <Link
        to="/subscriptions"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Subscriptions
      </Link>

      {/* Title block */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryTag id={sub.category} />
          <StatusBadge kind="subscription" status={sub.status} />
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{sub.name}</h1>
      </header>

      {/* Cost */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="font-display text-3xl font-semibold">
          {money(sub.amount)}
          <span className="ml-1 text-base font-normal text-muted">
            / {cycleUnit[sub.billingCycle]}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {money(monthly)} per month · {money(monthly * 12)} per year
        </p>
        <p className="mt-4 text-[15px] font-medium">{daysText}</p>
      </section>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setShowEdit(true)} className={actionButton}>
          <Pencil size={16} /> Edit
        </button>

        {isActive && (
          <button onClick={() => change({ status: 'paused' })} disabled={busy} className={actionButton}>
            <Pause size={16} /> Pause
          </button>
        )}
        {isPaused && (
          <button onClick={() => change({ status: 'active' })} disabled={busy} className={actionButton}>
            <Play size={16} /> Resume
          </button>
        )}
        {(isActive || isPaused) && (
          <button onClick={() => change({ status: 'cancelled' })} disabled={busy} className={actionButton}>
            <Ban size={16} /> Cancel
          </button>
        )}
        {isCancelled && (
          <button onClick={() => change({ status: 'active' })} disabled={busy} className={actionButton}>
            <Play size={16} /> Reactivate
          </button>
        )}

        <button onClick={toggleArchive} disabled={busy} className={actionButton}>
          {isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {isArchived ? 'Restore' : 'Archive'}
        </button>

        <button
          onClick={() => setShowDelete(true)}
          className={`${actionButton} text-danger hover:bg-danger-soft`}
        >
          <Trash2 size={16} /> Delete
        </button>
      </div>
      {actionError && !showDelete && (
        <p className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {actionError}
        </p>
      )}

      {/* Upcoming billing dates */}
      {nextDates.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Upcoming payments</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {nextDates.map((date, i) => (
              <li key={date.toISOString()} className="flex items-center justify-between py-3">
                <span className="text-[15px]">
                  {format(date, 'EEEE, d MMMM yyyy')}
                  {i === 0 && <span className="ml-2 text-xs text-accent">Next</span>}
                </span>
                <span className="text-[15px] text-muted">{money(sub.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Information */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Information</h2>
        <dl className="mt-2 divide-y divide-line border-y border-line">
          <Row label="Category">
            <CategoryTag id={sub.category} />
          </Row>
          <Row label="Billing cycle">
            {sub.billingCycle.charAt(0).toUpperCase() + sub.billingCycle.slice(1)}
          </Row>
          <Row label="Amount">
            {money(sub.amount)} / {cycleUnit[sub.billingCycle]}
          </Row>
          <Row label="Next billing date">{formatDate(sub.nextBillingDate)}</Row>
          <Row label="Started on">{formatDate(sub.startedOn)}</Row>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Notes</h2>
        <p className="mt-2 whitespace-pre-line text-[15px] text-muted">
          {sub.notes || 'No notes added.'}
        </p>
      </section>

      {showEdit && (
        <Modal title="Edit subscription" onClose={() => setShowEdit(false)}>
          <SubscriptionForm record={sub} onClose={() => setShowEdit(false)} />
        </Modal>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete this subscription?"
          text={`“${sub.name}” will be permanently removed. This can't be undone. If you might need it again, archive it instead.`}
          confirmLabel="Delete"
          busy={busy}
          error={actionError}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDelete(false)
            setActionError('')
          }}
        />
      )}
    </div>
  )
}