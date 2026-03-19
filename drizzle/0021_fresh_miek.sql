CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`approverId` int,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`level` int NOT NULL DEFAULT 1,
	`comment` text,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(50) NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`type` enum('ticket','request','occurrence') NOT NULL DEFAULT 'ticket',
	`status` enum('aberto','em_andamento','aguardando_usuario','resolvido','fechado','em_analise','aguardando_aprovacao','aprovado','rejeitado','cancelado') NOT NULL DEFAULT 'aberto',
	`priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`category` varchar(255),
	`userId` int,
	`userName` varchar(255),
	`assignedToId` int,
	`assignedToName` varchar(255),
	`departmentId` int,
	`companyId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	`dueDate` timestamp,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
