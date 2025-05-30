CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` integer NOT NULL,
	`username` text,
	`can_upload` text DEFAULT 'no',
	`created_at` text DEFAULT '2025-05-30T02:45:38.985Z'
);
--> statement-breakpoint
CREATE TABLE `zoom_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`zoom_url` text NOT NULL,
	`passcode` text NOT NULL,
	`file_path` text,
	`file_id` text,
	`uploaded_by` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT '2025-05-30T02:45:38.986Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);