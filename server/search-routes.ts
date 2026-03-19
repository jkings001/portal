/**
 * search-routes.ts
 * Endpoint de busca unificada: documentos + módulos do portal
 *
 * Lógica de permissão para documentos:
 *  1. Documentos SEM nenhuma atribuição (públicos/abertos) → visíveis para todos
 *  2. Documentos COM atribuição ao usuário logado → visíveis para ele
 *  3. Documentos atribuídos a outros usuários → NÃO visíveis
 *
 * Busca por: título, descrição, categoria, groupName (FULLTEXT + LIKE fallback)
 */

import { Router, Request, Response } from 'express';
import { getPool } from './mysql-pool';

const router = Router();

interface SearchResult {
  id: number | string;
  type: 'document' | 'module';
  title: string;
  description: string | null;
  category: string | null;
  url: string;
  icon?: string;
  tags?: string[];
  relevance?: number;
}

/**
 * GET /api/search?q=texto&type=all|document|module
 * Requer autenticação via authenticateJwt (aplicado no index.ts ao montar o router)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const type = (req.query.type as string) || 'all';
    const userId = (req as any).user?.id;

    if (!q || q.length < 2) {
      return res.json({ results: [], total: 0 });
    }

    const pool = getPool();
    const results: SearchResult[] = [];

    // ─── Busca em Documentos ─────────────────────────────────────────────────
    if (type === 'all' || type === 'document') {
      /*
       * Lógica de visibilidade:
       *  - Documento sem NENHUMA atribuição (público) → sempre visível
       *  - Documento com atribuição ao userId logado → visível
       *  - Documento com atribuição a outros → invisível
       *
       * Usamos FULLTEXT MATCH...AGAINST para relevância, com fallback LIKE
       * para termos curtos (< 3 chars) que o FULLTEXT ignora.
       */
      const likeQ = `%${q}%`;
      const isShortQuery = q.length < 3;

      let docQuery: string;
      let docParams: any[];

      if (isShortQuery) {
        // LIKE fallback para termos muito curtos
        docQuery = `
          SELECT
            d.id,
            d.title,
            d.description,
            d.category,
            d.groupName,
            1 AS relevance,
            (
              SELECT COUNT(*) FROM document_assignments da2
              WHERE da2.documentId = d.id
            ) AS totalAssignments,
            (
              SELECT COUNT(*) FROM document_assignments da3
              WHERE da3.documentId = d.id AND da3.userId = ?
            ) AS userAssignment
          FROM documents d
          WHERE (
            d.title LIKE ? OR
            d.description LIKE ? OR
            d.category LIKE ? OR
            d.groupName LIKE ?
          )
          HAVING (totalAssignments = 0 OR userAssignment > 0)
          ORDER BY relevance DESC, d.title ASC
          LIMIT 10
        `;
        docParams = [userId || 0, likeQ, likeQ, likeQ, likeQ];
      } else {
        // FULLTEXT MATCH...AGAINST com score de relevância
        docQuery = `
          SELECT
            d.id,
            d.title,
            d.description,
            d.category,
            d.groupName,
            MATCH(d.title, d.description, d.category, d.groupName)
              AGAINST(? IN BOOLEAN MODE) AS relevance,
            (
              SELECT COUNT(*) FROM document_assignments da2
              WHERE da2.documentId = d.id
            ) AS totalAssignments,
            (
              SELECT COUNT(*) FROM document_assignments da3
              WHERE da3.documentId = d.id AND da3.userId = ?
            ) AS userAssignment
          FROM documents d
          WHERE MATCH(d.title, d.description, d.category, d.groupName)
                AGAINST(? IN BOOLEAN MODE)
          HAVING (totalAssignments = 0 OR userAssignment > 0)
          ORDER BY relevance DESC, d.title ASC
          LIMIT 10
        `;
        // Prepend * para busca de prefixo (ex: "termo" encontra "termos")
        const ftQ = q.split(/\s+/).map(w => `${w}*`).join(' ');
        docParams = [ftQ, userId || 0, ftQ];
      }

      const [docRows] = await pool.query(docQuery, docParams) as any[];

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

    // ─── Busca em Módulos do Portal ──────────────────────────────────────────
    if (type === 'all' || type === 'module') {
      const likeQ = `%${q}%`;
      const isShortQuery = q.length < 3;

      let modQuery: string;
      let modParams: any[];

      if (isShortQuery) {
        modQuery = `
          SELECT id, key_name, label, description, category, icon, 1 AS relevance
          FROM portal_modules
          WHERE is_active = 1 AND (
            label LIKE ? OR description LIKE ? OR category LIKE ?
          )
          ORDER BY sort_order ASC
          LIMIT 6
        `;
        modParams = [likeQ, likeQ, likeQ];
      } else {
        modQuery = `
          SELECT
            id, key_name, label, description, category, icon,
            MATCH(label, description, category) AGAINST(? IN BOOLEAN MODE) AS relevance
          FROM portal_modules
          WHERE is_active = 1
            AND MATCH(label, description, category) AGAINST(? IN BOOLEAN MODE)
          ORDER BY relevance DESC, sort_order ASC
          LIMIT 6
        `;
        const ftQ = q.split(/\s+/).map(w => `${w}*`).join(' ');
        modParams = [ftQ, ftQ];
      }

      const [modRows] = await pool.query(modQuery, modParams) as any[];

      // Mapa de key_name → rota do portal
      const moduleRouteMap: Record<string, string> = {
        dashboard: '/dashboard',
        tickets: '/tickets',
        support: '/support',
        requests: '/requests',
        approvals: '/approvals',
        estacionamento: '/estacionamento',
        rh_estacionamento: '/rh-estacionamento',
        equipamentos: '/equipamentos',
        documents: '/terms',
        trainings: '/training',
        reports: '/reports',
        notifications: '/notifications',
        admin_users: '/admin/users',
        admin_companies: '/companies',
        admin_permissions: '/admin/permissions',
        admin_audit: '/admin/audit',
        faqs: '/faqs',
        management: '/management',
      };

      for (const row of modRows) {
        results.push({
          id: `module-${row.id}`,
          type: 'module',
          title: row.label,
          description: row.description || null,
          category: row.category || null,
          url: moduleRouteMap[row.key_name] || `/${row.key_name}`,
          icon: row.icon || 'Link',
          tags: row.category ? [row.category] : [],
          relevance: parseFloat(row.relevance) || 0,
        });
      }
    }

    // Ordenar por relevância decrescente, depois por tipo (document primeiro)
    results.sort((a, b) => {
      const relDiff = (b.relevance || 0) - (a.relevance || 0);
      if (relDiff !== 0) return relDiff;
      if (a.type === 'document' && b.type !== 'document') return -1;
      if (b.type === 'document' && a.type !== 'document') return 1;
      return 0;
    });

    return res.json({ results, total: results.length, query: q });
  } catch (err: any) {
    console.error('[Search] Error:', err.message);
    return res.status(500).json({ error: 'Erro interno na busca', results: [] });
  }
});

export default router;
