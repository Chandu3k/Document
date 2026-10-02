import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  FileQuestion,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react'
import { deleteDocument, fetchDocuments, updateDocument } from '../store/documentsSlice'
import { daysUntil } from '../utils/dates'
import CategoryTag from '../components/CategoryTag'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import ListSkeleton from '../components/ListSkeleton'
import Modal from '../components/Modal'
import DocumentForm from '../components/DocumentForm'
import ConfirmDialog from '../components/ConfirmDialog'

const formatDate = (iso) => (iso ? format(parseISO(iso), 'd MMMM yyyy') : '—')

// "policyNumber" -> "Policy number"
function prettyLabel(key) {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 py-3 sm:grid-cols-[170px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-[15px]">{children}</dd>
    </div>
  )
}

export default function DocumentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, status, error } = useSelector((s) => s.documents)
  const leadDays = useSelector((s) => s.preferences.reminderLeadDays)

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const doc = items.find((d) => d.id === id)

  if (status === 'idle' || status === 'loading') return <ListSkeleton rows={4} />

  if (status === 'failed') {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load this document"
        text={error || 'Something went wrong. Please try again.'}
        actionLabel="Try again"
        onAction={() => dispatch(fetchDocuments())}
      />
    )
  }

  if (!doc) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Document not found"
        text="It may have been deleted, or the link is wrong."
        actionLabel="Back to documents"
        onAction={() => navigate('/documents')}
      />
    )
  }

  const archived = doc.status === 'archived'
  const days = daysUntil(doc.expiryDate)
  const details = Object.entries(doc.metadata || {})

  // How much of the validity period has already passed (0–100)
  let progress = null
  if (doc.issueDate && doc.expiryDate) {
    const total = differenceInCalendarDays(parseISO(doc.expiryDate), parseISO(doc.issueDate))
    const elapsed = differenceInCalendarDays(new Date(), parseISO(doc.issueDate))
    progress = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 100
  }

  const barColor = days === null ? 'bg-accent' : days < 0 ? 'bg-danger' : days <= leadDays ? 'bg-warn' : 'bg-accent'

  let daysText = 'No expiry date'
  if (days !== null) {
    if (days < 0) daysText = `Expired ${-days} ${-days === 1 ? 'day' : 'days'} ago`
    else if (days === 0) daysText = 'Expires today'
    else daysText = `${days} ${days === 1 ? 'day' : 'days'} left`
  }

  const toggleArchive = async () => {
    try {
      setBusy(true)
      setActionError('')
      await dispatch(
        updateDocument({ id: doc.id, changes: { status: archived ? 'active' : 'archived' } })
      ).unwrap()
    } catch (err) {
      setActionError(err.message || 'Could not update the document.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    try {
      setBusy(true)
      setActionError('')
      await dispatch(deleteDocument(doc.id)).unwrap()
      navigate('/documents', { replace: true })
    } catch (err) {
      setActionError(err.message || 'Could not delete the document.')
      setBusy(false)
    }
  }

  const actionButton =
    'inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.03] active:scale-95 disabled:opacity-60'

  return (
    <div className="page-enter">
      <Link
        to="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} /> Documents
      </Link>

      {/* Title block */}
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <CategoryTag id={doc.category} />
          <StatusBadge status={doc.status} date={doc.expiryDate} soonDays={leadDays} />
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{doc.title}</h1>
      </header>

      {/* Validity */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="text-lg font-medium">{daysText}</p>
        {progress !== null && (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted">
              <span>{formatDate(doc.issueDate)}</span>
              <span>{formatDate(doc.expiryDate)}</span>
            </div>
          </>
        )}
      </section>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setShowEdit(true)} className={actionButton}>
          <Pencil size={16} /> Edit
        </button>
        <button onClick={toggleArchive} disabled={busy} className={actionButton}>
          {archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {archived ? 'Restore' : 'Archive'}
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

      {/* Information */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Information</h2>
        <dl className="mt-2 divide-y divide-line border-y border-line">
          <Row label="Category">
            <CategoryTag id={doc.category} />
          </Row>
          <Row label="Issue date">{formatDate(doc.issueDate)}</Row>
          <Row label="Expiry date">{formatDate(doc.expiryDate)}</Row>
          {details.map(([key, value]) => (
            <Row key={key} label={prettyLabel(key)}>
              {value || '—'}
            </Row>
          ))}
          <Row label="Added on">{formatDate(doc.createdAt)}</Row>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Notes</h2>
        <p className="mt-2 whitespace-pre-line text-[15px] text-muted">
          {doc.notes || 'No notes added.'}
        </p>
      </section>

      {/* Dummy file preview */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">File</h2>
        <div className="mt-3 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          <div className="flex h-24 w-[72px] shrink-0 flex-col gap-1.5 rounded-lg border border-line bg-paper p-2.5 shadow-sm">
            <FileText size={16} className="text-accent" />
            <div className="h-1 w-full rounded bg-black/10" />
            <div className="h-1 w-4/5 rounded bg-black/10" />
            <div className="h-1 w-full rounded bg-black/10" />
            <div className="h-1 w-3/5 rounded bg-black/10" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{slug(doc.title)}.pdf</p>
            <p className="mt-0.5 text-sm text-muted">Sample file · PDF · 240 KB</p>
            <p className="mt-2 text-xs text-muted">
              Real uploads can replace this preview later.
            </p>
          </div>
        </div>
      </section>

      {showEdit && (
        <Modal title="Edit document" onClose={() => setShowEdit(false)}>
          <DocumentForm record={doc} onClose={() => setShowEdit(false)} />
        </Modal>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete this document?"
          text={`“${doc.title}” will be permanently removed. This can't be undone. If you might need it again, archive it instead.`}
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