# Guia de Deploy - Portal de Atendimento JKINGS na Hostinger

## Informações do Projeto
- **Domínio**: jkings.solutions
- **Tecnologia**: React 19 + Node.js 14 + Express 4 + MySQL
- **Versão Node.js Hostinger**: 14.x

## Pré-requisitos
1. Acesso FTP à Hostinger
2. Node.js 14 ativado na Hostinger
3. Banco de dados MySQL criado
4. Variáveis de ambiente configuradas

## Passo 1: Preparar o Servidor

### 1.1 Acessar cPanel da Hostinger
- Acesse: https://jkings.solutions/cpanel
- Faça login com suas credenciais

### 1.2 Ativar Node.js
1. No cPanel, procure por "Node.js Manager" ou "Node.js"
2. Clique em "Create Application"
3. Configure:
   - **Node.js Version**: 14.x
   - **Application Root**: `/home/jkings/public_html/portal-atendimento`
   - **Application URL**: jkings.solutions
   - **Application Startup File**: `dist/index.js`

### 1.3 Criar Banco de Dados MySQL
1. No cPanel, acesse "MySQL Databases"
2. Crie um novo banco de dados (ex: `jkings_portal`)
3. Crie um usuário MySQL com senha forte
4. Atribua todos os privilégios ao usuário

## Passo 2: Upload do Projeto

### 2.1 Via FTP
1. Abra seu cliente FTP (FileZilla, WinSCP, etc.)
2. Conecte com as credenciais FTP da Hostinger
3. Navegue até `/public_html/`
4. Crie uma pasta chamada `portal-atendimento`
5. Upload dos arquivos:
   ```
   portal-atendimento/
   ├── dist/                    # Pasta compilada (React + Node.js)
   ├── node_modules/           # Dependências (opcional - pode instalar no servidor)
   ├── drizzle/                # Migrations do banco
   ├── package.json
   ├── package-lock.json
   └── .env                    # Arquivo de variáveis (criar no servidor)
   ```

### 2.2 Instalar Dependências (SSH recomendado)
Se tiver acesso SSH:
```bash
cd /home/jkings/public_html/portal-atendimento
npm install --production
```

Se só tiver FTP, upload a pasta `node_modules` também (muito grande, ~500MB).

## Passo 3: Configurar Variáveis de Ambiente

### 3.1 Criar arquivo `.env`
Via FTP ou SSH, crie o arquivo `/portal-atendimento/.env`:

```env
# Database
DATABASE_URL=mysql://usuario:senha@localhost:3306/jkings_portal

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# OAuth (Manus)
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Owner
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Jeferson Reis

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key

# Frontend
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_APP_TITLE=Portal de Atendimento JKINGS
VITE_APP_LOGO=/logo.png

# Analytics
VITE_ANALYTICS_ENDPOINT=seu_endpoint
VITE_ANALYTICS_WEBSITE_ID=seu_id
```

**⚠️ IMPORTANTE**: Substitua os valores com suas credenciais reais!

## Passo 4: Executar Migrations do Banco

### Via SSH:
```bash
cd /home/jkings/public_html/portal-atendimento
npm run db:push
```

### Via cPanel Node.js Manager:
1. Acesse o Node.js Manager
2. Clique em "Run npm command"
3. Execute: `npm run db:push`

## Passo 5: Iniciar a Aplicação

### Via cPanel Node.js Manager:
1. Clique em "Start Application"
2. Aguarde a confirmação

### Via SSH:
```bash
cd /home/jkings/public_html/portal-atendimento
npm start
# ou
node dist/index.js
```

## Passo 6: Verificar Deployment

1. Acesse: https://jkings.solutions
2. Você deve ver a página de login do Portal de Atendimento
3. Teste o login com as credenciais configuradas

## Troubleshooting

### Erro: "Cannot find module"
- Solução: Execute `npm install --production` no servidor

### Erro: "Database connection failed"
- Verifique DATABASE_URL no arquivo `.env`
- Confirme que o banco MySQL está criado
- Verifique as credenciais do usuário MySQL

### Erro: "Port already in use"
- Node.js está tentando usar uma porta ocupada
- Mude a porta no arquivo `dist/index.js` ou configure no Node.js Manager

### Aplicação não inicia
- Verifique os logs no cPanel
- Confirme que Node.js 14 está ativado
- Verifique se `dist/index.js` existe

## Estrutura de Pastas no Servidor

```
/home/jkings/public_html/portal-atendimento/
├── dist/
│   ├── index.js              # Servidor Node.js
│   ├── public/               # Frontend compilado
│   │   ├── index.html
│   │   ├── assets/
│   │   └── images/
│   └── ...
├── drizzle/
│   ├── schema.ts
│   ├── migrations/
│   └── ...
├── node_modules/            # Dependências
├── package.json
├── .env                      # Variáveis de ambiente
└── DEPLOY_HOSTINGER.md       # Este arquivo
```

## Monitoramento e Manutenção

### Logs
- Acesse cPanel → "Node.js Manager" → "View Logs"
- Ou via SSH: `tail -f ~/.pm2/logs/app-error.log`

### Reiniciar Aplicação
- Via cPanel: "Node.js Manager" → "Restart Application"
- Via SSH: `npm restart`

### Atualizar Código
1. Faça upload dos novos arquivos via FTP
2. Reinicie a aplicação
3. Se houver mudanças no banco: `npm run db:push`

## Suporte

Para dúvidas sobre:
- **Hostinger**: Contate o suporte da Hostinger
- **Aplicação**: Verifique os logs e este guia
- **Banco de Dados**: Verifique as credenciais MySQL

---

**Última atualização**: Fevereiro 2026
**Versão do Projeto**: 6d0ce073
