/**
 * Testes para Passport.js
 * 
 * Testa:
 * - LocalStrategy: autenticação com email/senha
 * - JwtStrategy: validação de tokens JWT
 * - Serialização/desserialização de usuário
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { verifyPassword, generateToken } from './auth';
import { hashPassword } from './auth';

describe('Passport.js Authentication', () => {
  describe('LocalStrategy', () => {
    it('deve hashear senha com bcryptjs', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20); // bcrypt hashes são longos
    });

    it('deve verificar senha correta', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar senha incorreta', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('deve rejeitar hash inválido', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'not-a-valid-hash';
      
      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe('JwtStrategy', () => {
    it('deve gerar token JWT válido', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
        department: 'IT',
      };
      
      const token = await generateToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT tem 3 partes
    });

    it('deve incluir dados do usuário no token', async () => {
      const user = {
        id: '123',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'admin' as const,
        department: 'Management',
      };
      
      const token = await generateToken(user);
      
      // Decodificar token (sem verificar assinatura para teste)
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(payload.user).toBeDefined();
      expect(payload.user.id).toBe('123');
      expect(payload.user.email).toBe('john@example.com');
      expect(payload.user.role).toBe('admin');
    });

    it('deve incluir timestamps no token', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
      };
      
      const token = await generateToken(user);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(payload.iat).toBeDefined(); // issued at
      expect(payload.exp).toBeDefined(); // expiration
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('token deve ter expiração de 7 dias', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
      };
      
      const token = await generateToken(user);
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      const expirationMs = (payload.exp - payload.iat) * 1000;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      
      // Permitir 1 segundo de diferença
      expect(Math.abs(expirationMs - sevenDaysMs)).toBeLessThan(1000);
    });
  });

  describe('Middleware de Autenticação', () => {
    it('deve exportar authenticateLocal', async () => {
      const { authenticateLocal } = await import('./passport-middleware');
      expect(authenticateLocal).toBeDefined();
    });

    it('deve exportar authenticateJwt', async () => {
      const { authenticateJwt } = await import('./passport-middleware');
      expect(authenticateJwt).toBeDefined();
    });

    it('deve exportar requireAuth', async () => {
      const { requireAuth } = await import('./passport-middleware');
      expect(requireAuth).toBeDefined();
    });

    it('deve exportar requireAdmin', async () => {
      const { requireAdmin } = await import('./passport-middleware');
      expect(requireAdmin).toBeDefined();
    });

    it('deve exportar requireAdminOrManager', async () => {
      const { requireAdminOrManager } = await import('./passport-middleware');
      expect(requireAdminOrManager).toBeDefined();
    });
  });

  describe('Rotas de Autenticação', () => {
    it('deve exportar router de autenticação', async () => {
      const authRoutes = await import('./passport-routes');
      expect(authRoutes.default).toBeDefined();
    });

    it('router deve ter método post', async () => {
      const authRoutes = await import('./passport-routes');
      const router = authRoutes.default;
      
      expect(router).toBeDefined();
      expect(typeof router.post).toBe('function');
    });

    it('router deve ter método get', async () => {
      const authRoutes = await import('./passport-routes');
      const router = authRoutes.default;
      
      expect(router).toBeDefined();
      expect(typeof router.get).toBe('function');
    });
  });

  describe('Configuração do Passport', () => {
    it('deve exportar configuração do Passport', async () => {
      const passport = await import('./passport-config');
      expect(passport.default).toBeDefined();
    });

    // Interfaces TypeScript não são exportadas em runtime
    // it('deve ter interface SerializedUser', async () => {
    //   const { SerializedUser } = await import('./passport-config');
    //   expect(SerializedUser).toBeDefined();
    // });
  });

  describe('Integração End-to-End', () => {
    it('fluxo completo: hash -> verify -> token', async () => {
      // 1. Hash da senha
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      
      // 2. Verificar senha
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      // 3. Gerar token
      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'User Name',
        role: 'user' as const,
        department: 'Sales',
      };
      
      const token = await generateToken(user);
      expect(token).toBeDefined();
      
      // 4. Decodificar token
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(payload.user.email).toBe('user@example.com');
      expect(payload.user.role).toBe('user');
    });
  });
});
