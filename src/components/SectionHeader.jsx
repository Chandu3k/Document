import { Link } from 'react-router-dom'

export default function SectionHeader({ title, note, to, linkLabel = 'View all' }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-sm font-medium text-accent hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  )
}