import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type ReactionType = 'curtir' | 'amei' | 'uau' | 'triste' | 'bravo'

export type ReactionSummary = {
  total: number
  byType: Record<ReactionType, number>
  userReaction: ReactionType | null
}

export type ModerationStatus = 'aprovado' | 'pendente' | 'removido' | 'reportado'

export type SocialComment = {
  id: number
  articleId: number
  author: string
  userId: string
  content: string
  createdAt: string
  status: ModerationStatus
  parentId: number | null
  edited: boolean
  replies?: SocialComment[]
  reactions?: ReactionSummary
}

const emptyReactionState = (): Record<ReactionType, number> => ({
  curtir: 0,
  amei: 0,
  uau: 0,
  triste: 0,
  bravo: 0,
})

const reactionCounts = new Map<number, Record<ReactionType, number>>()
const userReactions = new Map<number, Map<string, ReactionType>>()
const articleComments = new Map<number, SocialComment[]>()
const commentReactionCounts = new Map<number, Record<ReactionType, number>>()
const commentUserReactions = new Map<number, Map<string, ReactionType>>()
const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const socialStorePath = [
  resolve(moduleDirectory, '../../data/social-store.json'),
  resolve(moduleDirectory, '../../../data/social-store.json'),
].find(existsSync) ?? resolve(moduleDirectory, '../../data/social-store.json')

type PersistedSocialStore = {
  comments?: Record<string, SocialComment[]>
  articleReactions?: Record<string, { counts: Record<ReactionType, number>; users?: Array<[string, ReactionType]> }>
  commentReactions?: Record<string, { counts: Record<ReactionType, number>; users?: Array<[string, ReactionType]> }>
}

function persistSocialStore() {
  const store: PersistedSocialStore = {
    comments: Object.fromEntries(articleComments),
    articleReactions: Object.fromEntries([...reactionCounts].map(([id, counts]) => [
      String(id), { counts, users: [...(userReactions.get(id) ?? new Map())] },
    ])),
    commentReactions: Object.fromEntries([...commentReactionCounts].map(([id, counts]) => [
      String(id), { counts, users: [...(commentUserReactions.get(id) ?? new Map())] },
    ])),
  }
  mkdirSync(dirname(socialStorePath), { recursive: true })
  writeFileSync(socialStorePath, JSON.stringify(store, null, 2), 'utf8')
}

function loadSocialStore() {
  try {
    const store = JSON.parse(readFileSync(socialStorePath, 'utf8')) as PersistedSocialStore
    for (const [id, comments] of Object.entries(store.comments ?? {})) articleComments.set(Number(id), comments)
    for (const [id, state] of Object.entries(store.articleReactions ?? {})) {
      reactionCounts.set(Number(id), state.counts)
      userReactions.set(Number(id), new Map(state.users ?? []))
    }
    for (const [id, state] of Object.entries(store.commentReactions ?? {})) {
      commentReactionCounts.set(Number(id), state.counts)
      commentUserReactions.set(Number(id), new Map(state.users ?? []))
    }
  } catch {
    // A instalação nova começa com as conversas de exemplo e cria o arquivo no primeiro ajuste.
  }
}

loadSocialStore()

const buildSeedComments = (articleId: number): SocialComment[] => {
  if (articleId === 1) {
    return [
      {
        id: 1,
        articleId,
        author: 'Luiza',
        userId: 'luiza',
        content: 'Boa cobertura e contexto útil para a discussão do setor.',
        createdAt: '2026-10-31T09:10:00.000Z',
        status: 'aprovado',
        parentId: null,
        edited: false,
        replies: [
          {
            id: 2,
            articleId,
            author: 'Theo',
            userId: 'theo',
            content: 'Concordo. O ponto mais interessante foi mostrar a parte de execução prática.',
            createdAt: '2026-10-31T09:30:00.000Z',
            status: 'aprovado',
            parentId: 1,
            edited: false,
          },
        ],
      },
      {
        id: 3,
        articleId,
        author: 'Marina',
        userId: 'marina',
        content: 'Gostei bastante da leitura, principalmente da parte de investimento local.',
        createdAt: '2026-10-31T10:00:00.000Z',
        status: 'aprovado',
        parentId: null,
        edited: false,
      },
    ]
  }

  return []
}

const ensureReactionState = (articleId: number) => {
  if (!reactionCounts.has(articleId)) {
    reactionCounts.set(articleId, emptyReactionState())
  }

  if (!userReactions.has(articleId)) {
    userReactions.set(articleId, new Map())
  }
}

const ensureCommentState = (articleId: number) => {
  if (!articleComments.has(articleId)) {
    const flatten = (items: SocialComment[]): SocialComment[] => items.flatMap((comment) => {
      const { replies, ...record } = comment
      return [record, ...flatten(replies ?? [])]
    })
    articleComments.set(articleId, flatten(buildSeedComments(articleId)))
  }
}

const ensureCommentReactionState = (commentId: number) => {
  if (!commentReactionCounts.has(commentId)) commentReactionCounts.set(commentId, emptyReactionState())
  if (!commentUserReactions.has(commentId)) commentUserReactions.set(commentId, new Map())
}

export function isCommentReactable(articleId: number, commentId: number) {
  ensureCommentState(articleId)
  const findApproved = (comments: SocialComment[]): boolean => comments.some((comment) =>
    (comment.id === commentId && comment.status === 'aprovado') || findApproved(comment.replies ?? []))
  return findApproved(articleComments.get(articleId) ?? [])
}

export function getCommentReactionSummary(commentId: number, userId?: string): ReactionSummary {
  ensureCommentReactionState(commentId)
  const byType = commentReactionCounts.get(commentId) ?? emptyReactionState()
  const total = (Object.keys(byType) as ReactionType[]).reduce((sum, key) => sum + byType[key], 0)
  return {
    total,
    byType,
    userReaction: userId ? commentUserReactions.get(commentId)?.get(userId) ?? null : null,
  }
}

export function setCommentReaction(commentId: number, userId: string, reaction: ReactionType): ReactionSummary {
  if (!userId.trim()) throw new Error('Usuário não autenticado para registrar reação.')
  ensureCommentReactionState(commentId)
  const byType = commentReactionCounts.get(commentId) ?? emptyReactionState()
  const users = commentUserReactions.get(commentId) ?? new Map<string, ReactionType>()
  const previous = users.get(userId)
  if (previous && previous !== reaction) byType[previous] = Math.max(0, byType[previous] - 1)
  if (previous !== reaction) {
    byType[reaction] += 1
    users.set(userId, reaction)
  }
  commentReactionCounts.set(commentId, byType)
  commentUserReactions.set(commentId, users)
  persistSocialStore()
  return getCommentReactionSummary(commentId, userId)
}

export function removeCommentReaction(commentId: number, userId: string): ReactionSummary {
  ensureCommentReactionState(commentId)
  const byType = commentReactionCounts.get(commentId) ?? emptyReactionState()
  const users = commentUserReactions.get(commentId) ?? new Map<string, ReactionType>()
  const previous = users.get(userId)
  if (previous) {
    byType[previous] = Math.max(0, byType[previous] - 1)
    users.delete(userId)
  }
  commentReactionCounts.set(commentId, byType)
  commentUserReactions.set(commentId, users)
  persistSocialStore()
  return getCommentReactionSummary(commentId, userId)
}

export function getReactionSummary(articleId: number, userId?: string): ReactionSummary {
  ensureReactionState(articleId)
  const counts = reactionCounts.get(articleId) ?? emptyReactionState()
  const total = (Object.keys(counts) as ReactionType[]).reduce((sum, key) => sum + counts[key], 0)
  const userReaction = userId ? userReactions.get(articleId)?.get(userId) ?? null : null

  return {
    total,
    byType: counts,
    userReaction,
  }
}

export function setReaction(articleId: number, userId: string, reaction: ReactionType): ReactionSummary {
  if (!userId.trim()) {
    throw new Error('Usuário não autenticado para registrar reação.')
  }

  ensureReactionState(articleId)

  const counts = reactionCounts.get(articleId) ?? emptyReactionState()
  const articleUsers = userReactions.get(articleId) ?? new Map<string, ReactionType>()

  const previousReaction = articleUsers.get(userId)
  if (previousReaction && previousReaction !== reaction) {
    counts[previousReaction] = Math.max(0, counts[previousReaction] - 1)
  }

  if (previousReaction !== reaction) {
    counts[reaction] += 1
    articleUsers.set(userId, reaction)
  }

  userReactions.set(articleId, articleUsers)
  reactionCounts.set(articleId, counts)
  persistSocialStore()

  return getReactionSummary(articleId, userId)
}

export function removeReaction(articleId: number, userId: string): ReactionSummary {
  ensureReactionState(articleId)
  const counts = reactionCounts.get(articleId) ?? emptyReactionState()
  const articleUsers = userReactions.get(articleId) ?? new Map<string, ReactionType>()
  const currentReaction = articleUsers.get(userId)

  if (currentReaction) {
    counts[currentReaction] = Math.max(0, counts[currentReaction] - 1)
    articleUsers.delete(userId)
  }

  userReactions.set(articleId, articleUsers)
  reactionCounts.set(articleId, counts)
  persistSocialStore()

  return getReactionSummary(articleId, userId)
}

export function getCommentsCount(articleId: number) {
  ensureCommentState(articleId)
  return articleComments.get(articleId)?.filter((comment) => comment.status === 'aprovado').length ?? 0
}

const buildTree = (allComments: SocialComment[], parentId: number | null, userId?: string): SocialComment[] =>
  allComments
    .filter((comment) => comment.parentId === parentId && comment.status === 'aprovado')
    .map((comment) => ({
      ...comment,
      reactions: getCommentReactionSummary(comment.id, userId),
      replies: buildTree(allComments, comment.id, userId),
    }))

export function listComments(articleId: number, page: number, limit: number, userId?: string) {
  ensureCommentState(articleId)
  const allComments = articleComments.get(articleId) ?? []
  const approved = allComments.filter((comment) => comment.status === 'aprovado')
  const topLevel = approved.filter((comment) => comment.parentId === null)
  const total = topLevel.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (currentPage - 1) * limit
  const slice = topLevel.slice(startIndex, startIndex + limit)

  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    items: slice.map((comment) => ({
      ...comment,
      reactions: getCommentReactionSummary(comment.id, userId),
      replies: buildTree(approved, comment.id, userId),
    })),
  }
}

export function createComment(articleId: number, userId: string, author: string, content: string, parentId?: number | null) {
  ensureCommentState(articleId)

  const comments = articleComments.get(articleId) ?? []
  const record: SocialComment = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    articleId,
    author,
    userId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    status: 'aprovado',
    parentId: parentId ?? null,
    edited: false,
  }

  comments.push(record)
  articleComments.set(articleId, comments)
  persistSocialStore()
  return record
}

export function deleteComment(articleId: number, commentId: number, userId: string) {
  ensureCommentState(articleId)
  const comments = articleComments.get(articleId) ?? []
  const target = comments.find((comment) => comment.id === commentId)

  if (!target || target.userId !== userId) {
    return false
  }

  const targetIndex = comments.findIndex((comment) => comment.id === commentId)
  comments.splice(targetIndex, 1)
  articleComments.set(articleId, comments)
  persistSocialStore()
  return true
}
