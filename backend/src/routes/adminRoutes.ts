import { Router } from 'express'
import { z } from 'zod'
import { requireAdminAuth } from '../middleware/adminAuth.js'
import {
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

const router = Router()

const articleSchema = z.object({
  titulo: z.string().min(3),
  resumo: z.string().min(10),
  conteudo: z.string().min(20),
  categoria: z.enum(['Brasil', 'Mundo', 'Política', 'Economia', 'Tecnologia', 'Esportes', 'Entretenimento']),
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

router.post('/login', (req, res) => {
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
    return res.status(401).json({
      success: false,
      message: 'Credenciais do painel administrativo incorretas.',
    })
  }

  const token = issueAdminToken(username)

  return res.json({
    success: true,
    token,
    user: { username },
  })
})

router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (token) {
    revokeAdminToken(token)
  }

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
