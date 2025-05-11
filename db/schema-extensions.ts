/**
 * Database schema extensions for Task-Code relationship tracking
 * Implements the schema changes needed for Task 17.3: Database Extensions
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { tasks } from './schema.ts';

/**
 * Table for tracking file changes
 * This table stores information about files that are associated with tasks
 */
export const files = sqliteTable('files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  path: text('path').notNull(), // Absolute or relative path to the file
  hash: text('hash').notNull(), // Hash of the file contents for change detection
  lastModified: integer('last_modified', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  fileType: text('file_type'), // File extension or type (js, ts, md, etc.)
  metadata: text('metadata', { mode: 'json' }).default('{}'), // Additional file metadata
});

/**
 * Table for tracking associations between tasks and files
 * This table maintains the many-to-many relationship between tasks and files
 */
export const taskFiles = sqliteTable('task_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: text('task_id').notNull().references(() => tasks.id),
  fileId: integer('file_id').notNull().references(() => files.id),
  relationshipType: text('relationship_type', { 
    enum: ['implements', 'tests', 'documents', 'related'] 
  }).default('related').notNull(), // Type of relationship
  confidence: integer('confidence').default(100), // Confidence score (0-100) for auto-detected relationships
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  metadata: text('metadata', { mode: 'json' }).default('{}'), // Additional relationship metadata
});

/**
 * Table for tracking file change events
 * This table logs each time a file is changed and associated with a task
 */
export const fileChanges = sqliteTable('file_changes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileId: integer('file_id').notNull().references(() => files.id),
  taskId: text('task_id').references(() => tasks.id), // Can be null if change isn't associated with a task
  changeType: text('change_type', { 
    enum: ['created', 'modified', 'deleted', 'renamed'] 
  }).notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  previousHash: text('previous_hash'), // Hash before the change
  currentHash: text('current_hash'), // Hash after the change
  metadata: text('metadata', { mode: 'json' }).default('{}'), // Additional change metadata
});

// Export inferred types
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type TaskFile = typeof taskFiles.$inferSelect;
export type NewTaskFile = typeof taskFiles.$inferInsert;
export type FileChange = typeof fileChanges.$inferSelect;
export type NewFileChange = typeof fileChanges.$inferInsert;