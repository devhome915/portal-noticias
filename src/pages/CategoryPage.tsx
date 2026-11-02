import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { NewsInteractionBar } from '../components/NewsInteractionBar'
import { SiteHeader } from '../components/SiteHeader'
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
  const [searchParams] = useSearchParams()
  const search = searchParams.get('q')?.trim() ?? ''
  const requestedPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
    window.alert('A autenticação de leitores ainda não está disponível. Esta ação está desativada.')
  }

  return (
    <div className="page-shell">
      <SiteHeader categories={categories} />
      <main className="content-area">
        <div className="category-page-heading">
          <p className="eyebrow">{search ? 'Busca' : 'Categoria'}</p>
          <h1>{search ? `Resultados para “${search}”` : category?.name ?? 'Notícias'}</h1>
          <p>{category?.description ?? 'Acompanhe as notícias mais recentes do Portal.'}</p>
        </div>

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
            <section className="news-grid category-news-grid" aria-label="Notícias">
              {articles.map((article) => (
                <article key={article.id} className="news-card">
                  <img src={article.imagemUrl} alt={article.titulo} />
                  <div className="card-content">
                    <span className="story-tag">{article.categoria}</span>
                    <h2><Link to={`/noticias/${article.slug}`}>{article.titulo}</Link></h2>
                    <p>{article.resumo}</p>
                    <div className="story-meta">
                      <span>{article.fonte}</span>
                      <time dateTime={article.dataPublicacao}>
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(article.dataPublicacao))}
                      </time>
                    </div>
                    <NewsInteractionBar
                      article={article}
                      isAuthenticated={false}
                      onReact={(_reaction: ReactionType) => handleRequireLogin()}
                      onRemoveReaction={handleRequireLogin}
                      onOpenComments={() => navigate(`/noticias/${article.slug}#comentarios`)}
                      onRequireLogin={handleRequireLogin}
                    />
                  </div>
                </article>
              ))}
            </section>

            {totalPages > 1 ? (
              <nav className="pagination-controls" aria-label="Paginação de notícias">
                <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)}>Próxima</button>
              </nav>
            ) : null}
          </>
        )}
      </main>
    </div>
  )
}
