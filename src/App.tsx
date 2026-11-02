import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { getDisplayName } from './auth/userDisplay'
import { ArticleGrid } from './components/ArticleCard'
import { CategoryBadge } from './components/CategoryBadge'
import { CommentThread, type ThreadComment } from './components/CommentThread'
import { FeaturedArticle } from './components/FeaturedArticle'
import { NewsInteractionBar } from './components/NewsInteractionBar'
import { SiteLayout } from './components/SiteLayout'
import { CategoryPage } from './pages/CategoryPage'
import type { Article, NewsCategory, ReactionSummary, ReactionType } from './types/news'
import { getCategoryTheme } from './utils/categoryTheme'
import { formatNewsDate } from './utils/formatDate'

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  categories?: NewsCategory[]
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.text()

  if ([502, 504].includes(response.status)) {
    throw new Error(
      `A API está indisponível (HTTP ${response.status}). Inicie o backend com "npm run dev" e tente novamente.`,
    )
  }

  let data: ApiResponse<T>

  try {
    data = JSON.parse(body) as ApiResponse<T>
  } catch {
    throw new Error(`A API retornou uma resposta inválida (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    throw new Error(data.message ?? `A solicitação falhou (HTTP ${response.status}).`)
  }

  return data
}

const formatStatusLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

function PublicPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [interactionError, setInteractionError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [newsRequestVersion, setNewsRequestVersion] = useState(0)
  const loadingTimerRef = useRef<number | null>(null)

  const isAuthenticated = Boolean(user)

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)

      try {
        const response = await fetch('/api/news?page=1&limit=9')
        const data = await readApiResponse<Article[]>(response)

        if (!data.success) {
          throw new Error(data.message ?? 'Não foi possível carregar as notícias.')
        }
        if (!data.categories) {
          throw new Error('A API não retornou as categorias do portal.')
        }

        setArticles(data.data ?? [])
        setCategories(data.categories)
        setError('')
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar as notícias.')
      } finally {
        setLoading(false)
      }
    }

    void fetchNews()
  }, [newsRequestVersion])

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearTimeout(loadingTimerRef.current)
      }
    }
  }, [])

  const triggerLoading = () => {
    setIsLoadingCards(true)

    if (loadingTimerRef.current !== null) {
      window.clearTimeout(loadingTimerRef.current)
    }

    loadingTimerRef.current = window.setTimeout(() => setIsLoadingCards(false), 180)
  }

  const filteredArticles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return articles.filter((article) => {
      const matchesCategory = selectedCategory === 'Todas' || article.categoria === selectedCategory
      const searchableText = `${article.titulo} ${article.resumo} ${article.conteudo}`.toLowerCase()
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [articles, searchTerm, selectedCategory])

  const featuredArticle = filteredArticles.find((article) => article.destaque) ?? filteredArticles[0]
  const sideArticles = filteredArticles.filter((article) => article.id !== featuredArticle?.id)

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
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível remover sua reação.')
    }
  }

  const handleOpenComments = (slug: string) => {
    navigate(`/noticias/${slug}#comentarios`)
  }

  const handleRequireLogin = () => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    navigate(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  if (loading) {
    return (
      <div className="page-shell" aria-live="polite">
        <div className="status-panel empty">
          <h2>Carregando portal...</h2>
          <p>Preparando as notícias mais relevantes.</p>
        </div>
      </div>
    )
  }

  return (
    <SiteLayout categories={categories}>
        <section className="toolbar" aria-label="Busca e filtros">
          <label className="search-field" htmlFor="news-search">
            <span className="sr-only">Buscar notícias</span>
            <input
              id="news-search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                triggerLoading()
              }}
              placeholder="Buscar por título, resumo ou conteúdo"
            />
          </label>
          <button
            type="button"
            className="primary-button small"
            disabled={!searchTerm.trim()}
            onClick={() => navigate(`/busca?q=${encodeURIComponent(searchTerm.trim())}`)}
          >
            Buscar
          </button>
          <div className="toolbar-meta">
            <span>{filteredArticles.length} notícias</span>
            <span>Atualizado hoje</span>
          </div>
        </section>

        <div className="category-bar" aria-label="Categorias de notícias">
          {['Todas', ...categories.map((category) => category.name)].map((category) => (
            <button
              key={category}
              type="button"
                className={`category-pill category-theme--${getCategoryTheme(category === 'Todas' ? 'Brasil' : category)}${category === selectedCategory ? ' active' : ''}`}
              onClick={() => {
                setSelectedCategory(category)
                triggerLoading()
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {interactionError ? <p className="admin-error" role="alert">{interactionError}</p> : null}

        {error ? (
          <section className="status-panel error" aria-live="polite">
            <h2>Não foi possível carregar as notícias.</h2>
            <p>{error}</p>
            <button
              type="button"
              className="primary-button small"
              onClick={() => {
                setError('')
                setLoading(true)
                setNewsRequestVersion((version) => version + 1)
              }}
            >
              Tentar novamente
            </button>
          </section>
        ) : isLoadingCards ? (
          <section className="loading-grid" aria-live="polite" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            ))}
          </section>
        ) : filteredArticles.length === 0 ? (
          <section className="status-panel empty" aria-live="polite">
            <h2>Nenhuma notícia encontrada.</h2>
            <p>Tente outro termo de busca ou uma categoria diferente.</p>
          </section>
        ) : (
          <>
            {featuredArticle ? (
              <FeaturedArticle
                article={featuredArticle}
                isAuthenticated={isAuthenticated}
                onReact={handleReact}
                onRemoveReaction={handleRemoveReaction}
                onOpenComments={handleOpenComments}
                onRequireLogin={handleRequireLogin}
              />
            ) : null}

            <ArticleGrid
              articles={sideArticles}
              className="home-news-grid"
              isAuthenticated={isAuthenticated}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onOpenComments={handleOpenComments}
              onRequireLogin={handleRequireLogin}
            />
          </>
        )}
    </SiteLayout>
  )
}

function NewsDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [pendingCommentReactions, setPendingCommentReactions] = useState<Set<number>>(() => new Set())
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState<number | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [interactionError, setInteractionError] = useState('')

  const currentUser = user?.email ?? null
  const currentDisplayName = user ? getDisplayName(user.username, user.email) : undefined

  const fetchArticle = async () => {
    if (!slug) {
      return
    }

    try {
      const response = await fetch(`/api/news/slug/${slug}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Notícia não encontrada.')
      }

      setArticle(data.data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Notícia não encontrada.')
    }
  }

  const fetchComments = async (nextPage = 1) => {
    if (!article?.id) {
      return
    }

    const response = await fetch(`/api/news/${article.id}/comments?page=${nextPage}&limit=10`, { credentials: 'same-origin' })
    const data = await response.json()

    if (!response.ok || !data.success) {
      return
    }

    setComments(data.data.items ?? [])
    setTotalPages(data.data.totalPages ?? 1)
  }

  const fetchRelated = async () => {
    const [response, categoriesResponse] = await Promise.all([
      fetch('/api/news?page=1&limit=6'),
      fetch('/api/categories'),
    ])
    const [data, categoriesData] = await Promise.all([response.json(), categoriesResponse.json()])
    if (response.ok && data.success) setRelated((data.data ?? []).filter((item: Article) => item.slug !== slug))
    if (categoriesResponse.ok && categoriesData.success) setCategories(categoriesData.data ?? [])
  }

  useEffect(() => {
    void fetchArticle()
    void fetchRelated()
  }, [slug])

  useEffect(() => {
    if (!article) {
      return
    }

    void fetchComments(page)
  }, [article, page])

  useEffect(() => {
    if (!article || !location.hash) {
      return
    }

    const el = document.getElementById('comentarios')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [article, location.hash])

  useEffect(() => {
    if (article) {
      setLoading(false)
    }
  }, [article])

  const handleReact = async (reaction: ReactionType) => {
    if (!article) return
    try {
      const response = await fetch(`/api/news/${article.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ reaction }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível salvar sua reação.')
      setArticle((current) => current ? { ...current, reactions: result.data } : current)
      setInteractionError('')
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível salvar sua reação.')
    }
  }

  const handleRemoveReaction = async () => {
    if (!article) return
    try {
      const response = await fetch(`/api/news/${article.id}/reactions`, { method: 'DELETE', credentials: 'same-origin' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível remover sua reação.')
      setArticle((current) => current ? { ...current, reactions: result.data } : current)
      setInteractionError('')
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível remover sua reação.')
    }
  }

  const handleSubmitComment = async (parentId: number | null = null) => {
    if (!article) return
    try {
      const response = await fetch(`/api/news/${article.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ content: commentDraft, parentId }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível publicar o comentário.')
      setCommentDraft('')
      setReplyTarget(null)
      setArticle((current) => current ? { ...current, commentCount: (current.commentCount ?? comments.length) + 1 } : current)
      setInteractionError('')
      await fetchComments(page)
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível publicar o comentário.')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!article) return
    try {
      const response = await fetch(`/api/news/${article.id}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message ?? 'Não foi possível excluir o comentário.')
      setArticle((current) => current ? { ...current, commentCount: Math.max(0, (current.commentCount ?? comments.length) - 1) } : current)
      setInteractionError('')
      await fetchComments(page)
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível excluir o comentário.')
    }
  }

  const handleRequireLogin = () => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    navigate(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  const handleReportComment = (commentId: number) => {
    void commentId
    window.alert('A ferramenta de denúncias ainda não está disponível.')
  }

  const handleCommentReaction = async (commentId: number, reaction: ReactionType, remove: boolean) => {
    if (!currentUser) {
      handleRequireLogin()
      return
    }
    if (!article) return
    setPendingCommentReactions((current) => new Set(current).add(commentId))
    try {
      const response = await fetch(`/api/news/${article.id}/comments/${commentId}/reactions`, {
        method: remove ? 'DELETE' : 'POST',
        headers: remove ? undefined : { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: remove ? undefined : JSON.stringify({ reaction }),
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.data?.byType) {
        throw new Error(result.message ?? `Não foi possível salvar a reação (HTTP ${response.status}).`)
      }
      const summary = result.data as ReactionSummary
      const updateReactions = (items: ThreadComment[]): ThreadComment[] => items.map((item) => ({
        ...item,
        reactions: item.id === commentId ? summary : item.reactions,
        replies: item.replies ? updateReactions(item.replies) : item.replies,
      }))
      setComments((current) => updateReactions(current))
      setInteractionError('')
    } catch (actionError) {
      setInteractionError(actionError instanceof Error ? actionError.message : 'Não foi possível salvar a reação.')
    } finally {
      setPendingCommentReactions((current) => {
        const next = new Set(current)
        next.delete(commentId)
        return next
      })
    }
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="status-panel error">
          <h2>Notícia não encontrada.</h2>
          <p>{error}</p>
          <Link to="/" className="secondary-link">
            Voltar para a home
          </Link>
        </div>
      </div>
    )
  }

  if (!article || loading) {
    return (
      <div className="page-shell">
        <div className="status-panel empty">
          <h2>Carregando matéria...</h2>
          <p>Preparando conteúdo e comentários.</p>
        </div>
      </div>
    )
  }

  return (
    <SiteLayout categories={categories} className="detail-page">
      <header className="detail-header">
        <Link to="/" className="breadcrumb-link">
          ← Voltar para home
        </Link>
        <CategoryBadge category={article.categoria} />
      </header>

      <article className={`detail-story category-theme--${getCategoryTheme(article.categoria)}`}>
        <div className="detail-copy">
          <p className="eyebrow">{article.autor}</p>
          <h1>{article.titulo}</h1>
          <div className="story-meta detail-meta">
            <span>{formatNewsDate(article.dataPublicacao)}</span>
            <span>{article.fonte}</span>
          </div>
        </div>

        <img src={article.imagemUrl} alt={article.titulo} className="detail-image" />

        <div className="detail-content-block">
          <p className="detail-summary">{article.resumo}</p>
          <div className="article-body">
            <p>{article.conteudo}</p>
          </div>

          <div className="detail-social-block">
            <NewsInteractionBar
              article={article}
              isAuthenticated={Boolean(currentUser)}
              onReact={handleReact}
              onRemoveReaction={handleRemoveReaction}
              onOpenComments={() => {
                document.getElementById('comentarios')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onRequireLogin={() =>
                handleRequireLogin()
              }
            />
          </div>
        </div>
      </article>

      <section id="comentarios" className="comments-section" aria-label="Comentários e respostas">
        {interactionError ? <p className="admin-error" role="alert">{interactionError}</p> : null}
        <div className="comments-head">
          <h2>Discussão</h2>
          <span>{article.commentCount ?? comments.length} comentários</span>
        </div>

        {!currentUser ? (
          <div className="login-callout">
            <p>Entre com Google para comentar e responder nesta matéria.</p>
            <Link to={`/admin/login?returnTo=${encodeURIComponent(`${location.pathname}${location.search}#comentarios`)}`} className="secondary-link">
              Entrar com Google
            </Link>
          </div>
        ) : (
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmitComment(replyTarget)
            }}
          >
            <textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              rows={4}
              placeholder={replyTarget ? 'Escreva sua resposta...' : 'Escreva seu comentário...'}
            />
            <div className="comment-form-actions">
              {replyTarget ? (
                <button type="button" className="secondary-button small" onClick={() => setReplyTarget(null)}>
                  Cancelar resposta
                </button>
              ) : null}
              <button type="submit" className="primary-button small">
                Enviar comentário
              </button>
            </div>
          </form>
        )}

        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="status-panel empty narrow">
              <h3>Seja o primeiro a comentar.</h3>
            </div>
          ) : (
            <CommentThread
              comments={comments}
              currentUser={currentUser}
              currentDisplayName={currentDisplayName}
              pendingCommentReactions={pendingCommentReactions}
              onReply={(commentId) => {
                setReplyTarget(commentId)
                setCommentDraft('')
              }}
              onDelete={(commentId) => void handleDeleteComment(commentId)}
              onReport={handleReportComment}
              onReact={(commentId, reaction, remove) => void handleCommentReaction(commentId, reaction, remove)}
            />
          )}
        </div>

        {totalPages > 1 ? (
          <div className="pagination-controls" aria-label="Paginação de comentários">
            <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Próxima
            </button>
          </div>
        ) : null}
      </section>

      <section className="related-section">
        <div className="comments-head">
          <h2>Notícias relacionadas</h2>
        </div>
        <div className="related-grid">
          {related.slice(0, 3).map((item) => (
            <article key={item.id} className={`related-card category-theme--${getCategoryTheme(item.categoria)}`}>
              <img src={item.imagemUrl} alt={item.titulo} />
              <div>
                <CategoryBadge category={item.categoria} />
                <h3>
                  <Link to={`/noticias/${item.slug}`}>{item.titulo}</Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  )
}

type AdminNewsStatus = 'rascunho' | 'pendente' | 'publicado' | 'arquivado'

type AdminNewsItem = {
  id: number
  titulo: string
  resumo: string
  conteudo: string
  categoria: string
  autor: string
  fonte: string
  imagemUrl: string
  urlFonte?: string
  destaque?: boolean
  status: AdminNewsStatus
}

type DraftNews = {
  titulo: string
  resumo: string
  conteudo: string
  categoria: string
  autor: string
  fonte: string
  urlFonte: string
  imagemUrl: string
  status: AdminNewsStatus
  destaque: boolean
}

const defaultDraft: DraftNews = {
  titulo: '',
  resumo: '',
  conteudo: '',
  categoria: 'Brasil',
  autor: 'Redação',
  fonte: 'Portal de Notícias',
  urlFonte: 'https://www.portalnoticias.local',
  imagemUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
  status: 'rascunho',
  destaque: false,
}

function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleOAuthConfigured, setGoogleOAuthConfigured] = useState<boolean | null>(null)
  const returnTo = new URLSearchParams(location.search).get('returnTo') ?? '/'

  useEffect(() => {
    let active = true
    fetch('/api/health')
      .then(async (response) => ({ ok: response.ok, data: await response.json() }))
      .then(({ ok, data }) => {
        if (active) setGoogleOAuthConfigured(ok && data.success && data.google?.oauthConfigured === true)
      })
      .catch(() => {
        if (active) setGoogleOAuthConfigured(false)
      })
    return () => { active = false }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await readApiResponse<never>(response)

      if (!data.success) {
        throw new Error(data.message ?? 'Falha ao entrar no painel.')
      }

      await refresh()
      navigate('/admin/dashboard', { replace: true })
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : 'Não foi possível entrar no painel.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-shell">
      <div className="admin-card">
        <p className="eyebrow">Acesso ao portal</p>
        <h1>Entrar</h1>
        <p className="admin-copy">
          Entre com Google para reagir e comentar. A conta autorizada para administração também terá acesso ao painel editorial.
        </p>

        {location.search.includes('google=denied') ? (
          <p className="admin-error">O login com Google foi cancelado.</p>
        ) : null}
        {location.search.includes('google=not-allowed') && googleOAuthConfigured === false ? (
          <p className="admin-error">O login com Google não está configurado. Verifique as credenciais OAuth do backend.</p>
        ) : null}
        {location.search.includes('google=error') ? (
          <p className="admin-error">Não foi possível entrar com Google. Tente novamente.</p>
        ) : null}

        <a className="google-login-button" href={`/api/admin/google/login?returnTo=${encodeURIComponent(returnTo)}`}>
          <span className="google-mark" aria-hidden="true">G</span>
          Continuar com Google
        </a>
        <div className="login-divider"><span>ou entre com usuário e senha</span></div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            <span>Usuário</span>
            <input
              type="text"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
              placeholder="admin"
            />
          </label>

          <label>
            <span>Senha</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="admin-error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <Link to="/" className="secondary-link">
          Voltar ao portal público
        </Link>
      </div>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()
  const [stats, setStats] = useState<{
    total: number
    publicados: number
    pendentes: number
    rascunhos: number
    recent: Array<{ id: number; titulo: string; status: string }>
  } | null>(null)
  const [news, setNews] = useState<AdminNewsItem[]>([])
  const [adminCategories, setAdminCategories] = useState<string[]>([])
  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean
    connected: boolean
    scopes: string[]
    persistence: string
  } | null>(null)
  const [draft, setDraft] = useState<DraftNews>(defaultDraft)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [error, setError] = useState('')

  const loadAdminData = useCallback(async () => {
    setIsLoadingNews(true)

    try {
      const sessionResponse = await fetch('/api/admin/session', { credentials: 'same-origin' })
      const sessionData = await sessionResponse.json()

      if (!sessionResponse.ok || !sessionData.success) {
        throw new Error(sessionData.message ?? 'Sessão inválida.')
      }
      await refresh()

      const categoriesResponse = await fetch('/api/categories')
      const categoriesData = await readApiResponse<NewsCategory[]>(categoriesResponse)
      if (!categoriesData.success || !categoriesData.data) {
        throw new Error(categoriesData.message ?? 'Não foi possível carregar as categorias.')
      }

      const dashboardResponse = await fetch('/api/admin/dashboard', { credentials: 'same-origin' })

      const dashboardData = await dashboardResponse.json()

      if (!dashboardResponse.ok || !dashboardData.success) {
        throw new Error(dashboardData.message ?? 'Sessão inválida.')
      }

      const newsResponse = await fetch('/api/admin/news', { credentials: 'same-origin' })

      const newsData = await newsResponse.json()

      if (!newsResponse.ok || !newsData.success) {
        throw new Error(newsData.message ?? 'Não foi possível carregar as notícias.')
      }

      const googleResponse = await fetch('/api/admin/google/status', { credentials: 'same-origin' })
      const googleData = await readApiResponse<{
        configured: boolean
        connected: boolean
        scopes: string[]
        persistence: string
      }>(googleResponse)
      if (!googleData.success || !googleData.data) {
        throw new Error(googleData.message ?? 'Não foi possível consultar a integração Google.')
      }

      setStats(dashboardData.data)
      setNews(newsData.data ?? [])
      setAdminCategories(categoriesData.data.map((category) => category.name))
      setGoogleStatus(googleData.data)
    } catch (loadError) {
      navigate('/admin/login', { replace: true })
      setError(loadError instanceof Error ? loadError.message : 'Sessão inválida.')
    } finally {
      setIsLoadingNews(false)
    }
  }, [navigate, refresh])

  useEffect(() => {
    void loadAdminData()
  }, [loadAdminData])

  const handleDisconnectGoogle = async () => {
    try {
      const response = await fetch('/api/admin/google/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await readApiResponse<never>(response)
      if (!data.success) {
        throw new Error(data.message ?? 'Não foi possível desconectar a conta Google.')
      }
      setGoogleStatus((current) => current ? { ...current, connected: false, scopes: [] } : current)
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : 'Não foi possível desconectar a conta Google.')
    }
  }

  const handleLogout = async () => {
    setError('')
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await readApiResponse<never>(response)
      if (!data.success) {
        throw new Error(data.message ?? 'Não foi possível encerrar a sessão.')
      }
      await refresh()
      navigate('/admin/login', { replace: true })
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Não foi possível encerrar a sessão.')
    }
  }

  const handleDraftChange = <K extends keyof DraftNews>(field: K, value: DraftNews[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const refreshAdminData = async () => {
    await loadAdminData()
  }

  const handleCreateNews = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.titulo.trim() || !draft.resumo.trim() || !draft.conteudo.trim()) {
      setError('Preencha título, resumo e conteúdo antes de salvar.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(editingId ? `/api/admin/news/${editingId}` : '/api/admin/news', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          ...draft,
          titulo: draft.titulo.trim(),
          resumo: draft.resumo.trim(),
          conteudo: draft.conteudo.trim(),
          imagemId: `img-${Date.now()}`,
          dataPublicacao: draft.status === 'publicado' ? new Date().toISOString() : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Não foi possível salvar a notícia.')
      }

      setDraft(defaultDraft)
      setEditingId(null)
      await refreshAdminData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível salvar a notícia.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditing = (item: AdminNewsItem) => {
    setEditingId(item.id)
    setDraft({
      titulo: item.titulo,
      resumo: item.resumo,
      conteudo: item.conteudo,
      categoria: item.categoria,
      autor: item.autor,
      fonte: item.fonte,
      urlFonte: item.urlFonte ?? defaultDraft.urlFonte,
      imagemUrl: item.imagemUrl,
      status: item.status,
      destaque: Boolean(item.destaque),
    })
    document.getElementById('news-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleStatusUpdate = async (id: number, status: AdminNewsStatus) => {
    try {
      const response = await fetch(`/api/admin/news/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Não foi possível atualizar o status.')
      }

      await refreshAdminData()
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Não foi possível atualizar o status.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? 'Não foi possível excluir a notícia.')
      }

      await refreshAdminData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a notícia.')
    }
  }

  return (
    <div className="admin-shell dashboard-shell">
      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Portal administrativo</h1>
        </div>
          <div className="admin-topbar-actions">
            <Link to="/" className="secondary-link">Voltar ao portal</Link>
            <button type="button" className="secondary-button" onClick={handleLogout}>Sair</button>
          </div>
      </div>

      {!stats ? (
        <div className="status-panel empty">
          <h2>Carregando painel...</h2>
          <p>Validando sessão e estatísticas do portal.</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="metric-card">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="metric-card">
              <span>Publicados</span>
              <strong>{stats.publicados}</strong>
            </div>
            <div className="metric-card">
              <span>Pendentes</span>
              <strong>{stats.pendentes}</strong>
            </div>
            <div className="metric-card">
              <span>Rascunhos</span>
              <strong>{stats.rascunhos}</strong>
            </div>
          </div>

          <section className="admin-panel google-integration-panel" aria-live="polite">
            <div>
              <h2>Integrações Google</h2>
              {!googleStatus?.configured ? (
                <p>As credenciais OAuth não estão configuradas no backend.</p>
              ) : googleStatus.connected ? (
                <p>Conta autorizada para Google Sheets e arquivos selecionados pelo app.</p>
              ) : (
                <p>Conecte uma conta Google para autorizar as integrações solicitadas.</p>
              )}
              {googleStatus?.persistence === 'memory' && googleStatus.connected ? (
                <p className="muted-text">A conexão fica na memória do backend e precisará ser refeita após reiniciar o serviço.</p>
              ) : null}
              {location.search.includes('google=connected') ? (
                <p className="google-integration-success">Conta Google conectada com sucesso.</p>
              ) : null}
              {location.search.includes('google=denied') ? (
                <p className="admin-error">A autorização Google foi cancelada.</p>
              ) : null}
              {location.search.includes('google=error') ? (
                <p className="admin-error">Não foi possível concluir a autorização Google. Tente conectar novamente.</p>
              ) : null}
            </div>
            <div className="google-integration-actions">
              {googleStatus?.configured && !googleStatus.connected ? (
                <a className="primary-button small" href="/api/admin/google/auth">
                  Conectar com Google
                </a>
              ) : null}
              {googleStatus?.connected ? (
                <button type="button" className="secondary-button small" onClick={() => void handleDisconnectGoogle()}>
                  Desconectar e revogar
                </button>
              ) : null}
            </div>
          </section>

          <section className="admin-panel">
            <h2>Últimas notícias</h2>
            <ul className="activity-list">
              {stats.recent.map((item) => (
                <li key={item.id}>
                  <span>{item.titulo}</span>
                  <strong>{formatStatusLabel(item.status)}</strong>
                </li>
              ))}
            </ul>
          </section>

          <section id="news-editor" className="admin-panel news-manager">
            <h2>{editingId ? 'Editar publicação' : 'Nova publicação'}</h2>
            <form className="editor-form" onSubmit={handleCreateNews}>
              <div className="editor-grid">
                <label>
                  <span>Título</span>
                  <input
                    value={draft.titulo}
                    onChange={(event) => handleDraftChange('titulo', event.target.value)}
                    placeholder="Título da matéria"
                  />
                </label>

                <label>
                  <span>Autor</span>
                  <input
                    value={draft.autor}
                    onChange={(event) => handleDraftChange('autor', event.target.value)}
                    placeholder="Nome do jornalista"
                  />
                </label>

                <label>
                  <span>Categoria</span>
                  <select
                    value={draft.categoria}
                    onChange={(event) => handleDraftChange('categoria', event.target.value)}
                  >
                    {adminCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Status</span>
                  <select
                    value={draft.status}
                    onChange={(event) => handleDraftChange('status', event.target.value as AdminNewsStatus)}
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="pendente">Pendente</option>
                    <option value="publicado">Publicado</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Resumo</span>
                <textarea
                  value={draft.resumo}
                  onChange={(event) => handleDraftChange('resumo', event.target.value)}
                  rows={3}
                  placeholder="Resumo curto da notícia"
                />
              </label>

              <label>
                <span>Conteúdo</span>
                <textarea
                  value={draft.conteudo}
                  onChange={(event) => handleDraftChange('conteudo', event.target.value)}
                  rows={6}
                  placeholder="Texto completo da matéria"
                />
              </label>

              <div className="editor-grid">
                <label>
                  <span>Fonte</span>
                  <input
                    value={draft.fonte}
                    onChange={(event) => handleDraftChange('fonte', event.target.value)}
                    placeholder="Nome da fonte"
                  />
                </label>

                <label>
                  <span>URL da fonte</span>
                  <input
                    value={draft.urlFonte}
                    onChange={(event) => handleDraftChange('urlFonte', event.target.value)}
                    placeholder="https://exemplo.com"
                  />
                </label>

                <label>
                  <span>Imagem</span>
                  <input
                    value={draft.imagemUrl}
                    onChange={(event) => handleDraftChange('imagemUrl', event.target.value)}
                    placeholder="https://.../imagem.jpg"
                  />
                </label>
              </div>

              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={draft.destaque}
                  onChange={(event) => handleDraftChange('destaque', event.target.checked)}
                />
                <span>Marcar como destaque na home</span>
              </label>

              {error ? <p className="admin-error">{error}</p> : null}

              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar notícia'}
              </button>
              {editingId ? (
                <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setDraft(defaultDraft) }}>
                  Cancelar edição
                </button>
              ) : null}
            </form>
          </section>

          <section className="admin-panel">
            <h2>Gerenciar matérias</h2>
            {isLoadingNews ? (
              <p className="muted-text">Carregando matérias...</p>
            ) : news.length === 0 ? (
              <p className="muted-text">Ainda não há matérias cadastradas.</p>
            ) : (
              <div className="news-list">
                {news.map((item) => (
                  <article key={item.id} className="news-row">
                    <div className="news-row-copy">
                      <div className="news-row-header">
                        <strong>{item.titulo}</strong>
                        <span className={`status-badge ${item.status}`}>{formatStatusLabel(item.status)}</span>
                      </div>
                      <p>{item.resumo}</p>
                      <small>
                        {item.categoria} · {item.autor} · {item.fonte}
                      </small>
                    </div>

                    <div className="news-actions">
                      <button type="button" className="small-button" onClick={() => startEditing(item)}>
                        Editar
                      </button>
                      <button type="button" className="small-button" onClick={() => handleStatusUpdate(item.id, 'publicado')}>
                        Publicar
                      </button>
                      <button type="button" className="small-button secondary" onClick={() => handleStatusUpdate(item.id, 'pendente')}>
                        Pendente
                      </button>
                      <button type="button" className="small-button danger" onClick={() => handleDelete(item.id)}>
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function ProtectedAdminRoute() {
  return <DashboardPage />
}

function NotFoundPage() {
  return (
    <div className="page-shell">
      <div className="status-panel empty">
        <p className="eyebrow">Erro 404</p>
        <h1>Página não encontrada.</h1>
        <p>O endereço pode ter mudado ou não existe.</p>
        <Link to="/" className="secondary-link">Voltar para a home</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/categorias/:slug" element={<CategoryPage />} />
          <Route path="/busca" element={<CategoryPage />} />
          <Route path="/noticias/:slug" element={<NewsDetailPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
