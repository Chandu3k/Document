import { useSelector } from 'react-redux'
import { selectCategoryMap } from '../store/selectors'

export default function CategoryTag({ id }) {
  const category = useSelector(selectCategoryMap)[id]
  if (!category) return null

  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  )
}