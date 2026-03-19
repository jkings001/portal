/**
 * teams.ts — Integração Microsoft Teams → Portal de Atendimento
 *
 * Responsabilidades:
 * - Autenticação server-to-server com Microsoft Graph (client credentials)
 * - Validação de webhooks (challenge + clientState)
 * - Parser inteligente de mensagens (Solicitação / Requisição / Ocorrência / urgente / prioridade alta)
 * - Idempotência por messageId (impede criação de chamados duplicados)
 * - Criação de chamados na tabela `requests` do portal via mysql-pool
 * - Gerenciamento de subscriptions do Microsoft Graph
 * - Dashboard de status da integração
 *
 * Endpoints HTTP públicos registrados em server/_core/index.ts:
 *   GET  /api/teams/webhook   → validação do challenge do Graph
 *   POST /api/teams/webhook   → recebimento de change notifications
 *   POST /api/teams/lifecycle → lifecycle notifications
 *
 * Rotas tRPC (em server/routers.ts):
 *   teams.health              → status das credenciais
 *   teams.dashboard           → painel operacional
 *   teams.createSubscription  → criar subscription no Graph
 *   teams.renewSubscription   → renovar subscription existente
 *   teams.processMessage      → processar mensagem manualmente (admin)
 *   teams.validateWebhook     → validar payload de webhook (admin)
 */

import { TRPCError } from "@trpc/server";
import axios from "axios";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { getPoolConn } from "./mysql-pool";
import { ENV } from "./_core/env";

// ─── Schemas de validação ─────────────────────────────────────────────────────

const teamsWebhookPayloadSchema = z.object({
  value: z
    .array(
      z
        .object({
          subscriptionId: z.string().optional(),
          changeType: z.string().optional(),
          clientState: z.string().nullable().optional(),
          resource: z.string().optional(),
          resourceData: z
            .object({
              id: z.string().optional(),
              chatId: z.string().optional(),
            })
            .passthrough()
            .optional(),
          encryptedContent: z.unknown().optional(),
          tenantId: z.string().optional(),
        })
        .passthrough(),
    )
    .default([]),
  validationToken: z.string().optional(),
}).passthrough();

const processMessageInputSchema = z.object({
  messageId: z.string().min(1),
  messageText: z.string().default(""),
  senderName: z.string().default("Usuário Teams"),
  senderEmail: z.string().email().or(z.string().min(1)),
  createdAt: z.string().default(() => new Date().toISOString()),
  contextType: z.enum(["chat", "channel"]).default("chat"),
  teamId: z.string().optional(),
  channelId: z.string().optional(),
  chatId: z.string().optional(),
  rawPayload: z.unknown().optional(),
});

const graphMessageSchema = z
  .object({
    id: z.string(),
    createdDateTime: z.string().optional(),
    body: z.object({ content: z.string().optional() }).optional(),
    from: z
      .object({
        user: z
          .object({
            displayName: z.string().optional(),
            id: z.string().optional(),
          })
          .optional(),
        application: z
          .object({ displayName: z.string().optional() })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

const createSubscriptionInputSchema = z.object({
  resource: z.string().min(1),
  changeType: z.string().default("created"),
  expirationDateTime: z.string().min(1),
  notificationUrl: z.string().url().optional(),
  lifecycleNotificationUrl: z.string().url().optional(),
  includeResourceData: z.boolean().optional().default(false),
  encryptionCertificate: z.string().optional(),
  encryptionCertificateId: z.string().optional(),
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TicketPriority = "critica" | "media";
export type TicketCategory = "Solicitação" | "Requisição" | "Ocorrência" | "Geral";
type GraphNotification = z.infer<typeof teamsWebhookPayloadSchema>["value"][number];

// ─── Descriptografia de notificações com includeResourceData ────────────────

/**
 * Lê a chave privada RSA do arquivo ou da variável de ambiente TEAMS_ENCRYPTION_PRIVATE_KEY.
 * Prioridade: variável de ambiente > arquivo em disco.
 */
export function getEncryptionPrivateKey(): string | null {
  // 1. Variável de ambiente (base64 da chave PEM)
  const envKey = process.env.TEAMS_ENCRYPTION_PRIVATE_KEY;
  if (envKey) {
    try {
      return Buffer.from(envKey, 'base64').toString('utf-8');
    } catch {
      return envKey; // Já é PEM puro
    }
  }
  // 2. Arquivo em disco (desenvolvimento local)
  const filePath = path.join(__dirname, 'teams-private.pem');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return null;
}

/**
 * Lê o certificado público X.509 do arquivo ou da variável TEAMS_ENCRYPTION_CERTIFICATE.
 * Retorna o certificado em formato PEM (base64 com headers).
 */
export function getEncryptionCertificate(): string | null {
  // 1. Variável de ambiente (base64 do certificado PEM)
  const envCert = process.env.TEAMS_ENCRYPTION_CERTIFICATE;
  if (envCert) {
    try {
      const decoded = Buffer.from(envCert, 'base64').toString('utf-8');
      // Se decodificou para PEM, retornar o base64 original (Graph espera base64)
      if (decoded.includes('-----BEGIN CERTIFICATE-----')) return envCert;
      return envCert;
    } catch {
      return envCert;
    }
  }
  // 2. Arquivo em disco
  const filePath = path.join(__dirname, 'teams-cert.pem');
  if (fs.existsSync(filePath)) {
    const pem = fs.readFileSync(filePath, 'utf-8');
    return Buffer.from(pem).toString('base64');
  }
  return null;
}

/**
 * Retorna o ID do certificado (fingerprint SHA-1 sem colons, lowercase).
 * Usado como encryptionCertificateId na subscription.
 */
export function getEncryptionCertificateId(): string | null {
  // 1. Variável de ambiente
  const envId = process.env.TEAMS_ENCRYPTION_CERTIFICATE_ID;
  if (envId) return envId;
  // 2. Calcular a partir do arquivo em disco
  const filePath = path.join(__dirname, 'teams-cert.pem');
  if (fs.existsSync(filePath)) {
    try {
      const pem = fs.readFileSync(filePath, 'utf-8');
      const cert = new crypto.X509Certificate(pem);
      return cert.fingerprint.replace(/:/g, '').toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Descriptografa o conteúdo de uma notificação com includeResourceData=true.
 *
 * O Microsoft Graph usa criptografia híbrida:
 * 1. Gera uma chave simétrica AES-256-CBC aleatória
 * 2. Criptografa a chave AES com a chave pública RSA do app (OAEP + SHA-1)
 * 3. Criptografa o conteúdo da mensagem com a chave AES
 * 4. Envia: { data (base64), dataKey (base64), dataSignature (base64), encryptionCertificateId }
 *
 * Referência: https://learn.microsoft.com/en-us/graph/change-notifications-with-resource-data
 */
export function decryptEncryptedContent(encryptedContent: {
  data: string;
  dataKey: string;
  dataSignature?: string;
  encryptionCertificateId?: string;
}): any {
  const privateKeyPem = getEncryptionPrivateKey();
  if (!privateKeyPem) {
    throw new Error('Chave privada de criptografia não configurada. Defina TEAMS_ENCRYPTION_PRIVATE_KEY no Railway.');
  }

  try {
    // 1. Descriptografar a chave simétrica AES com a chave privada RSA
    const encryptedKeyBuffer = Buffer.from(encryptedContent.dataKey, 'base64');
    const symmetricKey = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha1',
      },
      encryptedKeyBuffer,
    );

    // 2. Descriptografar o conteúdo com a chave AES-256-CBC
    // O Microsoft Graph usa os primeiros 16 bytes da chave como IV
    const iv = symmetricKey.slice(0, 16);
    const aesKey = symmetricKey.slice(0, 32); // AES-256 = 32 bytes
    const encryptedDataBuffer = Buffer.from(encryptedContent.data, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedDataBuffer),
      decipher.final(),
    ]);

    const decryptedText = decrypted.toString('utf-8');
    console.log('[Teams] decryptEncryptedContent: conteúdo descriptografado com sucesso');

    // 3. Parsear o JSON do conteúdo descriptografado
    try {
      return JSON.parse(decryptedText);
    } catch {
      return { rawText: decryptedText };
    }
  } catch (err: any) {
    console.error('[Teams] decryptEncryptedContent: falha na descriptografia:', err?.message);
    throw new Error(`Falha na descriptografia do conteúdo Teams: ${err?.message}`);
  }
}

/**
 * Extrai dados da mensagem de uma notificação com encryptedContent.
 * Retorna os mesmos campos que resolveChatMessageFromGraph.
 */
export function extractMessageFromEncryptedContent(
  notification: GraphNotification,
  decryptedData: any,
): {
  messageId: string;
  messageText: string;
  senderName: string;
  senderEmail: string;
  createdAt: string;
  contextType: 'chat' | 'channel';
  chatId?: string;
  rawPayload: any;
} {
  const resource = notification.resource ?? '';
  const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
  const chatId = matches?.[1] ?? (notification.resourceData as any)?.chatId ?? undefined;
  const messageId = decryptedData?.id
    ?? matches?.[2]
    ?? notification.resourceData?.id
    ?? `teams-${Date.now()}`;

  const rawBody = decryptedData?.body?.content ?? '';
  const messageText = sanitizeHtmlText(rawBody) || '[Mensagem sem conteúdo de texto]';

  const senderUser = decryptedData?.from?.user;
  const senderApp = decryptedData?.from?.application;
  const senderName = senderUser?.displayName ?? senderApp?.displayName ?? 'Usuário Teams';
  const senderEmail = senderUser?.userPrincipalName ?? senderUser?.mail ?? 'desconhecido@teams.local';
  const createdAt = decryptedData?.createdDateTime ?? new Date().toISOString();

  return {
    messageId,
    messageText,
    senderName,
    senderEmail,
    createdAt,
    contextType: 'chat',
    chatId,
    rawPayload: { notification, decryptedData, source: 'encryptedContent' },
  };
}

// ─── Helpers de ambiente ──────────────────────────────────────────────────────

export function getTeamsEnv() {
  // Lê diretamente do process.env em tempo de execução para garantir
  // que as variáveis injetadas pelo Railway sejam sempre refletidas,
  // independente de quando o módulo foi carregado.
  return {
    TEAMS_TENANT_ID:            process.env.TEAMS_TENANT_ID            || ENV.teamsTenantId            || undefined,
    TEAMS_CLIENT_ID:            process.env.TEAMS_CLIENT_ID            || ENV.teamsClientId            || undefined,
    TEAMS_CLIENT_SECRET:        process.env.TEAMS_CLIENT_SECRET        || ENV.teamsClientSecret        || undefined,
    TEAMS_WEBHOOK_CLIENT_STATE: process.env.TEAMS_WEBHOOK_CLIENT_STATE || ENV.teamsWebhookClientState || 'teams-portal-online',
    TEAMS_NOTIFICATION_URL:     process.env.TEAMS_NOTIFICATION_URL     || ENV.teamsNotificationUrl     || undefined,
    TEAMS_LIFECYCLE_URL:        process.env.TEAMS_LIFECYCLE_URL        || ENV.teamsLifecycleUrl        || undefined,
    TEAMS_DEFAULT_RESOURCE:     process.env.TEAMS_DEFAULT_RESOURCE     || ENV.teamsDefaultResource     || '/chats/getAllMessages',
  };
}

function assertTeamsConfigured() {
  const env = getTeamsEnv();
  if (!env.TEAMS_TENANT_ID || !env.TEAMS_CLIENT_ID || !env.TEAMS_CLIENT_SECRET) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Credenciais da integração Teams não configuradas. Defina TEAMS_TENANT_ID, TEAMS_CLIENT_ID e TEAMS_CLIENT_SECRET.",
    });
  }
  return env;
}

function defaultChatResource() {
  const env = getTeamsEnv();
  return env.TEAMS_DEFAULT_RESOURCE || "/chats/getAllMessages";
}

// ─── Retry com backoff ────────────────────────────────────────────────────────

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  initialDelay = 300,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === retries - 1) break;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// ─── Autenticação Microsoft Graph ─────────────────────────────────────────────

export async function getGraphAccessToken(): Promise<string> {
  const env = assertTeamsConfigured();
  const params = new URLSearchParams({
    client_id: env.TEAMS_CLIENT_ID!,
    client_secret: env.TEAMS_CLIENT_SECRET!,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const tokenUrl = `https://login.microsoftonline.com/${env.TEAMS_TENANT_ID}/oauth2/v2.0/token`;
  const response = await retryWithBackoff(() =>
    axios.post(tokenUrl, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  );

  return response.data.access_token as string;
}

// ─── Parser de mensagens ──────────────────────────────────────────────────────

export function normalizeMessageText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseTeamsMessage(messageText: string): {
  category: TicketCategory;
  priority: TicketPriority;
  matchedKeywords: string[];
} {
  const normalized = normalizeMessageText(messageText);
  const matchedKeywords: string[] = [];

  let category: TicketCategory = "Geral";
  if (normalized.includes("solicitacao")) {
    category = "Solicitação";
    matchedKeywords.push("Solicitação");
  } else if (normalized.includes("requisicao")) {
    category = "Requisição";
    matchedKeywords.push("Requisição");
  } else if (normalized.includes("ocorrencia")) {
    category = "Ocorrência";
    matchedKeywords.push("Ocorrência");
  }

  let priority: TicketPriority = "media";
  if (normalized.includes("urgente") || normalized.includes("prioridade alta")) {
    priority = "critica";
    if (normalized.includes("urgente")) matchedKeywords.push("urgente");
    if (normalized.includes("prioridade alta")) matchedKeywords.push("prioridade alta");
  }

  return { category, priority, matchedKeywords };
}

function summarizeMessage(text: string, maxLength = 80): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned || "Mensagem sem conteúdo";
  return `${cleaned.slice(0, maxLength - 3)}...`;
}

function sanitizeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTicketDescription(
  input: z.infer<typeof processMessageInputSchema>,
  parsed: ReturnType<typeof parseTeamsMessage>,
  matchedUser: boolean,
): string {
  const contextId = input.chatId ?? input.channelId ?? "não informado";
  const registrationStatus = matchedUser
    ? "Usuário localizado no cadastro"
    : "Usuário não localizado; chamado avulso criado";

  return [
    "Origem: Microsoft Teams",
    `Usuário: ${input.senderName}`,
    `E-mail: ${input.senderEmail}`,
    `Status do cadastro: ${registrationStatus}`,
    `Data/Hora da mensagem: ${input.createdAt}`,
    `Tipo de contexto: ${input.contextType}`,
    `Team ID: ${input.teamId ?? "não informado"}`,
    `Channel/Chat ID: ${contextId}`,
    `Message ID: ${input.messageId}`,
    `Categoria detectada: ${parsed.category}`,
    `Prioridade detectada: ${parsed.priority}`,
    `Palavras-chave: ${parsed.matchedKeywords.join(", ") || "nenhuma"}`,
    "",
    "Mensagem original:",
    input.messageText || "Mensagem vazia",
  ].join("\n");
}

// ─── Funções de banco de dados (mysql-pool) ───────────────────────────────────

async function getUserByEmail(email: string) {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.execute(
      "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
      [email],
    ) as any;
    return (rows as any[])[0] ?? null;
  } finally {
    conn.release();
  }
}

async function getTeamsMessageTicketMap(messageId: string) {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.execute(
      "SELECT * FROM teams_message_ticket_map WHERE messageId = ? LIMIT 1",
      [messageId],
    ) as any;
    return (rows as any[])[0] ?? null;
  } finally {
    conn.release();
  }
}

async function findRequestByExternalMessageId(messageId: string) {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.execute(
      "SELECT * FROM requests WHERE externalMessageId = ? LIMIT 1",
      [messageId],
    ) as any;
    return (rows as any[])[0] ?? null;
  } finally {
    conn.release();
  }
}

async function recordTeamsEvent(event: {
  messageId: string;
  eventType: string;
  userEmail?: string;
  payload?: unknown;
  processingStatus: "received" | "processed" | "ignored" | "failed";
}) {
  const conn = await getPoolConn();
  try {
    await conn.execute(
      `INSERT INTO teams_integration_events (messageId, eventType, userEmail, payload, processingStatus)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         eventType = VALUES(eventType),
         userEmail = VALUES(userEmail),
         payload = VALUES(payload),
         processingStatus = VALUES(processingStatus),
         updatedAt = NOW()`,
      [
        event.messageId,
        event.eventType,
        event.userEmail ?? null,
        event.payload ? JSON.stringify(event.payload) : null,
        event.processingStatus,
      ],
    );
  } finally {
    conn.release();
  }
}

async function markTeamsEventProcessed(
  messageId: string,
  status: "processed" | "ignored" | "failed",
  errorMessage?: string,
) {
  const conn = await getPoolConn();
  try {
    await conn.execute(
      `UPDATE teams_integration_events
       SET processingStatus = ?, errorMessage = ?, processedAt = NOW(), updatedAt = NOW()
       WHERE messageId = ?`,
      [status, errorMessage ?? null, messageId],
    );
  } finally {
    conn.release();
  }
}

async function createTeamsRequest(data: {
  requestId: string;
  title: string;
  description: string;
  userId: number | null;
  userName: string;
  userEmail: string;
  priority: string;
  category: string;
  externalMessageId: string;
  metadata: unknown;
}) {
  const conn = await getPoolConn();
  try {
    const slaHours: Record<string, number> = { critica: 4, alta: 8, media: 24, baixa: 72 };
    const slaMs = (slaHours[data.priority] || 24) * 3600 * 1000;
    const slaDeadline = new Date(Date.now() + slaMs).toISOString().slice(0, 19).replace("T", " ");

    const [result] = await conn.execute(
      `INSERT INTO requests
         (requestId, type, title, description, priority, category, userId, userName, userEmail,
          slaDeadline, status, externalMessageId, metadata)
       VALUES (?, 'ticket', ?, ?, ?, ?, ?, ?, ?, ?, 'aberto', ?, ?)`,
      [
        data.requestId,
        data.title,
        data.description,
        data.priority,
        data.category,
        data.userId,
        data.userName,
        data.userEmail,
        slaDeadline,
        data.externalMessageId,
        JSON.stringify(data.metadata),
      ],
    ) as any;

    const insertId = (result as any).insertId;

    await conn.execute(
      `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
       VALUES ('request', ?, 'criado', ?, ?, ?)`,
      [
        insertId,
        `Chamado criado automaticamente via Microsoft Teams por ${data.userName}`,
        data.userId,
        data.userName,
      ],
    );

    return { id: insertId, requestId: data.requestId };
  } finally {
    conn.release();
  }
}

async function createTeamsMessageTicketMap(entry: {
  messageId: string;
  requestId: number;
  requestCode: string;
  userId: number | null;
  category: string;
  priority: string;
}) {
  const conn = await getPoolConn();
  try {
    await conn.execute(
      `INSERT INTO teams_message_ticket_map (messageId, ticketId, userId, category, priority)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ticketId = VALUES(ticketId),
         userId = VALUES(userId),
         category = VALUES(category),
         priority = VALUES(priority),
         updatedAt = NOW()`,
      [
        entry.messageId,
        entry.requestId,
        entry.userId,
        entry.category,
        entry.priority,
      ],
    );
  } finally {
    conn.release();
  }
}

export async function upsertTeamsSubscription(subscription: {
  subscriptionId: string;
  resource: string;
  changeType: string;
  expirationDateTime: string;
  clientState: string;
  notificationUrl: string;
  lifecycleNotificationUrl?: string | null;
  status: "active" | "expired" | "error";
  metadata?: unknown;
}) {
  const conn = await getPoolConn();
  try {
    await conn.execute(
      `INSERT INTO teams_subscriptions
         (subscriptionId, resource, changeType, expirationDateTime, clientState,
          notificationUrl, lifecycleNotificationUrl, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         resource = VALUES(resource),
         changeType = VALUES(changeType),
         expirationDateTime = VALUES(expirationDateTime),
         clientState = VALUES(clientState),
         notificationUrl = VALUES(notificationUrl),
         lifecycleNotificationUrl = VALUES(lifecycleNotificationUrl),
         status = VALUES(status),
         metadata = VALUES(metadata),
         updatedAt = NOW()`,
      [
        subscription.subscriptionId,
        subscription.resource,
        subscription.changeType,
        subscription.expirationDateTime,
        subscription.clientState,
        subscription.notificationUrl,
        subscription.lifecycleNotificationUrl ?? null,
        subscription.status,
        subscription.metadata ? JSON.stringify(subscription.metadata) : null,
      ],
    );
  } finally {
    conn.release();
  }
}

export async function listTeamsSubscriptions() {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.execute(
      "SELECT * FROM teams_subscriptions ORDER BY updatedAt DESC",
    ) as any;
    return rows as any[];
  } finally {
    conn.release();
  }
}

export async function listRecentTeamsEvents(limit = 20) {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.query(
      `SELECT * FROM teams_integration_events ORDER BY createdAt DESC LIMIT ${Math.min(limit, 100)}`,
    ) as any;
    return rows as any[];
  } finally {
    conn.release();
  }
}

export async function listRecentTicketMappings(limit = 20) {
  const conn = await getPoolConn();
  try {
    const [rows] = await conn.query(
      `SELECT * FROM teams_message_ticket_map ORDER BY createdAt DESC LIMIT ${Math.min(limit, 100)}`,
    ) as any;
    return rows as any[];
  } finally {
    conn.release();
  }
}

// ─── Gerador de ID de requisição ──────────────────────────────────────────────

function generateRequestId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TMS-${ts}${rand}`;
}

// ─── Processamento de mensagens ───────────────────────────────────────────────

export async function processTeamsMessage(
  rawInput: z.infer<typeof processMessageInputSchema>,
) {
  const input = processMessageInputSchema.parse(rawInput);

  await recordTeamsEvent({
    messageId: input.messageId,
    eventType: "message_received",
    userEmail: input.senderEmail,
    payload: input.rawPayload ?? input,
    processingStatus: "received",
  });

  // Verificar idempotência pelo mapa messageId → ticket
  const existingMapping = await getTeamsMessageTicketMap(input.messageId);
  if (existingMapping) {
    await markTeamsEventProcessed(input.messageId, "ignored");
    return {
      created: false,
      duplicate: true,
      ticketId: existingMapping.ticketId,
      reason: "Mensagem já processada anteriormente.",
    };
  }

  // Verificar idempotência pela coluna externalMessageId na tabela requests
  const existingRequest = await findRequestByExternalMessageId(input.messageId);
  if (existingRequest) {
    await createTeamsMessageTicketMap({
      messageId: input.messageId,
      requestId: existingRequest.id,
      requestCode: existingRequest.requestId,
      userId: existingRequest.userId ?? null,
      category: existingRequest.category ?? "Geral",
      priority: existingRequest.priority ?? "media",
    });
    await markTeamsEventProcessed(input.messageId, "ignored");
    return {
      created: false,
      duplicate: true,
      ticketId: existingRequest.id,
      reason: "Chamado já existia para a mensagem informada.",
    };
  }

  const parsed = parseTeamsMessage(input.messageText);
  const user = await getUserByEmail(input.senderEmail);
  const matchedUser = Boolean(user);
  const titlePrefix = matchedUser ? parsed.category : `Avulso/${parsed.category}`;
  const title = `[${titlePrefix}] ${summarizeMessage(input.messageText)}`;
  const description = buildTicketDescription(input, parsed, matchedUser);

  const requestId = generateRequestId();
  const createdRequest = await createTeamsRequest({
    requestId,
    title,
    description,
    userId: user?.id ?? null,
    userName: input.senderName,
    userEmail: input.senderEmail,
    priority: parsed.priority,
    category: parsed.category,
    externalMessageId: input.messageId,
    metadata: {
      origin: matchedUser ? "microsoft_teams" : "microsoft_teams_guest",
      teamId: input.teamId,
      channelId: input.channelId,
      chatId: input.chatId,
      matchedKeywords: parsed.matchedKeywords,
      createdAt: input.createdAt,
      contextType: input.contextType,
      matchedUser,
    },
  });

  await createTeamsMessageTicketMap({
    messageId: input.messageId,
    requestId: createdRequest.id,
    requestCode: createdRequest.requestId,
    userId: user?.id ?? null,
    category: parsed.category,
    priority: parsed.priority,
  });

  await markTeamsEventProcessed(input.messageId, "processed");

  return {
    created: true,
    duplicate: false,
    ticketId: createdRequest.id,
    requestCode: createdRequest.requestId,
    category: parsed.category,
    priority: parsed.priority,
    userId: user?.id ?? null,
    fallbackAnonymous: !matchedUser,
  };
}

// ─── Resolução de mensagem via Microsoft Graph ────────────────────────────────

/**
 * Tenta buscar a mensagem completa no Microsoft Graph.
 * Se a notificação tiver encryptedContent (includeResourceData=true), descriptografa diretamente.
 * Se o Graph retornar 404 (permissão Chat.Read.All ausente ou chatId inválido)
 * ou 403 (permissão insuficiente), usa fallback com os dados da notificação.
 */
export async function resolveChatMessageFromGraph(notification: GraphNotification) {
  const resource = notification.resource ?? "";
  const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
  const chatId = matches?.[1] ?? (notification.resourceData as any)?.chatId ?? undefined;
  const messageId = matches?.[2] ?? notification.resourceData?.id ?? undefined;

  // ─── CAMINHO 1: encryptedContent (includeResourceData=true) ────────────────────────────
  const encContent = (notification as any).encryptedContent as {
    data: string;
    dataKey: string;
    dataSignature?: string;
    encryptionCertificateId?: string;
  } | undefined;

  if (encContent?.data && encContent?.dataKey) {
    console.log('[Teams] resolveChatMessageFromGraph: encryptedContent detectado, descriptografando...');
    try {
      const decrypted = decryptEncryptedContent(encContent);
      const extracted = extractMessageFromEncryptedContent(notification, decrypted);
      console.log(`[Teams] resolveChatMessageFromGraph: mensagem descriptografada com sucesso (messageId=${extracted.messageId})`);
      return extracted;
    } catch (decryptErr: any) {
      console.warn('[Teams] resolveChatMessageFromGraph: falha na descriptografia, tentando busca direta no Graph:', decryptErr?.message);
      // Continuar para o caminho 2 (busca direta no Graph)
    }
  }

  if (!chatId || !messageId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Não foi possível identificar chatId/messageId na notificação recebida.",
    });
  }

  // Tentar buscar a mensagem completa no Graph
  let graphFetchError: string | null = null;
  let graphFetchStatus: number | null = null;

  try {
    const accessToken = await getGraphAccessToken();
    const messageResponse = await retryWithBackoff(() =>
      axios.get(`https://graph.microsoft.com/v1.0/chats/${chatId}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      }),
    );

    const parsedMessage = graphMessageSchema.parse(messageResponse.data);
    const senderId = parsedMessage.from?.user?.id;
    let senderEmail = "desconhecido@teams.local";

    if (senderId) {
      try {
        const userResponse = await retryWithBackoff(() =>
          axios.get(
            `https://graph.microsoft.com/v1.0/users/${senderId}?$select=displayName,mail,userPrincipalName`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          ),
        );
        senderEmail =
          userResponse.data.mail ||
          userResponse.data.userPrincipalName ||
          senderEmail;
      } catch {
        senderEmail = "desconhecido@teams.local";
      }
    }

    console.log(`[Teams] resolveChatMessageFromGraph: mensagem obtida do Graph (messageId=${parsedMessage.id})`);
    return {
      messageId: parsedMessage.id,
      messageText: sanitizeHtmlText(parsedMessage.body?.content ?? ""),
      senderName:
        parsedMessage.from?.user?.displayName ||
        parsedMessage.from?.application?.displayName ||
        "Usuário Teams",
      senderEmail,
      createdAt: parsedMessage.createdDateTime || new Date().toISOString(),
      contextType: "chat" as const,
      chatId,
      rawPayload: { notification, graphMessage: parsedMessage },
    };
  } catch (graphErr: any) {
    graphFetchStatus = graphErr?.response?.status ?? null;
    const graphErrCode = graphErr?.response?.data?.error?.code ?? 'unknown';
    const graphErrMsg = graphErr?.response?.data?.error?.message ?? graphErr?.message ?? 'Erro desconhecido';
    graphFetchError = `HTTP ${graphFetchStatus ?? 'N/A'} — ${graphErrCode}: ${graphErrMsg}`;

    console.warn(
      `[Teams] resolveChatMessageFromGraph: falha ao buscar mensagem no Graph (${graphFetchError}).`,
      `chatId=${chatId}, messageId=${messageId}`,
    );

    // Registrar o erro detalhado no banco para diagnóstico
    try {
      await recordTeamsEvent({
        messageId,
        eventType: 'graph_fetch_error',
        userEmail: 'system',
        payload: {
          graphFetchError,
          graphFetchStatus,
          chatId,
          messageId,
          resource,
          notification,
          graphErrorDetails: graphErr?.response?.data ?? null,
          hint: graphFetchStatus === 404
            ? 'Verifique se Chat.Read.All está configurado como Application Permission com admin consent no Azure AD.'
            : graphFetchStatus === 403
            ? 'Permissão insuficiente. Adicione Chat.Read.All como Application Permission e conceda admin consent.'
            : 'Erro inesperado ao buscar mensagem no Graph.',
        },
        processingStatus: 'failed',
      });
    } catch (dbErr) {
      console.error('[Teams] Falha ao registrar graph_fetch_error no banco:', dbErr);
    }

    // FALLBACK: usar dados disponíveis na notificação
    // O Graph envia resourceData com informações básicas mesmo sem permissão de leitura
    const fallbackMessageId = messageId;
    const fallbackText = (notification as any)?.resourceData?.body?.content
      ?? (notification as any)?.encryptedContent?.data
      ?? `[Mensagem recebida via Teams — conteúdo indisponível. Erro Graph: ${graphFetchError}]`;
    const fallbackSenderName = (notification as any)?.resourceData?.from?.user?.displayName ?? 'Usuário Teams';
    const fallbackSenderEmail = (notification as any)?.resourceData?.from?.user?.userPrincipalName ?? 'desconhecido@teams.local';
    const fallbackCreatedAt = (notification as any)?.resourceData?.createdDateTime ?? new Date().toISOString();

    console.log(`[Teams] resolveChatMessageFromGraph: usando fallback com dados da notificação (messageId=${fallbackMessageId})`);

    return {
      messageId: fallbackMessageId,
      messageText: sanitizeHtmlText(fallbackText),
      senderName: fallbackSenderName,
      senderEmail: fallbackSenderEmail,
      createdAt: fallbackCreatedAt,
      contextType: "chat" as const,
      chatId,
      rawPayload: {
        notification,
        fallback: true,
        graphFetchError,
        graphFetchStatus,
        hint: graphFetchStatus === 404 || graphFetchStatus === 403
          ? 'Configure Chat.Read.All como Application Permission com admin consent no Azure AD para obter o conteúdo completo das mensagens.'
          : undefined,
      },
    };
  }
}

/**
 * Testa diretamente a chamada Graph para um chatId/messageId específico.
 * Útil para diagnóstico de permissões Azure AD.
 */
export async function testGraphMessageFetch(chatId: string, messageId: string) {
  const accessToken = await getGraphAccessToken();
  const url = `https://graph.microsoft.com/v1.0/chats/${chatId}/messages/${messageId}`;
  console.log(`[Teams] testGraphMessageFetch: GET ${url}`);

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    return {
      ok: true,
      status: response.status,
      data: response.data,
      hint: 'Chamada bem-sucedida. Permissão Chat.Read.All está configurada corretamente.',
    };
  } catch (err: any) {
    const status = err?.response?.status ?? null;
    const graphError = err?.response?.data?.error ?? null;
    return {
      ok: false,
      status,
      error: graphError ?? err?.message,
      hint: status === 404
        ? 'Erro 404: A permissão Chat.Read.All pode não estar configurada como Application Permission com admin consent, ou o chatId/messageId é inválido.'
        : status === 403
        ? 'Erro 403: Permissão insuficiente. Adicione Chat.Read.All como Application Permission e conceda admin consent no Azure AD.'
        : status === 401
        ? 'Erro 401: Token inválido ou expirado. Verifique as credenciais TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET e TEAMS_TENANT_ID.'
        : `Erro HTTP ${status ?? 'desconhecido'}.`,
      url,
    };
  }
}

// ─── Validação e processamento de webhooks ────────────────────────────────────

export function validateWebhookRequest(
  payload: unknown,
  validationToken?: string,
) {
  if (validationToken) {
    return { isValidation: true, validationToken };
  }

  const parsed = teamsWebhookPayloadSchema.parse(payload);
  const env = getTeamsEnv();
  const expectedClientState = env.TEAMS_WEBHOOK_CLIENT_STATE;

  console.log('[Teams] validateWebhookRequest: payload recebido, eventos:', parsed.value.length);

  for (const event of parsed.value) {
    const eventClientState = event.clientState;
    console.log(`[Teams] Evento clientState='${eventClientState}', esperado='${expectedClientState}'`);

    // Aceitar se:
    // 1. Não há clientState esperado configurado, OU
    // 2. O clientState do evento bate com o esperado, OU
    // 3. O clientState do evento está vazio/nulo (subscription criada sem clientState)
    if (
      expectedClientState &&
      eventClientState &&
      eventClientState !== expectedClientState
    ) {
      console.warn(`[Teams] clientState inválido: '${eventClientState}' !== '${expectedClientState}'`);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `clientState inválido no webhook do Teams: '${eventClientState}'.`,
      });
    }
  }

  return { isValidation: false, notifications: parsed.value };
}

export async function processGraphNotifications(payload: unknown) {
  console.log('[Teams] processGraphNotifications: iniciando processamento');
  console.log('[Teams] Payload recebido:', JSON.stringify(payload)?.slice(0, 500));

  let validation: ReturnType<typeof validateWebhookRequest>;
  try {
    validation = validateWebhookRequest(payload);
  } catch (validationError) {
    console.error('[Teams] Falha na validação do payload:', validationError);
    // Tentar registrar o erro no banco mesmo sem validação completa
    try {
      const rawPayload = payload as any;
      const events = rawPayload?.value ?? [];
      for (const ev of events) {
        const msgId = ev?.resourceData?.id ?? ev?.resource ?? `err-${Date.now()}`;
        await recordTeamsEvent({
          messageId: msgId,
          eventType: 'validation_error',
          userEmail: 'system',
          payload: { error: String(validationError), rawEvent: ev },
          processingStatus: 'failed',
        });
      }
    } catch (dbErr) {
      console.error('[Teams] Falha ao registrar erro de validação no banco:', dbErr);
    }
    throw validationError;
  }

  if (validation.isValidation) {
    return { validation };
  }

  const results: Array<Record<string, unknown>> = [];
  const notifications = validation.notifications ?? [];
  console.log('[Teams] Processando', notifications.length, 'notificações');

  for (const notification of notifications) {
    const notifId = notification.resourceData?.id ?? notification.resource ?? 'unknown';
    const encContentDebug = (notification as any).encryptedContent;
    console.log(`[Teams] Processando notificação: resource='${notification.resource}', changeType='${notification.changeType}'`);
    console.log(`[Teams] encryptedContent presente: ${!!encContentDebug}, keys: ${encContentDebug ? Object.keys(encContentDebug).join(',') : 'N/A'}`);
    console.log(`[Teams] TEAMS_ENCRYPTION_PRIVATE_KEY definida: ${!!process.env.TEAMS_ENCRYPTION_PRIVATE_KEY}`);
    console.log(`[Teams] TEAMS_ENCRYPTION_CERTIFICATE definida: ${!!process.env.TEAMS_ENCRYPTION_CERTIFICATE}`);
    console.log(`[Teams] TEAMS_ENCRYPTION_CERTIFICATE_ID: ${process.env.TEAMS_ENCRYPTION_CERTIFICATE_ID ?? 'NOT SET'}`);
    try {
      const resource = notification.resource ?? "";
      if (!resource.includes("chats/")) {
        console.log(`[Teams] Ignorando recurso fora do escopo: '${resource}'`);
        results.push({
          ignored: true,
          resource,
          reason: "Recurso fora do escopo de chats.",
        });
        continue;
      }

      console.log(`[Teams] Resolvendo mensagem do Graph para: ${resource}`);
      const resolved = await resolveChatMessageFromGraph(notification);
      console.log(`[Teams] Mensagem resolvida: messageId='${resolved.messageId}', sender='${resolved.senderName}'`);

      const processed = await processTeamsMessage(resolved);
      console.log(`[Teams] Resultado do processamento:`, JSON.stringify(processed));
      results.push({
        notification: notifId,
        ...processed,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Falha desconhecida no processamento do webhook.";
      console.error(`[Teams] Erro ao processar notificação '${notifId}':`, error);
      // Tentar registrar o erro no banco
      try {
        await recordTeamsEvent({
          messageId: notifId,
          eventType: 'processing_error',
          userEmail: 'system',
          payload: { error: errMsg, notification },
          processingStatus: 'failed',
        });
      } catch (dbErr) {
        console.error('[Teams] Falha ao registrar erro de processamento no banco:', dbErr);
      }
      results.push({
        error: errMsg,
        notification: notifId,
      });
    }
  }

  return { validation, results };
}

// ─── Gerenciamento de subscriptions ──────────────────────────────────────────

export async function createGraphSubscription(
  input: z.infer<typeof createSubscriptionInputSchema>,
) {
  const env = assertTeamsConfigured();
  const parsedInput = createSubscriptionInputSchema.parse(input);
  const accessToken = await getGraphAccessToken();
  const clientState = env.TEAMS_WEBHOOK_CLIENT_STATE || "teams-portal-online";

  // Usar URL das variáveis de ambiente como fallback obrigatório
  const notificationUrl = (parsedInput.notificationUrl && parsedInput.notificationUrl.trim())
    ? parsedInput.notificationUrl.trim()
    : env.TEAMS_NOTIFICATION_URL;

  if (!notificationUrl) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Notification URL não configurada. Defina TEAMS_NOTIFICATION_URL nas variáveis de ambiente.",
    });
  }

  const lifecycleNotificationUrl = (parsedInput.lifecycleNotificationUrl && parsedInput.lifecycleNotificationUrl.trim())
    ? parsedInput.lifecycleNotificationUrl.trim()
    : (env.TEAMS_LIFECYCLE_URL || undefined);

  // Limitar expiração a 3 dias / 4.320 minutos (limite real do Microsoft Graph para /chats/getAllMessages)
  const maxExpiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  let expirationDateTime = parsedInput.expirationDateTime;
  try {
    const requestedExpiry = new Date(expirationDateTime);
    if (requestedExpiry > maxExpiration) {
      expirationDateTime = maxExpiration.toISOString();
      console.warn(`[Teams] Expiração ajustada para o máximo permitido: ${expirationDateTime}`);
    }
  } catch {
    expirationDateTime = maxExpiration.toISOString();
  }

  // Suporte a includeResourceData (notificações com conteúdo criptografado)
  const useResourceData = parsedInput.includeResourceData === true;
  let encCert: string | null = null;
  let encCertId: string | null = null;

  if (useResourceData) {
    // Obter certificado das variáveis de ambiente ou arquivo em disco
    encCert = parsedInput.encryptionCertificate ?? getEncryptionCertificate();
    encCertId = parsedInput.encryptionCertificateId ?? getEncryptionCertificateId();

    if (!encCert || !encCertId) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Certificado de criptografia não configurado. Defina TEAMS_ENCRYPTION_CERTIFICATE e TEAMS_ENCRYPTION_CERTIFICATE_ID no Railway.',
      });
    }
    console.log(`[Teams] includeResourceData=true, certificado ID: ${encCertId}`);
  }

  // Construir payload — omitir lifecycleNotificationUrl se não configurado
  const subscriptionPayload: Record<string, unknown> = {
    changeType: parsedInput.changeType,
    notificationUrl,
    resource: parsedInput.resource,
    expirationDateTime,
    clientState,
  };
  if (lifecycleNotificationUrl) {
    subscriptionPayload.lifecycleNotificationUrl = lifecycleNotificationUrl;
  }
  if (useResourceData && encCert && encCertId) {
    subscriptionPayload.includeResourceData = true;
    subscriptionPayload.encryptionCertificate = encCert;
    subscriptionPayload.encryptionCertificateId = encCertId;
  }

  console.log('[Teams] Criando subscription com payload:', JSON.stringify({ ...subscriptionPayload, encryptionCertificate: encCert ? '[REDACTED]' : undefined }));

  let response: any;
  try {
    response = await retryWithBackoff(() =>
      axios.post(
        "https://graph.microsoft.com/v1.0/subscriptions",
        subscriptionPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      ),
    );
  } catch (axiosError: any) {
    // Extrair mensagem de erro detalhada do Microsoft Graph
    const graphError = axiosError?.response?.data?.error;
    const graphMessage = graphError
      ? `${graphError.code}: ${graphError.message}`
      : axiosError?.message ?? 'Erro desconhecido';
    const status = axiosError?.response?.status ?? 500;
    console.error(`[Teams] Erro ao criar subscription (HTTP ${status}):`, graphMessage, JSON.stringify(axiosError?.response?.data));
    throw new TRPCError({
      code: status === 403 ? 'FORBIDDEN' : status === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
      message: `Microsoft Graph (${status}): ${graphMessage}`,
    });
  }

  await upsertTeamsSubscription({
    subscriptionId: response.data.id,
    resource: response.data.resource,
    changeType: response.data.changeType,
    expirationDateTime: response.data.expirationDateTime,
    clientState,
    notificationUrl,
    lifecycleNotificationUrl: lifecycleNotificationUrl ?? null,
    status: "active",
    metadata: response.data,
  });

  return response.data;
}

export async function renewGraphSubscription(
  subscriptionId: string,
  expirationDateTime: string,
) {
  const accessToken = await getGraphAccessToken();
  const response = await retryWithBackoff(() =>
    axios.patch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
      { expirationDateTime },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    ),
  );

  await upsertTeamsSubscription({
    subscriptionId,
    resource: response.data.resource,
    changeType: response.data.changeType,
    expirationDateTime: response.data.expirationDateTime,
    clientState: response.data.clientState,
    notificationUrl: response.data.notificationUrl,
    lifecycleNotificationUrl: response.data.lifecycleNotificationUrl ?? null,
    status: "active",
    metadata: response.data,
  });

  return response.data;
}

// ─── Dashboard de integração ──────────────────────────────────────────────────

export async function getIntegrationDashboard() {
  const [subscriptions, events, mappings] = await Promise.all([
    listTeamsSubscriptions(),
    listRecentTeamsEvents(10),
    listRecentTicketMappings(10),
  ]);

  // Usar getTeamsEnv() em vez de ENV para ler process.env em runtime
  const env = getTeamsEnv();

  return {
    configured: Boolean(env.TEAMS_TENANT_ID && env.TEAMS_CLIENT_ID && env.TEAMS_CLIENT_SECRET),
    defaultResource: defaultChatResource(),
    publicUrls: {
      notification: env.TEAMS_NOTIFICATION_URL || null,
      lifecycle: env.TEAMS_LIFECYCLE_URL || null,
    },
    subscriptions,
    recentEvents: events,
    recentMappings: mappings,
  };
}

// ─── Deletar subscription no Graph ───────────────────────────────────────────

export async function deleteGraphSubscription(subscriptionId: string) {
  const accessToken = await getGraphAccessToken();

  try {
    await retryWithBackoff(() =>
      axios.delete(
        `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );
    console.log(`[Teams] Subscription ${subscriptionId} deletada do Graph.`);
  } catch (axiosError: any) {
    // Se já não existe no Graph (404), apenas logar e continuar
    if (axiosError?.response?.status === 404) {
      console.warn(`[Teams] Subscription ${subscriptionId} não encontrada no Graph (já expirou?). Removendo do banco local.`);
    } else {
      const graphError = axiosError?.response?.data?.error;
      const graphMessage = graphError
        ? `${graphError.code}: ${graphError.message}`
        : axiosError?.message ?? 'Erro desconhecido';
      const status = axiosError?.response?.status ?? 500;
      console.error(`[Teams] Erro ao deletar subscription (HTTP ${status}):`, graphMessage);
      throw new TRPCError({
        code: status === 403 ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR',
        message: `Microsoft Graph (${status}): ${graphMessage}`,
      });
    }
  }

  // Remover do banco local independente do resultado no Graph
  const conn = await getPoolConn();
  try {
    await conn.execute(
      'DELETE FROM teams_subscriptions WHERE subscriptionId = ?',
      [subscriptionId],
    );
    console.log(`[Teams] Subscription ${subscriptionId} removida do banco local.`);
  } finally {
    conn.release();
  }

  return { deleted: true, subscriptionId };
}

// ─── Listar subscriptions diretamente no Graph (fonte de verdade) ─────────────

export async function listGraphSubscriptionsFromApi() {
  const accessToken = await getGraphAccessToken();

  try {
    const response = await retryWithBackoff(() =>
      axios.get(
        'https://graph.microsoft.com/v1.0/subscriptions',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );
    return (response.data?.value ?? []) as Array<{
      id: string;
      resource: string;
      changeType: string;
      expirationDateTime: string;
      notificationUrl: string;
      clientState: string;
    }>;
  } catch (axiosError: any) {
    const graphError = axiosError?.response?.data?.error;
    const graphMessage = graphError
      ? `${graphError.code}: ${graphError.message}`
      : axiosError?.message ?? 'Erro desconhecido';
    const status = axiosError?.response?.status ?? 500;
    console.error(`[Teams] Erro ao listar subscriptions do Graph (HTTP ${status}):`, graphMessage);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Microsoft Graph (${status}): ${graphMessage}`,
    });
  }
}

// ─── Diagnóstico de Permissões Microsoft Graph ───────────────────────────────

/**
 * Testa se as permissões do app no Azure AD estão configuradas corretamente.
 * Verifica: token, Chat.Read.All (GET /chats), User.Read.All (GET /users).
 */
export async function checkGraphPermissions() {
  const env = getTeamsEnv();
  const result: {
    tokenOk: boolean;
    tokenError?: string;
    chatReadAll: { ok: boolean; status?: number; error?: string; sampleChats?: number };
    userReadAll: { ok: boolean; status?: number; error?: string };
    subscriptionReadAll: { ok: boolean; status?: number; error?: string; count?: number };
    summary: string[];
    recommendations: string[];
  } = {
    tokenOk: false,
    chatReadAll: { ok: false },
    userReadAll: { ok: false },
    subscriptionReadAll: { ok: false },
    summary: [],
    recommendations: [],
  };

  // 1. Testar token
  let accessToken: string;
  try {
    accessToken = await getGraphAccessToken();
    result.tokenOk = true;
    result.summary.push('✅ Token Microsoft Graph obtido com sucesso.');
  } catch (err: any) {
    result.tokenError = err?.message ?? String(err);
    result.summary.push(`❌ Falha ao obter token: ${result.tokenError}`);
    result.recommendations.push('Verifique TEAMS_TENANT_ID, TEAMS_CLIENT_ID e TEAMS_CLIENT_SECRET no Railway.');
    return result;
  }

  // 2. Testar Chat.Read.All via GET /chats
  try {
    const res = await axios.get('https://graph.microsoft.com/v1.0/chats?$top=1', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    const chats = res.data?.value ?? [];
    result.chatReadAll = { ok: true, status: res.status, sampleChats: chats.length };
    result.summary.push(`✅ Chat.Read.All: OK (${chats.length} chat(s) acessível(is))`);
  } catch (err: any) {
    const status = err?.response?.status ?? null;
    const code = err?.response?.data?.error?.code ?? 'unknown';
    const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Erro desconhecido';
    result.chatReadAll = { ok: false, status, error: `${code}: ${msg}` };
    if (status === 403) {
      result.summary.push(`❌ Chat.Read.All: NEGADO (403) — Admin Consent ausente`);
      result.recommendations.push('No Azure AD → App registrations → API permissions → conceda Admin consent para Chat.Read.All.');
    } else if (status === 401) {
      result.summary.push(`❌ Chat.Read.All: INVÁLIDO (401) — Token inválido`);
      result.recommendations.push('Verifique as credenciais do app no Azure AD.');
    } else {
      result.summary.push(`⚠️ Chat.Read.All: Erro ${status ?? 'N/A'} — ${code}`);
      result.recommendations.push(`Erro ao verificar Chat.Read.All: ${msg}`);
    }
  }

  // 3. Testar User.Read.All via GET /users
  try {
    const res = await axios.get('https://graph.microsoft.com/v1.0/users?$top=1&$select=id,displayName,mail', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    result.userReadAll = { ok: true, status: res.status };
    result.summary.push('✅ User.Read.All: OK');
  } catch (err: any) {
    const status = err?.response?.status ?? null;
    const code = err?.response?.data?.error?.code ?? 'unknown';
    const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Erro desconhecido';
    result.userReadAll = { ok: false, status, error: `${code}: ${msg}` };
    if (status === 403) {
      result.summary.push(`⚠️ User.Read.All: NEGADO (403) — Remetente será anônimo`);
      result.recommendations.push('Adicione User.Read.All como Application Permission para identificar remetentes.');
    } else {
      result.summary.push(`⚠️ User.Read.All: Erro ${status ?? 'N/A'} — ${code}`);
    }
  }

  // 4. Testar Subscription.Read.All via GET /subscriptions
  try {
    const res = await axios.get('https://graph.microsoft.com/v1.0/subscriptions', {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    const subs = res.data?.value ?? [];
    result.subscriptionReadAll = { ok: true, status: res.status, count: subs.length };
    result.summary.push(`✅ Subscriptions: OK (${subs.length} ativa(s))`);
  } catch (err: any) {
    const status = err?.response?.status ?? null;
    const code = err?.response?.data?.error?.code ?? 'unknown';
    result.subscriptionReadAll = { ok: false, status, error: `${code}` };
    result.summary.push(`⚠️ Subscriptions: Erro ${status ?? 'N/A'}`);
  }

  if (result.recommendations.length === 0) {
    result.recommendations.push('Todas as permissões estão configuradas corretamente.');
  }

  return result;
}

/**
 * Recria a subscription com clientState correto, deletando a antiga se existir.
 * Útil para corrigir subscriptions criadas sem clientState.
 */
export async function recreateSubscriptionWithClientState() {
  const env = assertTeamsConfigured();
  const accessToken = await getGraphAccessToken();

  // Listar subscriptions existentes
  const listRes = await axios.get('https://graph.microsoft.com/v1.0/subscriptions', {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 15000,
  });
  const existing = (listRes.data?.value ?? []) as Array<{ id: string; resource: string; clientState: string | null }>;

  // Deletar subscriptions sem clientState ou com clientState errado
  const deleted: string[] = [];
  for (const sub of existing) {
    if (!sub.clientState || sub.clientState !== (env.TEAMS_WEBHOOK_CLIENT_STATE || 'teams-portal-online')) {
      try {
        await axios.delete(`https://graph.microsoft.com/v1.0/subscriptions/${sub.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });
        deleted.push(sub.id);
        console.log(`[Teams] recreateSubscription: deletada subscription ${sub.id} (clientState='${sub.clientState}')`);
      } catch (err: any) {
        console.warn(`[Teams] recreateSubscription: falha ao deletar ${sub.id}:`, err?.message);
      }
    }
  }

  // Criar nova subscription com clientState correto
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 60000).toISOString();
  const newSub = await createGraphSubscription({
    resource: env.TEAMS_DEFAULT_RESOURCE || '/chats/getAllMessages',
    changeType: 'created',
    expirationDateTime,
    notificationUrl: env.TEAMS_NOTIFICATION_URL,
    lifecycleNotificationUrl: env.TEAMS_LIFECYCLE_URL,
  });

  return {
    deleted,
    created: newSub,
    clientState: env.TEAMS_WEBHOOK_CLIENT_STATE || 'teams-portal-online',
  };
}

/**
 * Reprocessa eventos com status 'failed' que tiveram erro de banco (userId NOT NULL).
 * Útil para recuperar mensagens que chegaram antes da migration ser aplicada.
 */
export async function reprocessFailedEvents(limit = 10) {
  const conn = await getPoolConn();
  let failedEvents: any[] = [];
  try {
    const [rows] = await conn.query(
      `SELECT * FROM teams_integration_events
       WHERE processingStatus = 'failed'
         AND eventType IN ('message_received', 'processing_error')
       ORDER BY createdAt DESC LIMIT ${Math.min(limit, 50)}`,
    ) as any;
    failedEvents = rows as any[];
  } finally {
    conn.release();
  }

  const results: Array<{ messageId: string; result: any; error?: string }> = [];

  for (const event of failedEvents) {
    const messageId = event.messageId;
    try {
      // Verificar se já foi processado com sucesso
      const existing = await getTeamsMessageTicketMap(messageId);
      if (existing) {
        results.push({ messageId, result: { skipped: true, reason: 'Já processado', ticketId: existing.ticketId } });
        continue;
      }

      // Tentar extrair dados do payload salvo
      let payload: any = {};
      try {
        payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : (event.payload ?? {});
      } catch { payload = {}; }

      const notification = payload?.notification ?? {};
      const resource = notification?.resource ?? '';
      const matches = resource.match(/\/?chats\/([^/]+)\/messages\/([^/]+)/);
      const chatId = matches?.[1] ?? notification?.resourceData?.chatId ?? 'unknown';
      const msgId = matches?.[2] ?? notification?.resourceData?.id ?? messageId;

      // Tentar buscar do Graph novamente
      let resolved: any;
      try {
        resolved = await resolveChatMessageFromGraph(notification);
      } catch {
        // Usar dados mínimos disponíveis
        resolved = {
          messageId: msgId,
          messageText: `[Reprocessamento] Mensagem do Teams (ID: ${msgId}, Chat: ${chatId})`,
          senderName: event.userEmail && event.userEmail !== 'system' ? event.userEmail.split('@')[0] : 'Usuário Teams',
          senderEmail: event.userEmail && event.userEmail !== 'system' ? event.userEmail : 'desconhecido@teams.local',
          createdAt: event.createdAt ?? new Date().toISOString(),
          contextType: 'chat' as const,
          chatId,
        };
      }

      const processed = await processTeamsMessage(resolved);
      results.push({ messageId, result: processed });
    } catch (err: any) {
      results.push({ messageId, result: null, error: err?.message ?? String(err) });
    }
  }

  return { total: failedEvents.length, results };
}

// ─── Renovação Automática de Subscriptions ────────────────────────────────────

/**
 * Renova todas as subscriptions ativas do Graph que expiram em menos de 48h.
 * Chamado pelo cron job a cada 2 dias.
 */
export async function renewExpiringSubscriptions(): Promise<{
  renewed: number;
  failed: number;
  skipped: number;
}> {
  const env = getTeamsEnv();
  if (!env.TEAMS_TENANT_ID || !env.TEAMS_CLIENT_ID || !env.TEAMS_CLIENT_SECRET) {
    console.warn('[Teams] renewExpiringSubscriptions: credenciais não configuradas, pulando.');
    return { renewed: 0, failed: 0, skipped: 1 };
  }

  let renewed = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const token = await getGraphAccessToken();

    // Listar subscriptions ativas no Graph
    const listRes = await axios.get('https://graph.microsoft.com/v1.0/subscriptions', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    const subscriptions: Array<{
      id: string;
      resource: string;
      expirationDateTime: string;
      clientState: string | null;
      notificationUrl: string;
    }> = listRes.data.value ?? [];

    console.log(`[Teams] renewExpiringSubscriptions: ${subscriptions.length} subscription(s) encontrada(s).`);

    const now = Date.now();
    const threshold = 48 * 60 * 60 * 1000; // 48 horas em ms

    for (const sub of subscriptions) {
      const expiresAt = new Date(sub.expirationDateTime).getTime();
      const timeLeft = expiresAt - now;

      if (timeLeft > threshold) {
        console.log(`[Teams] Subscription ${sub.id} expira em ${Math.round(timeLeft / 3600000)}h — sem necessidade de renovação.`);
        skipped++;
        continue;
      }

      // Renovar: PATCH com nova data de expiração (3 dias - 1 min)
      const newExpiration = new Date(now + 3 * 24 * 60 * 60 * 1000 - 60000).toISOString();

      try {
        await axios.patch(
          `https://graph.microsoft.com/v1.0/subscriptions/${sub.id}`,
          { expirationDateTime: newExpiration },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );
        console.log(`[Teams] ✅ Subscription ${sub.id} renovada até ${newExpiration}.`);
        renewed++;
      } catch (patchErr: unknown) {
        const msg = (patchErr as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? String(patchErr);
        console.error(`[Teams] ❌ Falha ao renovar subscription ${sub.id}: ${msg}`);
        failed++;
      }
    }
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message ?? String(err);
    console.error('[Teams] renewExpiringSubscriptions: erro ao listar subscriptions:', msg);
    failed++;
  }

  return { renewed, failed, skipped };
}

/**
 * Inicia o cron job de renovação automática de subscriptions.
 * Executa a cada 2 dias (48h).
 */
export function startSubscriptionRenewalCron(): NodeJS.Timeout {
  const INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 48 horas

  console.log('[Teams] Cron job de renovação de subscriptions iniciado (intervalo: 48h).');

  // Executar imediatamente na inicialização para garantir que subscriptions estejam ativas
  setTimeout(async () => {
    console.log('[Teams] Verificação inicial de subscriptions...');
    const result = await renewExpiringSubscriptions();
    console.log(`[Teams] Verificação inicial: renovadas=${result.renewed}, falhas=${result.failed}, puladas=${result.skipped}`);
  }, 30000); // 30s após o servidor iniciar

  return setInterval(async () => {
    console.log('[Teams] Cron: verificando subscriptions para renovação...');
    const result = await renewExpiringSubscriptions();
    console.log(`[Teams] Cron concluído: renovadas=${result.renewed}, falhas=${result.failed}, puladas=${result.skipped}`);
  }, INTERVAL_MS);
}
