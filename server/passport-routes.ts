/**
 * Rotas de Autenticação com Passport.js
 * 
 * Endpoints:
 * - POST /api/auth/login - Autentica com email/senha
 * - GET /api/auth/me - Retorna dados do usuário autenticado
 * - POST /api/auth/logout - Faz logout do usuário
 */

import { Router, Request, Response } from 'express';
import { authenticateLocal, authenticateJwt } from './passport-middleware';
import { generateToken } from './auth';
import { sdk } from './_core/sdk';
import { getSessionCookieOptions } from './_core/cookies';
import { COOKIE_NAME, ONE_YEAR_MS } from '../shared/const';

const router = Router();

/**
 * POST /api/auth/login
 * Autentica usuário com email e senha usando Passport LocalStrategy
 */
router.post('/login', authenticateLocal, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Falha na autenticacao' });
    }
    
    const token = await generateToken({
      id: req.user.id.toString(),
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      department: req.user.department,
    });

    // Set session cookie so tRPC protectedProcedures work alongside REST routes
    const sessionToken = await sdk.createSessionToken(
      req.user.id.toString(),
      { name: req.user.name || req.user.email || '', expiresInMs: ONE_YEAR_MS }
    );
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    
    res.json({
      success: true,
      token,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        profileImage: req.user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/auth/login] Error:', error);
    const errorMessage = error?.message || 'Erro ao fazer login';
    const isConnectionError = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('connect');
    const statusCode = isConnectionError ? 503 : 500;
    const message = isConnectionError ? 'Banco de dados indisponivel. Tente novamente em alguns momentos.' : 'Erro ao fazer login';
    res.status(statusCode).json({ error: message });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado (requer JWT token)
 */
router.get('/me', authenticateJwt, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nao autenticado' });
  }
  
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      profileImage: req.user.profileImage,
    },
  });
});

/**
 * POST /api/auth/logout
 * Faz logout do usuário — limpa o cookie de sessão
 */
router.post('/logout', (req: Request, res: Response) => {
  const cookieOptions = getSessionCookieOptions(req);
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ success: true, message: 'Logout realizado com sucesso' });
  });
});

export default router;
