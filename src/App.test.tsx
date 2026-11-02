import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { NewsInteractionBar } from './components/NewsInteractionBar'

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

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

describe('PublicPortal API errors', () => {
  it('explains when the backend is unavailable and offers a retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: vi.fn().mockResolvedValue(''),
      }),
    )

    render(<App />)

    expect(await screen.findByText(/A API está indisponível \(HTTP 502\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('shows a readable login error when the backend returns an empty gateway response', async () => {
    window.history.replaceState({}, '', '/admin/login')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: vi.fn().mockResolvedValue(''),
      }),
    )

    render(<App />)
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'test-user' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'not-a-real-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/A API está indisponível \(HTTP 502\)/i)).toBeInTheDocument()
  })

  it('shows the backend configuration error for an HTTP 503 JSON response', async () => {
    window.history.replaceState({}, '', '/admin/login')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({
            success: false,
            message: 'A autenticação administrativa ainda não foi configurada.',
          }),
        ),
      }),
    )

    render(<App />)
    fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'test-user' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'not-a-real-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/A autenticação administrativa ainda não foi configurada/i)).toBeInTheDocument()
  })
})

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

  it('supports arrow-key navigation and Escape in the reaction selector', () => {
    render(
      <NewsInteractionBar
        article={article}
        isAuthenticated
        onReact={vi.fn()}
        onRemoveReaction={vi.fn()}
        onOpenComments={vi.fn()}
        onRequireLogin={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', { name: /reagir/i })
    fireEvent.click(trigger)
    const likeOption = screen.getByRole('button', { name: /curtir/i })
    expect(likeOption).toHaveFocus()

    fireEvent.keyDown(likeOption, { key: 'ArrowRight' })
    expect(screen.getByRole('button', { name: /amei/i })).toHaveFocus()

    fireEvent.keyDown(screen.getByRole('button', { name: /amei/i }), { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Selecionar reação' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
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
