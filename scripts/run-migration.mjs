/**
 * run-migration.mjs
 * Executa a migração 0021_teams_integration.sql no banco Railway.
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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
  if (process.env[key] === undefined) process.env[key] = val;
}

const connStr = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL;
console.log("Conectando ao banco:", connStr.replace(/:[^:@]+@/, ":****@"));

const conn = await mysql.createConnection(connStr);
console.log("Conectado com sucesso.\n");

const sqlPath = resolve(__dirname, "../drizzle/0021_teams_integration.sql");
const sqlContent = readFileSync(sqlPath, "utf8");

// Remover comentários de linha e separar por ";"
const cleanedSql = sqlContent
  .split("\n")
  .filter(line => !line.trim().startsWith("--"))
  .join("\n");

// Separar statements por ";" seguido de nova linha ou fim de arquivo
const statements = cleanedSql
  .split(/;\s*(?:\n|$)/)
  .map(s => s.trim())
  .filter(s => s.length > 10); // filtrar strings muito curtas

console.log(`Statements encontrados: ${statements.length}\n`);

let ok = 0, skipped = 0, errors = 0;

for (const stmt of statements) {
  const preview = stmt.replace(/\s+/g, " ").slice(0, 70);
  try {
    await conn.execute(stmt);
    console.log(`  ✅ OK      ${preview}`);
    ok++;
  } catch (err) {
    const isAlreadyExists =
      err.code === "ER_TABLE_EXISTS_ERROR" ||
      err.code === "ER_DUP_KEYNAME" ||
      err.message.includes("Duplicate column name") ||
      err.message.includes("already exists") ||
      err.message.includes("Duplicate key name");

    if (isAlreadyExists) {
      console.log(`  ⚠️  SKIP    ${preview}`);
      skipped++;
    } else {
      console.error(`  ❌ ERRO    ${preview}`);
      console.error(`             ${err.message}`);
      errors++;
    }
  }
}

console.log(`\n━━━ Resultado ━━━`);
console.log(`  ✅ Executados: ${ok}`);
console.log(`  ⚠️  Já existiam: ${skipped}`);
console.log(`  ❌ Erros: ${errors}`);

// Verificar resultado final
console.log("\n━━━ Verificação Final ━━━");
const tables = ["teams_subscriptions", "teams_integration_events", "teams_message_ticket_map"];
for (const t of tables) {
  const [rows] = await conn.execute(`SHOW TABLES LIKE '${t}'`);
  console.log(`  ${rows.length > 0 ? "✅" : "❌"}  ${t}: ${rows.length > 0 ? "existe" : "NÃO existe"}`);
}

const [extCol] = await conn.execute("SHOW COLUMNS FROM `requests` LIKE 'externalMessageId'");
console.log(`  ${extCol.length > 0 ? "✅" : "❌"}  requests.externalMessageId: ${extCol.length > 0 ? "existe" : "NÃO existe"}`);

const [metaCol] = await conn.execute("SHOW COLUMNS FROM `requests` LIKE 'metadata'");
console.log(`  ${metaCol.length > 0 ? "✅" : "❌"}  requests.metadata: ${metaCol.length > 0 ? "existe" : "NÃO existe"}`);

await conn.end();
console.log("\nMigração concluída.");
process.exit(errors > 0 ? 1 : 0);
