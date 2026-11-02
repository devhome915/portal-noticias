export type ReactionType = 'curtir' | 'amei' | 'uau' | 'triste' | 'bravo'

export type ReactionSummary = {
  total: number
  byType: Record<ReactionType, number>
  userReaction: ReactionType | null
}

export type Article = {
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

export type NewsCategory = {
  id: string
  name: string
  slug: string
  description: string
  order: number
  active: boolean
}
