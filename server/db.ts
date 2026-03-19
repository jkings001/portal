import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc, sql, inArray } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import { InsertUser, users, tickets, InsertTicket, notifications, InsertNotification, documents, trainings, companies, InsertCompany, departments, InsertDepartment, positions, InsertPosition, userCompanyAssignments, InsertUserCompanyAssignment, ticketComments, passwordResetTokens, ticketAttachments, faqs, reports, userPreferences } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcryptjs from 'bcryptjs';
import { retryIfRetryable } from './retry';
import mysql from 'mysql2/promise';
import { getPool as getMysqlPool } from './mysql-pool';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _activeDbUrl: string | null = null;

/**
 * Retorna a lista de URLs de banco disponíveis, ordenadas por prioridade.
 * Railway interno: MYSQL_URL > MYSQL_PUBLIC_URL > DATABASE_URL
 * Externo (dev/Manus): MYSQL_PUBLIC_URL (Railway) > DATABASE_URL (fallback) > MYSQL_URL
 */
function getDatabaseUrlCandidates(): string[] {
  const isRailwayInternal = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID || process.env.RAILWAY_STATIC_URL);
  const candidates: string[] = [];
  if (isRailwayInternal) {
    if (process.env.MYSQL_URL) candidates.push(process.env.MYSQL_URL);
    if (process.env.MYSQL_PUBLIC_URL) candidates.push(process.env.MYSQL_PUBLIC_URL);
    if (process.env.DATABASE_URL) candidates.push(process.env.DATABASE_URL);
  } else {
    // Railway (MYSQL_PUBLIC_URL) é o banco principal; DATABASE_URL como fallback
    if (process.env.MYSQL_PUBLIC_URL) candidates.push(process.env.MYSQL_PUBLIC_URL);
    if (process.env.DATABASE_URL) candidates.push(process.env.DATABASE_URL);
    if (process.env.MYSQL_URL) candidates.push(process.env.MYSQL_URL);
  }
  return candidates;
}

/** Parse de URL MySQL para config de conexão */
export function getMysqlConnectionConfig(urlOverride?: string) {
  const databaseUrl = urlOverride || getDatabaseUrlCandidates()[0];
  if (!databaseUrl) {
    throw new Error('[Database] Nenhuma URL de banco disponível. Configure MYSQL_URL, MYSQL_PUBLIC_URL ou DATABASE_URL.');
  }
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      connectTimeout: 10000,
    };
  } catch (e) {
    throw new Error(`[Database] URL inválida: ${databaseUrl} — ${e}`);
  }
}

/** Testa se uma URL de banco está acessível com uma query simples */
async function testConnection(url: string): Promise<boolean> {
  try {
    const cfg = getMysqlConnectionConfig(url);
    const conn = await mysql.createConnection({ ...cfg, connectTimeout: 5000 });
    await conn.query('SELECT 1');
    await conn.end();
    return true;
  } catch {
    return false;
  }
}

// Lazily create the drizzle instance. Tenta cada URL candidata até encontrar uma que funcione.
export async function getDb() {
  if (!_db) {
    const candidates = getDatabaseUrlCandidates();
    if (candidates.length === 0) {
      console.error('[Database] Nenhuma URL de banco configurada.');
      return null;
    }

    for (const url of candidates) {
      const cfg = getMysqlConnectionConfig(url);
      console.log(`[Database] Tentando conectar: ${cfg.host}:${cfg.port}/${cfg.database}`);
      try {
        const ok = await testConnection(url);
        if (!ok) {
          console.warn(`[Database] Conexão falhou para ${cfg.host}:${cfg.port}, tentando próxima...`);
          continue;
        }
        _db = drizzle(url, { schema, mode: 'default' } as any) as any;
        _activeDbUrl = url;
        console.log(`[Database] Conectado com sucesso: ${cfg.host}:${cfg.port}/${cfg.database}`);
        break;
      } catch (error: any) {
        console.warn(`[Database] Erro ao conectar ${cfg.host}:${cfg.port}:`, error?.message);
      }
    }

    if (!_db) {
      console.error('[Database] Todas as URLs falharam. Banco indisponível.');
    }
  }
  return _db;
}

/** Retorna a URL ativa do banco (para uso pelo mysql-pool) */
export function getActiveDbUrl(): string | null {
  return _activeDbUrl;
}

/** Reseta a conexão cacheada (força reconexão na próxima chamada) */
export function resetDbConnection() {
  _db = null;
  _activeDbUrl = null;
}



export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.openId, user.openId),
    });

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          ...user,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      await db.insert(users).values(user);
    }
  } catch (error) {
    console.error("[Database] Error upserting user:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result;
  } catch (error) {
    console.error("[Database] Error getting user by email:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result;
  } catch (error) {
    console.error("[Database] Error getting user by ID:", error);
    throw error;
  }
}

export async function createUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(users).values(user);
  } catch (error) {
    console.error("[Database] Error creating user:", error);
    throw error;
  }
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Error updating user password:", error);
    throw error;
  }
}

export async function getPasswordHash(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return user?.passwordHash ?? null;
  } catch (error) {
    console.error("[Database] Error getting password hash:", error);
    throw error;
  }
}

export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  assignedTo?: number;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    let query = db.query.tickets.findMany();
    
    if (filters) {
      const conditions = [];
      if (filters.status) conditions.push(eq(tickets.status, filters.status as any));
      if (filters.priority) conditions.push(eq(tickets.priority, filters.priority as any));
      if (filters.assignedTo) conditions.push(eq(tickets.assignedTo, filters.assignedTo));
      if (filters.createdBy) conditions.push(eq(tickets.userId, filters.createdBy));
      
      if (conditions.length > 0) {
        query = db.query.tickets.findMany({
          where: sql`${conditions.map(c => c).join(' AND ')}`,
        });
      }
    }
    
    return query;
  } catch (error) {
    console.error("[Database] Error getting tickets:", error);
    throw error;
  }
}

export async function createTicket(ticket: InsertTicket): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(tickets).values(ticket);
  } catch (error) {
    console.error("[Database] Error creating ticket:", error);
    throw error;
  }
}

export async function updateTicket(ticketId: number, updates: Partial<InsertTicket>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(tickets.id, ticketId));
  } catch (error) {
    console.error("[Database] Error updating ticket:", error);
    throw error;
  }
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
    });
  } catch (error) {
    console.error("[Database] Error getting notifications:", error);
    throw error;
  }
}

export async function createNotification(notification: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(notifications).values(notification);
  } catch (error) {
    console.error("[Database] Error creating notification:", error);
    throw error;
  }
}

export async function getCompanies() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.companies.findMany();
  } catch (error) {
    console.error("[Database] Error getting companies:", error);
    throw error;
  }
}

export async function createCompany(company: InsertCompany): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(companies).values(company);
  } catch (error) {
    console.error("[Database] Error creating company:", error);
    throw error;
  }
}

export async function getDepartments(companyId?: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    if (companyId) {
      return await db.query.departments.findMany({
        where: eq(departments.companyId, companyId),
      });
    }
    return await db.query.departments.findMany();
  } catch (error) {
    console.error("[Database] Error getting departments:", error);
    throw error;
  }
}

export async function createDepartment(department: InsertDepartment): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(departments).values(department);
  } catch (error) {
    console.error("[Database] Error creating department:", error);
    throw error;
  }
}

export async function getPositions() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.positions.findMany();
  } catch (error) {
    console.error("[Database] Error getting positions:", error);
    throw error;
  }
}

export async function createPosition(position: InsertPosition): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(positions).values(position);
  } catch (error) {
    console.error("[Database] Error creating position:", error);
    throw error;
  }
}

export async function getUserCompanyAssignments(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.userCompanyAssignments.findMany({
      where: eq(userCompanyAssignments.userId, userId),
    });
  } catch (error) {
    console.error("[Database] Error getting user company assignments:", error);
    throw error;
  }
}

export async function createUserCompanyAssignment(assignment: InsertUserCompanyAssignment): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(userCompanyAssignments).values(assignment);
  } catch (error) {
    console.error("[Database] Error creating user company assignment:", error);
    throw error;
  }
}

export async function getTrainings() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.trainings.findMany();
  } catch (error) {
    console.error("[Database] Error getting trainings:", error);
    throw error;
  }
}

export async function getDocuments() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.documents.findMany();
  } catch (error) {
    console.error("[Database] Error getting documents:", error);
    throw error;
  }
}

export async function getPasswordResetTokens(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    return await db.query.passwordResetTokens.findMany({
      where: eq(passwordResetTokens.userId, userId),
    });
  } catch (error) {
    console.error("[Database] Error getting password reset tokens:", error);
    throw error;
  }
}


export async function createPasswordResetToken(userId: number, token: string, expiresAt: string | Date): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt: typeof expiresAt === 'string' ? expiresAt : expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[Database] Error creating password reset token:", error);
    throw error;
  }
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    const result = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    });
    return result;
  } catch (error) {
    console.error("[Database] Error getting password reset token:", error);
    throw error;
  }
}

export async function markPasswordResetTokenAsUsed(tokenId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.id, tokenId));
  } catch (error) {
    console.error("[Database] Error marking password reset token as used:", error);
    throw error;
  }
}


export async function updateUser(userId: number, updates: Partial<InsertUser>): Promise<any> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    // updatedAt usa mode: 'string' no schema, portanto deve ser string ISO
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await db
      .update(users)
      .set({ ...updates, updatedAt: now })
      .where(eq(users.id, userId));
    
    // Retornar o usuário atualizado (sem passwordHash)
    const updatedUser = await getUserById(userId);
    if (updatedUser) {
      const { passwordHash: _ph, ...safeUser } = updatedUser as any;
      return safeUser;
    }
    return updatedUser;
  } catch (error) {
    console.error("[Database] Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Error deleting user:", error);
    throw error;
  }
}


// ============================================================
// FUNÇÕES DE LISTAGEM COMPLETA (aliases e novas funções)
// ============================================================

/**
 * Retorna todos os usuários cadastrados no banco.
 * Usa SQL direto para compatibilidade com o schema real do banco Railway.
 * Não expõe passwordHash.
 */
export async function getAllUsers() {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.openId, u.name, u.email, u.loginMethod, u.role,
             u.createdAt, u.updatedAt, u.lastSignedIn, u.department,
             u.avatar, u.profileImage, u.company, u.position,
             c.name AS companyName,
             uca.companyId AS companyId,
             uca.departmentId AS departmentId
      FROM users u
      LEFT JOIN userCompanyAssignments uca ON uca.userId = u.id AND uca.isActive = 1
      LEFT JOIN companies c ON c.id = uca.companyId
      ORDER BY u.createdAt DESC
    `);
    return (rows as unknown) as any[];
  } catch (error) {
    console.error("[Database] Error getting all users:", error);
    throw error;
  }
}

/**
 * Retorna usuários de uma empresa específica.
 * Usa SQL direto para compatibilidade com o schema real do banco Railway.
 */
export async function getUsersByCompany(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.openId, u.name, u.email, u.loginMethod, u.role,
             u.createdAt, u.updatedAt, u.lastSignedIn, u.department,
             u.avatar, u.profileImage, u.company, u.position,
             c.name AS companyName,
             uca.companyId AS companyId,
             uca.departmentId AS departmentId
      FROM users u
      INNER JOIN userCompanyAssignments uca ON uca.userId = u.id AND uca.isActive = 1
      INNER JOIN companies c ON c.id = uca.companyId
      WHERE uca.companyId = ?
      ORDER BY u.createdAt DESC
    `, [companyId]);
    return (rows as unknown) as any[];
  } catch (error) {
    console.error("[Database] Error getting users by company:", error);
    throw error;
  }
}

/**
 * Alias para getCompanies() — mantém compatibilidade com código que usa getAllCompanies().
 */
export async function getAllCompanies() {
  return getCompanies();
}

/**
 * Retorna tickets de um usuário específico (criados por ele).
 * Alias para getTickets({ createdBy: userId }).
 */
export async function getTicketsByUserId(userId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT * FROM tickets WHERE createdBy = ? ORDER BY createdAt DESC`,
      [userId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting tickets by user:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um ticket específico.
 */
export async function updateTicketStatus(ticketId: number, status: string): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(
      `UPDATE tickets SET status = ?, updatedAt = ? WHERE id = ?`,
      [status, new Date().toISOString().slice(0, 19).replace('T', ' '), ticketId]
    );
  } catch (error) {
    console.error("[Database] Error updating ticket status:", error);
    throw error;
  }
}

/**
 * Retorna notificações de um usuário específico.
 * Alias para getNotifications(userId).
 */
export async function getNotificationsByUserId(userId: number) {
  return getNotifications(userId);
}

/**
 * Marca uma notificação como lida.
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(
      `UPDATE notifications SET isRead = 1, updatedAt = ? WHERE id = ?`,
      [new Date().toISOString().slice(0, 19).replace('T', ' '), notificationId]
    );
  } catch (error) {
    console.error("[Database] Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Busca usuário pelo openId (identificador OAuth).
 */
export async function getUserByOpenId(openId: string) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT id, openId, name, email, loginMethod, role, createdAt, updatedAt,
              lastSignedIn, department, avatar, profileImage, company, position
       FROM users WHERE openId = ? LIMIT 1`,
      [openId]
    );
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : null;
  } catch (error) {
    console.error("[Database] Error getting user by openId:", error);
    throw error;
  }
}

/**
 * Retorna todos os tickets do sistema (para admins/agentes).
 */
export async function getAllTickets(filters?: { status?: string; priority?: string }) {
  const pool = getMysqlPool();
  try {
    let query = `SELECT * FROM tickets WHERE 1=1`;
    const params: any[] = [];
    if (filters?.status) { query += ` AND status = ?`; params.push(filters.status); }
    if (filters?.priority) { query += ` AND priority = ?`; params.push(filters.priority); }
    query += ` ORDER BY createdAt DESC`;
    const [rows] = await pool.query(query, params);
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting all tickets:", error);
    throw error;
  }
}

/**
 * Retorna todos os documentos do sistema.
 */
export async function getAllDocuments() {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`SELECT * FROM documents ORDER BY createdAt DESC`);
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting all documents:", error);
    throw error;
  }
}

/**
 * Retorna todos os treinamentos do sistema.
 */
export async function getAllTrainings() {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`SELECT * FROM trainings ORDER BY createdAt DESC`);
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting all trainings:", error);
    throw error;
  }
}

/**
 * Busca empresa pelo ID.
 */
export async function getCompanyById(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`SELECT * FROM companies WHERE id = ? LIMIT 1`, [companyId]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : null;
  } catch (error) {
    console.error("[Database] Error getting company by id:", error);
    throw error;
  }
}

/**
 * Busca empresa pelo CNPJ.
 */
export async function getCompanyByCnpj(cnpj: string) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`SELECT * FROM companies WHERE cnpj = ? LIMIT 1`, [cnpj]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : null;
  } catch (error) {
    console.error("[Database] Error getting company by cnpj:", error);
    throw error;
  }
}

/**
 * Retorna ou cria a empresa "Temporário" usada para vincular usuários do signup.
 */
export async function getOrCreateTemporaryCompany(): Promise<number> {
  const pool = getMysqlPool();
  try {
    // Buscar por nome exato
    const [rows] = await pool.query(
      `SELECT id FROM companies WHERE name = 'Temporário' LIMIT 1`
    ) as any[];
    const arr = rows as any[];
    if (arr.length > 0) {
      return arr[0].id;
    }
    // Criar a empresa Temporário
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const [result] = await pool.query(
      `INSERT INTO companies (name, cnpj, email, status, maxLicenses, createdAt, updatedAt)
       VALUES ('Temporário', '00.000.000/0000-00', 'temporario@sistema.local', 'ativa', 9999, ?, ?)`,
      [now, now]
    ) as any[];
    return (result as any).insertId;
  } catch (error) {
    console.error('[Database] Error getting/creating Temporário company:', error);
    throw error;
  }
}

/**
 * Atualiza dados de uma empresa.
 */
export async function updateCompany(companyId: number, updates: Partial<{ name: string; cnpj: string; email: string; phone: string; address: string; city: string; state: string; country: string; zipCode: string; website: string; logo: string; description: string; maxUsers: number; plan: string; status: string }>) {
  const pool = getMysqlPool();
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString().slice(0, 19).replace('T', ' '), companyId];
    await pool.query(`UPDATE companies SET ${fields}, updatedAt = ? WHERE id = ?`, values);
  } catch (error) {
    console.error("[Database] Error updating company:", error);
    throw error;
  }
}

/**
 * Remove uma empresa do sistema.
 */
export async function deleteCompany(companyId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(`DELETE FROM companies WHERE id = ?`, [companyId]);
  } catch (error) {
    console.error("[Database] Error deleting company:", error);
    throw error;
  }
}

/**
 * Retorna informações de licença de uma empresa.
 */
export async function getCompanyLicenseInfo(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [companyRows] = await pool.query(`SELECT id, name, maxUsers, plan, status FROM companies WHERE id = ? LIMIT 1`, [companyId]);
    const [userCountRows] = await pool.query(`SELECT COUNT(*) as count FROM userCompanyAssignments WHERE companyId = ? AND isActive = 1`, [companyId]);
    const company = (companyRows as any[])[0];
    const userCount = (userCountRows as any[])[0]?.count ?? 0;
    return company ? { ...company, currentUsers: userCount, availableSlots: (company.maxUsers || 0) - userCount } : null;
  } catch (error) {
    console.error("[Database] Error getting company license info:", error);
    throw error;
  }
}

/**
 * Retorna atribuições de usuários de uma empresa.
 */
export async function getUserAssignmentsByCompanyId(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT uca.*, u.name, u.email, u.role, u.profileImage
       FROM userCompanyAssignments uca
       JOIN users u ON uca.userId = u.id
       WHERE uca.companyId = ? AND uca.isActive = 1
       ORDER BY u.name ASC`,
      [companyId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting user assignments by company:", error);
    throw error;
  }
}

/**
 * Retorna departamentos de uma empresa.
 */
export async function getDepartmentsByCompanyId(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT * FROM departments WHERE companyId = ? ORDER BY name ASC`,
      [companyId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting departments by company:", error);
    throw error;
  }
}

/**
 * Atualiza dados de um departamento.
 */
export async function updateDepartment(departmentId: number, updates: Partial<{ name: string; description: string; managerId: number; companyId: number; manager: string; responsibleUserId: number | null }>) {
  const pool = getMysqlPool();
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString().slice(0, 19).replace('T', ' '), departmentId];
    await pool.query(`UPDATE departments SET ${fields}, updatedAt = ? WHERE id = ?`, values);
  } catch (error) {
    console.error("[Database] Error updating department:", error);
    throw error;
  }
}

/**
 * Remove um departamento do sistema.
 */
export async function deleteDepartment(departmentId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(`DELETE FROM departments WHERE id = ?`, [departmentId]);
  } catch (error) {
    console.error("[Database] Error deleting department:", error);
    throw error;
  }
}

/**
 * Retorna informações detalhadas de um departamento com dados do gestor.
 */
export async function getDepartmentWithUserInfo(departmentId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.name as managerName, u.email as managerEmail, u.profileImage as managerImage
       FROM departments d
       LEFT JOIN users u ON d.managerId = u.id
       WHERE d.id = ? LIMIT 1`,
      [departmentId]
    );
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : null;
  } catch (error) {
    console.error("[Database] Error getting department with user info:", error);
    throw error;
  }
}

/**
 * Retorna departamentos de uma empresa com contagem de usuários.
 */
export async function getDepartmentsByCompanyWithUserCounts(companyId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT d.*, 
              COUNT(DISTINCT uca.userId) as userCount,
              u.name as managerName
       FROM departments d
       LEFT JOIN userCompanyAssignments uca ON uca.companyId = d.companyId AND uca.isActive = 1
       LEFT JOIN users u ON d.managerId = u.id
       WHERE d.companyId = ?
       GROUP BY d.id
       ORDER BY d.name ASC`,
      [companyId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting departments with user counts:", error);
    throw error;
  }
}

/**
 * Retorna usuários de um departamento.
 */
export async function getUsersByDepartment(departmentId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.profileImage, u.position
       FROM users u
       WHERE u.department = (SELECT name FROM departments WHERE id = ? LIMIT 1)
       ORDER BY u.name ASC`,
      [departmentId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting users by department:", error);
    throw error;
  }
}

/**
 * Atribui um usuário a um departamento.
 */
export async function assignUserToDepartment(userId: number, departmentId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    const [deptRows] = await pool.query(`SELECT name FROM departments WHERE id = ? LIMIT 1`, [departmentId]);
    const deptName = (deptRows as any[])[0]?.name;
    if (deptName) {
      await pool.query(
        `UPDATE users SET department = ?, updatedAt = ? WHERE id = ?`,
        [deptName, new Date().toISOString().slice(0, 19).replace('T', ' '), userId]
      );
    }
  } catch (error) {
    console.error("[Database] Error assigning user to department:", error);
    throw error;
  }
}

/**
 * Remove um usuário de um departamento (limpa o campo department).
 */
export async function removeUserFromDepartment(userId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(
      `UPDATE users SET department = NULL, updatedAt = ? WHERE id = ?`,
      [new Date().toISOString().slice(0, 19).replace('T', ' '), userId]
    );
  } catch (error) {
    console.error("[Database] Error removing user from department:", error);
    throw error;
  }
}

/**
 * Retorna posições de um departamento.
 */
export async function getPositionsByDepartmentId(departmentId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT * FROM positions WHERE departmentId = ? ORDER BY name ASC`,
      [departmentId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting positions by department:", error);
    throw error;
  }
}

/**
 * Atualiza dados de uma posição/cargo.
 */
export async function updatePosition(positionId: number, updates: Partial<{ name: string; description: string; departmentId: number; companyId: number; level: string; salary: number }>) {
  const pool = getMysqlPool();
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString().slice(0, 19).replace('T', ' '), positionId];
    await pool.query(`UPDATE positions SET ${fields}, updatedAt = ? WHERE id = ?`, values);
  } catch (error) {
    console.error("[Database] Error updating position:", error);
    throw error;
  }
}

/**
 * Remove uma posição/cargo do sistema.
 */
export async function deletePosition(positionId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(`DELETE FROM positions WHERE id = ?`, [positionId]);
  } catch (error) {
    console.error("[Database] Error deleting position:", error);
    throw error;
  }
}

/**
 * Retorna atribuições de empresa de um usuário específico.
 */
export async function getUserAssignmentsByUserId(userId: number) {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(
      `SELECT uca.*, c.name as companyName, c.email as companyEmail,
              c.status as companyStatus, c.city as companyCity, c.state as companyState
       FROM userCompanyAssignments uca
       JOIN companies c ON uca.companyId = c.id
       WHERE uca.userId = ? AND uca.isActive = 1
       ORDER BY c.name ASC`,
      [userId]
    );
    return rows as any[];
  } catch (error) {
    console.error("[Database] Error getting user assignments by user:", error);
    throw error;
  }
}

/**
 * Cria uma atribuição de usuário a empresa.
 */
export async function createUserAssignment(data: { userId: number; companyId: number; role?: string; departmentId?: number; positionId?: number }) {
  const pool = getMysqlPool();
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query(
      `INSERT INTO userCompanyAssignments (userId, companyId, role, departmentId, positionId, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE isActive = 1, updatedAt = ?`,
      [data.userId, data.companyId, data.role || 'user', data.departmentId || null, data.positionId || null, now, now, now]
    );
  } catch (error) {
    console.error("[Database] Error creating user assignment:", error);
    throw error;
  }
}

/**
 * Atualiza uma atribuição de usuário a empresa.
 */
export async function updateUserAssignment(assignmentId: number, updates: Partial<{ role: string; departmentId: number; positionId: number; isActive: boolean }>) {
  const pool = getMysqlPool();
  try {
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updates), new Date().toISOString().slice(0, 19).replace('T', ' '), assignmentId];
    await pool.query(`UPDATE userCompanyAssignments SET ${fields}, updatedAt = ? WHERE id = ?`, values);
  } catch (error) {
    console.error("[Database] Error updating user assignment:", error);
    throw error;
  }
}

/**
 * Remove (desativa) uma atribuição de usuário a empresa.
 */
export async function deleteUserAssignment(assignmentId: number): Promise<void> {
  const pool = getMysqlPool();
  try {
    await pool.query(
      `UPDATE userCompanyAssignments SET isActive = 0, updatedAt = ? WHERE id = ?`,
      [new Date().toISOString().slice(0, 19).replace('T', ' '), assignmentId]
    );
  } catch (error) {
    console.error("[Database] Error deleting user assignment:", error);
    throw error;
  }
}

// ============================================================
// DEPARTAMENTOS PADRÃO
// ============================================================

export const DEFAULT_DEPARTMENTS = [
  { name: 'Administrativo', description: 'Administração geral e serviços internos' },
  { name: 'Diretoria', description: 'Direção executiva e estratégica da empresa' },
  { name: 'Financeiro', description: 'Gestão financeira, contabilidade e controladoria' },
  { name: 'Recursos Humanos', description: 'Gestão de pessoas e desenvolvimento organizacional' },
  { name: 'Comercial', description: 'Gestão comercial e relacionamento com clientes' },
  { name: 'Vendas', description: 'Prospecção, negociação e fechamento de vendas' },
  { name: 'Marketing', description: 'Estratégias de marketing, branding e comunicação' },
  { name: 'Tecnologia da Informação', description: 'Suporte técnico, infraestrutura e desenvolvimento de TI' },
  { name: 'Atendimento ao Cliente', description: 'Atendimento, suporte e satisfação do cliente' },
  { name: 'Customer Service', description: 'Serviço de atendimento pós-venda e fidelização' },
  { name: 'Produção', description: 'Gestão de produção e operações industriais' },
  { name: 'Logística (Supply Chain)', description: 'Gestão de logística, distribuição e cadeia de suprimentos' },
  { name: 'Compras', description: 'Aquisição de materiais, insumos e serviços' },
  { name: 'Qualidade', description: 'Controle e garantia de qualidade de produtos e processos' },
  { name: 'Projetos', description: 'Gestão e execução de projetos estratégicos' },
  { name: 'Jurídico', description: 'Assessoria jurídica, contratos e conformidade legal' },
  { name: 'Compliance', description: 'Conformidade regulatória, ética e governança corporativa' },
  { name: 'Segurança da Informação', description: 'Proteção de dados, cibersegurança e políticas de acesso' },
  { name: 'Treinamento', description: 'Capacitação, desenvolvimento e educação corporativa' },
];

/**
 * Sincroniza departamentos de uma empresa:
 * 1. Remove duplicatas (mantendo o mais antigo de cada nome)
 * 2. Cria os departamentos padrão que ainda não existem
 */
export async function syncDepartmentsForCompany(companyId: number): Promise<{ removed: number; created: number }> {
  const pool = getMysqlPool();
  try {
    // 1. Remover duplicatas: para cada nome, manter o de menor ID e deletar os demais
    const [allRows] = await pool.query(
      `SELECT id, name FROM departments WHERE companyId = ? ORDER BY id ASC`,
      [companyId]
    ) as any[];
    const rows = allRows as any[];

    const seen = new Map<string, number>(); // name -> id do primeiro encontrado
    const toDelete: number[] = [];
    for (const row of rows) {
      const key = row.name.trim().toLowerCase();
      if (seen.has(key)) {
        toDelete.push(row.id); // duplicata - marcar para deleção
      } else {
        seen.set(key, row.id);
      }
    }

    let removed = 0;
    if (toDelete.length > 0) {
      const placeholders = toDelete.map(() => '?').join(',');
      await pool.query(
        `DELETE FROM departments WHERE id IN (${placeholders})`,
        toDelete
      );
      removed = toDelete.length;
    }

    // 2. Criar departamentos padrão faltantes
    // Recarregar nomes existentes após remoção de duplicatas
    const [existingRows] = await pool.query(
      `SELECT name FROM departments WHERE companyId = ?`,
      [companyId]
    ) as any[];
    const existingNames = new Set(
      (existingRows as any[]).map((r: any) => r.name.trim().toLowerCase())
    );

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let created = 0;
    for (const dept of DEFAULT_DEPARTMENTS) {
      const key = dept.name.trim().toLowerCase();
      if (!existingNames.has(key)) {
        await pool.query(
          `INSERT INTO departments (companyId, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
          [companyId, dept.name, dept.description, now, now]
        );
        created++;
      }
    }

    return { removed, created };
  } catch (error) {
    console.error('[Database] Error syncing departments for company:', error);
    throw error;
  }
}

/**
 * Sincroniza departamentos para TODAS as empresas:
 * remove duplicatas e cria os 19 departamentos padrão faltantes.
 */
export async function syncAllCompaniesDepartments(): Promise<{ companies: number; totalRemoved: number; totalCreated: number }> {
  const pool = getMysqlPool();
  try {
    const [companyRows] = await pool.query(`SELECT id FROM companies ORDER BY id ASC`) as any[];
    const allCompanies = companyRows as any[];

    let totalRemoved = 0;
    let totalCreated = 0;

    for (const company of allCompanies) {
      const { removed, created } = await syncDepartmentsForCompany(company.id);
      totalRemoved += removed;
      totalCreated += created;
    }

    return { companies: allCompanies.length, totalRemoved, totalCreated };
  } catch (error) {
    console.error('[Database] Error syncing departments for all companies:', error);
    throw error;
  }
}

/**
 * Cria departamentos padrão para uma empresa (apenas se ela ainda não tiver nenhum).
 * Mantido por compatibilidade - prefer syncDepartmentsForCompany para novas chamadas.
 */
export async function createDefaultDepartments(companyId: number): Promise<any[]> {
  const pool = getMysqlPool();
  try {
    await syncDepartmentsForCompany(companyId);
    const [rows] = await pool.query(
      `SELECT * FROM departments WHERE companyId = ? ORDER BY name ASC`,
      [companyId]
    );
    return rows as any[];
  } catch (error) {
    console.error('[Database] Error creating default departments:', error);
    throw error;
  }
}

/**
 * Cria departamentos padrão para TODAS as empresas que ainda não têm departamentos.
 * Mantido por compatibilidade - prefer syncAllCompaniesDepartments para novas chamadas.
 */
export async function seedAllCompaniesDepartments(): Promise<{ processed: number; skipped: number; created: number }> {
  const result = await syncAllCompaniesDepartments();
  return { processed: result.companies, skipped: 0, created: result.totalCreated };
}

/**
 * Obter documentos atribuídos ao usuário logado
 */
export async function getUserDocuments(userId: number): Promise<any[]> {
  const pool = getMysqlPool();
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        da.status,
        da.assignedAt,
        da.readAt
      FROM documents d
      INNER JOIN document_assignments da ON d.id = da.documentId
      WHERE da.userId = ?
      ORDER BY da.assignedAt DESC
    `, [userId]);
    return rows as any[];
  } catch (error) {
    console.error('[Database] Error getting user documents:', error);
    return [];
  }
}

// ─── Tickets + Requests unificados por usuário ────────────────────────────────

/**
 * Busca chamados do usuário logado (tabelas tickets + requests) com filtros e paginação.
 */
export async function getMyTickets(params: {
  userId: number;
  userEmail?: string;
  isAdmin?: boolean;
  status?: string;
  priority?: string;
  type?: string;  // 'ticket' | 'request' | 'occurrence' | 'todos'
  search?: string;
  page?: number;
  limit?: number;
}) {
  const pool = getMysqlPool();
  const { userId, userEmail, isAdmin = false, status, priority, type, search, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  try {
    // ── tickets (tabela tickets - criados pelo portal) ────────────────────────
    // Só incluir se type não filtrar por request/occurrence
    const includePortalTickets = !type || type === 'todos' || type === 'ticket';
    let tQuery = `
      SELECT
        t.id,
        t.ticketId AS requestId,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.department AS category,
        t.assignedToName,
        t.createdAt,
        t.updatedAt,
        t.resolvedAt AS closedAt,
        t.slaDeadline,
        'portal' AS source,
        'ticket' AS type,
        t.userName,
        NULL AS userEmail
      FROM tickets t`;
    const tParams: any[] = [];

    // Admin vê todos; usuário comum vê apenas os seus
    if (isAdmin) {
      tQuery += ` WHERE 1=1`;
    } else {
      tQuery += ` WHERE t.userId = ?`;
      tParams.push(userId);
    }

    if (status && status !== 'todos') {
      const statusMap: Record<string, string> = {
        aberto: 'pendente', pendente: 'pendente',
        em_andamento: 'em_andamento',
        resolvido: 'resolvido', fechado: 'fechado',
      };
      tQuery += ` AND t.status = ?`;
      tParams.push(statusMap[status] ?? status);
    }
    if (priority && priority !== 'todos') {
      tQuery += ` AND t.priority = ?`;
      tParams.push(priority);
    }
    if (search) {
      tQuery += ` AND (t.title LIKE ? OR t.ticketId LIKE ?)`;
      tParams.push(`%${search}%`, `%${search}%`);
    }

    // ── requests (tabela requests - tickets/requests/occurrences) ─────────────
    let rQuery = `
      SELECT
        r.id,
        r.requestId,
        r.title,
        r.description,
        r.status,
        r.priority,
        r.category,
        r.assignedToName,
        r.createdAt,
        r.updatedAt,
        r.closedAt,
        r.slaDeadline,
        r.type AS source,
        r.type AS type,
        r.userName,
        r.userEmail
      FROM requests r`;
    const rParams: any[] = [];

    // Admin vê todos; usuário comum filtra por userId OU email
    if (isAdmin) {
      rQuery += ` WHERE 1=1`;
    } else {
      rQuery += ` WHERE (r.userId = ?`;
      rParams.push(userId);
      if (userEmail) {
        rQuery += ` OR r.userEmail = ?`;
        rParams.push(userEmail);
      }
      rQuery += `)`;
    }

    // Filtro por tipo (ticket/request/occurrence)
    if (type && type !== 'todos') {
      rQuery += ` AND r.type = ?`;
      rParams.push(type);
    }

    if (status && status !== 'todos') {
      rQuery += ` AND r.status = ?`;
      rParams.push(status);
    }
    if (priority && priority !== 'todos') {
      rQuery += ` AND r.priority = ?`;
      rParams.push(priority);
    }
    if (search) {
      rQuery += ` AND (r.title LIKE ? OR r.requestId LIKE ?)`;
      rParams.push(`%${search}%`, `%${search}%`);
    }

    // ── UNION + ordenação + paginação ─────────────────────────────────────────
    // Se filtrar por request/occurrence, não incluir tabela tickets
    let unionQuery: string;
    let allParams: any[];
    let countParams: any[];
    let countQuery: string;

    if (includePortalTickets) {
      unionQuery = `(${tQuery}) UNION ALL (${rQuery}) ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      allParams = [...tParams, ...rParams, limit, offset];
      countQuery = `SELECT COUNT(*) AS total FROM ((${tQuery}) UNION ALL (${rQuery})) AS combined`;
      countParams = [...tParams, ...rParams];
    } else {
      unionQuery = `${rQuery} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
      allParams = [...rParams, limit, offset];
      countQuery = `SELECT COUNT(*) AS total FROM (${rQuery}) AS combined`;
      countParams = [...rParams];
    }

    const [rows] = await pool.query(unionQuery, allParams);
    const [countRows] = await pool.query(countQuery, countParams) as any[];
    const total = (countRows as any[])[0]?.total ?? 0;

    return {
      tickets: rows as any[],
      total: Number(total),
      page,
      limit,
      totalPages: total > 0 ? Math.ceil(Number(total) / limit) : 0,
    };
  } catch (error) {
    console.error('[Database] Error getting my tickets:', error);
    throw error;
  }
}

/**
 * Contagem de chamados por status para o dashboard do usuário.
 */
export async function getMyTicketStats(userId: number, userEmail?: string, isAdmin = false) {
  const pool = getMysqlPool();
  try {
    const emailClause = userEmail ? ' OR userEmail = ?' : '';
    let queryParams: any[];
    let ticketWhere: string;
    let requestWhere: string;

    if (isAdmin) {
      ticketWhere = '1=1';
      requestWhere = '1=1';
      queryParams = [];
    } else {
      ticketWhere = 'userId = ?';
      requestWhere = `userId = ?${emailClause}`;
      queryParams = userEmail ? [userId, userId, userEmail] : [userId, userId];
    }

    const [rows] = await pool.query(
      `SELECT
        SUM(CASE WHEN status IN ('pendente','aberto') THEN 1 ELSE 0 END) AS abertos,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN status IN ('resolvido','fechado','cancelado','rejeitado') THEN 1 ELSE 0 END) AS resolvidos,
        COUNT(*) AS total,
        SUM(CASE WHEN type = 'ticket' OR source = 'portal' THEN 1 ELSE 0 END) AS chamados,
        SUM(CASE WHEN type = 'request' THEN 1 ELSE 0 END) AS requisicoes,
        SUM(CASE WHEN type = 'occurrence' THEN 1 ELSE 0 END) AS ocorrencias
       FROM (
         SELECT status, 'ticket' AS type, 'portal' AS source FROM tickets WHERE ${ticketWhere}
         UNION ALL
         SELECT status, type, type AS source FROM requests WHERE ${requestWhere}
       ) AS combined`,
      queryParams
    );
    const arr = rows as any[];
    const row = arr[0] ?? {};
    return {
      abertos: Number(row.abertos ?? 0),
      em_andamento: Number(row.em_andamento ?? 0),
      resolvidos: Number(row.resolvidos ?? 0),
      total: Number(row.total ?? 0),
      chamados: Number(row.chamados ?? 0),
      requisicoes: Number(row.requisicoes ?? 0),
      ocorrencias: Number(row.ocorrencias ?? 0),
    };
  } catch (error) {
    console.error('[Database] Error getting ticket stats:', error);
    return { abertos: 0, em_andamento: 0, resolvidos: 0, total: 0 };
  }
}

/**
 * Busca detalhes de um chamado específico (portal ou teams).
 */
export async function getTicketDetail(id: number, source: 'portal' | 'teams') {
  const pool = getMysqlPool();
  try {
    if (source === 'portal') {
      const [rows] = await pool.query(
        `SELECT t.* FROM tickets t WHERE t.id = ? LIMIT 1`,
        [id]
      );
      const arr = rows as any[];
      return arr[0] ?? null;
    } else {
      const [rows] = await pool.query(
        `SELECT r.* FROM requests r WHERE r.id = ? LIMIT 1`,
        [id]
      );
      const arr = rows as any[];
      return arr[0] ?? null;
    }
  } catch (error) {
    console.error('[Database] Error getting ticket detail:', error);
    throw error;
  }
}

/**
 * Busca comentários de um chamado.
 */
export async function getTicketComments(ticketId: number, source: 'portal' | 'teams') {
  const pool = getMysqlPool();
  try {
    if (source === 'portal') {
      const [rows] = await pool.query(
        `SELECT tc.*, u.name AS userName, u.profileImage AS userAvatar
         FROM ticket_comments tc
         LEFT JOIN users u ON u.id = tc.userId
         WHERE tc.ticketId = ?
         ORDER BY tc.createdAt ASC`,
        [ticketId]
      );
      return rows as any[];
    } else {
      // Tentar tabela request_comments; fallback para ticket_comments
      try {
        const [rows] = await pool.query(
          `SELECT rc.*, u.name AS userName, u.profileImage AS userAvatar
           FROM request_comments rc
           LEFT JOIN users u ON u.id = rc.userId
           WHERE rc.requestId = ?
           ORDER BY rc.createdAt ASC`,
          [ticketId]
        );
        return rows as any[];
      } catch {
        return [];
      }
    }
  } catch (error) {
    console.error('[Database] Error getting ticket comments:', error);
    return [];
  }
}

/**
 * Adiciona um comentário a um chamado.
 */
export async function addTicketComment(params: {
  ticketId: number;
  userId: number;
  userName: string;
  comment: string;
  source: 'portal' | 'teams';
}) {
  const pool = getMysqlPool();
  const { ticketId, userId, userName, comment, source } = params;
  try {
    if (source === 'portal') {
      await pool.query(
        `INSERT INTO ticket_comments (ticketId, userId, comment, createdAt, updatedAt)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [ticketId, userId, comment]
      );
    } else {
      try {
        await pool.query(
          `INSERT INTO request_comments (requestId, userId, userName, comment, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [ticketId, userId, userName, comment]
        );
      } catch {
        // Fallback: ticket_comments
        await pool.query(
          `INSERT INTO ticket_comments (ticketId, userId, comment, createdAt, updatedAt)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [ticketId, userId, comment]
        );
      }
    }
    return { success: true };
  } catch (error) {
    console.error('[Database] Error adding ticket comment:', error);
    throw error;
  }
}
