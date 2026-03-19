import { Router, Request, Response } from 'express';
import { getDb, resetDbConnection } from './db';
import { sql } from 'drizzle-orm';

/** Executa uma query com reconexão automática em caso de conexão perdida */
async function executeWithReconnect(queryFn: (db: any) => Promise<any>): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');
    try {
      return await queryFn(db);
    } catch (err: any) {
      const isConnErr = err?.message?.includes('Connection lost') ||
        err?.message?.includes('server closed') ||
        err?.message?.includes('ETIMEDOUT') ||
        err?.message?.includes('ECONNRESET') ||
        err?.code === 'PROTOCOL_CONNECTION_LOST';
      if (isConnErr && attempt === 0) {
        console.warn('[management-routes] Conexão perdida, reconectando...');
        resetDbConnection();
        continue;
      }
      throw err;
    }
  }
}

const router = Router();

/** Converte BigInt/string para number com segurança */
function toNum(v: any): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

/** Normaliza uma linha de stats convertendo todos os campos para number */
function normalizeStats(row: any): Record<string, number> {
  if (!row) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = toNum(v);
  }
  return out;
}

// ============================================================
// GET /api/management/stats
// Retorna indicadores de chamados, requisições e aprovações
// Todos os chamados (ticket/request/occurrence) estão em `requests`
// ============================================================
router.get('/management/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const isUser = userRole === 'user';

    // ── Indicadores de Chamados (type = 'ticket') ──────────────
    const [ticketStatsRaw] = await executeWithReconnect(db => db.execute(sql`
      SELECT
        COUNT(*)                                                                      AS total,
        SUM(CASE WHEN status = 'aberto'       THEN 1 ELSE 0 END)                    AS abertos,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END)                    AS em_andamento,
        SUM(CASE WHEN status = 'resolvido'    THEN 1 ELSE 0 END)                    AS resolvidos,
        SUM(CASE WHEN status = 'fechado'      THEN 1 ELSE 0 END)                    AS fechados,
        SUM(CASE WHEN priority = 'critica'    THEN 1 ELSE 0 END)                    AS criticos,
        SUM(CASE WHEN assignedToId IS NULL AND status NOT IN ('fechado','resolvido') THEN 1 ELSE 0 END) AS sem_atribuicao
      FROM requests
      WHERE type = 'ticket'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
    `));

    // Gráfico de status de chamados
    const [ticketsByStatus] = await executeWithReconnect(db => db.execute(sql`
      SELECT status, COUNT(*) AS total
      FROM requests
      WHERE type = 'ticket'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
      GROUP BY status
    `));
    // Gráfico de prioridade de chamados
    const [ticketsByPriority] = await executeWithReconnect(db => db.execute(sql`
      SELECT priority, COUNT(*) AS total
      FROM requests
      WHERE type = 'ticket'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
      GROUP BY priority
    `));

    // ── Indicadores de Requisições (type = 'request') ──────────
    const [requestStatsRaw] = await executeWithReconnect(db => db.execute(sql`
      SELECT
        COUNT(*)                                                                                          AS total,
        SUM(CASE WHEN status IN ('aberto','em_analise','aguardando_aprovacao') THEN 1 ELSE 0 END)        AS pendentes,
        SUM(CASE WHEN status = 'aprovado'                                      THEN 1 ELSE 0 END)        AS aprovadas,
        SUM(CASE WHEN status = 'rejeitado'                                     THEN 1 ELSE 0 END)        AS rejeitadas,
        SUM(CASE WHEN status IN ('em_andamento','resolvido')                   THEN 1 ELSE 0 END)        AS em_andamento,
        SUM(CASE WHEN status = 'fechado'                                       THEN 1 ELSE 0 END)        AS fechadas,
        SUM(CASE WHEN status = 'cancelado'                                     THEN 1 ELSE 0 END)        AS canceladas
      FROM requests
      WHERE type = 'request'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
    `));

    // Gráfico de status de requisições
    const [requestsByStatus] = await executeWithReconnect(db => db.execute(sql`
      SELECT status, COUNT(*) AS total
      FROM requests
      WHERE type = 'request'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
      GROUP BY status
    `));

    // ── Indicadores de Ocorrências (type = 'occurrence') ───────
    const [occurrenceStatsRaw] = await executeWithReconnect(db => db.execute(sql`
      SELECT
        COUNT(*)                                                                      AS total,
        SUM(CASE WHEN status = 'aberto'       THEN 1 ELSE 0 END)                    AS abertas,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END)                    AS em_andamento,
        SUM(CASE WHEN status = 'resolvido'    THEN 1 ELSE 0 END)                    AS resolvidas,
        SUM(CASE WHEN status = 'fechado'      THEN 1 ELSE 0 END)                    AS fechadas
      FROM requests
      WHERE type = 'occurrence'
      ${isUser ? sql`AND userId = ${userId}` : sql``}
    `));

    // ── Totais gerais (todos os tipos) ─────────────────────────
    const [allStatsRaw] = await executeWithReconnect(db => db.execute(sql`
      SELECT
        COUNT(*)                                                                      AS total,
        SUM(CASE WHEN status = 'aberto'       THEN 1 ELSE 0 END)                    AS abertos,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END)                    AS em_andamento,
        SUM(CASE WHEN status = 'resolvido'    THEN 1 ELSE 0 END)                    AS resolvidos,
        SUM(CASE WHEN status = 'fechado'      THEN 1 ELSE 0 END)                    AS fechados
      FROM requests
      ${isUser ? sql`WHERE userId = ${userId}` : sql``}
    `));

    // ── Totais por tipo ────────────────────────────────────────
    const [requestsByType] = await executeWithReconnect(db => db.execute(sql`
      SELECT type, COUNT(*) AS total
      FROM requests
      ${isUser ? sql`WHERE userId = ${userId}` : sql``}
      GROUP BY type
    `));

    // ── Indicadores de Aprovações ──────────────────────────────
    const [approvalStatsRaw] = await executeWithReconnect(db => db.execute(sql`
      SELECT
        COUNT(*)                                                         AS total,
        SUM(CASE WHEN status = 'pendente'  THEN 1 ELSE 0 END)          AS pendentes,
        SUM(CASE WHEN status = 'aprovado'  THEN 1 ELSE 0 END)          AS aprovadas,
        SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END)          AS rejeitadas
      FROM approvals
      ${userRole !== 'admin' ? sql`WHERE approverId = ${userId}` : sql``}
    `));

    // Aprovações pendentes do usuário logado
    const [pendingApprovals] = await executeWithReconnect(db => db.execute(sql`
      SELECT 
        a.id, a.requestId, a.status, a.level, a.createdAt,
        r.title AS requestTitle, r.type AS requestType, r.priority,
        u.name AS requesterName
      FROM approvals a
      LEFT JOIN requests r ON a.requestId = r.id
      LEFT JOIN users u ON r.userId = u.id
      WHERE a.approverId = ${userId} AND a.status = 'pendente'
      ORDER BY a.createdAt DESC
      LIMIT 10
    `));

    // Normalizar todos os stats (BigInt → number)
    const ticketStats   = normalizeStats(((ticketStatsRaw   as unknown) as any[])[0]);
    const requestStats  = normalizeStats(((requestStatsRaw  as unknown) as any[])[0]);
    const occurrenceStats = normalizeStats(((occurrenceStatsRaw as unknown) as any[])[0]);
    const allStats      = normalizeStats(((allStatsRaw      as unknown) as any[])[0]);
    const approvalStats = normalizeStats(((approvalStatsRaw as unknown) as any[])[0]);

    // Normalizar arrays de gráficos
    const normalizeArray = (rows: any[]) =>
      (rows as any[]).map(r => ({ ...r, total: toNum(r.total) }));

    res.json({
      // Chamados (tickets)
      tickets: {
        stats: {
          total:          ticketStats.total          || 0,
          abertos:        ticketStats.abertos        || 0,
          em_andamento:   ticketStats.em_andamento   || 0,
          resolvidos:     ticketStats.resolvidos     || 0,
          fechados:       ticketStats.fechados       || 0,
          criticos:       ticketStats.criticos       || 0,
          sem_atribuicao: ticketStats.sem_atribuicao || 0,
        },
        byStatus:   normalizeArray((ticketsByStatus   as unknown) as any[]),
        byPriority: normalizeArray((ticketsByPriority as unknown) as any[]),
      },
      // Requisições (requests)
      requests: {
        stats: {
          total:        requestStats.total        || 0,
          pendentes:    requestStats.pendentes    || 0,
          aprovadas:    requestStats.aprovadas    || 0,
          rejeitadas:   requestStats.rejeitadas   || 0,
          em_andamento: requestStats.em_andamento || 0,
          fechadas:     requestStats.fechadas     || 0,
          canceladas:   requestStats.canceladas   || 0,
        },
        byStatus: normalizeArray((requestsByStatus as unknown) as any[]),
        byType:   normalizeArray((requestsByType   as unknown) as any[]),
      },
      // Ocorrências
      occurrences: {
        stats: {
          total:        occurrenceStats.total        || 0,
          abertas:      occurrenceStats.abertas      || 0,
          em_andamento: occurrenceStats.em_andamento || 0,
          resolvidas:   occurrenceStats.resolvidas   || 0,
          fechadas:     occurrenceStats.fechadas     || 0,
        },
      },
      // Totais gerais
      all: {
        stats: {
          total:        allStats.total        || 0,
          abertos:      allStats.abertos      || 0,
          em_andamento: allStats.em_andamento || 0,
          resolvidos:   allStats.resolvidos   || 0,
          fechados:     allStats.fechados     || 0,
        },
      },
      // Aprovações
      approvals: {
        stats: {
          total:     approvalStats.total     || 0,
          pendentes: approvalStats.pendentes || 0,
          aprovadas: approvalStats.aprovadas || 0,
          rejeitadas: approvalStats.rejeitadas || 0,
        },
        pending: (pendingApprovals as unknown) as any[],
      },
    });
  } catch (err: any) {
    console.error('[Management Stats Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar estatísticas', details: err.message });
  }
});

// ============================================================
// GET /api/management/approvals/history
// Histórico recente de aprovações (últimas 20)
// ============================================================
router.get('/management/approvals/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const [historyRows] = await executeWithReconnect(db => db.execute(sql`
      SELECT 
        a.id, a.requestId, a.status, a.level, a.comment, a.decidedAt, a.createdAt,
        r.title AS requestTitle, r.type AS requestType, r.priority,
        u.name AS requesterName,
        ap.name AS approverName
      FROM approvals a
      LEFT JOIN requests r ON a.requestId = r.id
      LEFT JOIN users u ON r.userId = u.id
      LEFT JOIN users ap ON a.approverId = ap.id
      ${userRole !== 'admin' ? sql`WHERE a.approverId = ${userId}` : sql``}
      ORDER BY a.createdAt DESC
      LIMIT 20
    `));
    res.json({ history: (historyRows as unknown) as any[] });
  } catch (err: any) {
    console.error('[Management Approvals History Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar histórico', details: err.message });
  }
});

// ============================================================
// GET /api/management/tickets/recent
// Chamados recentes da tabela requests (type=ticket), últimos 10
// ============================================================
router.get('/management/tickets/recent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const isUser = userRole === 'user';

    const [recentRows] = await executeWithReconnect(db => db.execute(sql`
      SELECT 
        r.id, r.requestId, r.title, r.type, r.status, r.priority,
        r.userName, r.category, r.assignedToName,
        r.createdAt, r.updatedAt
      FROM requests r
      WHERE r.type = 'ticket'
      ${isUser ? sql`AND r.userId = ${userId}` : sql``}
      ORDER BY r.createdAt DESC
      LIMIT 10
    `));

    res.json((recentRows as unknown) as any[]);
  } catch (err: any) {
    console.error('[Management Recent Tickets Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar chamados recentes', details: err.message });
  }
});

// ============================================================
// GET /api/management/requests/recent
// Requisições recentes (últimas 10)
// ============================================================
router.get('/management/requests/recent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const isUser = userRole === 'user';

    const [recentRows] = await executeWithReconnect(db => db.execute(sql`
      SELECT 
        r.id, r.requestId, r.title, r.type, r.status, r.priority,
        r.userName, r.category, r.createdAt, r.updatedAt
      FROM requests r
      WHERE r.type != 'ticket'
      ${isUser ? sql`AND r.userId = ${userId}` : sql``}
      ORDER BY r.createdAt DESC
      LIMIT 10
    `));

    res.json((recentRows as unknown) as any[]);
  } catch (err: any) {
    console.error('[Management Recent Requests Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar requisições recentes', details: err.message });
  }
});

export default router;
