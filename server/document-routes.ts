import { Router, Request, Response } from 'express';
import { getPool } from './mysql-pool';
import multer from 'multer';
import { storagePut, storageGet } from './storage';
import { sendDocumentAssignedEmail } from './email-service';

const router = Router();

// ─── Upload via memória (S3) ─────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, Word, Excel, imagens ou texto.'));
    }
  },
});

// ─── Rotas do Usuário ─────────────────────────────────────────────────────────

/**
 * GET /api/documents/my
 * Retorna os documentos atribuídos ao usuário logado
 */
router.get('/documents/my', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  try {
    const [rows] = await pool.query<any[]>(
      `SELECT
        d.id,
        d.title,
        d.description,
        d.category,
        d.groupName,
        d.fileUrl,
        d.fileKey,
        d.fileName,
        d.fileSize,
        d.mimeType,
        d.createdAt,
        da.id AS assignmentId,
        da.status,
        da.assignedAt,
        da.readAt,
        da.signedAt,
        da.signatureIp,
        da.signatureData
       FROM documents d
       INNER JOIN document_assignments da ON d.id = da.documentId
       WHERE da.userId = ?
       ORDER BY da.assignedAt DESC`,
      [user.id]
    );
    res.json({ documents: rows, total: rows.length });
  } catch (err: any) {
    console.error('[Documents] Error fetching user documents:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/:id/download
 * Proxy de download seguro — força o download do arquivo com nome original
 */
router.get('/documents/:id/download', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Verifica se o usuário tem acesso ao documento (atribuído ou admin/agente)
    const [docRows] = await pool.query<any[]>(
      `SELECT d.* FROM documents d
       LEFT JOIN document_assignments da ON d.id = da.documentId AND da.userId = ?
       WHERE d.id = ? AND (da.userId IS NOT NULL OR ? IN ('admin','agente'))`,
      [user.id, docId, user.role]
    );

    if (!docRows.length) {
      return res.status(404).json({ error: 'Documento não encontrado ou sem permissão' });
    }

    const doc = docRows[0];
    if (!doc.fileUrl) {
      return res.status(404).json({ error: 'Este documento não possui arquivo para download' });
    }

    const fileName = doc.fileName || doc.title || 'documento';

    // Se tiver fileKey, gera URL assinada via storage
    if (doc.fileKey) {
      try {
        const { url } = await storageGet(doc.fileKey);
        // Redireciona para URL assinada com header de download
        return res.redirect(url);
      } catch (storageErr: any) {
        console.warn('[Documents] storageGet failed, falling back to fileUrl:', storageErr.message);
      }
    }

    // Fallback: faz proxy do arquivo para forçar download
    try {
      const fileRes = await fetch(doc.fileUrl);
      if (!fileRes.ok) throw new Error(`Upstream ${fileRes.status}`);

      const contentType = doc.mimeType || fileRes.headers.get('content-type') || 'application/octet-stream';
      const safeFileName = encodeURIComponent(fileName);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`);

      const buffer = await fileRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (fetchErr: any) {
      // Último recurso: redireciona direto
      res.redirect(doc.fileUrl);
    }
  } catch (err: any) {
    console.error('[Documents] Error downloading document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/:id/view
 * Retorna URL de visualização (inline) do documento
 */
router.get('/documents/:id/view', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [docRows] = await pool.query<any[]>(
      `SELECT d.* FROM documents d
       LEFT JOIN document_assignments da ON d.id = da.documentId AND da.userId = ?
       WHERE d.id = ? AND (da.userId IS NOT NULL OR ? IN ('admin','agente'))`,
      [user.id, docId, user.role]
    );

    if (!docRows.length) {
      return res.status(404).json({ error: 'Documento não encontrado ou sem permissão' });
    }

    const doc = docRows[0];
    if (!doc.fileUrl) {
      return res.status(404).json({ error: 'Este documento não possui arquivo para visualização' });
    }

    // Se tiver fileKey, gera URL assinada
    if (doc.fileKey) {
      try {
        const { url } = await storageGet(doc.fileKey);
        return res.json({ url, mimeType: doc.mimeType, fileName: doc.fileName });
      } catch (storageErr: any) {
        console.warn('[Documents] storageGet failed, using fileUrl:', storageErr.message);
      }
    }

    res.json({ url: doc.fileUrl, mimeType: doc.mimeType, fileName: doc.fileName });
  } catch (err: any) {
    console.error('[Documents] Error getting view URL:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents/:id/acknowledge
 * Marca um documento como lido/confirmado pelo usuário
 */
router.post('/documents/:id/acknowledge', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await pool.query(
      `UPDATE document_assignments
       SET status = 'acknowledged', readAt = NOW()
       WHERE documentId = ? AND userId = ?`,
      [docId, user.id]
    );
    res.json({ success: true, message: 'Documento confirmado com sucesso' });
  } catch (err: any) {
    console.error('[Documents] Error acknowledging document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents/:id/read
 * Marca um documento como lido (sem confirmação formal)
 */
router.post('/documents/:id/read', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Só atualiza se ainda estiver como 'pending'
    await pool.query(
      `UPDATE document_assignments
       SET status = 'read', readAt = COALESCE(readAt, NOW())
       WHERE documentId = ? AND userId = ? AND status = 'pending'`,
      [docId, user.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Documents] Error marking document as read:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents/:id/sign
 * Registra assinatura digital do usuário com timestamp, IP e dados do assinante
 */
router.post('/documents/:id/sign', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Verifica se já foi assinado
    const [existing] = await pool.query<any[]>(
      `SELECT id, status, signedAt FROM document_assignments WHERE documentId = ? AND userId = ?`,
      [docId, user.id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: 'Atribuição não encontrada' });
    }

    if (existing[0].status === 'signed') {
      return res.status(409).json({
        error: 'Documento já assinado',
        signedAt: existing[0].signedAt,
      });
    }

    // Capturar IP do usuário
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'desconhecido';

    // Montar dados da assinatura
    const signatureData = JSON.stringify({
      userId: user.id,
      userName: user.name || user.email,
      userEmail: user.email,
      userRole: user.role,
      department: user.department || null,
      signedAt: new Date().toISOString(),
      ip,
      userAgent: req.headers['user-agent'] || 'desconhecido',
    });

    const now = new Date();

    await pool.query(
      `UPDATE document_assignments
       SET status = 'signed',
           signedAt = ?,
           signatureIp = ?,
           signatureData = ?,
           readAt = COALESCE(readAt, ?)
       WHERE documentId = ? AND userId = ?`,
      [now, ip, signatureData, now, docId, user.id]
    );

    console.log(`[Documents] Assinatura digital registrada: doc=${docId}, user=${user.id}, ip=${ip}`);

    res.json({
      success: true,
      message: 'Documento assinado digitalmente com sucesso',
      signedAt: now.toISOString(),
      signatureData: JSON.parse(signatureData),
    });
  } catch (err: any) {
    console.error('[Documents] Error signing document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Rotas Admin ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/documents
 * Lista todos os documentos (admin) com info de atribuições por usuário e departamento
 */
router.get('/admin/documents', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'agente')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  try {
    const [rows] = await pool.query<any[]>(
      `SELECT
        d.*,
        COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id), 0) AS total_assigned,
        COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id AND status != 'pending'), 0) AS total_read,
        (SELECT GROUP_CONCAT(DISTINCT dep.name ORDER BY dep.name SEPARATOR ', ')
         FROM document_department_assignments dda
         INNER JOIN departments dep ON dda.departmentId = dep.id
         WHERE dda.documentId = d.id) AS assigned_departments
       FROM documents d
       ORDER BY d.createdAt DESC`
    );
    res.json({ documents: rows, total: rows.length });
  } catch (err: any) {
    // Fallback sem a coluna assigned_departments caso a tabela não exista ainda
    try {
      const [rows] = await pool.query<any[]>(
        `SELECT
          d.*,
          COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id), 0) AS total_assigned,
          COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id AND status != 'pending'), 0) AS total_read
         FROM documents d
         ORDER BY d.createdAt DESC`
      );
      res.json({ documents: rows, total: rows.length });
    } catch (fallbackErr: any) {
      console.error('[Documents] Error listing documents:', fallbackErr.message);
      res.status(500).json({ error: fallbackErr.message });
    }
  }
});

/**
 * GET /api/admin/documents/:id
 * Retorna detalhes de um documento específico com atribuições
 */
router.get('/admin/documents/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'agente')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [docRows] = await pool.query<any[]>(
      `SELECT d.*,
        COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id), 0) AS total_assigned,
        COALESCE((SELECT COUNT(*) FROM document_assignments WHERE documentId = d.id AND status != 'pending'), 0) AS total_read
       FROM documents d WHERE d.id = ?`,
      [docId]
    );
    if (!docRows.length) return res.status(404).json({ error: 'Documento não encontrado' });

    // Buscar atribuições de departamento
    let deptAssignments: any[] = [];
    try {
      const [deptRows] = await pool.query<any[]>(
        `SELECT dda.departmentId, dep.name AS departmentName
         FROM document_department_assignments dda
         INNER JOIN departments dep ON dda.departmentId = dep.id
         WHERE dda.documentId = ?`,
        [docId]
      );
      deptAssignments = deptRows;
    } catch (_) {}

    res.json({ document: docRows[0], departmentAssignments: deptAssignments });
  } catch (err: any) {
    console.error('[Documents] Error fetching document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/documents/:id/download
 * Download de arquivo para admin (sem verificação de atribuição)
 */
router.get('/admin/documents/:id/download', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'agente')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [docRows] = await pool.query<any[]>(
      `SELECT * FROM documents WHERE id = ?`,
      [docId]
    );

    if (!docRows.length) return res.status(404).json({ error: 'Documento não encontrado' });

    const doc = docRows[0];
    if (!doc.fileUrl) return res.status(404).json({ error: 'Este documento não possui arquivo' });

    const fileName = doc.fileName || doc.title || 'documento';

    // Se tiver fileKey, gera URL assinada via storage
    if (doc.fileKey) {
      try {
        const { url } = await storageGet(doc.fileKey);
        return res.redirect(url);
      } catch (storageErr: any) {
        console.warn('[Documents] storageGet failed, falling back to fileUrl:', storageErr.message);
      }
    }

    // Proxy do arquivo para forçar download
    try {
      const fileRes = await fetch(doc.fileUrl);
      if (!fileRes.ok) throw new Error(`Upstream ${fileRes.status}`);

      const contentType = doc.mimeType || fileRes.headers.get('content-type') || 'application/octet-stream';
      const safeFileName = encodeURIComponent(fileName);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`);

      const buffer = await fileRes.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (fetchErr: any) {
      res.redirect(doc.fileUrl);
    }
  } catch (err: any) {
    console.error('[Documents] Error downloading document (admin):', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents/upload
 * Faz upload de um arquivo para S3 e cria o documento
 * Aceita multipart/form-data com campos: title, description, category, file
 */
router.post('/admin/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { title, description, category, groupName } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  try {
    let fileUrl: string | null = null;
    let fileKey: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    if (req.file) {
      // Gerar chave única para o arquivo no S3
      const ext = req.file.originalname.split('.').pop() || 'bin';
      const safeName = req.file.originalname
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50);
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).slice(2, 8);
      fileKey = `documents/${timestamp}-${randomSuffix}-${safeName}.${ext}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;

      // Upload para S3
      const result = await storagePut(fileKey, req.file.buffer, req.file.mimetype);
      fileUrl = result.url;
    }

    const [result] = await pool.query<any>(
      `INSERT INTO documents (title, description, category, groupName, fileUrl, fileKey, fileName, fileSize, mimeType, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, description || null, category || null, groupName || null, fileUrl, fileKey, fileName, fileSize, mimeType]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Documento criado com sucesso',
      fileUrl,
      fileName,
    });
  } catch (err: any) {
    console.error('[Documents] Error uploading document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents
 * Cria um novo documento (sem arquivo — apenas URL ou texto)
 */
router.post('/admin/documents', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { title, description, category, fileUrl, groupName } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  try {
    const [result] = await pool.query<any>(
      `INSERT INTO documents (title, description, category, groupName, fileUrl, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, description || null, category || null, groupName || null, fileUrl || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Documento criado com sucesso' });
  } catch (err: any) {
    console.error('[Documents] Error creating document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/documents/:id
 * Atualiza um documento (metadados ou nova URL)
 */
router.put('/admin/documents/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  const { title, description, category, fileUrl, groupName } = req.body;
  if (!title) return res.status(400).json({ error: 'Título é obrigatório' });

  try {
    await pool.query(
      `UPDATE documents SET title = ?, description = ?, category = ?, groupName = ?, fileUrl = ?, updatedAt = NOW()
       WHERE id = ?`,
      [title, description || null, category || null, groupName || null, fileUrl || null, docId]
    );
    res.json({ success: true, message: 'Documento atualizado com sucesso' });
  } catch (err: any) {
    console.error('[Documents] Error updating document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/documents/:id/upload
 * Substitui o arquivo de um documento existente
 */
router.put('/admin/documents/:id/upload', upload.single('file'), async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

  try {
    const ext = req.file.originalname.split('.').pop() || 'bin';
    const safeName = req.file.originalname
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileKey = `documents/${timestamp}-${randomSuffix}-${safeName}.${ext}`;

    const result = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

    // Atualiza também title/description/category/groupName se enviados no body
    const { title, description, category, groupName } = req.body;
    if (title) {
      await pool.query(
        `UPDATE documents
         SET fileUrl = ?, fileKey = ?, fileName = ?, fileSize = ?, mimeType = ?,
             title = ?, description = ?, category = ?, groupName = ?, updatedAt = NOW()
         WHERE id = ?`,
        [result.url, fileKey, req.file.originalname, req.file.size, req.file.mimetype,
         title, description || null, category || null, groupName || null, docId]
      );
    } else {
      await pool.query(
        `UPDATE documents
         SET fileUrl = ?, fileKey = ?, fileName = ?, fileSize = ?, mimeType = ?, updatedAt = NOW()
         WHERE id = ?`,
        [result.url, fileKey, req.file.originalname, req.file.size, req.file.mimetype, docId]
      );
    }

    res.json({
      success: true,
      message: 'Arquivo atualizado com sucesso',
      fileUrl: result.url,
      fileName: req.file.originalname,
    });
  } catch (err: any) {
    console.error('[Documents] Error replacing document file:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Remove um documento e suas atribuições
 */
router.delete('/admin/documents/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Remove atribuições primeiro (FK)
    await pool.query(`DELETE FROM document_assignments WHERE documentId = ?`, [docId]);
    // Remove atribuições de departamento
    try {
      await pool.query(`DELETE FROM document_department_assignments WHERE documentId = ?`, [docId]);
    } catch (_) {}
    await pool.query(`DELETE FROM documents WHERE id = ?`, [docId]);
    res.json({ success: true, message: 'Documento removido com sucesso' });
  } catch (err: any) {
    console.error('[Documents] Error deleting document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents/:id/assign
 * Atribui um documento a um ou mais usuários
 * Body: { userIds: number[] }
 */
router.post('/admin/documents/:id/assign', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds deve ser um array não vazio' });
  }

  try {
    // Buscar dados do documento
    const [docRows] = await pool.query<any[]>(
      `SELECT title, description, category FROM documents WHERE id = ?`,
      [docId]
    );
    const doc = docRows[0];

    let assigned = 0;
    let skipped = 0;
    const emailPromises: Promise<boolean>[] = [];

    for (const uid of userIds) {
      // Verifica se já está atribuído
      const [existing] = await pool.query<any[]>(
        `SELECT id FROM document_assignments WHERE documentId = ? AND userId = ?`,
        [docId, uid]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      await pool.query(
        `INSERT INTO document_assignments (documentId, userId, status, assignedAt)
         VALUES (?, ?, 'pending', NOW())`,
        [docId, uid]
      );
      assigned++;

      // Buscar dados do usuário para enviar e-mail
      const [userRows] = await pool.query<any[]>(
        `SELECT name, email FROM users WHERE id = ?`,
        [uid]
      );
      if (userRows.length > 0 && userRows[0].email && doc) {
        emailPromises.push(
          sendDocumentAssignedEmail({
            userName: userRows[0].name,
            userEmail: userRows[0].email,
            documentTitle: doc.title,
            documentDescription: doc.description,
            documentCategory: doc.category,
            assignedBy: user.name || user.email,
          }).catch(e => { console.error('[Documents] Email error:', e.message); return false; })
        );
      }
    }

    // Enviar e-mails em paralelo (não bloquear resposta)
    Promise.all(emailPromises).then(results => {
      const sent = results.filter(Boolean).length;
      if (sent > 0) console.log(`[Documents] ${sent} e-mail(s) de atribuição enviado(s)`);
    });

    res.json({
      success: true,
      message: `${assigned} usuário(s) atribuído(s), ${skipped} já atribuído(s)`,
      assigned,
      skipped,
    });
  } catch (err: any) {
    console.error('[Documents] Error assigning document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents/:id/assign-department
 * Atribui um documento a um departamento e a todos os usuários desse departamento
 * Body: { departmentIds: number[] }
 */
router.post('/admin/documents/:id/assign-department', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  const { departmentIds } = req.body;
  if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
    return res.status(400).json({ error: 'departmentIds deve ser um array não vazio' });
  }

  try {
    // Criar tabela de atribuições de departamento se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_department_assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        documentId INT NOT NULL,
        departmentId INT NOT NULL,
        assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_doc_dept (documentId, departmentId)
      )
    `);

    // Buscar dados do documento
    const [docRowsDept] = await pool.query<any[]>(
      `SELECT title, description, category FROM documents WHERE id = ?`,
      [docId]
    );
    const docDept = docRowsDept[0];

    let deptAssigned = 0;
    let usersAssigned = 0;
    let usersSkipped = 0;
    const deptEmailPromises: Promise<boolean>[] = [];

    for (const deptId of departmentIds) {
      // Registra atribuição ao departamento (ignora se já existe)
      try {
        await pool.query(
          `INSERT IGNORE INTO document_department_assignments (documentId, departmentId, assignedAt)
           VALUES (?, ?, NOW())`,
          [docId, deptId]
        );
        deptAssigned++;
      } catch (_) {}

      // Busca usuários do departamento pelo campo department (nome) ou departmentId
      const [deptRows] = await pool.query<any[]>(
        `SELECT name FROM departments WHERE id = ?`,
        [deptId]
      );

      if (deptRows.length > 0) {
        const deptName = deptRows[0].name;
        // Busca usuários pelo nome do departamento
        const [deptUsers] = await pool.query<any[]>(
          `SELECT id, name, email FROM users WHERE department = ?`,
          [deptName]
        );

        for (const deptUser of deptUsers) {
          const [existing] = await pool.query<any[]>(
            `SELECT id FROM document_assignments WHERE documentId = ? AND userId = ?`,
            [docId, deptUser.id]
          );
          if (existing.length > 0) {
            usersSkipped++;
            continue;
          }
          await pool.query(
            `INSERT INTO document_assignments (documentId, userId, status, assignedAt)
             VALUES (?, ?, 'pending', NOW())`,
            [docId, deptUser.id]
          );
          usersAssigned++;

          // Enviar e-mail de notificação
          if (deptUser.email && docDept) {
            deptEmailPromises.push(
              sendDocumentAssignedEmail({
                userName: deptUser.name,
                userEmail: deptUser.email,
                documentTitle: docDept.title,
                documentDescription: docDept.description,
                documentCategory: docDept.category,
                assignedBy: user.name || user.email,
              }).catch(e => { console.error('[Documents] Email error:', e.message); return false; })
            );
          }
        }
      }
    }

    // Enviar e-mails em paralelo
    Promise.all(deptEmailPromises).then(results => {
      const sent = results.filter(Boolean).length;
      if (sent > 0) console.log(`[Documents] ${sent} e-mail(s) de atribuição por departamento enviado(s)`);
    });

    res.json({
      success: true,
      message: `${deptAssigned} departamento(s) atribuído(s), ${usersAssigned} usuário(s) notificado(s), ${usersSkipped} já atribuído(s)`,
      deptAssigned,
      usersAssigned,
      usersSkipped,
    });
  } catch (err: any) {
    console.error('[Documents] Error assigning document to department:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/documents/:id/assign-department/:deptId
 * Remove atribuição de um documento a um departamento
 */
router.delete('/admin/documents/:id/assign-department/:deptId', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  const deptId = parseInt(req.params.deptId);
  if (isNaN(docId) || isNaN(deptId)) return res.status(400).json({ error: 'IDs inválidos' });

  try {
    await pool.query(
      `DELETE FROM document_department_assignments WHERE documentId = ? AND departmentId = ?`,
      [docId, deptId]
    );
    res.json({ success: true, message: 'Atribuição de departamento removida' });
  } catch (err: any) {
    console.error('[Documents] Error removing department assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents/:id/assign-all
 * Atribui um documento a todos os usuários ativos
 */
router.post('/admin/documents/:id/assign-all', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    // Insere para todos os usuários que ainda não têm atribuição
    const [result] = await pool.query<any>(
      `INSERT IGNORE INTO document_assignments (documentId, userId, status, assignedAt)
       SELECT ?, id, 'pending', NOW()
       FROM users
       WHERE id NOT IN (
         SELECT userId FROM document_assignments WHERE documentId = ?
       )`,
      [docId, docId]
    );
    res.json({
      success: true,
      message: `Documento atribuído a ${result.affectedRows} usuário(s)`,
      assigned: result.affectedRows,
    });
  } catch (err: any) {
    console.error('[Documents] Error assigning document to all:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/documents/:id/assignments
 * Lista as atribuições de um documento (quem recebeu, quem leu)
 */
router.get('/admin/documents/:id/assignments', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'agente')) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [rows] = await pool.query<any[]>(
      `SELECT
        da.id,
        da.userId,
        da.status,
        da.assignedAt,
        da.readAt,
        u.name AS userName,
        u.email AS userEmail,
        u.department AS userDepartment
       FROM document_assignments da
       INNER JOIN users u ON da.userId = u.id
       WHERE da.documentId = ?
       ORDER BY da.assignedAt DESC`,
      [docId]
    );

    // Buscar atribuições de departamento
    let deptAssignments: any[] = [];
    try {
      const [deptRows] = await pool.query<any[]>(
        `SELECT dda.departmentId, dep.name AS departmentName, dda.assignedAt
         FROM document_department_assignments dda
         INNER JOIN departments dep ON dda.departmentId = dep.id
         WHERE dda.documentId = ?
         ORDER BY dda.assignedAt DESC`,
        [docId]
      );
      deptAssignments = deptRows;
    } catch (_) {}

    res.json({ assignments: rows, total: rows.length, departmentAssignments: deptAssignments });
  } catch (err: any) {
    console.error('[Documents] Error fetching assignments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/documents/:id/assignments/:assignmentId
 * Remove uma atribuição específica de usuário
 */
router.delete('/admin/documents/:id/assignments/:assignmentId', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const assignmentId = parseInt(req.params.assignmentId);
  if (isNaN(assignmentId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    await pool.query(`DELETE FROM document_assignments WHERE id = ?`, [assignmentId]);
    res.json({ success: true, message: 'Atribuição removida com sucesso' });
  } catch (err: any) {
    console.error('[Documents] Error removing assignment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Converte links do OneDrive/Google Drive para URLs de visualização direta
 */
function convertCloudStorageUrl(url: string): string {
  // OneDrive: converte para URL de download direto
  if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
    // Adiciona parâmetro para forçar download/visualização
    if (!url.includes('download=1')) {
      return url + (url.includes('?') ? '&' : '?') + 'download=1';
    }
    return url;
  }
  
  // Google Drive: converte para URL de visualização/download
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    // Extrai o ID do arquivo
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      const fileId = idMatch[1];
      // Retorna URL de exportação/visualização
      return `https://drive.google.com/uc?id=${fileId}&export=download`;
    }
  }
  
  return url;
}

/**
 * GET /api/documents/:id/proxy
 * Proxy seguro para visualização de PDFs no navegador com headers corretos
 */
router.get('/documents/:id/proxy', async (req: Request, res: Response) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Database unavailable' });

  const user = (req as any).user;
  if (!user?.id) return res.status(401).json({ error: 'Não autenticado' });

  const docId = parseInt(req.params.id);
  if (isNaN(docId)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const [docRows] = await pool.query<any[]>(
      `SELECT d.* FROM documents d
       LEFT JOIN document_assignments da ON d.id = da.documentId AND da.userId = ?
       WHERE d.id = ? AND (da.userId IS NOT NULL OR ? IN ('admin','agente'))`,
      [user.id, docId, user.role]
    );

    if (!docRows.length) {
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    const doc = docRows[0];
    if (!doc.fileUrl) {
      return res.status(404).json({ error: 'Documento sem arquivo' });
    }

    let fileUrl = doc.fileUrl;
    if (doc.fileKey) {
      try {
        const { url } = await storageGet(doc.fileKey);
        fileUrl = url;
      } catch (storageErr: any) {
        console.warn('[Documents] storageGet failed:', storageErr.message);
      }
    } else {
      // Converte URLs de cloud storage
      fileUrl = convertCloudStorageUrl(fileUrl);
    }

    // Busca o arquivo com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    let fileRes;
    try {
      fileRes = await fetch(fileUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    
    if (!fileRes.ok) {
      return res.status(fileRes.status).json({ error: `Erro ao buscar arquivo: ${fileRes.status}` });
    }

    const contentType = doc.mimeType || fileRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const buffer = await fileRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[Documents] Error proxying document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
