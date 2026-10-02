import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addReminder, updateReminder } from '../store/remindersSlice'
import { selectDocuments, selectSubscriptions } from '../store/selectors'
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

// Pass `record` to edit an existing reminder; leave it out to add a new one.
export default function ReminderForm({ record, onClose }) {
  const dispatch = useDispatch()
  const documents = useSelector(selectDocuments)
  const subscriptions = useSelector(selectSubscriptions)
  const editing = Boolean(record)

  const currentTarget =
    record && record.targetId ? `${record.targetType}:${record.targetId}` : ''

  const [form, setForm] = useState({
    message: record?.message ?? '',
    date: record?.date ?? todayISO(),
    target: currentTarget,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  // Archived records are left out, unless this reminder is already linked to one
  const linkableDocs = documents.filter(
    (d) => d.status !== 'archived' || `document:${d.id}` === currentTarget
  )
  const linkableSubs = subscriptions.filter(
    (s) => s.status !== 'archived' || `subscription:${s.id}` === currentTarget
  )

  const validate = () => {
    const next = {}
    if (!form.message.trim()) next.message = 'Write what you want to be reminded about.'
    if (!form.date) next.date = 'Choose a date.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    let targetType = 'general'
    let targetId = null
    if (form.target) {
      const colon = form.target.indexOf(':')
      targetType = form.target.slice(0, colon)
      targetId = form.target.slice(colon + 1)
    }

    const payload = {
      message: form.message.trim(),
      date: form.date,
      targetType,
      targetId,
    }

    try {
      setSaving(true)
      setSubmitError('')
      if (editing) {
        await dispatch(updateReminder({ id: record.id, changes: payload })).unwrap()
      } else {
        await dispatch(addReminder({ ...payload, done: false })).unwrap()
      }
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Reminder" error={errors.message}>
        <input
          value={form.message}
          onChange={set('message')}
          placeholder="e.g. Compare quotes and renew insurance"
          autoFocus
          className={inputClass}
        />
      </Field>

      <Field label="Date" error={errors.date}>
        <input type="date" value={form.date} onChange={set('date')} className={inputClass} />
      </Field>

      <Field label="Linked to (optional)">
        <select value={form.target} onChange={set('target')} className={inputClass}>
          <option value="">Nothing, a general reminder</option>
          {linkableDocs.length > 0 && (
            <optgroup label="Documents">
              {linkableDocs.map((d) => (
                <option key={d.id} value={`document:${d.id}`}>
                  {d.title}
                </option>
              ))}
            </optgroup>
          )}
          {linkableSubs.length > 0 && (
            <optgroup label="Subscriptions">
              {linkableSubs.map((s) => (
                <option key={s.id} value={`subscription:${s.id}`}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </Field>

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
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add reminder'}
        </button>
      </div>
    </form>
  )
}