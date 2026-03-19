// Build: 2026-03-13 teams-webhook-public-fix
import "dotenv/config";

// ─── Handlers globais para evitar crash por erros de conexão MySQL ─────────────
// O Railway fecha conexões ociosas, o que pode gerar erros não capturados.
// Estes handlers garantem que o processo continue rodando.
process.on('uncaughtException', (err: any) => {
  const isDbError = err?.code === 'PROTOCOL_CONNECTION_LOST' ||
    err?.code === 'ECONNRESET' ||
    err?.code === 'ECONNREFUSED' ||
    err?.message?.includes('Connection lost') ||
    err?.message?.includes('MySQL');
  if (isDbError) {
    console.warn('[Process] Erro de conexão MySQL capturado (processo continua):', err.message);
  } else {
    console.error('[Process] Erro não capturado:', err);
  }
});

process.on('unhandledRejection', (reason: any) => {
  const isDbError = reason?.code === 'PROTOCOL_CONNECTION_LOST' ||
    reason?.code === 'ECONNRESET' ||
    reason?.code === 'ECONNREFUSED' ||
    reason?.message?.includes('Connection lost') ||
    reason?.message?.includes('MySQL');
  if (isDbError) {
    console.warn('[Process] Promise rejeitada por erro MySQL (processo continua):', reason?.message);
  } else {
    console.error('[Process] Promise não tratada:', reason);
  }
});

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import passport from '../passport-config';
import { authenticateLocal, authenticateJwt, requireAuth, optionalJwt } from '../passport-middleware';
import { getMysqlConnectionConfig, getActiveDbUrl } from '../db';
import { getPool } from '../mysql-pool';
import { verifyToken } from '../auth';
import { registerHealthRoutes } from '../health-routes';
import { startSubscriptionRenewalCron } from '../teams';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Trust proxy (necessário para rate-limit funcionar corretamente atrás de proxy reverso)
  app.set('trust proxy', 1);

  // ============================================================
  // SEGURANÇA: Helmet (headers HTTP de segurança)
  // ============================================================
  app.use(helmet({
    contentSecurityPolicy: false, // desabilitado para não bloquear Vite HMR em dev
    crossOriginEmbedderPolicy: false,
  }));

  // ============================================================
  // SEGURANÇA: Rate Limiting
  // ============================================================
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas por IP
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto por IP
    standardHeaders: true,
    legacyHeaders: false,
  });
  // Aplicar rate limit geral na API
  app.use('/api/', apiLimiter);
  // Rate limit específico para login (mais restritivo)
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/forgot-password', loginLimiter);

  // ============================================================
  // SEGURANÇA: Sanitização XSS helper
  // ============================================================
  function sanitizeInput(input: any): any {
    if (typeof input === 'string') return xss(input);
    if (Array.isArray(input)) return input.map(sanitizeInput);
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }
  // Middleware de sanitização para todas as rotas POST/PUT
  app.use('/api/', (req, _res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && req.path !== '/api/trpc' && !req.path.startsWith('/api/trpc/')) {
      // Não sanitizar campos de senha ou dados binários
      const skipFields = ['password', 'newPassword', 'confirmPassword', 'currentPassword', 'imageData', 'imageData2', 'imageData3', 'passwordHash', 'fileData', 'base64Data'];
      if (typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
          if (!skipFields.includes(key) && typeof value === 'string') {
            (req.body as any)[key] = xss(value as string);
          }
        }
      }
    }
    next();
  });

  // Configurar sessão Express com MySQL Store
  // Usa o pool compartilhado para evitar que erros de conexão derrubem o processo
  const MySQLStore = MySQLStoreFactory(session as any);
  let sessionStore: any;
  try {
    // Tentar usar o pool compartilhado (mais resiliente)
    const pool = getPool();
    sessionStore = new MySQLStore({}, pool as any);
    console.log('[Session] Store MySQL configurado com pool compartilhado');
  } catch (e: any) {
    console.warn('[Session] Falha ao usar pool, usando conexão direta:', e.message);
    sessionStore = new MySQLStore({
      ...getMysqlConnectionConfig(),
      createDatabaseTable: true,
    });
  }

  app.use(session({
    store: sessionStore,
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    }
  }));
  
  // Inicializar Passport.js
  app.use(passport.initialize());
  app.use(passport.session());
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ============================================================
  // HEALTH CHECK — Monitoramento Railway
  // ============================================================
  registerHealthRoutes(app);

  // ============================================================
  // Endpoint de diagnóstico temporário — verificar variáveis Teams + token
  app.get('/api/teams/diag', async (_req, res) => {
    const vars = {
      TEAMS_TENANT_ID:    process.env.TEAMS_TENANT_ID ? `${process.env.TEAMS_TENANT_ID.slice(0,8)}...` : 'NÃO DEFINIDA',
      TEAMS_CLIENT_ID:    process.env.TEAMS_CLIENT_ID ? `${process.env.TEAMS_CLIENT_ID.slice(0,8)}...` : 'NÃO DEFINIDA',
      TEAMS_CLIENT_SECRET: process.env.TEAMS_CLIENT_SECRET ? `${process.env.TEAMS_CLIENT_SECRET.slice(0,4)}...` : 'NÃO DEFINIDA',
      TEAMS_NOTIFICATION_URL: process.env.TEAMS_NOTIFICATION_URL || 'NÃO DEFINIDA',
      TEAMS_LIFECYCLE_URL: process.env.TEAMS_LIFECYCLE_URL || 'NÃO DEFINIDA',
      TEAMS_WEBHOOK_CLIENT_STATE: process.env.TEAMS_WEBHOOK_CLIENT_STATE || 'NÃO DEFINIDA (usará padrão)',
      TEAMS_DEFAULT_RESOURCE: process.env.TEAMS_DEFAULT_RESOURCE || 'NÃO DEFINIDA',
      NODE_ENV: process.env.NODE_ENV,
    };
    // Testar obtenção de token do Graph
    let tokenTest: { ok: boolean; error?: string; tokenType?: string } = { ok: false };
    try {
      const { getGraphAccessToken: _getToken } = await import('../teams.js');
      const token = await _getToken();
      tokenTest = { ok: Boolean(token), tokenType: 'Bearer' };
    } catch (err: any) {
      tokenTest = { ok: false, error: err?.message ?? String(err) };
    }
    res.json({ vars, tokenTest });
  });

  // POST /api/teams/diag-webhook-payload — captura e salva o payload completo do webhook para inspeção
  // Armazena o último payload recebido em memória para diagnóstico
  let _lastWebhookPayload: any = null;
  app.post('/api/teams/diag-webhook-payload', (req, res) => {
    _lastWebhookPayload = req.body;
    console.log('[Teams] diag-webhook-payload recebido:', JSON.stringify(req.body)?.slice(0, 2000));
    res.status(202).json({ status: 'captured' });
  });
  app.get('/api/teams/diag-webhook-payload', (_req, res) => {
    res.json({ payload: _lastWebhookPayload });
  });

  // ============================================================
  // Endpoint de manutenção: aplicar migrações de banco de dados para integração Teams
  // POST /api/teams/db-migrate (requer header X-Maint-Key)
  app.post('/api/teams/db-migrate', async (req, res) => {
    const maintKey = req.headers['x-maint-key'] as string | undefined;
    // Usar TEAMS_CLIENT_SECRET como chave de autenticação (primeiros 20 chars)
    const teamsSecret = process.env.TEAMS_CLIENT_SECRET ?? '';
    const expectedKey = teamsSecret.slice(0, 20);
    if (!maintKey || !expectedKey || maintKey !== expectedKey) {
      return res.status(401).json({ error: 'Chave de manutenção inválida. Use os primeiros 20 caracteres do TEAMS_CLIENT_SECRET no header X-Maint-Key.' });
    }
    try {
      const { getPoolConn } = await import('../mysql-pool.js');
      const conn = await getPoolConn();
      const results: string[] = [];
      try {
        // 1. Alterar userId para aceitar NULL na tabela requests
        await conn.execute('ALTER TABLE `requests` MODIFY COLUMN `userId` INT DEFAULT NULL');
        results.push('✅ requests.userId alterado para aceitar NULL');
      } catch (e: any) {
        if (e.message?.includes('Duplicate column') || e.message?.includes('already exists')) {
          results.push('ℹ️ requests.userId já aceita NULL (sem alteração)');
        } else {
          results.push(`⚠️ requests.userId: ${e.message}`);
        }
      }
      // 2. Criar tabela support_history
      try {
        await conn.execute(`CREATE TABLE IF NOT EXISTS \`support_history\` (
          \`id\`          INT          NOT NULL AUTO_INCREMENT,
          \`itemType\`    VARCHAR(50)  NOT NULL DEFAULT 'request',
          \`itemId\`      INT          NOT NULL,
          \`action\`      VARCHAR(100) NOT NULL,
          \`description\` TEXT         DEFAULT NULL,
          \`userId\`      INT          DEFAULT NULL,
          \`userName\`    VARCHAR(255) DEFAULT NULL,
          \`createdAt\`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`support_history_itemId_idx\` (\`itemId\`),
          KEY \`support_history_userId_idx\` (\`userId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        results.push('✅ Tabela support_history criada/verificada');
      } catch (e: any) { results.push(`⚠️ support_history: ${e.message}`); }
      // 3. Criar tabelas Teams
      try {
        await conn.execute(`CREATE TABLE IF NOT EXISTS \`teams_subscriptions\` (
          \`id\`                       INT          NOT NULL AUTO_INCREMENT,
          \`subscriptionId\`           VARCHAR(255) NOT NULL,
          \`resource\`                 TEXT         NOT NULL,
          \`changeType\`               VARCHAR(100) NOT NULL DEFAULT 'created',
          \`expirationDateTime\`       VARCHAR(50)  NOT NULL,
          \`clientState\`              VARCHAR(255) NOT NULL,
          \`notificationUrl\`          TEXT         NOT NULL,
          \`lifecycleNotificationUrl\` TEXT         DEFAULT NULL,
          \`status\`                   ENUM('active','expired','error') NOT NULL DEFAULT 'active',
          \`metadata\`                 JSON         DEFAULT NULL,
          \`createdAt\`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\`                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`teams_subscriptions_subscriptionId_unique\` (\`subscriptionId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        results.push('✅ Tabela teams_subscriptions criada/verificada');
      } catch (e: any) { results.push(`⚠️ teams_subscriptions: ${e.message}`); }
      try {
        await conn.execute(`CREATE TABLE IF NOT EXISTS \`teams_integration_events\` (
          \`id\`               INT          NOT NULL AUTO_INCREMENT,
          \`messageId\`        VARCHAR(255) NOT NULL,
          \`eventType\`        VARCHAR(100) NOT NULL DEFAULT 'message_received',
          \`userEmail\`        VARCHAR(255) DEFAULT NULL,
          \`payload\`          JSON         DEFAULT NULL,
          \`processingStatus\` ENUM('received','processed','ignored','failed') NOT NULL DEFAULT 'received',
          \`errorMessage\`     TEXT         DEFAULT NULL,
          \`processedAt\`      TIMESTAMP    DEFAULT NULL,
          \`createdAt\`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`teams_events_messageId_unique\` (\`messageId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        results.push('✅ Tabela teams_integration_events criada/verificada');
      } catch (e: any) { results.push(`⚠️ teams_integration_events: ${e.message}`); }
      try {
        await conn.execute(`CREATE TABLE IF NOT EXISTS \`teams_message_ticket_map\` (
          \`id\`        INT          NOT NULL AUTO_INCREMENT,
          \`messageId\` VARCHAR(255) NOT NULL,
          \`ticketId\`  INT          NOT NULL,
          \`userId\`    INT          DEFAULT NULL,
          \`category\`  VARCHAR(100) DEFAULT 'Geral',
          \`priority\`  VARCHAR(50)  DEFAULT 'media',
          \`createdAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`teams_map_messageId_unique\` (\`messageId\`),
          KEY \`teams_map_ticketId_idx\` (\`ticketId\`),
          KEY \`teams_map_userId_idx\` (\`userId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
        results.push('✅ Tabela teams_message_ticket_map criada/verificada');
      } catch (e: any) { results.push(`⚠️ teams_message_ticket_map: ${e.message}`); }
      // 4. Adicionar colunas externalMessageId e metadata na tabela requests
      try {
        const [extCols] = await conn.execute("SHOW COLUMNS FROM requests WHERE Field = 'externalMessageId'") as any;
        if (!extCols.length) {
          await conn.execute('ALTER TABLE `requests` ADD COLUMN `externalMessageId` VARCHAR(255) DEFAULT NULL');
          await conn.execute('CREATE INDEX `requests_externalMessageId_idx` ON `requests` (`externalMessageId`)');
          results.push('✅ Coluna externalMessageId adicionada');
        } else { results.push('ℹ️ Coluna externalMessageId já existe'); }
      } catch (e: any) { results.push(`⚠️ externalMessageId: ${e.message}`); }
      try {
        const [metaCols] = await conn.execute("SHOW COLUMNS FROM requests WHERE Field = 'metadata'") as any;
        if (!metaCols.length) {
          await conn.execute('ALTER TABLE `requests` ADD COLUMN `metadata` JSON DEFAULT NULL');
          results.push('✅ Coluna metadata adicionada');
        } else { results.push('ℹ️ Coluna metadata já existe'); }
      } catch (e: any) { results.push(`⚠️ metadata: ${e.message}`); }
      conn.release();
      return res.json({ ok: true, results });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  // ============================================================
  // Endpoint de diagnóstico: testar chamada Graph para chatId/messageId específico
  // GET /api/teams/diag-graph?chatId=<chatId>&messageId=<messageId>
  app.get('/api/teams/diag-graph', async (req, res) => {
    const chatId = req.query.chatId as string | undefined;
    const messageId = req.query.messageId as string | undefined;

    if (!chatId || !messageId) {
      return res.status(400).json({
        error: 'Parâmetros chatId e messageId são obrigatórios.',
        usage: 'GET /api/teams/diag-graph?chatId=<chatId>&messageId=<messageId>',
        tip: 'Encontre chatId e messageId nos eventos recentes da aba TeamsWeb → Eventos Recentes.',
      });
    }

    try {
      const { testGraphMessageFetch: _testFetch } = await import('../teams.js');
      const result = await _testFetch(chatId, messageId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message ?? String(err),
        hint: 'Verifique se as credenciais TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET e TEAMS_TENANT_ID estão configuradas.',
      });
    }
  });

  // ============================================================
  // Endpoint de diagnóstico: listar eventos recentes do banco (últimos 10)
  // GET /api/teams/diag-events
  app.get('/api/teams/diag-events', async (_req, res) => {
    try {
      const { listRecentTeamsEvents: _listEvents } = await import('../teams.js');
      const events = await _listEvents(10);
      return res.json({ events });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  });

  // GET /api/teams/diag-subs — lista subscriptions ativas no banco e no Graph
  app.get('/api/teams/diag-subs', async (_req, res) => {
    try {
      const { getPoolConn } = await import('../mysql-pool.js');
      const { getGraphAccessToken } = await import('../teams.js');
      const conn = await getPoolConn();
      let dbSubs: any[] = [];
      try {
        const [rows] = await conn.execute('SELECT * FROM teams_subscriptions ORDER BY createdAt DESC LIMIT 20') as any;
        dbSubs = rows;
      } finally { conn.release(); }

      // Buscar subscriptions ativas no Graph
      let graphSubs: any = null;
      let graphError: string | null = null;
      try {
        const token = await getGraphAccessToken();
        const resp = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        graphSubs = await resp.json();
      } catch (e: any) { graphError = e?.message ?? String(e); }

      return res.json({ dbSubs, graphSubs, graphError });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  });

  // GET /api/teams/diag-permissions — verifica permissões do app no Azure AD
  app.get('/api/teams/diag-permissions', async (_req, res) => {
    try {
      const { checkGraphPermissions: _checkPerms } = await import('../teams.js');
      const result = await _checkPerms();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  });

  // POST /api/teams/fix-subscription — recria subscription com clientState correto
  app.post('/api/teams/fix-subscription', async (_req, res) => {
    try {
      const { recreateSubscriptionWithClientState: _recreate } = await import('../teams.js');
      const result = await _recreate();
      return res.json({ ok: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  // GET /api/teams/diag-encryption — verifica se as variáveis de criptografia estão configuradas
  app.get('/api/teams/diag-encryption', async (_req, res) => {
    try {
      const { getEncryptionPrivateKey: _getKey, getEncryptionCertificate: _getCert, getEncryptionCertificateId: _getCertId } = await import('../teams.js');
      const privateKey = _getKey();
      const cert = _getCert();
      const certId = _getCertId();
      return res.json({
        privateKey: privateKey ? `SET (${privateKey.length} chars)` : 'NOT SET',
        certificate: cert ? `SET (${cert.length} chars)` : 'NOT SET',
        certificateId: certId || 'NOT SET',
        envVars: {
          TEAMS_ENCRYPTION_PRIVATE_KEY: process.env.TEAMS_ENCRYPTION_PRIVATE_KEY ? `SET (${process.env.TEAMS_ENCRYPTION_PRIVATE_KEY.length} chars)` : 'NOT SET',
          TEAMS_ENCRYPTION_CERTIFICATE: process.env.TEAMS_ENCRYPTION_CERTIFICATE ? `SET (${process.env.TEAMS_ENCRYPTION_CERTIFICATE.length} chars)` : 'NOT SET',
          TEAMS_ENCRYPTION_CERTIFICATE_ID: process.env.TEAMS_ENCRYPTION_CERTIFICATE_ID || 'NOT SET',
        },
        ready: !!(privateKey && cert && certId),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message ?? String(err) });
    }
  });

  // POST /api/teams/recreate-with-encryption — deleta subscription existente e recria com includeResourceData=true
  app.post('/api/teams/recreate-with-encryption', async (_req, res) => {
    try {
      const { getGraphAccessToken: _getToken, createGraphSubscription: _createSub } = await import('../teams.js');

      // 1. Obter token
      const token = await _getToken();

      // 2. Listar subscriptions existentes no Graph
      const listResp = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listResp.json() as any;
      const existingSubs = listData.value ?? [];

      // 3. Deletar todas as subscriptions existentes para /chats/getAllMessages
      const deleted: string[] = [];
      for (const sub of existingSubs) {
        if (sub.resource?.includes('chats')) {
          const delResp = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${sub.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (delResp.ok || delResp.status === 204) {
            deleted.push(sub.id);
          }
        }
      }

      // 4. Aguardar 2 segundos para o Graph processar a deleção
      await new Promise(r => setTimeout(r, 2000));

      // 5. Criar nova subscription com includeResourceData=true
      // resource e expirationDateTime são obrigatórios no schema
      const resource = process.env.TEAMS_DEFAULT_RESOURCE || '/chats/getAllMessages';
      const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const result = await _createSub({
        resource,
        expirationDateTime,
        includeResourceData: true,
      });

      return res.json({ ok: true, deleted, created: result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  // POST /api/teams/reprocess-failed — reprocessa eventos com status failed
  app.post('/api/teams/reprocess-failed', async (req, res) => {
    try {
      const limit = Number(req.query.limit ?? req.body?.limit ?? 10);
      const { reprocessFailedEvents: _reprocess } = await import('../teams.js');
      const result = await _reprocess(limit);
      return res.json({ ok: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err?.message ?? String(err) });
    }
  });

  // ============================================================
  // Microsoft Teams Integration — Endpoints Públicos
  // DEVEM vir ANTES de qualquer app.use('/api', authenticateJwt, ...)
  // para que o Microsoft Graph consiga validar a URL sem token JWT.
  // ============================================================
  {
    const {
      processGraphNotifications: _processNotif,
      renewGraphSubscription: _renewSub,
      upsertTeamsSubscription: _upsertSub,
    } = await import('../teams.js');
    const { ENV: _teamsEnv } = await import('./../_core/env.js');

    /**
     * POST /api/teams/test-sync
     * Endpoint de diagnóstico: processa webhook de forma síncrona e retorna o resultado.
     * DEVE estar dentro do bloco Teams (antes de qualquer authenticateJwt).
     */
    app.post('/api/teams/test-sync', async (req, res) => {
      try {
        const result = await _processNotif(req.body);
        res.json({ ok: true, result });
      } catch (err: any) {
        res.status(500).json({ ok: false, error: err?.message ?? String(err), stack: err?.stack?.slice(0, 500) });
      }
    });

    /**
     * GET /api/teams/webhook
     * Validação do endpoint pelo Microsoft Graph (challenge handshake).
     * O Graph envia ?validationToken=<token> e espera o mesmo valor de volta
     * com Content-Type: text/plain.
     */
    app.get('/api/teams/webhook', (req, res) => {
      const validationToken = req.query.validationToken as string | undefined;
      if (validationToken) {
        console.log('[Teams] Webhook validation challenge recebido');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(validationToken);
      }
      res.status(200).json({ status: 'ok', message: 'Teams webhook endpoint ativo' });
    });

    /**
     * POST /api/teams/webhook
     * Recebe change notifications do Microsoft Graph.
     * Valida clientState e processa mensagens assincronamente.
     */
    app.post('/api/teams/webhook', async (req, res) => {
      // Challenge de validação: o Graph envia POST com ?validationToken ao criar subscription
      const validationToken = req.query.validationToken as string | undefined;
      if (validationToken) {
        console.log('[Teams] POST webhook validation challenge recebido');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(validationToken);
      }

      // Responder imediatamente com 202 para evitar timeout do Graph
      res.status(202).json({ status: 'accepted' });

      // Processar em background
      setImmediate(async () => {
        try {
          const result = await _processNotif(req.body);
          console.log('[Teams] Notificações processadas:', JSON.stringify(result, null, 2));
        } catch (error) {
          console.error('[Teams] Erro ao processar notificações:', error);
        }
      });
    });

    /**
     * POST /api/teams/lifecycle
     * Lifecycle notifications do Microsoft Graph.
     * Trata: subscriptionRemoved, missed, reauthorizationRequired.
     */
    app.post('/api/teams/lifecycle', async (req, res) => {
      const validationToken = req.query.validationToken as string | undefined;
      if (validationToken) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(validationToken);
      }

      res.status(202).json({ status: 'accepted' });

      setImmediate(async () => {
        try {
          const events: any[] = req.body?.value ?? [];
          for (const event of events) {
            const lifecycleEvent = event.lifecycleEvent;
            const subscriptionId = event.subscriptionId;
            console.log(`[Teams] Lifecycle event: ${lifecycleEvent} para subscription ${subscriptionId}`);

            if (lifecycleEvent === 'subscriptionRemoved' || lifecycleEvent === 'missed') {
              await _upsertSub({
                subscriptionId: subscriptionId ?? 'unknown',
                resource: event.resource ?? '',
                changeType: 'created',
                expirationDateTime: event.subscriptionExpirationDateTime ?? new Date().toISOString(),
                clientState: event.clientState ?? '',
                notificationUrl: _teamsEnv.teamsNotificationUrl ?? '',
                lifecycleNotificationUrl: _teamsEnv.teamsLifecycleUrl ?? null,
                status: lifecycleEvent === 'subscriptionRemoved' ? 'expired' : 'error',
                metadata: event,
              });
            } else if (lifecycleEvent === 'reauthorizationRequired' && subscriptionId) {
              const newExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
              try {
                await _renewSub(subscriptionId, newExpiry);
                console.log(`[Teams] Subscription ${subscriptionId} renovada até ${newExpiry}`);
              } catch (err) {
                console.error(`[Teams] Falha ao renovar subscription ${subscriptionId}:`, err);
              }
            }
          }
        } catch (error) {
          console.error('[Teams] Erro no lifecycle handler:', error);
        }
      });
    });
  }

  // Endpoint para obter dados do usuário logado
  app.get('/api/me', async (req, res) => {
    try {
      const { verifyToken } = await import('../auth');
      const { getUserById } = await import('../db');
      const { retryWithBackoff } = await import('../retry');
      
      // Extrair token do header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }
      
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      
      if (!decoded || !decoded.user || !decoded.user.id) {
        return res.status(401).json({ error: 'Token inválido' });
      }
      
      // Tentar usar ID numérico primeiro, senão buscar por email
      const rawId = decoded.user.id;
      const numericId = parseInt(rawId);
      
      let user: any = null;
      
      if (!isNaN(numericId) && numericId > 0) {
        // ID numérico válido - buscar por ID
        const result = await retryWithBackoff(() => getUserById(numericId), {
          maxAttempts: 3,
          initialDelayMs: 100,
          backoffMultiplier: 2,
        });
        user = result?.data || result;
      }
      
      // Se não encontrou por ID (ou ID inválido), buscar por email
      if (!user && decoded.user.email) {
        const { getUserByEmail } = await import('../db');
        const result = await retryWithBackoff(() => getUserByEmail(decoded.user.email), {
          maxAttempts: 3,
          initialDelayMs: 100,
          backoffMultiplier: 2,
        });
        user = result?.data || result;
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Buscar empresa vinculada ao usuário
      let companyName: string | undefined;
      let companyId: number | undefined;
      try {
        const { getUserAssignmentsByUserId } = await import('../db');
        const assignments = await getUserAssignmentsByUserId(user.id);
        if (assignments && assignments.length > 0) {
          companyName = assignments[0].companyName;
          companyId = assignments[0].companyId;
        }
      } catch (assignErr) {
        console.warn('[GET /api/me] Could not load company assignment:', assignErr);
      }
      
      return res.json({
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        avatar: user.avatar,
        department: user.department || '',
        company: companyName || user.company || '',
        companyName: companyName || '',
        companyId: companyId || null,
        position: user.position || '',
        loginMethod: user.loginMethod,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn
      });
    } catch (err) {
      console.error('[GET /api/me] Error:', err);
      res.status(500).json({ error: 'Erro ao carregar usuário' });
    }
  });

  // REST API routes for users (protegidas com JWT)
  app.get('/api/users', authenticateJwt, async (req, res) => {
    try {
      const { getAllUsers, getUsersByCompany } = await import('../db');
      const companyId = req.query.company as string | undefined;
      
      let users;
      if (companyId) {
        users = await getUsersByCompany(parseInt(companyId));
      } else {
        users = await getAllUsers();
      }
      res.json(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });
  
  app.post('/api/users', authenticateJwt, async (req, res) => {
    try {
      const { createUser, getUserByEmail } = await import('../db');
      const bcryptjs = await import('bcryptjs');
      const { email, name, role, department, departmentId, companyId, password, profileImage } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: 'Email e nome são obrigatórios' });
      }
      
      // Verificar se email já existe globalmente
      const existing = await getUserByEmail(email);
      if (existing) {
        // Se uma empresa foi informada, verificar se o usuário já está vinculado a ela
        if (companyId) {
          const { getPool } = await import('../mysql-pool');
          const pool = getPool();
          const [assignRows] = await pool.query(
            `SELECT id FROM userCompanyAssignments WHERE userId = ? AND companyId = ? AND isActive = 1`,
            [existing.id, parseInt(companyId)]
          ) as any[];
          if ((assignRows as any[]).length > 0) {
            return res.status(400).json({ 
              error: `O e-mail '${email}' já está cadastrado nesta empresa. Cada usuário deve ter um e-mail único por empresa.` 
            });
          }
          // E-mail existe mas não está vinculado a esta empresa — pode vincular
          // (não bloqueia a criação, pois o usuário pode pertencer a múltiplas empresas)
          return res.status(400).json({ 
            error: `O e-mail '${email}' já está cadastrado no sistema. Para vinculá-lo a esta empresa, edite o usuário existente.` 
          });
        }
        return res.status(400).json({ error: `O e-mail '${email}' já está cadastrado no sistema.` });
      }
      
      // Rejeitar base64 como profileImage
      let safeProfileImage: string | undefined = undefined;
      if (profileImage) {
        if (profileImage.startsWith('data:')) {
          return res.status(400).json({ 
            error: 'Imagem base64 não pode ser salva diretamente. Crie o usuário sem imagem e use o endpoint /api/users/:id/upload-image para adicionar a foto.' 
          });
        }
        if (profileImage.startsWith('http://') || profileImage.startsWith('https://') || profileImage.startsWith('/')) {
          safeProfileImage = profileImage;
        }
      }
      
      // Hash da senha se fornecida
      let passwordHash: string | undefined = undefined;
      if (password) {
        passwordHash = await bcryptjs.default.hash(password, 10);
      }
      
      // Gerar openId único para usuários criados manualmente
      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      await createUser({ 
        email, 
        name, 
        role: role || 'user', 
        department, 
        passwordHash,
        profileImage: safeProfileImage,
        openId,
        loginMethod: 'local',
      });
      
      // Retornar o usuário criado
      const created = await getUserByEmail(email);
      
      // Criar vínculo empresa-usuário
      if (created) {
        const { createUserAssignment, getOrCreateTemporaryCompany } = await import('../db');
        const { getPool } = await import('../mysql-pool');
        const pool = getPool();
        
        // Se não foi informada empresa, vincular à empresa Temporário
        const targetCompanyId = companyId ? parseInt(companyId) : await getOrCreateTemporaryCompany();
        
        // Resolver nome do departamento se departmentId foi informado
        let deptName: string | undefined = department;
        if (departmentId) {
          const [deptRows] = await pool.query(
            'SELECT name FROM departments WHERE id = ?',
            [parseInt(departmentId)]
          ) as any[];
          deptName = (deptRows as any[])[0]?.name || department;
          // Atualizar campo department do usuário com o nome resolvido
          if (deptName) {
            await pool.query(
              'UPDATE users SET department = ? WHERE id = ?',
              [deptName, created.id]
            );
          }
        }
        
        try {
          await createUserAssignment({
            userId: created.id,
            companyId: targetCompanyId,
            departmentId: departmentId ? parseInt(departmentId) : undefined,
            role: role || 'user',
            isActive: 1,
          } as any);
          console.log(`[POST /api/users] User ${created.id} assigned to company ${targetCompanyId}`);
        } catch (assignErr) {
          console.warn('[POST /api/users] Failed to create assignment:', assignErr);
        }
      }
      
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      res.status(400).json({ error: error.message || 'Failed to create user' });
    }
  });
  
  app.put('/api/users/:id', authenticateJwt, async (req, res) => {
    try {
      const { updateUser, createUserAssignment, getUserAssignmentsByUserId, updateUserAssignment } = await import('../db');
      const { id } = req.params;
      const userId = parseInt(id);
      const { email, name, role, department, departmentId, companyId, profileImage, phone, position } = req.body;
      
      console.log('[PUT /api/users/:id] Updating user', userId, 'with:', {
        email, name, role, department, departmentId, companyId,
        profileImage: profileImage ? '[URL or DATA]' : undefined
      });
      
      if (!email && !name && !role && !department && !departmentId && !companyId && !profileImage && !phone && !position) {
        return res.status(400).json({ error: 'At least one field is required' });
      }
      
      // 1. Montar objeto de atualização da tabela users
      const updateData: Record<string, any> = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (phone !== undefined) updateData.phone = phone;
      if (position !== undefined) updateData.position = position;

      // Resolver nome do departamento: se vier departmentId, buscar o nome
      if (departmentId !== undefined && departmentId !== null && departmentId !== '') {
        const { getPool } = await import('../mysql-pool');
        const dbPool = getPool();
        const [deptRows] = await dbPool.query(
          'SELECT name FROM departments WHERE id = ?',
          [parseInt(departmentId)]
        ) as any[];
        const deptName = (deptRows as any[])[0]?.name || null;
        if (deptName) updateData.department = deptName;
      } else if (department !== undefined) {
        updateData.department = department || null;
      }
      
      // Validar profileImage: rejeitar base64 bruto, aceitar apenas URLs
      if (profileImage) {
        if (profileImage.startsWith('data:')) {
          return res.status(400).json({ 
            error: 'Imagem base64 não pode ser salva diretamente. Use o endpoint /api/users/:id/upload-image para fazer upload da imagem.' 
          });
        }
        if (profileImage.startsWith('http://') || profileImage.startsWith('https://') || profileImage.startsWith('/')) {
          updateData.profileImage = profileImage;
        } else {
          return res.status(400).json({ error: 'URL de imagem inválida' });
        }
      }

      // 2. Atualizar dados do usuário na tabela users
      const user = await updateUser(userId, updateData);

      // 3. Atualizar relacionamento empresa-usuário (userCompanyAssignments)
      if (companyId !== undefined && companyId !== null && companyId !== '') {
        const parsedCompanyId = parseInt(companyId);
        const parsedDeptId = departmentId ? parseInt(departmentId) : undefined;
        
        // Buscar atribuições ativas do usuário
        const assignments = await getUserAssignmentsByUserId(userId);
        const existingAssignment = assignments.find((a: any) => a.companyId === parsedCompanyId);
        
        if (existingAssignment) {
          // Atualizar atribuição existente
          const assignmentUpdates: any = {};
          if (parsedDeptId) assignmentUpdates.departmentId = parsedDeptId;
          if (role) assignmentUpdates.role = role === 'admin' ? 'admin' : role === 'manager' ? 'gerente' : 'colaborador';
          if (Object.keys(assignmentUpdates).length > 0) {
            await updateUserAssignment(existingAssignment.id, assignmentUpdates);
          }
        } else {
          // Criar nova atribuição
          await createUserAssignment({
            userId,
            companyId: parsedCompanyId,
            departmentId: parsedDeptId,
            role: role === 'admin' ? 'admin' : role === 'manager' ? 'gerente' : 'colaborador',
          });
        }
      }

      console.log('[PUT /api/users/:id] Update successful');
      res.json(user);
    } catch (error: any) {
      console.error('[PUT /api/users/:id] Failed to update user:', error);
      res.status(400).json({ error: error.message || 'Failed to update user' });
    }
  });
  
  app.delete('/api/users/:id', authenticateJwt, async (req, res) => {
    try {
      const { deleteUser } = await import('../db');
      const { id } = req.params;
      await deleteUser(parseInt(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      res.status(400).json({ error: error.message || 'Failed to delete user' });
    }
  });
  
  // Rota de administração para alteração de senha (apenas para administradores logados)
  app.put('/api/admin/users/:id/password', async (req, res) => {
    try {
      const { updateUserPassword, getUserById } = await import('../db');
      const { verifyToken } = await import('../auth');
      const bcryptjs = await import('bcryptjs');
      const { id } = req.params;
      const { newPassword } = req.body;
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso negado: Token de admin não fornecido' });
      }
      
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      
      if (!decoded || !decoded.user || decoded.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado: Apenas administradores podem realizar esta ação' });
      }
      
      if (!newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
      }
      
      const targetUserId = parseInt(id);
      const user = await getUserById(targetUserId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      const hashedPassword = await bcryptjs.default.hash(newPassword, 10);
      const result = await updateUserPassword(targetUserId, hashedPassword);
      res.json({ success: true, message: 'Senha alterada com sucesso pelo administrador' });
    } catch (error: any) {
      console.error('Admin password update failed:', error);
      res.status(500).json({ error: 'Erro interno ao alterar senha' });
    }
  });

  // Rota padrão para alteração da PRÓPRIA senha (exige senha atual)
  app.put('/api/users/:id/password', authenticateJwt, async (req, res) => {
    try {
      const { updateUserPassword, getUserById } = await import('../db');
      const { verifyToken } = await import('../auth');
      const bcryptjs = await import('bcryptjs');
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }
      
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);
      
      if (!decoded || !decoded.user || parseInt(id) !== parseInt(decoded.user.id)) {
        return res.status(403).json({ error: 'Você só pode alterar sua própria senha por esta rota' });
      }
      
      if (!currentPassword || !newPassword || newPassword.trim().length < 6) {
        return res.status(400).json({ error: 'Dados insuficientes ou senha muito curta' });
      }
      
      const user = await getUserById(parseInt(id));
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: 'Não foi possível validar a senha atual' });
      }
      
      const isPasswordValid = await bcryptjs.default.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }
      
      const hashedPassword = await bcryptjs.default.hash(newPassword, 10);
      await updateUserPassword(parseInt(id), hashedPassword);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: 'Falha ao alterar senha' });
    }
  });
  
  // REST API routes for companies (protegidas com JWT)
  app.get('/api/companies', authenticateJwt, async (req, res) => {
    try {
      const { getAllCompanies } = await import('../db');
      const companies = await getAllCompanies();
      res.json(companies);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
      const errorMessage = error?.message || '';
      const causeMessage = error?.cause?.message || '';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect') || 
                                causeMessage.includes('ETIMEDOUT') || causeMessage.includes('connect');
      if (isConnectionError) {
        res.status(503).json({ 
          error: 'Database connection failed. Please try again later.',
          details: 'Unable to connect to database server'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to fetch companies',
          details: errorMessage || 'Unknown error'
        });
      }
    }
  });
  
  app.get('/api/companies/:id', authenticateJwt, async (req, res) => {
    try {
      const { getCompanyById } = await import('../db');
      const { id } = req.params;
      console.log(`[DEBUG] Fetching company with id: ${id}`);
      const company = await getCompanyById(parseInt(id));
      console.log(`[DEBUG] Company result:`, company);
      if (!company) {
        console.log(`[DEBUG] Company not found for id: ${id}`);
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json(company);
    } catch (error: any) {
      console.error('Failed to fetch company:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch company' });
    }
  });
  
  app.post('/api/companies', authenticateJwt, async (req, res) => {
    try {
      const { createCompany } = await import('../db');
      const { name, cnpj, email, phone, address, city, state, zipCode, maxLicenses, status } = req.body;
      
      // Validate required fields
      if (!name || !cnpj) {
        return res.status(400).json({ error: 'Nome e CNPJ sao obrigatorios' });
      }
      
      await createCompany({ name, cnpj, email, phone, address, city, state, zipCode, maxLicenses: maxLicenses || null, status });
      // Buscar a empresa recém-criada para obter o ID
      const { getCompanies } = await import('../db');
      const allCompanies = await getCompanies();
      const newCompany = allCompanies.find((c: any) => c.cnpj === cnpj) || allCompanies[allCompanies.length - 1];
      // Criar departamentos padrão automaticamente para a nova empresa
      try {
        const { createDefaultDepartments } = await import('../db');
        if (newCompany && newCompany.id) {
          await createDefaultDepartments(newCompany.id);
        }
      } catch (seedError) {
        console.warn('Could not seed default departments for new company:', seedError);
      }
      res.json(newCompany);
    } catch (error: any) {
      console.error('Failed to create company:', error);
      const errorMessage = error?.message || 'Falha ao criar empresa';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect');
      const statusCode = isConnectionError ? 503 : 400;
      const message = isConnectionError ? 'Banco de dados indisponivel. Tente novamente em alguns momentos.' : errorMessage;
      res.status(statusCode).json({ error: message });
    }
  });
  
  app.put('/api/companies/:id', authenticateJwt, async (req, res) => {
    try {
      const { updateCompany } = await import('../db');
      const { id } = req.params;
      const { name, cnpj, email, phone, address, city, state, zipCode, maxLicenses, status } = req.body;
      
      // Validate required fields
      if (!name || !cnpj) {
        return res.status(400).json({ error: 'Nome e CNPJ sao obrigatorios' });
      }
      
      const company = await updateCompany(parseInt(id), { name, cnpj, email, phone, address, city, state, zipCode, maxUsers: maxLicenses, status });
      res.json(company);
    } catch (error: any) {
      console.error('Failed to update company:', error);
      const errorMessage = error?.message || 'Falha ao atualizar empresa';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect');
      const statusCode = isConnectionError ? 503 : 400;
      const message = isConnectionError ? 'Banco de dados indisponivel. Tente novamente em alguns momentos.' : errorMessage;
      res.status(statusCode).json({ error: message });
    }
  });
  
  app.delete('/api/companies/:id', authenticateJwt, async (req, res) => {
    try {
      const { deleteCompany } = await import('../db');
      const { id } = req.params;
      await deleteCompany(parseInt(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete company:', error);
      const errorMessage = error?.message || 'Falha ao deletar empresa';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect');
      const statusCode = isConnectionError ? 503 : 400;
      const message = isConnectionError ? 'Banco de dados indisponivel. Tente novamente em alguns momentos.' : errorMessage;
      res.status(statusCode).json({ error: message });
    }
  });
  
  // REST API routes for departments (protegidas com JWT)
  app.get('/api/departments', authenticateJwt, async (req, res) => {
    try {
      const { retryWithBackoff } = await import('../retry');
      const { getDepartments } = await import('../db');
      const result = await retryWithBackoff(() => getDepartments(), {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });
      // retryWithBackoff retorna { success, data, attempts, totalTimeMs }
      const departments = result.data ?? [];
      res.json(Array.isArray(departments) ? departments : []);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      const statusCode = error.message?.includes('Connection lost') ? 503 : 500;
      res.status(statusCode).json({ error: 'Failed to fetch departments' });
    }
  });
  
  app.get('/api/departments/company/:companyId', authenticateJwt, async (req, res) => {
    try {
      const { retryWithBackoff } = await import('../retry');
      const { getDepartmentsByCompanyId } = await import('../db');
      const { companyId } = req.params;
      const result = await retryWithBackoff(
        () => getDepartmentsByCompanyId(parseInt(companyId)),
        {
          maxAttempts: 3,
          initialDelayMs: 100,
          backoffMultiplier: 2,
        }
      );
      // retryWithBackoff retorna { success, data, attempts, totalTimeMs }
      // Extrair o array de departamentos do campo data
      const departments = result.data ?? [];
      res.json(Array.isArray(departments) ? departments : []);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      const statusCode = error.message?.includes('Connection lost') ? 503 : 500;
      res.status(statusCode).json({ error: 'Failed to fetch departments' });
    }
  });
  
  app.post('/api/departments', authenticateJwt, async (req, res) => {
    try {
      const { createDepartment } = await import('../db');
      const { companyId, name, description, manager } = req.body;
      
      if (!companyId || !name) {
        return res.status(400).json({ error: 'companyId e name sao obrigatorios' });
      }
      
      const department = await createDepartment({ companyId, name, description, manager });
      res.json(department);
    } catch (error: any) {
      console.error('Failed to create department:', error);
      const statusCode = error.message && error.message.includes('Connection') ? 503 : 400;
      const errorMessage = error.message && error.message.includes('Connection') 
        ? 'Erro de conexao com banco de dados. Tente novamente.' 
        : error.message || 'Falha ao criar departamento';
      res.status(statusCode).json({ error: errorMessage });
    }
  });
  
  app.post('/api/departments/company/:companyId/default', async (req, res) => {
    try {
      const { createDefaultDepartments } = await import('../db');
      const { companyId } = req.params;
      const departments = await createDefaultDepartments(parseInt(companyId));
      res.json({ success: true, departments });
    } catch (error: any) {
      console.error('Failed to create default departments:', error);
      res.status(400).json({ error: error.message || 'Failed to create default departments' });
    }
  });
  
  app.put('/api/departments/:id', authenticateJwt, async (req, res) => {
    try {
      const { updateDepartment } = await import('../db');
      const { id } = req.params;
      const { name, description, manager, responsibleUserId } = req.body;
      await updateDepartment(parseInt(id), { name, description, manager, responsibleUserId: responsibleUserId ? parseInt(responsibleUserId) : null });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to update department:', error);
      res.status(400).json({ error: error.message || 'Failed to update department' });
    }
  });
  
  app.delete('/api/departments/:id', authenticateJwt, async (req, res) => {
    try {
      const { deleteDepartment } = await import('../db');
      const { id } = req.params;
      await deleteDepartment(parseInt(id));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      res.status(400).json({ error: error.message || 'Failed to delete department' });
    }
  });

  // Endpoint para criar departamentos padrão para TODAS as empresas sem departamentos
  app.post('/api/departments/seed', async (req, res) => {
    try {
      const { seedAllCompaniesDepartments } = await import('../db');
      const result = await seedAllCompaniesDepartments();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Failed to seed departments:', error);
      res.status(500).json({ error: error.message || 'Failed to seed departments' });
    }
  });

  // Endpoint para sincronizar departamentos: remove duplicatas e cria os 19 padrões faltantes em TODAS as empresas
  app.post('/api/departments/sync', async (req, res) => {
    try {
      const { syncAllCompaniesDepartments } = await import('../db');
      const result = await syncAllCompaniesDepartments();
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error('Failed to sync departments:', error);
      res.status(500).json({ error: error.message || 'Failed to sync departments' });
    }
  });

  // Endpoint para sincronizar departamentos de uma empresa específica
  app.post('/api/departments/sync/:companyId', async (req, res) => {
    try {
      const { syncDepartmentsForCompany } = await import('../db');
      const companyId = parseInt(req.params.companyId);
      if (isNaN(companyId)) {
        return res.status(400).json({ error: 'companyId inválido' });
      }
      const result = await syncDepartmentsForCompany(companyId);
      res.json({ success: true, companyId, ...result });
    } catch (error: any) {
      console.error('Failed to sync departments for company:', error);
      res.status(500).json({ error: error.message || 'Failed to sync departments' });
    }
  });

  // Hostinger API Integration Endpoints
  app.get('/api/hostinger/vms', authenticateJwt, async (req, res) => {
    try {
      const { getVirtualMachines } = await import('../hostinger-service');
      const vms = await getVirtualMachines();
      res.json(vms);
    } catch (error: any) {
      console.error('Failed to fetch virtual machines:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch virtual machines' });
    }
  });

  app.get('/api/hostinger/vms/:id', authenticateJwt, async (req, res) => {
    try {
      const { getVirtualMachine } = await import('../hostinger-service');
      const { id } = req.params;
      const vm = await getVirtualMachine(id);
      if (!vm) {
        return res.status(404).json({ error: 'Virtual machine not found' });
      }
      res.json(vm);
    } catch (error: any) {
      console.error('Failed to fetch virtual machine:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch virtual machine' });
    }
  });

  app.get('/api/hostinger/domains', authenticateJwt, async (req, res) => {
    try {
      const { getDomains } = await import('../hostinger-service');
      const domains = await getDomains();
      res.json(domains);
    } catch (error: any) {
      console.error('Failed to fetch domains:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch domains' });
    }
  });

  app.get('/api/hostinger/metrics/:vmId', authenticateJwt, async (req, res) => {
    try {
      const { getResourceMetrics } = await import('../hostinger-service');
      const { vmId } = req.params;
      const metrics = await getResourceMetrics(vmId);
      if (!metrics) {
        return res.status(404).json({ error: 'Metrics not found' });
      }
      res.json(metrics);
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch metrics' });
    }
  });

  app.get('/api/hostinger/health', authenticateJwt, async (req, res) => {
    try {
      const { checkAPIConnectivity } = await import('../hostinger-service');
      const isConnected = await checkAPIConnectivity();
      res.json({ connected: isConnected });
    } catch (error: any) {
      console.error('Failed to check Hostinger API health:', error);
      res.status(500).json({ error: error.message || 'Failed to check API health' });
    }
  });

  
  // ============= Ticket Comments =============
  app.post('/api/tickets/:ticketId/comments', authenticateJwt, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { userId, comment } = req.body;
      if (!comment || !userId) {
        return res.status(400).json({ error: 'Comment and userId are required' });
      }
      const { createTicketComment } = await import('../db-new-tables');
      const result = await createTicketComment(parseInt(ticketId), userId, comment);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/tickets/:ticketId/comments', authenticateJwt, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { getTicketComments } = await import('../db-new-tables');
      const comments = await getTicketComments(parseInt(ticketId));
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= FAQs =============
  app.get('/api/faqs', async (req, res) => {
    try {
      const { category } = req.query;
      const { getAllFAQs, getFAQsByCategory } = await import('../db-new-tables');
      const faqs = category ? await getFAQsByCategory(category as string) : await getAllFAQs();
      res.json(faqs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/faqs/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search term is required' });
      }
      const { searchFAQs } = await import('../db-new-tables');
      const results = await searchFAQs(q as string);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/faqs/:faqId/view', async (req, res) => {
    try {
      const { faqId } = req.params;
      const { incrementFAQViews } = await import('../db-new-tables');
      await incrementFAQViews(parseInt(faqId));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= User Preferences =============
  app.get('/api/users/:userId/preferences', authenticateJwt, async (req, res) => {
    try {
      const { userId } = req.params;
      const { getUserPreferences } = await import('../db-new-tables');
      const prefs = await getUserPreferences(parseInt(userId));
      res.json(prefs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/users/:userId/preferences', authenticateJwt, async (req, res) => {
    try {
      const { userId } = req.params;
      const { updateUserPreferences } = await import('../db-new-tables');
      await updateUserPreferences(parseInt(userId), req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============= Dashboard Stats =============
  app.get('/api/dashboard/stats', authenticateJwt, async (req, res) => {
    try {
      const { companyId } = req.query;
      const { getDashboardStats } = await import('../db-new-tables');
      const stats = await getDashboardStats(companyId ? parseInt(companyId as string) : undefined);
      res.json(stats);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      const errorMessage = error?.message || '';
      const causeMessage = error?.cause?.message || '';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect') || 
                                causeMessage.includes('ETIMEDOUT') || causeMessage.includes('connect');
      if (isConnectionError) {
        res.status(503).json({ 
          error: 'Database connection failed. Please try again later.',
          details: 'Unable to connect to database server'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to fetch dashboard stats',
          details: errorMessage || 'Unknown error'
        });
      }
    }
  });

  // ============= Authentication with Passport.js =============
  // Importar rotas de autenticação
  const authRoutes = await import('../passport-routes');
  app.use('/api/auth', authRoutes.default);

  // ============= Support Routes (RBAC + Multi-Tenant) =============
  const { registerSupportRoutes } = await import('../support-routes');
  registerSupportRoutes(app);

  // ============= Password Recovery =============
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }
      
      const { getUserByEmail, createPasswordResetToken } = await import('../db');
      
      // Find user by email
      const user = await getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists (security best practice)
        return res.json({ success: true, message: 'Se o email existir, um link de reset será enviado' });
      }
      
      // Create reset token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await createPasswordResetToken(user.id, token, expiresAt);
      
      // TODO: Send email with reset link
      // For now, return token in response (only for development)
      const resetLink = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      console.log(`[Password Reset] Reset link for ${email}: ${resetLink}`);
      
      res.json({ 
        success: true, 
        message: 'Link de reset enviado para seu email',
        // Remove this in production - only for testing
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
      });
    } catch (error: any) {
      console.error('[POST /api/auth/forgot-password] Error:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Token, senha e confirmação são obrigatórios' });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
      }
      
      // Validate password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Senha deve ter pelo menos 8 caracteres' });
      }
      
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
        return res.status(400).json({ error: 'Senha deve conter letras maiúsculas, minúsculas e números' });
      }
      
      const { updateUserPassword } = await import('../db');
      const { getPool } = await import('../mysql-pool');
      const bcrypt = await import('bcryptjs');
      
      // Validar token de reset no banco de dados
      const pool = getPool();
      const [tokenRows] = await pool.execute(
        'SELECT id, userId, expiresAt FROM password_reset_tokens WHERE token = ? AND usedAt IS NULL LIMIT 1',
        [token]
      ) as any;
      
      if (!tokenRows || tokenRows.length === 0) {
        return res.status(400).json({ error: 'Link de reset inválido ou já utilizado' });
      }
      
      const resetToken = tokenRows[0];
      const now = new Date();
      const expiresAt = new Date(resetToken.expiresAt);
      
      if (now > expiresAt) {
        return res.status(400).json({ error: 'Link de reset expirado. Solicite um novo.' });
      }
      
      const hashedPassword = await bcrypt.default.hash(newPassword, 12);
      await updateUserPassword(resetToken.userId, hashedPassword);
      
      // Marcar token como usado
      await pool.execute(
        'UPDATE password_reset_tokens SET usedAt = NOW() WHERE id = ?',
        [resetToken.id]
      );
      
      res.json({ 
        success: true, 
        message: 'Senha alterada com sucesso' 
      });
    } catch (error: any) {
      console.error('[POST /api/auth/reset-password] Error:', error);
      const message = error.message === 'Invalid or expired token' 
        ? 'Link de reset inválido ou expirado' 
        : 'Erro ao resetar senha';
      res.status(400).json({ error: message });
    }
  });

  // ============= Token Exchange (OAuth session → JWT Bearer) =============
  // Permite que usuários autenticados via OAuth obtenham um JWT Bearer para
  // usar nas rotas REST de treinamento (que usam header Authorization).
  app.get('/api/auth/token', async (req, res) => {
    try {
      // Tentar autenticar via sessão OAuth (cookie)
      const { sdk: sdkInstance } = await import('./sdk');
      let user: any = null;
      try {
        user = await sdkInstance.authenticateRequest(req);
      } catch {
        // Sessão OAuth inválida ou ausente
      }

      // Se não autenticado via OAuth, tentar via passport JWT (header Authorization)
      if (!user && req.headers.authorization?.startsWith('Bearer ')) {
        return res.json({ token: req.headers.authorization.slice(7) });
      }

      if (!user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      // Gerar JWT Bearer compatível com as rotas REST
      const { generateToken } = await import('../auth');
      const authUser = {
        id: String(user.id),
        email: user.email || '',
        name: user.name || '',
        role: (user.role as 'user' | 'admin' | 'manager') || 'user',
        department: user.department || undefined,
      };
      const token = await generateToken(authUser);
      res.json({ token });
    } catch (error: any) {
      console.error('[GET /api/auth/token] Error:', error);
      res.status(500).json({ error: 'Erro ao gerar token' });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ============ TICKETS ENDPOINTS ============
  app.get('/api/tickets', authenticateJwt, async (req, res) => {
    try {
      const { getAllTickets } = await import('../db');
      const tickets = await getAllTickets();
      res.json(tickets);
    } catch (error: any) {
      console.error('Failed to fetch tickets:', error);
      const errorMessage = error?.message || '';
      const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect');
      if (isConnectionError) {
        res.status(503).json({ 
          error: 'Database connection failed. Please try again later.',
          details: 'Unable to connect to database server'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to fetch tickets',
          details: errorMessage || 'Unknown error'
        });
      }
    }
  });

  app.get('/api/tickets/:id', authenticateJwt, async (req, res) => {
    try {
      const { getTickets } = await import('../db');
      const allTickets = await getTickets();
      const ticket = allTickets?.find((t: any) => t.id === parseInt(req.params.id));
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
      } else {
        res.json(ticket);
      }
    } catch (error: any) {
      console.error('Failed to fetch ticket:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  app.post('/api/tickets', authenticateJwt, async (req, res) => {
    try {
      const { createTicket } = await import('../db');
      const { title, description, userId, department, priority } = req.body;
      const ticketId = `TK-${Date.now().toString(36).toUpperCase()}`;
      const ticket = await createTicket({
        ticketId,
        title,
        description,
        userId,
        department,
        priority: priority || 'media',
        status: 'pendente'
      });
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  // NOTA: Rotas GET/POST /api/tickets/:id/comments removidas daqui (duplicatas).
  // As rotas canônicas estão em /api/tickets/:ticketId/comments (linhas acima, com authenticateJwt).;

  // Upload user profile image
  app.post('/api/users/:id/upload-image', async (req, res) => {
    try {
      const { verifyToken } = await import('../auth');
      const { storagePut } = await import('../storage');
      const { updateUser } = await import('../db');
      const { id } = req.params;
      const { imageData, fileName } = req.body;

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token nao fornecido' });
      }

      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded || !decoded.user || !decoded.user.id) {
        return res.status(401).json({ error: 'Token invalido' });
      }

      // Admins podem fazer upload para qualquer usuário; usuários comuns só para si mesmos
      const isAdmin = decoded.user.role === 'admin' || decoded.user.role === 'manager';
      if (!isAdmin && parseInt(id) !== parseInt(decoded.user.id)) {
        return res.status(403).json({ error: 'Voce so pode fazer upload de sua propria imagem' });
      }

      if (!imageData) {
        return res.status(400).json({ error: 'Dados de imagem obrigatorios' });
      }

      if (!fileName) {
        return res.status(400).json({ error: 'Nome do arquivo obrigatorio' });
      }

       const extToMime: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
      };
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      const mimeType = extToMime[ext];
      if (!mimeType) {
        return res.status(400).json({ error: 'Tipo nao permitido. Use JPEG, PNG, WebP ou GIF' });
      }

      const maxSize = 5 * 1024 * 1024;
      if (imageData.length > maxSize) {
        return res.status(400).json({ error: 'Arquivo muito grande. Maximo 5MB' });
      }

      const fileKey = `profile-images/${id}/${Date.now()}-${fileName}`;
      console.log(`[Upload] Attempting to upload image for user ${id} to key: ${fileKey}`);
      
      const { url } = await storagePut(fileKey, Buffer.from(imageData, 'base64'), mimeType);
      console.log(`[Upload] Image uploaded successfully. URL: ${url.startsWith('data:') ? 'Data URL (Fallback)' : url}`);

      const result = await updateUser(parseInt(id), { profileImage: url });
      console.log(`[Upload] User profile updated with new image URL.`);

      res.json({ success: true, url, user: result });
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      res.status(400).json({ error: error.message || 'Falha ao fazer upload' });
    }
  });

  // ============================================================
  // BUSCA GLOBAL
  // ============================================================
  app.get('/api/search', async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }

      // Verificar autenticação (opcional - retorna resultados mesmo sem token)
      const authHeader = req.headers.authorization;
      let userId: number | null = null;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const decoded = await verifyToken(token) as any; // FIX: verifyToken é async
          userId = decoded?.user?.id ? parseInt(decoded.user.id) : null;
        } catch {}
      }
      // FIX: Usar pool compartilhado em vez de createConnection (evita vazamento de conexões)
      const { getPool } = await import('../mysql-pool');
      const conn = getPool();;
      const like = `%${q}%`;
      const results: any[] = [];

      // Buscar em Chamados (apenas do próprio usuário ou todos se admin)
      try {
        const ticketQuery = userId
          ? 'SELECT id, ticketId, title, description, status, priority FROM tickets WHERE (title LIKE ? OR description LIKE ? OR ticketId LIKE ?) AND userId = ? LIMIT 5'
          : 'SELECT id, ticketId, title, description, status, priority FROM tickets WHERE (title LIKE ? OR description LIKE ? OR ticketId LIKE ?) LIMIT 5';
        const ticketParams = userId ? [like, like, like, userId] : [like, like, like];
        const [tickets] = await conn.execute(ticketQuery, ticketParams) as any;
        for (const t of tickets) {
          results.push({
            id: `ticket-${t.id}`,
            type: 'module',
            category: 'Chamados',
            icon: '\ud83c\udfab',
            title: `#${t.ticketId} - ${t.title}`,
            description: `${t.status} · ${t.priority}`,
            url: `/tickets/${t.id}`,
            tags: [],
          });
        }
      } catch {}

      // Buscar em Documentos/Políticas
      try {
        const [docs] = await conn.execute(
          'SELECT id, title, description, category FROM documents WHERE title LIKE ? OR description LIKE ? LIMIT 5',
          [like, like]
        ) as any;
        for (const d of docs) {
          results.push({
            id: `doc-${d.id}`,
            type: 'document',
            category: d.category || 'Documentos',
            icon: '\ud83d\udcc4',
            title: d.title,
            description: d.description,
            url: `/terms`,
            tags: d.category ? [d.category] : [],
          });
        }
      } catch {}

      // Buscar em Treinamentos
      try {
        const [trainings] = await conn.execute(
          'SELECT id, title, description, category FROM trainings WHERE title LIKE ? OR description LIKE ? LIMIT 5',
          [like, like]
        ) as any;
        for (const t of trainings) {
          results.push({
            id: `training-${t.id}`,
            type: 'module',
            category: 'Treinamentos',
            icon: '\ud83c\udf93',
            title: t.title,
            description: t.description,
            url: `/training`,
            tags: ['Treinamentos'],
          });
        }
      } catch {}

      // Buscar em Módulos / Links do Portal
      try {
        const [modules] = await conn.execute(
          `SELECT id, key_name, label, description, category, icon
           FROM portal_modules
           WHERE is_active = 1
             AND (label LIKE ? OR description LIKE ? OR category LIKE ? OR key_name LIKE ?)
           ORDER BY sort_order ASC
           LIMIT 8`,
          [like, like, like, like]
        ) as any;
        // Mapa de ícones por key_name para exibição amigável
        const iconMap: Record<string, string> = {
          dashboard: '\ud83c\udfe0', tickets: '\ud83c\udfab', support: '\ud83d\udee0\ufe0f',
          requests: '\ud83d\udccb', approvals: '\u2705', estacionamento: '\ud83d\ude97',
          rh_estacionamento: '\ud83d\udc64', equipamentos: '\ud83d\udcbb', training: '\ud83c\udf93',
          treinamentos: '\ud83c\udf93', documents: '\ud83d\udcc4', terms: '\ud83d\udcc4',
          reports: '\ud83d\udcca', settings: '\u2699\ufe0f', management: '\ud83d\udee1\ufe0f',
          jlx: '\ud83d\udcf0', vigix: '\ud83d\udcf9', teams: '\ud83d\udcac',
          helpdesk: '\ud83c\udfe5', permissoes: '\ud83d\udd11', rh: '\ud83d\udc65',
        };
        for (const m of modules) {
          const emoji = iconMap[m.key_name] || m.icon || '\ud83d\udd17';
          results.push({
            id: `module-${m.id}`,
            type: 'module',
            category: m.category || 'Portal',
            icon: emoji,
            title: m.label,
            description: m.description || `Acessar ${m.label}`,
            url: `/${m.key_name}`,
            tags: m.category ? [m.category] : [],
          });
        }
      } catch (modErr) {
        console.error('[Search] Erro ao buscar módulos:', modErr);
      }

      // Pool não precisa de conn.end() — conexões são reutilizadas
      res.json({ results, total: results.length, query: q });
    } catch (error: any) {
      console.error('Search error:', error);
      res.json({ results: [] });
    }
  });

  // Verificação de acesso ao painel administrativo com validação real no banco
  app.post('/api/auth/verify-admin-access', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    try {
      const { getUserByEmail } = await import('../db.js');
      const { generateToken } = await import('../auth.js');
      const bcryptjs = await import('bcryptjs');

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar se o usuário é administrador
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este painel.' });
      }

      // Verificar senha com bcrypt
      const passwordField = user.passwordHash;
      if (!passwordField) {
        return res.status(401).json({ error: 'Usuário sem senha configurada' });
      }
      const isValid = await bcryptjs.default.compare(password, passwordField);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar novo token JWT para a sessão admin
      const token = await generateToken({
        id: String(user.id),
        email: user.email || '',
        name: user.name || '',
        role: user.role as 'admin' | 'user' | 'manager',
        department: user.department || undefined,
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage || null,
          department: user.department || null,
          company: null,
        }
      });
    } catch (error: any) {
      console.error('[POST /api/auth/verify-admin-access] Error:', error);
      res.status(500).json({ error: 'Erro interno ao verificar credenciais' });
    }
  });

  // ============================================================
  // Treinamentos Corporativos (DEVE VIR ANTES dos routers com authenticateJwt global)
  // O publicRouter usa optionalJwt (não bloqueia sem token)
  // ============================================================
  const { registerTrainingRoutes } = await import('../training-routes.js');
  // optionalJwt: popula req.user quando há token válido, mas não bloqueia sem token
  // authenticateJwt: passado para rotas que exigem autenticação (quiz, comentar, admin)
  registerTrainingRoutes(app, optionalJwt, authenticateJwt);

  // ============================================================
  // ITAM + Gerenciador de Documentos + RBAC
  // ============================================================
  const { default: itamRouter } = await import('../itam-routes.js');
  // Usar o mesmo middleware JWT já configurado no servidor
  app.use('/api', authenticateJwt, itamRouter);

  // ============================================================
  // Documentos e Termos de Responsabilidade
  // ============================================================
  const { default: documentRouter } = await import('../document-routes.js');
  app.use('/api', authenticateJwt, documentRouter);
  // ============================================================
  // Search – Busca unificada (documentos + módulos)
  // ============================================================
  const { default: searchRouter } = await import('../search-routes.js');
  app.use('/api', authenticateJwt, searchRouter);
  // ============================================================
  // Management - Painel Administrativo
  // ============================================================
  const { default: managementRouter } = await import('../management-routes.js');
  app.use('/api', authenticateJwt, managementRouter);

  // ============================================================
  // JLX – Classificados Internos
  // ============================================================
  const { registerJlxRoutes } = await import('../jlx-routes.js');
  registerJlxRoutes(app);

  // ============================================================
  // Estacionamento RH - Módulo de Tickets
  // ============================================================
  const { default: estacionamentoRouter } = await import('../estacionamento-routes.js');
  app.use('/api', authenticateJwt, estacionamentoRouter);
  // ============================================================
  // Gestão de Usuários e Permissões
  // ============================================================
  const { default: permissionsRouter } = await import('../permissions-routes.js');
  app.use('/api', authenticateJwt, permissionsRouter);

  // Servir arquivos de upload
  const { default: expressStatic } = await import('express');
  app.use('/uploads', expressStatic.static('uploads'));

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Iniciar cron job de renovação automática de subscriptions Teams (a cada 48h)
    startSubscriptionRenewalCron();
  });
}

startServer().catch(console.error);
