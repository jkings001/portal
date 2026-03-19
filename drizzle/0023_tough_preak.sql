ALTER TABLE `documents` ADD `fileKey` varchar(500);--> statement-breakpoint
ALTER TABLE `documents` ADD `fileName` varchar(255);--> statement-breakpoint
ALTER TABLE `documents` ADD `fileSize` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `mimeType` varchar(100);