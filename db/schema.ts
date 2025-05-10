import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  status: text('status', { enum: ['todo', 'in-progress', 'done'] }).default('todo').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readiness: text('readiness', { enum: ['draft', 'ready', 'blocked'] }).default('draft').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  parentId: text('parent_id').references(() => tasks.id),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
});

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