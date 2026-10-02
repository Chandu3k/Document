import { useParams } from 'react-router-dom'

export default function Placeholder({ title, subtitle }) {
  const { id } = useParams()
  return (
    <div className="page-enter">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-muted">
        {subtitle}
        {id ? ` (id: ${id})` : ''}
      </p>
    </div>
  )
}