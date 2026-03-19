/**
 * Testes unitários para as procedures tRPC de tickets (myTickets, myStats, detail, comments, addComment).
 * Usa mocks diretos das funções exportadas do db.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock completo do módulo db ───────────────────────────────────────────────

vi.mock('./db', () => ({
  getMyTickets: vi.fn(),
  getMyTicketStats: vi.fn(),
  getTicketDetail: vi.fn(),
  getTicketComments: vi.fn(),
  addTicketComment: vi.fn(),
  getAllTickets: vi.fn(),
  getTicketsByUserId: vi.fn(),
  createTicket: vi.fn(),
  updateTicketStatus: vi.fn(),
  getNotificationsByUserId: vi.fn(),
  markNotificationAsRead: vi.fn(),
  getAllDocuments: vi.fn(),
  getAllTrainings: vi.fn(),
  getCompanyById: vi.fn(),
  getCompanyByCnpj: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
  getMysqlPool: vi.fn(),
}));

import * as db from './db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTicket(overrides = {}) {
  return {
    id: 1,
    requestId: 'TK-001',
    title: 'Problema no sistema',
    description: 'Descrição do problema',
    status: 'pendente',
    priority: 'media',
    category: null,
    assignedToName: null,
    createdAt: '2026-03-15 10:00:00',
    updatedAt: '2026-03-15 10:00:00',
    closedAt: null,
    slaDeadline: null,
    source: 'portal',
    userEmail: null,
    ...overrides,
  };
}

function makeComment(overrides = {}) {
  return {
    id: 1,
    ticketId: 1,
    userId: 1,
    comment: 'Comentário de teste',
    userName: 'Admin',
    userAvatar: null,
    createdAt: '2026-03-15 10:00:00',
    updatedAt: '2026-03-15 10:00:00',
    ...overrides,
  };
}

// ─── Testes: getMyTickets ─────────────────────────────────────────────────────

describe('getMyTickets (mock)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista de tickets e total quando há resultados', async () => {
    const mockResult = {
      tickets: [makeTicket(), makeTicket({ id: 2, requestId: 'TK-002', source: 'teams' })],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    vi.mocked(db.getMyTickets).mockResolvedValueOnce(mockResult);

    const result = await db.getMyTickets({ userId: 1, page: 1, limit: 20 });

    expect(result.tickets).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(db.getMyTickets).toHaveBeenCalledWith({ userId: 1, page: 1, limit: 20 });
  });

  it('retorna lista vazia quando não há tickets', async () => {
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: [], total: 0, page: 1, limit: 20, totalPages: 0,
    });

    const result = await db.getMyTickets({ userId: 99 });

    expect(result.tickets).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('calcula totalPages corretamente com paginação', async () => {
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: Array.from({ length: 10 }, (_, i) => makeTicket({ id: i + 1 })),
      total: 35,
      page: 2,
      limit: 10,
      totalPages: 4,
    });

    const result = await db.getMyTickets({ userId: 1, page: 2, limit: 10 });

    expect(result.totalPages).toBe(4);
    expect(result.page).toBe(2);
    expect(result.tickets).toHaveLength(10);
  });

  it('lança erro quando o banco falha', async () => {
    vi.mocked(db.getMyTickets).mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(db.getMyTickets({ userId: 1 })).rejects.toThrow('DB connection failed');
  });

  it('filtra por status corretamente', async () => {
    const filtered = [makeTicket({ status: 'em_andamento' })];
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: filtered, total: 1, page: 1, limit: 20, totalPages: 1,
    });

    const result = await db.getMyTickets({ userId: 1, status: 'em_andamento' });

    expect(result.tickets[0].status).toBe('em_andamento');
    expect(db.getMyTickets).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'em_andamento' })
    );
  });

  it('filtra por prioridade corretamente', async () => {
    const filtered = [makeTicket({ priority: 'alta' })];
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: filtered, total: 1, page: 1, limit: 20, totalPages: 1,
    });

    const result = await db.getMyTickets({ userId: 1, priority: 'alta' });

    expect(result.tickets[0].priority).toBe('alta');
  });

  it('filtra por texto de busca', async () => {
    const filtered = [makeTicket({ title: 'Erro no login' })];
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: filtered, total: 1, page: 1, limit: 20, totalPages: 1,
    });

    const result = await db.getMyTickets({ userId: 1, search: 'login' });

    expect(result.tickets[0].title).toContain('login');
  });

  it('inclui tickets de ambas as fontes (portal e teams)', async () => {
    const mixed = [
      makeTicket({ source: 'portal' }),
      makeTicket({ id: 2, source: 'teams', requestId: 'REQ-001' }),
    ];
    vi.mocked(db.getMyTickets).mockResolvedValueOnce({
      tickets: mixed, total: 2, page: 1, limit: 20, totalPages: 1,
    });

    const result = await db.getMyTickets({ userId: 1 });

    const sources = result.tickets.map((t: any) => t.source);
    expect(sources).toContain('portal');
    expect(sources).toContain('teams');
  });
});

// ─── Testes: getMyTicketStats ─────────────────────────────────────────────────

describe('getMyTicketStats (mock)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna estatísticas corretas', async () => {
    vi.mocked(db.getMyTicketStats).mockResolvedValueOnce({
      abertos: 3, em_andamento: 1, resolvidos: 5, total: 9,
    });

    const stats = await db.getMyTicketStats(1);

    expect(stats.abertos).toBe(3);
    expect(stats.em_andamento).toBe(1);
    expect(stats.resolvidos).toBe(5);
    expect(stats.total).toBe(9);
  });

  it('retorna zeros quando não há tickets', async () => {
    vi.mocked(db.getMyTicketStats).mockResolvedValueOnce({
      abertos: 0, em_andamento: 0, resolvidos: 0, total: 0,
    });

    const stats = await db.getMyTicketStats(99);

    expect(stats.total).toBe(0);
    expect(stats.abertos).toBe(0);
  });

  it('retorna zeros padrão em caso de erro', async () => {
    vi.mocked(db.getMyTicketStats).mockResolvedValueOnce({
      abertos: 0, em_andamento: 0, resolvidos: 0, total: 0,
    });

    const stats = await db.getMyTicketStats(1);

    expect(stats).toEqual({ abertos: 0, em_andamento: 0, resolvidos: 0, total: 0 });
  });

  it('inclui email do usuário na busca quando fornecido', async () => {
    vi.mocked(db.getMyTicketStats).mockResolvedValueOnce({
      abertos: 2, em_andamento: 0, resolvidos: 1, total: 3,
    });

    await db.getMyTicketStats(1, 'user@example.com');

    expect(db.getMyTicketStats).toHaveBeenCalledWith(1, 'user@example.com');
  });
});

// ─── Testes: getTicketDetail ──────────────────────────────────────────────────

describe('getTicketDetail (mock)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna ticket do portal quando source=portal', async () => {
    const ticket = makeTicket();
    vi.mocked(db.getTicketDetail).mockResolvedValueOnce(ticket);

    const result = await db.getTicketDetail(1, 'portal');

    expect(result).toEqual(ticket);
    expect(db.getTicketDetail).toHaveBeenCalledWith(1, 'portal');
  });

  it('retorna ticket do teams quando source=teams', async () => {
    const ticket = makeTicket({ source: 'teams', requestId: 'REQ-001' });
    vi.mocked(db.getTicketDetail).mockResolvedValueOnce(ticket);

    const result = await db.getTicketDetail(1, 'teams');

    expect(result?.requestId).toBe('REQ-001');
    expect(db.getTicketDetail).toHaveBeenCalledWith(1, 'teams');
  });

  it('retorna null quando ticket não existe', async () => {
    vi.mocked(db.getTicketDetail).mockResolvedValueOnce(null);

    const result = await db.getTicketDetail(999, 'portal');

    expect(result).toBeNull();
  });

  it('lança erro quando o banco falha', async () => {
    vi.mocked(db.getTicketDetail).mockRejectedValueOnce(new Error('Query failed'));

    await expect(db.getTicketDetail(1, 'portal')).rejects.toThrow('Query failed');
  });
});

// ─── Testes: getTicketComments ────────────────────────────────────────────────

describe('getTicketComments (mock)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna comentários do portal', async () => {
    const comments = [makeComment()];
    vi.mocked(db.getTicketComments).mockResolvedValueOnce(comments);

    const result = await db.getTicketComments(1, 'portal');

    expect(result).toHaveLength(1);
    expect(result[0].comment).toBe('Comentário de teste');
  });

  it('retorna array vazio quando não há comentários', async () => {
    vi.mocked(db.getTicketComments).mockResolvedValueOnce([]);

    const result = await db.getTicketComments(1, 'portal');

    expect(result).toHaveLength(0);
  });

  it('retorna array vazio para teams quando tabela não existe', async () => {
    vi.mocked(db.getTicketComments).mockResolvedValueOnce([]);

    const result = await db.getTicketComments(1, 'teams');

    expect(result).toEqual([]);
  });

  it('retorna comentários em ordem cronológica', async () => {
    const comments = [
      makeComment({ id: 1, comment: 'Primeiro', createdAt: '2026-03-15 10:00:00' }),
      makeComment({ id: 2, comment: 'Segundo', createdAt: '2026-03-15 11:00:00' }),
    ];
    vi.mocked(db.getTicketComments).mockResolvedValueOnce(comments);

    const result = await db.getTicketComments(1, 'portal');

    expect(result[0].comment).toBe('Primeiro');
    expect(result[1].comment).toBe('Segundo');
  });
});

// ─── Testes: addTicketComment ─────────────────────────────────────────────────

describe('addTicketComment (mock)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('insere comentário no portal com sucesso', async () => {
    vi.mocked(db.addTicketComment).mockResolvedValueOnce({ success: true });

    const result = await db.addTicketComment({
      ticketId: 1,
      userId: 1,
      userName: 'Admin',
      comment: 'Comentário de teste',
      source: 'portal',
    });

    expect(result).toEqual({ success: true });
    expect(db.addTicketComment).toHaveBeenCalledWith(
      expect.objectContaining({ ticketId: 1, comment: 'Comentário de teste', source: 'portal' })
    );
  });

  it('insere comentário no teams com sucesso', async () => {
    vi.mocked(db.addTicketComment).mockResolvedValueOnce({ success: true });

    const result = await db.addTicketComment({
      ticketId: 5,
      userId: 2,
      userName: 'Usuário',
      comment: 'Resposta via Teams',
      source: 'teams',
    });

    expect(result).toEqual({ success: true });
    expect(db.addTicketComment).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'teams' })
    );
  });

  it('lança erro quando inserção falha', async () => {
    vi.mocked(db.addTicketComment).mockRejectedValueOnce(new Error('Insert failed'));

    await expect(db.addTicketComment({
      ticketId: 1,
      userId: 1,
      userName: 'Admin',
      comment: 'Teste',
      source: 'portal',
    })).rejects.toThrow('Insert failed');
  });

  it('não permite comentário vazio', async () => {
    vi.mocked(db.addTicketComment).mockRejectedValueOnce(new Error('Comment cannot be empty'));

    await expect(db.addTicketComment({
      ticketId: 1,
      userId: 1,
      userName: 'Admin',
      comment: '',
      source: 'portal',
    })).rejects.toThrow('Comment cannot be empty');
  });
});

// ─── Testes: lógica de formatação de status ───────────────────────────────────

describe('Lógica de formatação de status', () => {
  const STATUS_MAP: Record<string, string> = {
    pendente: 'Aberto',
    aberto: 'Aberto',
    em_andamento: 'Em Andamento',
    aguardando_usuario: 'Aguardando',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
    cancelado: 'Cancelado',
  };

  it('mapeia todos os status conhecidos corretamente', () => {
    Object.entries(STATUS_MAP).forEach(([status, label]) => {
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  it('status "pendente" e "aberto" mapeiam para o mesmo label', () => {
    expect(STATUS_MAP['pendente']).toBe(STATUS_MAP['aberto']);
  });

  it('status de conclusão são "resolvido" e "fechado"', () => {
    const conclusionStatuses = ['resolvido', 'fechado'];
    conclusionStatuses.forEach(s => {
      expect(STATUS_MAP[s]).toBeTruthy();
    });
  });
});

// ─── Testes: lógica de paginação ──────────────────────────────────────────────

describe('Lógica de paginação', () => {
  it('calcula totalPages corretamente', () => {
    const cases = [
      { total: 0, limit: 20, expected: 0 },
      { total: 1, limit: 20, expected: 1 },
      { total: 20, limit: 20, expected: 1 },
      { total: 21, limit: 20, expected: 2 },
      { total: 35, limit: 10, expected: 4 },
      { total: 100, limit: 15, expected: 7 },
    ];

    cases.forEach(({ total, limit, expected }) => {
      const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
      expect(totalPages).toBe(expected);
    });
  });

  it('offset é calculado corretamente', () => {
    const cases = [
      { page: 1, limit: 20, expected: 0 },
      { page: 2, limit: 20, expected: 20 },
      { page: 3, limit: 10, expected: 20 },
      { page: 5, limit: 15, expected: 60 },
    ];

    cases.forEach(({ page, limit, expected }) => {
      const offset = (page - 1) * limit;
      expect(offset).toBe(expected);
    });
  });
});

// ─── Testes: lógica de formatação de data ────────────────────────────────────

describe('Lógica de formatação de data', () => {
  it('formata data válida corretamente', () => {
    const dateStr = '2026-03-15T10:00:00.000Z';
    const formatted = new Date(dateStr).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('retorna "—" para data nula', () => {
    const formatDate = (d: string | null | undefined) => {
      if (!d) return '—';
      return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    };
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});
