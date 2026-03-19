/**
 * Middleware de Autenticação Passport
 * 
 * Fornece middlewares para proteger rotas:
 * - authenticateLocal: Autentica com email/senha
 * - authenticateJwt: Valida JWT token
 * - requireAuth: Verifica se usuário está autenticado
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { SerializedUser } from './passport-config';

// Estender interface Express.User para incluir dados do usuário
declare global {
  namespace Express {
    interface User extends SerializedUser {}
  }
}

/**
 * Middleware para autenticação local (email/senha)
 * Usa a estratégia 'local' do Passport
 * Retorna JSON em caso de falha
 */
export const authenticateLocal = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
    
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Email ou senha incorretos' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware para autenticacao JWT ou Sessao Express
 * Aceita: JWT Bearer Token no header OU sessao Express (cookie)
 * Retorna JSON em caso de falha
 */
export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  // Se o usuario ja esta autenticado via sessao Express, prosseguir
  if (req.user) {
    return next();
  }
  
  // Se ha um header Authorization com Bearer token, tentar JWT
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao validar token' });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || 'Token invalido ou expirado' });
      }
      req.user = user;
      next();
    })(req, res, next);
  }
  
  // Sem sessao nem token JWT - nao autenticado
  return res.status(401).json({ error: 'Nao autenticado' });
};

/**
 * Middleware para verificar se usuário está autenticado
 * Retorna erro 401 se não autenticado
 * Funciona com sessão Express ou JWT
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

/**
 * Middleware para autenticação via sessão Express
 * Verifica se o usuário está autenticado via req.user (preenchido pela sessão)
 */
export const requireAuthSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

/**
 * Middleware para verificar se usuário é admin
 * Retorna erro 403 se não for admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar.' });
  }
  
  next();
};

/**
 * Middleware para verificar se usuário é admin ou manager
 */
export const requireAdminOrManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores ou gerentes podem acessar.' });
  }
  
  next();
};

/**
 * Middleware JWT opcional: popula req.user se o token for válido,
 * mas SEMPRE deixa a requisição prosseguir (rotas públicas com progresso personalizado).
 *
 * Implementado sem passport.authenticate para evitar o comportamento padrão de
 * retornar 401 quando não há token (passport-jwt chama self.fail() nesse caso).
 * Usa `jose` (já instalado no projeto) para verificar o token.
 */
export const optionalJwt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // sem token → prossegue sem usuário
    }

    const token = authHeader.slice(7);
    const rawSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Verificar o token usando jose (biblioteca já instalada no projeto)
    try {
      const { jwtVerify } = await import('jose');
      const secret = new TextEncoder().encode(rawSecret);
      const { payload } = await jwtVerify(token, secret);
      const user = (payload as any)?.user;
      if (user?.id) {
        req.user = user as Express.User;
      }
    } catch {
      // token inválido ou expirado → prossegue sem usuário
    }
  } catch {
    // qualquer erro inesperado → prossegue sem usuário
  }
  next();
};

/**
 * Middleware para lidar com erros de autenticação
 */
export const handleAuthError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  
  if (err.message === 'Email ou senha incorretos') {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }
  
  next(err);
};
