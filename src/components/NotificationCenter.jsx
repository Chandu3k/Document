import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AlertTriangle, Bell, Check, FileText, Repeat } from 'lucide-react'
import { markAllRead, markRead } from '../store/notificationsSlice'
import { selectNotifications, selectUnreadCount } from '../store/notificationSelectors'

const ICON = { document: FileText, subscription: Repeat, reminder: Bell }

const TONE = {
  danger: 'bg-danger-soft text-danger',
  warn: 'bg-warn-soft text-warn',
  neutral: 'bg-accent-soft text-accent',
}

// variant="sidebar" for the desktop sidebar, variant="top" for the mobile header
export default function NotificationCenter({ variant = 'sidebar' }) {
  const dispatch = useDispatch()
  const items = useSelector(selectNotifications)
  const unread = useSelector(selectUnreadCount)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const panelPosition =
    variant === 'sidebar'
      ? 'bottom-full left-0 mb-2 w-[340px]'
      : 'right-0 top-full mt-2 w-[min(340px,calc(100vw-2.5rem))]'

  return (
    <div ref={ref} className="relative">
      {variant === 'sidebar' ? (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-muted transition-colors hover:bg-black/5 hover:text-ink"
        >
          <Bell size={18} />
          Notifications
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          className="relative rounded-full p-2.5 text-ink transition hover:bg-black/5 active:scale-95"
        >
          <Bell size={22} />
          {unread > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className={`modal-enter absolute z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl ${panelPosition}`}
        >
          <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <h2 className="font-display text-lg font-semibold">Notifications</h2>
            <button
              onClick={() => dispatch(markAllRead(items.map((n) => n.id)))}
              disabled={unread === 0}
              className="text-sm font-medium text-accent transition hover:underline disabled:text-muted disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Check size={22} />
              </div>
              <p className="font-medium">You're all caught up</p>
              <p className="mt-1 text-sm text-muted">Nothing needs your attention right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((n) => {
                const Icon = n.tone === 'danger' ? AlertTriangle : ICON[n.kind]
                return (
                  <li key={n.id}>
                    <Link
                      to={n.to}
                      onClick={() => {
                        dispatch(markRead(n.id))
                        setOpen(false)
                      }}
                      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-black/[0.03]"
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE[n.tone]}`}
                      >
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[15px] ${
                            n.read ? 'text-muted' : 'font-medium'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-muted">{n.text}</span>
                      </span>
                      {!n.read && (
                        <span
                          aria-label="Unread"
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}