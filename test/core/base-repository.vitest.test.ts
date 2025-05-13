/**
 * base-repository.vitest.test.ts - Converted from uvu to Vitest
 * 
 * This file tests the BaseTaskRepository functionality using Vitest.
 */

import { describe, it, expect } from 'vitest';
import { BaseTaskRepository } from '../../core/repository/base';
import { TaskErrorCode } from '../../core/types';

// Helper to create a repository for testing
function createTestRepository(): BaseTaskRepository {
  // Create a repository with an in-memory database
  return new BaseTaskRepository('./test.db', true);
}

describe('BaseTaskRepository', () => {
  it('constructor and close', () => {
    const repo = createTestRepository();
    
    // Check that the repo is properly initialized
    expect(repo._db).toBeTruthy();
    expect(repo._sqlite).toBeTruthy();
    
    // Close the repository
    const closeResult = repo.close();
    expect(closeResult).toBe(true);
  });

  it('getTask with non-existent ID', async () => {
    const repo = createTestRepository();
    
    // Get a non-existent task
    const result = await repo.getTask('non-existent-id');
    
    // Check result properties
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    expect(result.error?.message).toContain('not found');
    
    // Legacy method
    const legacyResult = await repo.getTaskLegacy('non-existent-id');
    expect(legacyResult).toBeUndefined();
    
    repo.close();
  });

  it('getTask with invalid ID', async () => {
    const repo = createTestRepository();
    
    // @ts-ignore - Testing with invalid type
    const result = await repo.getTask(null);
    
    // Check result properties
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    
    repo.close();
  });

  it('getAllTasks with empty database', async () => {
    const repo = createTestRepository();
    
    // Get all tasks
    const result = await repo.getAllTasks();
    
    // Check result properties
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data?.length).toBe(0);
    
    // Test legacy method
    const legacyResult = await repo.getAllTasksLegacy();
    expect(legacyResult.length).toBe(0);
    
    repo.close();
  });

  it('updateTask with invalid ID', async () => {
    const repo = createTestRepository();
    
    // Update with invalid ID
    const updateResult = await repo.updateTask({
      id: 'non-existent-id',
      title: 'Updated Title'
    });
    
    // Check result properties
    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBeTruthy();
    expect(updateResult.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    
    // Try legacy method
    const legacyResult = await repo.updateTaskLegacy({
      id: 'non-existent-id',
      title: 'Updated Title'
    });
    expect(legacyResult).toBeUndefined();
    
    repo.close();
  });

  it('updateTask with invalid status', async () => {
    const repo = createTestRepository();
    
    // Create a task first
    // Note: Since our original methods are now wrapped with error handling, 
    // we need to call a different method on our repo to actually create the task
    // This is hypothetical as we haven't updated the creation methods yet
    
    // Update with invalid status
    const updateResult = await repo.updateTask({
      id: '1', // Hypothetical ID
      // @ts-ignore - intentionally testing invalid status
      status: 'invalid-status'
    });
    
    // Check result properties
    expect(updateResult.success).toBe(false);
    expect(updateResult.error).toBeTruthy();
    expect(updateResult.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    
    repo.close();
  });

  it('removeTask with non-existent ID', async () => {
    const repo = createTestRepository();
    
    // Remove non-existent task
    const result = await repo.removeTask('non-existent-id');
    
    // Check result properties
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    
    // Legacy method
    const legacyResult = await repo.removeTaskLegacy('non-existent-id');
    expect(legacyResult).toBe(false);
    
    repo.close();
  });

  it('removeTask with invalid ID', async () => {
    const repo = createTestRepository();
    
    // @ts-ignore - Testing with invalid type
    const result = await repo.removeTask(null);
    
    // Check result properties
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    
    repo.close();
  });
});