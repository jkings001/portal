/**
 * JLX – Classificados Internos
 * Endpoints REST para gerenciamento de anúncios, interesses e favoritos.
 */
import { Express, Request, Response } from 'express';
import { getPool } from './mysql-pool';
import { storagePut } from './storage';

const JLX_CATEGORIES = [
  'eletronicos',
  'livros',
  'informatica',
  'moveis',
  'eletrodomesticos',
  'vestuario',
  'infantil',
  'imoveis',
  'esportes',
  'outros',
];

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function registerJlxRoutes(app: Express) {
  const pool = getPool();

  // ─── GET /api/jlx/listings ───────────────────────────────────────────────
  // Lista anúncios com filtros opcionais: category, negotiationType, status, search, page, limit
  app.get('/api/jlx/listings', async (req: Request, res: Response) => {
    try {
      const { category, negotiationType, status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let where = 'WHERE l.status != "finalizado"';
      const params: any[] = [];

      if (category && category !== 'todos') {
        where += ' AND l.category = ?';
        params.push(category);
      }
      if (negotiationType && negotiationType !== 'todos') {
        where += ' AND l.negotiationType = ?';
        params.push(negotiationType);
      }
      if (status) {
        where += ' AND l.status = ?';
        params.push(status);
      }
      if (search) {
        where += ' AND (l.title LIKE ? OR l.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const [rows] = await pool.query(
        `SELECT l.*, u.name as userName, u.profileImage as userAvatar, u.email as userEmail,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'interesse') as interestCount,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'favorito') as favoriteCount
         FROM jlx_listings l
         LEFT JOIN users u ON l.userId = u.id
         ${where}
         ORDER BY l.createdAt DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      ) as any[];

      const [countRows] = await pool.query(
        `SELECT COUNT(*) as total FROM jlx_listings l ${where}`,
        params
      ) as any[];

      res.json({
        listings: rows as any[],
        total: (countRows as any[])[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (err) {
      console.error('[JLX] Error fetching listings:', err);
      res.status(500).json({ error: 'Erro ao buscar anúncios' });
    }
  });

  // ─── GET /api/jlx/listings/mine ─────────────────────────────────────────
  // Lista anúncios do usuário logado
  app.get('/api/jlx/listings/mine', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.status(401).json({ error: 'Token inválido' });

      const userId = parseInt(decoded.user.id);
      const [rows] = await pool.query(
        `SELECT l.*,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'interesse') as interestCount,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'favorito') as favoriteCount
         FROM jlx_listings l
         WHERE l.userId = ?
         ORDER BY l.createdAt DESC`,
        [userId]
      ) as any[];

      res.json(rows as any[]);
    } catch (err) {
      console.error('[JLX] Error fetching my listings:', err);
      res.status(500).json({ error: 'Erro ao buscar seus anúncios' });
    }
  });

  // ─── GET /api/jlx/listings/:id ──────────────────────────────────────────
  app.get('/api/jlx/listings/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Incrementar views
      await pool.query('UPDATE jlx_listings SET views = views + 1 WHERE id = ?', [id]);

      const [rows] = await pool.query(
        `SELECT l.*, u.name as userName, u.profileImage as userAvatar, u.email as userEmail,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'interesse') as interestCount,
                (SELECT COUNT(*) FROM jlx_interests WHERE listingId = l.id AND type = 'favorito') as favoriteCount
         FROM jlx_listings l
         LEFT JOIN users u ON l.userId = u.id
         WHERE l.id = ?`,
        [id]
      ) as any[];

      const listing = (rows as any[])[0];
      if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });

      res.json(listing);
    } catch (err) {
      console.error('[JLX] Error fetching listing:', err);
      res.status(500).json({ error: 'Erro ao buscar anúncio' });
    }
  });

  // ─── POST /api/jlx/listings ─────────────────────────────────────────────
  app.post('/api/jlx/listings', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.status(401).json({ error: 'Token inválido' });

      const userId = parseInt(decoded.user.id);
      const { title, description, category, negotiationType, price, condition_item, imageData, imageData2, imageData3 } = req.body;

      if (!title || !category || !negotiationType) {
        return res.status(400).json({ error: 'Título, categoria e tipo de negociação são obrigatórios' });
      }

      // Upload de imagens para S3
      let imageUrl: string | null = null;
      let imageUrl2: string | null = null;
      let imageUrl3: string | null = null;

      if (imageData) {
        const buf = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const { url } = await storagePut(`jlx/${userId}-${randomSuffix()}.jpg`, buf, 'image/jpeg');
        imageUrl = url;
      }
      if (imageData2) {
        const buf = Buffer.from(imageData2.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const { url } = await storagePut(`jlx/${userId}-${randomSuffix()}.jpg`, buf, 'image/jpeg');
        imageUrl2 = url;
      }
      if (imageData3) {
        const buf = Buffer.from(imageData3.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        const { url } = await storagePut(`jlx/${userId}-${randomSuffix()}.jpg`, buf, 'image/jpeg');
        imageUrl3 = url;
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await pool.query(
        `INSERT INTO jlx_listings (userId, title, description, category, negotiationType, price, condition_item, imageUrl, imageUrl2, imageUrl3, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, title, description || null, category, negotiationType, price || null, condition_item || 'usado', imageUrl, imageUrl2, imageUrl3, now, now]
      ) as any[];

      const newId = (result as any).insertId;
      const [rows] = await pool.query('SELECT * FROM jlx_listings WHERE id = ?', [newId]) as any[];
      res.status(201).json((rows as any[])[0]);
    } catch (err) {
      console.error('[JLX] Error creating listing:', err);
      res.status(500).json({ error: 'Erro ao criar anúncio' });
    }
  });

  // ─── PUT /api/jlx/listings/:id ──────────────────────────────────────────
  app.put('/api/jlx/listings/:id', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.status(401).json({ error: 'Token inválido' });

      const userId = parseInt(decoded.user.id);
      const { id } = req.params;

      // Verificar propriedade
      const [existing] = await pool.query('SELECT userId FROM jlx_listings WHERE id = ?', [id]) as any[];
      const listing = (existing as any[])[0];
      if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });

      // Admin pode editar qualquer anúncio
      const isAdmin = decoded.user.role === 'admin';
      if (!isAdmin && listing.userId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para editar este anúncio' });
      }

      const { title, description, category, negotiationType, price, condition_item, status } = req.body;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      await pool.query(
        `UPDATE jlx_listings SET title = COALESCE(?, title), description = COALESCE(?, description),
         category = COALESCE(?, category), negotiationType = COALESCE(?, negotiationType),
         price = ?, condition_item = COALESCE(?, condition_item),
         status = COALESCE(?, status), updatedAt = ?
         WHERE id = ?`,
        [title, description, category, negotiationType, price ?? null, condition_item, status, now, id]
      );

      const [rows] = await pool.query('SELECT * FROM jlx_listings WHERE id = ?', [id]) as any[];
      res.json((rows as any[])[0]);
    } catch (err) {
      console.error('[JLX] Error updating listing:', err);
      res.status(500).json({ error: 'Erro ao atualizar anúncio' });
    }
  });

  // ─── DELETE /api/jlx/listings/:id ───────────────────────────────────────
  app.delete('/api/jlx/listings/:id', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.status(401).json({ error: 'Token inválido' });

      const userId = parseInt(decoded.user.id);
      const { id } = req.params;

      const [existing] = await pool.query('SELECT userId FROM jlx_listings WHERE id = ?', [id]) as any[];
      const listing = (existing as any[])[0];
      if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });

      const isAdmin = decoded.user.role === 'admin';
      if (!isAdmin && listing.userId !== userId) {
        return res.status(403).json({ error: 'Sem permissão para excluir este anúncio' });
      }

      await pool.query('DELETE FROM jlx_interests WHERE listingId = ?', [id]);
      await pool.query('DELETE FROM jlx_listings WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error('[JLX] Error deleting listing:', err);
      res.status(500).json({ error: 'Erro ao excluir anúncio' });
    }
  });

  // ─── POST /api/jlx/listings/:id/interest ────────────────────────────────
  // Demonstrar interesse ou favoritar
  app.post('/api/jlx/listings/:id/interest', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Não autenticado' });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.status(401).json({ error: 'Token inválido' });

      const userId = parseInt(decoded.user.id);
      const { id } = req.params;
      const { type = 'interesse' } = req.body;

      // Toggle: se já existe, remove; senão, cria
      const [existing] = await pool.query(
        'SELECT id FROM jlx_interests WHERE listingId = ? AND userId = ? AND type = ?',
        [id, userId, type]
      ) as any[];

      if ((existing as any[]).length > 0) {
        await pool.query(
          'DELETE FROM jlx_interests WHERE listingId = ? AND userId = ? AND type = ?',
          [id, userId, type]
        );
        return res.json({ active: false });
      }

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(
        'INSERT INTO jlx_interests (listingId, userId, type, createdAt) VALUES (?, ?, ?, ?)',
        [id, userId, type, now]
      );

      res.json({ active: true });
    } catch (err) {
      console.error('[JLX] Error toggling interest:', err);
      res.status(500).json({ error: 'Erro ao registrar interesse' });
    }
  });

  // ─── GET /api/jlx/listings/:id/my-status ────────────────────────────────
  // Verifica se o usuário logado tem interesse/favorito no anúncio
  app.get('/api/jlx/listings/:id/my-status', async (req: Request, res: Response) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) return res.json({ interested: false, favorited: false });

      const { verifyToken } = await import('./auth');
      const decoded = await verifyToken(token) as any;
      if (!decoded?.user?.id) return res.json({ interested: false, favorited: false });

      const userId = parseInt(decoded.user.id);
      const { id } = req.params;

      const [rows] = await pool.query(
        'SELECT type FROM jlx_interests WHERE listingId = ? AND userId = ?',
        [id, userId]
      ) as any[];

      const types = (rows as any[]).map((r: any) => r.type);
      res.json({
        interested: types.includes('interesse'),
        favorited: types.includes('favorito'),
      });
    } catch (err) {
      res.json({ interested: false, favorited: false });
    }
  });

  // ─── GET /api/jlx/categories ────────────────────────────────────────────
  app.get('/api/jlx/categories', (_req: Request, res: Response) => {
    res.json(JLX_CATEGORIES);
  });
}
