import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addSubscription, updateSubscription } from '../store/subscriptionsSlice'
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

// Pass `record` to edit an existing subscription; leave it out to add a new one.
export default function SubscriptionForm({ record, onClose }) {
  const dispatch = useDispatch()
  const categories = useSelector(selectCategories).filter((c) => c.type === 'subscription')
  const editing = Boolean(record)
  const archived = record?.status === 'archived'

  const [form, setForm] = useState({
    name: record?.name ?? '',
    category: record?.category ?? '',
    billingCycle: record?.billingCycle ?? 'monthly',
    amount: record?.amount ?? '',
    nextBillingDate: record?.nextBillingDate ?? '',
    status: record && !archived ? record.status : 'active',
    notes: record?.notes ?? '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter the service name.'
    if (!form.category) next.category = 'Choose a category.'
    if (!(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than 0.'
    if (!form.nextBillingDate) next.nextBillingDate = 'Choose the next billing date.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: form.name.trim(),
      category: form.category,
      billingCycle: form.billingCycle,
      amount: Number(form.amount),
      nextBillingDate: form.nextBillingDate,
      notes: form.notes.trim(),
    }

    try {
      setSaving(true)
      setSubmitError('')
      if (editing) {
        // An archived subscription keeps its archived status until it is restored
        const changes = archived ? payload : { ...payload, status: form.status }
        await dispatch(updateSubscription({ id: record.id, changes })).unwrap()
      } else {
        await dispatch(
          addSubscription({ ...payload, status: form.status, startedOn: todayISO() })
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
      <Field label="Name" error={errors.name}>
        <input
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Netflix"
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
        <Field label="Billing cycle">
          <select value={form.billingCycle} onChange={set('billingCycle')} className={inputClass}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <Field label="Amount (₹)" error={errors.amount}>
          <input
            type="number"
            min="0"
            step="any"
            value={form.amount}
            onChange={set('amount')}
            placeholder="649"
            className={inputClass}
          />
        </Field>
      </div>

      <div className={archived ? '' : 'grid grid-cols-2 gap-3'}>
        <Field label="Next billing date" error={errors.nextBillingDate}>
          <input
            type="date"
            value={form.nextBillingDate}
            onChange={set('nextBillingDate')}
            className={inputClass}
          />
        </Field>
        {!archived && (
          <Field label="Status">
            <select value={form.status} onChange={set('status')} className={inputClass}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Notes">
        <textarea
          rows={3}
          value={form.notes}
          onChange={set('notes')}
          placeholder="Plan, who shares it, anything worth remembering"
          className={inputClass}
        />
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
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add subscription'}
        </button>
      </div>
    </form>
  )
}