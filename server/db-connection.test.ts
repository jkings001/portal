/**
 * Teste de conexão com banco de dados MySQL do Railway
 * As credenciais são lidas exclusivamente de variáveis de ambiente.
 */
import { describe, it, expect } from 'vitest';
import mysql from 'mysql2/promise';

function getRailwayConfig() {
  const url = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '3306', 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      connectTimeout: 10000,
    };
  }
  return {
    host: process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT || '3306', 10),
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'railway',
    connectTimeout: 10000,
  };
}

describe('Database Connection (Railway)', () => {
  it('should have correct connection config from env vars', () => {
    const config = getRailwayConfig();
    expect(config.host).toBeDefined();
    expect(config.port).toBeGreaterThan(0);
    expect(config.user).toBeDefined();
    expect(config.database).toBeDefined();
  });

  it('should connect to MySQL on Railway', async () => {
    const config = getRailwayConfig();
    let connection;
    try {
      connection = await mysql.createConnection(config);
      const [rows] = await connection.execute('SELECT 1 as test, DATABASE() as db') as any[];
      expect(rows[0].test).toBe(1);
      expect(rows[0].db).toBe(config.database);
      console.log('✅ Database connection successful!', rows[0]);
    } finally {
      if (connection) await connection.end();
    }
  }, 15000);

  it('should have users table with correct columns', async () => {
    const config = getRailwayConfig();
    let connection;
    try {
      connection = await mysql.createConnection(config);
      const [cols] = await connection.execute('DESCRIBE users') as any[];
      const colNames = cols.map((c: any) => c.Field);
      expect(colNames).toContain('id');
      expect(colNames).toContain('name');
      expect(colNames).toContain('email');
      expect(colNames).toContain('role');
      expect(colNames).toContain('passwordHash');
      expect(colNames).toContain('profileImage');
      console.log('✅ Users table columns:', colNames.join(', '));
    } finally {
      if (connection) await connection.end();
    }
  }, 15000);
});
