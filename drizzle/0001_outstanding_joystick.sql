CREATE TABLE `academy_activity_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`event_name` text NOT NULL,
	`module_id` text,
	`activity_id` text,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_activity_events_user_occurred_idx` ON `academy_activity_events` (`user_email`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `academy_activity_events_event_idx` ON `academy_activity_events` (`event_name`);--> statement-breakpoint
CREATE TABLE `academy_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`module_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`attempt_type` text NOT NULL,
	`score` integer,
	`result` text DEFAULT 'submitted' NOT NULL,
	`response_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `academy_attempts_user_module_idx` ON `academy_attempts` (`user_email`,`module_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `academy_module_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`module_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`current_step` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lab_passed` integer DEFAULT 0 NOT NULL,
	`artifact_saved` integer DEFAULT 0 NOT NULL,
	`commitment_status` text DEFAULT 'not_started' NOT NULL,
	`commitment_due_at` text,
	`completed_at` text,
	`last_activity_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_module_progress_user_module_idx` ON `academy_module_progress` (`user_email`,`module_id`);--> statement-breakpoint
CREATE INDEX `academy_module_progress_user_activity_idx` ON `academy_module_progress` (`user_email`,`last_activity_at`);--> statement-breakpoint
CREATE TABLE `academy_outcomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`module_id` text NOT NULL,
	`commitment_text` text NOT NULL,
	`due_at` text,
	`status` text DEFAULT 'open' NOT NULL,
	`baseline_minutes` integer,
	`after_minutes` integer,
	`confidence_before` integer,
	`confidence_after` integer,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_outcomes_user_module_idx` ON `academy_outcomes` (`user_email`,`module_id`);--> statement-breakpoint
CREATE INDEX `academy_outcomes_due_idx` ON `academy_outcomes` (`status`,`due_at`);--> statement-breakpoint
CREATE TABLE `academy_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`consent_status` text DEFAULT 'unknown' NOT NULL,
	`onboarding_json` text DEFAULT '{}' NOT NULL,
	`first_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `academy_users_user_email_unique` ON `academy_users` (`user_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `academy_users_email_idx` ON `academy_users` (`user_email`);
