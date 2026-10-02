import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { format, parseISO } from 'date-fns'
import { ChevronRight, Search, FileText, SearchX, AlertTriangle, Plus } from 'lucide-react'
import { setSearch, setFilter, resetFilters, defaultFilters } from '../store/filtersSlice'
import { fetchDocuments } from '../store/documentsSlice'
import { selectCategories, selectFilteredRecords, selectFilters } from '../store/selectors'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import Modal from '../components/Modal'
import DocumentForm from '../components/DocumentForm'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
]

const expiryOptions = [
  { value: 'any', label: 'Any expiry' },
  { value: '7', label: 'Next 7 days' },
  { value: '30', label: 'Next 30 days' },
  { value: '90', label: 'Next 90 days' },
  { value: 'expired', label: 'Already expired' },
  { value: 'none', label: 'No expiry date' },
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

export default function Documents() {
  const dispatch = useDispatch()
  const [showForm, setShowForm] = useState(false)
  const { status, error } = useSelector((s) => s.documents)
  const filters = useSelector(selectFilters)
  const categories = useSelector(selectCategories).filter((c) => c.type === 'document')
  const results = useSelector(selectFilteredRecords).filter((r) => r.kind === 'document')

  // Start every visit to this page with clean filters, limited to documents
  useEffect(() => {
    dispatch(resetFilters())
    dispatch(setFilter({ key: 'type', value: 'document' }))
  }, [dispatch])

  const update = (key) => (value) => dispatch(setFilter({ key, value }))
  const hasFilters =
    filters.search !== '' ||
    ['category', 'status', 'expiry'].some((k) => filters[k] !== defaultFilters[k])

  const clearFilters = () => {
    dispatch(resetFilters())
    dispatch(setFilter({ key: 'type', value: 'document' }))
  }

  return (
    <div className="page-enter">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-2 text-muted">
            {status === 'succeeded'
              ? `${results.length} ${results.length === 1 ? 'record' : 'records'}`
              : 'Every record in one place.'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95"
        >
          <Plus size={18} /> Add document
        </button>
      </header>

      {/* Search and filters */}
      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search by title, provider, notes…"
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
          <FilterSelect value={filters.expiry} onChange={update('expiry')} options={expiryOptions} />
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
            title="Couldn't load your documents"
            text={error || 'Something went wrong. Please try again.'}
            actionLabel="Try again"
            onAction={() => dispatch(fetchDocuments())}
          />
        )}

        {status === 'succeeded' && results.length === 0 && (
          <EmptyState
            icon={hasFilters ? SearchX : FileText}
            title={hasFilters ? 'No matching documents' : 'No documents yet'}
            text={
              hasFilters
                ? 'Try a different search or loosen the filters.'
                : 'Add your first document to start keeping track of expiry dates.'
            }
            actionLabel={hasFilters ? 'Clear filters' : 'Add document'}
            onAction={hasFilters ? clearFilters : () => setShowForm(true)}
          />
        )}

        {status === 'succeeded' && results.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/documents/${r.id}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-medium">{r.title}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <CategoryTag id={r.category} />
                      {r.date && (
                        <span className="text-[13px] text-muted">
                          {format(parseISO(r.date), 'd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={r.status} date={r.date} />
                    <ChevronRight
                      size={18}
                      className="text-muted transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <Modal title="Add document" onClose={() => setShowForm(false)}>
          <DocumentForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}