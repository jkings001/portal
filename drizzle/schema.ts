import { mysqlTable, mysqlSchema, AnyMySqlColumn, unique, int, varchar, text, mysqlEnum, timestamp, decimal, date, datetime } from "drizzle-orm/mysql-core"
import { sql, InferInsertModel, InferSelectModel } from "drizzle-orm"

export const companies = mysqlTable("companies", {
	id: int().autoincrement().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	cnpj: varchar({ length: 18 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	address: text(),
	city: varchar({ length: 100 }),
	state: varchar({ length: 2 }),
	zipCode: varchar({ length: 10 }),
	status: mysqlEnum(['ativa','inativa','suspensa']).default('ativa').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	maxLicenses: int().default(10).notNull(),
},
(table) => [
	unique("companies_cnpj_unique").on(table.cnpj),
]);

export const departments = mysqlTable("departments", {
	id: int().autoincrement().primaryKey().notNull(),
	companyId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	manager: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	responsibleUserId: int(),
});

	export const documents = mysqlTable("documents", {
		id: int().autoincrement().primaryKey().notNull(),
		title: varchar({ length: 255 }).notNull(),
		description: text(),
		category: varchar({ length: 100 }),
		groupName: varchar({ length: 100 }),
		fileUrl: varchar({ length: 500 }),
		fileKey: varchar({ length: 500 }),
		fileName: varchar({ length: 255 }),
		fileSize: int(),
		mimeType: varchar({ length: 100 }),
		createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
		updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	});

export const documentAssignments = mysqlTable("document_assignments", {
	id: int().autoincrement().primaryKey().notNull(),
	documentId: int().notNull(),
	userId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	readAt: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending','read','acknowledged']).default('pending').notNull(),
});

export type DocumentAssignment = InferSelectModel<typeof documentAssignments>;
export type NewDocumentAssignment = InferInsertModel<typeof documentAssignments>;

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text(),
	type: mysqlEnum(['ticket','system','alert','info']).default('info').notNull(),
	ticketId: int(),
	read: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const positions = mysqlTable("positions", {
	id: int().autoincrement().primaryKey().notNull(),
	departmentId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	level: mysqlEnum(['junior','pleno','senior','gerente','diretor']).notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tickets = mysqlTable("tickets", {
	id: int().autoincrement().primaryKey().notNull(),
	ticketId: varchar({ length: 20 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }),
	department: varchar({ length: 100 }),
	status: mysqlEnum(['pendente','em_andamento','resolvido','fechado']).default('pendente').notNull(),
	priority: mysqlEnum(['baixa','media','alta','critica']).default('media').notNull(),
	assignedTo: int(),
	assignedToName: varchar({ length: 255 }),
	categoryId: int(),
	slaDeadline: timestamp({ mode: 'string' }),
	firstResponseAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	closedAt: timestamp({ mode: 'string' }),
},
(table) => [
	unique("tickets_ticketId_unique").on(table.ticketId),
]);

export const trainings = mysqlTable("trainings", {
	id: int().autoincrement().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	url: varchar({ length: 500 }),
	thumbnail: varchar({ length: 1000 }),
	level: mysqlEnum(['basico','intermediario','avancado']).default('basico').notNull(),
	instructor: varchar({ length: 255 }),
	totalDuration: int().default(0).notNull(),
	isMandatory: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userCompanyAssignments = mysqlTable("userCompanyAssignments", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	companyId: int().notNull(),
	departmentId: int(),
	positionId: int(),
	role: mysqlEnum(['colaborador','supervisor','gerente','admin']).default('colaborador').notNull(),
	approvalLevel: int().default(1).notNull(),
	isActive: int().default(1).notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().primaryKey().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','manager']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	department: varchar({ length: 100 }),
	avatar: varchar({ length: 2 }),
	passwordHash: text(),
	profileImage: varchar({ length: 2048 }),
},
(table) => [
	unique("users_openId_unique").on(table.openId),
	unique("users_email_unique").on(table.email),
]);


export const ticketComments = mysqlTable("ticket_comments", {
	id: int().autoincrement().primaryKey().notNull(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	comment: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const ticketAttachments = mysqlTable("ticket_attachments", {
	id: int().autoincrement().primaryKey().notNull(),
	ticketId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: varchar({ length: 500 }).notNull(),
	fileSize: int().default(0).notNull(),
	fileType: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const faqs = mysqlTable("faqs", {
	id: int().autoincrement().primaryKey().notNull(),
	question: varchar({ length: 500 }).notNull(),
	answer: text().notNull(),
	category: varchar({ length: 100 }),
	views: int().default(0).notNull(),
	useful: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const reports = mysqlTable("reports", {
	id: int().autoincrement().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	type: mysqlEnum(['tickets','users','departments','training','custom']).default('custom').notNull(),
	createdBy: int().notNull(),
	companyId: int(),
	filters: text(),
	data: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const userPreferences = mysqlTable("user_preferences", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	theme: mysqlEnum(['light','dark']).default('dark').notNull(),
	language: varchar({ length: 10 }).default('pt-BR').notNull(),
	notificationsEnabled: int().default(1).notNull(),
	emailNotifications: int().default(1).notNull(),
	twoFactorEnabled: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
	id: int().autoincrement().primaryKey().notNull(),
	userId: int().notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	unique("password_reset_tokens_token_unique").on(table.token),
]);

// ============================================================
// ITAM - Gerenciamento de Ativos de TI
// ============================================================
export const ativos = mysqlTable("ativos", {
	id: int().autoincrement().primaryKey().notNull(),
	serial: varchar({ length: 100 }).notNull(),
	nome: varchar({ length: 200 }).notNull(),
	tipo: mysqlEnum(['notebook','smartphone','tablet','monitor','licenca','outros']).notNull(),
	departamentoId: int().default(sql`NULL`),
	usuarioId: int().default(sql`NULL`),
	status: mysqlEnum(['disponivel','alocado','manutencao','descartado']).default('disponivel').notNull(),
	custo: decimal({ precision: 10, scale: 2 }).default(sql`NULL`),
	dataAquisicao: date().default(sql`NULL`),
	descricao: text().default(sql`NULL`),
	fabricante: varchar({ length: 100 }).default(sql`NULL`),
	modelo: varchar({ length: 100 }).default(sql`NULL`),
	garantiaAte: date().default(sql`NULL`),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	unique("ativos_serial_unique").on(table.serial),
]);

// ============================================================
// Gerenciador de Arquivos/Documentos
// ============================================================
export const arquivos = mysqlTable("arquivos", {
	id: int().autoincrement().primaryKey().notNull(),
	nome: varchar({ length: 255 }).notNull(),
	nomeOriginal: varchar({ length: 255 }).notNull(),
	caminho: varchar({ length: 500 }).notNull(),
	tipo: mysqlEnum(['documento','imagem','video','outro']).default('documento').notNull(),
	mimeType: varchar({ length: 100 }).default(sql`NULL`),
	tamanho: int().default(0).notNull(),
	chamadoId: int().default(sql`NULL`),
	ativoId: int().default(sql`NULL`),
	usuarioId: int().notNull(),
	departamentoId: int().default(sql`NULL`),
	descricao: text().default(sql`NULL`),
	tags: varchar({ length: 500 }).default(sql`NULL`),
	uploadedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// RBAC - Controle de Permissões por Recurso
// ============================================================
export const permissoes = mysqlTable("permissoes", {
	id: int().autoincrement().primaryKey().notNull(),
	usuarioId: int().notNull(),
	recursoId: int().notNull(),
	recursoTipo: mysqlEnum(['departamento','chamado','ativo','arquivo']).notNull(),
	permissao: mysqlEnum(['ler','escrever','gerenciar','admin']).notNull(),
	concedidoPor: int().default(sql`NULL`),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Módulo Estacionamento RH ─────────────────────────────────────────────────

export const ticketsEstacionamento = mysqlTable("tickets_estacionamento", {
	id: int().autoincrement().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	valor: decimal({ precision: 8, scale: 2 }).default(sql`NULL`),
	duracaoHoras: int().default(sql`NULL`),
	dataValidade: timestamp({ mode: 'string' }).default(sql`NULL`),
	status: mysqlEnum(['disponivel','alocado','usado','expirado']).default('disponivel').notNull(),
	criadoPor: int().default(sql`NULL`),
	criadoEm: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	unique("tickets_estacionamento_codigo_unique").on(table.codigo),
]);

export const solicitacoesTicket = mysqlTable("solicitacoes_ticket", {
	id: int().autoincrement().primaryKey().notNull(),
	usuarioId: int().default(sql`NULL`),
	ticketId: int().default(sql`NULL`),
	duracaoSolicitada: int().default(sql`NULL`),
	valorPago: decimal({ precision: 8, scale: 2 }).default(sql`NULL`),
	qrcodeData: text().default(sql`NULL`),
	dataSolicitacao: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	status: mysqlEnum(['solicitado','aprovado','usado','cancelado']).default('solicitado').notNull(),
});

// ─── Módulo Treinamentos Corporativos ───────────────────────────────────────

export const trainingLessons = mysqlTable("training_lessons", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	videoUrl: varchar({ length: 1000 }),
	duration: int().default(0).notNull(),
	orderIndex: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trainingProgress = mysqlTable("training_progress", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	lessonId: int().notNull(),
	userId: int().notNull(),
	watched: int().default(0).notNull(),
	watchedAt: timestamp({ mode: 'string' }),
});

export const trainingCompletions = mysqlTable("training_completions", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	userId: int().notNull(),
	quizScore: int().default(0).notNull(),
	quizPassed: int().default(0).notNull(),
	completedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trainingRatings = mysqlTable("training_ratings", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	userId: int().notNull(),
	stars: int().default(0).notNull(),
	liked: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trainingComments = mysqlTable("training_comments", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	userId: int().notNull(),
	comment: text().notNull(),
	isModerated: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trainingQuizzes = mysqlTable("training_quizzes", {
	id: int().autoincrement().primaryKey().notNull(),
	trainingId: int().notNull(),
	minScore: int().default(70).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const trainingQuizQuestions = mysqlTable("training_quiz_questions", {
	id: int().autoincrement().primaryKey().notNull(),
	quizId: int().notNull(),
	question: text().notNull(),
	options: text().notNull(),
	correctIndex: int().notNull(),
	orderIndex: int().default(0).notNull(),
});

// ─── Categorias de Chamados ─────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
	id: int().autoincrement().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	color: varchar({ length: 20 }).default('#6366f1'),
	icon: varchar({ length: 50 }).default('tag'),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Regras de SLA ───────────────────────────────────────────────────────────
export const slaRules = mysqlTable("sla_rules", {
	id: int().autoincrement().primaryKey().notNull(),
	priority: mysqlEnum(['baixa','media','alta','critica']).notNull(),
	responseTimeHours: int().notNull(),
	resolutionTimeHours: int().notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Histórico de Tickets ────────────────────────────────────────────────────
export const ticketHistory = mysqlTable("ticket_history", {
	id: int().autoincrement().primaryKey().notNull(),
	ticketId: int().notNull(),
	userId: int().notNull(),
	userName: varchar({ length: 255 }),
	action: varchar({ length: 100 }).notNull(),
	oldValue: text(),
	newValue: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const logUsoTickets = mysqlTable("log_uso_tickets", {
	id: int().autoincrement().primaryKey().notNull(),
	solicitacaoId: int().default(sql`NULL`),
	horaEntrada: timestamp({ mode: 'string' }).default(sql`NULL`),
	horaSaida: timestamp({ mode: 'string' }).default(sql`NULL`),
	tempoRealUsado: int().default(sql`NULL`),
});

// ─── Módulo Requisições Unificadas (Management) ───────────────────────────────────

export const requests = mysqlTable("requests", {
	id: int().autoincrement().primaryKey().notNull(),
	requestId: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 500 }).notNull(),
	description: text(),
	type: mysqlEnum(['ticket','request','occurrence']).default('ticket').notNull(),
	status: mysqlEnum(['aberto','em_andamento','aguardando_usuario','resolvido','fechado','em_analise','aguardando_aprovacao','aprovado','rejeitado','cancelado']).default('aberto').notNull(),
	priority: mysqlEnum(['baixa','media','alta','critica']).default('media').notNull(),
	category: varchar({ length: 255 }),
	userId: int(),
	userName: varchar({ length: 255 }),
	assignedToId: int(),
	assignedToName: varchar({ length: 255 }),
	departmentId: int(),
	companyId: int(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	closedAt: timestamp({ mode: 'string' }),
	dueDate: timestamp({ mode: 'string' }),
});

export const approvals = mysqlTable("approvals", {
	id: int().autoincrement().primaryKey().notNull(),
	requestId: int().notNull(),
	approverId: int(),
	status: mysqlEnum(['pendente','aprovado','rejeitado']).default('pendente').notNull(),
	level: int().default(1).notNull(),
	comment: text(),
	decidedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ─── Tipos inferidos para Insert/Select ──────────────────────────────────────────────
export type InsertUser = InferInsertModel<typeof users>;
export type SelectUser = InferSelectModel<typeof users>;
export type User = SelectUser;
export type InsertTicket = InferInsertModel<typeof tickets>;
export type SelectTicket = InferSelectModel<typeof tickets>;
export type InsertNotification = InferInsertModel<typeof notifications>;
export type SelectNotification = InferSelectModel<typeof notifications>;
export type InsertCompany = InferInsertModel<typeof companies>;
export type SelectCompany = InferSelectModel<typeof companies>;
export type InsertDepartment = InferInsertModel<typeof departments>;
export type SelectDepartment = InferSelectModel<typeof departments>;
export type InsertPosition = InferInsertModel<typeof positions>;
export type SelectPosition = InferSelectModel<typeof positions>;
export type InsertUserCompanyAssignment = InferInsertModel<typeof userCompanyAssignments>;
export type SelectUserCompanyAssignment = InferSelectModel<typeof userCompanyAssignments>;
export type InsertDocument = InferInsertModel<typeof documents>;
export type InsertTicketComment = InferInsertModel<typeof ticketComments>;
export type InsertTicketAttachment = InferInsertModel<typeof ticketAttachments>;
export type InsertFaq = InferInsertModel<typeof faqs>;
export type InsertReport = InferInsertModel<typeof reports>;
export type InsertUserPreference = InferInsertModel<typeof userPreferences>;
export type InsertPasswordResetToken = InferInsertModel<typeof passwordResetTokens>;
export type InsertRequest = InferInsertModel<typeof requests>;
export type SelectRequest = InferSelectModel<typeof requests>;
export type InsertApproval = InferInsertModel<typeof approvals>;
export type SelectApproval = InferSelectModel<typeof approvals>;
