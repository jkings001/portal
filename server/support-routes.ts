/**
 * Support Routes - Central de Atendimento
 * RBAC: user | manager | agent/support | admin
 * Multi-tenant: escopo por empresa quando aplicável
 *
 * IMPORTANTE: usa pool compartilhado (mysql-pool.ts) com conn.release() no finally.
 * Nunca usar conn.end() — isso fecha a conexão física e esgota max_connections_per_hour.
 *
 * NOTA: Usar conn.query() para queries com LIMIT/OFFSET dinâmico.
 * O mysql2 execute() com prepared statements não aceita LIMIT ? OFFSET ? com inteiros.
 */
import { Express, Request, Response } from 'express';
import { getPoolConn } from './mysql-pool';
import { sendTicketCreatedEmail, sendTicketStatusChangedEmail } from './email-service';

// ─── Helpers ────────────────────────────────────────────────────────────────
async function getConn() {
  return getPoolConn();
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}${rand}`;
}

/** Extrai usuário do token JWT do header Authorization ou cookie */
function extractUser(req: Request): { id: number; email: string; role: string; name: string } | null {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req as any).cookies?.authToken;
    if (!token || typeof token !== 'string' || !token.startsWith('eyJ')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
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
}

function canViewAll(role: string): boolean {
  return ['admin', 'agent', 'support', 'manager'].includes(role);
}
function isAdmin(role: string): boolean {
  return role === 'admin';
}
function isAgentOrAdmin(role: string): boolean {
  return ['admin', 'agent', 'support'].includes(role);
}
function isManagerOrAbove(role: string): boolean {
  return ['admin', 'manager'].includes(role);
}

/** Escapa string para uso seguro em query dinâmica (apenas para LIMIT/OFFSET/ORDER) */
function safeInt(val: any, def: number, min = 1, max = 1000): number {
  const n = parseInt(String(val));
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

// ─── Registro de Rotas ───────────────────────────────────────────────────────
export function registerSupportRoutes(app: Express) {

  // ── GET /api/support/stats ─────────────────────────────────────────────────
  app.get('/api/support/stats', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const conn = await getConn();
    try {
      const isAll = canViewAll(user.role);
      const whereUser = isAll ? '' : 'WHERE userId = ?';
      const params = isAll ? [] : [user.id];

      const [statusRows] = await conn.execute(
        `SELECT status, type, COUNT(*) as count FROM requests ${whereUser} GROUP BY status, type`,
        params
      ) as any;

      const [ticketRows] = await conn.execute(
        `SELECT status, COUNT(*) as count FROM tickets ${isAll ? '' : 'WHERE userId = ?'} GROUP BY status`,
        params
      ) as any;

      let pendingApprovals = 0;
      if (isManagerOrAbove(user.role)) {
        const [apRows] = await conn.execute(
          `SELECT COUNT(*) as count FROM approvals WHERE approverId = ? AND status = 'pendente'`,
          [user.id]
        ) as any;
        pendingApprovals = apRows[0]?.count || 0;
      }

      const [slaRows] = await conn.execute(
        `SELECT COUNT(*) as count FROM requests WHERE slaBreached = 1 AND status NOT IN ('resolvido','fechado','cancelado') ${isAll ? '' : 'AND userId = ?'}`,
        params
      ) as any;

      const [trendRows] = await conn.execute(
        `SELECT DATE(createdAt) as day, COUNT(*) as count 
         FROM requests 
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) ${isAll ? '' : 'AND userId = ?'}
         GROUP BY DATE(createdAt) ORDER BY day ASC`,
        params
      ) as any;

      // Métricas por tipo
      const [byTypeRows] = await conn.execute(
        `SELECT type, COUNT(*) as count FROM requests ${whereUser} GROUP BY type`,
        params
      ) as any;

      // Tempo médio de resolução (em horas)
      const [avgTimeRows] = await conn.execute(
        `SELECT AVG(TIMESTAMPDIFF(HOUR, createdAt, resolvedAt)) as avgHours
         FROM requests 
         WHERE resolvedAt IS NOT NULL AND status IN ('resolvido','fechado') ${isAll ? '' : 'AND userId = ?'}`,
        params
      ) as any;

      // Top agentes
      let topAgents: any[] = [];
      if (isAll) {
        const [agentRows] = await conn.execute(
          `SELECT assignedToId, assignedToName, COUNT(*) as total,
                  SUM(CASE WHEN status IN ('resolvido','fechado') THEN 1 ELSE 0 END) as resolved
           FROM requests WHERE assignedToId IS NOT NULL
           GROUP BY assignedToId, assignedToName ORDER BY total DESC LIMIT 5`
        ) as any;
        topAgents = agentRows;
      }

      res.json({
        byStatus: statusRows,
        byType: byTypeRows,
        tickets: ticketRows,
        pendingApprovals,
        slaBreached: slaRows[0]?.count || 0,
        trend: trendRows,
        avgResolutionHours: Math.round(avgTimeRows[0]?.avgHours || 0),
        topAgents,
      });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/items ─────────────────────────────────────────────────
  app.get('/api/support/items', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const {
      tab = 'all',
      type,
      status,
      priority,
      companyId,
      departmentId,
      assignedToId,
      search,
      dateFrom,
      dateTo,
      slaBreached,
      source,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortDir = 'DESC',
    } = req.query as Record<string, string>;

    const pageNum = safeInt(page, 1, 1, 1000);
    const limitNum = safeInt(limit, 20, 1, 100);
    const offset = (pageNum - 1) * limitNum;

    const isAll = canViewAll(user.role);
    const conn = await getConn();

    try {
      const rWhere: string[] = [];
      const rParams: any[] = [];

      // Escopo por perfil
      if (!isAll) {
        // Busca por userId OU userEmail para cobrir casos onde o mesmo usuário
        // tem IDs diferentes (ex: cadastrado manualmente vs via OAuth)
        rWhere.push('(r.userId = ? OR r.userEmail = ?)');
        rParams.push(user.id, user.email);
      } else if (tab === 'mine') {
        // Busca por userId OU userEmail para cobrir casos onde o mesmo usuário
        // tem IDs diferentes (ex: cadastrado manualmente vs via OAuth)
        rWhere.push('(r.userId = ? OR r.userEmail = ?)');
        rParams.push(user.id, user.email);
      } else if (tab === 'pending') {
        rWhere.push("r.status IN ('aberto','em_analise','aguardando_aprovacao')");
      } else if (tab === 'approvals') {
        rWhere.push('ap.approverId = ?');
        rParams.push(user.id);
      } else if (tab === 'queue' && isAgentOrAdmin(user.role)) {
        rWhere.push("r.status IN ('aberto','em_analise','em_andamento')");
      }

      if (type) { rWhere.push('r.type = ?'); rParams.push(type); }
      if (status) { rWhere.push('r.status = ?'); rParams.push(status); }
      if (priority) { rWhere.push('r.priority = ?'); rParams.push(priority); }
      if (companyId) { rWhere.push('r.companyId = ?'); rParams.push(parseInt(companyId)); }
      if (departmentId) { rWhere.push('r.departmentId = ?'); rParams.push(parseInt(departmentId)); }
      if (assignedToId) { rWhere.push('r.assignedToId = ?'); rParams.push(parseInt(assignedToId)); }
      if (slaBreached === 'true') { rWhere.push('r.slaBreached = 1'); }
      if (source === 'teams') { rWhere.push("r.externalMessageId IS NOT NULL AND r.externalMessageId != ''"); }
      if (source === 'portal') { rWhere.push("(r.externalMessageId IS NULL OR r.externalMessageId = '')"); }
      if (dateFrom) { rWhere.push('r.createdAt >= ?'); rParams.push(dateFrom); }
      if (dateTo) { rWhere.push('r.createdAt <= ?'); rParams.push(dateTo + ' 23:59:59'); }
      if (search) {
        rWhere.push('(r.title LIKE ? OR r.description LIKE ? OR r.requestId LIKE ?)');
        rParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const rWhereClause = rWhere.length ? 'WHERE ' + rWhere.join(' AND ') : '';
      const joinApprovals = tab === 'approvals'
        ? 'INNER JOIN approvals ap ON ap.requestId = r.id'
        : 'LEFT JOIN approvals ap ON ap.requestId = r.id';

      const allowedSort = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];
      const safeSortBy = allowedSort.includes(sortBy) ? `r.${sortBy}` : 'r.createdAt';
      const safeSortDir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Usar query() com LIMIT/OFFSET interpolados (não aceita prepared statements)
      const sql = `SELECT DISTINCT r.*, 
          c.name as companyName,
          d.name as departmentName,
          CASE WHEN r.slaDeadline < NOW() AND r.status NOT IN ('resolvido','fechado','cancelado') THEN 1 ELSE 0 END as slaBreachedNow,
          TIMESTAMPDIFF(MINUTE, NOW(), r.slaDeadline) as slaMinutesLeft
         FROM requests r
         LEFT JOIN companies c ON c.id = r.companyId
         LEFT JOIN departments d ON d.id = r.departmentId
         ${joinApprovals}
         ${rWhereClause}
         ORDER BY ${safeSortBy} ${safeSortDir}
         LIMIT ${limitNum} OFFSET ${offset}`;

      const [items] = await conn.query(sql, rParams) as any;

      const countSql = `SELECT COUNT(DISTINCT r.id) as total FROM requests r ${joinApprovals} ${rWhereClause}`;
      const [countRows] = await conn.query(countSql, rParams) as any;

      res.json({
        items,
        total: countRows[0]?.total || 0,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((countRows[0]?.total || 0) / limitNum),
      });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/items/:id ─────────────────────────────────────────────
  app.get('/api/support/items/:id', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(
        `SELECT r.*, c.name as companyName, d.name as departmentName,
                CASE WHEN r.slaDeadline < NOW() AND r.status NOT IN ('resolvido','fechado','cancelado') THEN 1 ELSE 0 END as slaBreachedNow,
                TIMESTAMPDIFF(MINUTE, NOW(), r.slaDeadline) as slaMinutesLeft
         FROM requests r
         LEFT JOIN companies c ON c.id = r.companyId
         LEFT JOIN departments d ON d.id = r.departmentId
         WHERE r.id = ?`,
        [req.params.id]
      ) as any;

      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];

      if (!canViewAll(user.role) && item.userId !== user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const [history] = await conn.execute(
        `SELECT sh.*, u.profileImage as userAvatar
         FROM support_history sh
         LEFT JOIN users u ON u.id = sh.userId
         WHERE sh.itemType = 'request' AND sh.itemId = ? ORDER BY sh.createdAt ASC`,
        [item.id]
      ) as any;

      const [approvals] = await conn.execute(
        `SELECT * FROM approvals WHERE requestId = ? ORDER BY level ASC, createdAt ASC`,
        [item.id]
      ) as any;

      const [attachments] = await conn.execute(
        `SELECT * FROM support_attachments WHERE itemType = 'request' AND itemId = ? ORDER BY createdAt DESC`,
        [item.id]
      ) as any;

      res.json({ ...item, history, approvals, attachments });
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items ────────────────────────────────────────────────
  app.post('/api/support/items', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { type = 'request', title, description, priority = 'media', category, companyId, departmentId, tags, dueDate } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Título é obrigatório' });
    if (!['request', 'occurrence', 'ticket'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const prefix = type === 'ticket' ? 'TKT' : type === 'occurrence' ? 'OCC' : 'REQ';
    const requestId = generateId(prefix);

    const slaHours: Record<string, number> = { critica: 4, alta: 8, media: 24, baixa: 72 };
    const slaMs = (slaHours[priority] || 24) * 3600 * 1000;
    const slaDeadline = new Date(Date.now() + slaMs).toISOString().slice(0, 19).replace('T', ' ');

    const conn = await getConn();
    try {
      // Buscar dados do usuário no banco para garantir nome e empresa corretos
      const [userRows] = await conn.execute(
        `SELECT u.name, u.email, uca.companyId as defaultCompanyId, uca.departmentId as defaultDeptId
         FROM users u
         LEFT JOIN userCompanyAssignments uca ON uca.userId = u.id AND uca.isActive = 1
         WHERE u.id = ? LIMIT 1`,
        [user.id]
      ) as any;

      const dbUser = userRows[0];
      const finalCompanyId = companyId || dbUser?.defaultCompanyId || null;
      const finalDeptId = departmentId || dbUser?.defaultDeptId || null;
      const userName = dbUser?.name || user.name;
      const userEmail = dbUser?.email || user.email;

      const [result] = await conn.execute(
        `INSERT INTO requests (requestId, type, title, description, priority, category, tags, userId, userName, userEmail, companyId, departmentId, slaDeadline, dueDate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto')`,
        [requestId, type, title.trim(), description || null, priority, category || null,
          tags ? JSON.stringify(tags) : null, user.id, userName, userEmail,
          finalCompanyId, finalDeptId, slaDeadline, dueDate || null]
      ) as any;

      const newId = result.insertId;
      const typeName = type === 'ticket' ? 'Chamado' : type === 'occurrence' ? 'Ocorrência' : 'Requisição';

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, 'criado', ?, ?, ?)`,
        [newId, `${typeName} criado(a) por ${userName}`, user.id, userName]
      );

      // Para requisições com departamento: criar aprovação pendente para managers
      if (type === 'request' && finalDeptId) {
        const [managers] = await conn.execute(
          `SELECT u.id, u.name FROM users u
           INNER JOIN userCompanyAssignments uca ON uca.userId = u.id
           WHERE uca.departmentId = ? AND uca.role IN ('gerente','supervisor','manager') AND uca.isActive = 1
           LIMIT 3`,
          [finalDeptId]
        ) as any;

        for (const mgr of managers) {
          await conn.execute(
            `INSERT INTO approvals (requestId, approverId, approverName, status, level)
             VALUES (?, ?, ?, 'pendente', 1)`,
            [newId, mgr.id, mgr.name]
          );
        }

        if (managers.length > 0) {
          await conn.execute(
            `UPDATE requests SET status = 'aguardando_aprovacao' WHERE id = ?`,
            [newId]
          );
        }
      }

      const [created] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [newId]) as any;
      const createdItem = created[0];
      res.status(201).json(createdItem);

      // Enviar e-mail de notificação (assíncrono, não bloqueia a resposta)
      setImmediate(async () => {
        try {
          // Buscar e-mails dos agentes/admin para notificar
          const conn2 = await getConn();
          let agentEmails: string[] = [];
          try {
            const [agents] = await conn2.execute(
              `SELECT email FROM users WHERE role IN ('admin','agent','support','manager') AND email IS NOT NULL LIMIT 10`
            ) as any;
            agentEmails = agents.map((a: any) => a.email).filter(Boolean);
          } finally {
            conn2.release();
          }

          const ticketData = {
            requestId: createdItem.requestId,
            title: createdItem.title,
            type: createdItem.type,
            priority: createdItem.priority,
            status: createdItem.status,
            description: createdItem.description || '',
            userName: createdItem.userName || userName,
            userEmail: createdItem.userEmail || userEmail,
            createdAt: createdItem.createdAt || new Date().toISOString(),
          };

          // Notificar agentes
          for (const email of agentEmails) {
            await sendTicketCreatedEmail(email, ticketData).catch(() => {});
          }

          // Notificar o próprio solicitante (confirmação)
          if (userEmail) {
            await sendTicketCreatedEmail(userEmail, ticketData).catch(() => {});
          }
        } catch (e) {
          console.error('[Email] Erro ao enviar notificação de novo chamado:', e);
        }
      });
    } finally {
      conn.release();
    }
  });

  // ── PUT /api/support/items/:id ─────────────────────────────────────────────
  app.put('/api/support/items/:id', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];

      if (!canViewAll(user.role) && item.userId !== user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { title, description, priority, status, category, assignedToId, assignedToName, tags, dueDate } = req.body;
      const updates: string[] = [];
      const params: any[] = [];
      const changes: string[] = [];

      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description); }
      if (category !== undefined) { updates.push('category = ?'); params.push(category); }
      if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
      if (dueDate !== undefined) { updates.push('dueDate = ?'); params.push(dueDate || null); }

      if (priority !== undefined && isAgentOrAdmin(user.role)) {
        if (item.priority !== priority) changes.push(`prioridade alterada de ${item.priority} para ${priority}`);
        updates.push('priority = ?'); params.push(priority);
      }
      if (status !== undefined && isAgentOrAdmin(user.role)) {
        if (item.status !== status) {
          changes.push(`status alterado de ${item.status} para ${status}`);
          if (status === 'resolvido') { updates.push('resolvedAt = NOW()'); }
          if (status === 'fechado') { updates.push('closedAt = NOW()'); }
        }
        updates.push('status = ?'); params.push(status);
      }
      if (assignedToId !== undefined && isAgentOrAdmin(user.role)) {
        updates.push('assignedToId = ?', 'assignedToName = ?');
        params.push(assignedToId || null, assignedToName || null);
        if (assignedToId) {
          changes.push(`atribuído a ${assignedToName || assignedToId}`);
          // Auto-atualizar status para em_andamento ao atribuir
          if (item.status === 'aberto') {
            updates.push('status = ?'); params.push('em_andamento');
            changes.push('status alterado de aberto para em_andamento');
          }
        } else {
          changes.push('atribuição removida');
        }
      }

      if (!updates.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

      updates.push('updatedAt = NOW()');
      params.push(req.params.id);

      await conn.execute(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, params);

      if (changes.length) {
        await conn.execute(
          `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
           VALUES ('request', ?, 'atualizado', ?, ?, ?)`,
          [req.params.id, changes.join('; '), user.id, user.name]
        );
      }

      const [updated] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      res.json(updated[0]);
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/assign ────────────────────────────────────
  // Atribuição rápida de agente
  app.post('/api/support/items/:id/assign', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isAgentOrAdmin(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const { agentId, agentName } = req.body;
    const conn = await getConn();
    try {
      const [rows] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });

      const newStatus = rows[0].status === 'aberto' ? 'em_andamento' : rows[0].status;
      await conn.execute(
        `UPDATE requests SET assignedToId = ?, assignedToName = ?, status = ?, updatedAt = NOW() WHERE id = ?`,
        [agentId || null, agentName || null, newStatus, req.params.id]
      );

      const msg = agentId
        ? `Atribuído a ${agentName || agentId} por ${user.name}`
        : `Atribuição removida por ${user.name}`;

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, 'atribuido', ?, ?, ?)`,
        [req.params.id, msg, user.id, user.name]
      );

      const [updated] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      res.json(updated[0]);
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/status ────────────────────────────────────
  // Mudança rápida de status
  app.post('/api/support/items/:id/status', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { status } = req.body;
    const validStatuses = ['aberto', 'em_analise', 'aguardando_aprovacao', 'aprovado', 'rejeitado', 'em_andamento', 'resolvido', 'fechado', 'cancelado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];

      // Usuário comum só pode cancelar os próprios
      if (!canViewAll(user.role)) {
        if (item.userId !== user.id) return res.status(403).json({ error: 'Acesso negado' });
        if (status !== 'cancelado') return res.status(403).json({ error: 'Você só pode cancelar seus próprios itens' });
      }

      const extras: string[] = [];
      if (status === 'resolvido') extras.push('resolvedAt = NOW()');
      if (status === 'fechado') extras.push('closedAt = NOW()');

      const extraSql = extras.length ? extras.join(', ') + ', ' : '';
      await conn.execute(
        `UPDATE requests SET ${extraSql}status = ?, updatedAt = NOW() WHERE id = ?`,
        [status, req.params.id]
      );

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, 'status', ?, ?, ?)`,
        [req.params.id, `Status alterado de ${item.status} para ${status} por ${user.name}`, user.id, user.name]
      );

      const [updated] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      res.json(updated[0]);

      // Notificar solicitante sobre mudança de status (assíncrono)
      const updatedItem = updated[0];
      setImmediate(async () => {
        try {
          const recipientEmail = updatedItem?.userEmail;
          if (recipientEmail) {
            await sendTicketStatusChangedEmail(recipientEmail, {
              requestId: updatedItem.requestId,
              title: updatedItem.title,
              oldStatus: item.status,
              newStatus: status,
              changedBy: user.name,
            }).catch(() => {});
          }
        } catch (e) {
          console.error('[Email] Erro ao enviar notificação de status:', e);
        }
      });
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/approve ───────────────────────────────────
  app.post('/api/support/items/:id/approve', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isManagerOrAbove(user.role)) return res.status(403).json({ error: 'Apenas gerentes podem aprovar' });

    const { decision, comment } = req.body;
    if (!['aprovado', 'rejeitado'].includes(decision)) {
      return res.status(400).json({ error: 'Decisão inválida' });
    }

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });

      const [apRows] = await conn.execute(
        `SELECT * FROM approvals WHERE requestId = ? AND approverId = ? AND status = 'pendente'`,
        [req.params.id, user.id]
      ) as any;

      if (!apRows.length) return res.status(403).json({ error: 'Você não tem aprovação pendente para este item' });

      await conn.execute(
        `UPDATE approvals SET status = ?, comment = ?, decidedAt = NOW(), updatedAt = NOW()
         WHERE requestId = ? AND approverId = ?`,
        [decision, comment || null, req.params.id, user.id]
      );

      const newStatus = decision === 'aprovado' ? 'aprovado' : 'rejeitado';
      await conn.execute(
        `UPDATE requests SET status = ?, updatedAt = NOW() WHERE id = ?`,
        [newStatus, req.params.id]
      );

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, ?, ?, ?, ?)`,
        [req.params.id, decision, `${decision === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por ${user.name}${comment ? ': ' + comment : ''}`, user.id, user.name]
      );

      res.json({ success: true, decision });
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/comment ───────────────────────────────────
  app.post('/api/support/items/:id/comment', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { content, isInternal = false } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comentário não pode ser vazio' });

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(`SELECT * FROM requests WHERE id = ?`, [req.params.id]) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];

      if (!canViewAll(user.role) && item.userId !== user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Nota interna só para agentes/admin
      if (isInternal && !isAgentOrAdmin(user.role)) {
        return res.status(403).json({ error: 'Notas internas são apenas para agentes' });
      }

      const action = isInternal ? 'nota_interna' : 'comentario';
      const prefix = isInternal ? '[INTERNO] ' : '';

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, ?, ?, ?, ?)`,
        [req.params.id, action, prefix + content.trim(), user.id, user.name]
      );

      // Atualizar updatedAt do item
      await conn.execute(`UPDATE requests SET updatedAt = NOW() WHERE id = ?`, [req.params.id]);

      res.status(201).json({ success: true });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/approvals/pending ────────────────────────────────────
  app.get('/api/support/approvals/pending', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isManagerOrAbove(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(
        `SELECT r.*, ap.id as approvalId, ap.level, ap.createdAt as approvalCreatedAt,
                c.name as companyName
         FROM approvals ap
         INNER JOIN requests r ON r.id = ap.requestId
         LEFT JOIN companies c ON c.id = r.companyId
         WHERE ap.approverId = ? AND ap.status = 'pendente'
         ORDER BY FIELD(r.priority,'critica','alta','media','baixa'), r.createdAt ASC`,
        [user.id]
      ) as any;

      res.json(rows);
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/queue ─────────────────────────────────────────────────
  app.get('/api/support/queue', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isAgentOrAdmin(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const { priority, companyId, assignedToMe, type } = req.query as Record<string, string>;
    const conn = await getConn();
    try {
      const where: string[] = ["r.status IN ('aberto','em_analise','em_andamento')"];
      const params: any[] = [];

      if (priority) { where.push('r.priority = ?'); params.push(priority); }
      if (companyId) { where.push('r.companyId = ?'); params.push(parseInt(companyId)); }
      if (type) { where.push('r.type = ?'); params.push(type); }
      if (assignedToMe === 'true') { where.push('r.assignedToId = ?'); params.push(user.id); }

      const [rows] = await conn.query(
        `SELECT r.*, c.name as companyName,
                CASE WHEN r.slaDeadline < NOW() THEN 1 ELSE 0 END as slaBreachedNow,
                TIMESTAMPDIFF(MINUTE, NOW(), r.slaDeadline) as slaMinutesLeft
         FROM requests r
         LEFT JOIN companies c ON c.id = r.companyId
         WHERE ${where.join(' AND ')}
         ORDER BY 
           FIELD(r.priority, 'critica','alta','media','baixa'),
           r.slaDeadline ASC,
           r.createdAt ASC
         LIMIT 100`,
        params
      ) as any;

      res.json(rows);
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/agents ────────────────────────────────────────────────
  // Lista agentes disponíveis para atribuição
  app.get('/api/support/agents', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isAgentOrAdmin(user.role) && !isManagerOrAbove(user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(
        `SELECT u.id, u.name, u.email, u.role, u.profileImage, u.avatar,
                COUNT(r.id) as activeTickets
         FROM users u
         LEFT JOIN requests r ON r.assignedToId = u.id AND r.status IN ('aberto','em_analise','em_andamento')
         WHERE u.role IN ('admin','agent','support','manager')
         GROUP BY u.id, u.name, u.email, u.role, u.profileImage, u.avatar
         ORDER BY activeTickets ASC, u.name ASC`
      ) as any;

      res.json(rows);
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/attachments ──────────────────────────────
  app.post('/api/support/items/:id/attachments', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { id } = req.params;
    const { files } = req.body as { files: Array<{ name: string; data: string; mimeType: string; size: number }> };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    if (files.length > 10) {
      return res.status(400).json({ error: 'Máximo de 10 arquivos por chamado' });
    }

    const ALLOWED_MIME = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-zip-compressed',
    ];
    const MAX_SIZE = 10 * 1024 * 1024;

    try {
      const { storagePut } = await import('./storage');
      const saved: Array<{ fileName: string; fileUrl: string; fileKey: string; fileSize: number; mimeType: string }> = [];

      for (const file of files) {
        if (!ALLOWED_MIME.includes(file.mimeType)) {
          return res.status(400).json({ error: `Tipo não permitido: ${file.mimeType}` });
        }
        const buf = Buffer.from(file.data, 'base64');
        if (buf.length > MAX_SIZE) {
          return res.status(400).json({ error: `Arquivo muito grande (máx 10 MB): ${file.name}` });
        }
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileKey = `support-attachments/item-${id}/${Date.now()}-${safeFileName}`;
        const { url } = await storagePut(fileKey, buf, file.mimeType);
        saved.push({ fileName: file.name, fileUrl: url, fileKey, fileSize: buf.length, mimeType: file.mimeType });
      }

      const conn = await getConn();
      try {
        for (const att of saved) {
          await conn.execute(
            `INSERT INTO support_attachments (itemType, itemId, fileName, fileUrl, fileKey, mimeType, fileSize, uploadedBy, uploadedByName)
             VALUES ('request', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, att.fileName, att.fileUrl, att.fileKey, att.mimeType, att.fileSize, user.id, user.name]
          );
        }

        await conn.execute(
          `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
           VALUES ('request', ?, 'anexo', ?, ?, ?)`,
          [id, `${saved.length} arquivo(s) anexado(s) por ${user.name}`, user.id, user.name]
        );
      } finally {
        conn.release();
      }

      res.json({ success: true, attachments: saved });
    } catch (e: any) {
      console.error('[Support Attachments] Error:', e);
      res.status(500).json({ error: e.message || 'Erro ao salvar anexos' });
    }
  });

  // ── GET /api/support/items/:id/attachments ────────────────────────────────
  app.get('/api/support/items/:id/attachments', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(
        `SELECT * FROM support_attachments WHERE itemType = 'request' AND itemId = ? ORDER BY createdAt DESC`,
        [req.params.id]
      ) as any;
      res.json(Array.isArray(rows) ? rows : []);
    } catch {
      res.json([]);
    } finally {
      conn.release();
    }
  });

  // ── DELETE /api/support/items/:id ─────────────────────────────────────────
  app.delete('/api/support/items/:id', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isAdmin(user.role)) return res.status(403).json({ error: 'Apenas administradores podem excluir' });

    const conn = await getConn();
    try {
      await conn.execute(`DELETE FROM approvals WHERE requestId = ?`, [req.params.id]);
      await conn.execute(`DELETE FROM support_history WHERE itemType = 'request' AND itemId = ?`, [req.params.id]);
      await conn.execute(`DELETE FROM support_attachments WHERE itemType = 'request' AND itemId = ?`, [req.params.id]);
      await conn.execute(`DELETE FROM requests WHERE id = ?`, [req.params.id]);
      res.json({ success: true });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/analytics ────────────────────────────────────────────
  // Análise avançada para dashboard
  app.get('/api/support/analytics', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!canViewAll(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const { days = '30', companyId } = req.query as Record<string, string>;
    const daysNum = safeInt(days, 30, 1, 365);
    const conn = await getConn();

    try {
      const companyFilter = companyId ? 'AND companyId = ?' : '';
      const companyParams = companyId ? [parseInt(companyId)] : [];

      // Volume por dia
      const [volumeRows] = await conn.query(
        `SELECT DATE(createdAt) as day, type, COUNT(*) as count
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY) ${companyFilter}
         GROUP BY DATE(createdAt), type ORDER BY day ASC`,
        companyParams
      ) as any;

      // Por categoria
      const [categoryRows] = await conn.query(
        `SELECT category, COUNT(*) as count, type
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY) AND category IS NOT NULL ${companyFilter}
         GROUP BY category, type ORDER BY count DESC LIMIT 10`,
        companyParams
      ) as any;

      // SLA compliance
      const [slaRows] = await conn.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN slaBreached = 0 OR status IN ('resolvido','fechado') AND resolvedAt <= slaDeadline THEN 1 ELSE 0 END) as onTime,
           SUM(CASE WHEN slaBreached = 1 THEN 1 ELSE 0 END) as breached
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY) ${companyFilter}`,
        companyParams
      ) as any;

      // Tempo médio por prioridade
      const [avgTimeRows] = await conn.query(
        `SELECT priority, AVG(TIMESTAMPDIFF(HOUR, createdAt, resolvedAt)) as avgHours, COUNT(*) as count
         FROM requests
         WHERE resolvedAt IS NOT NULL AND createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY) ${companyFilter}
         GROUP BY priority`,
        companyParams
      ) as any;

      // Distribuição por empresa
      const [companyRows] = await conn.query(
        `SELECT c.name as company, COUNT(r.id) as count
         FROM requests r
         LEFT JOIN companies c ON c.id = r.companyId
         WHERE r.createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)
         GROUP BY r.companyId, c.name ORDER BY count DESC LIMIT 10`
      ) as any;

      res.json({
        volume: volumeRows,
        byCategory: categoryRows,
        sla: slaRows[0] || { total: 0, onTime: 0, breached: 0 },
        avgTimeByPriority: avgTimeRows,
        byCompany: companyRows,
      });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/managers/:companyId ───────────────────────────────────────────────────────
  // Retorna gestores da empresa do solicitante
  app.get('/api/support/managers/:companyId', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const conn = await getConn();
    try {
      // Busca usuários com role manager ou admin da mesma empresa
      const [managers] = await conn.execute(
        `SELECT u.id, u.name, u.email, u.position, u.role
         FROM users u
         INNER JOIN userCompanyAssignments uca ON uca.userId = u.id
         WHERE uca.companyId = ? AND u.role IN ('manager','admin')
         ORDER BY u.name ASC`,
        [req.params.companyId]
      ) as any;

      // Se não encontrar por assignments, busca por domínio de e-mail
      if (!managers.length) {
        const [companyRows] = await conn.execute(
          `SELECT email FROM companies WHERE id = ?`, [req.params.companyId]
        ) as any;
        if (companyRows.length) {
          const domain = companyRows[0].email?.split('@')[1];
          if (domain) {
            const [domainManagers] = await conn.execute(
              `SELECT id, name, email, position, role FROM users
               WHERE email LIKE ? AND role IN ('manager','admin')
               ORDER BY name ASC`,
              [`%@${domain}`]
            ) as any;
            return res.json({ managers: domainManagers });
          }
        }
      }

      res.json({ managers });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/items/:id/managers ─────────────────────────────────────────────────────────
  // Buscar gestores da empresa do solicitante
  app.get('/api/support/items/:id/managers', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    const conn = await getConn();
    try {
      // Buscar a empresa do item
      const [items] = await conn.execute(
        `SELECT r.companyId FROM requests r WHERE r.id = ?`,
        [req.params.id]
      ) as any[];
      if (!items || items.length === 0) return res.status(404).json({ error: 'Item não encontrado' });
      const companyId = items[0].companyId;
      // Buscar usuários com role manager ou admin da mesma empresa
      const [managers] = await conn.execute(
        companyId
          ? `SELECT DISTINCT u.id, u.name, u.email, u.role FROM users u
             INNER JOIN userCompanyAssignments uca ON uca.userId = u.id
             WHERE u.role IN ('manager', 'admin') AND uca.companyId = ? AND uca.isActive = 1
             ORDER BY u.role DESC, u.name ASC`
          : `SELECT u.id, u.name, u.email, u.role FROM users u WHERE u.role IN ('manager', 'admin') ORDER BY u.role DESC, u.name ASC`,
        companyId ? [companyId] : []
      ) as any[];
      res.json(Array.isArray(managers) ? managers : []);
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/request-approval ────────────────────────────
  // Solicitar aprovação do gestoror
  app.post('/api/support/items/:id/request-approval', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { managerId, managerName, justification } = req.body;
    if (!managerId) return res.status(400).json({ error: 'Gestor é obrigatório' });

    const conn = await getConn();
    try {
      // Verificar se o item pertence ao usuário ou se é agente
      const [rows] = await conn.execute(
        `SELECT id, title, userId, status FROM requests WHERE id = ?`, [req.params.id]
      ) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];
      if (item.userId !== user.id && !isAgentOrAdmin(user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Atualizar o request com os dados de aprovação
      await conn.execute(
        `UPDATE requests SET
          approvalRequired = 1,
          approvalStatus = 'pendente',
          approvalManagerId = ?,
          approvalManagerName = ?,
          status = 'aguardando_aprovacao',
          updatedAt = NOW()
         WHERE id = ?`,
        [managerId, managerName, req.params.id]
      );

      // Registrar no histórico
      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, 'aprovacao_solicitada', ?, ?, ?)`,
        [req.params.id, `Aprovação solicitada para ${managerName}${justification ? ': ' + justification : ''}`, user.id, user.name]
      );

      // Criar notificação para o gestor
      try {
        await conn.execute(
          `INSERT INTO notifications (userId, title, message, type, relatedId, relatedType, createdAt)
           VALUES (?, ?, ?, 'aprovacao', ?, 'request', NOW())`,
          [managerId, `Aprovação Pendente: ${item.title}`, `${user.name} solicitou sua aprovação para o chamado #${item.id}.${justification ? ' Justificativa: ' + justification : ''}`, req.params.id]
        );
      } catch { /* notificações opcionais */ }

      res.json({ success: true, message: `Aprovação solicitada para ${managerName}` });
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/decide-approval ──────────────────────────────
  // Gestor aprova ou rejeita
  app.post('/api/support/items/:id/decide-approval', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });

    const { decision, note } = req.body; // decision: 'aprovada' | 'rejeitada'
    if (!['aprovada', 'rejeitada'].includes(decision)) {
      return res.status(400).json({ error: 'Decisão inválida' });
    }

    const conn = await getConn();
    try {
      const [rows] = await conn.execute(
        `SELECT id, title, userId, approvalManagerId, approvalStatus FROM requests WHERE id = ?`,
        [req.params.id]
      ) as any;
      if (!rows.length) return res.status(404).json({ error: 'Item não encontrado' });
      const item = rows[0];

      // Apenas o gestor designado ou admin pode decidir
      if (item.approvalManagerId !== user.id && !isAdmin(user.role)) {
        return res.status(403).json({ error: 'Apenas o gestor designado pode aprovar/rejeitar' });
      }

      const newStatus = decision === 'aprovada' ? 'em_andamento' : 'cancelado';

      await conn.execute(
        `UPDATE requests SET
          approvalStatus = ?,
          approvalNote = ?,
          approvalDecidedAt = NOW(),
          status = ?,
          updatedAt = NOW()
         WHERE id = ?`,
        [decision, note || null, newStatus, req.params.id]
      );

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, ?, ?, ?, ?)`,
        [req.params.id, `aprovacao_${decision}`, `Aprovação ${decision} por ${user.name}${note ? ': ' + note : ''}`, user.id, user.name]
      );

      // Notificar o solicitante
      try {
        await conn.execute(
          `INSERT INTO notifications (userId, title, message, type, relatedId, relatedType, createdAt)
           VALUES (?, ?, ?, 'aprovacao', ?, 'request', NOW())`,
          [item.userId, `Chamado ${decision === 'aprovada' ? 'Aprovado' : 'Rejeitado'}: ${item.title}`,
           `${user.name} ${decision === 'aprovada' ? 'aprovou' : 'rejeitou'} seu chamado.${note ? ' Observação: ' + note : ''}`,
           req.params.id]
        );
      } catch { /* notificações opcionais */ }

      res.json({ success: true, newStatus });
    } finally {
      conn.release();
    }
  });

  // ── POST /api/support/items/:id/sla-update ───────────────────────────────────────────────────────
  // Atualizar SLA manualmente (agente/admin)
  app.post('/api/support/items/:id/sla-update', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!isAgentOrAdmin(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const { slaDeadline } = req.body;
    if (!slaDeadline) return res.status(400).json({ error: 'slaDeadline é obrigatório' });

    const conn = await getConn();
    try {
      await conn.execute(
        `UPDATE requests SET slaDeadline = ?, updatedAt = NOW() WHERE id = ?`,
        [slaDeadline, req.params.id]
      );

      await conn.execute(
        `INSERT INTO support_history (itemType, itemId, action, description, userId, userName)
         VALUES ('request', ?, 'sla', ?, ?, ?)`,
        [req.params.id, `SLA atualizado para ${slaDeadline} por ${user.name}`, user.id, user.name]
      );

      res.json({ success: true });
    } finally {
      conn.release();
    }
  });

  // ── GET /api/support/dashboard-reports ─────────────────────────────────────
  // Dashboard consolidado para a página Reports
  app.get('/api/support/dashboard-reports', async (req: Request, res: Response) => {
    const user = extractUser(req);
    if (!user) return res.status(401).json({ error: 'Não autenticado' });
    if (!canViewAll(user.role)) return res.status(403).json({ error: 'Acesso negado' });

    const { days = '30' } = req.query as Record<string, string>;
    const daysNum = safeInt(days, 30, 1, 365);
    const conn = await getConn();

    try {
      // 1) KPIs gerais
      const [kpiRows] = await conn.query(
        `SELECT
           COUNT(*) as total,
           SUM(CASE WHEN status NOT IN ('resolvido','fechado','cancelado') THEN 1 ELSE 0 END) as abertos,
           SUM(CASE WHEN status IN ('resolvido','fechado') THEN 1 ELSE 0 END) as resolvidos,
           SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) as em_andamento,
           SUM(CASE WHEN status = 'aberto' THEN 1 ELSE 0 END) as aguardando,
           SUM(CASE WHEN slaBreached = 1 AND status NOT IN ('resolvido','fechado','cancelado') THEN 1 ELSE 0 END) as sla_vencido,
           AVG(CASE WHEN resolvedAt IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, createdAt, resolvedAt) ELSE NULL END) as avg_resolution_min
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)`
      ) as any;

      const kpi = kpiRows[0] || {};
      const total = Number(kpi.total) || 0;
      const resolvidos = Number(kpi.resolvidos) || 0;
      const taxaResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;
      const avgMinutes = Number(kpi.avg_resolution_min) || 0;
      const avgHours = avgMinutes >= 60 ? `${Math.round(avgMinutes / 60)}h` : `${Math.round(avgMinutes)}min`;

      // 2) Distribuição por status
      const [statusRows] = await conn.query(
        `SELECT status, COUNT(*) as count
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)
         GROUP BY status ORDER BY count DESC`
      ) as any;

      // 3) Distribuição por prioridade
      const [priorityRows] = await conn.query(
        `SELECT priority, COUNT(*) as count
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)
         GROUP BY priority ORDER BY FIELD(priority,'critica','alta','media','baixa')`
      ) as any;

      // 4) Volume por dia (últimos 14 dias)
      const [volumeRows] = await conn.query(
        `SELECT DATE(createdAt) as day, COUNT(*) as count
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY DATE(createdAt) ORDER BY day ASC`
      ) as any;

      // 5) Chamados recentes (10 mais recentes)
      const [recentRows] = await conn.query(
        `SELECT r.id, r.requestId, r.type, r.title, r.status, r.priority,
                r.createdAt, r.updatedAt, r.resolvedAt,
                u.name as userName, u.email as userEmail,
                a.name as assignedToName,
                c.name as companyName
         FROM requests r
         LEFT JOIN users u ON u.id = r.userId
         LEFT JOIN users a ON a.id = r.assignedToId
         LEFT JOIN companies c ON c.id = r.companyId
         ORDER BY r.createdAt DESC LIMIT 10`
      ) as any;

      // 6) Top Suporte — agentes com mais chamados atendidos + tempo médio
      const [topSupportRows] = await conn.query(
        `SELECT
           r.assignedToId,
           a.name as agentName,
           a.email as agentEmail,
           a.avatar as agentAvatar,
           COUNT(*) as totalAtendidos,
           SUM(CASE WHEN r.status IN ('resolvido','fechado') THEN 1 ELSE 0 END) as totalResolvidos,
           AVG(CASE WHEN r.resolvedAt IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, r.createdAt, r.resolvedAt) ELSE NULL END) as avgMinutes,
           MIN(r.createdAt) as primeiroAtendimento,
           MAX(r.updatedAt) as ultimoAtendimento
         FROM requests r
         INNER JOIN users a ON a.id = r.assignedToId
         WHERE r.assignedToId IS NOT NULL
           AND r.createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)
         GROUP BY r.assignedToId, a.name, a.email, a.avatar
         ORDER BY totalAtendidos DESC, totalResolvidos DESC
         LIMIT 8`
      ) as any;

      // 7) Chamados por tipo
      const [typeRows] = await conn.query(
        `SELECT type, COUNT(*) as count
         FROM requests
         WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)
         GROUP BY type`
      ) as any;

      // 8b) Chamados via Teams (externalMessageId preenchido)
      const [teamsCountRows] = await conn.query(
        `SELECT COUNT(*) as count FROM requests
         WHERE externalMessageId IS NOT NULL AND externalMessageId != ''
         AND createdAt >= DATE_SUB(NOW(), INTERVAL ${daysNum} DAY)`
      ) as any;
      const teamsCount = Number(teamsCountRows[0]?.count) || 0;

      // 8) Tempo médio por agente (top 5)
      const topSupport = (topSupportRows as any[]).map((a: any) => {
        const mins = Number(a.avgMinutes) || 0;
        const total = Number(a.totalAtendidos) || 0;
        const resolved = Number(a.totalResolvidos) || 0;
        return {
          id: a.assignedToId,
          name: a.agentName || `Agente ${a.assignedToId}`,
          email: a.agentEmail || '',
          avatar: a.agentAvatar || null,
          totalAtendidos: total,
          totalResolvidos: resolved,
          taxaResolucao: total > 0 ? Math.round((resolved / total) * 100) : 0,
          avgMinutes: Math.round(mins),
          avgFormatted: mins >= 60 ? `${Math.round(mins / 60)}h ${Math.round(mins % 60)}min` : `${Math.round(mins)}min`,
        };
      });

      res.json({
        period: daysNum,
        kpi: {
          total,
          abertos: Number(kpi.abertos) || 0,
          resolvidos,
          em_andamento: Number(kpi.em_andamento) || 0,
          aguardando: Number(kpi.aguardando) || 0,
          sla_vencido: Number(kpi.sla_vencido) || 0,
          taxaResolucao,
          avgResolutionFormatted: avgHours,
          teamsCount,
        },
        byStatus: statusRows,
        byPriority: priorityRows,
        byType: typeRows,
        volumeByDay: volumeRows,
        recentTickets: recentRows,
        topSupport,
      });
    } finally {
      conn.release();
    }
  });
}
