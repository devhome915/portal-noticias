# Portal de Notícias

Portal editorial responsivo construído com React + TypeScript + Vite e uma API Express + TypeScript para servir a camada pública e administrativa do sistema.

## Visão geral

O projeto já está em uma fase funcional de desenvolvimento local, com:

- frontend público responsivo e editorial
- busca e filtros por categoria
- destaque de notícias em primeira página
- API REST local com endpoints públicos e administrativos
- documentação inicial da arquitetura e contratos da API
- testes automatizados para os principais fluxos do backend

## Stack

Frontend:
- React 19
- TypeScript
- Vite
- CSS responsivo

Backend:
- Node.js
- Express
- TypeScript
- Zod
- Vitest
- Supertest

## Estrutura atual

```text
portal-noticias/
├─ src/
│  ├─ App.tsx
│  ├─ App.css
│  ├─ index.css
├─ backend/
│  ├─ src/
│  ├─ tests/
│  ├─ package.json
│  └─ tsconfig.json
├─ docs/
│  ├─ PROGRESSO.md
│  ├─ ARQUITETURA.md
│  └─ API.md
├─ .env.example
├─ README.md
├─ package.json
├─ vite.config.ts
└─ .gitignore
```

## Como executar

1. Instale as dependências do frontend e backend:

```bash
npm install
npm --prefix backend install
```

2. Inicie o ambiente de desenvolvimento completo:

```bash
npm run dev
```

3. Acesse o frontend em:

```text
http://localhost:5173
```

4. A API estará disponível em:

```text
http://localhost:3001/api
```

5. Gere o build de produção do frontend:

```bash
npm run build
```

6. Execute os testes do backend:

```bash
npm --prefix backend test
```

## Roadmap

- [x] Auditoria inicial do repositório
- [x] Base visual do portal público
- [x] Backend Express + API REST inicial
- [x] Autenticação administrativa
- [x] Interações sociais compactas e navegação por detalhe da notícia
- [ ] Google Sheets e repositório de notícias
- [ ] Google Drive e gestão de imagens
- [ ] Google Fotos e importação de fotos
- [ ] RSS / coleta automática
- [ ] Painel administrativo
- [ ] Testes e CI completos

## Observações

- Integrações externas com Google continuam bloqueadas até autorização explícita.
- O backend local funciona em memória e serve como base para evolução controlada.
- A implementação segue a política de desenvolvimento incremental e segura do projeto.
