import { Router, type RequestHandler } from 'express'
import { z } from 'zod'
import { getCategories, getFeaturedNews, getNewsBySlug, isPublishedNews, listPublishedNews } from '../services/newsService.js'
import {
  createComment,
  deleteComment,
  isCommentReactable,
  getReactionSummary,
  listComments,
  removeCommentReaction,
  removeReaction,
  setCommentReaction,
  setReaction,
} from '../services/socialService.js'
import { getAuthTokenFromRequest, requireAdminCsrf } from '../middleware/adminAuth.js'
import { getAuthSession, revokeAdminToken } from '../services/authService.js'
import { forgetGoogleConnection } from '../services/googleOAuthService.js'
import { isGoogleOAuthConfigured } from '../services/googleOAuthService.js'

const router = Router()

const newsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
})
const reactionSchema = z.object({ reaction: z.enum(['curtir', 'amei', 'uau', 'triste', 'bravo']) })
const commentSchema = z.object({
  content: z.string().trim().min(1).max(3000),
  parentId: z.number().int().positive().nullable().optional(),
})

function getRequestSession(req: Parameters<typeof getAuthTokenFromRequest>[0]) {
  return getAuthSession(getAuthTokenFromRequest(req))
}

const requireReaderAuth: RequestHandler = (req, res, next) => {
  if (!getRequestSession(req)) {
    return res.status(401).json({ success: false, message: 'Entre com Google para continuar.' })
  }
  return requireAdminCsrf(req, res, next)
}

router.get('/auth/session', (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Você ainda não entrou no portal.' })
  return res.json({
    success: true,
    data: { email: session.email, username: session.username, picture: session.picture, role: session.role, expiresAt: session.expiresAt },
  })
})

router.post('/auth/logout', requireAdminCsrf, (req, res) => {
  const token = getAuthTokenFromRequest(req)
  if (token) {
    revokeAdminToken(token)
    forgetGoogleConnection(token)
  }
  res.setHeader('Set-Cookie', [
    'portal_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    'portal_admin_session=; HttpOnly; SameSite=Lax; Path=/api/admin; Max-Age=0',
  ])
  return res.json({ success: true })
})

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'portal-noticias-api',
    timestamp: new Date().toISOString(),
    google: {
      oauthConfigured: isGoogleOAuthConfigured(),
      integrationStatus: 'authorization-required',
    },
  })
})

router.get('/news', (req, res) => {
  const result = newsQuerySchema.safeParse(req.query)

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Parâmetros inválidos.',
      details: result.error.flatten(),
    })
  }

  const response = listPublishedNews({ ...result.data, userId: getRequestSession(req)?.email })
  return res.json({
    success: true,
    data: response.items,
    pagination: {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    },
    categories: response.categories,
  })
})

router.get('/news/search', (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search : ''
  const response = listPublishedNews({ search, userId: getRequestSession(req)?.email })

  return res.json({
    success: true,
    data: response.items,
    pagination: {
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: response.totalPages,
    },
  })
})

router.get('/news/featured', (req, res) => {
  const featured = getFeaturedNews(getRequestSession(req)?.email)

  return res.json({
    success: true,
    data: featured,
  })
})

router.get('/news/slug/:slug', (req, res) => {
  const article = getNewsBySlug(req.params.slug, getRequestSession(req)?.email)

  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Notícia não encontrada.',
    })
  }

  return res.json({
    success: true,
    data: article,
  })
})

router.get('/news/:id/social', (req, res) => {
  const articleId = Number(req.params.id)
  const userId = getRequestSession(req)?.email

  return res.json({
    success: true,
    data: getReactionSummary(articleId, userId),
  })
})

router.post('/news/:id/reactions', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para reagir.' })
  const articleId = Number(req.params.id)
  const parsed = reactionSchema.safeParse(req.body)
  if (!Number.isInteger(articleId) || !isPublishedNews(articleId) || !parsed.success) {
    return res.status(400).json({ success: false, message: 'Reação ou notícia inválida.' })
  }
  return res.json({ success: true, data: setReaction(articleId, session.email, parsed.data.reaction) })
})

router.delete('/news/:id/reactions', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para remover sua reação.' })
  const articleId = Number(req.params.id)
  if (!Number.isInteger(articleId) || !isPublishedNews(articleId)) {
    return res.status(404).json({ success: false, message: 'Notícia não encontrada.' })
  }
  return res.json({ success: true, data: removeReaction(articleId, session.email) })
})

router.get('/news/:id/comments', (req, res) => {
  const articleId = Number(req.params.id)
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 10)

  return res.json({
    success: true,
    data: listComments(articleId, page, limit, getRequestSession(req)?.email),
  })
})

router.post('/news/:id/comments', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para comentar.' })
  const articleId = Number(req.params.id)
  const parsed = commentSchema.safeParse(req.body)
  if (!Number.isInteger(articleId) || !isPublishedNews(articleId) || !parsed.success) {
    return res.status(400).json({ success: false, message: 'Comentário ou notícia inválida.' })
  }
  const comment = createComment(articleId, session.email, session.username, parsed.data.content, parsed.data.parentId)
  return res.status(201).json({ success: true, data: comment })
})

router.delete('/news/:id/comments/:commentId', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para excluir seu comentário.' })
  const articleId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  if (!Number.isInteger(articleId) || !Number.isInteger(commentId) || !isPublishedNews(articleId)) {
    return res.status(404).json({ success: false, message: 'Comentário não encontrado.' })
  }
  if (!deleteComment(articleId, commentId, session.email)) {
    return res.status(404).json({ success: false, message: 'Comentário não encontrado ou não pertence à sua conta.' })
  }
  return res.json({ success: true })
})

router.post('/news/:id/comments/:commentId/reactions', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para reagir.' })
  const articleId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  const parsed = reactionSchema.safeParse(req.body)
  if (!Number.isInteger(articleId) || !Number.isInteger(commentId) || !isPublishedNews(articleId) || !isCommentReactable(articleId, commentId) || !parsed.success) {
    return res.status(404).json({ success: false, message: 'Comentário não encontrado ou reação inválida.' })
  }
  return res.json({ success: true, data: setCommentReaction(commentId, session.email, parsed.data.reaction) })
})

router.delete('/news/:id/comments/:commentId/reactions', requireReaderAuth, (req, res) => {
  const session = getRequestSession(req)
  if (!session) return res.status(401).json({ success: false, message: 'Entre com Google para remover sua reação.' })
  const articleId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  if (!Number.isInteger(articleId) || !Number.isInteger(commentId) || !isPublishedNews(articleId) || !isCommentReactable(articleId, commentId)) {
    return res.status(404).json({ success: false, message: 'Comentário não encontrado.' })
  }
  return res.json({ success: true, data: removeCommentReaction(commentId, session.email) })
})

router.get('/categories', (_req, res) => {
  res.json({
    success: true,
    data: getCategories(),
  })
})

export default router
