import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

const trustedOrigin = 'http://localhost:5173'

describe('Portal API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.status).toBe('ok')
  })

  it('lists published news in publication date order', async () => {
    const response = await request(app).get('/api/news')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
    expect(response.body.data[0].dataPublicacao).toBe('2026-10-31T08:30:00.000Z')
  })

  it('returns active categories including Games', async () => {
    const response = await request(app).get('/api/categories')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.map((category: { slug: string }) => category.slug)).toContain('games')
  })

  it('rejects invalid admin credentials with a JSON response', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .set('Origin', trustedOrigin)
      .send({ username: 'unknown-user', password: 'not-a-real-password' })

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
    expect(response.body.message).toMatch(/incorretas/i)
  })

  it('uses an HttpOnly session cookie for administrative requests', async () => {
    const client = request.agent(app)
    const loginResponse = await client
      .post('/api/admin/login')
      .set('Origin', trustedOrigin)
      .send({
        username: 'test-admin',
        password: 'test-only-password',
      })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.success).toBe(true)
    expect(loginResponse.body.token).toBeUndefined()
    expect(loginResponse.headers['set-cookie'][0]).toContain('HttpOnly')

    const sessionResponse = await client.get('/api/admin/session')
    expect(sessionResponse.status).toBe(200)

    const payload = {
      titulo: 'Nova notícia de teste',
      resumo: 'Resumo da notícia de teste com conteúdo válido.',
      conteudo: 'Conteúdo completo da notícia de teste para validar a criação no backend.',
      categoria: 'Games',
      autor: 'Teste',
      fonte: 'Portal Teste',
      urlFonte: 'https://example.com/artigo',
      imagemId: 'img-teste-1',
      imagemUrl: 'https://example.com/imagem.jpg',
      destaque: false,
      status: 'pendente',
      slug: 'noticia-pendente-teste',
    }

    const createResponse = await client
      .post('/api/admin/news')
      .set('Origin', trustedOrigin)
      .send(payload)

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.categoria).toBe('Games')

    const publicResponse = await request(app).get('/api/news/slug/noticia-pendente-teste')
    expect(publicResponse.status).toBe(404)

    const logoutResponse = await client
      .post('/api/admin/logout')
      .set('Origin', trustedOrigin)
    expect(logoutResponse.status).toBe(200)
    expect((await client.get('/api/admin/session')).status).toBe(401)
  })

  it('rejects admin mutations without a valid same-site session', async () => {
    const response = await request(app)
      .post('/api/admin/news')
      .set('Origin', trustedOrigin)
      .send({})

    expect(response.status).toBe(401)
  })

  it('does not trust caller-supplied identity headers for social writes', async () => {
    const reactionResponse = await request(app)
      .post('/api/news/1/reactions')
      .set('x-user-id', 'administrator')
      .send({ reaction: 'curtir' })

    const commentResponse = await request(app)
      .post('/api/news/1/comments')
      .set('x-user-id', 'administrator')
      .send({ content: 'Comentário falsificado pelo cabeçalho.' })

    expect(reactionResponse.status).toBe(401)
    expect(commentResponse.status).toBe(401)
  })
})
