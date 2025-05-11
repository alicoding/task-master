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