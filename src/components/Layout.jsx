import { useCallback, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  FileText,
  Repeat,
  CalendarDays,
  Bell,
  Search,
  Settings,
} from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import CommandPalette from './CommandPalette'
import useShortcuts from '../hooks/useShortcuts'
import { modKey } from '../utils/platform'

const nav = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout() {
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useShortcuts({ openPalette, navigate })

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col sticky top-0 h-screen border-r border-line px-5 py-8">
        <div className="font-display text-2xl font-semibold tracking-tight px-3 mb-6">
          Keepsafe
        </div>

        <button
          onClick={openPalette}
          className="mb-6 flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted transition hover:border-accent"
        >
          <Search size={16} />
          Search
          <kbd className="ml-auto rounded-md border border-line px-1.5 py-0.5 text-[11px]">
            {modKey} K
          </kbd>
        </button>

        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-black/5 hover:text-ink'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-4">
          <NotificationCenter variant="sidebar" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/95 px-5 py-2.5 backdrop-blur">
        <span className="font-display text-xl font-semibold tracking-tight">Keepsafe</span>
        <div className="flex items-center gap-1">
          <button
            onClick={openPalette}
            aria-label="Search"
            className="rounded-full p-2.5 text-ink transition hover:bg-black/5 active:scale-95"
          >
            <Search size={22} />
          </button>
          <NotificationCenter variant="top" />
        </div>
      </header>

      {/* Page content */}
      <main className="px-5 pt-6 pb-28 md:px-10 md:pt-8 md:pb-12 max-w-5xl w-full">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 flex justify-around border-t border-line bg-paper/95 backdrop-blur px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  )
}