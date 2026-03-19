import bcrypt from 'bcrypt';
import { db } from './db.ts';
import { users } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const TEST_EMAIL = 'admin@jkings.solutions';
const TEST_PASSWORD = 'Admin@123456';

async function createTestUser() {
  try {
    console.log('Criando usuário de teste...');
    
    // Verificar se usuário já existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_EMAIL))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('Usuário de teste já existe');
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    // Gerar openId único
    const openId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Inserir usuário
    await db.insert(users).values({
      openId,
      name: 'Admin JKINGS',
      email: TEST_EMAIL,
      passwordHash,
      role: 'admin',
      loginMethod: 'email',
      department: 'Administração',
    });

    console.log('✓ Usuário de teste criado com sucesso');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Senha: ${TEST_PASSWORD}`);
  } catch (error) {
    console.error('Erro ao criar usuário de teste:', error);
  }
}

createTestUser();
