import mysql from 'mysql2/promise';
import tls from 'tls';
import net from 'net';

const HOST = 'turntable.proxy.rlwy.net';
const PORT = 48844;
const USER = 'root';
const PASS = 'eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA';
const DB = 'railway';

// Test if server expects TLS first (client-initiated TLS)
console.log('=== TLS Handshake Test ===');
await new Promise((resolve) => {
  const socket = tls.connect({
    host: HOST,
    port: PORT,
    rejectUnauthorized: false,
    timeout: 10000,
  }, () => {
    console.log('TLS Connected! Authorized:', socket.authorized);
    console.log('TLS Protocol:', socket.getProtocol());
    socket.destroy();
    resolve();
  });
  
  socket.on('data', (data) => {
    console.log('TLS data received:', data.slice(0, 50).toString('hex'));
  });
  
  socket.on('timeout', () => {
    console.log('TLS timeout');
    socket.destroy();
    resolve();
  });
  
  socket.on('error', (err) => {
    console.log('TLS error:', err.message);
    resolve();
  });
  
  socket.on('close', () => {
    resolve();
  });
});

// Try mysql2 with ssl: true (forces TLS from start)
console.log('\n=== MySQL2 with ssl:true ===');
try {
  const conn = await mysql.createConnection({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASS,
    database: DB,
    connectTimeout: 15000,
    ssl: true,
  });
  const [rows] = await conn.query('SELECT 1 as test, VERSION() as version');
  console.log('SUCCESS (ssl:true):', JSON.stringify(rows));
  await conn.end();
  process.exit(0);
} catch (e) {
  console.log('ssl:true failed:', e.message, e.code);
}

// Try with authPlugins override
console.log('\n=== MySQL2 with ssl:{} ===');
try {
  const conn = await mysql.createConnection({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASS,
    database: DB,
    connectTimeout: 15000,
    ssl: {},
  });
  const [rows] = await conn.query('SELECT 1 as test, VERSION() as version');
  console.log('SUCCESS (ssl:{}):', JSON.stringify(rows));
  await conn.end();
  process.exit(0);
} catch (e) {
  console.log('ssl:{} failed:', e.message, e.code);
}

console.log('\nAll tests done');
