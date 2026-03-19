CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp DEFAULT 'NULL',
	`createdAt` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
