import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Plus, X } from 'lucide-react'
import { addDocument, updateDocument } from '../store/documentsSlice'
import { selectCategories } from '../store/selectors'
import { todayISO } from '../utils/dates'

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none transition focus:border-accent'

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

// Pass `record` to edit an existing document; leave it out to add a new one.
export default function DocumentForm({ record, onClose }) {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories).filter((c) => c.type === 'document')
  const editing = Boolean(record)

  const [form, setForm] = useState({
    title: record?.title ?? '',
    category: record?.category ?? '',
    issueDate: record?.issueDate ?? todayISO(),
    expiryDate: record?.expiryDate ?? '',
    notes: record?.notes ?? '',
  })
  const [details, setDetails] = useState(
    Object.entries(record?.metadata ?? {}).map(([key, value]) => ({ key, value }))
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const setDetail = (index, field, value) =>
    setDetails((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)))

  const validate = () => {
    const next = {}
    if (!form.title.trim()) next.title = 'Give this document a title.'
    if (!form.category) next.category = 'Choose a category.'
    if (form.expiryDate && form.issueDate && form.expiryDate < form.issueDate) {
      next.expiryDate = 'Expiry must be after the issue date.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      title: form.title.trim(),
      category: form.category,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      notes: form.notes.trim(),
      metadata: Object.fromEntries(
        details.filter((d) => d.key.trim()).map((d) => [d.key.trim(), d.value.trim()])
      ),
    }

    try {
      setSaving(true)
      setSubmitError('')
      if (editing) {
        await dispatch(updateDocument({ id: record.id, changes: payload })).unwrap()
      } else {
        await dispatch(
          addDocument({ ...payload, status: 'active', createdAt: todayISO() })
        ).unwrap()
      }
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Title" error={errors.title}>
        <input
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Car Insurance"
          autoFocus
          className={inputClass}
        />
      </Field>

      <Field label="Category" error={errors.category}>
        <select value={form.category} onChange={set('category')} className={inputClass}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Issue date">
          <input type="date" value={form.issueDate} onChange={set('issueDate')} className={inputClass} />
        </Field>
        <Field label="Expiry date (optional)" error={errors.expiryDate}>
          <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className={inputClass} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          rows={3}
          value={form.notes}
          onChange={set('notes')}
          placeholder="Anything worth remembering"
          className={inputClass}
        />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-medium">Details</span>
        <div className="space-y-2">
          {details.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.key}
                onChange={(e) => setDetail(i, 'key', e.target.value)}
                placeholder="Label (e.g. Provider)"
                className={`${inputClass} w-2/5`}
              />
              <input
                value={row.value}
                onChange={(e) => setDetail(i, 'value', e.target.value)}
                placeholder="Value"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setDetails((rows) => rows.filter((_, idx) => idx !== i))}
                aria-label="Remove detail"
                className="rounded-xl px-2 text-muted transition hover:bg-black/5 hover:text-danger"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDetails((rows) => [...rows, { key: '', value: '' }])}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent"
        >
          <Plus size={16} /> Add detail
        </button>
      </div>

      {submitError && (
        <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{submitError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-black/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add document'}
        </button>
      </div>
    </form>
  )
}