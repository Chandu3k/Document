import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { api } from '../api'
import { setPreference } from '../store/preferencesSlice'
import { resetNotifications } from '../store/notificationsSlice'
import { fetchDocuments } from '../store/documentsSlice'
import { fetchSubscriptions } from '../store/subscriptionsSlice'
import { fetchReminders } from '../store/remindersSlice'
import { selectExpiringSoon } from '../store/selectors'
import ConfirmDialog from '../components/ConfirmDialog'

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

const windowOptions = [7, 14, 30, 60, 90].map((n) => ({ value: n, label: `${n} days` }))

function Segmented({ label, value, options, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-2xl bg-black/5 p-1"
    >
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition active:scale-95 ${
              active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`}
          >
            {Icon && <Icon size={16} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Setting({ title, text, children }) {
  return (
    <section className="py-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-xl text-[15px] text-muted">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}

export default function Settings() {
  const dispatch = useDispatch()
  const { theme, reminderLeadDays } = useSelector((s) => s.preferences)
  const inWindow = useSelector(selectExpiringSoon).length

  const [showReset, setShowReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    try {
      setBusy(true)
      setError('')
      await api.resetData()
      dispatch(resetNotifications())
      await Promise.all([
        dispatch(fetchDocuments()),
        dispatch(fetchSubscriptions()),
        dispatch(fetchReminders()),
      ])
      setShowReset(false)
    } catch (err) {
      setError(err.message || 'Could not reset the data.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-enter">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted">Make it yours.</p>
      </header>

      <div className="mt-6 divide-y divide-line border-y border-line">
        <Setting
          title="Appearance"
          text="Choose a light or dark look, or let the app follow your device."
        >
          <Segmented
            label="Appearance"
            value={theme}
            options={themeOptions}
            onChange={(value) => dispatch(setPreference({ theme: value }))}
          />
        </Setting>

        <Setting
          title="Reminder window"
          text="How many days ahead the app should warn you about expiring documents and upcoming renewals. It applies to the Overview, the expiry badges and your notifications."
        >
          <Segmented
            label="Reminder window"
            value={reminderLeadDays}
            options={windowOptions}
            onChange={(value) => dispatch(setPreference({ reminderLeadDays: value }))}
          />
          <p className="mt-3 text-sm text-muted">
            Right now {inWindow} {inWindow === 1 ? 'document falls' : 'documents fall'} inside this
            window.
          </p>
        </Setting>

        <Setting
          title="Your data"
          text="Everything you add or change is saved in this browser only. Resetting brings back the original sample records and marks every notification as unread. Your appearance and reminder window stay as they are."
        >
          <button
            onClick={() => {
              setError('')
              setShowReset(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft active:scale-95"
          >
            <RotateCcw size={16} /> Reset demo data
          </button>
        </Setting>

        <Setting
          title="About"
          text="Keepsafe keeps your documents, subscriptions and reminders in one place. This is a demo, so the records are sample data and nothing leaves your browser."
        />
      </div>

      {showReset && (
        <ConfirmDialog
          title="Reset demo data?"
          text="All documents, subscriptions and reminders you added or changed will be replaced by the original sample data. This can't be undone."
          confirmLabel="Reset data"
          busyLabel="Resetting…"
          busy={busy}
          error={error}
          onConfirm={handleReset}
          onCancel={() => {
            setShowReset(false)
            setError('')
          }}
        />
      )}
    </div>
  )
}