CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`color` varchar(20) DEFAULT '#6366f1',
	`icon` varchar(50) DEFAULT 'tag',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sla_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`priority` enum('baixa','media','alta','critica') NOT NULL,
	`responseTimeHours` int NOT NULL,
	`resolutionTimeHours` int NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sla_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`action` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `tickets` ADD `slaDeadline` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `firstResponseAt` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `closedAt` timestamp;