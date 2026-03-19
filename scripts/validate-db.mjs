/**
 * validate-db.mjs
 * Valida as tabelas Teams no banco Railway e executa a migração se necessário.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregar .env
const envLines = readFileSync(resolve(__dirname, "../.env"), "utf8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const C = {
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", bold: "\x1b[1m", reset: "\x1b[0m", dim: "\x1b[2m",
};

const OK   = `${C.green}✅ OK${C.reset}`;
const FAIL = `${C.red}❌ FALHOU${C.reset}`;
const WARN = `${C.yellow}⚠️  AVISO${C.reset}`;

function log(label, status, detail = "") {
  const icon = status === "ok" ? OK : status === "warn" ? WARN : FAIL;
  console.log(`  ${icon}  ${label}${detail ? C.dim + "  →  " + detail + C.reset : ""}`);
}

// Conectar ao banco
const connStr = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
if (!connStr) {
  console.error("DATABASE_URL não definida");
  process.exit(1);
}

console.log(`\n${C.bold}${C.cyan}━━━ Validação do Banco de Dados (Railway MySQL) ━━━${C.reset}`);
console.log(`  ${C.dim}Conectando em: ${connStr.replace(/:[^:@]+@/, ":****@")}${C.reset}`);

let conn;
try {
  conn = await mysql.createConnection(connStr);
  log("Conexão MySQL", "ok", "conectado ao Railway");
} catch (err) {
  log("Conexão MySQL", "fail", err.message);
  process.exit(1);
}

// Verificar tabelas Teams
const expectedTables = [
  "teams_subscriptions",
  "teams_integration_events",
  "teams_message_ticket_map",
];

console.log(`\n${C.bold}${C.cyan}━━━ Tabelas Teams ━━━${C.reset}`);
for (const table of expectedTables) {
  try {
    const [rows] = await conn.execute(`SHOW TABLES LIKE '${table}'`);
    if (rows.length > 0) {
      log(`Tabela ${table}`, "ok", "existe no banco");
      // Mostrar colunas
      const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${table}\``);
      const colNames = cols.map(c => c.Field).join(", ");
      console.log(`  ${C.dim}    Colunas: ${colNames}${C.reset}`);
    } else {
      log(`Tabela ${table}`, "warn", "NÃO existe — migração pendente");
    }
  } catch (err) {
    log(`Tabela ${table}`, "fail", err.message);
  }
}

// Verificar coluna externalMessageId na tabela requests
console.log(`\n${C.bold}${C.cyan}━━━ Alterações na Tabela requests ━━━${C.reset}`);
try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM `requests` LIKE 'externalMessageId'");
  if (cols.length > 0) {
    log("Coluna requests.externalMessageId", "ok", `tipo: ${cols[0].Type}, null: ${cols[0].Null}`);
  } else {
    log("Coluna requests.externalMessageId", "warn", "NÃO existe — migração pendente");
  }
} catch (err) {
  log("Coluna requests.externalMessageId", "fail", err.message);
}

try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM `requests` LIKE 'metadata'");
  if (cols.length > 0) {
    log("Coluna requests.metadata", "ok", `tipo: ${cols[0].Type}`);
  } else {
    log("Coluna requests.metadata", "warn", "NÃO existe — migração pendente");
  }
} catch (err) {
  log("Coluna requests.metadata", "fail", err.message);
}

// Verificar índices
console.log(`\n${C.bold}${C.cyan}━━━ Índices Teams ━━━${C.reset}`);
try {
  const [idxRows] = await conn.execute("SHOW INDEX FROM `requests` WHERE Key_name LIKE '%external%'");
  if (idxRows.length > 0) {
    log("Índice UNIQUE em requests.externalMessageId", "ok", `nome: ${idxRows[0].Key_name}`);
  } else {
    log("Índice UNIQUE em requests.externalMessageId", "warn", "não encontrado");
  }
} catch (err) {
  log("Índice UNIQUE em requests.externalMessageId", "warn", err.message);
}

// Executar migração se necessário
console.log(`\n${C.bold}${C.cyan}━━━ Migração SQL ━━━${C.reset}`);
try {
  const sqlPath = resolve(__dirname, "../drizzle/0021_teams_integration.sql");
  const sql = readFileSync(sqlPath, "utf8");
  
  // Separar statements por ";"
  const statements = sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));
  
  console.log(`  ${C.dim}Arquivo: ${sqlPath}${C.reset}`);
  console.log(`  ${C.dim}Statements encontrados: ${statements.length}${C.reset}`);
  
  let executed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
      executed++;
    } catch (err) {
      // Ignorar erros de "já existe" (idempotente)
      if (err.code === "ER_TABLE_EXISTS_ERROR" || 
          err.code === "ER_DUP_KEYNAME" ||
          err.message.includes("Duplicate column") ||
          err.message.includes("already exists")) {
        skipped++;
      } else {
        errors++;
        console.log(`  ${C.yellow}  ⚠️  Statement ignorado: ${err.message.slice(0, 80)}${C.reset}`);
      }
    }
  }
  
  log("Migração executada", errors === 0 ? "ok" : "warn",
    `${executed} executados, ${skipped} já existiam, ${errors} erros`);
} catch (err) {
  log("Leitura/execução da migração", "fail", err.message);
}

// Verificar novamente após migração
console.log(`\n${C.bold}${C.cyan}━━━ Verificação Pós-Migração ━━━${C.reset}`);
for (const table of expectedTables) {
  try {
    const [rows] = await conn.execute(`SHOW TABLES LIKE '${table}'`);
    log(`Tabela ${table}`, rows.length > 0 ? "ok" : "fail",
      rows.length > 0 ? "confirmada no banco" : "ainda não existe");
  } catch (err) {
    log(`Tabela ${table}`, "fail", err.message);
  }
}

try {
  const [cols] = await conn.execute("SHOW COLUMNS FROM `requests` LIKE 'externalMessageId'");
  log("requests.externalMessageId", cols.length > 0 ? "ok" : "fail",
    cols.length > 0 ? "coluna confirmada" : "coluna não encontrada");
} catch (err) {
  log("requests.externalMessageId", "fail", err.message);
}

await conn.end();
console.log(`\n${C.bold}${C.green}  Validação do banco concluída.${C.reset}\n`);
