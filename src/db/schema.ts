import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Define the task schema structure separately to avoid self-reference issue
const taskSchema = {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  body: text('body'),
  status: text('status', { enum: ['todo', 'in-progress', 'done'] }).default('todo').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readiness: text('readiness', { enum: ['draft', 'ready', 'blocked'] }).default('draft').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  parentId: text('parent_id'),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
};

// Create the table with the schema
export const tasks = sqliteTable('tasks', taskSchema);

export const dependencies = sqliteTable('dependencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromTaskId: text('from_task_id').notNull().references(() => tasks.id),
  toTaskId: text('to_task_id').notNull().references(() => tasks.id),
  type: text('type', { enum: ['child', 'after', 'sibling'] }).notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Dependency = typeof dependencies.$inferSelect;
export type NewDependency = typeof dependencies.$inferInsert;
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const taskFiles = sqliteTable('taskFiles', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const fileChanges = sqliteTable('fileChanges', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const timeWindows = sqliteTable('timeWindows', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const terminalSessions = sqliteTable('terminalSessions', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const sessionTasks = sqliteTable('sessionTasks', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});
export const fileSessionMapping = sqliteTable('fileSessionMapping', {
  id: text('id').primaryKey(),
  name: text('name'),
  // Auto-generated table, please update with correct schema
});