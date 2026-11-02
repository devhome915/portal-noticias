import { Link } from 'react-router-dom'
import { NewsInteractionBar } from './NewsInteractionBar'
import { CategoryBadge } from './CategoryBadge'
import type { Article, ReactionType } from '../types/news'
import { getCategoryTheme } from '../utils/categoryTheme'
import { formatNewsDate } from '../utils/formatDate'

export function FeaturedArticle({
  article,
  isAuthenticated,
  onReact,
  onRemoveReaction,
  onOpenComments,
  onRequireLogin,
}: {
  article: Article
  isAuthenticated: boolean
  onReact: (articleId: number, reaction: ReactionType) => void
  onRemoveReaction: (articleId: number) => void
  onOpenComments: (slug: string) => void
  onRequireLogin: () => void
}) {
  return (
    <article className={`featured-story category-theme--${getCategoryTheme(article.categoria)}`}>
      <img src={article.imagemUrl} alt={article.titulo} />
      <div className="featured-copy">
        <CategoryBadge category={article.categoria} />
        <h1><Link to={`/noticias/${article.slug}`}>{article.titulo}</Link></h1>
        <p>{article.resumo}</p>
        <div className="story-meta">
          <span>{article.autor}</span>
          <time dateTime={article.dataPublicacao}>{formatNewsDate(article.dataPublicacao)}</time>
        </div>
        <div className="featured-social-wrap">
          <NewsInteractionBar
            article={article}
            isAuthenticated={isAuthenticated}
            onReact={(reaction) => onReact(article.id, reaction)}
            onRemoveReaction={() => onRemoveReaction(article.id)}
            onOpenComments={() => onOpenComments(article.slug)}
            onRequireLogin={onRequireLogin}
          />
        </div>
      </div>
    </article>
  )
}
