/**
 * Script para verificar subscriptions ativas no Microsoft Graph
 * e diagnosticar o fluxo de recebimento de mensagens do Teams.
 * 
 * Uso: node scripts/check-graph-subscriptions.mjs
 */

import 'dotenv/config';

const TENANT_ID = process.env.TEAMS_TENANT_ID;
const CLIENT_ID = process.env.TEAMS_CLIENT_ID;
const CLIENT_SECRET = process.env.TEAMS_CLIENT_SECRET;

if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Variáveis TEAMS_TENANT_ID, TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET não configuradas');
  process.exit(1);
}

// 1. Obter token de acesso
async function getToken() {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Falha ao obter token: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  return data.access_token;
}

// 2. Listar subscriptions
async function listSubscriptions(token) {
  const resp = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Falha ao listar subscriptions: ${resp.status} ${err}`);
  }

  return resp.json();
}

// 3. Deletar subscription
async function deleteSubscription(token, id) {
  const resp = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return resp.status;
}

// 4. Criar nova subscription
async function createSubscription(token, notificationUrl, lifecycleUrl) {
  const expiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 dias
  const body = {
    changeType: 'created',
    notificationUrl,
    lifecycleNotificationUrl: lifecycleUrl,
    resource: '/chats/getAllMessages',
    expirationDateTime: expiry,
    clientState: process.env.TEAMS_WEBHOOK_CLIENT_STATE || 'teams-portal-online',
  };

  const resp = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  return { status: resp.status, data };
}

// Main
async function main() {
  console.log('🔑 Obtendo token de acesso do Microsoft Graph...');
  const token = await getToken();
  console.log('✅ Token obtido com sucesso\n');

  console.log('📋 Listando subscriptions ativas...');
  const subs = await listSubscriptions(token);
  
  if (!subs.value?.length) {
    console.log('ℹ️  Nenhuma subscription ativa no Graph.\n');
  } else {
    console.log(`📌 ${subs.value.length} subscription(s) encontrada(s):\n`);
    for (const sub of subs.value) {
      console.log(`  ID: ${sub.id}`);
      console.log(`  Resource: ${sub.resource}`);
      console.log(`  Notification URL: ${sub.notificationUrl}`);
      console.log(`  Client State: ${sub.clientState}`);
      console.log(`  Expira em: ${sub.expirationDateTime}`);
      console.log(`  Change Type: ${sub.changeType}`);
      console.log('  ---');
    }
  }

  // Verificar se há subscription com URL errada
  const EXPECTED_NOTIFICATION_URL = process.env.TEAMS_NOTIFICATION_URL || 'https://jkings.team/api/teams/webhook';
  const EXPECTED_LIFECYCLE_URL = process.env.TEAMS_LIFECYCLE_URL || 'https://jkings.team/api/teams/lifecycle';

  console.log(`\n🔍 URL esperada de notificação: ${EXPECTED_NOTIFICATION_URL}`);
  
  const wrongUrlSubs = subs.value?.filter(s => s.notificationUrl !== EXPECTED_NOTIFICATION_URL) || [];
  if (wrongUrlSubs.length > 0) {
    console.log(`\n⚠️  ${wrongUrlSubs.length} subscription(s) com URL INCORRETA:`);
    for (const sub of wrongUrlSubs) {
      console.log(`  ID: ${sub.id} → URL atual: ${sub.notificationUrl}`);
      console.log(`  → Deletando subscription com URL incorreta...`);
      const status = await deleteSubscription(token, sub.id);
      console.log(`  → Status da deleção: ${status}`);
    }
    
    // Criar nova subscription com URL correta
    console.log(`\n🆕 Criando nova subscription com URL correta...`);
    const result = await createSubscription(token, EXPECTED_NOTIFICATION_URL, EXPECTED_LIFECYCLE_URL);
    if (result.status === 201) {
      console.log(`✅ Subscription criada com sucesso!`);
      console.log(`  ID: ${result.data.id}`);
      console.log(`  Expira em: ${result.data.expirationDateTime}`);
    } else {
      console.log(`❌ Falha ao criar subscription: ${result.status}`);
      console.log(JSON.stringify(result.data, null, 2));
    }
  } else if (subs.value?.length > 0) {
    console.log(`\n✅ Todas as subscriptions estão com a URL correta.`);
    
    // Verificar se está expirada
    for (const sub of subs.value) {
      const expiry = new Date(sub.expirationDateTime);
      const now = new Date();
      const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft < 0) {
        console.log(`⚠️  Subscription ${sub.id} EXPIRADA! Deletando e recriando...`);
        await deleteSubscription(token, sub.id);
        const result = await createSubscription(token, EXPECTED_NOTIFICATION_URL, EXPECTED_LIFECYCLE_URL);
        if (result.status === 201) {
          console.log(`✅ Nova subscription criada: ${result.data.id} (expira em ${result.data.expirationDateTime})`);
        }
      } else {
        console.log(`\n✅ Subscription ativa por mais ${hoursLeft.toFixed(1)} horas.`);
      }
    }
  } else {
    // Nenhuma subscription — criar uma nova
    console.log(`\n🆕 Criando nova subscription...`);
    const result = await createSubscription(token, EXPECTED_NOTIFICATION_URL, EXPECTED_LIFECYCLE_URL);
    if (result.status === 201) {
      console.log(`✅ Subscription criada com sucesso!`);
      console.log(`  ID: ${result.data.id}`);
      console.log(`  Expira em: ${result.data.expirationDateTime}`);
    } else {
      console.log(`❌ Falha ao criar subscription: ${result.status}`);
      console.log(JSON.stringify(result.data, null, 2));
    }
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
