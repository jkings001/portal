import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { authRouter } from "./auth-router";
import {
  getTeamsEnv,
  getGraphAccessToken,
  processTeamsMessage,
  createGraphSubscription,
  renewGraphSubscription,
  deleteGraphSubscription,
  listGraphSubscriptionsFromApi,
  getIntegrationDashboard,
  validateWebhookRequest,
  testGraphMessageFetch,
  checkGraphPermissions,
  recreateSubscriptionWithClientState,
  reprocessFailedEvents,
} from "./teams";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  auth: authRouter,

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
        
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        status: z.enum(["pendente", "em_andamento", "resolvido", "fechado"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.updateTicketStatus(input.ticketId, input.status);
        return { success: true };
      }),

    // Chamados do usuário logado (tickets + requests unificados)
    myTickets: protectedProcedure
      .input(z.object({
        status: z.string().optional().default('todos'),
        priority: z.string().optional().default('todos'),
        type: z.string().optional().default('todos'), // 'ticket' | 'request' | 'occurrence' | 'todos'
        search: z.string().optional().default(''),
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
      }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user?.id) return { tickets: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        const isAdmin = ctx.user.role === 'admin' || ctx.user.role === 'manager';
        return await db.getMyTickets({
          userId: ctx.user.id,
          userEmail: ctx.user.email ?? undefined,
          isAdmin,
          status: input.status,
          priority: input.priority,
          type: input.type,
          search: input.search,
          page: input.page,
          limit: input.limit,
        });
      }),

    // Estatísticas dos chamados do usuário logado
    myStats: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) return { abertos: 0, em_andamento: 0, resolvidos: 0, total: 0, chamados: 0, requisicoes: 0, ocorrencias: 0 };
      const isAdmin = ctx.user.role === 'admin' || ctx.user.role === 'manager';
      return await db.getMyTicketStats(ctx.user.id, ctx.user.email ?? undefined, isAdmin);
    }),

    // Detalhes de um chamado específico
    detail: protectedProcedure
      .input(z.object({
        id: z.number(),
        source: z.enum(['portal', 'teams']),
      }))
      .query(async ({ input }) => {
        return await db.getTicketDetail(input.id, input.source);
      }),

    // Comentários de um chamado
    comments: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        source: z.enum(['portal', 'teams']),
      }))
      .query(async ({ input }) => {
        return await db.getTicketComments(input.ticketId, input.source);
      }),

    // Adicionar comentário
    addComment: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        comment: z.string().min(1),
        source: z.enum(['portal', 'teams']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user?.id) throw new Error('Not authenticated');
        return await db.addTicketComment({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          userName: ctx.user.name ?? ctx.user.email ?? 'Usuário',
          comment: input.comment,
          source: input.source,
        });
      }),
  }),

  // Notifications procedures
  notifications: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
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
    userDocuments: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.id) throw new Error('Not authenticated');
      return await db.getUserDocuments(ctx.user.id);
    }),
  }),

  // Trainings procedures
  trainings: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTrainings();
    }),
  }),

  // Users procedures
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Not authorized");
      }
      return await db.getAllUsers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.userId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["user", "admin", "manager"]).default("user"),
        department: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Apenas administradores podem criar usuários.");
        }
        
        // Validate email is unique
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error(`O e-mail ${input.email} já está registrado.`);
        }
        
        const { hashPassword, isValidPassword } = await import("./auth");
        
        if (!isValidPassword(input.password)) {
          throw new Error("A senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.");
        }

        const passwordHash = await hashPassword(input.password);
        
        // Create a temporary openId for local users
        const openId = `local-${input.email}-${Date.now()}`;
        
        await db.createUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          department: input.department,
          loginMethod: "local",
          lastSignedIn: new Date().toISOString().slice(0, 19).replace('T', ' '),
        });
        
        return { success: true, message: "Usuário criado com sucesso!" };
      }),

    update: protectedProcedure
      .input(z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin", "manager"]).optional(),
        department: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        
        const user = await db.getUserById(input.userId);
        if (!user) throw new Error("User not found");
        
        // Validate email is unique if being changed
        if (input.email && input.email !== user.email) {
          const existingUser = await db.getUserByEmail(input.email);
          if (existingUser) {
            throw new Error(`Email ${input.email} já está registrado`);
          }
        }
        
        await db.updateUser(input.userId, {
          name: input.name || user.name,
          email: input.email || user.email,
          role: input.role || user.role,
          department: input.department || user.department,
        });
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        
        await db.deleteUser(input.userId);
        return { success: true };
      }),
  }),

  // Companies procedures
  companies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Not authorized");
      }
      return await db.getAllCompanies();
    }),

    getById: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getCompanyById(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        cnpj: z.string().min(14),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        maxLicenses: z.number().min(1).default(10),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        
        // Validate CNPJ is unique
        const existingCompany = await db.getCompanyByCnpj(input.cnpj);
        if (existingCompany) {
          throw new Error(`CNPJ ${input.cnpj} já está registrado`);
        }
        
        await db.createCompany(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        name: z.string().optional(),
        cnpj: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        maxLicenses: z.number().min(1).optional(),
        status: z.enum(["ativa", "inativa", "suspensa"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        
        const company = await db.getCompanyById(input.companyId);
        if (!company) throw new Error("Company not found");
        
        // Validate CNPJ is unique if being changed
        if (input.cnpj && input.cnpj !== company.cnpj) {
          const existingCompany = await db.getCompanyByCnpj(input.cnpj);
          if (existingCompany) {
            throw new Error(`CNPJ ${input.cnpj} já está registrado`);
          }
        }
        
        const { companyId, ...data } = input;
        await db.updateCompany(companyId, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.deleteCompany(input.companyId);
        return { success: true };
      }),

    getLicenseInfo: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getCompanyLicenseInfo(input.companyId);
      }),

    getUsersByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getUserAssignmentsByCompanyId(input.companyId);
      }),
  }),

  // Departments procedures
  departments: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getDepartmentsByCompanyId(input.companyId);
      }),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        manager: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.createDepartment(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        manager: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        const { departmentId, ...data } = input;
        await db.updateDepartment(departmentId, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ departmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.deleteDepartment(input.departmentId);
        return { success: true };
      }),

    getWithUserCount: protectedProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getDepartmentWithUserInfo(input.departmentId);
      }),

    listByCompanyWithCounts: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getDepartmentsByCompanyWithUserCounts(input.companyId);
      }),

    getUsersByDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getUsersByDepartment(input.departmentId);
      }),

    assignUserToDepartment: protectedProcedure
      .input(z.object({ userId: z.number(), departmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.assignUserToDepartment(input.userId, input.departmentId);
        return { success: true };
      }),

    removeUserFromDepartment: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.removeUserFromDepartment(input.userId);
        return { success: true };
      }),
  }),

  // Positions procedures
  positions: router({
    listByDepartment: protectedProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getPositionsByDepartmentId(input.departmentId);
      }),

    create: protectedProcedure
      .input(z.object({
        departmentId: z.number(),
        name: z.string().min(1),
        level: z.enum(["junior", "pleno", "senior", "gerente", "diretor"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.createPosition(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        positionId: z.number(),
        name: z.string().optional(),
        level: z.enum(["junior", "pleno", "senior", "gerente", "diretor"]).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        const { positionId, ...data } = input;
        await db.updatePosition(positionId, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ positionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.deletePosition(input.positionId);
        return { success: true };
      }),
  }),

  // User Company Assignments procedures
  userAssignments: router({
    listByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        return await db.getUserAssignmentsByCompanyId(input.companyId);
      }),

    listByUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin" && ctx.user?.id !== input.userId) {
          throw new Error("Not authorized");
        }
        return await db.getUserAssignmentsByUserId(input.userId);
      }),

    create: protectedProcedure
      .input(z.object({
        userId: z.number(),
        companyId: z.number(),
        departmentId: z.number().optional(),
        positionId: z.number().optional(),
        role: z.enum(["colaborador", "supervisor", "gerente", "admin"]).default("colaborador"),
        approvalLevel: z.number().min(1).max(5).default(1),
        startDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.createUserAssignment(input);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        assignmentId: z.number(),
        role: z.enum(["colaborador", "supervisor", "gerente", "admin"]).optional(),
        approvalLevel: z.number().min(1).max(5).optional(),
        isActive: z.boolean().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        const { assignmentId, ...data } = input;
        await db.updateUserAssignment(assignmentId, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Not authorized");
        }
        await db.deleteUserAssignment(input.assignmentId);
        return { success: true };
      }),
  }),

  // ─── Microsoft Teams Integration ───────────────────────────────────────────────
  teams: router({
    /**
     * Verifica se as credenciais estão configuradas e testa o token do Graph.
     * Acessível por qualquer usuário autenticado.
     */
    health: protectedProcedure.query(async () => {
      const env = getTeamsEnv();
      const configured =
        Boolean(env.TEAMS_TENANT_ID) &&
        Boolean(env.TEAMS_CLIENT_ID) &&
        Boolean(env.TEAMS_CLIENT_SECRET);

      if (!configured) {
        return {
          configured: false,
          tokenOk: false,
          message:
            "Credenciais não configuradas. Defina TEAMS_TENANT_ID, TEAMS_CLIENT_ID e TEAMS_CLIENT_SECRET.",
        };
      }

      try {
        await getGraphAccessToken();
        return {
          configured: true,
          tokenOk: true,
          message: "Conexão com Microsoft Graph estabelecida com sucesso.",
        };
      } catch (error) {
        return {
          configured: true,
          tokenOk: false,
          message:
            error instanceof Error
              ? error.message
              : "Falha ao obter token do Microsoft Graph.",
        };
      }
    }),

    /**
     * Painel operacional da integração Teams.
     * Retorna subscriptions, eventos recentes e mapeamentos.
     * Restrito a admin.
     */
    dashboard: adminProcedure.query(async () => {
      return getIntegrationDashboard();
    }),

    /**
     * Cria uma subscription no Microsoft Graph para receber notificações de mensagens.
     * Restrito a admin.
     */
    createSubscription: adminProcedure
      .input(
        z.object({
          resource: z.string().min(1),
          changeType: z.string().default("created"),
          expirationDateTime: z.string().min(1),
          notificationUrl: z.string().url().optional(),
          lifecycleNotificationUrl: z.string().url().optional(),
          includeResourceData: z.boolean().optional().default(false),
          encryptionCertificate: z.string().optional(),
          encryptionCertificateId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return createGraphSubscription(input);
      }),

    /**
     * Deleta uma subscription no Microsoft Graph e remove do banco local.
     * Restrito a admin.
     */
    deleteSubscription: adminProcedure
      .input(
        z.object({
          subscriptionId: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return deleteGraphSubscription(input.subscriptionId);
      }),

    /**
     * Lista subscriptions diretamente do Microsoft Graph (fonte de verdade).
     * Restrito a admin.
     */
    listGraphSubscriptions: adminProcedure
      .query(async () => {
        return listGraphSubscriptionsFromApi();
      }),

    /**
     * Renova uma subscription existente no Microsoft Graph.
     * Restrito a admin.
     */
    renewSubscription: adminProcedure
      .input(
        z.object({
          subscriptionId: z.string().min(1),
          expirationDateTime: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return renewGraphSubscription(
          input.subscriptionId,
          input.expirationDateTime,
        );
      }),

    /**
     * Processa manualmente uma mensagem do Teams e cria um chamado.
     * útil para testes e reprocessamento.
     * Restrito a admin.
     */
    processMessage: adminProcedure
      .input(
        z.object({
          messageId: z.string().min(1),
          messageText: z.string().default(""),
          senderName: z.string().default("Usuário Teams"),
          senderEmail: z.string().min(1),
          createdAt: z.string().optional(),
          contextType: z.enum(["chat", "channel"]).default("chat"),
          teamId: z.string().optional(),
          channelId: z.string().optional(),
          chatId: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return processTeamsMessage({
          ...input,
          createdAt: input.createdAt ?? new Date().toISOString(),
        });
      }),

    /**
     * Valida um payload de webhook (sem processar).
     * Restrito a admin.
     */
    validateWebhook: adminProcedure
      .input(z.object({ payload: z.unknown() }))
      .mutation(async ({ input }) => {
        return validateWebhookRequest(input.payload);
      }),

    /**
     * Testa diretamente a chamada Graph para um chatId/messageId específico.
     * Útil para diagnóstico de permissões Azure AD (Chat.Read.All).
     * Restrito a admin.
     */
    testGraphFetch: adminProcedure
      .input(
        z.object({
          chatId: z.string().min(1),
          messageId: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return testGraphMessageFetch(input.chatId, input.messageId);
      }),

    /**
     * Verifica as permissões do app no Azure AD.
     * Testa Chat.Read.All, User.Read.All e Subscription.Read.All.
     * Restrito a admin.
     */
    checkPermissions: adminProcedure
      .query(async () => {
        return checkGraphPermissions();
      }),

    /**
     * Recria a subscription com clientState correto.
     * Útil para corrigir subscriptions criadas sem clientState.
     * Restrito a admin.
     */
    fixSubscription: adminProcedure
      .mutation(async () => {
        return recreateSubscriptionWithClientState();
      }),

    /**
     * Reprocessa eventos com status 'failed'.
     * Útil para recuperar mensagens que falharam por erro de banco.
     * Restrito a admin.
     */
    reprocessFailed: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(50).default(10),
        }),
      )
      .mutation(async ({ input }) => {
        return reprocessFailedEvents(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
