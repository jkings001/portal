import mysql from 'mysql2/promise';
import net from 'net';

const HOST = 'turntable.proxy.rlwy.net';
const PORT = 48844;
const USER = 'root';
const PASS = 'eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA';
const DB = 'railway';

// First test raw TCP to see if we get MySQL greeting
console.log('=== TCP Raw Test ===');
await new Promise((resolve) => {
  const socket = net.createConnection({ host: HOST, port: PORT });
  socket.setTimeout(10000);
  
  socket.on('connect', () => {
    console.log('TCP Connected!');
  });
  
  socket.on('data', (data) => {
    console.log('Received data (first 50 bytes hex):', data.slice(0, 50).toString('hex'));
    console.log('Received data (ascii):', data.slice(0, 50).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
    socket.destroy();
    resolve();
  });
  
  socket.on('timeout', () => {
    console.log('TCP timeout - no data received');
    socket.destroy();
    resolve();
  });
  
  socket.on('error', (err) => {
    console.log('TCP error:', err.message);
    resolve();
  });
  
  socket.on('close', () => {
    console.log('TCP connection closed');
    resolve();
  });
});

// Now try mysql2 with longer timeout
console.log('\n=== MySQL2 Test (30s timeout) ===');
try {
  const conn = await mysql.createConnection({
    host: HOST,
    port: PORT,
    user: USER,
    password: PASS,
    database: DB,
    connectTimeout: 30000,
    ssl: false,
  });
  const [rows] = await conn.query('SELECT 1 as test, VERSION() as version');
  console.log('SUCCESS:', JSON.stringify(rows));
  await conn.end();
} catch (e) {
  console.log('MySQL2 failed:', e.message, e.code);
}
