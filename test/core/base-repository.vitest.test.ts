/**
 * base-repository.vitest.test.ts - Converted from uvu to Vitest
 * 
 * This file uses the Vitest adapter to run the original test with minimal changes.
 */

import { test, assert } from '../vitest-adapter.ts';
// assert is imported from vitest-adapter;
import { BaseTaskRepository } from '../../core/repository/base.ts';
import { Task } from '../../db/schema.ts';
import { TaskInsertOptions, TaskUpdateOptions, TaskErrorCode } from '../../core/types.ts';

// Helper to create a repository for testing
function createTestRepository(): BaseTaskRepository {
  // Create a repository with an in-memory database
  return new BaseTaskRepository('./test.db', true);
}

test('BaseTaskRepository - constructor and close', () => {
  const repo = createTestRepository();
  
  // Check that the repo is properly initialized
  assert.ok(repo._db, 'Should have a database instance');
  assert.ok(repo._sqlite, 'Should have a SQLite instance');
  
  // Close the repository
  const closeResult = repo.close();
  assert.equal(closeResult, true, 'Close should return true');
});

test('BaseTaskRepository - getTask with non-existent ID', async () => {
  const repo = createTestRepository();
  
  // Get a non-existent task
  const result = await repo.getTask('non-existent-id');
  
  // Check result properties
  assert.equal(result.success, false, 'Should fail for non-existent task');
  assert.ok(result.error, 'Should have an error');
  assert.equal(result.error?.code, TaskErrorCode.NOT_FOUND, 'Should have NOT_FOUND error code');
  assert.ok(result.error?.message.includes('not found'), 'Should mention task not found');
  
  // Legacy method
  const legacyResult = await repo.getTaskLegacy('non-existent-id');
  assert.equal(legacyResult, undefined, 'Legacy method should return undefined');
  
  repo.close();
});

test('BaseTaskRepository - getTask with invalid ID', async () => {
  const repo = createTestRepository();
  
  // @ts-ignore - Testing with invalid type
  const result = await repo.getTask(null);
  
  // Check result properties
  assert.equal(result.success, false, 'Should fail for invalid task ID');
  assert.ok(result.error, 'Should have an error');
  assert.equal(result.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  repo.close();
});

test('BaseTaskRepository - getAllTasks with empty database', async () => {
  const repo = createTestRepository();
  
  // Get all tasks
  const result = await repo.getAllTasks();
  
  // Check result properties
  assert.equal(result.success, true, 'Should succeed even with empty database');
  assert.ok(Array.isArray(result.data), 'Should return an array');
  assert.equal(result.data?.length, 0, 'Should have zero tasks');
  
  // Test legacy method
  const legacyResult = await repo.getAllTasksLegacy();
  assert.equal(legacyResult.length, 0, 'Legacy method should return empty array');
  
  repo.close();
});

test('BaseTaskRepository - updateTask with invalid ID', async () => {
  const repo = createTestRepository();
  
  // Update with invalid ID
  const updateResult = await repo.updateTask({
    id: 'non-existent-id',
    title: 'Updated Title'
  });
  
  // Check result properties
  assert.equal(updateResult.success, false, 'Should fail for non-existent task');
  assert.ok(updateResult.error, 'Should have an error');
  assert.equal(updateResult.error?.code, TaskErrorCode.NOT_FOUND, 'Should have NOT_FOUND error code');
  
  // Try legacy method
  const legacyResult = await repo.updateTaskLegacy({
    id: 'non-existent-id',
    title: 'Updated Title'
  });
  assert.equal(legacyResult, undefined, 'Legacy method should return undefined');
  
  repo.close();
});

test('BaseTaskRepository - updateTask with invalid status', async () => {
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
  assert.equal(updateResult.success, false, 'Should fail for invalid status');
  assert.ok(updateResult.error, 'Should have an error');
  assert.equal(updateResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  repo.close();
});

test('BaseTaskRepository - removeTask with non-existent ID', async () => {
  const repo = createTestRepository();
  
  // Remove non-existent task
  const result = await repo.removeTask('non-existent-id');
  
  // Check result properties
  assert.equal(result.success, false, 'Should fail for non-existent task');
  assert.ok(result.error, 'Should have an error');
  assert.equal(result.error?.code, TaskErrorCode.NOT_FOUND, 'Should have NOT_FOUND error code');
  
  // Legacy method
  const legacyResult = await repo.removeTaskLegacy('non-existent-id');
  assert.equal(legacyResult, false, 'Legacy method should return false');
  
  repo.close();
});

test('BaseTaskRepository - removeTask with invalid ID', async () => {
  const repo = createTestRepository();
  
  // @ts-ignore - Testing with invalid type
  const result = await repo.removeTask(null);
  
  // Check result properties
  assert.equal(result.success, false, 'Should fail for invalid task ID');
  assert.ok(result.error, 'Should have an error');
  assert.equal(result.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  repo.close();
});

// Run all tests
test.run();