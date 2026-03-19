# Migração para Passport.js

## Resumo da Implementação

Este documento descreve a migração do sistema de autenticação de JWT manual para **Passport.js** com estratégias LocalStrategy e JwtStrategy.

## Arquivos Criados

### 1. `server/passport-config.ts`
Configuração central do Passport.js com duas estratégias:

**LocalStrategy**
- Autentica usuários com email e senha
- Busca usuário na tabela `users` do banco de dados
- Valida senha usando bcryptjs
- Retorna dados do usuário autenticado

**JwtStrategy**
- Valida tokens JWT Bearer
- Extrai dados do usuário do token
- Verifica se usuário ainda existe no banco de dados
- Suporta logout automático se usuário foi deletado

**Serialização**
- `serializeUser`: Armazena apenas ID do usuário na sessão
- `deserializeUser`: Recupera dados completos do usuário do banco

### 2. `server/passport-middleware.ts`
Middlewares de autenticação reutilizáveis:

- `authenticateLocal`: Middleware para autenticação com email/senha
- `authenticateJwt`: Middleware para validação de JWT token
- `requireAuth`: Verifica se usuário está autenticado (401 se não)
- `requireAdmin`: Verifica se usuário é admin (403 se não)
- `requireAdminOrManager`: Verifica se usuário é admin ou manager
- `handleAuthError`: Middleware para tratamento de erros de autenticação

### 3. `server/passport-routes.ts`
Router Express com endpoints de autenticação:

```typescript
POST /api/auth/login
- Autentica com email/senha
- Retorna JWT token + dados do usuário
- Usa LocalStrategy do Passport

GET /api/auth/me
- Retorna dados do usuário autenticado
- Requer JWT token válido
- Usa JwtStrategy do Passport

POST /api/auth/logout
- Faz logout do usuário
- Limpa sessão
```

### 4. `server/passport.test.ts`
Suite de testes com 18 testes passando:

**LocalStrategy Tests**
- ✓ Hash de senha com bcryptjs
- ✓ Verificação de senha correta
- ✓ Rejeição de senha incorreta
- ✓ Rejeição de hash inválido

**JwtStrategy Tests**
- ✓ Geração de token JWT válido
- ✓ Inclusão de dados do usuário no token
- ✓ Inclusão de timestamps (iat, exp)
- ✓ Expiração de 7 dias

**Middleware Tests**
- ✓ Exportação de authenticateLocal
- ✓ Exportação de authenticateJwt
- ✓ Exportação de requireAuth
- ✓ Exportação de requireAdmin
- ✓ Exportação de requireAdminOrManager

**Router Tests**
- ✓ Exportação de router
- ✓ Métodos POST e GET disponíveis

**Integration Tests**
- ✓ Fluxo completo: hash → verify → token

## Modificações em Arquivos Existentes

### `server/_core/index.ts`
1. Adicionados imports do Passport.js:
   ```typescript
   import session from 'express-session';
   import passport from '../passport-config';
   import { authenticateLocal, authenticateJwt } from '../passport-middleware';
   ```

2. Configuração de sessão Express:
   ```typescript
   app.use(session({
     secret: process.env.JWT_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
   }));
   ```

3. Inicialização do Passport:
   ```typescript
   app.use(passport.initialize());
   app.use(passport.session());
   ```

4. Importação das rotas de autenticação:
   ```typescript
   const authRoutes = await import('../passport-routes');
   app.use('/api/auth', authRoutes.default);
   ```

## Dependências Instaladas

```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-jwt": "^4.0.1",
    "express-session": "^1.19.0"
  },
  "devDependencies": {
    "@types/passport": "^1.0.17",
    "@types/passport-local": "^1.0.38",
    "@types/passport-jwt": "^4.0.1",
    "@types/express-session": "^1.18.2"
  }
}
```

## Fluxo de Autenticação

### Login
1. Cliente envia POST `/api/auth/login` com email e senha
2. Passport LocalStrategy valida credenciais
3. Se válido, servidor gera JWT token
4. Cliente armazena token em localStorage
5. Cliente usa token em header `Authorization: Bearer <token>`

### Requisições Autenticadas
1. Cliente envia requisição com header `Authorization: Bearer <token>`
2. Passport JwtStrategy valida token
3. Se válido, `req.user` contém dados do usuário
4. Middleware `requireAuth` verifica autenticação
5. Middleware `requireAdmin` verifica role

### Logout
1. Cliente envia POST `/api/auth/logout`
2. Servidor limpa sessão
3. Cliente remove token do localStorage

## Compatibilidade com Frontend

O frontend continua usando o mesmo fluxo:

```typescript
// AuthContext.tsx
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
localStorage.setItem('currentUser', JSON.stringify(user));
```

## Segurança

1. **Senhas**: Hasheadas com bcryptjs (10 rounds)
2. **Tokens**: JWT com algoritmo HS256, expiração de 7 dias
3. **Sessão**: Cookies httpOnly, secure em produção
4. **Validação**: Queries parametrizadas, sem SQL injection
5. **Retry Logic**: Reconexão automática em falhas de banco de dados

## Testes

Executar testes do Passport:
```bash
pnpm test server/passport.test.ts
```

Resultado: **18 testes passando** ✓

## Próximas Etapas

1. **Rate Limiting**: Adicionar rate limit no endpoint `/api/auth/login`
2. **Refresh Tokens**: Implementar refresh token para renovar sessão
3. **2FA**: Adicionar autenticação de dois fatores
4. **OAuth**: Integrar com provedores OAuth (Google, GitHub)
5. **Audit Log**: Registrar tentativas de login e mudanças de senha

## Notas Técnicas

- Passport.js é agnóstico a banco de dados (usa callbacks customizados)
- Suporta múltiplas estratégias simultaneamente
- Serialização permite usar apenas ID em sessão (economiza memória)
- JwtStrategy não requer sessão (stateless)
- Compatível com Express, Fastify, Koa, etc.

## Referências

- [Passport.js Documentation](http://www.passportjs.org/)
- [LocalStrategy](http://www.passportjs.org/packages/passport-local/)
- [JwtStrategy](http://www.passportjs.org/packages/passport-jwt/)
- [Express Session](https://github.com/expressjs/session)
