import { Router, Request, Response, NextFunction } from 'express';
import { getPoolConn } from './mysql-pool';
import QRCode from 'qrcode';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import multer from 'multer';
import path from 'path';
import { jwtVerify } from 'jose';

const router = Router();

// Multer para upload de CSV/Excel (máx 5MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Helpers de autenticação locais (independentes do passport.session) ──────────

/**
 * Extrai e valida o usuário do Bearer token JWT no header Authorization.
 * Usa jose (já instalado) para verificar a assinatura.
 */
async function getUserFromToken(req: Request): Promise<{ id: number; email: string; role: string; name: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    const { payload } = await jwtVerify(token, secret);
    // O payload pode ter user.id (nosso JWT local) ou id direto
    const user = (payload as any).user || payload;
    return {
      id: Number(user.id),
      email: user.email || '',
      role: user.role || 'user',
      name: user.name || '',
    };
  } catch {
    return null;
  }
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Prioridade 1: Bearer token JWT (decodificado diretamente, independente do passport.session)
  const tokenUser = await getUserFromToken(req);
  if (tokenUser) {
    (req as any).estUser = tokenUser;
    return next();
  }
  // Prioridade 2: req.user do passport (fallback para sessão)
  const passportUser = (req as any).user;
  if (passportUser && passportUser.role) {
    (req as any).estUser = passportUser;
    return next();
  }
  return res.status(401).json({ error: 'Não autenticado' });
}

function requireRH(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).estUser;
  const role = user?.role;
  if (!role || !['admin', 'manager'].includes(role)) {
    return res.status(403).json({ error: 'Acesso restrito ao RH/Gerentes' });
  }
  next();
}

function gerarCodigo(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'EST-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Usa pool compartilhado da aplicação. Sempre use conn.release() no finally. */
async function getConn() {
  return getPoolConn();
}

// ─── TICKETS ESTACIONAMENTO ──────────────────────────────────────────────────

// GET /api/estacionamento/tickets - listar todos (RH)
router.get('/estacionamento/tickets', requireAuth, requireRH, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const { status, data_inicio, data_fim, criado_por } = req.query;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND te.status = ?'; params.push(status); }
    if (data_inicio) { where += ' AND DATE(te.criado_em) >= ?'; params.push(data_inicio); }
    if (data_fim) { where += ' AND DATE(te.criado_em) <= ?'; params.push(data_fim); }
    if (criado_por) { where += ' AND te.criado_por = ?'; params.push(criado_por); }

    const [tickets] = await conn.execute<any[]>(`
      SELECT 
        te.id, te.codigo, te.valor, te.duracao_horas, te.data_validade,
        te.status, te.criado_em,
        u.name AS criado_por_nome
      FROM tickets_estacionamento te
      LEFT JOIN users u ON te.criado_por = u.id
      ${where}
      ORDER BY te.criado_em DESC
    `, params);

    const [statsRows] = await conn.execute<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
        SUM(CASE WHEN status = 'alocado' THEN 1 ELSE 0 END) AS alocados,
        SUM(CASE WHEN status = 'usado' THEN 1 ELSE 0 END) AS usados,
        SUM(CASE WHEN status = 'expirado' THEN 1 ELSE 0 END) AS expirados
      FROM tickets_estacionamento
    `);

    res.json({ tickets, stats: statsRows[0] || {} });
  } catch (err: any) {
    console.error('[Estacionamento Tickets Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar tickets', details: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/estacionamento/disponiveis - retorna 1 ticket por duração (2h e 12h), o mais antigo disponível
router.get('/estacionamento/disponiveis', requireAuth, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Busca o ticket mais antigo disponível para 2h
    const [rows2h] = await conn.execute<any[]>(`
      SELECT id, codigo, valor, duracao_horas, data_validade, status, criado_em
      FROM tickets_estacionamento
      WHERE status = 'disponivel' AND duracao_horas = 2
        AND (data_validade IS NULL OR data_validade > ?)
      ORDER BY criado_em ASC
      LIMIT 1
    `, [now]);

    // Busca o ticket mais antigo disponível para 12h
    const [rows12h] = await conn.execute<any[]>(`
      SELECT id, codigo, valor, duracao_horas, data_validade, status, criado_em
      FROM tickets_estacionamento
      WHERE status = 'disponivel' AND duracao_horas = 12
        AND (data_validade IS NULL OR data_validade > ?)
      ORDER BY criado_em ASC
      LIMIT 1
    `, [now]);

    // Monta lista ordenada do mais antigo para o mais novo
    const candidates: any[] = [
      ...(Array.isArray(rows2h) ? rows2h : []),
      ...(Array.isArray(rows12h) ? rows12h : []),
    ].filter(Boolean);
    candidates.sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());

    res.json({ tickets: candidates });
  } catch (err: any) {
    console.error('[Estacionamento Disponíveis Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar tickets disponíveis', details: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/estacionamento/tickets - criar ticket manualmente (RH)
router.post('/estacionamento/tickets', requireAuth, requireRH, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const { codigo, valor, duracao_horas, data_validade } = req.body;
    const userId = (req as any).estUser?.id;
    const codigoFinal = codigo || gerarCodigo();

    await conn.execute(
      `INSERT INTO tickets_estacionamento (codigo, valor, duracao_horas, data_validade, status, criado_por)
       VALUES (?, ?, ?, ?, 'disponivel', ?)`,
      [codigoFinal, valor || null, duracao_horas || null, data_validade || null, userId]
    );

    res.status(201).json({ success: true, codigo: codigoFinal });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Código de ticket já existe' });
    }
    console.error('[Estacionamento Create Error]', err.message);
    res.status(500).json({ error: 'Erro ao criar ticket', details: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/rh/tickets/upload-csv - upload em lote via CSV/Excel
router.post('/rh/tickets/upload-csv', requireAuth, requireRH, upload.single('file'), async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

    const userId = (req as any).estUser?.id;
    let rows: any[] = [];

    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext === '.csv') {
      const text = req.file.buffer.toString('utf-8');
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      rows = result.data as any[];
    } else if (['.xlsx', '.xls'].includes(ext)) {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws);
    } else {
      return res.status(400).json({ error: 'Formato inválido. Use CSV ou Excel (.xlsx/.xls)' });
    }

    if (rows.length === 0) return res.status(400).json({ error: 'Arquivo vazio ou sem dados válidos' });
    if (rows.length > 1000) return res.status(400).json({ error: 'Máximo de 1000 tickets por upload' });

    let inseridos = 0;
    const erros: string[] = [];

    for (const row of rows) {
      const codigo = String(row.codigo || row.Codigo || row.CODIGO || '').trim();
      const valor = parseFloat(row.valor || row.Valor || row.VALOR || '0') || null;
      const duracaoHoras = parseInt(row.duracao_horas || row.duracao || row.horas || '0') || null;
      const dataValidade = row.data_validade || row.validade || null;

      if (!codigo) { erros.push('Linha sem código'); continue; }

      try {
        await conn.execute(
          `INSERT IGNORE INTO tickets_estacionamento (codigo, valor, duracao_horas, data_validade, status, criado_por)
           VALUES (?, ?, ?, ?, 'disponivel', ?)`,
          [codigo, valor, duracaoHoras, dataValidade || null, userId]
        );
        inseridos++;
      } catch (e: any) {
        erros.push(`Código ${codigo}: ${e.message}`);
      }
    }

    res.json({ success: true, inseridos, total: rows.length, erros: erros.slice(0, 10) });
  } catch (err: any) {
    console.error('[Estacionamento Upload CSV Error]', err.message);
    res.status(500).json({ error: 'Erro ao processar arquivo', details: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/estacionamento/tickets/:id - deletar ticket (RH)
router.delete('/estacionamento/tickets/:id', requireAuth, requireRH, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const { id } = req.params;

    const [rows] = await conn.execute<any[]>(
      'SELECT status FROM tickets_estacionamento WHERE id = ?', [id]
    );

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Ticket não encontrado' });
    if (rows[0].status === 'alocado') return res.status(409).json({ error: 'Ticket alocado não pode ser removido' });

    await conn.execute('DELETE FROM tickets_estacionamento WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao deletar ticket', details: err.message });
  } finally {
    conn.release();
  }
});

// ─── SOLICITAÇÕES ─────────────────────────────────────────────────────────────

// POST /api/estacionamento/solicitar - usuário solicita ticket
router.post('/estacionamento/solicitar', requireAuth, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const userId = (req as any).estUser?.id;
    const { ticket_id, duracao_solicitada } = req.body;

    if (!ticket_id || !duracao_solicitada) {
      return res.status(400).json({ error: 'ticket_id e duracao_solicitada são obrigatórios' });
    }

    // Verificar se ticket está disponível
    const [ticketRows] = await conn.execute<any[]>(
      `SELECT id, codigo, valor, duracao_horas, status FROM tickets_estacionamento
       WHERE id = ? AND status = 'disponivel'`,
      [ticket_id]
    );

    if (!ticketRows || ticketRows.length === 0) {
      return res.status(404).json({ error: 'Ticket não disponível' });
    }

    const ticket = ticketRows[0];

    // Calcular valor proporcional
    const valorPago = ticket.duracao_horas > 0
      ? ((parseFloat(ticket.valor) / ticket.duracao_horas) * duracao_solicitada).toFixed(2)
      : ticket.valor;

    // Payload inicial do QR Code
    const qrPayload: any = {
      solicitacaoId: null,
      usuarioId: userId,
      codigoTicket: ticket.codigo,
      duracaoHoras: duracao_solicitada,
      valorPago,
      timestamp: new Date().toISOString(),
    };

    // Inserir solicitação
    const [insertResult] = await conn.execute<any>(
      `INSERT INTO solicitacoes_ticket (usuario_id, ticket_id, duracao_solicitada, valor_pago, qrcode_data, status)
       VALUES (?, ?, ?, ?, ?, 'solicitado')`,
      [userId, ticket_id, duracao_solicitada, valorPago, JSON.stringify(qrPayload)]
    );

    const solicitacaoId = insertResult.insertId;
    qrPayload.solicitacaoId = solicitacaoId;

    // Atualizar qrcode_data com o id real
    await conn.execute(
      'UPDATE solicitacoes_ticket SET qrcode_data = ? WHERE id = ?',
      [JSON.stringify(qrPayload), solicitacaoId]
    );

    // Marcar ticket como alocado
    await conn.execute(
      "UPDATE tickets_estacionamento SET status = 'alocado' WHERE id = ?",
      [ticket_id]
    );

    // Gerar QR Code em base64
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      width: 300,
      margin: 2,
      color: { dark: '#0a0e27', light: '#ffffff' },
    });

    res.status(201).json({
      success: true,
      solicitacaoId,
      qrCode: qrCodeBase64,
      ticket: { codigo: ticket.codigo, duracao: duracao_solicitada, valorPago },
    });
  } catch (err: any) {
    console.error('[Estacionamento Solicitar Error]', err.message);
    res.status(500).json({ error: 'Erro ao processar solicitação', details: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/estacionamento/minhas-solicitacoes - histórico do usuário
router.get('/estacionamento/minhas-solicitacoes', requireAuth, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const userId = (req as any).estUser?.id;

    const [solicitacoes] = await conn.execute<any[]>(`
      SELECT 
        st.id, st.duracao_solicitada, st.valor_pago, st.qrcode_data,
        st.data_solicitacao, st.status,
        te.codigo AS ticket_codigo, te.duracao_horas AS ticket_duracao
      FROM solicitacoes_ticket st
      LEFT JOIN tickets_estacionamento te ON st.ticket_id = te.id
      WHERE st.usuario_id = ?
      ORDER BY st.data_solicitacao DESC
    `, [userId]);

    res.json({ solicitacoes });
  } catch (err: any) {
    console.error('[Estacionamento Minhas Solicitações Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar solicitações', details: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/estacionamento/historico-mes - histórico do último mês do usuário
router.get('/estacionamento/historico-mes', requireAuth, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const userId = (req as any).estUser?.id;
    const [solicitacoes] = await conn.execute<any[]>(`
      SELECT 
        st.id, st.duracao_solicitada, st.valor_pago, st.qrcode_data,
        st.data_solicitacao, st.status,
        te.codigo AS ticket_codigo, te.duracao_horas AS ticket_duracao
      FROM solicitacoes_ticket st
      LEFT JOIN tickets_estacionamento te ON st.ticket_id = te.id
      WHERE st.usuario_id = ?
        AND st.data_solicitacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY st.data_solicitacao DESC
    `, [userId]);
    res.json({ solicitacoes });
  } catch (err: any) {
    console.error('[Estacionamento Histórico Mês Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar histórico', details: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/estacionamento/solicitacao/:id/qrcode - regenerar QR Code
router.get('/estacionamento/solicitacao/:id/qrcode', requireAuth, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const userId = (req as any).estUser?.id;
    const { id } = req.params;

    const [rows] = await conn.execute<any[]>(`
      SELECT st.*, te.codigo FROM solicitacoes_ticket st
      LEFT JOIN tickets_estacionamento te ON st.ticket_id = te.id
      WHERE st.id = ? AND st.usuario_id = ?
    `, [id, userId]);

    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const sol = rows[0];
    const qrPayload = sol.qrcode_data ? JSON.parse(sol.qrcode_data) : { solicitacaoId: id, codigoTicket: sol.codigo };
    const qrCodeBase64 = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 300, margin: 2 });

    res.json({ qrCode: qrCodeBase64 });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar QR Code', details: err.message });
  } finally {
    conn.release();
  }
});

// ─── DASHBOARD RH ─────────────────────────────────────────────────────────────

// GET /api/rh/dashboard-estacionamento
router.get('/rh/dashboard-estacionamento', requireAuth, requireRH, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const { periodo = 'mes' } = req.query;

    let dateFilter = '';
    if (periodo === 'hoje') dateFilter = 'AND DATE(st.data_solicitacao) = CURDATE()';
    else if (periodo === 'semana') dateFilter = 'AND st.data_solicitacao >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    else if (periodo === 'mes') dateFilter = 'AND MONTH(st.data_solicitacao) = MONTH(CURDATE()) AND YEAR(st.data_solicitacao) = YEAR(CURDATE())';

    // KPIs principais
    const [kpisRows] = await conn.execute<any[]>(`
      SELECT 
        COUNT(*) AS total_solicitacoes,
        SUM(valor_pago) AS receita_total,
        AVG(valor_pago) AS valor_medio,
        AVG(duracao_solicitada) AS duracao_media
      FROM solicitacoes_ticket st
      WHERE 1=1 ${dateFilter}
    `);

    // KPIs de tickets
    const [ticketKpisRows] = await conn.execute<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
        SUM(CASE WHEN status = 'alocado' THEN 1 ELSE 0 END) AS alocados,
        SUM(CASE WHEN status = 'usado' THEN 1 ELSE 0 END) AS usados,
        SUM(CASE WHEN status = 'expirado' THEN 1 ELSE 0 END) AS expirados
      FROM tickets_estacionamento
    `);

    // Uso por dia (últimos 30 dias)
    const [usoPorDia] = await conn.execute<any[]>(`
      SELECT 
        DATE(data_solicitacao) AS dia,
        COUNT(*) AS total,
        SUM(valor_pago) AS receita
      FROM solicitacoes_ticket
      WHERE data_solicitacao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(data_solicitacao)
      ORDER BY dia ASC
    `);

    // Top 10 usuários
    const [topUsuarios] = await conn.execute<any[]>(`
      SELECT 
        u.name AS nome,
        u.email,
        COUNT(st.id) AS total_solicitacoes,
        SUM(st.valor_pago) AS total_gasto,
        AVG(st.duracao_solicitada) AS media_horas
      FROM solicitacoes_ticket st
      JOIN users u ON st.usuario_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id, u.name, u.email
      ORDER BY total_solicitacoes DESC
      LIMIT 10
    `);

    // Uso por departamento
    const [usoPorDepartamento] = await conn.execute<any[]>(`
      SELECT 
        COALESCE(u.department, 'Sem departamento') AS departamento,
        COUNT(st.id) AS total_usos,
        SUM(st.valor_pago) AS receita_total
      FROM solicitacoes_ticket st
      JOIN users u ON st.usuario_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.department
      ORDER BY total_usos DESC
    `);

    // Histórico recente
    const [historico] = await conn.execute<any[]>(`
      SELECT 
        st.id, st.duracao_solicitada, st.valor_pago, st.data_solicitacao, st.status,
        u.name AS usuario_nome, u.department AS departamento,
        te.codigo AS ticket_codigo
      FROM solicitacoes_ticket st
      LEFT JOIN users u ON st.usuario_id = u.id
      LEFT JOIN tickets_estacionamento te ON st.ticket_id = te.id
      ORDER BY st.data_solicitacao DESC
      LIMIT 50
    `);

    res.json({
      kpis: kpisRows[0] || {},
      ticketKpis: ticketKpisRows[0] || {},
      usoPorDia,
      topUsuarios,
      usoPorDepartamento,
      historico,
    });
  } catch (err: any) {
    console.error('[Estacionamento Dashboard Error]', err.message);
    res.status(503).json({ error: 'Erro ao carregar dashboard', details: err.message });
  } finally {
    conn.release();
  }
});

// GET /api/rh/tickets-relatorio - exportar relatório
router.get('/rh/tickets-relatorio', requireAuth, requireRH, async (req: Request, res: Response) => {
  const conn = await getConn();
  try {
    const { data_inicio, data_fim, status } = req.query;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (data_inicio) { where += ' AND DATE(st.data_solicitacao) >= ?'; params.push(data_inicio); }
    if (data_fim) { where += ' AND DATE(st.data_solicitacao) <= ?'; params.push(data_fim); }
    if (status) { where += ' AND st.status = ?'; params.push(status); }

    const [dados] = await conn.execute<any[]>(`
      SELECT 
        st.id AS solicitacao_id,
        te.codigo AS ticket_codigo,
        u.name AS usuario,
        u.email AS email_usuario,
        COALESCE(u.department, '-') AS departamento,
        st.duracao_solicitada AS duracao_horas,
        st.valor_pago,
        st.data_solicitacao,
        st.status
      FROM solicitacoes_ticket st
      LEFT JOIN users u ON st.usuario_id = u.id
      LEFT JOIN tickets_estacionamento te ON st.ticket_id = te.id
      ${where}
      ORDER BY st.data_solicitacao DESC
    `, params);

    res.json({ relatorio: dados, total: dados.length });
  } catch (err: any) {
    console.error('[Estacionamento Relatório Error]', err.message);
    res.status(503).json({ error: 'Erro ao gerar relatório', details: err.message });
  } finally {
    conn.release();
  }
});

export default router;
