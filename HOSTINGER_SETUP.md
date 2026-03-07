# Configuração Rápida - Portal JKINGS na Hostinger

## 📋 Checklist de Deployment

- [ ] Node.js 14 ativado na Hostinger
- [ ] Banco MySQL criado e configurado
- [ ] Arquivo `.env` criado com variáveis corretas
- [ ] Projeto enviado via FTP
- [ ] Dependências instaladas (`npm install`)
- [ ] Migrations executadas (`npm run db:push`)
- [ ] Aplicação iniciada no Node.js Manager
- [ ] Teste de acesso: https://jkings.solutions

## 🚀 Passos Rápidos

### 1. Preparar Hostinger
```bash
# Via cPanel:
1. Node.js Manager → Create Application
2. Version: 14.x
3. Root: /home/jkings/public_html/portal-atendimento
4. Startup: dist/index.js
```

### 2. Upload via FTP
```
Enviar para: /public_html/portal-atendimento/
- dist/ (pasta compilada)
- drizzle/ (migrations)
- package.json
- .env (criar manualmente)
```

### 3. Instalar e Configurar
```bash
# Via SSH ou Node.js Manager:
npm install --production
npm run db:push
```

### 4. Iniciar
```bash
# Via cPanel Node.js Manager:
Click "Start Application"
```

## 📝 Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL=mysql://usuario:senha@localhost:3306/jkings_portal
JWT_SECRET=chave_secreta_forte_aqui
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Jeferson Reis
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key
VITE_FRONTEND_FORGE_API_KEY=sua_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_APP_TITLE=Portal de Atendimento JKINGS
VITE_APP_LOGO=/logo.png
VITE_ANALYTICS_ENDPOINT=seu_endpoint
VITE_ANALYTICS_WEBSITE_ID=seu_id
NODE_ENV=production
```

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Cannot find module" | Execute `npm install --production` |
| "Database connection failed" | Verifique DATABASE_URL e credenciais MySQL |
| "Application won't start" | Verifique logs no Node.js Manager |
| "Port already in use" | Reinicie a aplicação no Node.js Manager |

## 📚 Documentação Completa

Veja `DEPLOY_HOSTINGER.md` para guia detalhado.

## 🆘 Suporte

- **Hostinger**: https://www.hostinger.com/support
- **Projeto**: Verifique os logs no cPanel
- **Banco de Dados**: Verifique credenciais MySQL no cPanel

---

**Versão**: 6d0ce073  
**Data**: Fevereiro 2026
