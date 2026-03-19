/**
 * Testes para validar as correções de segurança aplicadas.
 * FIX-01: Rate limiting no login
 * FIX-02: Helmet (headers de segurança)
 * FIX-08: Sanitização XSS
 * FIX-09: Rotas REST protegidas com authenticateJwt
 * FIX-10: bcryptjs.default.hash padronizado
 * FIX-11: Logs sem dados sensíveis
 * FIX-12: passwordHash não exposto em respostas
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Ler os arquivos de código-fonte para verificar padrões
const indexPath = path.resolve(__dirname, '_core/index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

const authRouterPath = path.resolve(__dirname, 'auth-router.ts');
const authRouterContent = fs.readFileSync(authRouterPath, 'utf-8');

const passportConfigPath = path.resolve(__dirname, 'passport-config.ts');
const passportConfigContent = fs.readFileSync(passportConfigPath, 'utf-8');

const dbPath = path.resolve(__dirname, 'db.ts');
const dbContent = fs.readFileSync(dbPath, 'utf-8');

describe('Security Fixes Validation', () => {

  describe('FIX-01: Rate Limiting', () => {
    it('should import express-rate-limit', () => {
      expect(indexContent).toContain("import rateLimit from 'express-rate-limit'");
    });

    it('should have login rate limiter configured', () => {
      expect(indexContent).toContain('loginLimiter');
      expect(indexContent).toContain("app.use('/api/auth/login', loginLimiter)");
    });

    it('should have general API rate limiter', () => {
      expect(indexContent).toContain('apiLimiter');
      expect(indexContent).toContain("app.use('/api/', apiLimiter)");
    });

    it('should have trust proxy enabled for rate limiter behind reverse proxy', () => {
      expect(indexContent).toContain("app.set('trust proxy', 1)");
    });
  });

  describe('FIX-02: Helmet Security Headers', () => {
    it('should import helmet', () => {
      expect(indexContent).toContain("import helmet from 'helmet'");
    });

    it('should use helmet middleware', () => {
      expect(indexContent).toContain('app.use(helmet(');
    });
  });

  describe('FIX-08: XSS Sanitization', () => {
    it('should import xss library', () => {
      expect(indexContent).toContain("import xss from 'xss'");
    });

    it('should have sanitizeInput helper function', () => {
      expect(indexContent).toContain('function sanitizeInput');
    });
  });

  describe('FIX-09: REST Routes Protected with authenticateJwt', () => {
    it('should protect GET /api/users with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/users', authenticateJwt,");
    });

    it('should protect POST /api/users with authenticateJwt', () => {
      expect(indexContent).toContain("app.post('/api/users', authenticateJwt,");
    });

    it('should protect PUT /api/users/:id with authenticateJwt', () => {
      expect(indexContent).toContain("app.put('/api/users/:id', authenticateJwt,");
    });

    it('should protect DELETE /api/users/:id with authenticateJwt', () => {
      expect(indexContent).toContain("app.delete('/api/users/:id', authenticateJwt,");
    });

    it('should protect GET /api/companies with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/companies', authenticateJwt,");
    });

    it('should protect POST /api/companies with authenticateJwt', () => {
      expect(indexContent).toContain("app.post('/api/companies', authenticateJwt,");
    });

    it('should protect GET /api/departments with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/departments', authenticateJwt,");
    });

    it('should protect GET /api/tickets with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/tickets', authenticateJwt,");
    });

    it('should protect POST /api/tickets with authenticateJwt', () => {
      expect(indexContent).toContain("app.post('/api/tickets', authenticateJwt,");
    });

    it('should protect GET /api/dashboard/stats with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/dashboard/stats', authenticateJwt,");
    });

    it('should protect Hostinger API routes with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/hostinger/vms', authenticateJwt,");
      expect(indexContent).toContain("app.get('/api/hostinger/domains', authenticateJwt,");
    });

    it('should protect user preferences routes with authenticateJwt', () => {
      expect(indexContent).toContain("app.get('/api/users/:userId/preferences', authenticateJwt,");
      expect(indexContent).toContain("app.put('/api/users/:userId/preferences', authenticateJwt,");
    });
  });

  describe('FIX-05: Duplicate Comment Routes Removed', () => {
    it('should not have duplicate comment routes at /api/tickets/:id/comments', () => {
      // A rota canônica usa :ticketId, as duplicatas usavam :id
      const duplicatePattern = /app\.(get|post)\('\/api\/tickets\/:id\/comments'/g;
      const matches = indexContent.match(duplicatePattern);
      // Não deve existir nenhuma rota com :id/comments (foram removidas)
      expect(matches).toBeNull();
    });

    it('should have canonical comment routes at /api/tickets/:ticketId/comments', () => {
      expect(indexContent).toContain("app.post('/api/tickets/:ticketId/comments', authenticateJwt,");
      expect(indexContent).toContain("app.get('/api/tickets/:ticketId/comments', authenticateJwt,");
    });
  });

  describe('FIX-10: bcryptjs Usage Consistency', () => {
    it('should not use bcryptjs.hash without .default in dynamic imports in index.ts', () => {
      // Procurar por `bcryptjs.hash(` que NÃO seja `bcryptjs.default.hash(`
      // Padrão: bcryptjs.hash( sem default antes
      const lines = indexContent.split('\n');
      const badLines = lines.filter(line => {
        return line.includes('bcryptjs.hash(') && !line.includes('bcryptjs.default.hash(') && !line.includes('//');
      });
      expect(badLines).toHaveLength(0);
    });
  });

  describe('FIX-11: No Sensitive Data in Logs', () => {
    it('should not log email addresses in auth-router.ts', () => {
      // Verificar que não há ${input.email} nos console.log
      expect(authRouterContent).not.toContain('console.log(`[Auth] Successful database login for: ${input.email}`');
      expect(authRouterContent).not.toContain('console.log(`[Auth] Invalid password for database user: ${input.email}`');
      expect(authRouterContent).not.toContain('console.log(`[Auth] Forgot password request for unknown email: ${input.email}`');
    });

    it('should not log email or password hash in passport-config.ts', () => {
      expect(passportConfigContent).not.toContain("console.log('[Passport] User not found for email:', email)");
      expect(passportConfigContent).not.toContain("hasHash: !!user.passwordHash");
      expect(passportConfigContent).not.toContain("console.log('[Passport] Invalid password for user:', user.email)");
    });
  });

  describe('FIX-03: Reset Password Token Validation', () => {
    it('should validate token from database instead of using userId 0', () => {
      expect(indexContent).not.toContain('await updateUserPassword(0, hashedPassword)');
      expect(indexContent).toContain("password_reset_tokens WHERE token = ? AND usedAt IS NULL");
    });

    it('should mark token as used after password reset', () => {
      expect(indexContent).toContain("UPDATE password_reset_tokens SET usedAt = NOW()");
    });
  });

  describe('FIX-04: verifyToken Async Usage', () => {
    it('should use await with verifyToken in search endpoint', () => {
      // Verificar que o search endpoint usa await verifyToken
      const searchStart = indexContent.indexOf("app.get('/api/search'");
      const searchSection = indexContent.substring(searchStart, searchStart + 1000);
      expect(searchSection).toContain('await verifyToken(token)');
    });
  });

  describe('FIX-06: MySQL Pool Usage in Search', () => {
    it('should use pool instead of createConnection in search endpoint', () => {
      const searchStart = indexContent.indexOf("app.get('/api/search'");
      const searchSection = indexContent.substring(searchStart, searchStart + 1500);
      expect(searchSection).not.toContain('mysql.default.createConnection');
      expect(searchSection).toContain("import('../mysql-pool')");
    });
  });

  describe('FIX-12: passwordHash Not Exposed', () => {
    it('should strip passwordHash from updateUser response', () => {
      expect(dbContent).toContain('const { passwordHash: _ph, ...safeUser } = updatedUser as any');
    });
  });
});
