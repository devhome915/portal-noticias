# Progresso do projeto Portal de Notícias

## Fase 0 — Auditoria e diagnóstico inicial

### Objetivo
Validar o estado do repositório, identificar riscos, confirmar o stack atual e registrar o roadmap inicial.

### Arquivos envolvidos
- `README.md`
- `package.json`
- `.gitignore`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`

### Implementado
- Verificação do estado do Git e da branch ativa.
- Confirmação da versão do Node e npm.
- Diagnóstico da estrutura atual do frontend.
- Registro inicial do roadmap e dos riscos.

### Status
- Implementado e validado.

## Fase 1 — Base visual do portal público

### Objetivo
Estabelecer a base da experiência pública do portal, com identidade visual, navegação principal, busca, categorias e tratamento de estados visuais para notícias.

### Arquivos envolvidos
- `src/App.tsx`
- `src/App.css`
- `src/index.css`
- `README.md`

### Decisão técnica
- Mantivemos a estrutura Vite/React/TypeScript já iniciada e substituímos a tela padrão por um layout editorial responsivo.
- A aplicação pública foi implementada com dados locais simulados para validar UX, filtros, busca e estados de carregamento sem depender de credenciais externas.
- O código foi organizado para permitir migrar facilmente para integração com API real em fases posteriores.

### Implementação
- Cabeçalho com identidade visual e menu principal.
- Campo de busca funcional por título, resumo e conteúdo.
- Filtros por categoria.
- Destaque principal para a notícia mais relevante.
- Grade de notícias recentes e cards com thumbnail.
- Estados de carregamento, erro e sem resultados.
- Layout responsive para mobile.

### Verificações executadas
- `npm run build` validado.
- `npm run lint` validado.

### Status
- Implementado e testado localmente.

## Fase 2 — Backend Express + API REST inicial

### Objetivo
Preparar a base do backend com endpoints reais, validação, estrutura modular e testes automatizados para suporte ao frontend.

### Arquivos envolvidos
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/routes/publicRoutes.ts`
- `backend/src/routes/adminRoutes.ts`
- `backend/src/services/newsService.ts`
- `backend/src/data/news.ts`
- `backend/src/types.ts`
- `backend/tests/api.test.ts`
- `.env.example`

### Decisão técnica
- Criamos uma API Express em TypeScript separada do frontend para manter a arquitetura clara.
- A comunicação frontend/backend foi configurada com proxy do Vite para `http://localhost:3001`.
- O backend usa dados locais em memória para permitir testes e validação antes das integrações com Google.
- Google Cloud, Google Sheets, Drive e Fotos continuam bloqueados até autorização explícita do usuário.

### Implementação
- Endpoint `GET /api/health`.
- Endpoint `GET /api/news` com filtros, paginação e busca.
- Endpoint `GET /api/categories`.
- Endpoint `GET /api/news/featured`.
- Endpoint administrativo para listar e criar notícias.
- Endpoints de alteração e status das notícias.
- Middleware centralizado de erros.
- Testes de integração básicos para saúde, listagem e criação.

### Verificações executadas
- `npm --prefix backend test` validado.
- `npm --prefix backend run build` validado.
- `npm run build` validado.

### Pendências e riscos
- Integração real com Google não iniciada.
- O backend local funciona em memória e ainda não persiste em banco de dados externo.
- Autenticação administrativa e painel ainda precisam ser implementados.

## Fase 3 — Interações sociais compactas e página de detalhe

### Objetivo
Reduzir o ruído visual da homepage, manter a descoberta de notícias limpa e concentrar reações, comentários e respostas na página individual da matéria.

### Arquivos envolvidos
- `src/App.tsx`
- `src/App.css`
- `src/App.test.tsx`
- `vite.config.ts`
- `docs/PROGRESSO.md`

### Decisão técnica
- Mantemos a homepage com cards enxutos, sem listas extensas de comentários ou respostas.
- Criamos o componente reutilizável `NewsInteractionBar` para resumo de reações e abertura do seletor compacto.
- A navegação de comentários leva para `/noticias/:slug#comentarios`, mantendo a leitura em foco na home.
- A página individual centraliza conteúdo completo, interações e discussão em profundidade.

### Implementação
- Barra compacta de reações com contagem, seleção, troca e remoção de reação.
- Popover acessível por clique, toque e teclado com suporte a Escape e clique fora.
- Botões de comentar e reagir em layout responsivo desktop/mobile.
- Página de detalhe com cabeçalho, conteúdo completo e seção de comentários com paginação.
- Testes automatizados para renderização, interação, autenticação e navegação.

### Verificações executadas
- `npm run build`
- `npx vitest run src/App.test.tsx`

### Status
- Implementado parcialmente em frontend e validado localmente.

## Fase 4 — Revisão de segurança e páginas públicas

### Implementado
- Removidos os valores padrão de autenticação administrativa; a senha é verificada por hash scrypt.
- Sessão administrativa migrada para cookie HttpOnly, SameSite=Lax e validade limitada, com verificação de origem para operações de escrita.
- Escritas sociais sem autenticação real agora retornam 401; cabeçalhos de identidade enviados pelo cliente não autenticam usuários.
- Detalhes de notícias não publicadas não são entregues pela rota pública.
- A configuração do backend carrega `backend/.env`, com validação Zod; o README orienta a criação local do arquivo e geração oculta do hash de senha.
- O `NewsInteractionBar` foi extraído para componente reutilizável.
- Adicionadas páginas de categoria e busca com paginação, menu alimentado pelas categorias da API, categoria Games e página 404.
- Substituídos links fictícios da navegação pública por destinos existentes.
- Criado o guia de configuração Google com escopos restritos e ressalvas para publicação.
- Configurado o cliente OAuth Web local em `backend/.env` (ignorado pelo Git), com callback registrado, estado CSRF vinculado à sessão administrativa, escopos Sheets + Drive `drive.file`, status/conectar/desconectar e painel no Dashboard.
- Adicionada opção **Continuar com Google** ao login administrativo; o backend consulta o perfil verificado e aceita somente `ADMIN_GOOGLE_EMAIL`. O callback OAuth já cadastrado foi reutilizado.
- Notícias criadas, editadas ou removidas no painel agora são gravadas atomicamente em `backend/data/news-store.json`, ignorado pelo Git; testes usam os dados seed sem gravar no arquivo local.
- A sessão OAuth passou a valer também no portal público, com cookie HttpOnly no caminho `/`, identificação visível no cabeçalho e acesso ao painel apenas para o e-mail administrativo.
- Reações e comentários passaram a aceitar a sessão verificada; a identidade vem do servidor. O painel ganhou edição completa de matérias além de criação, publicação e exclusão.

### Validação
- Testes backend: 7 aprovados.
- Build backend: aprovado.
- Build frontend: aprovado.
- Lint frontend: executado; reporta avisos de hooks em telas existentes.
- Testes frontend: 8 aprovados na execução anterior; a reexecução após acrescentar casos de teclado e HTTP 503 não iniciou, pois o Vitest não conseguiu iniciar seus workers.
- Verificação manual no navegador: home sem comentários embutidos, rota Games, detalhe com hash `#comentarios`, 404, login com erro de configuração, redirecionamento do dashboard sem sessão e botões lado a lado em viewport desktop/mobile.

### Limitações conhecidas
- Login Google agora cria sessão de leitor ou administrador. Reações e comentários usam essa sessão, e o painel só aparece para o e-mail administrativo configurado.
- OAuth Sheets/Drive pode ser autorizado no Dashboard; os conectores de dados ainda não foram implementados e os tokens permanecem somente em memória no ambiente local. Login usa os escopos `openid email profile`.
- Google Fotos continua desativado; a gestão de imagens, moderação e persistência social ainda precisam ser implementadas.
- A validação visual foi feita localmente; publicação e revisão em ambiente hospedado continuam pendentes.

## Roadmap previsto
1. [x] Proteger autenticação administrativa e filtrar conteúdo público.
2. [x] Criar rotas por categoria, busca paginada, Games e página 404.
3. [ ] Finalizar regressão visual e testes de acessibilidade/responsividade.
4. [x] Configurar OAuth Google local com permissões restritas.
5. [ ] Implementar conectores Sheets/Drive e persistência segura de tokens.
6. [ ] Integrar Sheets/Drive e persistência de notícias.
7. [ ] Avaliar Google Fotos e RSS com escopos e políticas adequados.
8. [ ] Expandir testes/CI e preparar publicação.

## Registro do diagnóstico
- Repositório localizado em `portal-noticias`.
- Stack atual: React + Vite + TypeScript no frontend e Express + TypeScript no backend.
- Branch ativa: `refactor/security-pages-navigation`.
- Estrutura atual: frontend preservado; backend adicionado de forma modular e local.
- Integrações externas permanecem bloqueadas por autorização do usuário.
