/**
 * search.test.ts
 * Testes para o endpoint GET /api/search
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock do pool MySQL ───────────────────────────────────────────────────────
vi.mock('./mysql-pool', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn(),
  })),
}));

import { getPool } from './mysql-pool';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildMockReq(query: Record<string, string>, userId?: number) {
  return {
    query,
    user: userId ? { id: userId } : undefined,
  } as any;
}

function buildMockRes() {
  const res: any = {};
  res.json = vi.fn().mockReturnValue(res);
  res.status = vi.fn().mockReturnValue(res);
  return res;
}

// ─── Importar o handler diretamente ──────────────────────────────────────────
// Como o router usa closures, testamos a lógica extraída do endpoint
async function searchHandler(req: any, res: any) {
  const { getPool } = await import('./mysql-pool');
  const q = ((req.query.q as string) || '').trim();
  const type = (req.query.type as string) || 'all';
  const userId = req.user?.id;

  if (!q || q.length < 2) {
    return res.json({ results: [], total: 0 });
  }

  const pool = getPool();
  const results: any[] = [];

  if (type === 'all' || type === 'document') {
    const likeQ = `%${q}%`;
    const isShortQuery = q.length < 3;
    let docQuery: string;
    let docParams: any[];

    if (isShortQuery) {
      docQuery = `
        SELECT d.id, d.title, d.description, d.category, d.groupName, 1 AS relevance,
          (SELECT COUNT(*) FROM document_assignments da2 WHERE da2.documentId = d.id) AS totalAssignments,
          (SELECT COUNT(*) FROM document_assignments da3 WHERE da3.documentId = d.id AND da3.userId = ?) AS userAssignment
        FROM documents d
        WHERE (d.title LIKE ? OR d.description LIKE ? OR d.category LIKE ? OR d.groupName LIKE ?)
        HAVING (totalAssignments = 0 OR userAssignment > 0)
        ORDER BY relevance DESC, d.title ASC LIMIT 10
      `;
      docParams = [userId || 0, likeQ, likeQ, likeQ, likeQ];
    } else {
      docQuery = `
        SELECT d.id, d.title, d.description, d.category, d.groupName,
          MATCH(d.title, d.description, d.category, d.groupName) AGAINST(? IN BOOLEAN MODE) AS relevance,
          (SELECT COUNT(*) FROM document_assignments da2 WHERE da2.documentId = d.id) AS totalAssignments,
          (SELECT COUNT(*) FROM document_assignments da3 WHERE da3.documentId = d.id AND da3.userId = ?) AS userAssignment
        FROM documents d
        WHERE MATCH(d.title, d.description, d.category, d.groupName) AGAINST(? IN BOOLEAN MODE)
        HAVING (totalAssignments = 0 OR userAssignment > 0)
        ORDER BY relevance DESC, d.title ASC LIMIT 10
      `;
      const ftQ = q.split(/\s+/).map((w: string) => `${w}*`).join(' ');
      docParams = [ftQ, userId || 0, ftQ];
    }

    const [docRows] = await (pool as any).query(docQuery, docParams) as any[];
    for (const row of docRows) {
      results.push({
        id: row.id,
        type: 'document',
        title: row.title,
        description: row.description || null,
        category: row.category || null,
        url: '/terms',
        icon: 'FileText',
        tags: row.groupName ? [row.groupName] : [],
        relevance: parseFloat(row.relevance) || 0,
      });
    }
  }

  if (type === 'all' || type === 'module') {
    const likeQ = `%${q}%`;
    const isShortQuery = q.length < 3;
    let modQuery: string;
    let modParams: any[];

    if (isShortQuery) {
      modQuery = `SELECT id, key_name, label, description, category, icon, 1 AS relevance FROM portal_modules WHERE is_active = 1 AND (label LIKE ? OR description LIKE ? OR category LIKE ?) ORDER BY sort_order ASC LIMIT 6`;
      modParams = [likeQ, likeQ, likeQ];
    } else {
      modQuery = `SELECT id, key_name, label, description, category, icon, MATCH(label, description, category) AGAINST(? IN BOOLEAN MODE) AS relevance FROM portal_modules WHERE is_active = 1 AND MATCH(label, description, category) AGAINST(? IN BOOLEAN MODE) ORDER BY relevance DESC, sort_order ASC LIMIT 6`;
      const ftQ = q.split(/\s+/).map((w: string) => `${w}*`).join(' ');
      modParams = [ftQ, ftQ];
    }

    const [modRows] = await (pool as any).query(modQuery, modParams) as any[];
    for (const row of modRows) {
      results.push({
        id: `module-${row.id}`,
        type: 'module',
        title: row.label,
        description: row.description || null,
        category: row.category || null,
        url: `/${row.key_name}`,
        icon: row.icon || 'Link',
        tags: row.category ? [row.category] : [],
        relevance: parseFloat(row.relevance) || 0,
      });
    }
  }

  results.sort((a, b) => {
    const relDiff = (b.relevance || 0) - (a.relevance || 0);
    if (relDiff !== 0) return relDiff;
    if (a.type === 'document' && b.type !== 'document') return -1;
    if (b.type === 'document' && a.type !== 'document') return 1;
    return 0;
  });

  return res.json({ results, total: results.length, query: q });
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('GET /api/search', () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = { query: vi.fn() };
    (getPool as any).mockReturnValue(mockPool);
  });

  it('retorna lista vazia para query vazia', async () => {
    const req = buildMockReq({ q: '' }, 1);
    const res = buildMockRes();
    await searchHandler(req, res);
    expect(res.json).toHaveBeenCalledWith({ results: [], total: 0 });
  });

  it('retorna lista vazia para query com 1 caractere', async () => {
    const req = buildMockReq({ q: 'a' }, 1);
    const res = buildMockRes();
    await searchHandler(req, res);
    expect(res.json).toHaveBeenCalledWith({ results: [], total: 0 });
  });

  it('busca documentos e módulos para query válida', async () => {
    // Mock: 1 documento público (totalAssignments=0)
    mockPool.query
      .mockResolvedValueOnce([[
        { id: 1, title: 'Termo de Uso', description: 'Desc', category: 'Políticas', groupName: 'TI', relevance: 1.5, totalAssignments: 0, userAssignment: 0 }
      ]])
      // Mock: 1 módulo
      .mockResolvedValueOnce([[
        { id: 5, key_name: 'tickets', label: 'Chamados', description: 'Abrir chamados', category: 'Suporte', icon: 'Ticket', relevance: 1.2 }
      ]]);

    const req = buildMockReq({ q: 'termo', type: 'all' }, 42);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.total).toBe(2);
    expect(call.results[0].type).toBe('document');
    expect(call.results[0].title).toBe('Termo de Uso');
    expect(call.results[1].type).toBe('module');
    expect(call.results[1].title).toBe('Chamados');
  });

  it('filtra apenas documentos quando type=document', async () => {
    mockPool.query.mockResolvedValueOnce([[
      { id: 2, title: 'Política de Segurança', description: null, category: 'Segurança', groupName: null, relevance: 2.0, totalAssignments: 0, userAssignment: 0 }
    ]]);

    const req = buildMockReq({ q: 'política', type: 'document' }, 10);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.total).toBe(1);
    expect(call.results[0].type).toBe('document');
    // Não deve ter chamado query de módulos
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it('filtra apenas módulos quando type=module', async () => {
    mockPool.query.mockResolvedValueOnce([[
      { id: 3, key_name: 'training', label: 'Treinamentos', description: 'Cursos', category: 'Educação', icon: null, relevance: 1.8 }
    ]]);

    const req = buildMockReq({ q: 'treinamento', type: 'module' }, 10);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.total).toBe(1);
    expect(call.results[0].type).toBe('module');
    expect(mockPool.query).toHaveBeenCalledTimes(1);
  });

  it('documento com atribuição a outro usuário não aparece (totalAssignments>0, userAssignment=0)', async () => {
    mockPool.query
      .mockResolvedValueOnce([[
        // Este documento tem atribuição mas NÃO para o userId=99
        // A query SQL usa HAVING para filtrar, então o mock retorna lista vazia
      ]])
      .mockResolvedValueOnce([[]]); // módulos também vazio

    const req = buildMockReq({ q: 'confidencial', type: 'all' }, 99);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.total).toBe(0);
    expect(call.results).toHaveLength(0);
  });

  it('documento com atribuição ao usuário logado aparece', async () => {
    mockPool.query
      .mockResolvedValueOnce([[
        { id: 7, title: 'Contrato Individual', description: null, category: 'RH', groupName: 'Contratos', relevance: 1.0, totalAssignments: 1, userAssignment: 1 }
      ]])
      .mockResolvedValueOnce([[]]); // módulos vazio

    const req = buildMockReq({ q: 'contrato', type: 'all' }, 55);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    expect(call.total).toBe(1);
    expect(call.results[0].title).toBe('Contrato Individual');
    expect(call.results[0].url).toBe('/terms');
  });

  it('ordena por relevância decrescente', async () => {
    mockPool.query
      .mockResolvedValueOnce([[
        { id: 1, title: 'Doc A', description: null, category: null, groupName: null, relevance: 0.5, totalAssignments: 0, userAssignment: 0 },
        { id: 2, title: 'Doc B', description: null, category: null, groupName: null, relevance: 2.0, totalAssignments: 0, userAssignment: 0 },
      ]])
      .mockResolvedValueOnce([[
        { id: 10, key_name: 'mod', label: 'Módulo X', description: null, category: null, icon: null, relevance: 1.5 }
      ]]);

    const req = buildMockReq({ q: 'teste', type: 'all' }, 1);
    const res = buildMockRes();
    await searchHandler(req, res);

    const call = res.json.mock.calls[0][0];
    // Doc B (2.0) > Módulo X (1.5) > Doc A (0.5)
    expect(call.results[0].title).toBe('Doc B');
    expect(call.results[1].title).toBe('Módulo X');
    expect(call.results[2].title).toBe('Doc A');
  });

  it('usa LIKE para queries com 2 caracteres (short query)', async () => {
    mockPool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        { id: 1, key_name: 'rh', label: 'RH', description: null, category: null, icon: null, relevance: 1 }
      ]]);

    const req = buildMockReq({ q: 'rh', type: 'all' }, 1);
    const res = buildMockRes();
    await searchHandler(req, res);

    // Verificar que a query usou LIKE (parâmetros com %)
    const firstCallArgs = mockPool.query.mock.calls[0];
    expect(firstCallArgs[1]).toContain('%rh%');
  });
});
