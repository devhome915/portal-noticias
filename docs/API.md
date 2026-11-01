# API REST do Portal de Notícias

## Endpoints públicos

### GET /api/health
Retorna o status da API.

### GET /api/news
Lista notícias públicas com suporte a filtros.

Query params:
- category: categoria
- search: termo de busca
- page: página atual
- limit: quantidade por página

### GET /api/news/featured
Retorna a notícia destacada.

### GET /api/news/search
Alias para busca textual em notícias públicas.

### GET /api/categories
Lista categorias disponíveis.

## Endpoints administrativos

### GET /api/admin/news
Lista notícias do painel administrativo.

### POST /api/admin/news
Cria uma nova notícia.

### PUT /api/admin/news/:id
Atualiza uma notícia.

### DELETE /api/admin/news/:id
Exclui uma notícia.

### PATCH /api/admin/news/:id/status
Atualiza o status da notícia.

### GET /api/admin/google/status
Retorna status de integração Google. Atualmente bloqueado até aprovação e configuração real.

## Observações

- A API local funciona em memória para permitir desenvolvimento incremental e testes.
- Google Sheets, Drive e Fotos não devem ser configurados sem autorização explícita do usuário.
- O contrato REST segue a estrutura planejada para evolução futura.
