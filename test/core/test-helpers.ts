/**
 * Test helpers for Task Master tests
 * Provides common utilities for testing
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../../db/schema';
import { BaseTaskRepository } from '../../core/repository/base';
import { TaskRepository } from '../../core/repo';
import { RepositoryFactory } from '../../core/repository/factory';
import {
  TaskInsertOptions,
  TaskError,
  TaskErrorCode,
  TaskStatus,
  TaskReadiness,
  Task
} from '../../core/types';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

/**
 * Helper function to create an in-memory database with schema
 * @returns Database connection
 */
export function createTestDatabase() {
  // Create in-memory SQLite database
  const sqlite = new Database(':memory:');
  
  // Create Drizzle instance
  // Do not include schema-extensions.ts which contains file tracking tables
  const db = drizzle(sqlite, { schema: {
    tasks: schema.tasks,
    dependencies: schema.dependencies
  }});
  
  // Run migrations from memory
  // Note: For actual tests, we're not using migrations but directly creating tables
  
  // Create tasks table with correct schema matching db/schema.ts
  sqlite.exec(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      readiness TEXT NOT NULL DEFAULT 'draft',
      tags TEXT DEFAULT '[]',
      parent_id TEXT,
      metadata TEXT DEFAULT '{}'
    );
  `);

  // Create dependencies table
  sqlite.exec(`
    CREATE TABLE dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task_id TEXT NOT NULL,
      to_task_id TEXT NOT NULL,
      type TEXT NOT NULL
    );
  `);
  
  return { db, sqlite };
}

/**
 * Create a test repository for use in tests
 * @returns TaskRepository instance with in-memory database
 */
export function createTestRepository(): TaskRepository {
  // Use the TaskRepository constructor with in-memory flag
  // This ensures the database schema is correct by leveraging db/init.ts
  return new TaskRepository('./test.db', true, true);
}

/**
 * Create a set of sample tasks in the repository
 * @param repo Repository to populate
 * @returns List of created task IDs
 */
export async function createSampleTasks(repo: TaskRepository): Promise<string[]> {
  const taskIds: string[] = [];

  // Set testing environment
  process.env.NODE_ENV = 'test';

  // Create sample tasks with different statuses, readiness, and tags
  const task1Result = await repo.createTask({
    title: 'Task 1',
    description: 'This is the first task',
    body: 'Task 1 details go here',
    status: 'todo',
    readiness: 'ready',
    tags: ['important', 'project-a']
  });

  if (task1Result.success && task1Result.data) {
    taskIds.push(task1Result.data.id);

    const task2Result = await repo.createTask({
      title: 'Task 2',
      description: 'This is the second task',
      body: 'Task 2 details go here',
      status: 'in-progress',
      readiness: 'ready',
      tags: ['urgent', 'project-a']
    });

    if (task2Result.success && task2Result.data) {
      taskIds.push(task2Result.data.id);

      const task3Result = await repo.createTask({
        title: 'Task 3',
        description: 'This is the third task',
        body: 'Task 3 details go here',
        status: 'done',
        readiness: 'ready',
        tags: ['important', 'project-b']
      });

      if (task3Result.success && task3Result.data) {
        taskIds.push(task3Result.data.id);

        // Create a child task
        const task4Result = await repo.createTask({
          title: 'Task 4',
          description: 'This is a child task',
          body: 'Task 4 details go here',
          status: 'todo',
          readiness: 'draft',
          tags: ['project-b'],
          childOf: task1Result.data.id
        });

        if (task4Result.success && task4Result.data) {
          taskIds.push(task4Result.data.id);
        }
      }
    }
  }
  
  return taskIds;
}

/**
 * Verify that an error is of the TaskError type with the expected code
 * @param error Error to check
 * @param expectedCode Expected error code
 * @returns True if the error matches the expected code
 */
export function isTaskError(error: unknown, expectedCode: TaskErrorCode): boolean {
  return (
    error instanceof TaskError &&
    error.code === expectedCode
  );
}

/**
 * Generate a random task title
 * @returns Random task title
 */
export function randomTaskTitle(): string {
  return `Test Task ${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a random task status
 * @returns Random task status
 */
export function randomTaskStatus(): TaskStatus {
  const statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

/**
 * Generate a random task readiness
 * @returns Random task readiness
 */
export function randomTaskReadiness(): TaskReadiness {
  const readiness: TaskReadiness[] = ['draft', 'ready', 'blocked'];
  return readiness[Math.floor(Math.random() * readiness.length)];
}

/**
 * Generate a random task options object
 * @returns Random task options
 */
export function randomTaskOptions(): TaskInsertOptions {
  return {
    title: randomTaskTitle(),
    description: `Description for ${randomTaskTitle()}`,
    body: `Body for ${randomTaskTitle()}`,
    status: randomTaskStatus(),
    readiness: randomTaskReadiness(),
    tags: ['test', `tag-${Math.floor(Math.random() * 100)}`],
    metadata: {
      priority: Math.floor(Math.random() * 5) + 1,
      notes: `Random notes ${Math.random()}`
    }
  };
}

/**
 * Generate a test task with given properties or random ones
 * @param options Partial task properties to override
 * @returns A task object for testing
 */
export function generateTestTask(options: Partial<Task> = {}): Task {
  return {
    id: options.id || `test-${Math.floor(Math.random() * 10000)}`,
    title: options.title || randomTaskTitle(),
    status: options.status || randomTaskStatus(),
    readiness: options.readiness || randomTaskReadiness(),
    tags: options.tags || `test,tag-${Math.floor(Math.random() * 100)}`,
    metadata: options.metadata || JSON.stringify({
      priority: Math.floor(Math.random() * 5) + 1,
      notes: `Random notes ${Math.random()}`
    }),
    created_at: options.created_at || Math.floor(Date.now() / 1000),
    updated_at: options.updated_at || Math.floor(Date.now() / 1000),
    parent_id: options.parent_id || null
  };
}

// RepositoryFactory.setTestConnection is now properly implemented in the factory class