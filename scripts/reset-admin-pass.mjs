import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const NEW_PASSWORD = 'Jkadm2010***';

const conn = await mysql.createConnection({
  host: '127.0.0.1', port: 3307,
  user: 'u298830991_admin', password: 'Jk1210BlueCat',
  database: 'u298830991_portal', ssl: { rejectUnauthorized: false }
});

const hash = await bcrypt.hash(NEW_PASSWORD, 12);
const [result] = await conn.execute(
  'UPDATE users SET passwordHash = ? WHERE email = ?',
  [hash, 'jeferson.reis@jkings.com.br']
);

console.log('Rows updated:', result.affectedRows);
console.log('Senha redefinida para:', NEW_PASSWORD);

// Verificar
const [rows] = await conn.execute(
  'SELECT email, passwordHash FROM users WHERE email = ?',
  ['jeferson.reis@jkings.com.br']
);
const match = await bcrypt.compare(NEW_PASSWORD, rows[0].passwordHash);
console.log('Verificação:', match ? 'OK' : 'FALHOU');

await conn.end();
