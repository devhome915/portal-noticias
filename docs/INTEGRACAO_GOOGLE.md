# Configuração Google para integrações

As integrações Google ainda não estão ativas no portal. Configure credenciais apenas no Google Cloud Console e no arquivo local `backend/.env`; não envie segredos pelo chat nem os versione no Git.

## Preparar um projeto OAuth

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e selecione ou crie um projeto.
2. Em **APIs e serviços**, habilite somente as APIs necessárias:
   - Google Sheets API para planilhas;
   - Google Drive API para arquivos e pastas.
3. Configure a tela de consentimento OAuth e cadastre usuários de teste enquanto o app estiver em modo de teste.
4. Em **Credenciais**, crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**.
5. Para desenvolvimento local, configure:
   - Origem JavaScript autorizada: `http://localhost:5173`
   - URI de redirecionamento: `http://localhost:3001/api/admin/google/auth/callback`
6. Copie os valores para `backend/.env`, sem substituir os demais campos:

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/admin/google/auth/callback
GOOGLE_SHEETS_ID=id-da-planilha
GOOGLE_DRIVE_FOLDER_ID=id-da-pasta
```

O callback acima é o endereço reservado no exemplo de ambiente. **A rota OAuth ainda não foi implementada**, então criar credenciais no Console não ativa a integração. O projeto também não deve receber ou armazenar o `client_secret` até que o fluxo de autorização seja implementado e validado.

## Escopos e segurança

- Solicite apenas os escopos indispensáveis para cada integração. Evite permissões amplas de Drive quando `drive.file` ou acesso a arquivos compartilhados com a conta de serviço forem suficientes.
- Para planilhas e pastas gerenciadas exclusivamente pelo backend, avalie uma **conta de serviço** e compartilhe apenas os recursos necessários com o e-mail dessa conta. Não use OAuth de usuário por conveniência se a aplicação não precisa agir em nome desse usuário.
- Para Google Fotos, confirme primeiro a API e o caso de uso permitidos atualmente pelo Google; acesso ao Google Photos não deve ser presumido como equivalente ao Drive.
- Nunca publique arquivos JSON de contas de serviço, refresh tokens, client secrets ou chaves privadas. Mantenha-os fora do repositório e limite o acesso no ambiente de execução.
- Antes da produção, configure domínio e callback HTTPS, revise a tela de consentimento, valide as permissões e conclua a verificação Google exigida para os escopos usados.

## Estado atual

`GET /api/admin/google/status` informa que a integração está pendente. Nenhuma chamada Google é feita pelo portal. A implementação do fluxo OAuth, armazenamento seguro dos tokens e conectores Sheets/Drive deve ocorrer em etapas separadas depois da escolha do modelo de acesso e da configuração no Console.
