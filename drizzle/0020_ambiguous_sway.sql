CREATE TABLE `document_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`readAt` timestamp,
	`status` enum('pending','read','acknowledged') NOT NULL DEFAULT 'pending',
	CONSTRAINT `document_assignments_id` PRIMARY KEY(`id`)
);
