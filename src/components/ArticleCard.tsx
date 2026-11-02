import { Link } from 'react-router-dom'
import { NewsInteractionBar } from './NewsInteractionBar'
import { CategoryBadge } from './CategoryBadge'
import type { Article, ReactionType } from '../types/news'
import { getCategoryTheme } from '../utils/categoryTheme'
import { formatNewsDate } from '../utils/formatDate'

export type ArticleCardActions = {
  isAuthenticated: boolean
  onReact: (articleId: number, reaction: ReactionType) => void
  onRemoveReaction: (articleId: number) => void
  onOpenComments: (slug: string) => void
  onRequireLogin: () => void
}

type ArticleCardProps = ArticleCardActions & {
  article: Article
  byline?: 'author' | 'source'
}

export function ArticleCard({ article, byline = 'author', ...actions }: ArticleCardProps) {
  const metaLabel = byline === 'source' ? article.fonte : article.autor

  return (
    <article className={`news-card category-theme--${getCategoryTheme(article.categoria)}`}>
      <img src={article.imagemUrl} alt={article.titulo} loading="lazy" />
      <div className="card-content">
        <CategoryBadge category={article.categoria} />
        <h2><Link to={`/noticias/${article.slug}`}>{article.titulo}</Link></h2>
        <p>{article.resumo}</p>
        <div className="story-meta">
          <span>{metaLabel}</span>
          <time dateTime={article.dataPublicacao}>{formatNewsDate(article.dataPublicacao)}</time>
        </div>
        <NewsInteractionBar
          article={article}
          isAuthenticated={actions.isAuthenticated}
          onReact={(reaction) => actions.onReact(article.id, reaction)}
          onRemoveReaction={() => actions.onRemoveReaction(article.id)}
          onOpenComments={() => actions.onOpenComments(article.slug)}
          onRequireLogin={actions.onRequireLogin}
        />
      </div>
    </article>
  )
}

export function ArticleGrid({
  articles,
  className = '',
  byline = 'author',
  ...actions
}: ArticleCardActions & { articles: Article[]; className?: string; byline?: 'author' | 'source' }) {
  return (
    <section className={`news-grid ${className}`.trim()} aria-label="Notícias">
      {articles.map((article) => <ArticleCard key={article.id} article={article} byline={byline} {...actions} />)}
    </section>
  )
}
