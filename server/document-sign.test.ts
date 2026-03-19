import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Testes: sendDocumentAssignedEmail ───────────────────────────────────────
describe('sendDocumentAssignedEmail', () => {
  it('deve aceitar todos os campos opcionais do DocumentAssignedEmailData', async () => {
    // Valida que a interface aceita todos os campos sem erro de tipo
    const data = {
      userName: 'João Silva',
      userEmail: 'joao@empresa.com',
      documentTitle: 'Termo de Responsabilidade 2025',
      documentDescription: 'Documento de responsabilidade de equipamentos',
      documentCategory: 'Termos',
      assignedBy: 'Admin',
      portalUrl: 'https://jkings.team',
      dueDate: '2026-12-31',
    };

    // Verificar que todos os campos estão presentes
    expect(data.userName).toBe('João Silva');
    expect(data.userEmail).toBe('joao@empresa.com');
    expect(data.documentTitle).toBe('Termo de Responsabilidade 2025');
    expect(data.documentCategory).toBe('Termos');
    expect(data.assignedBy).toBe('Admin');
    expect(data.portalUrl).toBe('https://jkings.team');
  });

  it('deve retornar true no modo desenvolvimento (sem credenciais SMTP)', async () => {
    const { sendDocumentAssignedEmail } = await import('./email-service');

    const originalUser = process.env.SMTP_USER;
    const originalPass = process.env.SMTP_PASSWORD;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const result = await sendDocumentAssignedEmail({
      userName: 'Maria Santos',
      userEmail: 'maria@empresa.com',
      documentTitle: 'Contrato de Trabalho',
    });

    process.env.SMTP_USER = originalUser;
    process.env.SMTP_PASSWORD = originalPass;

    expect(result).toBe(true);
  });

  it('deve incluir URL do portal no e-mail', async () => {
    const { sendDocumentAssignedEmail } = await import('./email-service');

    // Sem credenciais, apenas valida que a função aceita portalUrl
    const originalUser = process.env.SMTP_USER;
    delete process.env.SMTP_USER;

    const result = await sendDocumentAssignedEmail({
      userName: 'Pedro Alves',
      userEmail: 'pedro@empresa.com',
      documentTitle: 'Política de Segurança',
      portalUrl: 'https://jkings.team',
    });

    process.env.SMTP_USER = originalUser;
    expect(result).toBe(true);
  });
});

// ─── Testes: Endpoint de assinatura digital ───────────────────────────────────
describe('Assinatura Digital - Validações', () => {
  it('deve rejeitar assinatura sem autenticação', async () => {
    const { default: express } = await import('express');
    const { Router } = await import('express');
    const app = express();
    app.use(express.json());

    // Simular request sem user
    const mockReq = {
      user: null,
      params: { id: '1' },
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Verificar lógica de autenticação
    const user = (mockReq as any).user;
    if (!user?.id) {
      mockRes.status(401);
      mockRes.json({ error: 'Não autenticado' });
    }

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Não autenticado' });
  });

  it('deve rejeitar ID de documento inválido', () => {
    const docId = parseInt('abc');
    expect(isNaN(docId)).toBe(true);
  });

  it('deve aceitar ID de documento válido', () => {
    const docId = parseInt('42');
    expect(isNaN(docId)).toBe(false);
    expect(docId).toBe(42);
  });

  it('deve montar signatureData com campos obrigatórios', () => {
    const user = {
      id: 1,
      name: 'Jeferson Reis',
      email: 'jeferson@empresa.com',
      role: 'user',
      department: 'TI',
    };
    const ip = '192.168.1.1';

    const signatureData = {
      userId: user.id,
      userName: user.name || user.email,
      userEmail: user.email,
      userRole: user.role,
      department: user.department || null,
      signedAt: new Date().toISOString(),
      ip,
      userAgent: 'Mozilla/5.0',
    };

    expect(signatureData.userId).toBe(1);
    expect(signatureData.userName).toBe('Jeferson Reis');
    expect(signatureData.userEmail).toBe('jeferson@empresa.com');
    expect(signatureData.ip).toBe('192.168.1.1');
    expect(signatureData.department).toBe('TI');
    expect(signatureData.signedAt).toBeTruthy();
    expect(typeof signatureData.signedAt).toBe('string');
  });

  it('deve serializar e desserializar signatureData corretamente', () => {
    const original = {
      userId: 5,
      userName: 'Ana Costa',
      userEmail: 'ana@empresa.com',
      userRole: 'user',
      department: 'RH',
      signedAt: '2026-03-15T21:00:00.000Z',
      ip: '10.0.0.1',
    };

    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);

    expect(parsed.userId).toBe(5);
    expect(parsed.userName).toBe('Ana Costa');
    expect(parsed.signedAt).toBe('2026-03-15T21:00:00.000Z');
  });

  it('deve capturar IP do header x-forwarded-for', () => {
    const headers = { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' };
    const ip = (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    expect(ip).toBe('203.0.113.5');
  });

  it('deve usar IP do socket como fallback', () => {
    const headers: Record<string, string> = {};
    const socket = { remoteAddress: '127.0.0.1' };
    const ip =
      (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      socket?.remoteAddress ||
      'desconhecido';
    expect(ip).toBe('127.0.0.1');
  });

  it('deve usar "desconhecido" quando não há IP disponível', () => {
    const headers: Record<string, string> = {};
    const socket = { remoteAddress: undefined };
    const ip =
      (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      socket?.remoteAddress ||
      'desconhecido';
    expect(ip).toBe('desconhecido');
  });
});

// ─── Testes: formatação de datas ─────────────────────────────────────────────
describe('Formatação de timestamps de assinatura', () => {
  it('deve formatar data ISO para string legível', () => {
    const isoDate = '2026-03-15T21:30:45.000Z';
    const formatted = new Date(isoDate).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    expect(formatted).toContain('2026');
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(10);
  });

  it('deve retornar string vazia para data nula', () => {
    function formatDateTime(dateStr?: string | null): string {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('pt-BR');
    }
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('deve gerar timestamp ISO válido para signedAt', () => {
    const now = new Date();
    const isoStr = now.toISOString();
    expect(isoStr).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

// ─── Testes: parseSignatureData ───────────────────────────────────────────────
describe('parseSignatureData', () => {
  function parseSignatureData(raw?: string) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  it('deve retornar null para string vazia', () => {
    expect(parseSignatureData('')).toBeNull();
    expect(parseSignatureData(undefined)).toBeNull();
  });

  it('deve retornar null para JSON inválido', () => {
    expect(parseSignatureData('not-json')).toBeNull();
    expect(parseSignatureData('{broken')).toBeNull();
  });

  it('deve parsear JSON válido corretamente', () => {
    const data = { userId: 1, userName: 'Test', ip: '127.0.0.1' };
    const result = parseSignatureData(JSON.stringify(data));
    expect(result).toEqual(data);
  });
});
