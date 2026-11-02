import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CategoryPage } from './CategoryPage'

const categories = [
  { id: 'games', name: 'Games', slug: 'games', description: 'Notícias sobre games.', order: 8, active: true },
]

const news = [{
  id: 21,
  slug: 'games-lancamento',
  titulo: 'Novo lançamento em Games',
  resumo: 'Resumo editorial da notícia.',
  conteudo: 'Conteúdo completo da notícia.',
  categoria: 'Games',
  autor: 'Redação',
  fonte: 'Portal',
  imagemUrl: '/news.jpg',
  dataPublicacao: '2026-10-31T08:30:00.000Z',
  reactions: { total: 3, byType: { curtir: 3, amei: 0, uau: 0, triste: 0, bravo: 0 }, userReaction: null },
  commentCount: 1,
}]

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CategoryPage', () => {
  it('loads category news and exposes pagination', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input), 'http://localhost')
      if (url.pathname === '/api/categories') {
        return { ok: true, json: async () => ({ success: true, data: categories }) }
      }

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: news,
          pagination: { page: Number(url.searchParams.get('page')), totalPages: 2, total: 11 },
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/categorias/games']}>
        <Routes>
          <Route path="/categorias/:slug" element={<CategoryPage />} />
          <Route path="/busca" element={<CategoryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Novo lançamento em Games' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('category=Games'))

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(expect.stringContaining('page=2'))
    })
  })
})
