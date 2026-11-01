import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app.js'

describe('Portal API', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.status).toBe('ok')
  })

  it('lists published news', async () => {
    const response = await request(app).get('/api/news')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  it('returns categories', async () => {
    const response = await request(app).get('/api/categories')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data)).toBe(true)
  })

  it('creates news in admin route', async () => {
    const loginResponse = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'portal-admin-2026',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.success).toBe(true)

    const payload = {
      titulo: 'Nova notícia de teste',
      resumo: 'Resumo da notícia de teste com conteúdo válido.',
      conteudo: 'Conteúdo completo da notícia de teste para validar a criação no backend.',
      categoria: 'Tecnologia',
      autor: 'Teste',
      fonte: 'Portal Teste',
      urlFonte: 'https://example.com/artigo',
      imagemId: 'img-teste-1',
      imagemUrl: 'https://example.com/imagem.jpg',
      destaque: false,
      status: 'pendente',
    }

    const response = await request(app)
      .post('/api/admin/news')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .send(payload)

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.titulo).toBe(payload.titulo)
  })
})
