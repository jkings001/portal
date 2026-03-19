ALTER TABLE `companies` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `departments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `documents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `positions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tickets` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `trainings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `email` varchar(255) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `phone` varchar(20) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `address` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `city` varchar(100) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `state` varchar(2) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `zipCode` varchar(10) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `status` enum('ativa','inativa','suspensa') NOT NULL DEFAULT '''ativa''';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `description` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `manager` varchar(255) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `responsibleUserId` int DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `departments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `description` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `category` varchar(100) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `fileUrl` varchar(500) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `message` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('ticket','system','alert','info') NOT NULL DEFAULT '''info''';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `ticketId` int DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `read` int NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `read` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `description` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `positions` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `description` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `userName` varchar(255) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `department` varchar(100) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `status` enum('pendente','em_andamento','resolvido','fechado') NOT NULL DEFAULT '''pendente''';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `priority` enum('baixa','media','alta','critica') NOT NULL DEFAULT '''media''';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `assignedTo` int DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `assignedToName` varchar(255) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `tickets` MODIFY COLUMN `resolvedAt` timestamp DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `description` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `category` varchar(100) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `url` varchar(500) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `trainings` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `departmentId` int DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `positionId` int DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `role` enum('colaborador','supervisor','gerente','admin') NOT NULL DEFAULT '''colaborador''';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `isActive` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `startDate` timestamp DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `endDate` timestamp DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `passwordHash` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager') NOT NULL DEFAULT '''user''';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `department` varchar(100) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `avatar` varchar(2) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `profileImage` varchar(500) DEFAULT 'NULL';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'current_timestamp()';