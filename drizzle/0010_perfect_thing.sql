CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`question` varchar(500) NOT NULL,
	`answer` text NOT NULL,
	`category` varchar(100) DEFAULT 'NULL',
	`views` int NOT NULL DEFAULT 0,
	`useful` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text DEFAULT ('NULL'),
	`type` enum('tickets','users','departments','training','custom') NOT NULL DEFAULT '''custom''',
	`createdBy` int NOT NULL,
	`companyId` int DEFAULT 'NULL',
	`filters` text DEFAULT ('NULL'),
	`data` text DEFAULT ('NULL'),
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `ticket_attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int NOT NULL DEFAULT 0,
	`fileType` varchar(50) DEFAULT 'NULL',
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `ticket_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark') NOT NULL DEFAULT '''dark''',
	`language` varchar(10) NOT NULL DEFAULT '''pt-BR''',
	`notificationsEnabled` int NOT NULL DEFAULT 1,
	`emailNotifications` int NOT NULL DEFAULT 1,
	`twoFactorEnabled` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()',
	`updatedAt` timestamp NOT NULL DEFAULT 'current_timestamp()'
);
