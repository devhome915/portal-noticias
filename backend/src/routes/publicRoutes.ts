import { Router } from 'express'
import { z } from 'zod'
import { getCategories, getFeaturedNews, getNewsBySlug, listPublishedNews } from '../services/newsService.js'
import {
  getReactionSummary,
  listComments,
} from '../services/socialService.js'

const router = Router()

const newsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
})

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

  return res.json({
    success: true,
    data: getReactionSummary(articleId),
  })
})

router.post('/news/:id/reactions', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'A autenticação de leitores ainda não está disponível; reações estão desativadas.',
  })
})

router.delete('/news/:id/reactions', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'A autenticação de leitores ainda não está disponível; reações estão desativadas.',
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
  return res.status(401).json({
    success: false,
    message: 'A autenticação de leitores ainda não está disponível; comentários estão desativados.',
  })
})

router.delete('/news/:id/comments/:commentId', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'A autenticação de leitores ainda não está disponível; comentários estão desativados.',
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
