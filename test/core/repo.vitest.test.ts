/**
 * Repository Tests with Vitest
 * 
 * This is a converted version of repo.test.ts to use Vitest
 * using our adapter to minimize changes from the original test.
 */

import { test, assert } from '../vitest-adapter.ts';
import { TaskRepository } from '../../core/repo.ts';
import { TaskInsertOptions, TaskUpdateOptions } from '../../core/types.ts';
import { createTestRepository } from './test-helpers.ts';

test('TaskRepository Tests with Vitest')('TaskRepository - create and get tasks', async () => {
  // Create repo with in-memory DB for testing with proper schema
  const repo = createTestRepository();
  
  // Create a root-level task
  const taskOptions: TaskInsertOptions = {
    title: 'Test Task 1',
    status: 'todo',
    tags: ['test', 'core']
  };
  
  const task1 = await repo.createTask(taskOptions);
  
  assert.equal(task1.id, '1');
  assert.equal(task1.title, 'Test Task 1');
  assert.equal(task1.status, 'todo');
  assert.equal(task1.parentId, null);
  assert.equal(Array.isArray(task1.tags), true);
  assert.equal(task1.tags.includes('test'), true);
  assert.equal(task1.tags.includes('core'), true);
  
  // Create a child task
  const childTaskOptions: TaskInsertOptions = {
    title: 'Child Task',
    childOf: task1.id,
  };
  
  const task2 = await repo.createTask(childTaskOptions);
  
  assert.equal(task2.id, '1.1');
  assert.equal(task2.title, 'Child Task');
  assert.equal(task2.parentId, task1.id);
  
  // Create a task after another
  const afterTaskOptions: TaskInsertOptions = {
    title: 'After Task',
    after: task1.id,
  };
  
  const task3 = await repo.createTask(afterTaskOptions);
  
  assert.equal(task3.id, '2');
  assert.equal(task3.title, 'After Task');
  assert.equal(task3.parentId, null);
  
  // Get task by ID
  const fetchedTask = await repo.getTask(task1.id);
  assert.equal(fetchedTask?.id, task1.id);
  assert.equal(fetchedTask?.title, task1.title);
  
  // Get all tasks
  const allTasks = await repo.getAllTasks();
  assert.equal(allTasks.data?.length, 3);
  
  // Clean up
  repo.close();
});

test('TaskRepository Tests with Vitest')('TaskRepository - update tasks', async () => {
  // Create repo with in-memory DB for testing with proper schema
  const repo = createTestRepository();
  
  // Create a task
  const taskOptions: TaskInsertOptions = {
    title: 'Original Task',
    tags: ['original']
  };
  
  const task = await repo.createTask(taskOptions);
  
  // Update the task
  const updateOptions: TaskUpdateOptions = {
    id: task.id,
    title: 'Updated Task',
    status: 'in-progress',
    tags: ['updated', 'test']
  };
  
  const updatedTask = await repo.updateTask(updateOptions);
  
  assert.equal(updatedTask?.id, task.id);
  assert.equal(updatedTask?.title, 'Updated Task');
  assert.equal(updatedTask?.status, 'in-progress');
  assert.equal(updatedTask?.tags.length, 2);
  assert.equal(updatedTask?.tags.includes('updated'), true);
  assert.equal(updatedTask?.tags.includes('test'), true);
  
  // Clean up
  repo.close();
});

test('TaskRepository Tests with Vitest')('TaskRepository - remove tasks', async () => {
  // Create repo with in-memory DB for testing with proper schema
  const repo = createTestRepository();
  
  // Create a task
  const taskOptions: TaskInsertOptions = {
    title: 'Task to Remove',
  };
  
  const task = await repo.createTask(taskOptions);
  
  // Ensure task exists
  const fetchedTask = await repo.getTask(task.id);
  assert.ok(fetchedTask);
  
  // Remove the task
  const result = await repo.removeTask(task.id);
  assert.equal(result.success, true);
  
  // Verify task is gone
  const removedTask = await repo.getTask(task.id);
  assert.equal(removedTask, undefined);
  
  // Clean up
  repo.close();
});

test('TaskRepository Tests with Vitest')('TaskRepository - search tasks', async () => {
  // Create repo with in-memory DB for testing with proper schema
  const repo = createTestRepository();
  
  // Create task 1
  await repo.createTask({
    title: 'Search Task 1',
    tags: ['search', 'test'],
    status: 'todo',
    readiness: 'ready'
  });
  
  // Create task 2
  await repo.createTask({
    title: 'Search Task 2',
    tags: ['search', 'important'],
    status: 'in-progress',
    readiness: 'draft'
  });
  
  // Create task 3
  await repo.createTask({
    title: 'Another Task',
    tags: ['test'],
    status: 'todo',
    readiness: 'ready'
  });
  
  // Search by tag
  const searchByTag = await repo.searchTasks({ tags: ['search'] });
  assert.equal(searchByTag.data?.length, 2);
  
  // Search by status
  const searchByStatus = await repo.searchTasks({ status: 'todo' });
  assert.equal(searchByStatus.data?.length, 2);
  
  // Search by readiness
  const searchByReadiness = await repo.searchTasks({ readiness: 'ready' });
  assert.equal(searchByReadiness.data?.length, 2);
  
  // Search by query
  const searchByQuery = await repo.searchTasks({ query: 'Another' });
  assert.equal(searchByQuery.data?.length, 1);
  assert.equal(searchByQuery.data?.[0].title, 'Another Task');
  
  // Search with multiple filters
  const combinedSearch = await repo.searchTasks({
    tags: ['test'],
    status: 'todo',
    readiness: 'ready'
  });
  
  // Ensure result has at least one item that contains "Search Task 1"
  const hasSearchTask1 = combinedSearch.data?.some(task => task.title.includes('Search Task 1'));
  assert.equal(hasSearchTask1, true);
  
  // Clean up
  repo.close();
});

// Call run to register all tests
test('TaskRepository Tests with Vitest').run();