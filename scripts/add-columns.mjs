/**
 * add-columns.mjs
 * Adiciona colunas externalMessageId e metadata à tabela requests
 * com verificação prévia (compatível com MySQL 5.7+).
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envLines = readFileSync(resolve(__dirname, "../.env"), "utf8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (process.env[key] === undefined) process.env[key] = val;
}

const connStr = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
const conn = await mysql.createConnection(connStr);
console.log("Conectado ao Railway MySQL.\n");

// Verificar versão do MySQL
const [[versionRow]] = await conn.execute("SELECT VERSION() as v");
console.log(`MySQL versão: ${versionRow.v}\n`);

// Helper: adicionar coluna se não existir
async function addColumnIfNotExists(table, column, definition) {
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (cols.length > 0) {
    console.log(`  ⚠️  SKIP    ${table}.${column} já existe`);
    return false;
  }
  await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`  ✅ OK      ALTER TABLE ${table} ADD COLUMN ${column}`);
  return true;
}

// Helper: criar índice se não existir
async function createIndexIfNotExists(table, indexName, columns) {
  const [idxRows] = await conn.execute(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  if (idxRows.length > 0) {
    console.log(`  ⚠️  SKIP    INDEX ${indexName} já existe`);
    return false;
  }
  await conn.execute(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
  console.log(`  ✅ OK      CREATE INDEX ${indexName} ON ${table}(${columns})`);
  return true;
}

console.log("━━━ Adicionando colunas à tabela requests ━━━");
await addColumnIfNotExists("requests", "externalMessageId", "VARCHAR(255) DEFAULT NULL");
await addColumnIfNotExists("requests", "metadata", "JSON DEFAULT NULL");

console.log("\n━━━ Criando índice ━━━");
await createIndexIfNotExists("requests", "requests_externalMessageId_idx", "`externalMessageId`");

// Verificação final
console.log("\n━━━ Verificação Final ━━━");
const [extCol] = await conn.execute(
  "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'externalMessageId'"
);
console.log(`  ${extCol.length > 0 ? "✅" : "❌"}  requests.externalMessageId: ${extCol.length > 0 ? extCol[0].COLUMN_TYPE : "NÃO existe"}`);

const [metaCol] = await conn.execute(
  "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'metadata'"
);
console.log(`  ${metaCol.length > 0 ? "✅" : "❌"}  requests.metadata: ${metaCol.length > 0 ? metaCol[0].COLUMN_TYPE : "NÃO existe"}`);

const [idxCheck] = await conn.execute(
  "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND INDEX_NAME = 'requests_externalMessageId_idx'"
);
console.log(`  ${idxCheck.length > 0 ? "✅" : "❌"}  INDEX requests_externalMessageId_idx: ${idxCheck.length > 0 ? "existe" : "NÃO existe"}`);

await conn.end();
console.log("\nColunas adicionadas com sucesso.");
