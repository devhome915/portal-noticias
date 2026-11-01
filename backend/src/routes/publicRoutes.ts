import { Router } from 'express'
import { z } from 'zod'
import { getCategories, getFeaturedNews, getNewsBySlug, listPublishedNews } from '../services/newsService.js'
import {
  createComment,
  deleteComment,
  getReactionSummary,
  listComments,
  removeReaction,
  setReaction,
} from '../services/socialService.js'

const router = Router()

const newsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
})

const reactionSchema = z.object({
  reaction: z.enum(['curtir', 'amei', 'uau', 'triste', 'bravo']),
})

const commentSchema = z.object({
  author: z.string().trim().min(2).max(60).optional(),
  content: z.string().trim().min(2).max(500),
  parentId: z.coerce.number().int().positive().optional(),
})

const getUserId = (req: { headers: Record<string, string | string[] | undefined> }) => {
  const userId = req.headers['x-user-id']
  if (typeof userId === 'string') {
    return userId.trim()
  }

  return ''
}

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'portal-noticias-api',
    timestamp: new Date().toISOString(),
    google: {
      sheets: 'blocked',
      drive: 'blocked',
      photos: 'blocked',
      reason: 'Credenciais do Google não configuradas. Solicite autorização antes de ativar integrações externas.',
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

  const response = listPublishedNews(result.data)
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
  const response = listPublishedNews({ search })

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

router.get('/news/featured', (_req, res) => {
  const featured = getFeaturedNews()

  return res.json({
    success: true,
    data: featured,
  })
})

router.get('/news/slug/:slug', (req, res) => {
  const article = getNewsBySlug(req.params.slug)

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
  const userId = getUserId(req)

  return res.json({
    success: true,
    data: getReactionSummary(articleId, userId || undefined),
  })
})

router.post('/news/:id/reactions', (req, res) => {
  const articleId = Number(req.params.id)
  const userId = getUserId(req)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Faça login para registrar uma reação.',
    })
  }

  const parsed = reactionSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Reação inválida.',
      details: parsed.error.flatten(),
    })
  }

  const summary = setReaction(articleId, userId, parsed.data.reaction)

  return res.json({
    success: true,
    data: summary,
  })
})

router.delete('/news/:id/reactions', (req, res) => {
  const articleId = Number(req.params.id)
  const userId = getUserId(req)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Faça login para remover a reação.',
    })
  }

  return res.json({
    success: true,
    data: removeReaction(articleId, userId),
  })
})

router.get('/news/:id/comments', (req, res) => {
  const articleId = Number(req.params.id)
  const page = Number(req.query.page ?? 1)
  const limit = Number(req.query.limit ?? 10)

  return res.json({
    success: true,
    data: listComments(articleId, page, limit),
  })
})

router.post('/news/:id/comments', (req, res) => {
  const articleId = Number(req.params.id)
  const userId = getUserId(req)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Faça login para comentar.',
    })
  }

  const parsed = commentSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Comentário inválido.',
      details: parsed.error.flatten(),
    })
  }

  const comment = createComment(
    articleId,
    userId,
    parsed.data.author ?? 'Usuário autenticado',
    parsed.data.content,
    parsed.data.parentId,
  )

  return res.status(201).json({
    success: true,
    data: comment,
  })
})

router.delete('/news/:id/comments/:commentId', (req, res) => {
  const articleId = Number(req.params.id)
  const commentId = Number(req.params.commentId)
  const userId = getUserId(req)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Faça login para excluir o comentário.',
    })
  }

  const deleted = deleteComment(articleId, commentId, userId)

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Comentário não encontrado ou não autorizado.',
    })
  }

  return res.json({
    success: true,
    message: 'Comentário removido.',
  })
})

router.get('/categories', (_req, res) => {
  res.json({
    success: true,
    data: getCategories(),
  })
})

router.get('/admin/google/status', (_req, res) => {
  res.json({
    success: true,
    configured: false,
    provider: 'google-cloud',
    status: 'pending-authorization',
    message:
      'A autenticação e integração com Google ainda dependem de aprovação e configuração externa.',
  })
})

export default router
