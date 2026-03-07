import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Tickets/Chamados procedures
  tickets: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTickets();
    }),
    
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      return await db.getTicketsByUserId(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        department: z.string().optional(),
        priority: z.enum(["baixa", "media", "alta", "critica"]).default("media"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) throw new Error("Not authenticated");
        
        // Generate ticket ID (TK-001, TK-002, etc)
        const allTickets = await db.getAllTickets();
        const nextId = allTickets.length + 1;
        const ticketId = `TK-${String(nextId).padStart(3, "0")}`;
        
        await db.createTicket({
          ticketId,
          title: input.title,
          description: input.description,
          userId: ctx.user.id,
          userName: ctx.user.name,
          department: input.department,
          priority: input.priority,
          status: "pendente",
        });
        
        return { success: true, ticketId };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        status: z.enum(["pendente", "em_andamento", "resolvido", "fechado"]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificacao de role via middleware adminProcedure nao aplicavel aqui
        // pois managers tambem podem atualizar. Verificacao manual mantida.
        if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
          throw new Error("Not authorized");
        }
        
        await db.updateTicketStatus(input.ticketId, input.status);
        return { success: true };
      }),

    // Listagem admin de todos os tickets
    listAll: adminProcedure.query(async () => {
      return await db.getAllTickets();
    }),
  }),

  // Notifications procedures
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return [];
      return await db.getNotificationsByUserId(ctx.user.id);
    }),
    
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
  }),

  // Documents procedures
  documents: router({
    list: publicProcedure.query(async () => {
      return await db.getAllDocuments();
    }),
  }),

  // Trainings procedures
  trainings: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTrainings();
    }),
  }),

  // Users procedures (admin-only via adminProcedure middleware)
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),

    getById: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.userId);
      }),

    update: adminProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        role: z.enum(["user", "admin", "manager"]).optional(),
        department: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateUser(input.userId, {
          name: input.name,
          role: input.role,
          department: input.department,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
      }),
  }),

  // Alias 'user' para compatibilidade com UsersManagement.tsx
  user: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
