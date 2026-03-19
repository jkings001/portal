/**
 * Teste de validação das credenciais Azure AD para integração Teams.
 * Verifica se as variáveis de ambiente estão configuradas e se o token Graph é obtido com sucesso.
 */
import { describe, it, expect } from 'vitest';

describe('Teams Azure AD Credentials', () => {
  it('deve ter TEAMS_TENANT_ID configurado', () => {
    expect(process.env.TEAMS_TENANT_ID).toBeTruthy();
    expect(process.env.TEAMS_TENANT_ID).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('deve ter TEAMS_CLIENT_ID configurado', () => {
    expect(process.env.TEAMS_CLIENT_ID).toBeTruthy();
    expect(process.env.TEAMS_CLIENT_ID).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('deve ter TEAMS_CLIENT_SECRET configurado', () => {
    expect(process.env.TEAMS_CLIENT_SECRET).toBeTruthy();
    expect(process.env.TEAMS_CLIENT_SECRET!.length).toBeGreaterThan(10);
  });

  it('deve ter TEAMS_NOTIFICATION_URL configurado', () => {
    expect(process.env.TEAMS_NOTIFICATION_URL).toBeTruthy();
    expect(process.env.TEAMS_NOTIFICATION_URL).toContain('/api/teams/webhook');
  });

  it('deve obter token de acesso do Microsoft Graph', async () => {
    const tenantId = process.env.TEAMS_TENANT_ID;
    const clientId = process.env.TEAMS_CLIENT_ID;
    const clientSecret = process.env.TEAMS_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      console.warn('Variáveis Teams não configuradas — pulando teste de token');
      return;
    }

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    expect(resp.status).toBe(200);
    const data = await resp.json() as any;
    expect(data.access_token).toBeTruthy();
    expect(data.token_type).toBe('Bearer');
    console.log('✅ Token Graph obtido com sucesso');
  }, 15000);
});
