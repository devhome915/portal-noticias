# API REST do Portal de Notícias

## Endpoints públicos

### GET /api/auth/session
Retorna o usuário Google conectado e o papel de acesso (`reader` ou `admin`).

### POST /api/auth/logout
Encerra a sessão do portal; exige a origem local autorizada.

### POST /api/news/:id/comments/:commentId/reactions
Registra ou troca a reação do usuário autenticado em um comentário ou resposta.

### DELETE /api/news/:id/comments/:commentId/reactions
Remove a reação do usuário autenticado de um comentário ou resposta.

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
Retorna o estado da configuração e da autorização Google da sessão administrativa.

### GET /api/admin/google/login
Inicia o login administrativo Google. O backend só cria sessão quando o e-mail verificado corresponde a `ADMIN_GOOGLE_EMAIL`.

### GET /api/admin/google/auth
Inicia o fluxo OAuth Google com os escopos de Sheets e Drive limitados a `drive.file`.

### GET /api/admin/google/auth/callback
Callback OAuth cadastrado no Google Cloud Console. Conclui o login Google ou a autorização de integrações iniciada por uma sessão administrativa.

### POST /api/admin/google/disconnect
Revoga o token Google e remove a conexão mantida para a sessão.

## Observações

- Notícias do painel são persistidas em JSON local; sessões e dados sociais ainda ficam em memória.
- Reações e comentários de leitores exigem uma sessão Google válida; a identidade é derivada do cookie HttpOnly.
- Google Sheets, Drive e Fotos não devem ser configurados sem autorização explícita do usuário.
- O contrato REST segue a estrutura planejada para evolução futura.
