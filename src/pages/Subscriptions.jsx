import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronRight, Plus, Repeat, Search, SearchX } from 'lucide-react'
import { setSearch, setFilter, resetFilters, defaultFilters } from '../store/filtersSlice'
import { fetchSubscriptions } from '../store/subscriptionsSlice'
import {
  selectActiveSubscriptions,
  selectCategories,
  selectFilteredRecords,
  selectFilters,
  selectMonthlyTotal,
  selectSubscriptions,
} from '../store/selectors'
import { cycleUnit, money } from '../utils/format'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import Modal from '../components/Modal'
import SubscriptionForm from '../components/SubscriptionForm'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
]

const cycleOptions = [
  { value: 'all', label: 'Any cycle' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Stat({ label, value }) {
  return (
    <div className="px-3 py-3 first:pl-0 sm:px-6 sm:first:pl-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 font-display text-xl font-semibold sm:text-2xl">{value}</p>
    </div>
  )
}

export default function Subscriptions() {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)
  const { status, error } = useSelector((s) => s.subscriptions)
  const filters = useSelector(selectFilters)
  const categories = useSelector(selectCategories).filter((c) => c.type === 'subscription')
  const allSubs = useSelector(selectSubscriptions)
  const activeSubs = useSelector(selectActiveSubscriptions)
  const monthlyTotal = useSelector(selectMonthlyTotal)
  const records = useSelector(selectFilteredRecords).filter((r) => r.kind === 'subscription')

  // The filter results are the shared shape; look up the full subscription for each
  const results = useMemo(() => {
    const byId = Object.fromEntries(allSubs.map((s) => [s.id, s]))
    return records.map((r) => byId[r.id]).filter(Boolean)
  }, [records, allSubs])

  // Start every visit with clean filters, limited to subscriptions
  useEffect(() => {
    dispatch(resetFilters())
    dispatch(setFilter({ key: 'type', value: 'subscription' }))
  }, [dispatch])

  const update = (key) => (value) => dispatch(setFilter({ key, value }))
  const hasFilters =
    filters.search !== '' ||
    ['category', 'status', 'cycle'].some((k) => filters[k] !== defaultFilters[k])

  const clearFilters = () => {
    dispatch(resetFilters())
    dispatch(setFilter({ key: 'type', value: 'subscription' }))
  }

  return (
    <div className="page-enter">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Subscriptions</h1>
          <p className="mt-2 text-muted">What you pay for, and when.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95"
        >
          <Plus size={18} /> Add subscription
        </button>
      </header>

      {/* Summary */}
      {status === 'succeeded' && (
        <div className="mt-6 flex divide-x divide-line border-y border-line py-1">
          <Stat label="Per month" value={money(monthlyTotal)} />
          <Stat label="Per year" value={money(monthlyTotal * 12)} />
          <Stat label="Active plans" value={activeSubs.length} />
        </div>
      )}

      {/* Search and filters */}
      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search by name, notes…"
            className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 outline-none transition focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            value={filters.category}
            onChange={update('category')}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <FilterSelect value={filters.status} onChange={update('status')} options={statusOptions} />
          <FilterSelect value={filters.cycle} onChange={update('cycle')} options={cycleOptions} />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-accent transition hover:bg-accent-soft"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {(status === 'idle' || status === 'loading') && <ListSkeleton />}

        {status === 'failed' && (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your subscriptions"
            text={error || 'Something went wrong. Please try again.'}
            actionLabel="Try again"
            onAction={() => dispatch(fetchSubscriptions())}
          />
        )}

        {status === 'succeeded' && results.length === 0 && (
          <EmptyState
            icon={hasFilters ? SearchX : Repeat}
            title={hasFilters ? 'No matching subscriptions' : 'No subscriptions yet'}
            text={
              hasFilters
                ? 'Try a different search or loosen the filters.'
                : 'Add a subscription to see what you pay and when it renews.'
            }
            actionLabel={hasFilters ? 'Clear filters' : 'Add subscription'}
            onAction={hasFilters ? clearFilters : () => setShowForm(true)}
          />
        )}

        {status === 'succeeded' && results.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {results.map((s) => {
              const dimmed = s.status === 'paused' || s.status === 'cancelled' || s.status === 'archived'
              return (
                <li key={s.id}>
                  <Link
                    to={`/subscriptions/${s.id}`}
                    className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-black/[0.02]"
                  >
                    <div className={`min-w-0 ${dimmed ? 'opacity-60' : ''}`}>
                      <p className="truncate text-[17px] font-medium">{s.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <CategoryTag id={s.category} />
                        <span className="text-[13px] text-muted">
                          {money(s.amount)} / {cycleUnit[s.billingCycle]}
                        </span>
                        {s.status === 'active' && (
                          <span className="text-[13px] text-muted">
                            Next {format(parseISO(s.nextBillingDate), 'd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge kind="subscription" status={s.status} />
                      <ChevronRight
                        size={18}
                        className="text-muted transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showForm && (
        <Modal title="Add subscription" onClose={() => setShowForm(false)}>
          <SubscriptionForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}