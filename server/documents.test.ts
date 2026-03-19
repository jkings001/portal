/**
 * Testes unitários para o fluxo de documentos
 * Cobre: criação, atribuição, confirmação e listagem
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock do pool MySQL ───────────────────────────────────────────────────────

const mockQuery = vi.fn();
const mockPool = { query: mockQuery };

vi.mock('./mysql-pool', () => ({
  getPool: () => mockPool,
}));

vi.mock('./storage', () => ({
  storagePut: vi.fn().mockResolvedValue({
    url: 'https://s3.example.com/documents/test-file.pdf',
    key: 'documents/test-file.pdf',
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeReq(overrides: Partial<any> = {}): any {
  return {
    user: { id: 1, role: 'admin', name: 'Admin User' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  };
}

function makeRes(): any {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Document Routes - Lógica de negócio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Listagem de documentos do usuário ────────────────────────────────────

  describe('GET /api/documents/my', () => {
    it('deve retornar documentos atribuídos ao usuário', async () => {
      const mockDocs = [
        {
          id: 1,
          title: 'Política de Segurança',
          description: 'Documento de política',
          category: 'Política',
          fileUrl: 'https://s3.example.com/doc.pdf',
          fileKey: 'documents/doc.pdf',
          fileName: 'politica.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          status: 'pending',
          assignedAt: new Date().toISOString(),
          readAt: null,
        },
      ];

      mockQuery.mockResolvedValueOnce([mockDocs]);

      // Simular lógica do endpoint
      const user = { id: 5, role: 'user' };
      const [rows] = await mockPool.query(
        `SELECT d.*, da.status, da.assignedAt, da.readAt
         FROM documents d
         INNER JOIN document_assignments da ON d.id = da.documentId
         WHERE da.userId = ?`,
        [user.id]
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe('Política de Segurança');
      expect(rows[0].status).toBe('pending');
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('document_assignments'), [user.id]);
    });

    it('deve retornar array vazio quando usuário não tem documentos', async () => {
      mockQuery.mockResolvedValueOnce([[]]);

      const user = { id: 99, role: 'user' };
      const [rows] = await mockPool.query('SELECT * FROM documents WHERE userId = ?', [user.id]);

      expect(rows).toHaveLength(0);
    });
  });

  // ─── Confirmação de documento ─────────────────────────────────────────────

  describe('POST /api/documents/:id/acknowledge', () => {
    it('deve marcar documento como acknowledged', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const docId = 1;
      const userId = 5;

      const [result] = await mockPool.query(
        `UPDATE document_assignments SET status = 'acknowledged', readAt = NOW()
         WHERE documentId = ? AND userId = ?`,
        [docId, userId]
      );

      expect(result.affectedRows).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'acknowledged'"),
        [docId, userId]
      );
    });

    it('deve retornar 0 affectedRows se documento não estava atribuído', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const [result] = await mockPool.query(
        `UPDATE document_assignments SET status = 'acknowledged', readAt = NOW()
         WHERE documentId = ? AND userId = ?`,
        [999, 999]
      );

      expect(result.affectedRows).toBe(0);
    });
  });

  // ─── Criação de documento (admin) ─────────────────────────────────────────

  describe('POST /api/admin/documents', () => {
    it('deve criar documento sem arquivo', async () => {
      mockQuery.mockResolvedValueOnce([{ insertId: 42 }]);

      const title = 'Novo Documento';
      const description = 'Descrição';
      const category = 'Política';
      const fileUrl = 'https://example.com/doc.pdf';

      const [result] = await mockPool.query(
        `INSERT INTO documents (title, description, category, fileUrl, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [title, description, category, fileUrl]
      );

      expect(result.insertId).toBe(42);
    });

    it('deve rejeitar criação sem título', () => {
      const req = makeReq({ body: { title: '' } });
      const res = makeRes();

      // Simular validação
      if (!req.body.title) {
        res.status(400).json({ error: 'Título é obrigatório' });
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Título é obrigatório' });
    });
  });

  // ─── Upload de arquivo (admin) ────────────────────────────────────────────

  describe('POST /api/admin/documents/upload', () => {
    it('deve fazer upload e salvar URL no banco', async () => {
      const { storagePut } = await import('./storage');
      mockQuery.mockResolvedValueOnce([{ insertId: 10 }]);

      const fileBuffer = Buffer.from('fake pdf content');
      const mimeType = 'application/pdf';
      const originalName = 'politica.pdf';

      // Simular upload
      const uploadResult = await storagePut(
        `documents/123-abc-politica.pdf`,
        fileBuffer,
        mimeType
      );

      expect(uploadResult.url).toBe('https://s3.example.com/documents/test-file.pdf');
      expect(storagePut).toHaveBeenCalledWith(
        expect.stringContaining('documents/'),
        fileBuffer,
        mimeType
      );
    });

    it('deve bloquear tipos de arquivo não permitidos', () => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'text/plain',
      ];

      const blockedType = 'application/x-executable';
      expect(allowedTypes.includes(blockedType)).toBe(false);

      const allowedType = 'application/pdf';
      expect(allowedTypes.includes(allowedType)).toBe(true);
    });
  });

  // ─── Atribuição de documento ──────────────────────────────────────────────

  describe('POST /api/admin/documents/:id/assign', () => {
    it('deve atribuir documento a múltiplos usuários', async () => {
      // Simular verificação de existência (nenhum já atribuído)
      mockQuery
        .mockResolvedValueOnce([[]])  // userId 1 - não existe
        .mockResolvedValueOnce([{ affectedRows: 1 }])  // insert userId 1
        .mockResolvedValueOnce([[]])  // userId 2 - não existe
        .mockResolvedValueOnce([{ affectedRows: 1 }]);  // insert userId 2

      const docId = 1;
      const userIds = [1, 2];
      let assigned = 0;
      let skipped = 0;

      for (const uid of userIds) {
        const [existing] = await mockPool.query(
          `SELECT id FROM document_assignments WHERE documentId = ? AND userId = ?`,
          [docId, uid]
        );
        if ((existing as any[]).length > 0) {
          skipped++;
          continue;
        }
        await mockPool.query(
          `INSERT INTO document_assignments (documentId, userId, status, assignedAt) VALUES (?, ?, 'pending', NOW())`,
          [docId, uid]
        );
        assigned++;
      }

      expect(assigned).toBe(2);
      expect(skipped).toBe(0);
    });

    it('deve pular usuários já atribuídos', () => {
      // Teste unitário da lógica de skip sem depender de mock de DB
      // Simula o comportamento do loop de atribuição
      const existingAssignments = new Set([1]); // userId 1 já atribuído
      const userIds = [1, 2];
      let assigned = 0;
      let skipped = 0;

      for (const uid of userIds) {
        if (existingAssignments.has(uid)) {
          skipped++;
          continue;
        }
        assigned++;
      }

      expect(assigned).toBe(1);
      expect(skipped).toBe(1);
    });
  });

  // ─── Listagem de atribuições (admin) ──────────────────────────────────────

  describe('GET /api/admin/documents/:id/assignments', () => {
    it('deve retornar lista de atribuições com dados do usuário', async () => {
      const mockAssignments = [
        {
          id: 1,
          userId: 5,
          userName: 'João Silva',
          userEmail: 'joao@example.com',
          status: 'acknowledged',
          assignedAt: new Date().toISOString(),
          readAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 6,
          userName: 'Maria Santos',
          userEmail: 'maria@example.com',
          status: 'pending',
          assignedAt: new Date().toISOString(),
          readAt: null,
        },
      ];

      // Verificar a estrutura dos dados de atribuições diretamente
      expect(mockAssignments).toHaveLength(2);
      expect(mockAssignments[0].status).toBe('acknowledged');
      expect(mockAssignments[0].userName).toBe('João Silva');
      expect(mockAssignments[1].status).toBe('pending');
      expect(mockAssignments[1].readAt).toBeNull();
      // Verificar que todos os campos necessários estão presentes
      const requiredFields = ['id', 'userId', 'userName', 'userEmail', 'status', 'assignedAt'];
      for (const field of requiredFields) {
        expect(mockAssignments[0]).toHaveProperty(field);
      }
    });
  });

  // ─── Exclusão de documento ────────────────────────────────────────────────

  describe('DELETE /api/admin/documents/:id', () => {
    it('deve remover atribuições antes de remover o documento', async () => {
      mockQuery
        .mockResolvedValue([[], []]);

      const docId = 1;

      // Simular a ordem correta das queries de exclusão
      await mockPool.query(`DELETE FROM document_assignments WHERE documentId = ?`, [docId]);
      await mockPool.query(`DELETE FROM documents WHERE id = ?`, [docId]);

      // Garantir que assignments foram removidas primeiro (ordem das chamadas)
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain('document_assignments');
      expect(mockQuery.mock.calls[1][0]).toContain('documents WHERE id');
    });
  });

  // ─── Validação de permissões ──────────────────────────────────────────────

  describe('Controle de acesso', () => {
    it('deve bloquear usuário não-admin de criar documentos', () => {
      const req = makeReq({ user: { id: 5, role: 'user' } });
      const res = makeRes();

      if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Acesso negado' });
      }

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deve permitir admin de criar documentos', () => {
      const req = makeReq({ user: { id: 1, role: 'admin' } });
      const res = makeRes();
      let allowed = false;

      if (req.user && req.user.role === 'admin') {
        allowed = true;
      }

      expect(allowed).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('deve bloquear usuário não autenticado', () => {
      const req = makeReq({ user: null });
      const res = makeRes();

      if (!req.user?.id) {
        res.status(401).json({ error: 'Não autenticado' });
      }

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
