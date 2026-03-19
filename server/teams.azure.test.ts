/**
 * teams.azure.test.ts
 * Valida as credenciais Azure AD configuradas nas variáveis de ambiente
 * testando a obtenção de um token de acesso do Microsoft Graph.
 */
import { describe, it, expect } from "vitest";
import { getTeamsEnv, getGraphAccessToken } from "./teams";

describe("Azure AD Teams Integration", () => {
  it("deve ter as variáveis de ambiente obrigatórias configuradas", () => {
    const env = getTeamsEnv();
    expect(env.TEAMS_TENANT_ID, "TEAMS_TENANT_ID não configurado").toBeTruthy();
    expect(env.TEAMS_CLIENT_ID, "TEAMS_CLIENT_ID não configurado").toBeTruthy();
    expect(env.TEAMS_CLIENT_SECRET, "TEAMS_CLIENT_SECRET não configurado").toBeTruthy();
    expect(env.TEAMS_NOTIFICATION_URL, "TEAMS_NOTIFICATION_URL não configurado").toBeTruthy();
    expect(env.TEAMS_LIFECYCLE_URL, "TEAMS_LIFECYCLE_URL não configurado").toBeTruthy();
  });

  it("deve obter um token de acesso válido do Microsoft Graph", async () => {
    const env = getTeamsEnv();
    // Pular se credenciais não estão configuradas (CI sem secrets)
    if (!env.TEAMS_TENANT_ID || !env.TEAMS_CLIENT_ID || !env.TEAMS_CLIENT_SECRET) {
      console.warn("Credenciais Azure AD não configuradas — teste ignorado.");
      return;
    }

    const token = await getGraphAccessToken();
    expect(token, "Token não deve ser vazio").toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(50);
    console.log(`✅ Token obtido com sucesso (${token.length} chars)`);
  }, 15_000); // timeout de 15s para chamada de rede
});
