import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NewsInteractionBar } from './App'

type MockArticle = {
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
  reactions?: {
    total: number
    byType: {
      curtir: number
      amei: number
      uau: number
      triste: number
      bravo: number
    }
    userReaction: 'curtir' | 'amei' | 'uau' | 'triste' | 'bravo' | null
  }
  commentCount?: number
}

const article: MockArticle = {
  id: 12,
  slug: 'energia-renovavel-brasil',
  titulo: 'Energia renovável ganha velocidade no Brasil',
  resumo: 'Resumo da notícia com foco em expansão e impactos locais.',
  conteudo: 'Conteúdo da reportagem com contexto completo.',
  categoria: 'Brasil',
  autor: 'Ana Souza',
  fonte: 'Portal de Notícias',
  imagemUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9',
  dataPublicacao: '2026-10-31T08:30:00.000Z',
  reactions: {
    total: 42,
    byType: { curtir: 18, amei: 11, uau: 7, triste: 3, bravo: 3 },
    userReaction: null,
  },
  commentCount: 17,
}

describe('NewsInteractionBar', () => {
  it('renders the compact social summary', () => {
    render(
      <NewsInteractionBar
        article={article}
        isAuthenticated={true}
        onReact={vi.fn()}
        onRemoveReaction={vi.fn()}
        onOpenComments={vi.fn()}
        onRequireLogin={vi.fn()}
      />,
    )

    expect(screen.getByText('42 reações')).toBeInTheDocument()
    expect(screen.getByText('17 comentários')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reagir/i })).toBeInTheDocument()
  })

  it('opens the reaction selector and selects a reaction', async () => {
    const onReact = vi.fn()

    render(
      <NewsInteractionBar
        article={article}
        isAuthenticated={true}
        onReact={onReact}
        onRemoveReaction={vi.fn()}
        onOpenComments={vi.fn()}
        onRequireLogin={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reagir/i }))
    fireEvent.click(screen.getByRole('button', { name: /curtir/i }))

    expect(onReact).toHaveBeenCalledWith('curtir')
  })

  it('replaces an existing reaction and removes it', async () => {
    const onRemoveReaction = vi.fn()

    render(
      <NewsInteractionBar
        article={{
          ...article,
          reactions: {
            total: article.reactions?.total ?? 0,
            byType: article.reactions?.byType ?? {
              curtir: 0,
              amei: 0,
              uau: 0,
              triste: 0,
              bravo: 0,
            },
            userReaction: 'amei',
          },
        }}
        isAuthenticated={true}
        onReact={vi.fn()}
        onRemoveReaction={onRemoveReaction}
        onOpenComments={vi.fn()}
        onRequireLogin={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reagir/i }))
    fireEvent.click(screen.getByRole('button', { name: /remover reação/i }))

    expect(onRemoveReaction).toHaveBeenCalledTimes(1)
  })

  it('asks the user to sign in when unauthenticated', () => {
    const onRequireLogin = vi.fn()

    render(
      <NewsInteractionBar
        article={article}
        isAuthenticated={false}
        onReact={vi.fn()}
        onRemoveReaction={vi.fn()}
        onOpenComments={vi.fn()}
        onRequireLogin={onRequireLogin}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /reagir/i }))

    expect(onRequireLogin).toHaveBeenCalledTimes(1)
  })

  it('calls the comments callback when the user chooses to comment', () => {
    const onOpenComments = vi.fn()

    render(
      <NewsInteractionBar
        article={article}
        isAuthenticated={true}
        onReact={vi.fn()}
        onRemoveReaction={vi.fn()}
        onOpenComments={onOpenComments}
        onRequireLogin={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /comentários/i }))

    expect(onOpenComments).toHaveBeenCalledTimes(1)
  })
})
