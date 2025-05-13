import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { RepositoryFactory } from '../../core/repository/factory';
import { TaskSearchRepository } from '../../core/repository/search';
import { 
  SearchFilters,
  TaskStatus,
  TaskReadiness,
  TaskError,
  TaskErrorCode,
  Task
} from '../../core/types';
import { createTestDatabase, createTestRepository, generateTestTask } from './test-helpers';

// Helper to create a search repository with test data
async function createTestSearchRepository(): Promise<TaskSearchRepository> {
  // Initialize in-memory repository
  const { db, sqlite } = createTestDatabase();
  RepositoryFactory.reset();
  RepositoryFactory.setTestConnection(db, sqlite);
  
  // Create repository
  const repo = new TaskSearchRepository();
  
  // Add some test tasks
  await repo.addTask({
    id: '1',
    title: 'Test Task 1',
    status: 'todo' as TaskStatus,
    readiness: 'ready' as TaskReadiness,
    tags: 'test,important',
    metadata: JSON.stringify({ priority: 'high', description: 'First test task' })
  });
  
  await repo.addTask({
    id: '1.1',
    title: 'Test Subtask 1',
    status: 'in-progress' as TaskStatus,
    readiness: 'ready' as TaskReadiness,
    tags: 'test,subtask',
    metadata: JSON.stringify({ priority: 'medium', description: 'First test subtask' })
  });
  
  await repo.addTask({
    id: '2',
    title: 'Another Task',
    status: 'todo' as TaskStatus,
    readiness: 'blocked' as TaskReadiness,
    tags: 'test,pending',
    metadata: JSON.stringify({ priority: 'low', description: 'Second test task' })
  });
  
  await repo.addTask({
    id: '3',
    title: 'Finished Task',
    status: 'done' as TaskStatus,
    readiness: 'ready' as TaskReadiness,
    tags: 'test,completed',
    metadata: JSON.stringify({ priority: 'high', description: 'Completed test task' })
  });
  
  return repo;
}

test('TaskSearchRepository - searchTasks with valid filters', async () => {
  const repo = await createTestSearchRepository();
  
  // Search for todo tasks
  const todoResult = await repo.searchTasks({ status: 'todo' });
  assert.equal(todoResult.success, true, 'Search should succeed');
  assert.ok(todoResult.data, 'Data should be present');
  assert.equal(todoResult.data?.length, 2, 'Should find 2 todo tasks');
  assert.equal(todoResult.data?.[0].id, '1', 'First task should have id 1');
  assert.equal(todoResult.data?.[1].id, '2', 'Second task should have id 2');
  
  // Search for ready tasks
  const readyResult = await repo.searchTasks({ readiness: 'ready' });
  assert.equal(readyResult.success, true, 'Search should succeed');
  assert.ok(readyResult.data, 'Data should be present');
  assert.equal(readyResult.data?.length, 3, 'Should find 3 ready tasks');
  
  // Search with tag
  const tagResult = await repo.searchTasks({ tags: ['completed'] });
  assert.equal(tagResult.success, true, 'Search should succeed');
  assert.ok(tagResult.data, 'Data should be present');
  assert.equal(tagResult.data?.length, 1, 'Should find 1 completed task');
  assert.equal(tagResult.data?.[0].id, '3', 'Should find task with id 3');
  
  // Search with metadata
  const metadataResult = await repo.searchTasks({ 
    metadata: { priority: 'high' } 
  });
  assert.equal(metadataResult.success, true, 'Search should succeed');
  assert.ok(metadataResult.data, 'Data should be present');
  assert.equal(metadataResult.data?.length, 2, 'Should find 2 high priority tasks');
  
  repo.close();
});

test('TaskSearchRepository - searchTasks with invalid filters', async () => {
  const repo = await createTestSearchRepository();
  
  // Test with invalid status
  const invalidStatusResult = await repo.searchTasks({ 
    // @ts-ignore - Deliberately using invalid status to test error handling
    status: 'invalid-status' 
  });
  assert.equal(invalidStatusResult.success, false, 'Search should fail');
  assert.ok(invalidStatusResult.error, 'Error should be present');
  assert.equal(invalidStatusResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  assert.match(invalidStatusResult.error?.message, /Invalid status/, 'Error message should mention invalid status');
  
  // Test with invalid readiness
  const invalidReadinessResult = await repo.searchTasks({ 
    // @ts-ignore - Deliberately using invalid readiness to test error handling
    readiness: 'not-a-readiness' 
  });
  assert.equal(invalidReadinessResult.success, false, 'Search should fail');
  assert.ok(invalidReadinessResult.error, 'Error should be present');
  assert.equal(invalidReadinessResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  assert.match(invalidReadinessResult.error?.message, /Invalid readiness/, 'Error message should mention invalid readiness');
  
  // Test legacy method fallback
  const legacyResult = await repo.searchTasksLegacy({ 
    // @ts-ignore - Deliberately using invalid status to test error handling
    status: 'invalid-status' 
  });
  assert.equal(legacyResult.length, 0, 'Legacy method should return empty array on error');
  
  repo.close();
});

test('TaskSearchRepository - getNextTasks', async () => {
  const repo = await createTestSearchRepository();
  
  // Get next tasks with default filters (ready and todo)
  const nextTasksResult = await repo.getNextTasks();
  assert.equal(nextTasksResult.success, true, 'Getting next tasks should succeed');
  assert.ok(nextTasksResult.data, 'Data should be present');
  assert.equal(nextTasksResult.data?.length, 1, 'Should find 1 ready todo task');
  assert.equal(nextTasksResult.data?.[0].id, '1', 'Task should have id 1');
  
  // Get multiple next tasks
  const multipleTasksResult = await repo.getNextTasks({ status: ['todo', 'in-progress'] }, 2);
  assert.equal(multipleTasksResult.success, true, 'Getting next tasks should succeed');
  assert.ok(multipleTasksResult.data, 'Data should be present');
  assert.equal(multipleTasksResult.data?.length, 2, 'Should find 2 tasks');
  
  // Test with invalid count
  const invalidCountResult = await repo.getNextTasks({}, 0);
  assert.equal(invalidCountResult.success, false, 'Should fail with invalid count');
  assert.ok(invalidCountResult.error, 'Error should be present');
  assert.equal(invalidCountResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test legacy method
  const legacyResult = await repo.getNextTasksLegacy();
  assert.equal(legacyResult.length, 1, 'Legacy method should return 1 task');
  assert.equal(legacyResult[0].id, '1', 'Task should have id 1');
  
  repo.close();
});

test('TaskSearchRepository - getNextTask', async () => {
  const repo = await createTestSearchRepository();
  
  // Get next task with default filters
  const nextTaskResult = await repo.getNextTask();
  assert.equal(nextTaskResult.success, true, 'Getting next task should succeed');
  assert.ok(nextTaskResult.data, 'Data should be present');
  assert.equal(nextTaskResult.data?.id, '1', 'Task should have id 1');
  
  // Get next task with specific filters (no matching task)
  const noMatchResult = await repo.getNextTask({ status: 'todo', readiness: 'blocked' });
  assert.equal(noMatchResult.success, true, 'Getting next task should succeed even with no matches');
  assert.equal(noMatchResult.data, undefined, 'Data should be undefined when no matches');
  
  // Test legacy method
  const legacyResult = await repo.getNextTaskLegacy();
  assert.equal(legacyResult?.id, '1', 'Legacy method should return task with id 1');
  
  repo.close();
});

test('TaskSearchRepository - findSimilarTasks', async () => {
  const repo = await createTestSearchRepository();
  
  // Find similar tasks by title
  const similarResult = await repo.findSimilarTasks('Test Task');
  assert.equal(similarResult.success, true, 'Finding similar tasks should succeed');
  assert.ok(similarResult.data, 'Data should be present');
  assert.ok(similarResult.data?.length >= 1, 'Should find at least one similar task');
  
  // Test with invalid title
  const invalidTitleResult = await repo.findSimilarTasks('');
  assert.equal(invalidTitleResult.success, false, 'Should fail with empty title');
  assert.ok(invalidTitleResult.error, 'Error should be present');
  assert.equal(invalidTitleResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test with invalid threshold
  const invalidThresholdResult = await repo.findSimilarTasks('Test', true, 1.5);
  assert.equal(invalidThresholdResult.success, false, 'Should fail with invalid threshold');
  assert.ok(invalidThresholdResult.error, 'Error should be present');
  assert.equal(invalidThresholdResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test legacy method
  const legacyResult = await repo.findSimilarTasksLegacy('Test Task');
  assert.ok(legacyResult.length >= 1, 'Legacy method should find at least one similar task');
  
  repo.close();
});

test('TaskSearchRepository - naturalLanguageSearch', async () => {
  const repo = await createTestSearchRepository();
  
  // Search with natural language query
  const searchResult = await repo.naturalLanguageSearch('find todo tasks');
  assert.equal(searchResult.success, true, 'Natural language search should succeed');
  assert.ok(searchResult.data, 'Data should be present');
  // We can't assert exact results since NLP might extract different filters
  
  // Test with invalid query
  const invalidQueryResult = await repo.naturalLanguageSearch('');
  assert.equal(invalidQueryResult.success, false, 'Should fail with empty query');
  assert.ok(invalidQueryResult.error, 'Error should be present');
  assert.equal(invalidQueryResult.error?.code, TaskErrorCode.INVALID_INPUT, 'Should have INVALID_INPUT error code');
  
  // Test legacy method
  const legacyResult = await repo.naturalLanguageSearchLegacy('find todo tasks');
  assert.ok(Array.isArray(legacyResult), 'Legacy method should return an array');
  
  repo.close();
});

// Run all tests
test.run();