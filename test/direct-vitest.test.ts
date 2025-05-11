/**
 * Direct Vitest Test
 *
 * This is a simple test to verify that the basic Vitest setup works correctly
 * without using the adapter.
 */

// Set NODE_OPTIONS for proper module resolution
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';

import { describe, it, expect } from 'vitest';
import { createTestRepository } from './core/test-helpers.ts';

describe('TaskRepository Basic Test', () => {
  it('creates a task successfully', async () => {
    // Create repo with in-memory DB for testing with proper schema
    const repo = createTestRepository();
    
    // Create a simple task
    const task = await repo.createTask({
      title: 'Test Task',
      status: 'todo',
      tags: ['test']
    });
    
    // Verify task result was returned
    expect(task).toBeTruthy();
    expect(task.success).toBe(true);
    expect(task.data).toBeTruthy();

    // Check task properties
    if (task.data) {
      expect(task.data.id).toBe('1');
      expect(task.data.title).toBe('Test Task');
      expect(task.data.status).toBe('todo');
    }
    
    // Clean up
    repo.close();
  });
});