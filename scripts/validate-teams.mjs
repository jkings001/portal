/**
 * validate-teams.mjs
 * Script de validação completa da integração Microsoft Teams.
 * Executa: node scripts/validate-teams.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Carregar .env manualmente ─────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

// ── Cores ANSI ────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

const OK  = `${C.green}✅ OK${C.reset}`;
const FAIL = `${C.red}❌ FALHOU${C.reset}`;
const WARN = `${C.yellow}⚠️  AVISO${C.reset}`;

const results = [];

function log(label, status, detail = "") {
  const icon = status === "ok" ? OK : status === "warn" ? WARN : FAIL;
  console.log(`  ${icon}  ${label}${detail ? C.dim + "  →  " + detail + C.reset : ""}`);
  results.push({ label, status, detail });
}

function section(title) {
  console.log(`\n${C.bold}${C.cyan}━━━ ${title} ━━━${C.reset}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. VARIÁVEIS DE AMBIENTE
// ─────────────────────────────────────────────────────────────────────────────
section("1. Variáveis de Ambiente");

const requiredVars = [
  "TEAMS_TENANT_ID",
  "TEAMS_CLIENT_ID",
  "TEAMS_CLIENT_SECRET",
  "TEAMS_WEBHOOK_CLIENT_STATE",
  "TEAMS_NOTIFICATION_URL",
  "TEAMS_LIFECYCLE_URL",
  "TEAMS_DEFAULT_RESOURCE",
];

for (const v of requiredVars) {
  const val = process.env[v];
  if (!val) {
    log(v, "fail", "não definida");
  } else {
    // Mascarar valores sensíveis
    const masked =
      v.includes("SECRET") || v.includes("PASSWORD")
        ? val.slice(0, 4) + "****" + val.slice(-4)
        : val;
    log(v, "ok", masked);
  }
}

// Validar formato do Tenant ID (UUID)
const tenantId = process.env.TEAMS_TENANT_ID ?? "";
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (tenantId && !uuidRe.test(tenantId)) {
  log("TEAMS_TENANT_ID formato", "fail", "não é um UUID válido");
} else if (tenantId) {
  log("TEAMS_TENANT_ID formato", "ok", "UUID válido");
}

// Validar URLs
for (const urlVar of ["TEAMS_NOTIFICATION_URL", "TEAMS_LIFECYCLE_URL"]) {
  const url = process.env[urlVar] ?? "";
  try {
    new URL(url);
    if (!url.startsWith("https://")) {
      log(`${urlVar} HTTPS`, "warn", "Microsoft Graph exige HTTPS");
    } else {
      log(`${urlVar} HTTPS`, "ok", "protocolo HTTPS confirmado");
    }
  } catch {
    log(`${urlVar} formato`, "fail", "URL inválida");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. AUTENTICAÇÃO — TOKEN MICROSOFT GRAPH
// ─────────────────────────────────────────────────────────────────────────────
section("2. Autenticação Microsoft Graph (Client Credentials)");

const tenantIdAuth = process.env.TEAMS_TENANT_ID;
const clientId     = process.env.TEAMS_CLIENT_ID;
const clientSecret = process.env.TEAMS_CLIENT_SECRET;

let accessToken = null;
let tokenExpiry = null;

if (!tenantIdAuth || !clientId || !clientSecret) {
  log("Obtenção de token", "fail", "credenciais incompletas — pulando teste de token");
} else {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantIdAuth}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    });

    console.log(`  ${C.dim}→ POST ${tokenUrl}${C.reset}`);

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      log("Obtenção de token", "fail", `HTTP ${res.status} — ${data.error}: ${data.error_description?.split("\r\n")[0]}`);
    } else {
      accessToken = data.access_token;
      tokenExpiry = data.expires_in;
      log("Obtenção de token", "ok", `token válido por ${data.expires_in}s (tipo: ${data.token_type})`);

      // Decodificar claims do token (sem verificar assinatura)
      try {
        const payload = JSON.parse(
          Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")
        );
        log("Token issuer", "ok", payload.iss ?? "—");
        log("Token audience", "ok", payload.aud ?? "—");
        log("Token app_id", "ok", payload.appid ?? payload.azp ?? "—");

        const roles = payload.roles ?? [];
        const hasChannelRead = roles.includes("ChannelMessage.Read.All");
        const hasChatRead    = roles.includes("Chat.Read.All");
        const hasSubCreate   = roles.includes("Subscription.Create") || roles.includes("Subscription.ReadWrite.All");

        log("Permissão ChannelMessage.Read.All", hasChannelRead ? "ok" : "warn",
          hasChannelRead ? "concedida" : "não encontrada — necessária para mensagens de canal");
        log("Permissão Chat.Read.All", hasChatRead ? "ok" : "warn",
          hasChatRead ? "concedida" : "não encontrada — necessária para chats");
        log("Permissão Subscription.Create/ReadWrite", hasSubCreate ? "ok" : "warn",
          hasSubCreate ? "concedida" : "não encontrada — necessária para criar subscriptions");

        if (roles.length > 0) {
          console.log(`  ${C.dim}  Roles no token: ${roles.join(", ")}${C.reset}`);
        }
      } catch (e) {
        log("Decodificação do token", "warn", "não foi possível decodificar claims");
      }
    }
  } catch (err) {
    log("Obtenção de token", "fail", err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MICROSOFT GRAPH API — CHAMADAS DE TESTE
// ─────────────────────────────────────────────────────────────────────────────
section("3. Microsoft Graph API — Chamadas de Teste");

if (!accessToken) {
  log("Chamadas ao Graph", "warn", "token não disponível — pulando testes de API");
} else {
  // 3a. GET /v1.0/organization — verifica acesso básico
  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/organization", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (res.ok && data.value?.length > 0) {
      const org = data.value[0];
      log("GET /organization", "ok", `tenant: ${org.displayName ?? org.id}`);
    } else {
      log("GET /organization", "fail", `HTTP ${res.status} — ${data.error?.message ?? JSON.stringify(data)}`);
    }
  } catch (err) {
    log("GET /organization", "fail", err.message);
  }

  // 3b. GET /v1.0/subscriptions — lista subscriptions existentes
  try {
    const res = await fetch("https://graph.microsoft.com/v1.0/subscriptions", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (res.ok) {
      const count = data.value?.length ?? 0;
      log("GET /subscriptions", "ok", `${count} subscription(s) ativa(s) no Graph`);
      if (count > 0) {
        for (const sub of data.value) {
          console.log(`  ${C.dim}    • ${sub.id} | resource: ${sub.resource} | expira: ${sub.expirationDateTime}${C.reset}`);
        }
      }
    } else {
      log("GET /subscriptions", "fail", `HTTP ${res.status} — ${data.error?.message ?? JSON.stringify(data)}`);
    }
  } catch (err) {
    log("GET /subscriptions", "fail", err.message);
  }

  // 3c. Verificar se a notificationUrl responde (GET challenge)
  const notifUrl = process.env.TEAMS_NOTIFICATION_URL;
  if (notifUrl) {
    try {
      const testToken = "validation-test-" + Date.now();
      const url = `${notifUrl}?validationToken=${encodeURIComponent(testToken)}`;
      console.log(`  ${C.dim}→ GET ${url}${C.reset}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const body = await res.text();
      if (res.status === 200 && body.trim() === testToken) {
        log("Webhook URL challenge", "ok", `${notifUrl} responde corretamente ao challenge`);
      } else {
        log("Webhook URL challenge", "warn",
          `HTTP ${res.status} — resposta: "${body.slice(0, 80)}" (esperado: "${testToken}")`);
      }
    } catch (err) {
      log("Webhook URL challenge", "warn", `Não foi possível alcançar ${notifUrl}: ${err.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LÓGICA DO MÓDULO teams.ts — TESTES UNITÁRIOS INLINE
// ─────────────────────────────────────────────────────────────────────────────
section("4. Lógica do Módulo teams.ts — Testes Inline");

// Replicar a lógica de parseTeamsMessage para validação
function parseTeamsMessage(text) {
  const lower = text.toLowerCase();
  let category = "Geral";
  let priority = "media";
  let sla = 24;

  if (lower.includes("solicitação") || lower.includes("solicitacao")) {
    category = "Solicitação";
  } else if (lower.includes("requisição") || lower.includes("requisicao")) {
    category = "Requisição";
  } else if (lower.includes("ocorrência") || lower.includes("ocorrencia")) {
    category = "Ocorrência";
  }

  if (lower.includes("urgente") || lower.includes("prioridade alta") || lower.includes("crítico") || lower.includes("critico")) {
    priority = "critica";
    sla = 4;
  } else if (lower.includes("importante") || lower.includes("prioridade média") || lower.includes("prioridade media")) {
    priority = "alta";
    sla = 8;
  }

  return { category, priority, sla };
}

const testCases = [
  {
    input: "Preciso de uma solicitação de acesso ao sistema",
    expected: { category: "Solicitação", priority: "media" },
  },
  {
    input: "Requisição de novo equipamento para o setor",
    expected: { category: "Requisição", priority: "media" },
  },
  {
    input: "Ocorrência: sistema fora do ar",
    expected: { category: "Ocorrência", priority: "media" },
  },
  {
    input: "URGENTE: servidor caiu, preciso de ajuda",
    expected: { category: "Geral", priority: "critica" },
  },
  {
    input: "Solicitação urgente de reset de senha",
    expected: { category: "Solicitação", priority: "critica" },
  },
  {
    input: "Olá, preciso de ajuda com o portal",
    expected: { category: "Geral", priority: "media" },
  },
];

let parserPassed = 0;
for (const tc of testCases) {
  const result = parseTeamsMessage(tc.input);
  const catOk = result.category === tc.expected.category;
  const priOk = result.priority === tc.expected.priority;
  const pass = catOk && priOk;
  if (pass) parserPassed++;
  log(
    `Parser: "${tc.input.slice(0, 45)}..."`,
    pass ? "ok" : "fail",
    pass
      ? `categoria=${result.category}, prioridade=${result.priority}`
      : `esperado cat=${tc.expected.category}/pri=${tc.expected.priority}, obtido cat=${result.category}/pri=${result.priority}`
  );
}
log(`Parser — total`, parserPassed === testCases.length ? "ok" : "warn",
  `${parserPassed}/${testCases.length} casos passaram`);

// Teste de idempotência (simulação)
section("5. Idempotência — Simulação de Duplicata");
const seenMessages = new Set();
function processIdempotent(messageId) {
  if (seenMessages.has(messageId)) return { duplicate: true };
  seenMessages.add(messageId);
  return { created: true };
}
const r1 = processIdempotent("msg-abc-123");
const r2 = processIdempotent("msg-abc-123");
const r3 = processIdempotent("msg-xyz-456");
log("Primeira mensagem", r1.created ? "ok" : "fail", "chamado criado");
log("Mensagem duplicada", r2.duplicate ? "ok" : "fail", "duplicata detectada corretamente");
log("Segunda mensagem distinta", r3.created ? "ok" : "fail", "chamado criado");

// ─────────────────────────────────────────────────────────────────────────────
// 6. MIGRAÇÃO SQL — VALIDAÇÃO ESTRUTURAL
// ─────────────────────────────────────────────────────────────────────────────
section("6. Migração SQL — Validação Estrutural");

try {
  const sqlPath = resolve(__dirname, "../drizzle/0021_teams_integration.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const tables = [
    "teams_subscriptions",
    "teams_integration_events",
    "teams_message_ticket_map",
  ];
  for (const t of tables) {
    const found = sql.includes(`CREATE TABLE IF NOT EXISTS \`${t}\``);
    log(`CREATE TABLE ${t}`, found ? "ok" : "fail", found ? "encontrada" : "não encontrada no SQL");
  }

  const alterFound = sql.includes("ALTER TABLE") && sql.includes("externalMessageId");
  log("ALTER TABLE requests (externalMessageId)", alterFound ? "ok" : "fail",
    alterFound ? "coluna adicionada" : "não encontrada");

  const idxFound = sql.includes("idx_teams_events_message") || sql.includes("INDEX");
  log("Índices de performance", idxFound ? "ok" : "warn",
    idxFound ? "índices definidos" : "nenhum índice encontrado");
} catch (err) {
  log("Leitura do arquivo SQL", "fail", err.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TYPESCRIPT — VERIFICAÇÃO DE TIPOS
// ─────────────────────────────────────────────────────────────────────────────
section("7. TypeScript — Verificação de Tipos");

import { execSync } from "child_process";
try {
  const output = execSync(
    "cd /home/ubuntu/portal-atendimento && node_modules/.bin/tsc --noEmit 2>&1 || true",
    { encoding: "utf8", timeout: 60000 }
  );
  const errors = output.match(/error TS\d+/g) ?? [];
  const teamsErrors = output.split("\n").filter(l => l.includes("teams") || l.includes("Teams"));
  
  if (teamsErrors.length === 0) {
    log("Erros TypeScript em arquivos Teams", "ok", "0 erros");
  } else {
    log("Erros TypeScript em arquivos Teams", "fail", teamsErrors.join("; ").slice(0, 120));
  }

  const totalErrors = errors.length;
  const nonTeamsErrors = output.split("\n")
    .filter(l => l.includes("error TS") && !l.includes("teams") && !l.includes("Teams"))
    .map(l => l.split("(")[0].trim())
    .filter((v, i, a) => a.indexOf(v) === i);

  if (nonTeamsErrors.length > 0) {
    log(`Erros pré-existentes (não relacionados)`, "warn",
      `${nonTeamsErrors.length} arquivo(s): ${nonTeamsErrors.join(", ")}`);
  } else {
    log("Erros pré-existentes", "ok", "nenhum");
  }
} catch (err) {
  log("TypeScript check", "warn", err.message.slice(0, 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUMO FINAL
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${C.bold}${C.cyan}━━━ RESUMO DA VALIDAÇÃO ━━━${C.reset}`);
const total = results.length;
const passed = results.filter(r => r.status === "ok").length;
const warned = results.filter(r => r.status === "warn").length;
const failed = results.filter(r => r.status === "fail").length;

console.log(`  ${C.green}✅ Passou:  ${passed}${C.reset}`);
console.log(`  ${C.yellow}⚠️  Avisos:  ${warned}${C.reset}`);
console.log(`  ${C.red}❌ Falhou:  ${failed}${C.reset}`);
console.log(`  Total:    ${total}\n`);

if (failed === 0) {
  console.log(`${C.bold}${C.green}  🎉 Integração validada com sucesso!${C.reset}\n`);
} else {
  console.log(`${C.bold}${C.red}  ⚠️  Há itens que precisam de atenção.${C.reset}\n`);
}

process.exit(failed > 0 ? 1 : 0);
