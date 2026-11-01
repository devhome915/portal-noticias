import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'

type ReactionType = 'curtir' | 'amei' | 'uau' | 'triste' | 'bravo'

type ReactionSummary = {
  total: number
  byType: Record<ReactionType, number>
  userReaction: ReactionType | null
}

type ThreadComment = {
  id: number
  articleId: number
  author: string
  userId: string
  content: string
  createdAt: string
  status: string
  parentId: number | null
  edited: boolean
  replies?: ThreadComment[]
}

type Article = {
  id: number
  slug: string
  titulo: string
  resumo: string
  conteudo: string
  categoria: string
  autor: string
  fonte: string
  imagemUrl: string
  dataPublicacao: string
  destaque?: boolean
  status?: string
  urlFonte?: string
  reactions?: ReactionSummary
  commentCount?: number
}

const ADMIN_TOKEN_KEY = 'portal-news-admin-token'
const SOCIAL_USER_KEY = 'portal-news-social-user'

const categories = [
  'Todas',
  'Política',
  'Economia',
  'Tecnologia',
  'Esportes',
  'Entretenimento',
  'Brasil',
  'Mundo',
] as const

const reactionOptions: Array<{ key: ReactionType; label: string; icon: string }> = [
  { key: 'curtir', label: 'Curtir', icon: '👍' },
  { key: 'amei', label: 'Amei', icon: '❤️' },
  { key: 'uau', label: 'Uau', icon: '😮' },
  { key: 'triste', label: 'Triste', icon: '😢' },
  { key: 'bravo', label: 'Bravo', icon: '😠' },
]

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.text()

  if ([502, 503, 504].includes(response.status)) {
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

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(SOCIAL_USER_KEY)
}

const persistDemoUser = () => {
  const existing = getStoredUser()

  if (existing) {
    return existing
  }

  const value = `demo-user-${Date.now()}`
  localStorage.setItem(SOCIAL_USER_KEY, value)
  return value
}

const formatStatusLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export function NewsInteractionBar({
  article,
  isAuthenticated,
  onReact,
  onRemoveReaction,
  onOpenComments,
  onRequireLogin,
}: {
  article: Article
  isAuthenticated: boolean
  onReact: (reaction: ReactionType) => Promise<void> | void
  onRemoveReaction: () => Promise<void> | void
  onOpenComments: () => void
  onRequireLogin: () => void
}) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState<ReactionType | null>(
    article.reactions?.userReaction ?? null,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    setSelectedReaction(article.reactions?.userReaction ?? null)
  }, [article.reactions?.userReaction, article.id])

  useEffect(() => {
    if (!selectorOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectorOpen(false)
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        setSelectorOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [selectorOpen])

  const totalReactions = article.reactions?.total ?? 0
  const commentCount = article.commentCount ?? 0

  const focusOption = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, reactionOptions.length - 1))
    optionRefs.current[safeIndex]?.focus()
  }

  const handleSelectReaction = async (reaction: ReactionType) => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }

    setSelectedReaction(reaction)
    setSelectorOpen(false)
    await onReact(reaction)
  }

  const handleRemoveSelection = async () => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }

    setSelectedReaction(null)
    setSelectorOpen(false)
    await onRemoveReaction()
  }

  return (
    <div className="news-interaction-bar" ref={popoverRef}>
      <div className="interaction-summary">
        <span className="reaction-summary">{totalReactions} reações</span>
        <button type="button" className="comment-summary" onClick={onOpenComments}>
          {commentCount} comentários
        </button>
      </div>

      <div className="interaction-actions">
        <button
          type="button"
          className={selectedReaction ? 'interaction-button selected' : 'interaction-button'}
          aria-haspopup="dialog"
          aria-expanded={selectorOpen}
          onClick={() => {
            if (!isAuthenticated) {
              onRequireLogin()
              return
            }

            setSelectorOpen((current) => !current)
          }}
        >
          <span aria-hidden="true">{selectedReaction ? reactionOptions.find((item) => item.key === selectedReaction)?.icon : '👍'}</span>
          Reagir
        </button>

        <button type="button" className="interaction-button secondary" onClick={onOpenComments}>
          <span aria-hidden="true">💬</span>
          Comentar
        </button>
      </div>

      {selectorOpen ? (
        <div className="reaction-popover" role="dialog" aria-label="Selecionar reação">
          {reactionOptions.map((reaction, index) => (
            <button
              key={reaction.key}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type="button"
              className={selectedReaction === reaction.key ? 'reaction-option active' : 'reaction-option'}
              onClick={() => void handleSelectReaction(reaction.key)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                  event.preventDefault()
                  focusOption(index + 1)
                  return
                }

                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                  event.preventDefault()
                  focusOption(index - 1)
                  return
                }

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  void handleSelectReaction(reaction.key)
                }
              }}
            >
              <span aria-hidden="true">{reaction.icon}</span>
              {reaction.label}
            </button>
          ))}

          {selectedReaction ? (
            <button type="button" className="reaction-option danger" onClick={() => void handleRemoveSelection()}>
              Remover reação
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PublicPortal() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [newsRequestVersion, setNewsRequestVersion] = useState(0)
  const loadingTimerRef = useRef<number | null>(null)

  const isAuthenticated = Boolean(getStoredUser())

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)

      try {
        const response = await fetch('/api/news?page=1&limit=9')
        const data = await readApiResponse<Article[]>(response)

        if (!data.success) {
          throw new Error(data.message ?? 'Não foi possível carregar as notícias.')
        }

        setArticles(data.data ?? [])
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

  const updateLocalArticleState = (articleId: number, nextSummary: ReactionSummary) => {
    setArticles((currentArticles) =>
      currentArticles.map((article) =>
        article.id === articleId
          ? {
              ...article,
              reactions: nextSummary,
            }
          : article,
      ),
    )
  }

  const handleReact = async (articleId: number, reaction: ReactionType) => {
    const userId = getStoredUser()

    if (!userId) {
      window.alert('Faça login para registrar uma reação.')
      return
    }

    const response = await fetch(`/api/news/${articleId}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ reaction }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      window.alert(data.message ?? 'Não foi possível registrar a reação.')
      return
    }

    updateLocalArticleState(articleId, data.data)
  }

  const handleRemoveReaction = async (articleId: number) => {
    const userId = getStoredUser()

    if (!userId) {
      window.alert('Faça login para remover a reação.')
      return
    }

    const response = await fetch(`/api/news/${articleId}/reactions`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      window.alert(data.message ?? 'Não foi possível remover a reação.')
      return
    }

    updateLocalArticleState(articleId, data.data)
  }

  const handleOpenComments = (slug: string) => {
    navigate(`/noticias/${slug}#comentarios`)
  }

  const handleRequireLogin = () => {
    if (!getStoredUser()) {
      persistDemoUser()
      window.alert('Usuário demo criado. Faça login para concluir a ação.')
    }
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
    <div className="page-shell">
      <header className="site-header">
        <div className="brand" aria-label="Portal de Notícias">
          <span className="brand-mark">P</span>
          <div>
            <strong>Portal</strong>
            <span>de Notícias</span>
          </div>
        </div>

        <nav aria-label="Menu principal" className="main-nav">
          <a href="#">Home</a>
          <a href="#">Política</a>
          <a href="#">Economia</a>
          <a href="#">Tecnologia</a>
          <a href="#">Esportes</a>
        </nav>

        <div className="header-actions">
          <Link to="/admin/login" className="admin-link">
            Painel
          </Link>
          <button type="button" className="cta-button">
            Assine
          </button>
        </div>
      </header>

      <main className="content-area">
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
          <div className="toolbar-meta">
            <span>{filteredArticles.length} notícias</span>
            <span>Atualizado hoje</span>
          </div>
        </section>

        <div className="category-bar" aria-label="Categorias de notícias">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === selectedCategory ? 'category-pill active' : 'category-pill'}
              onClick={() => {
                setSelectedCategory(category)
                triggerLoading()
              }}
            >
              {category}
            </button>
          ))}
        </div>

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
              <article className="featured-story">
                <img src={featuredArticle.imagemUrl} alt={featuredArticle.titulo} />
                <div className="featured-copy">
                  <span className="story-tag">{featuredArticle.categoria}</span>
                  <h1>
                    <Link to={`/noticias/${featuredArticle.slug}`}>{featuredArticle.titulo}</Link>
                  </h1>
                  <p>{featuredArticle.resumo}</p>
                  <div className="story-meta">
                    <span>{featuredArticle.autor}</span>
                    <span>{formatDate(featuredArticle.dataPublicacao)}</span>
                  </div>

                  <div className="featured-social-wrap">
                    <NewsInteractionBar
                      article={featuredArticle}
                      isAuthenticated={isAuthenticated}
                      onReact={(reaction) => handleReact(featuredArticle.id, reaction)}
                      onRemoveReaction={() => handleRemoveReaction(featuredArticle.id)}
                      onOpenComments={() => handleOpenComments(featuredArticle.slug)}
                      onRequireLogin={handleRequireLogin}
                    />
                  </div>
                </div>
              </article>
            ) : null}

            <section className="news-grid" aria-label="Últimas notícias">
              {sideArticles.map((article) => (
                <article key={article.id} className="news-card">
                  <img src={article.imagemUrl} alt={article.titulo} />
                  <div className="card-content">
                    <span className="story-tag">{article.categoria}</span>
                    <h2>
                      <Link to={`/noticias/${article.slug}`}>{article.titulo}</Link>
                    </h2>
                    <p>{article.resumo}</p>
                    <div className="story-meta">
                      <span>{article.autor}</span>
                      <span>{formatDate(article.dataPublicacao)}</span>
                    </div>

                    <NewsInteractionBar
                      article={article}
                      isAuthenticated={isAuthenticated}
                      onReact={(reaction) => handleReact(article.id, reaction)}
                      onRemoveReaction={() => handleRemoveReaction(article.id)}
                      onOpenComments={() => handleOpenComments(article.slug)}
                      onRequireLogin={handleRequireLogin}
                    />
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div>
          <strong>Portal de Notícias</strong>
          <span>Jornalismo digital com foco em contexto, clareza e cobertura inteligente.</span>
        </div>
        <nav aria-label="Rodapé">
          <a href="#">Sobre</a>
          <a href="#">Contato</a>
          <a href="#">Termos</a>
        </nav>
      </footer>
    </div>
  )
}

function CommentThread({
  comments,
  currentUser,
  onReply,
  onDelete,
  onReport,
  depth = 0,
}: {
  comments: ThreadComment[]
  currentUser: string | null
  onReply: (commentId: number) => void
  onDelete: (commentId: number) => void
  onReport: (commentId: number) => void
  depth?: number
}) {
  if (comments.length === 0) {
    return null
  }

  return (
    <div className="comment-thread">
      {comments.map((comment) => (
        <article key={comment.id} className={`comment-item depth-${depth}`}>
          <header className="comment-header">
            <div>
              <strong>{comment.author}</strong>
              <time>{formatDate(comment.createdAt)}</time>
            </div>
            <span className="comment-status">{comment.status}</span>
          </header>

          <p>{comment.content}</p>

          <div className="comment-actions">
            <button type="button" className="text-link" onClick={() => onReply(comment.id)}>
              Responder
            </button>
            {currentUser && comment.userId === currentUser ? (
              <button type="button" className="text-link danger" onClick={() => onDelete(comment.id)}>
                Excluir
              </button>
            ) : (
              <button type="button" className="text-link danger" onClick={() => onReport(comment.id)}>
                Denunciar
              </button>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 ? (
            <CommentThread
              comments={comment.replies}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              onReport={onReport}
              depth={Math.min(depth + 1, 2)}
            />
          ) : null}
        </article>
      ))}
    </div>
  )
}

function NewsDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<ThreadComment[]>([])
  const [commentDraft, setCommentDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState<number | null>(null)
  const [related, setRelated] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUser = getStoredUser()

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

    const response = await fetch(`/api/news/${article.id}/comments?page=${nextPage}&limit=10`)
    const data = await response.json()

    if (!response.ok || !data.success) {
      return
    }

    setComments(data.data.items ?? [])
    setTotalPages(data.data.totalPages ?? 1)
  }

  const fetchRelated = async () => {
    const response = await fetch('/api/news?page=1&limit=6')
    const data = await response.json()

    if (!response.ok || !data.success) {
      return
    }

    setRelated((data.data ?? []).filter((item: Article) => item.slug !== slug))
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
    if (!article) {
      return
    }

    const userId = getStoredUser()
    if (!userId) {
      window.alert('Faça login para registrar uma reação.')
      return
    }

    const response = await fetch(`/api/news/${article.id}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ reaction }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      window.alert(data.message ?? 'Não foi possível atualizar a reação.')
      return
    }

    setArticle((current) => (current ? { ...current, reactions: data.data } : current))
  }

  const handleRemoveReaction = async () => {
    if (!article) {
      return
    }

    const userId = getStoredUser()
    if (!userId) {
      window.alert('Faça login para remover a reação.')
      return
    }

    const response = await fetch(`/api/news/${article.id}/reactions`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      window.alert(data.message ?? 'Não foi possível remover a reação.')
      return
    }

    setArticle((current) => (current ? { ...current, reactions: data.data } : current))
  }

  const handleSubmitComment = async (parentId: number | null = null) => {
    if (!article) {
      return
    }

    const userId = getStoredUser()
    if (!userId) {
      window.alert('Faça login para comentar.')
      return
    }

    if (!commentDraft.trim()) {
      return
    }

    const response = await fetch(`/api/news/${article.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        author: 'Visitante',
        content: commentDraft.trim(),
        parentId: parentId ?? undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      window.alert(data.message ?? 'Não foi possível enviar o comentário.')
      return
    }

    setCommentDraft('')
    setReplyTarget(null)
    setPage(1)
    await fetchComments(1)
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!article) {
      return
    }

    const userId = getStoredUser()
    if (!userId) {
      return
    }

    const response = await fetch(`/api/news/${article.id}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    })

    if (!response.ok) {
      window.alert('Não foi possível excluir o comentário.')
      return
    }

    await fetchComments(page)
  }

  const handleReportComment = (commentId: number) => {
    window.alert(`Comentário ${commentId} foi sinalizado para moderação.`)
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
    <div className="page-shell detail-page">
      <header className="detail-header">
        <Link to="/" className="breadcrumb-link">
          ← Voltar para home
        </Link>
        <span className="story-tag">{article.categoria}</span>
      </header>

      <article className="detail-story">
        <div className="detail-copy">
          <p className="eyebrow">{article.autor}</p>
          <h1>{article.titulo}</h1>
          <div className="story-meta detail-meta">
            <span>{formatDate(article.dataPublicacao)}</span>
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
              onRequireLogin={() => {
                persistDemoUser()
                window.alert('Faça login para concluir a ação.')
              }}
            />
          </div>
        </div>
      </article>

      <section id="comentarios" className="comments-section" aria-label="Comentários e respostas">
        <div className="comments-head">
          <h2>Discussão</h2>
          <span>{article.commentCount ?? comments.length} comentários</span>
        </div>

        {!currentUser ? (
          <div className="login-callout">
            <p>Faça login para comentar e participar da conversa.</p>
            <button
              type="button"
              className="primary-button small"
              onClick={() => {
                persistDemoUser()
                navigate(0)
              }}
            >
              Entrar para comentar
            </button>
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
              onReply={(commentId) => {
                setReplyTarget(commentId)
                setCommentDraft('')
              }}
              onDelete={(commentId) => void handleDeleteComment(commentId)}
              onReport={handleReportComment}
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
            <article key={item.id} className="related-card">
              <img src={item.imagemUrl} alt={item.titulo} />
              <div>
                <span className="story-tag">{item.categoria}</span>
                <h3>
                  <Link to={`/noticias/${item.slug}`}>{item.titulo}</Link>
                </h3>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
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
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Falha ao entrar no painel.')
      }

      localStorage.setItem(ADMIN_TOKEN_KEY, data.token)
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
        <p className="eyebrow">Painel administrativo</p>
        <h1>Entrar no portal</h1>
        <p className="admin-copy">
          Utilize as credenciais administrativas configuradas no backend. O frontend não armazena a senha em código.
        </p>

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
  const [stats, setStats] = useState<{
    total: number
    publicados: number
    pendentes: number
    rascunhos: number
    recent: Array<{ id: number; titulo: string; status: string }>
  } | null>(null)
  const [news, setNews] = useState<AdminNewsItem[]>([])
  const [draft, setDraft] = useState<DraftNews>(defaultDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [error, setError] = useState('')

  const loadAdminData = async (token: string) => {
    setIsLoadingNews(true)

    try {
      const dashboardResponse = await fetch('/api/admin/dashboard', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })

      const dashboardData = await dashboardResponse.json()

      if (!dashboardResponse.ok || !dashboardData.success) {
        throw new Error(dashboardData.message ?? 'Sessão inválida.')
      }

      const newsResponse = await fetch('/api/admin/news', {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })

      const newsData = await newsResponse.json()

      if (!newsResponse.ok || !newsData.success) {
        throw new Error(newsData.message ?? 'Não foi possível carregar as notícias.')
      }

      setStats(dashboardData.data)
      setNews(newsData.data ?? [])
    } catch (loadError) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      navigate('/admin/login', { replace: true })
      throw loadError
    } finally {
      setIsLoadingNews(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    void loadAdminData(token)
  }, [navigate])

  const handleLogout = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
    }

    localStorage.removeItem(ADMIN_TOKEN_KEY)
    navigate('/admin/login', { replace: true })
  }

  const handleDraftChange = <K extends keyof DraftNews>(field: K, value: DraftNews[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const refreshAdminData = async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    await loadAdminData(token)
  }

  const handleCreateNews = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    if (!draft.titulo.trim() || !draft.resumo.trim() || !draft.conteudo.trim()) {
      setError('Preencha título, resumo e conteúdo antes de salvar.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
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
      await refreshAdminData()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível salvar a notícia.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: number, status: AdminNewsStatus) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    try {
      const response = await fetch(`/api/admin/news/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
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
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)

    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }

    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + token,
        },
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

        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
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

          <section className="admin-panel news-manager">
            <h2>Nova publicação</h2>
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
                    {['Brasil', 'Mundo', 'Política', 'Economia', 'Tecnologia', 'Esportes', 'Entretenimento'].map((category) => (
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
                {isSubmitting ? 'Salvando...' : 'Salvar notícia'}
              </button>
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
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  return token ? <DashboardPage /> : <Navigate to="/admin/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPortal />} />
        <Route path="/noticias/:slug" element={<NewsDetailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<ProtectedAdminRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
