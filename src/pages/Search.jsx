import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { AlertTriangle, ChevronRight, Search as SearchIcon, SearchX } from 'lucide-react'
import { setSearch, setFilter, resetFilters, defaultFilters } from '../store/filtersSlice'
import { fetchDocuments } from '../store/documentsSlice'
import { fetchSubscriptions } from '../store/subscriptionsSlice'
import { selectCategories, selectFilteredRecords, selectFilters } from '../store/selectors'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'

const typeOptions = [
  { value: 'all', label: 'All types' },
  { value: 'document', label: 'Documents' },
  { value: 'subscription', label: 'Subscriptions' },
]

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
]

const dateOptions = [
  { value: 'any', label: 'Any expiry or renewal' },
  { value: '7', label: 'Next 7 days' },
  { value: '30', label: 'Next 30 days' },
  { value: '90', label: 'Next 90 days' },
  { value: 'expired', label: 'Already passed' },
  { value: 'none', label: 'No date' },
]

function FilterSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
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

export default function Search() {
  const dispatch = useDispatch()
  const [params] = useSearchParams()
  const q = params.get('q') || ''

  const docs = useSelector((s) => s.documents)
  const subs = useSelector((s) => s.subscriptions)
  const filters = useSelector(selectFilters)
  const categories = useSelector(selectCategories)
  const results = useSelector(selectFilteredRecords)

  // Start fresh each visit, using the ?q= text from the command palette if there is one
  useEffect(() => {
    dispatch(resetFilters())
    if (q) dispatch(setSearch(q))
  }, [dispatch, q])

  const loading = ['idle', 'loading'].includes(docs.status) || ['idle', 'loading'].includes(subs.status)
  const failed = docs.status === 'failed' || subs.status === 'failed'

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...categories
      .filter((c) => filters.type === 'all' || c.type === filters.type)
      .map((c) => ({ value: c.id, label: c.name })),
  ]

  const update = (key) => (value) => dispatch(setFilter({ key, value }))

  // Switching type drops a category that doesn't belong to the new type
  const changeType = (value) => {
    dispatch(setFilter({ key: 'type', value }))
    const current = categories.find((c) => c.id === filters.category)
    if (current && value !== 'all' && current.type !== value) {
      dispatch(setFilter({ key: 'category', value: 'all' }))
    }
  }

  const hasFilters =
    filters.search !== '' ||
    ['type', 'category', 'status', 'expiry'].some((k) => filters[k] !== defaultFilters[k])

  const clearFilters = () => dispatch(resetFilters())

  return (
    <div className="page-enter">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Search</h1>
        <p className="mt-2 text-muted">
          {loading || failed
            ? 'Find anything across your documents and subscriptions.'
            : `${results.length} ${results.length === 1 ? 'record' : 'records'}`}
        </p>
      </header>

      <div className="mt-6 space-y-3">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search titles, providers, notes…"
            aria-label="Search records"
            className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 outline-none transition focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Type" value={filters.type} onChange={changeType} options={typeOptions} />
          <FilterSelect
            label="Category"
            value={filters.category}
            onChange={update('category')}
            options={categoryOptions}
          />
          <FilterSelect label="Status" value={filters.status} onChange={update('status')} options={statusOptions} />
          <FilterSelect label="Date" value={filters.expiry} onChange={update('expiry')} options={dateOptions} />
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

      <div className="mt-6">
        {loading && <ListSkeleton />}

        {failed && (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn't load your records"
            text="Something went wrong. Please try again."
            actionLabel="Try again"
            onAction={() => {
              dispatch(fetchDocuments())
              dispatch(fetchSubscriptions())
            }}
          />
        )}

        {!loading && !failed && results.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={hasFilters ? 'No matching records' : 'No records yet'}
            text={
              hasFilters
                ? 'Try a different search or loosen the filters.'
                : 'Add a document or subscription and it will show up here.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={clearFilters}
          />
        )}

        {!loading && !failed && results.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {results.map((r) => {
              const isDoc = r.kind === 'document'
              let dateText = null
              if (isDoc) {
                dateText = r.date ? `Expires ${format(parseISO(r.date), 'd MMM yyyy')}` : 'No expiry date'
              } else if (r.status === 'active') {
                dateText = `Renews ${format(parseISO(r.date), 'd MMM yyyy')}`
              }

              return (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    to={isDoc ? `/documents/${r.id}` : `/subscriptions/${r.id}`}
                    className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-black/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[17px] font-medium">{r.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-muted">
                          {isDoc ? 'Document' : 'Subscription'}
                        </span>
                        <CategoryTag id={r.category} />
                        {dateText && <span className="text-[13px] text-muted">{dateText}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge kind={r.kind} status={r.status} date={r.date} />
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
    </div>
  )
}