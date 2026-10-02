import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Bell,
  CalendarDays,
  FileText,
  LayoutGrid,
  Moon,
  Repeat,
  Search,
  Settings,
  Sun,
} from 'lucide-react'
import { setPreference } from '../store/preferencesSlice'
import { selectAllRecords, selectCategoryMap } from '../store/selectors'

const PAGES = [
  { label: 'Overview', to: '/', icon: LayoutGrid, keys: ['G', 'O'] },
  { label: 'Documents', to: '/documents', icon: FileText, keys: ['G', 'D'] },
  { label: 'Subscriptions', to: '/subscriptions', icon: Repeat, keys: ['G', 'S'] },
  { label: 'Calendar', to: '/calendar', icon: CalendarDays, keys: ['G', 'C'] },
  { label: 'Reminders', to: '/reminders', icon: Bell, keys: ['G', 'R'] },
  { label: 'Settings', to: '/settings', icon: Settings, keys: ['G', 'P'] },
]

function Palette({ onClose }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const records = useSelector(selectAllRecords)
  const categoryMap = useSelector(selectCategoryMap)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef(null)

  const dark = document.documentElement.dataset.theme === 'dark'
  const q = query.trim().toLowerCase()

  const items = useMemo(() => {
    const list = []

    if (q) {
      records
        .filter((r) => r.status !== 'archived')
        .filter((r) =>
          [r.title, r.notes, r.extra, categoryMap[r.category]?.name]
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
        .slice(0, 6)
        .forEach((r) =>
          list.push({
            key: `${r.kind}-${r.id}`,
            group: 'Records',
            label: r.title,
            hint: `${r.kind === 'document' ? 'Document' : 'Subscription'} · ${
              categoryMap[r.category]?.name ?? ''
            }`,
            icon: r.kind === 'document' ? FileText : Repeat,
            run: () => navigate(r.kind === 'document' ? `/documents/${r.id}` : `/subscriptions/${r.id}`),
          })
        )

      list.push({
        key: 'search-all',
        group: 'Records',
        label: `See all results for “${query.trim()}”`,
        icon: Search,
        run: () => navigate(`/search?q=${encodeURIComponent(query.trim())}`),
      })
    } else {
      list.push({
        key: 'search-page',
        group: 'Search',
        label: 'Search all records',
        hint: 'Filter by type, category, status and date',
        icon: Search,
        run: () => navigate('/search'),
      })
    }

    PAGES.filter((p) => !q || p.label.toLowerCase().includes(q)).forEach((p) =>
      list.push({
        key: `page-${p.to}`,
        group: 'Go to',
        label: p.label,
        keys: p.keys,
        icon: p.icon,
        run: () => navigate(p.to),
      })
    )

    const themeLabel = `Switch to ${dark ? 'light' : 'dark'} theme`
    if (!q || themeLabel.toLowerCase().includes(q) || 'theme appearance'.includes(q)) {
      list.push({
        key: 'toggle-theme',
        group: 'Actions',
        label: themeLabel,
        icon: dark ? Sun : Moon,
        run: () => dispatch(setPreference({ theme: dark ? 'light' : 'dark' })),
      })
    }

    return list
  }, [q, query, records, categoryMap, dark, navigate, dispatch])

  const run = (item) => {
    onClose()
    item.run()
  }

  // Escape closes from anywhere inside the palette
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Keep the highlighted row visible while moving with the arrow keys
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, items])

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + items.length) % items.length)
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault()
      run(items[active])
    }
  }

  let lastGroup = null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="modal-enter w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-paper shadow-xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Search records or jump to a page…"
            aria-label="Search"
            className="w-full bg-transparent py-4 outline-none placeholder:text-muted"
          />
        </div>

        <ul ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.map((item, i) => {
            const Icon = item.icon
            const showGroup = item.group !== lastGroup
            lastGroup = item.group
            return (
              <li key={item.key} role="presentation">
                {showGroup && (
                  <p className="px-3 pb-1 pt-3 text-xs font-medium text-muted first:pt-1">
                    {item.group}
                  </p>
                )}
                <div
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(item)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${
                    i === active ? 'bg-accent-soft text-accent' : ''
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{item.label}</span>
                    {item.hint && (
                      <span className="block truncate text-[13px] text-muted">{item.hint}</span>
                    )}
                  </span>
                  {item.keys && (
                    <span className="flex shrink-0 gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted sm:flex">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  )
}

// The inner part is only mounted while open, so every opening starts fresh
export default function CommandPalette({ open, onClose }) {
  if (!open) return null
  return <Palette onClose={onClose} />
}