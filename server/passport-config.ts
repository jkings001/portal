/**
 * Passport.js Configuration
 * 
 * Configura estratégias de autenticação:
 * - LocalStrategy: Autenticação com email/senha
 * - JwtStrategy: Validação de tokens JWT
 * 
 * Usa a tabela 'users' do banco de dados MySQL
 */

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { verifyPassword } from './auth';
import { getUserByEmail, getUserById } from './db';
import { retryWithBackoff } from './retry';

// Interface para o usuário serializado
export interface SerializedUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'manager';
  department?: string;
  profileImage?: string;
}

// ============= LocalStrategy =============
// Autentica usuário com email e senha
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: false,
    },
    async (email: string, password: string, done) => {
      try {
        // Timeout de 10 segundos para evitar travamento
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        );
        
        // Buscar usuario no banco de dados com retry
        const userPromise = retryWithBackoff(
          () => getUserByEmail(email),
          {
            maxAttempts: 3,
            initialDelayMs: 100,
            backoffMultiplier: 2,
          }
        );
        
        const result = await Promise.race([userPromise, timeoutPromise]);
        // retryWithBackoff retorna { success, data, ... } - desempacotar o dado
        const user = (result as any)?.data ?? result;

        // Verificar se usuário existe
        if (!user) {
          console.log('[Passport] User not found');
          return done(null, false, { message: 'Email ou senha incorretos' });
        }

        console.log('[Passport] User found, verifying credentials');

        // Verificar senha contra o banco
        let isPasswordValid = false;
        if (user.passwordHash) {
          isPasswordValid = await verifyPassword(password, user.passwordHash);
        }

        // Permitir login se a senha for válida
        if (!isPasswordValid) {
          console.log('[Passport] Invalid password');
          return done(null, false, { message: 'Email ou senha incorretos' });
        }

        // Retornar usuário autenticado
        return done(null, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'user' | 'admin' | 'manager',
          department: user.department,
          profileImage: user.profileImage,
        } as SerializedUser);
      } catch (error: any) {
        console.error('[Passport LocalStrategy] Error:', error);
        if (error.message === 'Database timeout') {
          return done(null, false, { message: 'Banco de dados indisponivel. Tente novamente.' });
        }
        return done(error);
      }
    }
  )
);

// ============= JwtStrategy =============
// Valida tokens JWT e recupera dados do usuário
passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      passReqToCallback: false,
    },
    async (payload: any, done) => {
      try {
        // Extrair dados do token
        const { user } = payload;
        
        if (!user || !user.id) {
          return done(null, false, { message: 'Token invalido' });
        }

        // Timeout de 10 segundos para evitar travamento
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 10000)
        );
        
        // Buscar usuario no banco de dados para validar
        const dbUserPromise = retryWithBackoff(
          () => getUserById(user.id),
          {
            maxAttempts: 3,
            initialDelayMs: 100,
            backoffMultiplier: 2,
          }
        );
        
        const dbUserResult = await Promise.race([dbUserPromise, timeoutPromise]) as any;
        // retryWithBackoff retorna { success, data, ... } - desempacotar o dado
        const dbUser = dbUserResult?.data ?? dbUserResult;

        if (!dbUser || !dbUser.id) {
          // Tentar buscar por email quando ID não é encontrado (token de sessão anterior)
          if (user.email) {
            try {
              const { getUserByEmail } = await import('./db');
              const dbUserByEmail = await getUserByEmail(user.email);
              if (dbUserByEmail && dbUserByEmail.id) {
                console.log('[Passport JwtStrategy] User found by email fallback');
                return done(null, {
                  id: dbUserByEmail.id,
                  email: dbUserByEmail.email,
                  name: dbUserByEmail.name,
                  role: dbUserByEmail.role as 'user' | 'admin' | 'manager',
                  department: dbUserByEmail.department,
                  profileImage: dbUserByEmail.profileImage,
                } as SerializedUser);
              }
            } catch (emailLookupError) {
              console.warn('[Passport JwtStrategy] Email lookup also failed:', emailLookupError);
            }
          }
          // Fallback final: usar dados do próprio token
          console.warn('[Passport JwtStrategy] User not found in DB, using token data as fallback for:', user.email);
          return done(null, {
            id: Number(user.id),
            email: user.email,
            name: user.name,
            role: (user.role || 'user') as 'user' | 'admin' | 'manager',
            department: user.department,
            profileImage: user.profileImage,
          } as SerializedUser);
        }

        console.log('[Passport JwtStrategy] User validated from DB:', { id: dbUser.id, role: dbUser.role });
        // Retornar usuário validado do banco
        return done(null, {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role as 'user' | 'admin' | 'manager',
          department: dbUser.department,
          profileImage: dbUser.profileImage,
        } as SerializedUser);
      } catch (error: any) {
        console.error('[Passport JwtStrategy] Error:', error);
        if (error.message === 'Database timeout') {
          // Fallback: usar dados do token quando banco está indisponível
          console.warn('[Passport JwtStrategy] DB timeout, using token data as fallback for:', payload.user?.email);
          return done(null, {
            id: Number(payload.user?.id),
            email: payload.user?.email,
            name: payload.user?.name,
            role: (payload.user?.role || 'user') as 'user' | 'admin' | 'manager',
            department: payload.user?.department,
            profileImage: payload.user?.profileImage,
          } as SerializedUser);
        }
        return done(error);
      }
    }
  )
);

// ============= Serialização de Usuário =============
// Serializa usuário para sessão (apenas ID)
passport.serializeUser((user: SerializedUser, done) => {
  done(null, user.id);
});

// Desserializa usuário da sessão (busca dados completos)
passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await retryWithBackoff(
      () => getUserById(id),
      {
        maxAttempts: 3,
        initialDelayMs: 100,
        backoffMultiplier: 2,
      }
    );

    // retryWithBackoff retorna { success, data, ... } - desempacotar o dado
    const user = (result as any)?.data ?? result;

    if (!user) {
      return done(null, false);
    }

    done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'user' | 'admin' | 'manager',
      department: user.department,
      profileImage: user.profileImage,
    } as SerializedUser);
  } catch (error: any) {
    console.error('[Passport deserializeUser] Error:', error);
    done(error);
  }
});

export default passport;
