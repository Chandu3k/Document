import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <EmptyState
      icon={FileQuestion}
      title="Page not found"
      text="That page doesn't exist, or it has moved."
      actionLabel="Go to overview"
      onAction={() => navigate('/')}
    />
  )
}