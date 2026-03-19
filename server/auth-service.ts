import bcryptjs from 'bcryptjs';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { retryWithBackoff } from './retry';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    openId: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    profileImage?: string;
  };
  error?: string;
}

/**
 * Autentica usuário validando email e senha contra base de dados
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    if (!email || !password) {
      return {
        success: false,
        error: 'Email e senha são obrigatórios',
      };
    }

    // Buscar usuário por email com retry
    const retryResult = await retryWithBackoff(
      async () => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');
        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        return result[0];
      },
      {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      }
    );

    const user = retryResult.data;

    if (!user) {
      return {
        success: false,
        error: 'Email ou senha incorretos',
      };
    }

    // Verificar se usuário tem senha definida
    if (!user.passwordHash) {
      return {
        success: false,
        error: 'Usuário não possui senha configurada',
      };
    }

    // Validar senha com bcrypt
    try {
      const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return {
          success: false,
          error: 'Email ou senha incorretos',
        };
      }
    } catch (bcryptError) {
      console.error('Erro ao comparar senhas:', bcryptError);
      return {
        success: false,
        error: 'Erro ao validar senha. Tente novamente.',
      };
    }

    // Retornar dados do usuário autenticado
    return {
      success: true,
      user: {
        id: user.id,
        openId: user.openId,
        name: user.name || 'Usuário',
        email: user.email || '',
        role: user.role,
        department: user.department || undefined,
        profileImage: user.profileImage || undefined,
      },
    };
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return {
      success: false,
      error: 'Erro ao processar autenticação. Tente novamente.',
    };
  }
}

/**
 * Valida força da senha
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < 6) {
    errors.push('Senha deve ter no mínimo 6 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcryptjs.hash(password, saltRounds);
}
