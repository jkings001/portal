import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const conn = await mysql.createConnection({
  host: '127.0.0.1', port: 3307,
  user: 'u298830991_admin', password: 'Jk1210BlueCat',
  database: 'u298830991_portal', ssl: { rejectUnauthorized: false }
});

const [rows] = await conn.execute(
  'SELECT email, passwordHash FROM users WHERE email = ?',
  ['jeferson.reis@jkings.com.br']
);

const hash = rows[0]?.passwordHash;
console.log('Hash exists:', !!hash);
console.log('Hash prefix:', hash?.substring(0, 7));

const passwords = ['Jkadm2010***', 'Jkadm1210###', 'Admin@123', 'Jk1210BlueCat'];
for (const p of passwords) {
  if (hash) {
    const match = await bcrypt.compare(p, hash);
    console.log(`Senha "${p}" match:`, match);
  }
}

await conn.end();
