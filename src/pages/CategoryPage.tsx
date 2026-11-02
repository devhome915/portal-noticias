import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ArticleGrid } from '../components/ArticleCard'
import { SiteLayout } from '../components/SiteLayout'
import { getCategoryTheme } from '../utils/categoryTheme'
import type { Article, NewsCategory, ReactionType } from '../types/news'

type NewsResponse = {
  success: boolean
  data?: Article[]
  pagination?: {
    page: number
    totalPages: number
    total: number
  }
  message?: string
}

export function CategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const search = searchParams.get('q')?.trim() ?? ''
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [interactionError, setInteractionError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const category = categories.find((item) => item.slug === slug)

  useEffect(() => {
    let active = true

    const loadPage = async () => {
      setLoading(true)
      setError('')
      setNotFound(false)

      try {
        const categoriesResponse = await fetch('/api/categories')
        const categoriesResult = await categoriesResponse.json()
        if (!categoriesResponse.ok || !categoriesResult.success) {
          throw new Error(categoriesResult.message ?? 'Não foi possível carregar as categorias.')
        }

        const availableCategories = categoriesResult.data as NewsCategory[]
        const selectedCategory = availableCategories.find((item) => item.slug === slug)

        if (slug && !selectedCategory) {
          if (active) {
            setCategories(availableCategories)
            setNotFound(true)
          }
          return
        }

        const query = new URLSearchParams({ page: String(page), limit: '9' })
        if (selectedCategory) {
          query.set('category', selectedCategory.name)
        }
        if (search) {
          query.set('search', search)
        }

        const newsResponse = await fetch(`/api/news?${query.toString()}`)
        const newsResult = (await newsResponse.json()) as NewsResponse
        if (!newsResponse.ok || !newsResult.success) {
          throw new Error(newsResult.message ?? 'Não foi possível carregar as notícias.')
        }

        if (active) {
          setCategories(availableCategories)
          setArticles(newsResult.data ?? [])
          setTotalPages(newsResult.pagination?.totalPages ?? 1)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as notícias.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadPage()
    return () => {
      active = false
    }
  }, [page, search, slug])

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(nextPage))
    navigate(`${slug ? `/categorias/${slug}` : '/busca'}?${params.toString()}`)
  }

  const handleRequireLogin = () => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    navigate(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const handleReact = async (articleId: number, reaction: ReactionType) => {
    try {
      const response = await fetch(`/api/news/${articleId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reaction }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível salvar sua reação.')
      setArticles((current) => current.map((article) => article.id === articleId ? { ...article, reactions: result.data } : article))
      setInteractionError('')
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível salvar sua reação.')
    }
  }

  const handleRemoveReaction = async (articleId: number) => {
    try {
      const response = await fetch(`/api/news/${articleId}/reactions`, { method: 'DELETE', credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível remover sua reação.')
      setArticles((current) => current.map((article) => article.id === articleId ? { ...article, reactions: result.data } : article))
      setInteractionError('')
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível remover sua reação.')
    }
  }

  return (
    <SiteLayout categories={categories} contentClassName={`category-theme--${getCategoryTheme(category?.name ?? 'Brasil')}`}>
        <div className="category-page-heading">
          <p className="eyebrow">{search ? 'Busca' : 'Categoria'}</p>
          <h1>{search ? `Resultados para “${search}”` : category?.name ?? 'Notícias'}</h1>
          <p>{category?.description ?? 'Acompanhe as notícias mais recentes do Portal.'}</p>
        </div>

        {interactionError ? <p className="admin-error" role="alert">{interactionError}</p> : null}

        {loading ? (
          <section className="status-panel empty" aria-live="polite">
            <h2>Carregando notícias...</h2>
          </section>
        ) : notFound ? (
          <section className="status-panel empty" aria-live="polite">
            <h2>Categoria não encontrada.</h2>
            <Link to="/" className="secondary-link">Voltar para a home</Link>
          </section>
        ) : error ? (
          <section className="status-panel error" aria-live="polite">
            <h2>Não foi possível carregar as notícias.</h2>
            <p>{error}</p>
          </section>
        ) : articles.length === 0 ? (
          <section className="status-panel empty" aria-live="polite">
            <h2>Nenhuma notícia encontrada.</h2>
            <p>{category?.name === 'Games' ? 'Ainda não há notícias publicadas em Games.' : 'Tente outra busca ou categoria.'}</p>
          </section>
        ) : (
          <>
            <ArticleGrid
              articles={articles}
              className="category-news-grid"
              byline="source"
              isAuthenticated={Boolean(user)}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onOpenComments={(articleSlug) => navigate(`/noticias/${articleSlug}#comentarios`)}
              onRequireLogin={handleRequireLogin}
            />

            {totalPages > 1 ? (
              <nav className="pagination-controls" aria-label="Paginação de notícias">
                <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>Próxima</button>
              </nav>
            ) : null}
          </>
        )}
    </SiteLayout>
  )
}
