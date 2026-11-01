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
    articleComments.set(articleId, buildSeedComments(articleId))
  }
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

  return getReactionSummary(articleId, userId)
}

export function getCommentsCount(articleId: number) {
  ensureCommentState(articleId)
  return articleComments.get(articleId)?.filter((comment) => comment.status === 'aprovado').length ?? 0
}

const buildTree = (allComments: SocialComment[], parentId: number | null): SocialComment[] =>
  allComments
    .filter((comment) => comment.parentId === parentId && comment.status === 'aprovado')
    .map((comment) => ({
      ...comment,
      replies: buildTree(allComments, comment.id),
    }))

export function listComments(articleId: number, page: number, limit: number) {
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
      replies: buildTree(approved, comment.id),
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
  return true
}
