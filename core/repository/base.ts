import { eq, and, like, or, isNull } from 'drizzle-orm';
import { SQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { createDb } from '../../db/init.ts';
import { tasks, dependencies, Task, NewTask } from '../../db/schema.ts';
import {
  TaskInsertOptions,
  TaskUpdateOptions,
  SearchFilters,
  TaskError,
  TaskErrorCode,
  TaskOperationResult,
  validateMetadata
} from '../types.ts';
import { createLogger } from '../utils/logger.ts';

// Create logger for base repository
const logger = createLogger('Repository:Base');

/**
 * Database connection type
 */
export interface DbConnection {
  db: BetterSQLite3Database<Record<string, never>>;
  sqlite: Database.Database;
}

/**
 * Base TaskRepository class with core functionality
 * Handles database connection and basic CRUD operations
 */
// Import RepositoryFactory here to avoid circular deps
import { RepositoryFactory } from './factory.ts';

export class BaseTaskRepository {
  protected db: BetterSQLite3Database<Record<string, never>>;
  protected sqlite: Database.Database;

  // Make them publicly accessible for debugging but maintain TypeScript protection
  public get _db(): BetterSQLite3Database<Record<string, never>> { return this.db; }
  public get _sqlite(): Database.Database { return this.sqlite; }

  /**
   * Create a new TaskRepository instance
   * @param dbOrPath Either a database instance or path to database file
   * @param sqliteOrMemory Either a SQLite instance or boolean flag for in-memory database
   */
  constructor(
    dbOrPath?: string | BetterSQLite3Database<Record<string, never>>,
    sqliteOrMemory?: boolean | Database.Database
  ) {
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
      this.sqlite = sqliteOrMemory as Database.Database;
    } else {
      // We're receiving path and inMemory flag
      const dbPath = (dbOrPath as string) || './db/taskmaster.db';
      const inMemory = (sqliteOrMemory as boolean) || false;
      const connection = createDb(dbPath, inMemory);
      this.db = connection.db;
      this.sqlite = connection.sqlite;
    }
  }
  
  /**
   * Close database connection when done
   * @returns True if successful, false if there was an error
   */
  close(): boolean {
    // Only close if we own the connection (not shared via factory)
    if (this.sqlite) {
      try {
        this.sqlite.close();
      } catch (e) {
        // Ignore errors when closing already closed connections
        logger.debug('Database already closed', { source: 'close' });
        return false;
      }
    }

    // Reset the factory as well for clean test runs
    try {
      // Use the imported RepositoryFactory instead of require
      RepositoryFactory.reset();
    } catch (e) {
      // Factory might not be available
      return false;
    }

    return true;
  }
  
  /**
   * Get a task by ID
   * @param id Task ID
   * @returns A typed result with the task or error information
   */
  async getTask(id: string): Promise<TaskOperationResult<Task>> {
    try {
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid task ID provided', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Try to select all fields including description and body
      const result = await this.db.select()
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (result.length === 0) {
        return {
          success: false,
          error: new TaskError(`Task with ID ${id} not found`, TaskErrorCode.NOT_FOUND)
        };
      }

      return {
        success: true,
        data: result[0]
      };
    } catch (error) {
      // If there's an error about missing columns
      if (error instanceof Error &&
          (error.message.includes('no such column') ||
           error.message.includes('description') ||
           error.message.includes('body'))) {

        logger.warn('Database schema appears to be outdated', {
          message: 'Run "node scripts/fix-database.js" to fix',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Fall back to selecting only the columns we know exist
        try {
          const fallbackResult = await this.db.select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
            readiness: tasks.readiness,
            tags: tasks.tags,
            parentId: tasks.parentId,
            metadata: tasks.metadata
          })
          .from(tasks)
          .where(eq(tasks.id, id))
          .limit(1);

          if (fallbackResult.length === 0) {
            return {
              success: false,
              error: new TaskError(`Task with ID ${id} not found`, TaskErrorCode.NOT_FOUND)
            };
          }

          // Add empty description and body fields for compatibility
          return {
            success: true,
            data: {
              ...fallbackResult[0],
              description: null,
              body: null
            }
          };
        } catch (fallbackError) {
          logger.error('Failed to retrieve task with fallback query', fallbackError);
          return {
            success: false,
            error: new TaskError(
              `Database error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
              TaskErrorCode.DATABASE_ERROR
            )
          };
        }
      }

      // For other types of errors, return a typed error response
      return {
        success: false,
        error: new TaskError(
          `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Get a task by ID (legacy method for backward compatibility)
   * @param id Task ID
   * @returns Task or undefined if not found
   * @deprecated Use getTask with TaskOperationResult instead
   */
  async getTaskLegacy(id: string): Promise<Task | undefined> {
    const result = await this.getTask(id);
    return result.success ? result.data : undefined;
  }
  
  /**
   * Get all tasks
   * @returns Task operation result with array of all tasks
   */
  async getAllTasks(): Promise<TaskOperationResult<Task[]>> {
    try {
      // Try to select all fields including description and body
      const taskList = await this.db.select().from(tasks);
      return {
        success: true,
        data: taskList
      };
    } catch (error) {
      // If there's an error about missing columns
      if (error instanceof Error &&
          (error.message.includes('no such column') ||
           error.message.includes('description') ||
           error.message.includes('body'))) {

        logger.warn('Database schema appears to be outdated', {
          message: 'Run "node scripts/fix-database.js" to fix',
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // Fall back to selecting only the columns we know exist
        try {
          const fallbackResult = await this.db.select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
            readiness: tasks.readiness,
            tags: tasks.tags,
            parentId: tasks.parentId,
            metadata: tasks.metadata
          })
          .from(tasks);

          // Add empty description and body fields for compatibility
          const tasksWithEmpty = fallbackResult.map(task => ({
            ...task,
            description: null,
            body: null
          }));

          return {
            success: true,
            data: tasksWithEmpty
          };
        } catch (fallbackError) {
          logger.error('Failed to retrieve tasks with fallback query', fallbackError);
          return {
            success: false,
            error: new TaskError(
              `Database error retrieving all tasks: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
              TaskErrorCode.DATABASE_ERROR
            )
          };
        }
      }

      // For other types of errors, return a typed error response
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
   * Get all tasks (legacy method for backward compatibility)
   * @returns Array of all tasks
   * @deprecated Use getAllTasks with TaskOperationResult instead
   */
  async getAllTasksLegacy(): Promise<Task[]> {
    const result = await this.getAllTasks();
    return result.success ? result.data : [];
  }
  
  /**
   * Update a task
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

      // Validate status and readiness if provided
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

      // Check if task exists
      const taskResult = await this.getTask(options.id);
      if (!taskResult.success || !taskResult.data) {
        return {
          success: false,
          error: new TaskError(`Task with ID ${options.id} not found`, TaskErrorCode.NOT_FOUND)
        };
      }

      const updateData: Partial<Task> = {};

      if (options.title) updateData.title = options.title;

      // Handle description and body fields safely (they might not exist in older DB schemas)
      try {
        if (options.description !== undefined) updateData.description = options.description;
        if (options.body !== undefined) updateData.body = options.body;
      } catch (e) {
        logger.warn('Description/body fields not available', { message: 'Please run database migration.' });
      }

      if (options.status) updateData.status = options.status;
      if (options.readiness) updateData.readiness = options.readiness;
      if (options.tags) updateData.tags = options.tags;

      // Handle metadata as a special case for PATCH-style updates
      if (options.metadata !== undefined) {
        if (options.metadata === null) {
          updateData.metadata = {};
        } else if (validateMetadata(options.metadata)) {
          // Create a deep copy by using JSON serialization to ensure proper object structure
          // This prevents the "string key index" issue with objects
          let currentMetadata = {};

          try {
            // Make a proper deep copy of existing metadata to avoid reference issues
            if (taskResult.data.metadata) {
              currentMetadata = JSON.parse(JSON.stringify(taskResult.data.metadata));
            }
          } catch (e) {
            logger.warn('Error parsing existing metadata, using empty object', { error: e instanceof Error ? e.message : String(e) });
            // Continue with empty metadata if there's an error
          }

          // Merge with the new metadata (using spread operator for shallow merge)
          updateData.metadata = {
            ...currentMetadata,
            ...options.metadata
          };
        } else {
          return {
            success: false,
            error: new TaskError('Invalid metadata format', TaskErrorCode.INVALID_INPUT)
          };
        }
      }

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      if (Object.keys(updateData).length === 0) {
        return taskResult; // No changes, return existing task
      }

      await this.db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, options.id));

      // Get the updated task
      return await this.getTask(options.id);
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
   * Update a task (legacy method for backward compatibility)
   * @param options Task update options
   * @returns Updated task or undefined if not found
   * @deprecated Use updateTask with TaskOperationResult instead
   */
  async updateTaskLegacy(options: TaskUpdateOptions): Promise<Task | undefined> {
    const result = await this.updateTask(options);
    return result.success ? result.data : undefined;
  }
  
  /**
   * Remove a task
   * @param id Task ID to remove
   * @returns Operation result indicating success or failure
   */
  async removeTask(id: string): Promise<TaskOperationResult<boolean>> {
    try {
      // Input validation
      if (!id || typeof id !== 'string') {
        return {
          success: false,
          error: new TaskError('Invalid task ID provided', TaskErrorCode.INVALID_INPUT)
        };
      }

      // First, check if the task exists
      const taskResult = await this.getTask(id);
      if (!taskResult.success || !taskResult.data) {
        return {
          success: false,
          error: new TaskError(`Task with ID ${id} not found`, TaskErrorCode.NOT_FOUND)
        };
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

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Database error removing task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.DATABASE_ERROR
        )
      };
    }
  }

  /**
   * Remove a task (legacy method for backward compatibility)
   * @param id Task ID to remove
   * @returns true if successful, false if task not found
   * @deprecated Use removeTask with TaskOperationResult instead
   */
  async removeTaskLegacy(id: string): Promise<boolean> {
    const result = await this.removeTask(id);
    return result.success;
  }

  /**
   * Create a new task (basic implementation)
   * @param options Task creation options
   * @returns TaskOperationResult containing the created task or an error
   */
  async createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>> {
    try {
      if (!options.title) {
        return {
          success: false,
          error: new TaskError('Task title is required', TaskErrorCode.INVALID_INPUT)
        };
      }

      // Generate a simple ID if not part of hierarchical structure
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

      // Process the metadata to ensure proper JSON structure
      let metadataValue = {};

      if (options.metadata) {
        if (typeof options.metadata === 'string') {
          try {
            // If metadata is already a string, parse it
            metadataValue = JSON.parse(options.metadata);
          } catch (e) {
            logger.warn('Invalid JSON metadata string, using empty object', { source: 'createTask' });
          }
        } else {
          try {
            // Ensure proper serialization/deserialization to fix object structure
            metadataValue = JSON.parse(JSON.stringify(options.metadata));
          } catch (e) {
            logger.warn('Failed to process metadata, using empty object', { source: 'createTask' });
          }
        }
      }

      let newTask: NewTask = {
        id,
        title: options.title,
        status: options.status || 'todo',
        readiness: options.readiness || 'draft',
        tags: options.tags ? (Array.isArray(options.tags) ? options.tags : [options.tags]) : [],
        parentId: options.childOf || null,
        metadata: metadataValue,
      };

      // Add description and body fields safely
      try {
        newTask = {
          ...newTask,
          description: options.description || null,
          body: options.body || null
        };
      } catch (e) {
        logger.warn('Description/body fields not available', { message: 'Please run database migration.' });
      }

      await this.db.insert(tasks).values(newTask);

      // Get the created task
      return await this.getTask(id);
    } catch (error) {
      return {
        success: false,
        error: new TaskError(
          `Error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TaskErrorCode.GENERAL_ERROR
        )
      };
    }
  }
}