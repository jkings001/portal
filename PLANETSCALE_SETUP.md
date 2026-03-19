# Guia de Configuração PlanetScale para Portal de Atendimento

## 📋 Passo 1: Criar Conta no PlanetScale

1. Acesse [https://planetscale.com](https://planetscale.com)
2. Clique em **"Sign Up"** (canto superior direito)
3. Escolha uma das opções:
   - GitHub (recomendado - mais rápido)
   - Google
   - Email
4. Complete o registro

## 🗄️ Passo 2: Criar Banco de Dados

1. No dashboard do PlanetScale, clique em **"Create a database"**
2. Preencha os dados:
   - **Database name**: `portal-atendimento` (ou outro nome que preferir)
   - **Region**: Escolha a região mais próxima (ex: São Paulo - `sa-east-1`)
   - **Plan**: Deixe em **"Free"** (gratuito)
3. Clique em **"Create database"**
4. Aguarde 2-3 minutos para o banco ser criado

## 🔑 Passo 3: Obter Credenciais de Conexão

1. Após criar o banco, clique no nome do banco
2. Na aba **"Overview"**, clique em **"Connect"** (botão azul)
3. Selecione **"Node.js"** como linguagem
4. Você verá uma string de conexão similar a:
   ```
   mysql://[username]:[password]@[host]/[database]?sslaccept=strict
   ```
5. **Copie essa string completa** - você precisará dela

## 🔗 Passo 4: Configurar Variáveis de Ambiente

1. Abra o arquivo `.env` do projeto (ou crie um se não existir)
2. Procure pela linha `DATABASE_URL`
3. Substitua o valor pela string do PlanetScale:
   ```
   DATABASE_URL=mysql://[username]:[password]@[host]/[database]?sslaccept=strict
   ```

**Exemplo real:**
```
DATABASE_URL=mysql://user123:pass456@aws.connect.psdb.cloud/portal-atendimento?sslaccept=strict
```

## 🚀 Passo 5: Executar Migração do Schema

No terminal do projeto, execute:

```bash
cd /home/ubuntu/portal-atendimento
pnpm db:push
```

Este comando:
- Gera as migrações baseado no schema Drizzle
- Cria todas as tabelas no PlanetScale
- Sincroniza o banco com seu código

## ✅ Passo 6: Verificar Conexão

1. Acesse o dashboard do PlanetScale
2. Clique em **"Branches"** → **"main"**
3. Clique em **"Console"** (terminal SQL)
4. Execute uma query de teste:
   ```sql
   SHOW TABLES;
   ```
5. Você deve ver as tabelas: `users`, `companies`, `departments`, etc.

## 📊 Tabelas Criadas Automaticamente

O schema do projeto criará automaticamente:

- **users**: Usuários do sistema
- **companies**: Empresas cadastradas
- **departments**: Departamentos
- **tickets**: Chamados de suporte
- **ticket_comments**: Comentários em tickets
- **ticket_attachments**: Anexos de tickets
- **categories**: Categorias de tickets
- **priorities**: Prioridades de tickets
- **sla_rules**: Regras de SLA

## 🔍 Monitoramento e Limites

**Plano Gratuito PlanetScale:**
- ✅ 5 GB de armazenamento
- ✅ Conexões ilimitadas
- ✅ Queries ilimitadas
- ✅ 1 branch (main)
- ✅ Suporte comunitário

**Quando você atingir os limites:**
- Upgrade para plano pago ($29/mês)
- Ou limpar dados de teste

## 🆘 Troubleshooting

### Erro: "Access denied for user"
- Verifique se a string DATABASE_URL está correta
- Copie novamente do PlanetScale
- Reinicie o servidor: `pnpm dev`

### Erro: "Connection timeout"
- Verifique sua conexão de internet
- Tente acessar o console do PlanetScale diretamente
- Verifique se a região está correta

### Erro: "SSL certificate problem"
- Adicione `?sslaccept=strict` ao final da URL (já incluído por padrão)

## 📝 Próximos Passos

1. **Testar CRUD**: Crie/edite/delete usuários e empresas
2. **Validar dados**: Verifique se os dados estão sendo salvos no PlanetScale
3. **Fazer backup**: Configure backups automáticos (opcional no plano pago)

## 🎯 Resumo Rápido

| Etapa | Ação |
|-------|------|
| 1 | Criar conta em planetscale.com |
| 2 | Criar banco de dados "portal-atendimento" |
| 3 | Copiar string de conexão |
| 4 | Colar em `.env` como `DATABASE_URL` |
| 5 | Executar `pnpm db:push` |
| 6 | Verificar no console do PlanetScale |

---

**Dúvidas?** Consulte a documentação oficial: https://planetscale.com/docs
