import mysql from 'mysql2/promise';

const dbUrl = 'mysql://root:eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA@turntable.proxy.rlwy.net:48844/railway';
const parsed = new globalThis.URL(dbUrl);

const base = {
  host: parsed.hostname,
  port: parseInt(parsed.port || '3306'),
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ''),
  connectTimeout: 10000,
};

console.log('Testing connection to:', base.host, base.port, base.database);

// Test without SSL first
try {
  const conn = await mysql.createConnection({ ...base });
  const [rows] = await conn.query('SELECT 1 as test, VERSION() as version');
  console.log('SUCCESS (no SSL):', JSON.stringify(rows));
  await conn.end();
  process.exit(0);
} catch (e) {
  console.log('No SSL failed:', e.message);
}

// Test with SSL
try {
  const conn = await mysql.createConnection({ ...base, ssl: { rejectUnauthorized: false } });
  const [rows] = await conn.query('SELECT 1 as test, VERSION() as version');
  console.log('SUCCESS (SSL):', JSON.stringify(rows));
  await conn.end();
  process.exit(0);
} catch (e) {
  console.log('SSL failed:', e.message);
}

console.log('All failed');
process.exit(1);
