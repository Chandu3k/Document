import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, Check, FileText, Plus } from 'lucide-react'
import { fetchDocuments } from '../store/documentsSlice'
import { fetchSubscriptions } from '../store/subscriptionsSlice'
import {
  selectActiveSubscriptions,
  selectDocuments,
  selectExpiredDocuments,
  selectExpiringSoon,
  selectMonthlyTotal,
  selectRecentDocuments,
  selectSubscriptions,
  selectUpcomingRenewals,
} from '../store/selectors'
import { daysUntil } from '../utils/dates'
import { cycleUnit, money, relativeDays } from '../utils/format'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import SectionHeader from '../components/SectionHeader'
import Modal from '../components/Modal'
import DocumentForm from '../components/DocumentForm'
import SubscriptionForm from '../components/SubscriptionForm'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const rowClass =
  'group flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-black/[0.02]'

export default function Overview() {
  const dispatch = useDispatch()
  const [formType, setFormType] = useState(null) // 'document' | 'subscription' | null

  const docsState = useSelector((s) => s.documents)
  const subsState = useSelector((s) => s.subscriptions)
  const leadDays = useSelector((s) => s.preferences.reminderLeadDays)

  const documents = useSelector(selectDocuments)
  const subscriptions = useSelector(selectSubscriptions)
  const expired = useSelector(selectExpiredDocuments)
  const expiringSoon = useSelector(selectExpiringSoon)
  const renewals = useSelector(selectUpcomingRenewals)
  const activeSubs = useSelector(selectActiveSubscriptions)
  const recent = useSelector(selectRecentDocuments)
  const monthlyTotal = useSelector(selectMonthlyTotal)

  const loading =
    ['idle', 'loading'].includes(docsState.status) ||
    ['idle', 'loading'].includes(subsState.status)
  const failed = docsState.status === 'failed' || subsState.status === 'failed'

  const header = (
    <header>
      <p className="text-sm text-muted">{format(new Date(), 'EEEE, d MMMM')}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{greeting()}</h1>
    </header>
  )

  if (loading) {
    return (
      <div className="page-enter">
        {header}
        <div className="mt-8">
          <ListSkeleton rows={5} />
        </div>
      </div>
    )
  }

  if (failed) {
    return (
      <div className="page-enter">
        {header}
        <div className="mt-8">
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your overview"
            text="Something went wrong while loading your records. Please try again."
            actionLabel="Try again"
            onAction={() => {
              dispatch(fetchDocuments())
              dispatch(fetchSubscriptions())
            }}
          />
        </div>
      </div>
    )
  }

  if (documents.length === 0 && subscriptions.length === 0) {
    return (
      <div className="page-enter">
        {header}
        <div className="mt-8">
          <EmptyState
            icon={FileText}
            title="Nothing here yet"
            text="Add your first document or subscription and this page will keep you on top of every expiry and renewal."
            actionLabel="Add a document"
            onAction={() => setFormType('document')}
          />
        </div>
        {formType === 'document' && (
          <Modal title="Add document" onClose={() => setFormType(null)}>
            <DocumentForm onClose={() => setFormType(null)} />
          </Modal>
        )}
      </div>
    )
  }

  const sortedExpired = [...expired].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
  const attention = [...sortedExpired, ...expiringSoon]
  const dueTotal = renewals.reduce((sum, s) => sum + s.amount, 0)

  const summary =
    attention.length === 0
      ? 'Everything is in order. Nothing needs your attention right now.'
      : `${attention.length} ${attention.length === 1 ? 'thing needs' : 'things need'} your attention.`

  return (
    <div className="page-enter">
      {header}
      <p className="mt-2 text-muted">{summary}</p>

      {/* Quick actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setFormType('document')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95"
        >
          <Plus size={18} /> Add document
        </button>
        <button
          onClick={() => setFormType('subscription')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.03] active:scale-95"
        >
          <Plus size={18} /> Add subscription
        </button>
      </div>

      {/* Needs attention */}
      <section className="mt-10">
        <SectionHeader
          title="Needs attention"
          note={`Expired, or expiring within ${leadDays} days`}
          to="/documents"
        />
        {attention.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-4 text-accent">
            <Check size={20} />
            <span className="text-[15px] font-medium">All documents are up to date.</span>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {attention.map((d) => {
              const days = daysUntil(d.expiryDate)
              return (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className={rowClass}>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-medium">{d.title}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <CategoryTag id={d.category} />
                        <span className="text-[13px] text-muted">
                          {format(parseISO(d.expiryDate), 'd MMM yyyy')}
                          {' · '}
                          {relativeDays(days)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={d.status} date={d.expiryDate} soonDays={leadDays} />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Upcoming renewals */}
      <section className="mt-10">
        <SectionHeader
          title="Upcoming renewals"
          note={
            renewals.length > 0
              ? `${money(dueTotal)} due in the next ${leadDays} days`
              : `Nothing due in the next ${leadDays} days`
          }
          to="/subscriptions"
        />
        {renewals.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            No renewals coming up. Active subscriptions will appear here as their billing date nears.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {renewals.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link to={`/subscriptions/${s.id}`} className={rowClass}>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium">{s.name}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <CategoryTag id={s.category} />
                      <span className="text-[13px] text-muted">
                        {relativeDays(daysUntil(s.nextBillingDate))}
                        {' · '}
                        {format(parseISO(s.nextBillingDate), 'd MMM')}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[15px] font-medium">{money(s.amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {/* Active subscriptions */}
        <section>
          <SectionHeader
            title="Active subscriptions"
            note={`${activeSubs.length} plans · ${money(monthlyTotal)} per month`}
            to="/subscriptions"
          />
          {activeSubs.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No active subscriptions.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {activeSubs.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link to={`/subscriptions/${s.id}`} className={rowClass}>
                    <span className="truncate text-[15px] font-medium">{s.name}</span>
                    <span className="shrink-0 text-[13px] text-muted">
                      {money(s.amount)} / {cycleUnit[s.billingCycle]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recently added */}
        <section>
          <SectionHeader title="Recently added" note="Your latest documents" to="/documents" />
          {recent.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No documents yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {recent.map((d) => (
                <li key={d.id}>
                  <Link to={`/documents/${d.id}`} className={rowClass}>
                    <span className="truncate text-[15px] font-medium">{d.title}</span>
                    <span className="shrink-0 text-[13px] text-muted">
                      {format(parseISO(d.createdAt), 'd MMM')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {formType === 'document' && (
        <Modal title="Add document" onClose={() => setFormType(null)}>
          <DocumentForm onClose={() => setFormType(null)} />
        </Modal>
      )}
      {formType === 'subscription' && (
        <Modal title="Add subscription" onClose={() => setFormType(null)}>
          <SubscriptionForm onClose={() => setFormType(null)} />
        </Modal>
      )}
    </div>
  )
}