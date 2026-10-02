import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { setSelectedDate } from '../store/calendarSlice'
import {
  selectDocuments,
  selectReminders,
  selectSelectedDate,
  selectSelectedDayEvents,
  selectSubscriptions,
} from '../store/selectors'
import { toISODate } from '../utils/dates'
import { getEventsInRange } from '../utils/events'
import { money } from '../utils/format'
import CategoryTag from '../components/CategoryTag'
import ListSkeleton from '../components/ListSkeleton'

// 1 = Monday. Change to 0 if you want weeks to start on Sunday.
const WEEK_STARTS_ON = 1
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DOT = {
  document: 'bg-warn',
  subscription: 'bg-accent',
  reminder: 'bg-[#4a5a8a]',
}

const LABEL_COLOR = {
  document: 'text-warn',
  subscription: 'text-accent',
  reminder: 'text-[#4a5a8a]',
}

function eventLink(event) {
  if (event.kind === 'document') return `/documents/${event.id}`
  if (event.kind === 'subscription') return `/subscriptions/${event.id}`
  return '/reminders'
}

export default function Calendar() {
  const dispatch = useDispatch()
  const selectedDate = useSelector(selectSelectedDate)
  const dayEvents = useSelector(selectSelectedDayEvents)
  const documents = useSelector(selectDocuments)
  const subscriptions = useSelector(selectSubscriptions)
  const reminders = useSelector(selectReminders)
  const docsStatus = useSelector((s) => s.documents.status)
  const subsStatus = useSelector((s) => s.subscriptions.status)

  // The month on screen is just a display detail, so it stays local
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(selectedDate)))

  // If the selected date changes from outside (e.g. command palette), follow it
  const [prevSelected, setPrevSelected] = useState(selectedDate)
  if (selectedDate !== prevSelected) {
    setPrevSelected(selectedDate)
    setViewMonth(startOfMonth(parseISO(selectedDate)))
  }

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(viewMonth), { weekStartsOn: WEEK_STARTS_ON }),
        end: endOfWeek(endOfMonth(viewMonth), { weekStartsOn: WEEK_STARTS_ON }),
      }),
    [viewMonth]
  )

  // Everything visible in the grid, grouped by date
  const eventsByDate = useMemo(() => {
    const events = getEventsInRange(
      documents,
      subscriptions,
      reminders,
      toISODate(days[0]),
      toISODate(days[days.length - 1])
    )
    const map = {}
    events.forEach((e) => {
      ;(map[e.date] ||= []).push(e)
    })
    return map
  }, [documents, subscriptions, reminders, days])

  const loading = ['idle', 'loading'].includes(docsStatus) || ['idle', 'loading'].includes(subsStatus)

  const selectDay = (day) => {
    dispatch(setSelectedDate(toISODate(day)))
    if (!isSameMonth(day, viewMonth)) setViewMonth(startOfMonth(day))
  }

  const goToday = () => {
    const today = new Date()
    dispatch(setSelectedDate(toISODate(today)))
    setViewMonth(startOfMonth(today))
  }

  const navButton =
    'rounded-xl p-2.5 text-muted transition hover:bg-black/5 hover:text-ink active:scale-95'

  return (
    <div className="page-enter">
      <header>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-2 text-muted">Renewals and expiries by date.</p>
      </header>

      {loading ? (
        <div className="mt-8">
          <ListSkeleton rows={5} />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Month grid */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold">
                {format(viewMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={goToday}
                  className="mr-1 rounded-xl px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent-soft"
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMonth((m) => subMonths(m, 1))}
                  aria-label="Previous month"
                  className={navButton}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                  aria-label="Next month"
                  className={navButton}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-muted">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const iso = toISODate(day)
                const events = eventsByDate[iso] || []
                const kinds = [...new Set(events.map((e) => e.kind))]
                const selected = iso === selectedDate
                const inMonth = isSameMonth(day, viewMonth)

                return (
                  <button
                    key={iso}
                    onClick={() => selectDay(day)}
                    aria-label={`${format(day, 'EEEE, d MMMM')}${
                      events.length ? `, ${events.length} items` : ''
                    }`}
                    aria-pressed={selected}
                    className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-[15px] transition active:scale-95 ${
                      selected
                        ? 'bg-accent font-semibold text-white'
                        : `hover:bg-black/5 ${inMonth ? 'text-ink' : 'text-muted/50'} ${
                            isToday(day) ? 'font-semibold ring-1 ring-accent' : ''
                          }`
                    }`}
                  >
                    <span>{format(day, 'd')}</span>
                    <span className="flex h-1.5 gap-1">
                      {kinds.map((k) => (
                        <span
                          key={k}
                          className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-white/80' : DOT[k]}`}
                        />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${DOT.document}`} /> Document expires
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${DOT.subscription}`} /> Subscription renews
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${DOT.reminder}`} /> Reminder
              </span>
            </div>
          </section>

          {/* Selected day */}
          <section>
            <h2 className="font-display text-xl font-semibold">
              {format(parseISO(selectedDate), 'EEEE, d MMMM')}
            </h2>

            {dayEvents.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <CalendarDays size={22} />
                </div>
                <p className="font-medium">Nothing on this day</p>
                <p className="mt-1 text-sm text-muted">
                  No expiries, renewals or reminders fall on this date.
                </p>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {dayEvents.map((e) => (
                  <li key={e.key}>
                    <Link
                      to={eventLink(e)}
                      className="group flex items-center justify-between gap-3 py-3.5 transition-colors hover:bg-black/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${LABEL_COLOR[e.kind]}`}>{e.label}</p>
                        <p
                          className={`mt-0.5 truncate text-[15px] font-medium ${
                            e.done ? 'text-muted line-through' : ''
                          }`}
                        >
                          {e.title}
                        </p>
                        {e.category && (
                          <div className="mt-1">
                            <CategoryTag id={e.category} />
                          </div>
                        )}
                      </div>
                      {e.amount != null && (
                        <span className="shrink-0 text-[15px] font-medium">{money(e.amount)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}