-- Migration for Task 17.3: Database Extensions for tracking file changes
-- Creates tables for files, task-file relationships, and file change history

-- Create files table
CREATE TABLE IF NOT EXISTS `files` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `path` text NOT NULL,
  `hash` text NOT NULL,
  `last_modified` integer NOT NULL,
  `created_at` integer NOT NULL,
  `file_type` text,
  `metadata` text DEFAULT '{}'
);
--> statement-breakpoint

-- Create task_files table for many-to-many relationships
CREATE TABLE IF NOT EXISTS `task_files` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `task_id` text NOT NULL,
  `file_id` integer NOT NULL,
  `relationship_type` text DEFAULT 'related' NOT NULL,
  `confidence` integer DEFAULT 100,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  `metadata` text DEFAULT '{}',
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Create file_changes table for tracking change history
CREATE TABLE IF NOT EXISTS `file_changes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `file_id` integer NOT NULL,
  `task_id` text,
  `change_type` text NOT NULL,
  `timestamp` integer NOT NULL,
  `previous_hash` text,
  `current_hash` text,
  `metadata` text DEFAULT '{}',
  FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

-- Create unique index on file path to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS `idx_files_path` ON `files` (`path`);
--> statement-breakpoint

-- Create index for faster task-file lookups
CREATE INDEX IF NOT EXISTS `idx_task_files_task_id` ON `task_files` (`task_id`);
CREATE INDEX IF NOT EXISTS `idx_task_files_file_id` ON `task_files` (`file_id`);
--> statement-breakpoint

-- Create index for faster file change lookups
CREATE INDEX IF NOT EXISTS `idx_file_changes_file_id` ON `file_changes` (`file_id`);
CREATE INDEX IF NOT EXISTS `idx_file_changes_task_id` ON `file_changes` (`task_id`);