# Arquitetura do Portal de Notícias

## Visão geral

O projeto foi estruturado em duas camadas principais:

- Frontend: aplicação React + Vite responsável pela experiência pública do portal.
- Backend: API Express + TypeScript responsável por expor endpoints públicos e administrativos.

## Estrutura proposta

```text
portal-noticias/
├─ frontend/ (mantida em raiz para preservar a aplicação Vite)
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ data/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ types.ts
│  │  ├─ app.ts
│  │  └─ server.ts
│  ├─ tests/
│  ├─ package.json
│  └─ tsconfig.json
├─ docs/
├─ .env.example
├─ README.md
├─ vite.config.ts
└─ package.json
```

## Decisões técnicas

- O frontend usa fetch para consumir a API do backend em ambiente local via proxy do Vite.
- A API funciona em memória para permitir validação de fluxo e testes locais, sem dados externos.
- As integrações com Google Cloud permanecem bloqueadas até autorização explícita do usuário.
- O backend expõe endpoints públicos e administrativos com status claro para recursos ainda pendentes de configuração.

## Fluxo público

1. Frontend consulta `/api/news`.
2. Backend retorna notícias publicadas.
3. Filtros e busca são aplicados em memória no backend.
4. O cliente renderiza destaque e cards para o portal público.

## Próximos passos

- Implementar autenticação administrativa segura.
- Adicionar repositório de Google Sheets.
- Integrar Google Drive e Google Fotos somente após aprovação.
- Expandir a API com CRUD e importação RSS.
