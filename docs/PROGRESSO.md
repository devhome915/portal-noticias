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

## Roadmap previsto
1. Finalizar a estrutura do backend e API REST.
2. Implementar autenticação administrativa.
3. Integrar Google Sheets e estrutura de banco inicial.
4. Integrar Google Drive e gestão de imagens.
5. Integrar Google Fotos e importação de imagens.
6. Implementar RSS e revisão manual.
7. Expandir testes e CI.
8. Preparar documentação e publicação.

## Registro do diagnóstico
- Repositório localizado em `portal-noticias`.
- Stack atual: React + Vite + TypeScript no frontend e Express + TypeScript no backend.
- Branch ativa: `main`.
- Estrutura atual: frontend preservado; backend adicionado de forma modular e local.
- Integrações externas permanecem bloqueadas por autorização do usuário.
