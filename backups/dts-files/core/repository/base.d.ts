import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { Task } from '../../db/schema';
import { TaskInsertOptions, TaskUpdateOptions, TaskOperationResult } from '../types';
/**
 * Database connection type
 */
export interface DbConnection {
    db: BetterSQLite3Database<Record<string, never>>;
    sqlite: Database.Database;
}
export declare class BaseTaskRepository {
    protected db: BetterSQLite3Database<Record<string, never>>;
    protected sqlite: Database.Database;
    get _db(): BetterSQLite3Database<Record<string, never>>;
    get _sqlite(): Database.Database;
    /**
     * Create a new TaskRepository instance
     * @param dbOrPath Either a database instance or path to database file
     * @param sqliteOrMemory Either a SQLite instance or boolean flag for in-memory database
     */
    constructor(dbOrPath?: string | BetterSQLite3Database<Record<string, never>>, sqliteOrMemory?: boolean | Database.Database);
    /**
     * Register this repository for cleanup on process exit
     * @private
     */
    private registerForCleanup;
    /**
     * Close database connection when done
     * @returns True if successful, false if there was an error
     */
    close(): boolean;
    /**
     * Get a task by ID
     * @param id Task ID
     * @returns A typed result with the task or error information
     */
    getTask(id: string): Promise<TaskOperationResult<Task>>;
    /**
     * Get a task by ID (legacy method for backward compatibility)
     * @param id Task ID
     * @returns Task or undefined if not found
     * @deprecated Use getTask with TaskOperationResult instead
     */
    getTaskLegacy(id: string): Promise<Task | undefined>;
    /**
     * Get all tasks
     * @returns Task operation result with array of all tasks
     */
    getAllTasks(): Promise<TaskOperationResult<Task[]>>;
    /**
     * Get all tasks (legacy method for backward compatibility)
     * @returns Array of all tasks
     * @deprecated Use getAllTasks with TaskOperationResult instead
     */
    getAllTasksLegacy(): Promise<Task[]>;
    /**
     * Update a task
     * @param options Task update options
     * @returns Operation result with updated task or error
     */
    updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<Task>>;
    /**
     * Update a task (legacy method for backward compatibility)
     * @param options Task update options
     * @returns Updated task or undefined if not found
     * @deprecated Use updateTask with TaskOperationResult instead
     */
    updateTaskLegacy(options: TaskUpdateOptions): Promise<Task | undefined>;
    /**
     * Remove a task
     * @param id Task ID to remove
     * @returns Operation result indicating success or failure
     */
    removeTask(id: string): Promise<TaskOperationResult<boolean>>;
    /**
     * Remove a task (legacy method for backward compatibility)
     * @param id Task ID to remove
     * @returns true if successful, false if task not found
     * @deprecated Use removeTask with TaskOperationResult instead
     */
    removeTaskLegacy(id: string): Promise<boolean>;
    /**
     * Create a new task (basic implementation)
     * @param options Task creation options
     * @returns TaskOperationResult containing the created task or an error
     */
    createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>>;
}
