/**
 * Database schema extensions for Task-Code relationship tracking
 * Implements the schema changes needed for Task 17.3: Database Extensions
 *
 * Also includes terminal session tracking for Task 17.7: Terminal Integration
 */

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
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

/**
 * Terminal Sessions Table
 * This table tracks terminal sessions and their properties
 */
export const terminalSessions = sqliteTable('terminal_sessions', {
  id: text('id').primaryKey(),
  tty: text('tty'),
  pid: integer('pid'),
  ppid: integer('ppid'),
  windowColumns: integer('window_columns'),
  windowRows: integer('window_rows'),
  user: text('user'),
  shell: text('shell'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastActive: integer('last_active', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  status: text('status', { enum: ['active', 'inactive', 'disconnected'] }).default('active'),
  currentTaskId: text('current_task_id').references(() => tasks.id),
  connectionCount: integer('connection_count').default(1),
  lastDisconnect: integer('last_disconnect', { mode: 'timestamp' }),
  // Session recovery related fields
  recoveryCount: integer('recovery_count').default(0),
  lastRecovery: integer('last_recovery', { mode: 'timestamp' }),
  recoverySource: text('recovery_source'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
});

/**
 * Session Tasks Table
 * This table tracks which tasks are used in which terminal sessions
 */
export const sessionTasks = sqliteTable('session_tasks', {
  sessionId: text('session_id').notNull().references(() => terminalSessions.id),
  taskId: text('task_id').notNull().references(() => tasks.id),
  accessTime: integer('access_time', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.sessionId, table.taskId] }),
  };
});

/**
 * File Session Mapping Table
 * This table tracks which files are modified in which terminal sessions
 */
export const fileSessionMapping = sqliteTable('file_session_mapping', {
  fileId: integer('file_id').notNull().references(() => files.id),
  sessionId: text('session_id').notNull().references(() => terminalSessions.id),
  firstSeen: integer('first_seen', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastModified: integer('last_modified', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.fileId, table.sessionId] }),
  };
});

/**
 * Time Windows Table
 * This table groups activities into logical time ranges
 */
export const timeWindows = sqliteTable('time_windows', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => terminalSessions.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  name: text('name'),
  type: text('type'),
  status: text('status').default('active'),
  metadata: text('metadata', { mode: 'json' }).default('{}')
});

/**
 * Retroactive Assignments Table
 * This table tracks retroactive task assignments
 */
export const retroactiveAssignments = sqliteTable('retroactive_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull().references(() => terminalSessions.id),
  taskId: text('task_id').notNull().references(() => tasks.id),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  effectiveTime: integer('effective_time', { mode: 'timestamp' }).notNull(),
  assignedBy: text('assigned_by'),
  reason: text('reason'),
  metadata: text('metadata', { mode: 'json' }).default('{}')
});

// Export inferred types
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
export type TaskFile = typeof taskFiles.$inferSelect;
export type NewTaskFile = typeof taskFiles.$inferInsert;
export type FileChange = typeof fileChanges.$inferSelect;
export type NewFileChange = typeof fileChanges.$inferInsert;
export type TerminalSession = typeof terminalSessions.$inferSelect;
export type NewTerminalSession = typeof terminalSessions.$inferInsert;
export type SessionTask = typeof sessionTasks.$inferSelect;
export type NewSessionTask = typeof sessionTasks.$inferInsert;
export type FileSessionMap = typeof fileSessionMapping.$inferSelect;
export type NewFileSessionMap = typeof fileSessionMapping.$inferInsert;
export type TimeWindow = typeof timeWindows.$inferSelect;
export type NewTimeWindow = typeof timeWindows.$inferInsert;
export type RetroactiveAssignment = typeof retroactiveAssignments.$inferSelect;
export type NewRetroactiveAssignment = typeof retroactiveAssignments.$inferInsert;