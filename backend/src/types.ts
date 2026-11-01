export type NewsStatus = 'rascunho' | 'pendente' | 'publicado' | 'arquivado'

export type Category =
  | 'Brasil'
  | 'Mundo'
  | 'Política'
  | 'Economia'
  | 'Tecnologia'
  | 'Esportes'
  | 'Entretenimento'

export interface NewsArticle {
  id: number
  titulo: string
  slug: string
  resumo: string
  conteudo: string
  categoria: Category
  autor: string
  fonte: string
  urlFonte: string
  imagemId: string
  imagemUrl: string
  destaque: boolean
  status: NewsStatus
  dataPublicacao: string
  dataCriacao: string
  dataAtualizacao: string
  versao: number
}

export type CreateNewsInput = {
  titulo: string
  slug?: string
  resumo: string
  conteudo: string
  categoria: Category
  autor: string
  fonte: string
  urlFonte: string
  imagemId: string
  imagemUrl: string
  destaque?: boolean
  status?: NewsStatus
  dataPublicacao?: string
  dataCriacao?: string
  dataAtualizacao?: string
  versao?: number
}
