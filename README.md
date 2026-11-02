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

2. Crie o arquivo local de configuração do backend:

```powershell
Copy-Item .env.example backend\.env
```

Configure `ADMIN_USERNAME` em `backend\.env`. Gere o hash da senha administrativa sem exibir a senha no terminal:

```powershell
npm --prefix backend run hash-admin-password
```

Copie o valor `ADMIN_PASSWORD_HASH` impresso para `backend\.env`. O arquivo é ignorado pelo Git.

Para entrar com Google, configure `ADMIN_GOOGLE_EMAIL` com o endereço exato autorizado para o painel. A conta precisa ser verificada pelo Google. Esse login não ativa automaticamente Sheets ou Drive; essas integrações são autorizadas separadamente no Dashboard.

3. Inicie o ambiente de desenvolvimento completo:

```bash
npm run dev
```

4. Acesse o frontend em:

```text
http://localhost:5173
```

5. A API estará disponível em:

```text
http://localhost:3001/api
```

O portal precisa dos dois serviços em execução. Use `npm run dev` para iniciar o frontend e o backend juntos; iniciar somente o Vite deixa a API indisponível.

6. Gere o build de produção do frontend:

```bash
npm run build
```

7. Execute os testes:

```bash
npm --prefix backend test
npx vitest run
```

## Roadmap

- [x] Auditoria inicial do repositório
- [x] Base visual do portal público
- [x] Backend Express + API REST inicial
- [x] Autenticação administrativa
- [x] Interações sociais compactas e navegação por detalhe da notícia
- [x] Rotas de categoria, busca paginada e categoria Games
- [x] Página 404 e navegação sem links fictícios
- [x] Configuração OAuth Google local (Sheets e Drive `drive.file`)
- [x] Login administrativo Google limitado ao e-mail verificado autorizado
- [x] Persistência local das notícias editadas no painel
- [ ] Google Sheets e repositório de notícias
- [ ] Google Drive e gestão de imagens
- [ ] Google Fotos e importação de fotos
- [ ] RSS / coleta automática
- [x] Painel administrativo
- [ ] Testes e CI completos

## Observações

- Login administrativo Google usa o e-mail definido em `ADMIN_GOOGLE_EMAIL`; Sheets e Drive ainda precisam de conectores e recursos configurados.
- Notícias criadas pelo painel são persistidas localmente em `backend/data/news-store.json` (arquivo ignorado pelo Git); outros dados sociais e sessões continuam em memória.
- A implementação segue a política de desenvolvimento incremental e segura do projeto.
- O passo a passo de configuração das credenciais Google está em [docs/INTEGRACAO_GOOGLE.md](./docs/INTEGRACAO_GOOGLE.md); as rotas OAuth ainda precisam ser implementadas antes de usar essas credenciais.
