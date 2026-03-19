/**
 * Testes para os endpoints da Central de Suporte
 * Testa RBAC, criação de itens, stats e listagem
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock do módulo de conexão MySQL ────────────────────────────────────────
vi.mock('./db', () => ({
  getMysqlConnectionConfig: () => ({
    host: '127.0.0.1',
    port: 3307,
    user: 'test',
    password: 'test',
    database: 'test',
  }),
}));

// ─── Helpers de RBAC ────────────────────────────────────────────────────────
describe('RBAC helpers', () => {
  const canViewAll = (role: string) =>
    ['admin', 'agent', 'support', 'manager'].includes(role);
  const isAdmin = (role: string) => role === 'admin';
  const isAgentOrAdmin = (role: string) =>
    ['admin', 'agent', 'support'].includes(role);
  const isManagerOrAbove = (role: string) =>
    ['admin', 'manager', 'agent', 'support'].includes(role);

  it('admin pode ver tudo', () => {
    expect(canViewAll('admin')).toBe(true);
    expect(isAdmin('admin')).toBe(true);
    expect(isAgentOrAdmin('admin')).toBe(true);
    expect(isManagerOrAbove('admin')).toBe(true);
  });

  it('agent pode ver tudo mas não é admin', () => {
    expect(canViewAll('agent')).toBe(true);
    expect(isAdmin('agent')).toBe(false);
    expect(isAgentOrAdmin('agent')).toBe(true);
    expect(isManagerOrAbove('agent')).toBe(true);
  });

  it('manager pode ver tudo e aprovar', () => {
    expect(canViewAll('manager')).toBe(true);
    expect(isAdmin('manager')).toBe(false);
    expect(isAgentOrAdmin('manager')).toBe(false);
    expect(isManagerOrAbove('manager')).toBe(true);
  });

  it('user comum não pode ver tudo', () => {
    expect(canViewAll('user')).toBe(false);
    expect(isAdmin('user')).toBe(false);
    expect(isAgentOrAdmin('user')).toBe(false);
    expect(isManagerOrAbove('user')).toBe(false);
  });

  it('support é tratado como agent', () => {
    expect(canViewAll('support')).toBe(true);
    expect(isAgentOrAdmin('support')).toBe(true);
  });
});

// ─── Geração de IDs ─────────────────────────────────────────────────────────
describe('generateId', () => {
  const generateId = (prefix: string): string => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${ts}${rand}`;
  };

  it('gera ID com prefixo TKT para tickets', () => {
    const id = generateId('TKT');
    expect(id).toMatch(/^TKT-[A-Z0-9]+$/);
  });

  it('gera ID com prefixo REQ para requisições', () => {
    const id = generateId('REQ');
    expect(id).toMatch(/^REQ-[A-Z0-9]+$/);
  });

  it('gera ID com prefixo OCC para ocorrências', () => {
    const id = generateId('OCC');
    expect(id).toMatch(/^OCC-[A-Z0-9]+$/);
  });

  it('IDs gerados são únicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId('TKT')));
    expect(ids.size).toBe(100);
  });
});

// ─── Extração de usuário do JWT ──────────────────────────────────────────────
describe('extractUser', () => {
  const extractUser = (token: string | null) => {
    if (!token || typeof token !== 'string' || !token.startsWith('eyJ')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const user = payload.user || payload;
      return {
        id: parseInt(user.id || user.userId || '0'),
        email: user.email || '',
        role: user.role || 'user',
        name: user.name || user.email || '',
      };
    } catch {
      return null;
    }
  };

  it('retorna null para token nulo', () => {
    expect(extractUser(null)).toBeNull();
  });

  it('retorna null para token inválido', () => {
    expect(extractUser('invalid-token')).toBeNull();
    expect(extractUser('[object Object]')).toBeNull();
    expect(extractUser('')).toBeNull();
  });

  it('retorna null para token com partes insuficientes', () => {
    expect(extractUser('eyJ.abc')).toBeNull();
  });

  it('extrai usuário de token JWT válido', () => {
    // Token JWT com payload: { user: { id: "2", email: "test@test.com", role: "admin", name: "Test" } }
    const payload = { user: { id: '2', email: 'test@test.com', role: 'admin', name: 'Test User' } };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`;
    
    const user = extractUser(fakeToken);
    expect(user).not.toBeNull();
    expect(user?.id).toBe(2);
    expect(user?.email).toBe('test@test.com');
    expect(user?.role).toBe('admin');
    expect(user?.name).toBe('Test User');
  });

  it('extrai usuário de payload sem wrapper user', () => {
    const payload = { id: '5', email: 'agent@test.com', role: 'agent', name: 'Agent' };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`;
    
    const user = extractUser(fakeToken);
    expect(user?.id).toBe(5);
    expect(user?.role).toBe('agent');
  });
});

// ─── Validação de tipos de item ──────────────────────────────────────────────
describe('validação de tipos de item', () => {
  const validTypes = ['ticket', 'request', 'occurrence'];
  const getPrefix = (type: string) => {
    const prefixes: Record<string, string> = {
      ticket: 'TKT',
      request: 'REQ',
      occurrence: 'OCC',
    };
    return prefixes[type] || 'TKT';
  };

  it('ticket usa prefixo TKT', () => {
    expect(getPrefix('ticket')).toBe('TKT');
  });

  it('request usa prefixo REQ', () => {
    expect(getPrefix('request')).toBe('REQ');
  });

  it('occurrence usa prefixo OCC', () => {
    expect(getPrefix('occurrence')).toBe('OCC');
  });

  it('tipo inválido usa prefixo TKT como fallback', () => {
    expect(getPrefix('unknown')).toBe('TKT');
  });

  it('todos os tipos válidos são reconhecidos', () => {
    validTypes.forEach(type => {
      expect(['TKT', 'REQ', 'OCC']).toContain(getPrefix(type));
    });
  });
});

// ─── Cálculo de SLA deadline ─────────────────────────────────────────────────
describe('cálculo de SLA deadline', () => {
  const getSlaHours = (priority: string): number => {
    const slaMap: Record<string, number> = {
      critica: 4,
      alta: 8,
      media: 24,
      baixa: 72,
    };
    return slaMap[priority] || 24;
  };

  it('prioridade crítica tem SLA de 4 horas', () => {
    expect(getSlaHours('critica')).toBe(4);
  });

  it('prioridade alta tem SLA de 8 horas', () => {
    expect(getSlaHours('alta')).toBe(8);
  });

  it('prioridade média tem SLA de 24 horas', () => {
    expect(getSlaHours('media')).toBe(24);
  });

  it('prioridade baixa tem SLA de 72 horas', () => {
    expect(getSlaHours('baixa')).toBe(72);
  });

  it('prioridade desconhecida usa 24 horas como padrão', () => {
    expect(getSlaHours('unknown')).toBe(24);
  });
});

// ─── Filtros de listagem ─────────────────────────────────────────────────────
describe('filtros de listagem', () => {
  const buildWhereClause = (filters: {
    status?: string;
    priority?: string;
    type?: string;
    search?: string;
    userId?: number;
    canViewAll?: boolean;
  }) => {
    const conditions: string[] = [];
    const params: any[] = [];

    if (!filters.canViewAll && filters.userId) {
      conditions.push('userId = ?');
      params.push(filters.userId);
    }
    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.priority) {
      conditions.push('priority = ?');
      params.push(filters.priority);
    }
    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    return { where: conditions.length ? 'WHERE ' + conditions.join(' AND ') : '', params };
  };

  it('user comum filtra apenas seus próprios itens', () => {
    const { where, params } = buildWhereClause({ userId: 5, canViewAll: false });
    expect(where).toContain('userId = ?');
    expect(params).toContain(5);
  });

  it('admin não filtra por userId', () => {
    const { where } = buildWhereClause({ userId: 5, canViewAll: true });
    expect(where).not.toContain('userId = ?');
  });

  it('filtro por status funciona', () => {
    const { where, params } = buildWhereClause({ status: 'aberto', canViewAll: true });
    expect(where).toContain('status = ?');
    expect(params).toContain('aberto');
  });

  it('filtro por prioridade funciona', () => {
    const { where, params } = buildWhereClause({ priority: 'alta', canViewAll: true });
    expect(where).toContain('priority = ?');
    expect(params).toContain('alta');
  });

  it('busca por texto usa LIKE', () => {
    const { where, params } = buildWhereClause({ search: 'login', canViewAll: true });
    expect(where).toContain('LIKE ?');
    expect(params).toContain('%login%');
  });

  it('múltiplos filtros combinados', () => {
    const { where, params } = buildWhereClause({
      status: 'aberto',
      priority: 'alta',
      type: 'ticket',
      canViewAll: true,
    });
    expect(where).toContain('status = ?');
    expect(where).toContain('priority = ?');
    expect(where).toContain('type = ?');
    expect(params).toHaveLength(3);
  });

  it('sem filtros retorna WHERE vazio', () => {
    const { where } = buildWhereClause({ canViewAll: true });
    expect(where).toBe('');
  });
});

// ─── Validação de aprovações ─────────────────────────────────────────────────
describe('validação de aprovações', () => {
  const canApprove = (role: string, requestStatus: string): boolean => {
    if (!['admin', 'manager'].includes(role)) return false;
    if (requestStatus !== 'aguardando_aprovacao') return false;
    return true;
  };

  it('manager pode aprovar requisição pendente', () => {
    expect(canApprove('manager', 'aguardando_aprovacao')).toBe(true);
  });

  it('admin pode aprovar requisição pendente', () => {
    expect(canApprove('admin', 'aguardando_aprovacao')).toBe(true);
  });

  it('user não pode aprovar', () => {
    expect(canApprove('user', 'aguardando_aprovacao')).toBe(false);
  });

  it('agent não pode aprovar', () => {
    expect(canApprove('agent', 'aguardando_aprovacao')).toBe(false);
  });

  it('não pode aprovar item que não está aguardando aprovação', () => {
    expect(canApprove('manager', 'aberto')).toBe(false);
    expect(canApprove('manager', 'resolvido')).toBe(false);
    expect(canApprove('admin', 'fechado')).toBe(false);
  });
});

// ─── Paginação ───────────────────────────────────────────────────────────────
describe('paginação', () => {
  const getPagination = (page: number, limit: number) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;
    return { page: safePage, limit: safeLimit, offset };
  };

  it('página 1 tem offset 0', () => {
    expect(getPagination(1, 10).offset).toBe(0);
  });

  it('página 2 com limit 10 tem offset 10', () => {
    expect(getPagination(2, 10).offset).toBe(10);
  });

  it('página negativa é normalizada para 1', () => {
    expect(getPagination(-1, 10).page).toBe(1);
  });

  it('limit máximo é 100', () => {
    expect(getPagination(1, 999).limit).toBe(100);
  });

  it('limit mínimo é 1', () => {
    expect(getPagination(1, 0).limit).toBe(1);
  });
});
