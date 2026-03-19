# Melhorias na Configuração de Conexão com Banco de Dados

## Resumo das Alterações

Este documento descreve as melhorias implementadas para tornar a configuração de banco de dados mais robusta e flexível, suportando os ambientes Railway (produção) e desenvolvimento local.

## Arquivos Modificados

### 1. `server/_core/env.ts`
**Objetivo:** Centralizar variáveis de ambiente

**Alterações:**
- Adicionadas variáveis para Railway: `mysqlUrl`, `mysqlPublicUrl`, `mysqlHost`, `mysqlPort`, `mysqlUser`, `mysqlPassword`, `mysqlDatabase`
- Mantidas variáveis existentes para compatibilidade
- Todas as variáveis têm valores padrão sensatos

**Benefícios:**
- Fácil acesso a todas as variáveis de ambiente em um único lugar
- Suporte para múltiplos provedores (Hostinger, Railway, local)

### 2. `server/db.ts`
**Objetivo:** Melhorar a lógica de conexão com banco de dados

**Alterações Principais:**

#### Função `getMysqlConnectionConfig()`
- Implementada prioridade de URLs:
  1. `DATABASE_URL` (URL única - preferida)
  2. `MYSQL_URL` (fallback)
  3. `MYSQL_PUBLIC_URL` (fallback)
  4. Variáveis individuais (`MYSQLHOST`, `MYSQLPORT`, etc.)
  5. Fallback local para desenvolvimento

- Parser de URL robusto com tratamento de erros
- Suporte para caracteres especiais em senhas (decodificação URL)
- Logs detalhados para debug

#### Função `getDb()`
- Implementado retry automático com backoff exponencial
- Máximo de 5 tentativas com delays progressivos
- Logs de sucesso/falha para monitoramento
- Tratamento seguro de erros

#### Funções de Password Reset
- Adicionadas funções para gerenciar tokens de reset de senha:
  - `createPasswordResetToken()` - Criar novo token
  - `getPasswordResetToken()` - Recuperar token por valor
  - `markPasswordResetTokenAsUsed()` - Marcar token como utilizado

**Benefícios:**
- Suporte automático para múltiplos ambientes
- Melhor tratamento de erros e retries
- Logs detalhados para troubleshooting
- Segurança aprimorada para reset de senha

### 3. `server/mysql-pool.ts`
**Objetivo:** Gerenciar pool de conexões MySQL

**Alterações:**
- Adicionado suporte para `enableKeepAlive` e `keepAliveInitialDelayMs`
- Aumentado timeout de conexão para 15 segundos (Railway)
- Adicionados listeners para eventos do pool:
  - `connection` - Nova conexão criada
  - `error` - Erro no pool
  - `enqueue` - Fila cheia
- Adicionada função `closePool()` para shutdown gracioso
- Logs melhorados para monitoramento

**Benefícios:**
- Melhor estabilidade em conexões de longa duração
- Detecção de problemas de pool via logs
- Suporte para shutdown gracioso

## Fluxo de Configuração

```
┌─────────────────────────────────────┐
│   Variáveis de Ambiente             │
│  (DATABASE_URL, MYSQLHOST, etc.)    │
└────────────────┬────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ getMysqlConnectionConfig()
        │ (Prioridade de URLs)
        └────────────┬───────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Configuração MySQL Validada│
        │ (host, port, user, pass)   │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ getDb() com Retry           │
        │ (Até 5 tentativas)          │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Drizzle ORM Instance        │
        │ (Pronto para queries)       │
        └────────────────────────────┘
```

## Ambientes Suportados

### Railway (Produção — URL Interna)
```
DATABASE_URL=mysql://root:<SENHA>@mysql-viby.railway.internal:3306/railway
```

### Railway (Desenvolvimento — URL Pública)
```
MYSQL_PUBLIC_URL=mysql://root:<SENHA>@turntable.proxy.rlwy.net:48844/railway
```

### Desenvolvimento Local
```
MYSQLHOST=127.0.0.1
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=<SENHA>
MYSQL_DATABASE=railway
```

## Tratamento de Erros

### Retry Automático
- Implementado em `getDb()` com backoff exponencial
- Máximo de 5 tentativas
- Delays: 1s, 2s, 4s, 8s, 16s

### Logs Detalhados
Todos os eventos importantes são registrados:
- Configuração de conexão detectada
- Tentativas de conexão
- Sucesso/falha de conexão
- Erros de query

### Fallback em Cascata
Se uma configuração falhar, tenta a próxima:
1. DATABASE_URL (URL única)
2. MYSQL_URL
3. MYSQL_PUBLIC_URL
4. Variáveis individuais
5. Fallback local

## Segurança

### Proteção de Senhas
- Senhas codificadas em URLs (% encoding)
- Senhas não aparecem em logs (apenas host/port/database)
- Suporte para caracteres especiais

### Queries Parametrizadas
- Todas as queries usam Drizzle ORM
- Proteção automática contra SQL injection
- Tipos TypeScript para segurança em tempo de compilação

### Pool de Conexões
- Limite de 5 conexões simultâneas (conservador)
- Fila de até 50 requisições
- Timeout de 15 segundos

## Monitoramento

### Logs Importantes
```
[Database] Parsed connection config from URL: host:port/database
[Database] Connecting to host:port/database
[Database] Connected successfully after N attempt(s)
[Database] Error: mensagem de erro
[mysql-pool] Nova conexão criada
[mysql-pool] Erro no pool: mensagem
```

### Verificação de Saúde
1. Verifique logs em `.manus-logs/devserver.log`
2. Procure por "Connected successfully"
3. Verifique se não há "Access denied" ou "Connection timeout"

## Próximos Passos

1. **Configurar DATABASE_URL** no painel Railway com a URL interna:
   ```
   mysql://root:<SENHA>@mysql-viby.railway.internal:3306/railway
   ```

2. **Testar a conexão** reiniciando o servidor

3. **Monitorar logs** para garantir que a conexão está estável

4. **Para desenvolvimento local**, usar a URL pública (proxy):
   ```
   MYSQL_PUBLIC_URL=mysql://root:<SENHA>@turntable.proxy.rlwy.net:48844/railway
   ```

## Referências

- Documentação: `DATABASE_CONFIG.md`
- Arquivo de configuração: `server/db.ts`
- Pool de conexões: `server/mysql-pool.ts`
- Variáveis de ambiente: `server/_core/env.ts`
