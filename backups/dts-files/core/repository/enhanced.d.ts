/**
 * Enhanced Task Repository
 *
 * Extends the base repository with optimized database operations,
 * caching, and improved performance for common task operations.
 */
import { BaseTaskRepository } from './base';
import { Task } from '../../db/schema';
import { TaskInsertOptions, TaskUpdateOptions, SearchFilters, TaskOperationResult } from '../types';
/**
 * EnhancedTaskRepository class with optimized database operations
 * that extends the base repository with caching and performance improvements
 */
export declare class EnhancedTaskRepository extends BaseTaskRepository {
    private optimizer;
    private cache;
    /**
     * Create a new EnhancedTaskRepository instance
     * @param dbPath Path to the database file (optional)
     * @param inMemory Whether to use an in-memory database (optional)
     */
    constructor(dbPath?: string, inMemory?: boolean);
    /**
     * Get a task by ID with optimized caching
     * @param id Task ID
     * @returns Task operation result
     */
    getTask(id: string): Promise<TaskOperationResult<Task>>;
    /**
     * Get multiple tasks by IDs in a single optimized query
     * @param ids Array of task IDs
     * @returns Operation result with array of tasks
     */
    getTasks(ids: string[]): Promise<TaskOperationResult<Task[]>>;
    /**
     * Get all tasks with optimized query and caching
     * @returns Operation result with array of all tasks
     */
    getAllTasks(): Promise<TaskOperationResult<Task[]>>;
    /**
     * Update a task with optimized database access
     * @param options Task update options
     * @returns Operation result with updated task
     */
    updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<Task>>;
    /**
     * Search for tasks with optimized query execution
     * @param filters Search filters
     * @returns Operation result with matching tasks
     */
    searchTasks(filters: SearchFilters): Promise<TaskOperationResult<Task[]>>;
    /**
     * Create a task with proper cache invalidation
     * @param options Task creation options
     * @returns Operation result with the created task
     */
    createTask(options: TaskInsertOptions): Promise<TaskOperationResult<Task>>;
    /**
     * Remove a task with proper cache invalidation
     * @param id Task ID to remove
     * @returns Operation result indicating success or failure
     */
    removeTask(id: string): Promise<TaskOperationResult<boolean>>;
    /**
     * Get the next tasks to work on
     * @param filters Optional filters to apply
     * @param count Number of tasks to return (default: 1)
     * @returns Operation result with the next tasks
     */
    getNextTasks(filters?: SearchFilters, count?: number): Promise<TaskOperationResult<Task[]>>;
    /**
     * Close database connection and clean up resources
     * @returns True if successful, false if there was an error
     */
    close(): boolean;
}
