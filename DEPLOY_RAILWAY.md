# Guia de Deploy — Portal de Atendimento JKINGS no Railway

**Última atualização:** Março 2026  
**Project ID Railway:** `b6438759-4795-4d70-acd5-468d3e37e802`  
**Stack:** Node.js 22.x + Express + React/Vite + MySQL (Railway)

---

## Visão Geral

O portal é uma aplicação full-stack Node.js. O comando `pnpm run build` executa dois passos:

1. **Vite** compila o frontend React → `dist/public/`
2. **esbuild** transpila o servidor Express → `dist/index.js`

Em produção, o Express serve os arquivos estáticos do frontend (`dist/public/`) e expõe a API REST em `/api/*`. O Railway detecta automaticamente o `railway.json` e executa o build e start configurados.

---

## 1. Configurações no Painel Railway

### 1.1 Configurações Gerais do Serviço

| Campo | Valor |
|---|---|
| **Project ID** | `b6438759-4795-4d70-acd5-468d3e37e802` |
| **Build Command** | `pnpm install && pnpm run build` |
| **Start Command** | `node dist/index.js` |
| **Node Version** | `22.x` (forçado via `.node-version` e `engines` no `package.json`) |

O arquivo `railway.json` já está configurado na raiz do projeto com essas definições.

---

### 1.2 Banco de Dados MySQL Railway

| Campo | Valor |
|---|---|
| **Database** | `railway` |
| **User** | `root` |
| **Password** | `eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA` |
| **Internal Host** | `mysql-viby.railway.internal` |
| **Internal Port** | `3306` |
| **Public Host** | `turntable.proxy.rlwy.net` |
| **Public Port** | `48844` |

**URL interna (usar em produção no Railway):**
```
mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
```

**URL pública (usar para conexões externas, ex.: DBeaver, TablePlus):**
```
mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway
```

> **Importante:** Use sempre a URL interna (`mysql-viby.railway.internal`) para a variável `DATABASE_URL` no serviço da aplicação. A URL pública é apenas para ferramentas externas de administração.

---

## 2. Variáveis de Ambiente

No painel do Railway, acesse o serviço da aplicação → **Variables** e adicione cada variável abaixo.

### 2.1 Banco de Dados (obrigatório)

| Chave | Valor |
|---|---|
| `DATABASE_URL` | `mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway` |
| `MYSQL_URL` | `mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway` |

> O Railway injeta automaticamente `MYSQL_URL` quando há um serviço MySQL no mesmo projeto. O código já suporta ambas as variáveis.

---

### 2.2 Autenticação e Segurança

| Chave | Valor |
|---|---|
| `JWT_SECRET` | `Jk@Portal2025#SecretKey!XyZ789` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |

---

### 2.3 SMTP — Envio de E-mails

| Chave | Valor |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `SMTP_USER` | `noreply@jkings.solutions` |
| `SMTP_PASSWORD` | *(senha do e-mail na Hostinger)* |
| `SMTP_FROM` | `"Portal JKINGS" <noreply@jkings.solutions>` |

---

### 2.4 Frontend (variáveis VITE_)

Estas variáveis são incorporadas estaticamente no build do frontend. Devem estar configuradas **antes** de executar o build.

| Chave | Valor |
|---|---|
| `VITE_APP_ID` | `portal-atendimento-jkings` |
| `VITE_OAUTH_PORTAL_URL` | `https://jkings.solutions` |
| `VITE_APP_TITLE` | `Portal de Atendimento JKINGS` |

---

### 2.5 Arquivo `.env` de Referência Completo

```env
# ============================================================
# BANCO DE DADOS (Railway MySQL — URL interna)
# ============================================================
DATABASE_URL=mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
MYSQL_URL=mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway

# Credenciais individuais (usadas como fallback)
MYSQL_DATABASE=railway
MYSQL_ROOT_PASSWORD=eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA
MYSQLPASSWORD=eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA
MYSQLUSER=root

# ============================================================
# AUTENTICAÇÃO
# ============================================================
JWT_SECRET=Jk@Portal2025#SecretKey!XyZ789
NODE_ENV=production
PORT=3000

# ============================================================
# SMTP — E-MAIL (Hostinger)
# ============================================================
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@jkings.solutions
SMTP_PASSWORD=SUA_SENHA_EMAIL_AQUI
SMTP_FROM="Portal JKINGS" <noreply@jkings.solutions>

# ============================================================
# FRONTEND (incorporadas no build)
# ============================================================
VITE_APP_ID=portal-atendimento-jkings
VITE_OAUTH_PORTAL_URL=https://jkings.solutions
VITE_APP_TITLE=Portal de Atendimento JKINGS
```

---

## 3. Correção do Erro ERR_INVALID_ARG_TYPE

O erro `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined` ocorria porque:

1. O Railway estava usando **Node.js 18** (que não suporta `import.meta.dirname`)
2. O `server/_core/vite.ts` usava `import.meta.dirname` que só existe no Node.js 21+

**Correções aplicadas:**
- `server/_core/vite.ts` agora usa `fileURLToPath(import.meta.url)` como fallback compatível com Node 18/20/22
- Arquivo `.node-version` criado com valor `22` para forçar Node 22 no Railway
- Arquivo `.nvmrc` criado com valor `22` como alternativa
- Campo `engines: { "node": ">=22.0.0" }` adicionado ao `package.json`

---

## 4. Passo a Passo de Deploy

### Passo 1 — Exportar o código para o GitHub

No painel do Manus, acesse **Settings → GitHub** e exporte o projeto para um repositório GitHub.

---

### Passo 2 — Conectar o repositório ao Railway

1. Acesse [railway.app](https://railway.app) e abra o projeto `b6438759-4795-4d70-acd5-468d3e37e802`
2. Clique em **"New Service"** → **"GitHub Repo"**
3. Selecione o repositório `portal-atendimento`
4. O Railway detectará automaticamente o `railway.json` na raiz

---

### Passo 3 — Configurar as variáveis de ambiente

No serviço da aplicação, acesse **Variables** e adicione todas as variáveis da seção 2.

**Variável mais importante:**
```
DATABASE_URL = mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@mysql-viby.railway.internal:3306/railway
```

---

### Passo 4 — Verificar a versão do Node no Railway

No painel do serviço, acesse **Settings → Build** e confirme que a versão do Node é **22.x**. Se não for, adicione a variável de ambiente:

```
NIXPACKS_NODE_VERSION = 22
```

---

### Passo 5 — Executar as migrations do banco

Após o primeiro deploy, execute as migrations para criar as tabelas:

```bash
# Via Railway CLI
npm install -g @railway/cli
railway login
railway link b6438759-4795-4d70-acd5-468d3e37e802
railway run pnpm run db:push
```

Ou via painel Railway → **Shell** do serviço:
```bash
pnpm run db:push
```

---

### Passo 6 — Verificar o deploy

Após o build e start, acesse a URL do serviço. O servidor responde em `/api/health`.

---

## 5. Resumo Visual das Configurações

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  RAILWAY — CONFIGURAÇÕES DO SERVIÇO                     │
├─────────────────────────┬───────────────────────────────────────────────┤
│ Project ID              │ b6438759-4795-4d70-acd5-468d3e37e802          │
│ Build Command           │ pnpm install && pnpm run build                │
│ Start Command           │ node dist/index.js                            │
│ Node Version            │ 22.x                                          │
│ Gerenciador             │ pnpm                                          │
│ DATABASE_URL            │ mysql://root:***@mysql-viby.railway...        │
│ MySQL Internal Host     │ mysql-viby.railway.internal:3306              │
│ MySQL Public Host       │ turntable.proxy.rlwy.net:48844                │
│ Domínio                 │ jkings.solutions                              │
└─────────────────────────┴───────────────────────────────────────────────┘
```

---

## 6. Checklist Final de Validação

- [ ] Repositório GitHub conectado ao Railway
- [ ] Variável `DATABASE_URL` configurada com URL interna do MySQL Railway
- [ ] Variável `NODE_ENV=production` configurada
- [ ] Variável `JWT_SECRET` configurada
- [ ] Node.js 22.x sendo usado no build (verificar logs do Railway)
- [ ] Build executado com sucesso (`pnpm run build`)
- [ ] Migrations executadas (`pnpm run db:push`)
- [ ] `https://jkings.solutions` carrega a tela de login
- [ ] Login com usuário admin funciona
- [ ] Página `/management` carrega os KPI Cards com dados reais
- [ ] Página `/support` lista os chamados
- [ ] Página `/itam` lista os ativos
- [ ] Criação de novo chamado funciona
- [ ] Upload de anexos funciona
- [ ] Não há erros 502 ou 500 no console do navegador

---

## 7. Conexão Externa ao Banco (DBeaver / TablePlus)

Para administrar o banco de dados externamente:

```
Host: turntable.proxy.rlwy.net
Port: 48844
Database: railway
User: root
Password: eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA
SSL: Desabilitado (ou modo requerido conforme o cliente)
```
