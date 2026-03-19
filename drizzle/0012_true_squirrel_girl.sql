ALTER TABLE `companies` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `departments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `documents` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `faqs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `notifications` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `positions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `reports` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticket_attachments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `ticket_comments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `tickets` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `trainings` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `userCompanyAssignments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `user_preferences` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `users` ADD PRIMARY KEY(`id`);