/**
 * ITAM Routes - Gerenciamento de Ativos de TI + Documentos + RBAC
 * Endpoints:
 *   GET    /api/ativos              - Listar ativos (com filtros)
 *   POST   /api/ativos              - Criar ativo
 *   GET    /api/ativos/meus         - Meus ativos (usuário logado)
 *   GET    /api/ativos/:id          - Detalhe do ativo
 *   PUT    /api/ativos/:id          - Atualizar ativo
 *   DELETE /api/ativos/:id          - Deletar ativo (admin)
 *   GET    /api/arquivos/:chamadoId - Arquivos de um chamado
 *   POST   /api/arquivos/upload     - Upload de arquivo
 *   GET    /api/arquivos/ativo/:id  - Arquivos de um ativo
 *   DELETE /api/arquivos/:id        - Deletar arquivo
 *   GET    /api/gerenciador/:deptId - Árvore completa do departamento
 *   GET    /api/permissoes          - Listar permissões (admin)
 *   POST   /api/permissoes          - Criar permissão
 *   DELETE /api/permissoes/:id      - Revogar permissão
 */

import { Router, Request, Response } from 'express';
import { getPoolConn } from './mysql-pool';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Helper para tipar resultado de conn.execute como array */
function asRows(result: any): any[] {
  return result as any[];
}

/** Obtém conexão do pool. Sempre use conn.release() no finally. */
async function getConn(): Promise<any> {
  return getPoolConn();
}

function getUserFromReq(req: Request): { id: number; role: string } | null {
  const user = (req as any).user;
  if (!user) return null;
  return { id: Number(user.id), role: user.role || 'user' };
}

// Verifica se o usuário tem permissão para o recurso
async function checkPermission(
  conn: any,
  usuarioId: number,
  recursoId: number,
  recursoTipo: string,
  permissaoNecessaria: string
): Promise<boolean> {
  const niveis: Record<string, number> = { ler: 1, escrever: 2, gerenciar: 3, admin: 4 };
  const nivelNecessario = niveis[permissaoNecessaria] || 1;

  const [rows] = await conn.execute(
    `SELECT permissao FROM permissoes 
     WHERE usuarioId = ? AND recursoId = ? AND recursoTipo = ?`,
    [usuarioId, recursoId, recursoTipo]
  );

  if (rows.length === 0) return false;
  const nivelAtual = niveis[rows[0].permissao] || 0;
  return nivelAtual >= nivelNecessario;
}

// ─── Multer (Upload) ─────────────────────────────────────────────────────────

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      'video/mp4', 'video/webm',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  },
});

function getMimeCategory(mimeType: string): 'documento' | 'imagem' | 'video' | 'outro' {
  if (mimeType.startsWith('image/')) return 'imagem';
  if (mimeType.startsWith('video/')) return 'video';
  if (
    mimeType.includes('pdf') || mimeType.includes('word') ||
    mimeType.includes('excel') || mimeType.includes('text') ||
    mimeType.includes('spreadsheet')
  ) return 'documento';
  return 'outro';
}

// ─── ATIVOS ──────────────────────────────────────────────────────────────────

// GET /api/ativos - Listar ativos com filtros
router.get('/ativos', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const { status, tipo, departamentoId, usuarioId, search, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const conn = await getConn();
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND a.status = ?'; params.push(status); }
    if (tipo) { where += ' AND a.tipo = ?'; params.push(tipo); }
    if (departamentoId) { where += ' AND a.departamentoId = ?'; params.push(departamentoId); }
    if (usuarioId) { where += ' AND a.usuarioId = ?'; params.push(usuarioId); }
    if (search) {
      where += ' AND (a.nome LIKE ? OR a.serial LIKE ? OR a.fabricante LIKE ? OR a.modelo LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Usuários comuns só veem seus próprios ativos
    if (user.role === 'user') {
      where += ' AND a.usuarioId = ?';
      params.push(user.id);
    }

    const limitNum = Math.max(1, parseInt(limit as string) || 20);
    const offsetNum = Math.max(0, offset);
    const [rows] = await conn.execute(
      `SELECT a.*, 
              u.name AS usuarioNome,
              d.name AS departamentoNome
       FROM ativos a
       LEFT JOIN users u ON a.usuarioId = u.id
       LEFT JOIN departments d ON a.departamentoId = d.id
       ${where}
       ORDER BY a.createdAt DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    const [[{ total }]] = await conn.execute(
      `SELECT COUNT(*) as total FROM ativos a ${where}`,
      params
    );

    res.json({ data: rows, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (e: any) {
    console.error('[GET /api/ativos]', e.message);
    res.status(500).json({ error: 'Erro ao listar ativos' });
  } finally {
    conn.release();
  }
});

// GET /api/ativos/meus - Meus ativos
router.get('/ativos/meus', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      `SELECT a.*, d.name AS departamentoNome
       FROM ativos a
       LEFT JOIN departments d ON a.departamentoId = d.id
       WHERE a.usuarioId = ?
       ORDER BY a.createdAt DESC`,
      [user.id]
    );
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /api/ativos/meus]', e.message);
    res.status(500).json({ error: 'Erro ao buscar seus ativos' });
  } finally {
    conn.release();
  }
});

// GET /api/ativos/:id - Detalhe do ativo
router.get('/ativos/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      `SELECT a.*, 
              u.name AS usuarioNome, u.email AS usuarioEmail,
              d.name AS departamentoNome
       FROM ativos a
       LEFT JOIN users u ON a.usuarioId = u.id
       LEFT JOIN departments d ON a.departamentoId = d.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Ativo não encontrado' });

    const ativo = rows[0];

    // Usuário comum só pode ver seus próprios ativos
    if (user.role === 'user' && ativo.usuarioId !== user.id) {
      const temPermissao = await checkPermission(conn, user.id, ativo.id, 'ativo', 'ler');
      if (!temPermissao) return res.status(403).json({ error: 'Sem permissão para visualizar este ativo' });
    }

    // Buscar arquivos associados
    const [arquivos] = await conn.execute(
      'SELECT * FROM arquivos WHERE ativoId = ? ORDER BY uploadedAt DESC',
      [ativo.id]
    );

    res.json({ ...ativo, arquivos });
  } catch (e: any) {
    console.error('[GET /api/ativos/:id]', e.message);
    res.status(500).json({ error: 'Erro ao buscar ativo' });
  } finally {
    conn.release();
  }
});

// POST /api/ativos - Criar ativo
router.post('/ativos', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.role === 'user') return res.status(403).json({ error: 'Sem permissão para criar ativos' });

  const { serial, nome, tipo, departamentoId, usuarioId, status, custo, dataAquisicao,
          descricao, fabricante, modelo, garantiaAte } = req.body;

  if (!serial || !nome || !tipo) {
    return res.status(400).json({ error: 'serial, nome e tipo são obrigatórios' });
  }

  const conn = await getConn();
  try {
    const [result] = await conn.execute(
      `INSERT INTO ativos (serial, nome, tipo, departamentoId, usuarioId, status, custo, 
       dataAquisicao, descricao, fabricante, modelo, garantiaAte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [serial, nome, tipo, departamentoId || null, usuarioId || null,
       status || 'disponivel', custo || null, dataAquisicao || null,
       descricao || null, fabricante || null, modelo || null, garantiaAte || null]
    );

    const [rows] = await conn.execute('SELECT * FROM ativos WHERE id = ?', [result.insertId]) as any;
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Serial já cadastrado' });
    }
    console.error('[POST /api/ativos]', e.message);
    res.status(500).json({ error: 'Erro ao criar ativo' });
  } finally {
    conn.release();
  }
});

// PUT /api/ativos/:id - Atualizar ativo
router.put('/ativos/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.role === 'user') return res.status(403).json({ error: 'Sem permissão para editar ativos' });

  const { serial, nome, tipo, departamentoId, usuarioId, status, custo, dataAquisicao,
          descricao, fabricante, modelo, garantiaAte } = req.body;

  const conn = await getConn();
  try {
    const [existing] = await conn.execute('SELECT id FROM ativos WHERE id = ?', [req.params.id]) as any;
    if (!existing.length) return res.status(404).json({ error: 'Ativo não encontrado' });

    await conn.execute(
      `UPDATE ativos SET serial=?, nome=?, tipo=?, departamentoId=?, usuarioId=?, status=?,
       custo=?, dataAquisicao=?, descricao=?, fabricante=?, modelo=?, garantiaAte=?,
       updatedAt=CURRENT_TIMESTAMP
       WHERE id=?`,
      [serial, nome, tipo, departamentoId || null, usuarioId || null,
       status || 'disponivel', custo || null, dataAquisicao || null,
       descricao || null, fabricante || null, modelo || null, garantiaAte || null,
       req.params.id]
    );

    const [rows] = await conn.execute('SELECT * FROM ativos WHERE id = ?', [req.params.id]) as any;
    res.json(rows[0]);
  } catch (e: any) {
    console.error('[PUT /api/ativos/:id]', e.message);
    res.status(500).json({ error: 'Erro ao atualizar ativo' });
  } finally {
    conn.release();
  }
});

// DELETE /api/ativos/:id - Deletar ativo (admin)
router.delete('/ativos/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Apenas admins podem deletar ativos' });

  const conn = await getConn();
  try {
    const [existing] = await conn.execute('SELECT id FROM ativos WHERE id = ?', [req.params.id]) as any;
    if (!existing.length) return res.status(404).json({ error: 'Ativo não encontrado' });

    await conn.execute('DELETE FROM ativos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Ativo deletado com sucesso' });
  } catch (e: any) {
    console.error('[DELETE /api/ativos/:id]', e.message);
    res.status(500).json({ error: 'Erro ao deletar ativo' });
  } finally {
    conn.release();
  }
});

// POST /api/ativos/bulk-import - Importar ativos em lote via CSV/Excel
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv', 'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    // Aceitar também por extensão
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) || ['.csv', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV ou Excel (.xlsx/.xls) são permitidos'));
    }
  },
});

router.post('/ativos/bulk-import', csvUpload.single('planilha'), async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.role === 'user') return res.status(403).json({ error: 'Sem permissão para importar ativos' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  let rows: any[] = [];

  try {
    if (ext === '.csv' || req.file.mimetype === 'text/csv' || req.file.mimetype === 'text/plain') {
      // Parsear CSV
      const text = req.file.buffer.toString('utf-8');
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return res.status(400).json({ error: 'Planilha vazia ou sem dados' });
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      });
    } else {
      // Parsear Excel usando xlsx
      const XLSX = await import('xlsx');
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Normalizar chaves para lowercase
      rows = rows.map(r => {
        const obj: any = {};
        Object.keys(r).forEach(k => { obj[k.toLowerCase().trim()] = r[k]; });
        return obj;
      });
    }

    if (rows.length === 0) return res.status(400).json({ error: 'Nenhum dado encontrado na planilha' });
    if (rows.length > 1000) return res.status(400).json({ error: 'Máximo de 1000 ativos por importação' });

    const conn = await getConn();
    const resultados = { sucesso: 0, erros: 0, detalhes: [] as any[] };

    try {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const serial = String(r.serial || r['número de série'] || r['numero de serie'] || '').trim();
        const nome = String(r.nome || r.name || r.descricao || '').trim();
        const tipo = String(r.tipo || r.type || 'hardware').trim().toLowerCase();
        const status = String(r.status || 'disponivel').trim().toLowerCase();
        const fabricante = String(r.fabricante || r.manufacturer || '').trim();
        const modelo = String(r.modelo || r.model || '').trim();
        const custo = parseFloat(String(r.custo || r.cost || r.valor || '0').replace(',', '.')) || null;
        const dataAquisicao = r.dataaquisicao || r['data aquisicao'] || r['data de aquisicao'] || r.purchasedate || null;
        const garantiaAte = r.garantiaate || r['garantia ate'] || r['garantia até'] || r.warrantydate || null;
        const descricao = String(r.descricao || r.description || r.observacao || '').trim();

        if (!serial || !nome) {
          resultados.erros++;
          resultados.detalhes.push({ linha: i + 2, erro: 'serial e nome são obrigatórios', dados: { serial, nome } });
          continue;
        }

        const tiposValidos = ['hardware', 'software', 'licenca'];
        const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'hardware';
        const statusValidos = ['disponivel', 'alocado', 'manutencao', 'descartado'];
        const statusFinal = statusValidos.includes(status) ? status : 'disponivel';

        try {
          await conn.execute(
            `INSERT INTO ativos (serial, nome, tipo, status, fabricante, modelo, custo, dataAquisicao, garantiaAte, descricao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [serial, nome, tipoFinal, statusFinal,
             fabricante || null, modelo || null,
             custo, dataAquisicao || null, garantiaAte || null, descricao || null]
          );
          resultados.sucesso++;
        } catch (e: any) {
          resultados.erros++;
          const msg = e.code === 'ER_DUP_ENTRY' ? `Serial '${serial}' já existe` : e.message;
          resultados.detalhes.push({ linha: i + 2, erro: msg, dados: { serial, nome } });
        }
      }
    } finally {
      conn.release();
    }

    res.json({
      success: true,
      total: rows.length,
      sucesso: resultados.sucesso,
      erros: resultados.erros,
      detalhes: resultados.detalhes.slice(0, 50), // Limitar detalhes de erro
    });
  } catch (e: any) {
    console.error('[POST /api/ativos/bulk-import]', e.message);
    res.status(500).json({ error: 'Erro ao processar planilha: ' + e.message });
  }
});

// ─── ARQUIVOS ────────────────────────────────────────────────────────────────

// GET /api/arquivos - Listar todos os arquivos (admin/agente vê todos, user vê os seus)
router.get('/arquivos', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  const conn = await getConn();
  try {
    const { tipo, search, usuarioId } = req.query;
    const isAdmin = ['admin', 'agente', 'manager'].includes(user.role);
    let where = isAdmin ? '1=1' : 'arq.usuarioId = ?';
    const params: any[] = isAdmin ? [] : [user.id];
    if (tipo) { where += ' AND arq.tipo = ?'; params.push(tipo); }
    if (usuarioId && isAdmin) { where += ' AND arq.usuarioId = ?'; params.push(usuarioId); }
    if (search) {
      where += ' AND (arq.nomeOriginal LIKE ? OR arq.descricao LIKE ? OR arq.tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const [rows] = await conn.execute(
      `SELECT arq.*, u.name AS usuarioNome
       FROM arquivos arq
       LEFT JOIN users u ON arq.usuarioId = u.id
       WHERE ${where}
       ORDER BY arq.uploadedAt DESC
       LIMIT 200`,
      params
    );
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /api/arquivos]', e.message);
    res.status(500).json({ error: 'Erro ao buscar arquivos' });
  } finally {
    conn.release();
  }
});

// GET /api/arquivos/:chamadoId - Arquivos de um chamado
router.get('/arquivos/:chamadoId', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      `SELECT arq.*, u.name AS usuarioNome
       FROM arquivos arq
       LEFT JOIN users u ON arq.usuarioId = u.id
       WHERE arq.chamadoId = ?
       ORDER BY arq.uploadedAt DESC`,
      [req.params.chamadoId]
    );
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /api/arquivos/:chamadoId]', e.message);
    res.status(500).json({ error: 'Erro ao buscar arquivos' });
  } finally {
    conn.release();
  }
});

// GET /api/arquivos/ativo/:ativoId - Arquivos de um ativo
router.get('/arquivos/ativo/:ativoId', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      `SELECT arq.*, u.name AS usuarioNome
       FROM arquivos arq
       LEFT JOIN users u ON arq.usuarioId = u.id
       WHERE arq.ativoId = ?
       ORDER BY arq.uploadedAt DESC`,
      [req.params.ativoId]
    );
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /api/arquivos/ativo/:ativoId]', e.message);
    res.status(500).json({ error: 'Erro ao buscar arquivos do ativo' });
  } finally {
    conn.release();
  }
});

// POST /api/arquivos/upload - Upload de arquivo
router.post('/arquivos/upload', upload.single('arquivo'), async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  const { chamadoId, ativoId, departamentoId, descricao, tags } = req.body;
  const tipo = getMimeCategory(req.file.mimetype);
  const caminho = `/uploads/${req.file.filename}`;

  const conn = await getConn();
  try {
    // Verificar permissão se associado a um chamado
    if (chamadoId && user.role === 'user') {
      const [chamado] = await conn.execute('SELECT userId FROM tickets WHERE id = ?', [chamadoId]) as any;
      if (chamado.length && chamado[0].userId !== user.id) {
        const temPermissao = await checkPermission(conn, user.id, Number(chamadoId), 'chamado', 'escrever');
        if (!temPermissao) {
          fs.unlinkSync(req.file.path);
          return res.status(403).json({ error: 'Sem permissão para adicionar arquivo a este chamado' });
        }
      }
    }

    const [result] = await conn.execute(
      `INSERT INTO arquivos (nome, nomeOriginal, caminho, tipo, mimeType, tamanho, 
       chamadoId, ativoId, usuarioId, departamentoId, descricao, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.file.filename, req.file.originalname, caminho, tipo, req.file.mimetype,
       req.file.size, chamadoId || null, ativoId || null, user.id,
       departamentoId || null, descricao || null, tags || null]
    );

    const [rows] = await conn.execute('SELECT * FROM arquivos WHERE id = ?', [result.insertId]) as any;
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('[POST /api/arquivos/upload]', e.message);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  } finally {
    conn.release();
  }
});

// DELETE /api/arquivos/:id - Deletar arquivo
router.delete('/arquivos/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const conn = await getConn();
  try {
    const [rows] = await conn.execute('SELECT * FROM arquivos WHERE id = ?', [req.params.id]) as any;
    if (!rows.length) return res.status(404).json({ error: 'Arquivo não encontrado' });

    const arquivo = rows[0];

    // Só o dono ou admin pode deletar
    if (user.role !== 'admin' && arquivo.usuarioId !== user.id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este arquivo' });
    }

    // Remover arquivo físico
    const filePath = path.join(process.cwd(), arquivo.caminho);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await conn.execute('DELETE FROM arquivos WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  } catch (e: any) {
    console.error('[DELETE /api/arquivos/:id]', e.message);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  } finally {
    conn.release();
  }
});

// ─── GERENCIADOR (Árvore por Departamento) ───────────────────────────────────

// GET /api/gerenciador/:deptId - Árvore completa do departamento
router.get('/gerenciador/:deptId', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const deptId = req.params.deptId;
  const conn = await getConn();
  try {
    // Buscar departamento
    const [dept] = await conn.execute(
      'SELECT * FROM departments WHERE id = ?', [deptId]
    );
    if (!dept.length) return res.status(404).json({ error: 'Departamento não encontrado' });

    // Buscar usuários do departamento
    const [usuarios] = await conn.execute(
      `SELECT u.id, u.name, u.email, u.role, u.profileImage, u.department
       FROM users u
       WHERE u.department = ? OR u.id IN (
         SELECT userId FROM userCompanyAssignments WHERE departmentId = ?
       )`,
      [dept[0].name, deptId]
    );

    // Buscar ativos do departamento
    const [ativos] = await conn.execute(
      `SELECT a.*, u.name AS usuarioNome
       FROM ativos a
       LEFT JOIN users u ON a.usuarioId = u.id
       WHERE a.departamentoId = ?
       ORDER BY a.tipo, a.nome`,
      [deptId]
    );

    // Buscar arquivos do departamento
    const [arquivos] = await conn.execute(
      `SELECT arq.*, u.name AS usuarioNome
       FROM arquivos arq
       LEFT JOIN users u ON arq.usuarioId = u.id
       WHERE arq.departamentoId = ?
       ORDER BY arq.tipo, arq.nomeOriginal`,
      [deptId]
    );

    // Buscar chamados do departamento
    const [chamados] = await conn.execute(
      `SELECT t.id, t.ticketId, t.title, t.status, t.priority, t.createdAt, u.name AS usuarioNome
       FROM tickets t
       LEFT JOIN users u ON t.userId = u.id
       WHERE t.department = ?
       ORDER BY t.createdAt DESC
       LIMIT 20`,
      [dept[0].name]
    );

    // Estatísticas
    const stats = {
      totalUsuarios: usuarios.length,
      totalAtivos: ativos.length,
      ativosDisponiveis: ativos.filter((a: any) => a.status === 'disponivel').length,
      ativosAlocados: ativos.filter((a: any) => a.status === 'alocado').length,
      totalArquivos: arquivos.length,
      totalChamados: chamados.length,
    };

    res.json({
      departamento: dept[0],
      stats,
      usuarios,
      ativos: {
        hardware: ativos.filter((a: any) => a.tipo === 'hardware'),
        software: ativos.filter((a: any) => a.tipo === 'software'),
        licencas: ativos.filter((a: any) => a.tipo === 'licenca'),
      },
      arquivos: {
        documentos: arquivos.filter((a: any) => a.tipo === 'documento'),
        imagens: arquivos.filter((a: any) => a.tipo === 'imagem'),
        videos: arquivos.filter((a: any) => a.tipo === 'video'),
        outros: arquivos.filter((a: any) => a.tipo === 'outro'),
      },
      chamados,
    });
  } catch (e: any) {
    console.error('[GET /api/gerenciador/:deptId]', e.message);
    res.status(500).json({ error: 'Erro ao buscar dados do departamento' });
  } finally {
    conn.release();
  }
});

// ─── PERMISSÕES (RBAC) ───────────────────────────────────────────────────────

// GET /api/permissoes - Listar permissões (admin/manager)
router.get('/permissoes', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Sem permissão para listar permissões' });
  }

  const { usuarioId, recursoTipo } = req.query;
  const conn = await getConn();
  try {
    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (usuarioId) { where += ' AND p.usuarioId = ?'; params.push(usuarioId); }
    if (recursoTipo) { where += ' AND p.recursoTipo = ?'; params.push(recursoTipo); }

    const [rows] = await conn.execute(
      `SELECT p.*, 
              u.name AS usuarioNome, u.email AS usuarioEmail,
              g.name AS concedidoPorNome
       FROM permissoes p
       LEFT JOIN users u ON p.usuarioId = u.id
       LEFT JOIN users g ON p.concedidoPor = g.id
       ${where}
       ORDER BY p.createdAt DESC`,
      params
    );
    res.json(rows);
  } catch (e: any) {
    console.error('[GET /api/permissoes]', e.message);
    res.status(500).json({ error: 'Erro ao listar permissões' });
  } finally {
    conn.release();
  }
});

// POST /api/permissoes - Criar permissão
router.post('/permissoes', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (!['admin', 'manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Sem permissão para criar permissões' });
  }

  const { usuarioId, recursoId, recursoTipo, permissao } = req.body;
  if (!usuarioId || !recursoId || !recursoTipo || !permissao) {
    return res.status(400).json({ error: 'usuarioId, recursoId, recursoTipo e permissao são obrigatórios' });
  }

  const conn = await getConn();
  try {
    // Upsert: atualiza se já existe
    await conn.execute(
      `INSERT INTO permissoes (usuarioId, recursoId, recursoTipo, permissao, concedidoPor)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE permissao = VALUES(permissao), concedidoPor = VALUES(concedidoPor), updatedAt = CURRENT_TIMESTAMP`,
      [usuarioId, recursoId, recursoTipo, permissao, user.id]
    );

    const [rows] = await conn.execute(
      `SELECT p.*, u.name AS usuarioNome
       FROM permissoes p LEFT JOIN users u ON p.usuarioId = u.id
       WHERE p.usuarioId = ? AND p.recursoId = ? AND p.recursoTipo = ?`,
      [usuarioId, recursoId, recursoTipo]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    console.error('[POST /api/permissoes]', e.message);
    res.status(500).json({ error: 'Erro ao criar permissão' });
  } finally {
    conn.release();
  }
});

// DELETE /api/permissoes/:id - Revogar permissão
router.delete('/permissoes/:id', async (req: Request, res: Response) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Apenas admins podem revogar permissões' });

  const conn = await getConn();
  try {
    const [existing] = await conn.execute('SELECT id FROM permissoes WHERE id = ?', [req.params.id]) as any;
    if (!existing.length) return res.status(404).json({ error: 'Permissão não encontrada' });

    await conn.execute('DELETE FROM permissoes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Permissão revogada com sucesso' });
  } catch (e: any) {
    console.error('[DELETE /api/permissoes/:id]', e.message);
    res.status(500).json({ error: 'Erro ao revogar permissão' });
  } finally {
    conn.release();
  }
});

export default router;
