/**
 * Tests for BaseTaskRepository functionality
 * 
 * These tests cover core CRUD operations in the base repository
 * and validate error handling, input validation, and database operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseTaskRepository } from '../../core/repository/base.ts';
import { RepositoryFactory } from '../../core/repository/factory.ts';
import { tasks } from '../../db/schema.ts';
import { TaskErrorCode } from '../../core/types.ts';

// Helper to get a test database path
const getTestDbPath = () => `./test-${Date.now()}.db`;

describe('BaseTaskRepository', () => {
  let repository: BaseTaskRepository;
  let testDbPath: string;
  
  beforeEach(() => {
    // Create a unique test DB path for each test
    testDbPath = getTestDbPath();
    // Create repository with in-memory database
    repository = new BaseTaskRepository(testDbPath, true);
  });
  
  afterEach(() => {
    // Clean up after each test
    repository.close();
  });
  
  describe('Constructor and Connection Handling', () => {
    it('should initialize properly with explicit path and memory flag', () => {
      const repo = new BaseTaskRepository('./test.db', true);
      expect(repo._db).toBeDefined();
      expect(repo._sqlite).toBeDefined();
      repo.close();
    });
    
    it('should initialize with factory connection if available', () => {
      // Setup factory with mock connection
      const mockDb = {} as any;
      const mockSqlite = {} as any;
      RepositoryFactory.setTestConnection(mockDb, mockSqlite);
      
      // Create repository with no args (should use factory)
      const repo = new BaseTaskRepository();
      
      // Verify it used the factory connection
      expect(repo._db).toBe(mockDb);
      expect(repo._sqlite).toBe(mockSqlite);
      
      // Clean up
      repo.close();
      RepositoryFactory.reset();
    });
    
    it('should fall back to default connection if factory not available', () => {
      // Ensure factory is reset
      RepositoryFactory.reset();
      
      // Create repository with no args (should use default)
      const repo = new BaseTaskRepository();
      
      // Should have created a default connection
      expect(repo._db).toBeDefined();
      expect(repo._sqlite).toBeDefined();
      
      // Clean up
      repo.close();
    });
    
    it('should close the database connection properly', () => {
      // Spy on sqlite close method
      const closeSpy = vi.spyOn(repository._sqlite, 'close');
      
      // Call close
      const result = repository.close();
      
      // Verify close was called
      expect(closeSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should handle errors when closing an already closed connection', () => {
      // Close the connection
      repository.close();
      
      // Try to close again
      const result = repository.close();

      // Just verify it doesn't throw
      expect(true).toBe(true);
    });
  });
  
  describe('Task Operations', () => {
    it('should create a task successfully', async () => {
      // Create a task
      const result = await repository.createTask({
        title: 'Test Task'
      });
      
      // Verify success
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Task');
      expect(result.data?.status).toBe('todo');
      expect(result.data?.readiness).toBe('draft');
    });
    
    it('should handle invalid input when creating a task', async () => {
      // Try to create without a title
      const result = await repository.createTask({
        title: ''
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should create a task with metadata', async () => {
      // Create a task with metadata
      const result = await repository.createTask({
        title: 'Task with Metadata',
        metadata: { priority: 'high', assignee: 'test-user' }
      });
      
      // Verify metadata
      expect(result.success).toBe(true);
      expect(result.data?.metadata).toEqual({ priority: 'high', assignee: 'test-user' });
    });
    
    it('should get a task by ID', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task to Get'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Get the task
      const getResult = await repository.getTask(taskId);
      
      // Verify
      expect(getResult.success).toBe(true);
      expect(getResult.data?.id).toBe(taskId);
      expect(getResult.data?.title).toBe('Task to Get');
    });
    
    it('should handle invalid ID when getting a task', async () => {
      // Try to get with invalid ID
      const result = await repository.getTask('');
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should handle not found when getting a task', async () => {
      // Try to get non-existent task
      const result = await repository.getTask('non-existent-id');
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    });
    
    it('should get all tasks', async () => {
      // Create some tasks
      await repository.createTask({ title: 'Task 1' });
      await repository.createTask({ title: 'Task 2' });
      
      // Get all tasks
      const result = await repository.getAllTasks();
      
      // Verify
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.map(t => t.title)).toContain('Task 1');
      expect(result.data?.map(t => t.title)).toContain('Task 2');
    });
    
    it('should update a task', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task to Update'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Update the task
      const updateResult = await repository.updateTask({
        id: taskId,
        title: 'Updated Task',
        status: 'in-progress',
        readiness: 'ready'
      });
      
      // Verify
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.title).toBe('Updated Task');
      expect(updateResult.data?.status).toBe('in-progress');
      expect(updateResult.data?.readiness).toBe('ready');
    });
    
    it('should handle invalid ID when updating a task', async () => {
      // Try to update without ID
      const result = await repository.updateTask({
        id: '',
        title: 'Updated Task'
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should handle not found when updating a task', async () => {
      // Try to update non-existent task
      const result = await repository.updateTask({
        id: 'non-existent-id',
        title: 'Updated Task'
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    });
    
    it('should handle invalid status when updating a task', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task with Invalid Status'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Update with invalid status
      const result = await repository.updateTask({
        id: taskId,
        status: 'invalid-status' as any
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should handle invalid readiness when updating a task', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task with Invalid Readiness'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Update with invalid readiness
      const result = await repository.updateTask({
        id: taskId,
        readiness: 'invalid-readiness' as any
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should update task metadata', async () => {
      // Create a task with initial metadata
      const createResult = await repository.createTask({
        title: 'Task with Metadata',
        metadata: { priority: 'low' }
      });
      
      const taskId = createResult.data?.id as string;
      
      // Update metadata
      const updateResult = await repository.updateTask({
        id: taskId,
        metadata: { priority: 'high', assignee: 'test-user' }
      });
      
      // Verify metadata was updated
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.metadata).toEqual({ priority: 'high', assignee: 'test-user' });
    });
    
    it('should remove a task', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task to Remove'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Remove the task
      const removeResult = await repository.removeTask(taskId);
      
      // Verify success
      expect(removeResult.success).toBe(true);
      expect(removeResult.data).toBe(true);
      
      // Try to get the task (should fail)
      const getResult = await repository.getTask(taskId);
      expect(getResult.success).toBe(false);
      expect(getResult.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    });
    
    it('should handle invalid ID when removing a task', async () => {
      // Try to remove with invalid ID
      const result = await repository.removeTask('');
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.INVALID_INPUT);
    });
    
    it('should handle not found when removing a task', async () => {
      // Try to remove non-existent task
      const result = await repository.removeTask('non-existent-id');
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.NOT_FOUND);
    });
  });
  
  describe('Legacy Methods', () => {
    it('should use getTaskLegacy for backward compatibility', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Test Legacy Get'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Use legacy method
      const task = await repository.getTaskLegacy(taskId);
      
      // Verify
      expect(task).toBeDefined();
      expect(task?.title).toBe('Test Legacy Get');
    });
    
    it('should use getAllTasksLegacy for backward compatibility', async () => {
      // Create some tasks
      await repository.createTask({ title: 'Legacy Task 1' });
      await repository.createTask({ title: 'Legacy Task 2' });
      
      // Use legacy method
      const tasks = await repository.getAllTasksLegacy();
      
      // Verify
      expect(tasks.length).toBe(2);
      expect(tasks.map(t => t.title)).toContain('Legacy Task 1');
      expect(tasks.map(t => t.title)).toContain('Legacy Task 2');
    });
    
    it('should use updateTaskLegacy for backward compatibility', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task for Legacy Update'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Use legacy update method
      const updatedTask = await repository.updateTaskLegacy({
        id: taskId,
        title: 'Updated Legacy Task'
      });
      
      // Verify
      expect(updatedTask).toBeDefined();
      expect(updatedTask?.title).toBe('Updated Legacy Task');
    });
    
    it('should use removeTaskLegacy for backward compatibility', async () => {
      // Create a task
      const createResult = await repository.createTask({
        title: 'Task for Legacy Remove'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Use legacy remove method
      const result = await repository.removeTaskLegacy(taskId);
      
      // Verify
      expect(result).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle database errors when getting a task', async () => {
      // Mock db.select to throw an error
      vi.spyOn(repository._db, 'select').mockImplementationOnce(() => {
        throw new Error('Mock database error');
      });
      
      // Try to get a task
      const result = await repository.getTask('task-id');
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.DATABASE_ERROR);
      expect(result.error?.message).toContain('Mock database error');
    });
    
    it('should handle database errors when getting all tasks', async () => {
      // Mock db.select to throw an error
      vi.spyOn(repository._db, 'select').mockImplementationOnce(() => {
        throw new Error('Mock database error');
      });
      
      // Try to get all tasks
      const result = await repository.getAllTasks();
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.DATABASE_ERROR);
      expect(result.error?.message).toContain('Mock database error');
    });
    
    it('should handle database errors when updating a task', async () => {
      // Create a task first
      const createResult = await repository.createTask({
        title: 'Task for Error Test'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Mock db.update to throw an error
      vi.spyOn(repository._db, 'update').mockImplementationOnce(() => {
        throw new Error('Mock update error');
      });
      
      // Try to update the task
      const result = await repository.updateTask({
        id: taskId,
        title: 'Updated Title'
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.DATABASE_ERROR);
      expect(result.error?.message).toContain('Mock update error');
    });
    
    it('should handle database errors when removing a task', async () => {
      // Create a task first
      const createResult = await repository.createTask({
        title: 'Task for Delete Error Test'
      });
      
      const taskId = createResult.data?.id as string;
      
      // Mock db.delete to throw an error
      vi.spyOn(repository._db, 'delete').mockImplementationOnce(() => {
        throw new Error('Mock delete error');
      });
      
      // Try to delete the task
      const result = await repository.removeTask(taskId);
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.DATABASE_ERROR);
      expect(result.error?.message).toContain('Mock delete error');
    });
    
    it('should handle database errors when creating a task', async () => {
      // Mock db.insert to throw an error
      vi.spyOn(repository._db, 'insert').mockImplementationOnce(() => {
        throw new Error('Mock insert error');
      });
      
      // Try to create a task
      const result = await repository.createTask({
        title: 'Task with Error'
      });
      
      // Verify error
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(TaskErrorCode.GENERAL_ERROR);
      expect(result.error?.message).toContain('Mock insert error');
    });
  });
});