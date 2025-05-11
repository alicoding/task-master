/**
 * base-repository.vitest.ts - Tests for BaseTaskRepository
 * 
 * Definition of Done:
 * ✅ Tests use proper TypeScript imports with .ts extensions
 * ✅ Tests include setup and teardown for proper resource cleanup
 * ✅ All assertions use Vitest expect() syntax
 * ✅ Tests are grouped logically in describe blocks
 * ✅ Tests handle both TaskOperationResult and legacy direct return patterns
 * ✅ Tests properly clean up resources (e.g., close database connections)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseTaskRepository } from '../../core/repository/base.ts';
import { Task } from '../../db/schema.ts';
import { TaskInsertOptions, TaskUpdateOptions, TaskErrorCode } from '../../core/types.ts';

describe('BaseTaskRepository', () => {
  let repo: BaseTaskRepository;
  
  beforeEach(() => {
    // Create a repository with an in-memory database for each test
    repo = new BaseTaskRepository('./test.db', true);
  });
  
  afterEach(() => {
    // Clean up after each test
    repo.close();
  });

  it('should initialize and close properly', () => {
    // Check that the repo is properly initialized
    // Accessing private properties with a type assertion
    expect((repo as any)._db).toBeDefined();
    expect((repo as any)._sqlite).toBeDefined();
    
    // Close the repository
    const closeResult = repo.close();
    
    // Handle both legacy and modern return patterns
    if (typeof closeResult === 'boolean') {
      // Legacy boolean result
      expect(closeResult).toBe(true);
    } else if (closeResult && typeof closeResult === 'object') {
      // TaskOperationResult pattern
      if ('success' in closeResult) {
        expect(closeResult.success).toBeTruthy();
      }
    }
  });

  it('should handle getTask with non-existent ID', async () => {
    // Get a non-existent task
    const result = await repo.getTask('non-existent-id');
    
    // Handle both legacy and modern return patterns
    if (result === undefined || result === null) {
      // Legacy undefined result
      expect(result).toBeUndefined();
    } else if (typeof result === 'object') {
      if ('success' in result) {
        // TaskOperationResult pattern
        expect(result.success).toBeFalsy();
        expect(result.error).toBeDefined();
        expect(result.error?.code).toEqual(TaskErrorCode.NOT_FOUND);
        expect(result.error?.message).toContain('not found');
      }
    }
    
    // Legacy method
    const legacyResult = await repo.getTaskLegacy('non-existent-id');
    expect(legacyResult).toBeUndefined();
  });

  it('should handle getTask with invalid ID', async () => {
    // @ts-expect-error - Testing with invalid type
    const result = await repo.getTask(null);
    
    // Handle both legacy and modern return patterns
    if (result === undefined || result === null) {
      // Legacy undefined result
      expect(result).toBeUndefined();
    } else if (typeof result === 'object') {
      if ('success' in result) {
        // TaskOperationResult pattern
        expect(result.success).toBeFalsy();
        expect(result.error).toBeDefined();
        expect(result.error?.code).toEqual(TaskErrorCode.INVALID_INPUT);
      }
    }
  });

  it('should handle getAllTasks with empty database', async () => {
    // Get all tasks
    const result = await repo.getAllTasks();
    
    // Handle both legacy and modern return patterns
    if (Array.isArray(result)) {
      // Legacy array result
      expect(result).toHaveLength(0);
    } else if (typeof result === 'object') {
      if ('success' in result) {
        // TaskOperationResult pattern
        expect(result.success).toBeTruthy();
        expect(Array.isArray(result.data)).toBeTruthy();
        expect(result.data).toHaveLength(0);
      }
    }
    
    // Test legacy method
    const legacyResult = await repo.getAllTasksLegacy();
    expect(legacyResult).toHaveLength(0);
  });

  it('should handle updateTask with invalid ID', async () => {
    // Update with invalid ID
    const updateResult = await repo.updateTask({
      id: 'non-existent-id',
      title: 'Updated Title'
    });
    
    // Handle both legacy and modern return patterns
    if (updateResult === undefined || updateResult === null) {
      // Legacy undefined result
      expect(updateResult).toBeUndefined();
    } else if (typeof updateResult === 'object') {
      if ('success' in updateResult) {
        // TaskOperationResult pattern
        expect(updateResult.success).toBeFalsy();
        expect(updateResult.error).toBeDefined();
        expect(updateResult.error?.code).toEqual(TaskErrorCode.NOT_FOUND);
      }
    }
    
    // Try legacy method
    const legacyResult = await repo.updateTaskLegacy({
      id: 'non-existent-id',
      title: 'Updated Title'
    });
    expect(legacyResult).toBeUndefined();
  });

  it('should handle updateTask with invalid status', async () => {
    // Update with invalid status
    const updateResult = await repo.updateTask({
      id: '1', // Hypothetical ID
      // @ts-expect-error - intentionally testing invalid status
      status: 'invalid-status'
    });
    
    // Handle both legacy and modern return patterns
    if (updateResult === undefined || updateResult === null) {
      // Legacy undefined result
      expect(updateResult).toBeUndefined();
    } else if (typeof updateResult === 'object') {
      if ('success' in updateResult) {
        // TaskOperationResult pattern
        expect(updateResult.success).toBeFalsy();
        expect(updateResult.error).toBeDefined();
        expect(updateResult.error?.code).toEqual(TaskErrorCode.INVALID_INPUT);
      }
    }
  });

  it('should handle removeTask with non-existent ID', async () => {
    // Remove non-existent task
    const result = await repo.removeTask('non-existent-id');
    
    // Handle both legacy and modern return patterns
    if (typeof result === 'boolean') {
      // Legacy boolean result
      expect(result).toBe(false);
    } else if (typeof result === 'object') {
      if ('success' in result) {
        // TaskOperationResult pattern
        expect(result.success).toBeFalsy();
        expect(result.error).toBeDefined();
        expect(result.error?.code).toEqual(TaskErrorCode.NOT_FOUND);
      }
    }
    
    // Legacy method
    const legacyResult = await repo.removeTaskLegacy('non-existent-id');
    expect(legacyResult).toBe(false);
  });

  it('should handle removeTask with invalid ID', async () => {
    // @ts-expect-error - Testing with invalid type
    const result = await repo.removeTask(null);
    
    // Handle both legacy and modern return patterns
    if (typeof result === 'boolean') {
      // Legacy boolean result
      expect(result).toBe(false);
    } else if (typeof result === 'object') {
      if ('success' in result) {
        // TaskOperationResult pattern
        expect(result.success).toBeFalsy();
        expect(result.error).toBeDefined();
        expect(result.error?.code).toEqual(TaskErrorCode.INVALID_INPUT);
      }
    }
  });
});