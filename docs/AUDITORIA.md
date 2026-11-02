# Auditoria inicial do portal

## Baseline

- Branch de trabalho: `refactor/security-pages-navigation`.
- A suíte inicial do backend passou: 4 testes.
- O build inicial do backend passou.
- O lint do frontend passou com 8 avisos relacionados a atualizações de estado em efeitos e dependências de efeitos.
- O teste inicial de componentes da interface está disponível por `npx vitest run src/App.test.tsx`; a descoberta nativa do VS Code não tem um test controller configurado.
- Ao abrir `/admin/login` com o backend parado, uma tentativa de login mostra `Unexpected end of JSON input`, pois a tela presume que toda resposta HTTP contém JSON.

## Achados confirmados

| Prioridade | Arquivo e localização | Descrição e risco | Correção recomendada | Teste necessário |
|---|---|---|---|---|
| Alta | `backend/src/services/authService.ts` | Credenciais administrativas previsíveis são usadas como fallback quando as variáveis de ambiente faltam. Um login remoto pode obter acesso administrativo. | Exigir configuração explícita e falhar de forma segura sem credenciais. | Inicialização sem credenciais deve falhar; credenciais inválidas devem ser rejeitadas. |
| Alta | `backend/src/routes/adminRoutes.ts`; `src/App.tsx` | Sessões administrativas em memória são representadas por bearer tokens guardados em `localStorage`; o controle de rota frontend apenas verifica a presença do token. Isso expõe tokens a XSS e não sobrevive a reinicializações. | Migrar para sessão de servidor em cookie HttpOnly, SameSite e Secure em produção, com expiração/revogação e proteção CSRF adequada. | Acesso sem sessão, expiração, logout, CSRF e operações autenticadas. |
| Alta | `backend/src/routes/publicRoutes.ts` | Escritas sociais confiam no cabeçalho `x-user-id`, controlado pelo cliente, como identidade autenticada. | Derivar identidade de autenticação validada no servidor; enquanto indisponível, rejeitar escritas sociais. | Requisições anônimas ou com identidade forjada devem ser rejeitadas. |
| Média | `backend/src/services/newsService.ts`; `backend/src/routes/publicRoutes.ts` | Busca pública por slug pode retornar artigos não publicados. | Limitar todas as consultas públicas a artigos publicados. | Artigos publicados acessíveis; rascunhos/pendentes/arquivados retornam 404. |
| Média | `src/App.tsx` | O arquivo concentra páginas, rotas, serviços, modelos e componentes em mais de 1.600 linhas. | Separar páginas/componentes e centralizar chamadas HTTP incrementalmente. | Build, testes de navegação e revisão de regressão após extrações. |
| Média | `src/App.tsx` | O menu e o rodapé usam links `href="#"`; categorias não têm páginas próprias e a busca filtra apenas a lista local carregada. | Implementar rotas reais, páginas reutilizáveis de categoria e busca no backend. | Navegação direta, histórico, filtros, paginação e URLs internas. |
| Média | `src/App.tsx`; `backend/src/data/news.ts`; `backend/src/types.ts`; `backend/src/routes/adminRoutes.ts` | Categorias são declaradas separadamente no frontend e backend, com arrays/enums que divergem. | Adotar uma fonte central de categorias, incluindo Games. | Categoria Games nos dados, filtros, formulário e endpoints. |
| Baixa | `backend/src/data/news.ts`; `src/App.tsx` | Dados demonstrativos usam algumas fontes/URLs ilustrativas. | Identificar claramente demonstrações e não apresentá-las como informação verificada. | Revisão visual e conteúdo das notícias seed. |
| Média | `src/App.tsx` | A página de login tenta interpretar respostas não JSON como JSON, mascarando indisponibilidade da API com uma mensagem técnica. | Tratar conteúdo/estado HTTP explicitamente e oferecer nova tentativa ou instrução para iniciar o backend. | Login com API parada, credenciais inválidas e credenciais válidas configuradas. |

## Segredos e ambiente

- `.env.example` contém nomes de variáveis e valores-modelo; não foi encontrado arquivo `.env` rastreado na árvore atual.
- Os valores de configuração privada não devem ser incluídos em documentação ou mensagens.
- A leitura pontual do histórico não substitui uma varredura dedicada de segredos no histórico completo; nenhum histórico será reescrito sem autorização.

## Estado após correções

- **Corrigidos:** fallback de credenciais administrativas, tokens em `localStorage`, confiança em `x-user-id`, acesso público a notícias não publicadas e erro de parsing no login quando o gateway retorna corpo vazio.
- **Implementados:** cookie administrativo HttpOnly com expiração, validação de origem nas escritas administrativas, limite de tentativas, configuração Zod com carregamento de `backend/.env`, páginas de categoria/busca, Games e página 404.
- **Parcial:** a extração de componentes/páginas começou, mas `src/App.tsx` ainda contém o dashboard e o detalhe da notícia; as categorias públicas e o formulário administrativo agora consultam o registro do backend.
- **Pendente:** autenticação de leitores antes de reativar reações/comentários de escrita; OAuth Google e conectores externos; persistência fora da memória; publicação/CI.
- **Validação atual:** 7 testes backend aprovados em execução anterior; 8 testes frontend aprovados antes dos dois novos casos de regressão. A última execução do Vitest não iniciou workers e precisa ser repetida. Build frontend aprovado e build TypeScript do backend executado diretamente com sucesso. O lint passa com avisos de hooks existentes.

## Limitações iniciais

- O frontend depende do backend Express local e os dados sociais/notícias permanecem em memória.
- Não há configuração de implantação Pages/backend neste escopo.
- As integrações Google continuam desativadas e não foram autorizadas.
