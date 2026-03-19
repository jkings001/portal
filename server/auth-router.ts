/**
 * Unified Authentication Router
 * 
 * Provides tRPC procedures for:
 * - Local login with email/password (from database or in-memory store)
 * - User registration
 * - Logout
 * - User listing (admin only)
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generateToken, verifyPassword, isValidEmail, isValidPassword, hashPassword } from "./auth";
import { sendPasswordResetEmail } from "./email-service";
import { createPasswordResetToken, getPasswordResetToken, markPasswordResetTokenAsUsed, updateUserPassword } from "./db";
import crypto from "crypto";
import { userStore } from "./user-store";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      let user = null;
      let authUser = null;

      // Try to authenticate from database first
      try {
        const dbUser = await db.getUserByEmail(input.email);
        if (dbUser) {
          let passwordValid = false;
          if (dbUser.passwordHash) {
            passwordValid = await verifyPassword(input.password, dbUser.passwordHash);
          }

          if (passwordValid) {
            authUser = {
              id: dbUser.id.toString(),
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role || 'user',
            };
            user = dbUser;
            console.log('[Auth] Successful database login');
          } else {
            console.log('[Auth] Invalid password for database user');
          }
        }
      } catch (err) {
        console.error('[Auth] Database login error:', err);
      }

      // Fall back to in-memory store
      if (!authUser) {
        user = userStore.getUserByEmail(input.email);
        if (user) {
          const passwordValid = await verifyPassword(input.password, user.passwordHash);
          if (passwordValid) {
            authUser = userStore.toAuthUser(user);
            console.log('[Auth] Successful in-memory login');
          } else {
            console.log('[Auth] Invalid password for in-memory user');
          }
        }
      }

      if (!authUser) {
        throw new Error("Invalid email or password");
      }

      // Update last login in memory store
      if (user && user.id) {
        try {
          userStore.updateLastLogin(String(user.id));
        } catch (err) {
          // Ignore if user not in memory store
        }
      }

      // Generate session token compatible with sdk.verifySession
      const sessionToken = await sdk.createSessionToken(
        authUser.id.toString(),
        { name: authUser.name || authUser.email || '', expiresInMs: ONE_YEAR_MS }
      );

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log(`[Auth] Session cookie set for user: ${authUser.email}`);

      return {
        success: true,
        user: authUser,
      };
    }),

  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        // Para evitar enumeração de usuários, sempre retorna sucesso
        console.log('[Auth] Forgot password request for unknown email');
        return { success: true, message: "Se o e-mail estiver cadastrado, um link de redefinição será enviado." };
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 3600000); // 1 hora de validade

      await createPasswordResetToken(user.id, resetToken, expiresAt);

      const resetLink = `${process.env.VITE_FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email!, user.name || user.email!, resetLink);

      return { success: true, message: "Se o e-mail estiver cadastrado, um link de redefinição será enviado." };
    }),

  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
    }))
    .mutation(async ({ input }) => {
      const resetTokenRecord = await getPasswordResetToken(input.token);

      if (!resetTokenRecord || resetTokenRecord.usedAt || new Date() > new Date(resetTokenRecord.expiresAt)) {
        throw new Error("Token de redefinição inválido ou expirado.");
      }

      const user = await db.getUserById(resetTokenRecord.userId);
      if (!user) {
        throw new Error("Usuário não encontrado.");
      }

      if (!isValidPassword(input.newPassword)) {
        throw new Error("A nova senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.");
      }

      // A função updateUserPassword já faz o hash da senha
      await updateUserPassword(user.id, input.newPassword);
      await markPasswordResetTokenAsUsed(resetTokenRecord.id);

      return { success: true, message: "Senha redefinida com sucesso!" };
    }),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate email format
      if (!isValidEmail(input.email)) {
        throw new Error("Formato de e-mail inválido");
      }

      // Validate password strength
      if (!isValidPassword(input.password)) {
        throw new Error("A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número");
      }

      // Check if email already exists in database
      try {
        const existingDbUser = await db.getUserByEmail(input.email);
        if (existingDbUser) {
          throw new Error("Este e-mail já está registrado");
        }
      } catch (err: any) {
        if (err.message.includes("já está registrado")) throw err;
        console.error('[Auth] Database check failed during registration:', err);
      }

      // Also check in-memory store
      if (userStore.getUserByEmail(input.email)) {
        throw new Error("Este e-mail já está registrado");
      }

      // Create user in database first
      let newUser = null;
      try {
        const passwordHash = await hashPassword(input.password);
        await db.createUser({
          openId: `local_${input.email}`,
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'user',
          loginMethod: 'local',
        } as any);
        const registeredUser = await db.getUserByEmail(input.email);
        newUser = registeredUser ? { id: registeredUser.id, email: registeredUser.email, name: registeredUser.name, role: registeredUser.role, passwordHash: '' } : null;
        console.log(`[Auth] User registered in database: ${input.email} (ID: ${newUser?.id})`);
      } catch (err) {
        console.error('[Auth] Failed to create user in database, creating in memory store:', err);
        // Fallback to in-memory store
        newUser = await userStore.createUser(
          input.email,
          input.name,
          input.password,
          "user"
        );
      }

      if (!newUser) {
        throw new Error('Falha ao criar usuário');
      }

      const regAuthUser = {
        id: String(newUser.id),
        email: newUser.email || input.email,
        name: newUser.name || input.name,
        role: newUser.role || 'user',
      };

      // Generate session token and set cookie
      const sessionToken = await sdk.createSessionToken(
        regAuthUser.id.toString(),
        { name: regAuthUser.name || regAuthUser.email || '', expiresInMs: ONE_YEAR_MS }
      );
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log(`[Auth] Session cookie set for new user: ${regAuthUser.email}`);

      return {
        success: true,
        user: regAuthUser,
      };
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Clear session cookie
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, {
      maxAge: -1,
      ...cookieOptions,
    });
    
    return {
      success: true,
    };
  }),

  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error("Only admins can list users");
    }

    try {
      return await db.getAllUsers();
    } catch (err) {
      console.error('[Auth] Failed to list users from database:', err);
      return userStore.getAllUsers();
    }
  }),

  createUser: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['user', 'admin']).default('user'),
      password: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error("Only admins can create users");
      }

      // Validate email format
      if (!isValidEmail(input.email)) {
        throw new Error("Formato de e-mail inválido");
      }

      // Validate password strength
      if (!isValidPassword(input.password)) {
        throw new Error("A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número");
      }

      // Check if email already exists
      try {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Este e-mail já está registrado");
        }
      } catch (err: any) {
        if (err.message.includes("já está registrado")) throw err;
        console.error('[Auth] Database check failed during user creation:', err);
      }

      // Create user in database
      try {
        const passwordHash = await hashPassword(input.password);       
        await db.createUser({
          openId: `local_${input.email}`,
          email: input.email,
          name: input.name,
          passwordHash,
          role: input.role,
          loginMethod: 'local',
        } as any);

        const createdUser = await db.getUserByEmail(input.email);
        console.log(`[Auth] Admin created user: ${input.email} with role ${input.role}`);

        return {
          id: createdUser?.id,
          email: createdUser?.email,
          name: createdUser?.name,
          role: createdUser?.role,
        };
      } catch (err) {
        console.error('[Auth] Failed to create user in database:', err);
        throw new Error("Falha ao criar usuário");
      }
    }),

  updateUser: protectedProcedure
    .input(z.object({
      id: z.number(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      role: z.enum(['user', 'admin']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error("Only admins can update users");
      }

      try {
        await db.updateUser(input.id, {
          email: input.email,
          name: input.name,
          role: input.role,
        });

        const updatedUser = await db.getUserById(input.id);
        console.log(`[Auth] Admin updated user ID ${input.id}`);
        return updatedUser;
      } catch (err) {
        console.error('[Auth] Failed to update user in database:', err);
        throw new Error("Falha ao atualizar usuário");
      }
    }),

  deleteUser: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error("Only admins can delete users");
      }

      try {
        await db.deleteUser(input.id);
        console.log(`[Auth] Admin deleted user ID ${input.id}`);
        return { success: true };
      } catch (err) {
        console.error('[Auth] Failed to delete user from database:', err);
        throw new Error("Falha ao deletar usuário");
      }
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("Usuário não autenticado.");
      }

      const user = await db.getUserById(Number(ctx.user.id));
      if (!user) {
        throw new Error("Usuário não encontrado.");
      }

      // Se o usuário não tem hash de senha (ex: login via OAuth), ele não pode mudar a senha por aqui
      if (!user.passwordHash) {
        throw new Error("Este usuário não possui uma senha local definida.");
      }

      const isCurrentPasswordCorrect = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isCurrentPasswordCorrect) {
        throw new Error("A senha atual está incorreta.");
      }

      if (!isValidPassword(input.newPassword)) {
        throw new Error("A nova senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.");
      }

      // A função updateUserPassword já faz o hash da senha
      await updateUserPassword(Number(ctx.user.id), input.newPassword);

      return { success: true, message: "Senha alterada com sucesso!" };
    }),
});
