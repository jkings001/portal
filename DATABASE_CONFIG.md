# Configuração do Banco de Dados

## Credenciais Corretas do Railway

O projeto está configurado para usar o **Railway MySQL**, não o Hostinger. As credenciais corretas são:

| Campo | Valor |
|-------|-------|
| **Host (Interno)** | mysql-viby.railway.internal |
| **Host (Público)** | turntable.proxy.rlwy.net |
| **Port** | 3306 (interno) / 48844 (público) |
| **Database** | railway |
| **User** | root |
| **Password** | eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA |

## URLs de Conexão (DATABASE_URL)

### Produção (Recomendado - URL Interna)
```
mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
```

### Desenvolvimento com Túnel (URL Pública)
```
mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway
```

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no Railway:

```bash
# Banco de Dados
DATABASE_URL=mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
MYSQL_URL=mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
MYSQL_PUBLIC_URL=mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway
MYSQL_DATABASE=railway
MYSQL_ROOT_PASSWORD=eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA

# Autenticação
JWT_SECRET=Jk@Portal2025#SecretKey!XyZ789

# Ambiente
NODE_ENV=production
PORT=3000
```

## Como Atualizar as Variáveis no Railway

### Passo 1: Acessar o Painel Railway
1. Acesse https://railway.app
2. Faça login com suas credenciais
3. Selecione o projeto "portal-atendimento"

### Passo 2: Configurar Variáveis de Ambiente
1. Clique em "Variables" (ou "Settings" → "Variables")
2. Procure por `DATABASE_URL`
3. Atualize o valor com a URL correta:
   ```
   mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
   ```
4. Adicione ou atualize as outras variáveis conforme necessário
5. Clique em "Save" ou "Deploy"

### Passo 3: Redeploy da Aplicação
1. Clique em "Redeploy" ou aguarde o deploy automático
2. Verifique o status do deploy nos logs
3. Aguarde 30-60 segundos para a aplicação iniciar

### Passo 4: Testar Acesso
1. Acesse https://jkings.solutions/
2. Verifique se a aplicação está respondendo
3. Se houver erro 502, verifique os logs

## Prioridade de Configuração

O código `server/db.ts` tenta conectar ao banco de dados nesta ordem:

1. **DATABASE_URL** (URL única - Preferida para produção)
2. **MYSQL_URL** (fallback)
3. **MYSQL_PUBLIC_URL** (fallback)
4. **Variáveis individuais** (MYSQLHOST, MYSQLPORT, etc.)
5. **Fallback local** (localhost:3306)

## Verificação de Conexão

Para verificar se a conexão está funcionando:

1. Acesse a aplicação em https://jkings.solutions/
2. Verifique os logs do Railway em "Logs"
3. Procure por mensagens como:
   - `[Database] Parsed connection config from URL: mysql-viby.railway.internal:3306/railway`
   - `[Database] Connected successfully`

## Troubleshooting

### Erro: "Access denied for user 'root'"

Este erro indica que a senha está incorreta. Verifique:

1. A senha é `eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA` (exatamente como está)
2. A URL está corretamente formatada
3. Não há espaços extras antes ou depois da senha

### Erro: "Connection timeout"

Este erro indica que o host não está acessível. Verifique:

1. Para produção, use `mysql-viby.railway.internal` (URL interna)
2. Para desenvolvimento, use `turntable.proxy.rlwy.net:48844` (URL pública)
3. Verifique se o serviço MySQL está rodando no Railway

### Erro: "Unknown database 'railway'"

Este erro indica que o banco de dados não existe. Verifique:

1. O nome do banco de dados é `railway`
2. O banco foi criado no Railway
3. O usuário `root` tem permissão para acessar este banco

## Arquivos Relacionados

- `server/db.ts` - Configuração de conexão com Drizzle ORM
- `server/mysql-pool.ts` - Pool de conexões MySQL
- `server/_core/env.ts` - Variáveis de ambiente
- `drizzle/schema.ts` - Schema do banco de dados
- `DEPLOY_RAILWAY.md` - Guia completo de deploy no Railway
