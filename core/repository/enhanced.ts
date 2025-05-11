/**
 * Enhanced Task Repository
 * 
 * Extends the base repository with optimized database operations,
 * caching, and improved performance for common task operations.
 */

import { BaseTaskRepository } from './base.ts';
import { OptimizedDatabaseOperations, DatabaseCache } from './optimized-operations.ts';
import { Task } from '../../db/schema.ts';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters,
  TaskOperationResult,
  TaskError,
  TaskErrorCode
} from '../types.ts';

/**
 * EnhancedTaskRepository class with optimized database operations
 * that extends the base repository with caching and performance improvements
 */
export class EnhancedTaskRepository extends BaseTaskRepository {
  private optimizer: OptimizedDatabaseOperations;
  private cache: DatabaseCache;
  
  /**
   * Create a new EnhancedTaskRepository instance
   * @param dbPath Path to the database file (optional)
   * @param inMemory Whether to use an in-memory database (optional)
   */
  constructor(dbPath?: string, inMemory?: boolean) {
    // Initialize base repository first
    super(dbPath, inMemory);
    
    // Initialize optimizer and cache
    this.optimizer = new OptimizedDatabaseOperations(this.db, this.sqlite);
    this.cache = DatabaseCache.getInstance();
  }
  
  /**
   * Get a task by ID with optimized caching
   * @param id Task ID
   * @returns Task operation result
   */
  async getTask(id: string): Promise<TaskOperationResult<Task>> {
    return this.optimizer.getTask(id);
  }
  
  /**
   * Get multiple tasks by IDs in a single optimized query
   * @param ids Array of task IDs
   * @returns Operation result with array of tasks
   */
  async getTasks(ids: string[]): Promise<TaskOperationResult<Task[]>> {
    return this.optimizer.getTasks(ids);
  }
  
  /**
   * Get all tasks with optimized query and caching
   * @returns Operation result with array of all tasks
   */
  async getAllTasks(): Promise<TaskOperationResult<Task[]>> {
    return this.optimizer.getAllTasks();
  }
  
  /**
   * Update a task with optimized database access
   * @param options Task update options
   * @returns Operation result with updated task
   */
  async updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<Task>> {
    // Validate the input first
    if (!options.id) {
      return {
        success: false,
        error: new TaskError('Task ID is required for update', TaskErrorCode.INVALID_INPUT)
      };
    }
    
    if (options.status && !['todo', 'in-progress', 'done'].includes(options.status)) {
      return {
        success: false,
        error: new TaskError(`Invalid status: ${options.status}`, TaskErrorCode.INVALID_INPUT)
      };
    }
    
    if (options.readiness && !['draft', 'ready', 'blocked'].includes(options.readiness)) {
      return {
        success: false,
        error: new TaskError(`Invalid readiness: ${options.readiness}`, TaskErrorCode.INVALID_INPUT)
      };
    }
    
    // Use optimized update operation
    return this.optimizer.updateTask(options);
  }
  
  /**
   * Search for tasks with optimized query execution
   * @param filters Search filters
   * @returns Operation result with matching tasks
   */
  async searchTasks(filters: SearchFilters): Promise<TaskOperationResult<Task[]>> {
    return this.optimizer.searchTasks(filters);
  }
  
  /**
   * Create a task with proper cache invalidation
   * @param options Task creation options
   * @returns Operation result with the created task
   */
  async createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>> {
    // Use the base implementation to create the task
    const result = await super.createTask(options);
    
    // If successful, invalidate relevant caches
    if (result.success && result.data) {
      // Invalidate all_tasks cache since we added a new task
      this.cache.delete('all_tasks');
      
      // Invalidate status caches that might be affected
      const status = options.status || 'todo';
      this.cache.delete(`tasks_status:${status}`);
    }
    
    return result;
  }
  
  /**
   * Remove a task with proper cache invalidation
   * @param id Task ID to remove
   * @returns Operation result indicating success or failure
   */
  async removeTask(id: string): Promise<TaskOperationResult<boolean>> {
    // First get the task to know its status (for cache invalidation)
    const taskResult = await this.getTask(id);
    let taskStatus = 'todo'; // Default if not found
    
    if (taskResult.success && taskResult.data) {
      taskStatus = taskResult.data.status;
    }
    
    // Use the base implementation to remove the task
    const result = await super.removeTask(id);
    
    // If successful, invalidate relevant caches
    if (result.success && result.data) {
      // Invalidate task-specific cache
      this.cache.delete(`task:${id}`);
      
      // Invalidate all_tasks cache since we removed a task
      this.cache.delete('all_tasks');
      
      // Invalidate status caches that might be affected
      this.cache.delete(`tasks_status:${taskStatus}`);
    }
    
    return result;
  }
  
  /**
   * Get the next tasks to work on
   * @param filters Optional filters to apply
   * @param count Number of tasks to return (default: 1)
   * @returns Operation result with the next tasks
   */
  async getNextTasks(filters: SearchFilters = {}, count: number = 1): Promise<TaskOperationResult<Task[]>> {
    try {
      // For the "next" functionality, we should use fresh data to ensure accuracy
      // Use search with optimizations, but don't rely on long-term caching
      
      // Default to todo status if not specified
      if (!filters.status) {
        filters.status = 'todo';
      }
      
      // Search for tasks matching the filters
      const searchResult = await this.searchTasks(filters);
      
      if (!searchResult.success || !searchResult.data) {
        return searchResult;
      }
      
      // Sort using priority factors:
      // 1. Readiness (ready > draft > blocked)
      // 2. Creation date (older tasks first)
      const tasks = searchResult.data;
      tasks.sort((a, b) => {
        // Readiness priority: ready (highest) > draft > blocked (lowest)
        const readinessOrder: { [key: string]: number } = {
          'ready': 0,
          'draft': 1,
          'blocked': 2
        };
        
        const aReadinessPriority = readinessOrder[a.readiness] ?? 1; // Default to draft priority
        const bReadinessPriority = readinessOrder[b.readiness] ?? 1;
        
        if (aReadinessPriority !== bReadinessPriority) {
          return aReadinessPriority - bReadinessPriority;
        }
        
        // If same readiness, older tasks get priority (lower timestamp = higher priority)
        return a.createdAt - b.createdAt;
      });
      
      // Return the requested number of tasks (or all if count > tasks.length)
      return {
        success: true,
        data: tasks.slice(0, count)
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error finding next tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }
  
  /**
   * Close database connection and clean up resources
   * @returns True if successful, false if there was an error
   */
  close(): boolean {
    // Clear caches before closing
    this.cache.clear();
    
    // Use the base implementation to close the connection
    return super.close();
  }
}