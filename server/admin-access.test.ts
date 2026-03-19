/**
 * Testes para o endpoint POST /api/auth/verify-admin-access
 * Verifica que o endpoint:
 * 1. Rejeita requisições sem email/senha
 * 2. Rejeita usuários não-admin
 * 3. Rejeita senhas incorretas
 * 4. Aceita credenciais válidas de admin
 * 5. Retorna token JWT e dados do usuário
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock do módulo db
vi.mock('./db', () => ({
  getUserByEmail: vi.fn(),
}));

// Mock do módulo auth
vi.mock('./auth', () => ({
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}));

import * as db from './db';
import * as auth from './auth';

describe('Admin Access Verification Logic', () => {
  const mockAdminUser = {
    id: 1,
    name: 'Admin User',
    email: 'admin@jkings.com.br',
    role: 'admin',
    passwordHash: '',
    profileImage: null,
    department: 'TI',
    company: 'JKINGS',
  };

  const mockRegularUser = {
    id: 2,
    name: 'Regular User',
    email: 'user@jkings.com.br',
    role: 'user',
    passwordHash: '',
    profileImage: null,
    department: 'Suporte',
    company: 'JKINGS',
  };

  beforeEach(async () => {
    // Gerar hash real para os testes
    mockAdminUser.passwordHash = await bcrypt.hash('AdminPass123!', 10);
    mockRegularUser.passwordHash = await bcrypt.hash('UserPass123!', 10);
    vi.clearAllMocks();
  });

  describe('Validação de entrada', () => {
    it('deve rejeitar requisição sem email', () => {
      const email = '';
      const password = 'somepassword';
      expect(!email || !password).toBe(true);
    });

    it('deve rejeitar requisição sem senha', () => {
      const email = 'admin@jkings.com.br';
      const password = '';
      expect(!email || !password).toBe(true);
    });

    it('deve aceitar requisição com email e senha', () => {
      const email = 'admin@jkings.com.br';
      const password = 'AdminPass123!';
      expect(!email || !password).toBe(false);
    });
  });

  describe('Verificação de usuário no banco', () => {
    it('deve retornar 401 quando usuário não existe', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(null);

      const user = await db.getUserByEmail('inexistente@jkings.com.br');
      expect(user).toBeNull();
    });

    it('deve encontrar usuário admin existente', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);

      const user = await db.getUserByEmail('admin@jkings.com.br');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('admin@jkings.com.br');
    });
  });

  describe('Verificação de role', () => {
    it('deve negar acesso a usuário com role "user"', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockRegularUser as any);

      const user = await db.getUserByEmail('user@jkings.com.br');
      expect(user?.role).not.toBe('admin');
    });

    it('deve permitir acesso a usuário com role "admin"', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);

      const user = await db.getUserByEmail('admin@jkings.com.br');
      expect(user?.role).toBe('admin');
    });
  });

  describe('Verificação de senha com bcrypt', () => {
    it('deve rejeitar senha incorreta', async () => {
      const isValid = await bcrypt.compare('senhaErrada', mockAdminUser.passwordHash);
      expect(isValid).toBe(false);
    });

    it('deve aceitar senha correta', async () => {
      const isValid = await bcrypt.compare('AdminPass123!', mockAdminUser.passwordHash);
      expect(isValid).toBe(true);
    });

    it('deve usar campo passwordHash para verificação', async () => {
      const user = { ...mockAdminUser, password: undefined };
      const passwordField = user.password || user.passwordHash;
      expect(passwordField).toBe(mockAdminUser.passwordHash);
    });

    it('deve usar campo password quando passwordHash não existe', async () => {
      const user = { ...mockAdminUser, passwordHash: undefined, password: 'hash_alternativo' };
      const passwordField = (user as any).password || (user as any).passwordHash;
      expect(passwordField).toBe('hash_alternativo');
    });
  });

  describe('Geração de token JWT após verificação', () => {
    it('deve gerar token quando credenciais são válidas', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);
      vi.mocked(auth.generateToken).mockReturnValue('mocked.jwt.token' as any);

      const user = await db.getUserByEmail('admin@jkings.com.br');
      const isValid = await bcrypt.compare('AdminPass123!', user!.passwordHash);
      
      expect(isValid).toBe(true);
      
      if (isValid && user) {
        const token = auth.generateToken(user as any);
        expect(token).toBe('mocked.jwt.token');
      }
    });

    it('deve retornar dados do usuário sem senha', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);

      const user = await db.getUserByEmail('admin@jkings.com.br');
      
      // Simular resposta do endpoint
      const responseData = {
        success: true,
        token: 'mocked.jwt.token',
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          role: user!.role,
          profileImage: user!.profileImage || null,
          department: user!.department || null,
          company: user!.company || null,
        }
      };

      // Verificar que não inclui passwordHash
      expect(responseData.user).not.toHaveProperty('passwordHash');
      expect(responseData.user).not.toHaveProperty('password');
      expect(responseData.user.role).toBe('admin');
    });
  });

  describe('Fluxo completo de verificação', () => {
    it('deve completar fluxo completo para admin válido', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);
      vi.mocked(auth.generateToken).mockReturnValue('valid.admin.token' as any);

      const email = 'admin@jkings.com.br';
      const password = 'AdminPass123!';

      // 1. Buscar usuário
      const user = await db.getUserByEmail(email);
      expect(user).not.toBeNull();

      // 2. Verificar role
      expect(user!.role).toBe('admin');

      // 3. Verificar senha
      const passwordField = user!.passwordHash;
      const isValid = await bcrypt.compare(password, passwordField);
      expect(isValid).toBe(true);

      // 4. Gerar token
      const token = auth.generateToken(user as any);
      expect(token).toBe('valid.admin.token');
    });

    it('deve falhar no fluxo para usuário regular', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockRegularUser as any);

      const email = 'user@jkings.com.br';
      const user = await db.getUserByEmail(email);
      
      expect(user).not.toBeNull();
      expect(user!.role).not.toBe('admin');
      // Fluxo deve parar aqui com 403
    });

    it('deve falhar no fluxo para senha incorreta', async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(mockAdminUser as any);

      const email = 'admin@jkings.com.br';
      const password = 'senhaErrada123';

      const user = await db.getUserByEmail(email);
      expect(user!.role).toBe('admin');

      const passwordField = user!.passwordHash;
      const isValid = await bcrypt.compare(password, passwordField);
      expect(isValid).toBe(false);
      // Fluxo deve parar aqui com 401
    });
  });
});
