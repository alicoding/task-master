import { eq, and, like, or, isNull } from 'drizzle-orm';
import { createDb } from '../../db/init.js';
import { tasks, dependencies, Task, NewTask } from '../../db/schema.js';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters
} from '../types.js';
import { RepositoryFactory } from './factory.js';

/**
 * Base TaskRepository class with core functionality
 * Handles database connection and basic CRUD operations
 */
export class BaseTaskRepository {
  protected db: any;
  protected sqlite: any;

  // Make them publicly accessible for debugging but maintain TypeScript protection
  public get _db() { return this.db; }
  public get _sqlite() { return this.sqlite; }

  constructor(dbOrPath?: any, sqliteOrMemory?: any) {
    // Handle different constructor signatures:
    // 1. No params - use factory or default
    // 2. (db, sqlite) - use provided connection
    // 3. (dbPath, inMemory) - create new connection

    if (!dbOrPath && !sqliteOrMemory) {
      // Try to get connection from factory first
      try {
        const connection = RepositoryFactory.getConnection();
        this.db = connection.db;
        this.sqlite = connection.sqlite;
        return;
      } catch (e) {
        // Factory not initialized, fall back to default
        const connection = createDb('./db/taskmaster.db', false);
        this.db = connection.db;
        this.sqlite = connection.sqlite;
        return;
      }
    }

    // Check if we're receiving direct DB objects
    if (dbOrPath && typeof dbOrPath !== 'string') {
      this.db = dbOrPath;
      this.sqlite = sqliteOrMemory;
    } else {
      // We're receiving path and inMemory flag
      const dbPath = dbOrPath as string || './db/taskmaster.db';
      const inMemory = sqliteOrMemory as boolean || false;
      const connection = createDb(dbPath, inMemory);
      this.db = connection.db;
      this.sqlite = connection.sqlite;
    }
  }
  
  /**
   * Close database connection when done
   */
  close() {
    // Only close if we own the connection (not shared via factory)
    if (this.sqlite) {
      try {
        this.sqlite.close();
      } catch (e) {
        // Ignore errors when closing already closed connections
        console.log('Info: Database already closed');
      }
    }

    // Reset the factory as well for clean test runs
    try {
      // Use the imported RepositoryFactory instead of require
      RepositoryFactory.reset();
    } catch (e) {
      // Factory might not be available
    }
  }
  
  /**
   * Get a task by ID
   * @param id Task ID
   * @returns Task or undefined if not found
   */
  async getTask(id: string): Promise<Task | undefined> {
    const result = await this.db.select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    
    return result[0];
  }
  
  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return this.db.select().from(tasks);
  }
  
  /**
   * Update a task
   * @param options Task update options
   * @returns Updated task or undefined if not found
   */
  async updateTask(options: TaskUpdateOptions): Promise<Task | undefined> {
    const updateData: Partial<Task> = {};
    
    if (options.title) updateData.title = options.title;
    if (options.status) updateData.status = options.status;
    if (options.readiness) updateData.readiness = options.readiness;
    if (options.tags) updateData.tags = options.tags;
    
    // Handle metadata as a special case for PATCH-style updates
    if (options.metadata !== undefined) {
      if (options.metadata === null) {
        updateData.metadata = {};
      } else {
        const task = await this.getTask(options.id);
        if (task) {
          updateData.metadata = {
            ...task.metadata,
            ...options.metadata
          };
        }
      }
    }
    
    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date();
    
    if (Object.keys(updateData).length === 0) {
      return this.getTask(options.id);
    }
    
    await this.db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, options.id));
    
    return this.getTask(options.id);
  }
  
  /**
   * Remove a task
   * @param id Task ID to remove
   * @returns true if successful, false if task not found
   */
  async removeTask(id: string): Promise<boolean> {
    // First, check if the task exists
    const task = await this.getTask(id);
    if (!task) {
      return false;
    }
    
    // Remove all dependencies involving this task
    await this.db.delete(dependencies)
      .where(
        or(
          eq(dependencies.fromTaskId, id),
          eq(dependencies.toTaskId, id)
        )
      );
    
    // Remove the task
    await this.db.delete(tasks)
      .where(eq(tasks.id, id));
    
    return true;
  }
}