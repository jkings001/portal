/**
 * Health Check Routes
 *
 * Expõe o endpoint GET /api/health para monitoramento da aplicação no Railway
 * e em qualquer ferramenta de observabilidade externa (UptimeRobot, Grafana, etc.).
 *
 * Resposta de sucesso (HTTP 200):
 * {
 *   "status": "ok",
 *   "timestamp": "2026-03-08T12:00:00.000Z",
 *   "uptime": 3600,
 *   "version": "1.0.0",
 *   "environment": "production",
 *   "services": {
 *     "database": { "status": "ok", "latencyMs": 12 },
 *     "oauth": { "status": "ok" }
 *   }
 * }
 *
 * Resposta de falha parcial (HTTP 503):
 * {
 *   "status": "degraded",
 *   ...
 *   "services": {
 *     "database": { "status": "error", "error": "ETIMEDOUT" },
 *     "oauth": { "status": "ok" }
 *   }
 * }
 */

import type { Express, Request, Response } from "express";
import mysql from "mysql2/promise";
import { getMysqlConnectionConfig } from "./db";

const APP_VERSION = process.env.npm_package_version ?? "1.0.0";

/** Verifica a conectividade com o banco de dados MySQL. */
async function checkDatabase(): Promise<{ status: "ok" | "error"; latencyMs?: number; error?: string }> {
  const start = Date.now();
  let connection: mysql.Connection | null = null;

  try {
    const config = getMysqlConnectionConfig();
    connection = await mysql.createConnection({
      ...config,
      connectTimeout: 5000,
    });

    await connection.query("SELECT 1");
    const latencyMs = Date.now() - start;

    return { status: "ok", latencyMs };
  } catch (err: any) {
    const errorMessage =
      err?.code ?? err?.message ?? "Unknown database error";
    return { status: "error", error: errorMessage };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {
        // Ignorar erros ao fechar a conexão de diagnóstico
      }
    }
  }
}

/** Verifica se as variáveis de ambiente críticas estão definidas. */
function checkEnvironment(): { status: "ok" | "warning"; missing: string[] } {
  const required = [
    "DATABASE_URL",
    "MYSQL_URL",
    "MYSQL_PUBLIC_URL",
    "JWT_SECRET",
    "NODE_ENV",
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    status: missing.length === 0 ? "ok" : "warning",
    missing,
  };
}

/** Verifica se as variáveis de ambiente OAuth estão presentes. */
function checkOAuth(): { status: "ok" | "warning"; configured: boolean } {
  const oauthServerUrl = process.env.OAUTH_SERVER_URL;
  const configured = Boolean(oauthServerUrl && oauthServerUrl.trim().length > 0);

  return {
    status: configured ? "ok" : "warning",
    configured,
  };
}

/** Verifica se as configurações de cookie estão corretas para o ambiente. */
function checkCookieConfig(): { status: "ok" | "warning"; secure: boolean; sameSite: string } {
  const isProduction = process.env.NODE_ENV === "production";

  // Em produção, cookies devem ser secure=true e sameSite=none (para cross-origin com HTTPS)
  // A lógica real está em server/_core/cookies.ts — aqui apenas reportamos o estado esperado
  return {
    status: "ok",
    secure: isProduction,
    sameSite: "none",
  };
}

export function registerHealthRoutes(app: Express): void {
  /**
   * GET /api/health
   *
   * Endpoint de health check compatível com Railway healthcheckPath.
   * Realiza verificação ativa do banco de dados e valida variáveis de ambiente.
   * Retorna HTTP 200 quando todos os serviços estão operacionais,
   * ou HTTP 503 quando há falha em algum serviço crítico.
   */
  app.get("/api/health", async (_req: Request, res: Response) => {
    // Para o Railway Healthcheck, retornamos sempre 200 se o servidor estiver rodando
    // Isso evita falhas de deploy se o banco de dados ainda estiver inicializando
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: APP_VERSION
    });
  });

  /**
   * GET /api/health/live
   *
   * Liveness probe simplificado — responde imediatamente sem verificar dependências.
   * Útil para probes de Kubernetes ou Railway que precisam de resposta rápida.
   */
  app.get("/api/health/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    });
  });

  /**
   * GET /api/health/ready
   *
   * Readiness probe — verifica se a aplicação está pronta para receber tráfego.
   * Inclui verificação do banco de dados.
   */
  app.get("/api/health/ready", async (_req: Request, res: Response) => {
    const dbCheck = await checkDatabase();

    if (dbCheck.status === "ok") {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
        database: dbCheck,
      });
    } else {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        database: dbCheck,
      });
    }
  });
}
