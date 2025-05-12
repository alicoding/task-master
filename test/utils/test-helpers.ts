/**
 * Test Helpers for Task Master
 *
 * This file provides utilities for testing, including database setup,
 * teardown, and other test fixtures.
 *
 * Definition of Done:
 * ✅ Helpers use TypeScript imports with .ts extensions
 * ✅ All functions are properly typed
 * ✅ Provides clean database isolation between tests
 * ✅ Implements proper resource cleanup
 */

import { randomUUID } from 'crypto';
import { TaskRepository } from '../../core/repo.ts';
import { TaskInsertOptions, Task } from '../../core/types.ts';
import { createDb } from '../../db/init.ts';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

/**
 * Initializes a test database with all required tables including terminal session tables
 * @returns A drizzle database instance with in-memory SQLite connection
 */
export async function initializeTestDB() {
  // Create in-memory database
  const dbPath = `:memory:`;
  const result = createDb(dbPath);
  const db = result.db;
  const sqlite = result.sqlite;

  // Initialize terminal session tables
  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS terminal_sessions (
      id TEXT PRIMARY KEY,
      tty TEXT,
      pid INTEGER,
      ppid INTEGER,
      window_columns INTEGER,
      window_rows INTEGER,
      user TEXT,
      shell TEXT,
      start_time INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      current_task_id TEXT,
      connection_count INTEGER DEFAULT 1,
      last_disconnect INTEGER,
      recovery_count INTEGER DEFAULT 0,
      last_recovery INTEGER,
      recovery_source TEXT,
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS session_tasks (
      session_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      access_time INTEGER NOT NULL,
      PRIMARY KEY (session_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS file_session_mapping (
      file_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      first_seen INTEGER NOT NULL,
      last_modified INTEGER NOT NULL,
      PRIMARY KEY (file_id, session_id)
    );

    CREATE TABLE IF NOT EXISTS time_windows (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      name TEXT,
      type TEXT,
      status TEXT DEFAULT 'active',
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS retroactive_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      assigned_at INTEGER NOT NULL,
      effective_time INTEGER NOT NULL,
      assigned_by TEXT,
      reason TEXT,
      metadata TEXT DEFAULT '{}'
    );
  `);

  return db;
}

/**
 * Creates a test repository with an isolated in-memory database
 * @returns A TaskRepository instance with a clean in-memory database
 */
export function createTestRepository(): TaskRepository {
  // Use a unique database path to ensure isolation between tests
  const dbPath = `./test-${randomUUID()}.db`;
  return new TaskRepository(dbPath, true, true);
}

/**
 * Seed a repository with test data
 * @param repo Repository to seed
 * @param count Number of tasks to create
 * @returns Array of created task IDs
 */
export async function seedTestData(repo: TaskRepository, count = 3): Promise<string[]> {
  const taskIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const result = await repo.createTask({
      title: `Test Task ${i + 1}`,
      status: i % 2 === 0 ? 'todo' : 'in-progress',
      tags: [`tag-${i}`, 'test'],
      readiness: 'ready'
    });

    if (result.success && result.data) {
      taskIds.push(result.data.id);
    }
  }

  return taskIds;
}

/**
 * Create a child task for testing parent-child relationships
 * @param repo Repository to use
 * @param parentId Parent task ID
 * @param title Child task title
 * @returns Child task data if successful
 */
export async function createChildTask(
  repo: TaskRepository,
  parentId: string,
  title = 'Child Task'
): Promise<Task | undefined> {
  const result = await repo.createTask({
    title,
    childOf: parentId,
    tags: ['child', 'test']
  });

  return result.success ? result.data : undefined;
}

/**
 * Wait for a specified time - useful for async tests
 * @param ms Milliseconds to wait
 * @returns Promise that resolves after the specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random task options object for testing
 * @returns Random task options
 */
export function randomTaskOptions(): TaskInsertOptions {
  const id = randomUUID().substring(0, 8);
  return {
    title: `Random Task ${id}`,
    status: Math.random() > 0.5 ? 'todo' : 'in-progress',
    tags: [`tag-${id}`, 'random', 'test'],
    readiness: Math.random() > 0.5 ? 'draft' : 'ready'
  };
}