import { defineConfig } from "drizzle-kit";

// Prioridade: MYSQL_PUBLIC_URL (Railway público) > DATABASE_URL (fallback) > MYSQL_URL (Railway interno)
const connectionString = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL || process.env.MYSQL_URL;
if (!connectionString) {
  throw new Error("MYSQL_PUBLIC_URL, DATABASE_URL ou MYSQL_URL é obrigatório para rodar comandos drizzle.");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
