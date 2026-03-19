ALTER TABLE `arquivos` MODIFY COLUMN `uploadedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `arquivos` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ativos` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ativos` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `email` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `address` text;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `city` varchar(100);--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `state` varchar(2);--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `zipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `status` enum('ativa','inativa','suspensa') NOT NULL DEFAULT 'ativa';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `manager` varchar(255);--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `responsibleUserId` int;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `category` varchar(100);--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `fileUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `faqs` MODIFY COLUMN `category` varchar(100);--> statement-breakpoint
ALTER TABLE `faqs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `faqs` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `message` text;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('ticket','system','alert','info') NOT NULL DEFAULT 'info';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `ticketId` int;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` MODIFY COLUMN `usedAt` timestamp;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `permissoes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `permissoes` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `type` enum('tickets','users','departments','training','custom') NOT NULL DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `companyId` int;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `filters` text;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `data` text;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `reports` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `solicitacoes_ticket` MODIFY COLUMN `dataSolicitacao` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ticket_attachments` MODIFY COLUMN `fileType` varchar(50);--> statement-breakpoint
ALTER TABLE `ticket_attachments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ticket_comments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ticket_comments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `userName` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `department` varchar(100);--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `status` enum('pendente','em_andamento','resolvido','fechado') NOT NULL DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT 'media';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `assignedTo` int;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `assignedToName` varchar(255);--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `resolvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `tickets_estacionamento` MODIFY COLUMN `criadoEm` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `description` text;--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `category` varchar(100);--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `url` varchar(500);--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `departmentId` int;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `positionId` int;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `role` enum('colaborador','supervisor','gerente','admin') NOT NULL DEFAULT 'colaborador';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `startDate` timestamp;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `endDate` timestamp;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_preferences` MODIFY COLUMN `theme` enum('light','dark') NOT NULL DEFAULT 'dark';--> statement-breakpoint
ALTER TABLE `user_preferences` MODIFY COLUMN `language` varchar(10) NOT NULL DEFAULT 'pt-BR';--> statement-breakpoint
ALTER TABLE `user_preferences` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `user_preferences` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `department` varchar(100);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `avatar` varchar(2);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `profileImage` varchar(500);