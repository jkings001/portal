/**
 * Script para deletar a subscription atual do Microsoft Graph
 * e recriar com clientState correto (teams-portal-online)
 *
 * Uso: node scripts/recreate-subscription.mjs
 */
import "dotenv/config";

const TENANT_ID = process.env.TEAMS_TENANT_ID;
const CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const CLIENT_SECRET = process.env.TEAMS_CLIENT_SECRET;
const NOTIFICATION_URL =
  process.env.TEAMS_NOTIFICATION_URL ||
  "https://jkings.team/api/teams/webhook";
const LIFECYCLE_URL =
  process.env.TEAMS_LIFECYCLE_URL ||
  "https://jkings.team/api/teams/lifecycle";
const CLIENT_STATE =
  process.env.TEAMS_WEBHOOK_CLIENT_STATE || "teams-portal-online";

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Variáveis TEAMS_TENANT_ID, TEAMS_CLIENT_ID e TEAMS_CLIENT_SECRET são obrigatórias.");
  process.exit(1);
}

async function getToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function listSubscriptions(token) {
  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value || [];
}

async function deleteSubscription(token, id) {
  const res = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.status === 204;
}

async function createSubscription(token) {
  // Expiração: 3 dias (limite máximo para /chats/getAllMessages)
  const expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 60000).toISOString();

  const body = {
    changeType: "created",
    notificationUrl: NOTIFICATION_URL,
    lifecycleNotificationUrl: LIFECYCLE_URL,
    resource: "/chats/getAllMessages",
    expirationDateTime: expiration,
    clientState: CLIENT_STATE,
  };

  const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Create error (${res.status}): ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("🔑 Obtendo token do Microsoft Graph...");
  const token = await getToken();
  console.log("✅ Token obtido.");

  console.log("\n📋 Listando subscriptions existentes...");
  const subs = await listSubscriptions(token);
  console.log(`   ${subs.length} subscription(s) encontrada(s).`);

  for (const sub of subs) {
    console.log(`\n🗑️  Deletando subscription: ${sub.id}`);
    console.log(`   Resource: ${sub.resource}`);
    console.log(`   ClientState: ${sub.clientState ?? "(null)"}`);
    console.log(`   NotificationUrl: ${sub.notificationUrl}`);
    const deleted = await deleteSubscription(token, sub.id);
    if (deleted) {
      console.log(`   ✅ Deletada com sucesso.`);
    } else {
      console.warn(`   ⚠️  Não foi possível deletar (pode já ter expirado).`);
    }
  }

  console.log("\n🆕 Criando nova subscription com clientState correto...");
  const newSub = await createSubscription(token);
  console.log(`✅ Subscription criada com sucesso!`);
  console.log(`   ID: ${newSub.id}`);
  console.log(`   Resource: ${newSub.resource}`);
  console.log(`   ClientState: ${newSub.clientState}`);
  console.log(`   NotificationUrl: ${newSub.notificationUrl}`);
  console.log(`   Expira em: ${newSub.expirationDateTime}`);
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
