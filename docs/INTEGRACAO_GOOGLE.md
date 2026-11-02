# Configuração Google para integrações

## Credenciais locais

O cliente OAuth do tipo Web foi configurado para desenvolvimento local. As credenciais ficam apenas em `backend/.env`, que é ignorado pelo Git; não copie o `client_secret` para o frontend, documentação, issues ou repositório.

Valores locais esperados:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3001/api/admin/google/auth/callback
ADMIN_GOOGLE_EMAIL=admin@exemplo.com
GOOGLE_SHEETS_ID=
GOOGLE_DRIVE_FOLDER_ID=
```

O arquivo recebido já registra a origem `http://localhost:5173` e o callback acima. Mantenha os IDs de planilha/pasta vazios até escolher e compartilhar os recursos que serão usados.

## Autorizar a conta no portal

1. Defina `ADMIN_GOOGLE_EMAIL` em `backend/.env` para o e-mail Google autorizado a administrar o portal. Contas Google verificadas podem entrar como leitores; esse endereço recebe também o papel de administrador.
2. Se também quiser acesso por senha, configure usuário e hash conforme `README.md`; mantenha a senha fora do Git.
3. Inicie o portal e a API com `npm run dev`.
4. Em `/admin/login`, clique **Continuar com Google**. O consentimento de login usa apenas identidade básica; o endereço autorizado é comparado no backend.
5. Depois de entrar, em **Integrações Google**, clique **Conectar com Google** separadamente para autorizar Sheets e Drive.

O OAuth solicita somente:

- `spreadsheets`: leitura e gravação em planilhas Google;
- `drive.file`: acesso limitado a arquivos que o app criar ou que forem explicitamente selecionados/abertos pelo app.

`drive.file` não concede acesso genérico a uma pasta existente apenas porque seu ID foi configurado. Para usar uma pasta preexistente, ela precisa ser explicitamente selecionada pelo app, ou o fluxo de seleção/compartilhamento deve ser implementado. Não amplie para acesso completo ao Drive sem uma necessidade definida e revisão das exigências de verificação Google.

## Implementação e limitações

- Rotas administrativas: `GET /api/admin/google/status`, `GET /api/admin/google/auth`, callback OAuth e `POST /api/admin/google/disconnect`.
- O login Google reutiliza o callback local e não concede acesso administrativo a contas fora de `ADMIN_GOOGLE_EMAIL`.
- O parâmetro `state` é aleatório, expira em 10 minutos e é vinculado à sessão administrativa; códigos OAuth do callback não são gravados nos logs HTTP.
- Tokens ficam somente na memória do processo: reiniciar o backend exige conectar de novo. Não use esta persistência em produção.
- O fluxo autoriza Google Sheets/Drive, mas **os conectores que leem/gravam notícias, arquivos e imagens ainda precisam ser implementados**. Configurar IDs não inicia sincronização.
- Google Fotos não está habilitado; requer análise separada de API e permissões.
- Para produção, configure callback HTTPS no Console, use armazenamento criptografado de tokens, segredos em um gestor de secrets e conclua as verificações OAuth necessárias para os escopos escolhidos.
