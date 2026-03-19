CREATE TABLE `training_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`isModerated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`userId` int NOT NULL,
	`quizScore` int NOT NULL DEFAULT 0,
	`quizPassed` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` varchar(1000),
	`duration` int NOT NULL DEFAULT 0,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`lessonId` int NOT NULL,
	`userId` int NOT NULL,
	`watched` int NOT NULL DEFAULT 0,
	`watchedAt` timestamp,
	CONSTRAINT `training_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`correctIndex` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	CONSTRAINT `training_quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`minScore` int NOT NULL DEFAULT 70,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `training_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`userId` int NOT NULL,
	`stars` int NOT NULL DEFAULT 0,
	`liked` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `training_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `trainings` ADD `thumbnail` varchar(1000);--> statement-breakpoint
ALTER TABLE `trainings` ADD `level` enum('basico','intermediario','avancado') DEFAULT 'basico' NOT NULL;--> statement-breakpoint
ALTER TABLE `trainings` ADD `instructor` varchar(255);--> statement-breakpoint
ALTER TABLE `trainings` ADD `totalDuration` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trainings` ADD `isMandatory` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trainings` ADD `isActive` int DEFAULT 1 NOT NULL;