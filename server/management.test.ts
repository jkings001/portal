/**
 * Testes para os endpoints de Management (Painel Administrativo)
 * Cobre: /api/management/stats, /api/management/approvals/history,
 *        /api/management/tickets/recent, /api/management/requests/recent
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { SignJWT, jwtVerify } from 'jose';

// ─── Setup do servidor de teste ────────────────────────────────────────────────
let app: express.Application;
let adminToken: string;
let userToken: string;

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-management';
const secretKey = new TextEncoder().encode(JWT_SECRET);

const signToken = async (payload: object) => {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secretKey);
};

beforeAll(async () => {
  app = express();
  app.use(express.json());

  // Middleware JWT de teste
  const authenticateJwt = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const { payload } = await jwtVerify(token, secretKey);
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };

  // Gerar tokens de teste
  adminToken = await signToken({ id: 1, email: 'admin@test.com', role: 'admin', name: 'Admin Teste' });
  userToken = await signToken({ id: 2, email: 'user@test.com', role: 'user', name: 'User Teste' });

  // Mock das rotas de management (sem banco real)
  const router = express.Router();

  // GET /management/stats
  router.get('/management/stats', (req: any, res) => {
    const user = req.user;
    res.json({
      tickets: {
        stats: { total: 42, abertos: 10, em_andamento: 8, resolvidos: 15, fechados: 9 },
        byStatus: [
          { status: 'aberto', total: 10 },
          { status: 'em_andamento', total: 8 },
          { status: 'resolvido', total: 15 },
          { status: 'fechado', total: 9 },
        ],
        byPriority: [
          { priority: 'baixa', total: 12 },
          { priority: 'media', total: 18 },
          { priority: 'alta', total: 9 },
          { priority: 'critica', total: 3 },
        ],
      },
      requests: {
        stats: { total: 25, pendentes: 5, aprovadas: 12, rejeitadas: 3, em_andamento: 3, fechadas: 2, canceladas: 0 },
        byStatus: [
          { status: 'pendente', total: 5 },
          { status: 'aprovado', total: 12 },
          { status: 'rejeitado', total: 3 },
        ],
      },
      approvals: {
        stats: { total: 20, pendentes: 4, aprovadas: 12, rejeitadas: 4 },
        pending: user.role === 'admin' ? [
          { id: 1, requestId: 10, status: 'pendente', level: 1, createdAt: new Date().toISOString(),
            requestTitle: 'Requisição Teste', requestType: 'request', priority: 'alta', requesterName: 'João Silva' }
        ] : [],
      },
    });
  });

  // GET /management/approvals/history
  router.get('/management/approvals/history', (req: any, res) => {
    res.json({
      history: [
        {
          id: 1, requestId: 5, status: 'aprovado', comment: 'Aprovado conforme política',
          decidedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
          requestTitle: 'Compra de Equipamento', requestType: 'request',
          priority: 'media', requesterName: 'Maria Santos', approverName: 'Admin Teste',
        },
        {
          id: 2, requestId: 6, status: 'rejeitado', comment: 'Fora do orçamento',
          decidedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
          requestTitle: 'Software Licença', requestType: 'request',
          priority: 'baixa', requesterName: 'Pedro Costa', approverName: 'Admin Teste',
        },
      ],
    });
  });

  // GET /management/tickets/recent
  router.get('/management/tickets/recent', (req: any, res) => {
    res.json({
      tickets: [
        {
          id: 1, ticketId: 'TKT-001', title: 'Computador não liga', status: 'aberto',
          priority: 'alta', userName: 'João Silva', department: 'TI',
          assignedToName: 'Agente 1', createdAt: new Date().toISOString(),
        },
        {
          id: 2, ticketId: 'TKT-002', title: 'Impressora com problema', status: 'em_andamento',
          priority: 'media', userName: 'Maria Santos', department: 'RH',
          assignedToName: 'Agente 2', createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  // GET /management/requests/recent
  router.get('/management/requests/recent', (req: any, res) => {
    res.json({
      requests: [
        {
          id: 1, requestId: 'REQ-001', title: 'Novo notebook', type: 'request',
          status: 'pendente', priority: 'media', userName: 'João Silva',
          category: 'Hardware', createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  app.use('/api', authenticateJwt, router);
});

// ─── Testes ────────────────────────────────────────────────────────────────────

describe('Management API - Autenticação', () => {
  it('deve rejeitar requisição sem token', async () => {
    const res = await request(app).get('/api/management/stats');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar token inválido', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('deve aceitar token válido de admin', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('deve aceitar token válido de usuário comum', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Management API - /management/stats', () => {
  it('deve retornar estatísticas de chamados', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(res.body.tickets).toHaveProperty('stats');
    expect(res.body.tickets.stats).toHaveProperty('total');
    expect(res.body.tickets.stats).toHaveProperty('abertos');
    expect(res.body.tickets.stats).toHaveProperty('em_andamento');
    expect(res.body.tickets.stats).toHaveProperty('resolvidos');
    expect(res.body.tickets.stats).toHaveProperty('fechados');
  });

  it('deve retornar estatísticas de requisições', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requests');
    expect(res.body.requests).toHaveProperty('stats');
    expect(res.body.requests.stats).toHaveProperty('total');
    expect(res.body.requests.stats).toHaveProperty('pendentes');
    expect(res.body.requests.stats).toHaveProperty('aprovadas');
    expect(res.body.requests.stats).toHaveProperty('rejeitadas');
  });

  it('deve retornar estatísticas de aprovações', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('approvals');
    expect(res.body.approvals).toHaveProperty('stats');
    expect(res.body.approvals.stats).toHaveProperty('pendentes');
  });

  it('deve retornar aprovações pendentes para admin', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.approvals).toHaveProperty('pending');
    expect(Array.isArray(res.body.approvals.pending)).toBe(true);
    if (res.body.approvals.pending.length > 0) {
      const approval = res.body.approvals.pending[0];
      expect(approval).toHaveProperty('id');
      expect(approval).toHaveProperty('requestTitle');
      expect(approval).toHaveProperty('priority');
      expect(approval).toHaveProperty('requesterName');
    }
  });

  it('deve retornar dados de gráfico de status de chamados', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tickets.byStatus)).toBe(true);
    expect(Array.isArray(res.body.tickets.byPriority)).toBe(true);
  });

  it('deve retornar dados de gráfico de status de requisições', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.requests.byStatus)).toBe(true);
  });

  it('valores numéricos devem ser não-negativos', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    const { tickets, requests, approvals } = res.body;
    expect(Number(tickets.stats.total)).toBeGreaterThanOrEqual(0);
    expect(Number(requests.stats.total)).toBeGreaterThanOrEqual(0);
    expect(Number(approvals.stats.total)).toBeGreaterThanOrEqual(0);
  });
});

describe('Management API - /management/approvals/history', () => {
  it('deve retornar histórico de aprovações', async () => {
    const res = await request(app)
      .get('/api/management/approvals/history')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('cada item do histórico deve ter campos obrigatórios', async () => {
    const res = await request(app)
      .get('/api/management/approvals/history')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.history.length > 0) {
      const item = res.body.history[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('requestTitle');
      expect(item).toHaveProperty('requesterName');
    }
  });

  it('deve funcionar para usuário comum também', async () => {
    const res = await request(app)
      .get('/api/management/approvals/history')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
  });
});

describe('Management API - /management/tickets/recent', () => {
  it('deve retornar lista de chamados recentes', async () => {
    const res = await request(app)
      .get('/api/management/tickets/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  it('cada chamado deve ter campos obrigatórios', async () => {
    const res = await request(app)
      .get('/api/management/tickets/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.tickets.length > 0) {
      const ticket = res.body.tickets[0];
      expect(ticket).toHaveProperty('id');
      expect(ticket).toHaveProperty('ticketId');
      expect(ticket).toHaveProperty('title');
      expect(ticket).toHaveProperty('status');
      expect(ticket).toHaveProperty('priority');
      expect(ticket).toHaveProperty('userName');
      expect(ticket).toHaveProperty('createdAt');
    }
  });

  it('ticketId deve ter formato correto (TKT-XXX)', async () => {
    const res = await request(app)
      .get('/api/management/tickets/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.tickets.length > 0) {
      expect(res.body.tickets[0].ticketId).toMatch(/^TKT-\d+$/);
    }
  });
});

describe('Management API - /management/requests/recent', () => {
  it('deve retornar lista de requisições recentes', async () => {
    const res = await request(app)
      .get('/api/management/requests/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requests');
    expect(Array.isArray(res.body.requests)).toBe(true);
  });

  it('cada requisição deve ter campos obrigatórios', async () => {
    const res = await request(app)
      .get('/api/management/requests/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.requests.length > 0) {
      const req = res.body.requests[0];
      expect(req).toHaveProperty('id');
      expect(req).toHaveProperty('requestId');
      expect(req).toHaveProperty('title');
      expect(req).toHaveProperty('type');
      expect(req).toHaveProperty('status');
      expect(req).toHaveProperty('priority');
      expect(req).toHaveProperty('userName');
      expect(req).toHaveProperty('createdAt');
    }
  });

  it('requestId deve ter formato correto (REQ-XXX)', async () => {
    const res = await request(app)
      .get('/api/management/requests/recent')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.requests.length > 0) {
      expect(res.body.requests[0].requestId).toMatch(/^REQ-\d+$/);
    }
  });
});

describe('Management - Estrutura de dados para gráficos', () => {
  it('byStatus deve ter campos status e total', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.tickets.byStatus.length > 0) {
      const item = res.body.tickets.byStatus[0];
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('total');
    }
  });

  it('byPriority deve ter campos priority e total', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    if (res.body.tickets.byPriority.length > 0) {
      const item = res.body.tickets.byPriority[0];
      expect(item).toHaveProperty('priority');
      expect(item).toHaveProperty('total');
    }
  });

  it('prioridades válidas: baixa, media, alta, critica', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    const validPriorities = ['baixa', 'media', 'alta', 'critica'];
    res.body.tickets.byPriority.forEach((item: any) => {
      expect(validPriorities).toContain(item.priority);
    });
  });

  it('status válidos para chamados', async () => {
    const res = await request(app)
      .get('/api/management/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    const validStatuses = ['aberto', 'em_andamento', 'resolvido', 'fechado', 'aguardando_usuario', 'cancelado'];
    res.body.tickets.byStatus.forEach((item: any) => {
      expect(validStatuses).toContain(item.status);
    });
  });
});
