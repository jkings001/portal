/**
 * permissions-routes.ts
 * CRUD completo para Gestão de Usuários e Permissões
 * Rotas: /api/permissions/*
 */
import { Router } from 'express';
import { getPool } from './mysql-pool';

const router = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logAudit(params: {
  action_type: string;
  performed_by?: number | null;
  target_user_id?: number | null;
  target_group_id?: number | null;
  target_module_id?: number | null;
  company_id?: number | null;
  description: string;
  old_value?: any;
  new_value?: any;
}) {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO permission_audit_log
       (action_type, performed_by, target_user_id, target_group_id, target_module_id, company_id, description, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.action_type,
      params.performed_by ?? null,
      params.target_user_id ?? null,
      params.target_group_id ?? null,
      params.target_module_id ?? null,
      params.company_id ?? null,
      params.description,
      params.old_value ? JSON.stringify(params.old_value) : null,
      params.new_value ? JSON.stringify(params.new_value) : null,
    ]
  );
}

function getActorId(req: any): number | null {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Empresas ────────────────────────────────────────────────────────────────

// GET /api/permissions/companies — lista empresas com contagens e usuários ativos
router.get('/permissions/companies', async (req, res) => {
  try {
    const pool = getPool();
    // Buscar empresas com contagens via assignments
    const [rows] = await pool.execute(`
      SELECT
        c.id, c.name, c.cnpj, c.status, c.email AS company_email,
        COUNT(DISTINCT uca.userId) AS user_count_assigned,
        COUNT(DISTINCT ug.id)      AS group_count
      FROM companies c
      LEFT JOIN userCompanyAssignments uca ON uca.companyId = c.id AND uca.isActive = 1
      LEFT JOIN user_groups ug ON ug.company_id = c.id AND ug.is_active = 1
      GROUP BY c.id
      ORDER BY c.name
    `) as any;

    // Para cada empresa, buscar usuários ativos pelo domínio do e-mail da empresa
    const companiesWithUsers = await Promise.all((rows as any[]).map(async (company: any) => {
      let activeUsers: any[] = [];
      let userCount = Number(company.user_count_assigned);

      // Se não há assignments, usar domínio do e-mail da empresa para encontrar usuários
      if (userCount === 0 && company.company_email) {
        const domain = company.company_email.split('@')[1];
        if (domain) {
          const [domainUsers] = await pool.execute(
            `SELECT id, name, email, role, profileImage FROM users WHERE email LIKE ? ORDER BY name LIMIT 10`,
            [`%@${domain}`]
          ) as any;
          activeUsers = domainUsers;
          userCount = domainUsers.length;
        }
      } else if (userCount > 0) {
        // Buscar usuários via assignments
        const [assignedUsers] = await pool.execute(
          `SELECT u.id, u.name, u.email, u.role, u.profileImage
           FROM users u
           JOIN userCompanyAssignments uca ON uca.userId = u.id AND uca.companyId = ? AND uca.isActive = 1
           ORDER BY u.name LIMIT 10`,
          [company.id]
        ) as any;
        activeUsers = assignedUsers;
      }

      return {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        status: company.status,
        user_count: userCount,
        group_count: Number(company.group_count),
        active_users: activeUsers,
      };
    }));

    res.json({ companies: companiesWithUsers });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Usuários por empresa ─────────────────────────────────────────────────────

// GET /api/permissions/companies/:companyId/users
router.get('/permissions/companies/:companyId/users', async (req, res) => {
  try {
    const pool = getPool();
    const { companyId } = req.params;
    const { search, status, group_id } = req.query;

    // Buscar nome da empresa para filtrar pelo campo company (texto) nos usuários
    const [[company]] = await pool.execute(
      'SELECT id, name FROM companies WHERE id = ?',
      [companyId]
    ) as any;

    if (!company) {
      return res.json({ users: [] });
    }

    // Verificar se há assignments para esta empresa
    const [[assignCount]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM userCompanyAssignments WHERE companyId = ?',
      [companyId]
    ) as any;

    let sql: string;
    let params: any[];

    if (assignCount?.cnt > 0) {
      // Usar tabela de assignments (dados estruturados)
      sql = `
        SELECT
          u.id, u.name, u.email, u.role, u.department, u.position,
          u.createdAt, u.lastSignedIn, u.profileImage, u.company,
          uca.isActive,
          GROUP_CONCAT(DISTINCT ug.name ORDER BY ug.name SEPARATOR ', ') AS user_groups_list
        FROM users u
        JOIN userCompanyAssignments uca ON uca.userId = u.id AND uca.companyId = ?
        LEFT JOIN group_members gm ON gm.user_id = u.id
        LEFT JOIN user_groups ug ON ug.id = gm.group_id AND ug.company_id = ? AND ug.is_active = 1
        WHERE 1=1
      `;
      params = [companyId, companyId];
    } else {
      // Fallback: mostrar todos os usuários (sem empresa vinculada ainda)
      sql = `
        SELECT
          u.id, u.name, u.email, u.role, u.department, u.position,
          u.createdAt, u.lastSignedIn, u.profileImage, u.company,
          1 AS isActive,
          GROUP_CONCAT(DISTINCT ug.name ORDER BY ug.name SEPARATOR ', ') AS user_groups_list
        FROM users u
        LEFT JOIN group_members gm ON gm.user_id = u.id
        LEFT JOIN user_groups ug ON ug.id = gm.group_id AND ug.company_id = ? AND ug.is_active = 1
        WHERE 1=1
      `;
      params = [companyId];
    }

    if (group_id) {
      sql += ` AND gm.group_id = ?`;
      params.push(group_id);
    }
    if (search) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY u.id ORDER BY u.name`;

    const [rows] = await pool.execute(sql, params);
    res.json({ users: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/permissions/users/:userId/status — ativar/desativar usuário em empresa
router.put('/permissions/users/:userId/status', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    const { company_id, is_active } = req.body;
    const actor = getActorId(req);

    const [[old]] = await pool.execute(
      'SELECT isActive FROM userCompanyAssignments WHERE userId = ? AND companyId = ?',
      [userId, company_id]
    ) as any;

    await pool.execute(
      'UPDATE userCompanyAssignments SET isActive = ? WHERE userId = ? AND companyId = ?',
      [is_active ? 1 : 0, userId, company_id]
    );

    await logAudit({
      action_type: 'user_status_changed',
      performed_by: actor,
      target_user_id: parseInt(userId),
      company_id,
      description: `Status do usuário alterado para ${is_active ? 'ativo' : 'inativo'}`,
      old_value: { isActive: old?.isActive },
      new_value: { isActive: is_active ? 1 : 0 },
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Grupos ───────────────────────────────────────────────────────────────────

// GET /api/permissions/companies/:companyId/groups
router.get('/permissions/companies/:companyId/groups', async (req, res) => {
  try {
    const pool = getPool();
    const { companyId } = req.params;
    const [rows] = await pool.execute(`
      SELECT
        ug.*,
        COUNT(DISTINCT gm.user_id) AS member_count
      FROM user_groups ug
      LEFT JOIN group_members gm ON gm.group_id = ug.id
      WHERE ug.company_id = ?
      GROUP BY ug.id
      ORDER BY ug.name
    `, [companyId]);
    res.json({ groups: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/permissions/groups — criar grupo
router.post('/permissions/groups', async (req, res) => {
  try {
    const pool = getPool();
    const { company_id, name, description, color } = req.body;
    const actor = getActorId(req);

    if (!company_id || !name) {
      return res.status(400).json({ error: 'company_id e name são obrigatórios' });
    }

    const [result] = await pool.execute(
      'INSERT INTO user_groups (company_id, name, description, color, created_by) VALUES (?, ?, ?, ?, ?)',
      [company_id, name, description || null, color || '#3b82f6', actor]
    ) as any;

    await logAudit({
      action_type: 'group_created',
      performed_by: actor,
      target_group_id: result.insertId,
      company_id,
      description: `Grupo "${name}" criado`,
      new_value: { name, description, color },
    });

    const [[group]] = await pool.execute('SELECT * FROM user_groups WHERE id = ?', [result.insertId]) as any;
    res.status(201).json(group);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/permissions/groups/:groupId — editar grupo
router.put('/permissions/groups/:groupId', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId } = req.params;
    const { name, description, color, is_active } = req.body;
    const actor = getActorId(req);

    const [[old]] = await pool.execute('SELECT * FROM user_groups WHERE id = ?', [groupId]) as any;
    if (!old) return res.status(404).json({ error: 'Grupo não encontrado' });

    await pool.execute(
      'UPDATE user_groups SET name = ?, description = ?, color = ?, is_active = ? WHERE id = ?',
      [
        name ?? old.name,
        description ?? old.description,
        color ?? old.color,
        is_active !== undefined ? (is_active ? 1 : 0) : old.is_active,
        groupId,
      ]
    );

    await logAudit({
      action_type: 'group_edited',
      performed_by: actor,
      target_group_id: parseInt(groupId),
      company_id: old.company_id,
      description: `Grupo "${old.name}" editado`,
      old_value: old,
      new_value: { name, description, color, is_active },
    });

    const [[updated]] = await pool.execute('SELECT * FROM user_groups WHERE id = ?', [groupId]) as any;
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/permissions/groups/:groupId
router.delete('/permissions/groups/:groupId', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId } = req.params;
    const actor = getActorId(req);

    const [[group]] = await pool.execute('SELECT * FROM user_groups WHERE id = ?', [groupId]) as any;
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    await pool.execute('DELETE FROM group_members WHERE group_id = ?', [groupId]);
    await pool.execute('DELETE FROM group_permissions WHERE group_id = ?', [groupId]);
    await pool.execute('DELETE FROM user_groups WHERE id = ?', [groupId]);

    await logAudit({
      action_type: 'group_deleted',
      performed_by: actor,
      target_group_id: parseInt(groupId),
      company_id: group.company_id,
      description: `Grupo "${group.name}" excluído`,
      old_value: group,
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Membros do grupo ─────────────────────────────────────────────────────────

// GET /api/permissions/groups/:groupId/members
router.get('/permissions/groups/:groupId/members', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId } = req.params;
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.profileImage,
             gm.added_at
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY u.name
    `, [groupId]);
    res.json({ members: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/permissions/groups/:groupId/members — adicionar membro
router.post('/permissions/groups/:groupId/members', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId } = req.params;
    const { user_id } = req.body;
    const actor = getActorId(req);

    await pool.execute(
      'INSERT IGNORE INTO group_members (group_id, user_id, added_by) VALUES (?, ?, ?)',
      [groupId, user_id, actor]
    );

    const [[group]] = await pool.execute('SELECT name, company_id FROM user_groups WHERE id = ?', [groupId]) as any;
    const [[user]] = await pool.execute('SELECT name FROM users WHERE id = ?', [user_id]) as any;

    await logAudit({
      action_type: 'member_added',
      performed_by: actor,
      target_user_id: user_id,
      target_group_id: parseInt(groupId),
      company_id: group?.company_id,
      description: `Usuário "${user?.name}" adicionado ao grupo "${group?.name}"`,
    });

    res.status(201).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/permissions/groups/:groupId/members/:userId
router.delete('/permissions/groups/:groupId/members/:userId', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId, userId } = req.params;
    const actor = getActorId(req);

    await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );

    const [[group]] = await pool.execute('SELECT name, company_id FROM user_groups WHERE id = ?', [groupId]) as any;
    const [[user]] = await pool.execute('SELECT name FROM users WHERE id = ?', [userId]) as any;

    await logAudit({
      action_type: 'member_removed',
      performed_by: actor,
      target_user_id: parseInt(userId),
      target_group_id: parseInt(groupId),
      company_id: group?.company_id,
      description: `Usuário "${user?.name}" removido do grupo "${group?.name}"`,
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Módulos do portal ────────────────────────────────────────────────────────

// GET /api/permissions/modules
router.get('/permissions/modules', async (_req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM portal_modules WHERE is_active = 1 ORDER BY sort_order, label'
    );
    res.json({ modules: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Permissões por grupo ─────────────────────────────────────────────────────

// GET /api/permissions/groups/:groupId/permissions
router.get('/permissions/groups/:groupId/permissions', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId } = req.params;
    const [rows] = await pool.execute(`
      SELECT pm.*, gp.can_view, gp.can_create, gp.can_edit, gp.can_delete,
             gp.can_approve, gp.can_export, gp.can_manage
      FROM portal_modules pm
      LEFT JOIN group_permissions gp ON gp.module_id = pm.id AND gp.group_id = ?
      WHERE pm.is_active = 1
      ORDER BY pm.sort_order
    `, [groupId]);
    res.json({ permissions: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/permissions/groups/:groupId/permissions/:moduleId
router.put('/permissions/groups/:groupId/permissions/:moduleId', async (req, res) => {
  try {
    const pool = getPool();
    const { groupId, moduleId } = req.params;
    const { can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage } = req.body;
    const actor = getActorId(req);

    const [[old]] = await pool.execute(
      'SELECT * FROM group_permissions WHERE group_id = ? AND module_id = ?',
      [groupId, moduleId]
    ) as any;

    await pool.execute(`
      INSERT INTO group_permissions
        (group_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        can_view = VALUES(can_view), can_create = VALUES(can_create),
        can_edit = VALUES(can_edit), can_delete = VALUES(can_delete),
        can_approve = VALUES(can_approve), can_export = VALUES(can_export),
        can_manage = VALUES(can_manage), updated_by = VALUES(updated_by)
    `, [
      groupId, moduleId,
      can_view ? 1 : 0, can_create ? 1 : 0, can_edit ? 1 : 0, can_delete ? 1 : 0,
      can_approve ? 1 : 0, can_export ? 1 : 0, can_manage ? 1 : 0, actor,
    ]);

    const [[group]] = await pool.execute('SELECT name, company_id FROM user_groups WHERE id = ?', [groupId]) as any;
    const [[mod]] = await pool.execute('SELECT label FROM portal_modules WHERE id = ?', [moduleId]) as any;

    await logAudit({
      action_type: old ? 'permission_updated' : 'permission_granted',
      performed_by: actor,
      target_group_id: parseInt(groupId),
      target_module_id: parseInt(moduleId),
      company_id: group?.company_id,
      description: `Permissões do grupo "${group?.name}" para módulo "${mod?.label}" atualizadas`,
      old_value: old || null,
      new_value: { can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage },
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Permissões individuais ───────────────────────────────────────────────────

// GET /api/permissions/users/:userId/permissions
router.get('/permissions/users/:userId/permissions', async (req, res) => {
  try {
    const pool = getPool();
    const { userId } = req.params;
    const [rows] = await pool.execute(`
      SELECT pm.*, up.can_view, up.can_create, up.can_edit, up.can_delete,
             up.can_approve, up.can_export, up.can_manage
      FROM portal_modules pm
      LEFT JOIN user_permissions up ON up.module_id = pm.id AND up.user_id = ?
      WHERE pm.is_active = 1
      ORDER BY pm.sort_order
    `, [userId]);
    res.json({ permissions: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/permissions/users/:userId/permissions/:moduleId
router.put('/permissions/users/:userId/permissions/:moduleId', async (req, res) => {
  try {
    const pool = getPool();
    const { userId, moduleId } = req.params;
    const { can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage } = req.body;
    const actor = getActorId(req);

    await pool.execute(`
      INSERT INTO user_permissions
        (user_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        can_view = VALUES(can_view), can_create = VALUES(can_create),
        can_edit = VALUES(can_edit), can_delete = VALUES(can_delete),
        can_approve = VALUES(can_approve), can_export = VALUES(can_export),
        can_manage = VALUES(can_manage), updated_by = VALUES(updated_by)
    `, [
      userId, moduleId,
      can_view ? 1 : 0, can_create ? 1 : 0, can_edit ? 1 : 0, can_delete ? 1 : 0,
      can_approve ? 1 : 0, can_export ? 1 : 0, can_manage ? 1 : 0, actor,
    ]);

    const [[mod]] = await pool.execute('SELECT label FROM portal_modules WHERE id = ?', [moduleId]) as any;
    const [[user]] = await pool.execute('SELECT name FROM users WHERE id = ?', [userId]) as any;

    await logAudit({
      action_type: 'permission_updated',
      performed_by: actor,
      target_user_id: parseInt(userId),
      target_module_id: parseInt(moduleId),
      description: `Permissão individual de "${user?.name}" para módulo "${mod?.label}" atualizada`,
      new_value: { can_view, can_create, can_edit, can_delete, can_approve, can_export, can_manage },
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Log de auditoria ─────────────────────────────────────────────────────────

// GET /api/permissions/audit — log de auditoria com filtros
router.get('/permissions/audit', async (req, res) => {
  try {
    const pool = getPool();
    const { company_id, action_type, page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let sql = `
      SELECT
        pal.*,
        u.name AS performed_by_name,
        tu.name AS target_user_name,
        ug.name AS target_group_name,
        pm.label AS target_module_label,
        c.name AS company_name
      FROM permission_audit_log pal
      LEFT JOIN users u  ON u.id = pal.performed_by
      LEFT JOIN users tu ON tu.id = pal.target_user_id
      LEFT JOIN user_groups ug ON ug.id = pal.target_group_id
      LEFT JOIN portal_modules pm ON pm.id = pal.target_module_id
      LEFT JOIN companies c ON c.id = pal.company_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (company_id) { sql += ' AND pal.company_id = ?'; params.push(company_id); }
    if (action_type) { sql += ' AND pal.action_type = ?'; params.push(action_type); }

    sql += ` ORDER BY pal.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string), offset);

    const [rows] = await pool.execute(sql, params);

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM permission_audit_log WHERE 1=1
       ${company_id ? 'AND company_id = ?' : ''}
       ${action_type ? 'AND action_type = ?' : ''}`,
      [...(company_id ? [company_id] : []), ...(action_type ? [action_type] : [])]
    ) as any;

    res.json({ logs: rows, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Estatísticas rápidas ─────────────────────────────────────────────────────

// GET /api/permissions/stats
router.get('/permissions/stats', async (_req, res) => {
  try {
    const pool = getPool();
    const [[{ total_users }]] = await pool.execute('SELECT COUNT(*) as total_users FROM users') as any;
    const [[{ total_companies }]] = await pool.execute('SELECT COUNT(*) as total_companies FROM companies') as any;
    const [[{ total_groups }]] = await pool.execute('SELECT COUNT(*) as total_groups FROM user_groups WHERE is_active = 1') as any;
    const [[{ total_permissions }]] = await pool.execute('SELECT COUNT(*) as total_permissions FROM group_permissions') as any;
    const [[{ recent_changes }]] = await pool.execute(
      "SELECT COUNT(*) as recent_changes FROM permission_audit_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    ) as any;

    res.json({ total_users, total_companies, total_groups, total_permissions, recent_changes });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
