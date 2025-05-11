/**
 * Optimized Database Operations
 * 
 * This module provides optimized versions of database operations for
 * Task Master, implementing caching, batching, and other performance
 * improvements to reduce database load and improve response times.
 */

import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, like, or, inArray } from 'drizzle-orm';
import { tasks, dependencies, Task } from '../../db/schema.ts';
import {
  TaskOperationResult,
  TaskError,
  TaskErrorCode,
  TaskUpdateOptions,
  SearchFilters
} from '../types.ts';

/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Database operations cache manager
 */
export class DatabaseCache {
  private static instance: DatabaseCache;
  private cache: Map<string, CacheEntry<any>>;
  private defaultTtl: number = 60 * 1000; // 60 seconds default TTL
  
  /**
   * Create a new DatabaseCache instance (private constructor for singleton)
   */
  private constructor() {
    this.cache = new Map();
    
    // Set up periodic cache cleanup
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000); // Clean every 5 minutes
  }
  
  /**
   * Get the singleton instance
   * @returns The DatabaseCache instance
   */
  static getInstance(): DatabaseCache {
    if (!this.instance) {
      this.instance = new DatabaseCache();
    }
    return this.instance;
  }
  
  /**
   * Set cache entry with custom TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional, uses default if not specified)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTtl);
    this.cache.set(key, { data, expiresAt });
  }
  
  /**
   * Get cached entry if available and not expired
   * @param key Cache key
   * @returns Cached data or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check if entry has expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data as T;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if entry has expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a key from the cache
   * @param key Cache key
   * @returns True if key was found and deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Remove expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear cache entries matching a prefix
   * @param prefix Key prefix to match
   */
  clearPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * BatchOperation types for batch processing
 */
export type BatchOperationType = 'read' | 'create' | 'update' | 'delete';

/**
 * BatchOperation interface for batch processing
 */
export interface BatchOperation<T> {
  type: BatchOperationType;
  data: T;
}

/**
 * Optimized database operations manager that enhances
 * repository operations with caching and batching
 */
export class OptimizedDatabaseOperations {
  private db: BetterSQLite3Database<Record<string, never>>;
  private sqlite: Database.Database;
  private cache: DatabaseCache;
  private taskIdMap: Map<string, Task> = new Map();
  
  /**
   * Create a new OptimizedDatabaseOperations instance
   * @param db Drizzle database instance
   * @param sqlite SQLite database instance
   */
  constructor(db: BetterSQLite3Database<Record<string, never>>, sqlite: Database.Database) {
    this.db = db;
    this.sqlite = sqlite;
    this.cache = DatabaseCache.getInstance();
  }
  
  /**
   * Get a task by ID with caching
   * @param id Task ID
   * @returns Task operation result with task data or error
   */
  async getTask(id: string): Promise<TaskOperationResult<Task>> {
    try {
      // Check cache first
      const cacheKey = `task:${id}`;
      const cachedTask = this.cache.get<Task>(cacheKey);
      
      if (cachedTask) {
        return {
          success: true,
          data: cachedTask
        };
      }
      
      // Not in cache, query database
      const task = await this.db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
      
      if (task.length === 0) {
        return {
          success: false,
          error: new TaskError(`Task with ID ${id} not found`, TaskErrorCode.NOT_FOUND)
        };
      }
      
      // Cache the result (30 second TTL for task data)
      this.cache.set(cacheKey, task[0], 30 * 1000);
      
      // Also update the in-memory task ID map for quick lookups
      this.taskIdMap.set(id, task[0]);
      
      return {
        success: true,
        data: task[0]
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error retrieving task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Get multiple tasks by IDs in a single query (with caching)
   * @param ids Array of task IDs
   * @returns TaskOperationResult with array of tasks
   */
  async getTasks(ids: string[]): Promise<TaskOperationResult<Task[]>> {
    if (!ids || ids.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    try {
      // Check which IDs we already have in cache
      const cachedTasks: Task[] = [];
      const uncachedIds: string[] = [];
      
      for (const id of ids) {
        const cacheKey = `task:${id}`;
        const cachedTask = this.cache.get<Task>(cacheKey);
        
        if (cachedTask) {
          cachedTasks.push(cachedTask);
        } else {
          uncachedIds.push(id);
        }
      }
      
      // If we have all tasks in cache, return them
      if (uncachedIds.length === 0) {
        return {
          success: true,
          data: cachedTasks
        };
      }
      
      // Query database for uncached tasks (using a single IN query)
      const dbTasks = await this.db.select().from(tasks).where(inArray(tasks.id, uncachedIds));
      
      // Cache the results
      for (const task of dbTasks) {
        const cacheKey = `task:${task.id}`;
        this.cache.set(cacheKey, task, 30 * 1000);
        this.taskIdMap.set(task.id, task);
      }
      
      // Combine cached and database results
      return {
        success: true,
        data: [...cachedTasks, ...dbTasks]
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error retrieving tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Update a task with optimized database access
   * @param options Task update options
   * @returns Operation result with updated task or error
   */
  async updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<Task>> {
    try {
      // Input validation
      if (!options.id) {
        return {
          success: false,
          error: new TaskError('Task ID is required for update', TaskErrorCode.INVALID_INPUT)
        };
      }
      
      // Get task from cache if possible
      const taskResult = await this.getTask(options.id);
      if (!taskResult.success || !taskResult.data) {
        return taskResult;
      }
      
      // Prepare update data (similar to base repository)
      const updateData: Partial<Task> = {};
      if (options.title) updateData.title = options.title;
      if (options.description !== undefined) updateData.description = options.description;
      if (options.body !== undefined) updateData.body = options.body;
      if (options.status) updateData.status = options.status;
      if (options.readiness) updateData.readiness = options.readiness;
      if (options.tags) updateData.tags = options.tags;
      
      // Handle metadata (same as in base repository)
      if (options.metadata !== undefined) {
        if (options.metadata === null) {
          updateData.metadata = {};
        } else {
          let currentMetadata = {};
          
          try {
            if (taskResult.data.metadata) {
              currentMetadata = typeof taskResult.data.metadata === 'string' 
                ? JSON.parse(taskResult.data.metadata) 
                : taskResult.data.metadata;
            }
          } catch (e) {
            // Continue with empty metadata if there's an error
          }
          
          // Merge with the new metadata
          updateData.metadata = {
            ...currentMetadata,
            ...options.metadata
          };
        }
      }
      
      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();
      
      if (Object.keys(updateData).length === 0) {
        return taskResult; // No changes, return existing task
      }
      
      // Perform the update
      await this.db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, options.id));
      
      // Invalidate cache for this task
      this.cache.delete(`task:${options.id}`);
      this.taskIdMap.delete(options.id);
      
      // Get the updated task without using cache
      const updatedTask = await this.db.select().from(tasks).where(eq(tasks.id, options.id)).limit(1);
      
      if (updatedTask.length === 0) {
        return {
          success: false,
          error: new TaskError(`Task with ID ${options.id} not found after update`, TaskErrorCode.NOT_FOUND)
        };
      }
      
      // Update cache with new data
      this.cache.set(`task:${options.id}`, updatedTask[0], 30 * 1000);
      this.taskIdMap.set(options.id, updatedTask[0]);
      
      return {
        success: true,
        data: updatedTask[0]
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error updating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Batch process multiple operations for better performance
   * @param operations Array of batch operations to process
   * @returns Results of all operations
   */
  async batchProcess<T, R>(
    operations: BatchOperation<T>[]
  ): Promise<TaskOperationResult<R[]>> {
    if (!operations || operations.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    
    // Use a transaction for all operations
    try {
      this.sqlite.exec('BEGIN TRANSACTION');
      
      const results: R[] = [];
      
      // Process each operation
      for (const operation of operations) {
        switch (operation.type) {
          case 'read':
            // Assume it's a task ID for read operations
            const taskId = operation.data as unknown as string;
            const taskResult = await this.getTask(taskId);
            if (taskResult.success && taskResult.data) {
              results.push(taskResult.data as unknown as R);
            }
            break;
            
          case 'update':
            // Assume it's a TaskUpdateOptions object
            const updateOptions = operation.data as unknown as TaskUpdateOptions;
            const updateResult = await this.updateTask(updateOptions);
            if (updateResult.success && updateResult.data) {
              results.push(updateResult.data as unknown as R);
            }
            break;
            
          // Other operation types can be added as needed
        }
      }
      
      this.sqlite.exec('COMMIT');
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      // Rollback transaction on error
      this.sqlite.exec('ROLLBACK');
      
      return {
        success: false,
        error: new TaskError(
          `Batch operation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Get all tasks with optimized query and caching
   * @returns Operation result with array of all tasks
   */
  async getAllTasks(): Promise<TaskOperationResult<Task[]>> {
    try {
      // Check cache first for all tasks
      const cacheKey = 'all_tasks';
      const cachedTasks = this.cache.get<Task[]>(cacheKey);
      
      if (cachedTasks) {
        return {
          success: true,
          data: cachedTasks
        };
      }
      
      // Not in cache, query database
      const taskList = await this.db.select().from(tasks);
      
      // Cache the result with a shorter TTL (10 seconds for all tasks)
      // We use a shorter TTL because this can get outdated more quickly
      this.cache.set(cacheKey, taskList, 10 * 1000);
      
      return {
        success: true,
        data: taskList
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error retrieving all tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Search for tasks with optimized query execution
   * @param filters Search filters
   * @returns Operation result with matching tasks
   */
  async searchTasks(filters: SearchFilters): Promise<TaskOperationResult<Task[]>> {
    try {
      // For empty filters, return all tasks using cached version
      if (!filters || Object.keys(filters).length === 0) {
        return this.getAllTasks();
      }
      
      // For simple status-only filters, we can check the cache
      if (Object.keys(filters).length === 1 && filters.status && !Array.isArray(filters.status)) {
        const statusCacheKey = `tasks_status:${filters.status}`;
        const cachedStatusTasks = this.cache.get<Task[]>(statusCacheKey);
        
        if (cachedStatusTasks) {
          return {
            success: true,
            data: cachedStatusTasks
          };
        }
      }
      
      // No cache hit, build query based on filters
      // This is the same as the original implementation
      // but we'll cache the results for common queries
      
      const query = this.db.select().from(tasks);
      
      // Apply status filter
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query.where(inArray(tasks.status, filters.status as string[]));
        } else {
          query.where(eq(tasks.status, filters.status as string));
        }
      }
      
      // Apply readiness filter
      if (filters.readiness) {
        if (Array.isArray(filters.readiness)) {
          query.where(inArray(tasks.readiness, filters.readiness as string[]));
        } else {
          query.where(eq(tasks.readiness, filters.readiness as string));
        }
      }
      
      // TODO: Add more filter handling...
      
      // Execute query
      const results = await query;
      
      // Cache common query results
      if (Object.keys(filters).length === 1 && filters.status && !Array.isArray(filters.status)) {
        const statusCacheKey = `tasks_status:${filters.status}`;
        this.cache.set(statusCacheKey, results, 10 * 1000);
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error searching tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }
  
  /**
   * Clear all caches to ensure fresh data
   */
  clearCaches(): void {
    this.cache.clear();
    this.taskIdMap.clear();
  }
}