import { getCategoryTheme } from '../utils/categoryTheme'

export function CategoryBadge({ category, className = '' }: { category: string; className?: string }) {
  return (
    <span className={`story-tag category-theme--${getCategoryTheme(category)} ${className}`.trim()}>
      {category}
    </span>
  )
}
