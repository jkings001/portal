/**
 * create-graph-subscription.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Script para criar/renovar a subscription do Microsoft Graph que envia
 * notificações de mensagens do Teams para o Portal de Atendimento.
 *
 * Uso:
 *   node scripts/create-graph-subscription.mjs
 *
 * Pré-requisitos:
 *   - Variáveis de ambiente configuradas no Railway (ou .env local)
 *   - Permissões no Azure AD: ChannelMessage.Read.All, Chat.Read.All,
 *     Subscription.ReadWrite.All (Application permissions + admin consent)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Carregar .env se existir ──────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, "../.env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env não existe — usar variáveis do ambiente do sistema
}

// ── Configuração ──────────────────────────────────────────────────────────────
const RAILWAY_URL = "https://endearing-prosperity-production-8094.up.railway.app";

const CONFIG = {
  tenantId:     process.env.TEAMS_TENANT_ID     || "",
  clientId:     process.env.TEAMS_CLIENT_ID     || "",
  clientSecret: process.env.TEAMS_CLIENT_SECRET || "",
  // URL direta do Railway (sem proxy intermediário)
  notificationUrl: process.env.TEAMS_NOTIFICATION_URL_RAILWAY
    || `${RAILWAY_URL}/api/teams/webhook`,
  lifecycleUrl: process.env.TEAMS_LIFECYCLE_URL_RAILWAY
    || `${RAILWAY_URL}/api/teams/lifecycle`,
  clientState:  process.env.TEAMS_WEBHOOK_CLIENT_STATE || "teams-portal-online",
  resource:     process.env.TEAMS_DEFAULT_RESOURCE     || "/chats/getAllMessages",
};

// ── Validação inicial ─────────────────────────────────────────────────────────
function validate() {
  const missing = [];
  if (!CONFIG.tenantId)     missing.push("TEAMS_TENANT_ID");
  if (!CONFIG.clientId)     missing.push("TEAMS_CLIENT_ID");
  if (!CONFIG.clientSecret) missing.push("TEAMS_CLIENT_SECRET");
  if (missing.length) {
    console.error("❌ Variáveis de ambiente ausentes:", missing.join(", "));
    process.exit(1);
  }
}

// ── Obter token de acesso (client credentials) ────────────────────────────────
async function getAccessToken() {
  const url = `https://login.microsoftonline.com/${CONFIG.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     CONFIG.clientId,
    client_secret: CONFIG.clientSecret,
    scope:         "https://graph.microsoft.com/.default",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Falha ao obter token: ${data.error} — ${data.error_description}`);
  }
  return data.access_token;
}

// ── Listar subscriptions existentes ──────────────────────────────────────────
async function listSubscriptions(token) {
  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Erro ao listar subscriptions: ${JSON.stringify(data)}`);
  return data.value || [];
}

// ── Criar nova subscription ───────────────────────────────────────────────────
async function createSubscription(token) {
  // Expiração: máximo 60 minutos para /chats/getAllMessages (limite do Graph)
  const expirationDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const payload = {
    changeType:           "created,updated",
    notificationUrl:      CONFIG.notificationUrl,
    lifecycleNotificationUrl: CONFIG.lifecycleUrl,
    resource:             CONFIG.resource,
    expirationDateTime,
    clientState:          CONFIG.clientState,
    latestSupportedTlsVersion: "v1_2",
  };

  console.log("\n📤 Criando subscription com payload:");
  console.log(JSON.stringify(payload, null, 2));

  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Erro ao criar subscription:\n${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

// ── Renovar subscription existente ───────────────────────────────────────────
async function renewSubscription(token, subscriptionId) {
  const expirationDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
    {
      method: "PATCH",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expirationDateTime }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Erro ao renovar subscription:\n${JSON.stringify(data, null, 2)}`);
  }
  return data;
}

// ── Deletar subscription ──────────────────────────────────────────────────────
async function deleteSubscription(token, subscriptionId) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Erro ao deletar subscription: ${JSON.stringify(data)}`);
  }
}

// ── Verificar se o endpoint Railway está acessível ───────────────────────────
async function verifyEndpoint() {
  const testUrl = `${CONFIG.notificationUrl}?validationToken=PREFLIGHT_CHECK`;
  try {
    const res = await fetch(testUrl, { signal: AbortSignal.timeout(10000) });
    const body = await res.text();
    if (res.ok && body === "PREFLIGHT_CHECK") {
      console.log("✅ Endpoint Railway acessível e respondendo corretamente");
      return true;
    } else {
      console.warn(`⚠️  Endpoint retornou HTTP ${res.status}: ${body}`);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️  Não foi possível verificar o endpoint: ${err.message}`);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Microsoft Graph Subscription — Portal de Atendimento Teams");
  console.log("═══════════════════════════════════════════════════════════════");

  validate();

  console.log("\n📋 Configuração:");
  console.log(`  Tenant ID:        ${CONFIG.tenantId}`);
  console.log(`  Client ID:        ${CONFIG.clientId}`);
  console.log(`  Notification URL: ${CONFIG.notificationUrl}`);
  console.log(`  Lifecycle URL:    ${CONFIG.lifecycleUrl}`);
  console.log(`  Resource:         ${CONFIG.resource}`);
  console.log(`  Client State:     ${CONFIG.clientState}`);

  // 1. Verificar endpoint
  console.log("\n🔍 Verificando acessibilidade do endpoint Railway...");
  const endpointOk = await verifyEndpoint();
  if (!endpointOk) {
    console.error("❌ O endpoint não está respondendo. Verifique se o Railway está online.");
    process.exit(1);
  }

  // 2. Obter token
  console.log("\n🔑 Obtendo token de acesso do Microsoft Graph...");
  const token = await getAccessToken();
  console.log("✅ Token obtido com sucesso");

  // 3. Listar subscriptions existentes
  console.log("\n📋 Listando subscriptions existentes...");
  const existing = await listSubscriptions(token);

  const teamsSubscriptions = existing.filter(
    (s) => s.resource === CONFIG.resource || s.notificationUrl === CONFIG.notificationUrl
  );

  if (teamsSubscriptions.length > 0) {
    console.log(`\n⚠️  Encontradas ${teamsSubscriptions.length} subscription(s) existente(s):`);
    for (const sub of teamsSubscriptions) {
      console.log(`  ID: ${sub.id}`);
      console.log(`  Resource: ${sub.resource}`);
      console.log(`  NotificationUrl: ${sub.notificationUrl}`);
      console.log(`  Expira em: ${sub.expirationDateTime}`);
      console.log(`  Client State: ${sub.clientState}`);
      console.log("");
    }

    // Deletar subscriptions antigas com URL diferente (proxy antigo)
    const oldSubscriptions = teamsSubscriptions.filter(
      (s) => s.notificationUrl !== CONFIG.notificationUrl
    );
    if (oldSubscriptions.length > 0) {
      console.log(`🗑️  Removendo ${oldSubscriptions.length} subscription(s) com URL antiga...`);
      for (const sub of oldSubscriptions) {
        await deleteSubscription(token, sub.id);
        console.log(`  ✅ Deletada: ${sub.id} (URL: ${sub.notificationUrl})`);
      }
    }

    // Renovar subscriptions com a URL correta
    const validSubscriptions = teamsSubscriptions.filter(
      (s) => s.notificationUrl === CONFIG.notificationUrl
    );
    if (validSubscriptions.length > 0) {
      console.log(`\n🔄 Renovando ${validSubscriptions.length} subscription(s) existente(s)...`);
      for (const sub of validSubscriptions) {
        const renewed = await renewSubscription(token, sub.id);
        console.log(`  ✅ Renovada: ${renewed.id}`);
        console.log(`     Nova expiração: ${renewed.expirationDateTime}`);
      }
      console.log("\n✅ Subscriptions renovadas com sucesso!");
      printSummary(validSubscriptions[0]);
      return;
    }
  }

  // 4. Criar nova subscription
  console.log("\n🚀 Criando nova subscription no Microsoft Graph...");
  const subscription = await createSubscription(token);

  console.log("\n✅ Subscription criada com sucesso!");
  console.log("\n📄 Detalhes da subscription:");
  console.log(`  ID:              ${subscription.id}`);
  console.log(`  Resource:        ${subscription.resource}`);
  console.log(`  NotificationUrl: ${subscription.notificationUrl}`);
  console.log(`  Expira em:       ${subscription.expirationDateTime}`);
  console.log(`  Client State:    ${subscription.clientState}`);

  printSummary(subscription);
}

function printSummary(subscription) {
  const expiresAt = new Date(subscription.expirationDateTime);
  const minutesLeft = Math.round((expiresAt - Date.now()) / 60000);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  PRÓXIMOS PASSOS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`\n  ⏰ A subscription expira em ${minutesLeft} minutos.`);
  console.log("     O portal renova automaticamente via POST /api/teams/lifecycle.");
  console.log("");
  console.log("  📌 Atualize as variáveis de ambiente no Railway:");
  console.log(`     TEAMS_NOTIFICATION_URL = ${subscription.notificationUrl}`);
  console.log(`     TEAMS_LIFECYCLE_URL    = ${subscription.notificationUrl.replace('/webhook', '/lifecycle')}`);
  console.log("");
  console.log("  🔁 Para renovar manualmente, execute este script novamente.");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Erro fatal:", err.message);
  process.exit(1);
});
