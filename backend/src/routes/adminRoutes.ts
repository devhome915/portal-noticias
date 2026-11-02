import { Router, type Response } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import {
  ADMIN_SESSION_COOKIE,
  getAdminTokenFromRequest,
  requireAdminAuth,
  requireAdminCsrf,
} from '../middleware/adminAuth.js'
import {
  getAdminSession,
  isAdminAuthConfigured,
  issueAdminToken,
  revokeAdminToken,
  validateAdminCredentials,
} from '../services/authService.js'
import {
  createNews,
  deleteNewsById,
  listAdminNews,
  updateNewsById,
  updateStatusById,
} from '../services/newsService.js'
import { categoryNames } from '../data/categories.js'

const router = Router()

const articleSchema = z.object({
  titulo: z.string().min(3),
  resumo: z.string().min(10),
  conteudo: z.string().min(20),
  categoria: z.enum(categoryNames),
  autor: z.string().min(2),
  fonte: z.string().min(2),
  urlFonte: z.string().url(),
  imagemId: z.string().min(1),
  imagemUrl: z.string().url(),
  destaque: z.boolean().optional(),
  status: z.enum(['rascunho', 'pendente', 'publicado', 'arquivado']).default('rascunho'),
  dataPublicacao: z.string().datetime().optional(),
  slug: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['rascunho', 'pendente', 'publicado', 'arquivado']),
})

const loginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(6),
})

const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_ATTEMPT_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60

function setAdminSessionCookie(res: Response, token: string) {
  const secure = env.nodeEnv === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/api/admin; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`,
  )
}

function clearAdminSessionCookie(res: Response) {
  const secure = env.nodeEnv === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/api/admin; Max-Age=0${secure}`,
  )
}

router.post('/login', requireAdminCsrf, (req, res) => {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'A autenticação administrativa ainda não foi configurada.',
    })
  }

  const now = Date.now()
  const clientIp = req.ip ?? 'unknown'
  const attempt = failedLoginAttempts.get(clientIp)
  if (attempt && attempt.resetAt > now && attempt.count >= LOGIN_ATTEMPT_LIMIT) {
    res.setHeader('Retry-After', Math.ceil((attempt.resetAt - now) / 1000))
    return res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente mais tarde.',
    })
  }

  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Credenciais inválidas.',
      details: parsed.error.flatten(),
    })
  }

  const { username, password } = parsed.data

  if (!validateAdminCredentials(username, password)) {
    const activeAttempt = attempt && attempt.resetAt > now ? attempt : { count: 0, resetAt: now + LOGIN_WINDOW_MS }
    failedLoginAttempts.set(clientIp, { ...activeAttempt, count: activeAttempt.count + 1 })
    return res.status(401).json({
      success: false,
      message: 'Credenciais do painel administrativo incorretas.',
    })
  }

  failedLoginAttempts.delete(clientIp)
  const { token } = issueAdminToken(username)
  setAdminSessionCookie(res, token)

  return res.json({
    success: true,
    user: { username },
  })
})

router.get('/session', requireAdminAuth, (req, res) => {
  const token = getAdminTokenFromRequest(req)
  const session = getAdminSession(token)

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Sessão de administrador inválida ou expirada.',
    })
  }

  return res.json({
    success: true,
    data: { username: session.username, expiresAt: session.expiresAt },
  })
})

router.post('/logout', requireAdminAuth, requireAdminCsrf, (req, res) => {
  const token = getAdminTokenFromRequest(req)
  if (token) {
    revokeAdminToken(token)
  }
  clearAdminSessionCookie(res)

  return res.json({
    success: true,
    message: 'Sessão encerrada com sucesso.',
  })
})

router.get('/dashboard', requireAdminAuth, (_req, res) => {
  const articles = listAdminNews()
  const total = articles.length
  const publicados = articles.filter((article) => article.status === 'publicado').length
  const pendentes = articles.filter((article) => article.status === 'pendente').length
  const rascunhos = articles.filter((article) => article.status === 'rascunho').length

  res.json({
    success: true,
    data: {
      total,
      publicados,
      pendentes,
      rascunhos,
      recent: articles.slice(0, 5),
    },
  })
})

router.use(requireAdminAuth)
router.use(requireAdminCsrf)

router.get('/news', (_req, res) => {
  res.json({
    success: true,
    data: listAdminNews(),
  })
})

router.post('/news', (req, res) => {
  const parsed = articleSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Dados da notícia inválidos.',
      details: parsed.error.flatten(),
    })
  }

  const article = createNews(parsed.data)
  return res.status(201).json({
    success: true,
    data: article,
  })
})

router.put('/news/:id', (req, res) => {
  const id = Number(req.params.id)
  const parsed = articleSchema.partial().safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Dados de atualização inválidos.',
      details: parsed.error.flatten(),
    })
  }

  const updated = updateNewsById(id, parsed.data)

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Notícia não encontrada.',
    })
  }

  return res.json({
    success: true,
    data: updated,
  })
})

router.patch('/news/:id/status', (req, res) => {
  const id = Number(req.params.id)
  const parsed = updateStatusSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Status inválido.',
      details: parsed.error.flatten(),
    })
  }

  const updated = updateStatusById(id, parsed.data.status)

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'Notícia não encontrada.',
    })
  }

  return res.json({
    success: true,
    data: updated,
  })
})

router.delete('/news/:id', (req, res) => {
  const id = Number(req.params.id)
  const deleted = deleteNewsById(id)

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Notícia não encontrada.',
    })
  }

  return res.status(204).send()
})

export default router
