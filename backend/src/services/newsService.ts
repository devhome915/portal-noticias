import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { env } from '../config/env.js'
import { categoryRegistry } from '../data/categories.js'
import { newsSeed } from '../data/news.js'
import type { CreateNewsInput, NewsArticle, NewsStatus } from '../types.js'
import { getCommentsCount, getReactionSummary } from './socialService.js'

const newsStorePath = path.resolve(process.cwd(), 'data/news-store.json')

function loadArticles(): NewsArticle[] {
  if (env.nodeEnv === 'test' || !existsSync(newsStorePath)) return [...newsSeed]

  try {
    const saved = JSON.parse(readFileSync(newsStorePath, 'utf8')) as unknown
    if (!Array.isArray(saved)) throw new Error('O arquivo de notícias precisa conter uma lista.')
    return saved as NewsArticle[]
  } catch (error) {
    throw new Error(`Não foi possível carregar os dados locais de notícias: ${error instanceof Error ? error.message : 'arquivo inválido'}`)
  }
}

function persistArticles() {
  if (env.nodeEnv === 'test') return
  mkdirSync(path.dirname(newsStorePath), { recursive: true })
  const temporaryPath = `${newsStorePath}.${process.pid}.tmp`
  writeFileSync(temporaryPath, JSON.stringify(articles, null, 2), 'utf8')
  renameSync(temporaryPath, newsStorePath)
}

const articles: NewsArticle[] = loadArticles()

export function listPublishedNews(params: {
  category?: string
  search?: string
  page?: number
  limit?: number
  userId?: string
}) {
  const page = Number(params.page ?? 1)
  const limit = Number(params.limit ?? 9)
  const category = params.category?.trim()
  const search = params.search?.trim().toLowerCase() ?? ''

  let filtered = articles
    .filter((article) => article.status === 'publicado')
    .sort((left, right) => right.dataPublicacao.localeCompare(left.dataPublicacao))

  if (category && category !== 'Todas') {
    filtered = filtered.filter((article) => article.categoria === category)
  }

  if (search) {
    filtered = filtered.filter((article) => {
      const haystack = `${article.titulo} ${article.resumo} ${article.conteudo}`.toLowerCase()
      return haystack.includes(search)
    })
  }

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (currentPage - 1) * limit
  const data = filtered.slice(startIndex, startIndex + limit).map((article) => ({
    ...article,
    reactions: getReactionSummary(article.id, params.userId),
    commentCount: getCommentsCount(article.id),
  }))

  return {
    items: data,
    page: currentPage,
    limit,
    total,
    totalPages,
    categories: getCategories(),
  }
}

export function getNewsBySlug(slug: string, userId?: string) {
  const article = articles.find((item) => item.slug === slug && item.status === 'publicado')

  if (!article) {
    return null
  }

  return {
    ...article,
    reactions: getReactionSummary(article.id, userId),
    commentCount: getCommentsCount(article.id),
  }
}

export function isPublishedNews(id: number) {
  return articles.some((article) => article.id === id && article.status === 'publicado')
}

export function getFeaturedNews(userId?: string) {
  const published = articles.filter((item) => item.status === 'publicado')
  const article =
    published.find((item) => item.destaque) ??
    published.sort((left, right) => right.dataPublicacao.localeCompare(left.dataPublicacao))[0]

  if (!article) {
    return null
  }

  return {
    ...article,
    reactions: getReactionSummary(article.id, userId),
    commentCount: getCommentsCount(article.id),
  }
}

export function getCategories() {
  return categoryRegistry.filter((category) => category.active).sort((a, b) => a.order - b.order)
}

export function listAdminNews() {
  return articles
}

export function createNews(input: CreateNewsInput) {
  const slug = input.slug ?? input.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const now = new Date().toISOString()

  const article: NewsArticle = {
    id: Date.now(),
    titulo: input.titulo,
    slug,
    resumo: input.resumo,
    conteudo: input.conteudo,
    categoria: input.categoria,
    autor: input.autor,
    fonte: input.fonte,
    urlFonte: input.urlFonte,
    imagemId: input.imagemId,
    imagemUrl: input.imagemUrl,
    destaque: Boolean(input.destaque),
    status: input.status ?? 'rascunho',
    dataPublicacao: input.dataPublicacao ?? now,
    dataCriacao: now,
    dataAtualizacao: now,
    versao: input.versao ?? 1,
  }

  articles.unshift(article)
  persistArticles()
  return article
}

export function updateNewsById(id: number, input: Partial<CreateNewsInput>) {
  const index = articles.findIndex((article) => article.id === id)

  if (index === -1) {
    return null
  }

  const current = articles[index]
  const updated: NewsArticle = {
    ...current,
    ...input,
    dataAtualizacao: new Date().toISOString(),
    versao: current.versao + 1,
  }

  articles[index] = updated
  persistArticles()
  return updated
}

export function deleteNewsById(id: number) {
  const index = articles.findIndex((article) => article.id === id)

  if (index === -1) {
    return false
  }

  const [removed] = articles.splice(index, 1)
  if (removed) persistArticles()
  return removed !== undefined
}

export function updateStatusById(id: number, newStatus: NewsStatus) {
  return updateNewsById(id, { status: newStatus })
}
