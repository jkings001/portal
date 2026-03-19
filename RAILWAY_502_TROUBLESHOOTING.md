# Troubleshooting: Erro 502 Bad Gateway no Railway

## Problema
O domínio jkings.solutions está retornando erro **502 Bad Gateway** quando acessado. A mensagem "Application failed to respond" indica que a aplicação no Railway não está respondendo às requisições.

## Diagnóstico

### 1. Verificar Status da Aplicação no Railway
1. Acesse o painel do Railway: https://railway.app
2. Selecione o projeto "portal-atendimento"
3. Verifique o status do serviço Node.js
4. Clique em "Logs" para ver os logs de erro

### 2. Causas Comuns do Erro 502

#### A. Banco de Dados Não Conectando
**Sintoma:** Erro "Access denied" nos logs
**Solução:**
- Verificar DATABASE_URL com credenciais corretas do Railway
- Credenciais do Railway: `root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA`
- URL correta (Produção): `mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway`
- URL correta (Desenvolvimento): `mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway`

#### B. Variáveis de Ambiente Faltando
**Sintoma:** Erro de "undefined" ou "Cannot read property"
**Solução:**
- Verificar se todas as variáveis estão configuradas no Railway:
  - DATABASE_URL
  - MYSQL_URL
  - MYSQL_PUBLIC_URL
  - MYSQL_DATABASE
  - MYSQL_ROOT_PASSWORD
  - JWT_SECRET
  - NODE_ENV
  - PORT

#### C. Porta Não Configurada
**Sintoma:** "EADDRINUSE" ou "Port already in use"
**Solução:**
- Verificar se PORT está configurado como 3000
- Ou deixar o código usar `process.env.PORT` dinamicamente

#### D. Erro de Inicialização
**Sintoma:** Erro durante `npm start` ou `pnpm start`
**Solução:**
- Verificar se o build foi bem-sucedido
- Verificar se há erros de TypeScript
- Verificar se todas as dependências foram instaladas

## Passos para Resolver

### Passo 1: Atualizar Variáveis de Ambiente do Railway

1. No painel Railway, vá para "Variables"
2. Atualize ou crie as seguintes variáveis:

| Variável | Valor |
|----------|-------|
| DATABASE_URL | mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway |
| MYSQL_URL | mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway |
| MYSQL_PUBLIC_URL | mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway |
| MYSQL_DATABASE | railway |
| MYSQL_ROOT_PASSWORD | eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA |
| JWT_SECRET | Jk@Portal2025#SecretKey!XyZ789 |
| NODE_ENV | production |
| PORT | 3000 |

3. Clique em "Save" ou "Deploy"

### Passo 2: Reiniciar a Aplicação
1. No painel Railway, clique no botão "Redeploy"
2. Aguarde 30-60 segundos
3. Verifique os logs para erros

### Passo 3: Testar Acesso
1. Acesse https://jkings.solutions/
2. Se ainda houver erro 502, verifique os logs novamente
3. Procure por mensagens de erro específicas

## Logs Importantes

### Sucesso
```
[Database] Parsed connection config from URL: mysql-viby.railway.internal:3306/railway
[Database] Connecting to mysql-viby.railway.internal:3306/railway
[Database] Connected successfully after 1 attempt(s)
Server running on port 3000
```

### Erro de Banco de Dados
```
Error: Access denied for user 'root'@'...' (using password: YES)
```
**Solução:** Atualizar DATABASE_URL com credenciais corretas do Railway

### Erro de Porta
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solução:** Mudar PORT ou liberar a porta

### Erro de Variável
```
Error: Cannot read property 'cookieSecret' of undefined
```
**Solução:** Verificar se JWT_SECRET está configurado

## Verificação Rápida

Para testar localmente se a aplicação inicia com as credenciais corretas:

```bash
cd /home/ubuntu/portal-atendimento
export DATABASE_URL="mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway"
export JWT_SECRET="Jk@Portal2025#SecretKey!XyZ789"
export NODE_ENV="production"
pnpm build
node dist/index.js
```

Se funcionar localmente, o problema está na configuração do Railway.

## Próximos Passos

1. **Atualizar variáveis de ambiente** no Railway com as credenciais corretas
2. **Reiniciar aplicação** no Railway (Redeploy)
3. **Testar acesso** a https://jkings.solutions/
4. **Monitorar logs** para novos erros

## Referências

- Documentação Railway: https://docs.railway.app/
- Guia de Deploy: DEPLOY_RAILWAY.md
- Configuração de Banco de Dados: DATABASE_CONFIG.md
