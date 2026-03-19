/**
 * Script para atualizar a senha do usuário jeferson.reis@jkings.com.br no banco Railway
 * 
 * Uso: node update-user-password.mjs
 */

import mysql from 'mysql2/promise';

const config = {
  host: 'turntable.proxy.rlwy.net',
  user: 'root',
  password: 'eqAyCFJuMHEcCZbDRkvWRmLgmYTBbPlA',
  database: 'railway',
  port: 48844,
};

const passwordHash = '$2b$10$1gnhtaHnh88Ban4Ntwo62ep1Q1wX.ic75Li4iNm0GJXrRv7JEqQwe';
const email = 'jeferson.reis@jkings.com.br';

async function updateUserPassword() {
  let connection;
  try {
    console.log('Conectando ao banco Railway...');
    connection = await mysql.createConnection(config);
    
    console.log(`Atualizando senha para usuário: ${email}`);
    const [result] = await connection.execute(
      'UPDATE users SET passwordHash = ?, updatedAt = NOW() WHERE email = ?',
      [passwordHash, email]
    );
    
    if (result.affectedRows === 0) {
      console.error(`Usuário ${email} não encontrado no banco!`);
      process.exit(1);
    }
    
    console.log(`✓ Senha atualizada com sucesso para ${email}`);
    console.log(`Linhas afetadas: ${result.affectedRows}`);
    
    // Verificar se a senha foi atualizada
    const [rows] = await connection.execute(
      'SELECT id, email, passwordHash FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      console.log(`\nVerificação:`);
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Hash: ${user.passwordHash.substring(0, 20)}...`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateUserPassword();
