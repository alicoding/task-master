/**
 * Optimized Database Operations
 *
 * This module provides optimized versions of database operations for
 * Task Master, implementing caching, batching, and other performance
 * improvements to reduce database load and improve response times.
 */
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { Task } from '../../db/schema';
import { TaskOperationResult, TaskUpdateOptions, SearchFilters } from '../types';
/**
 * Database operations cache manager
 */
export declare class DatabaseCache {
    private static instance;
    private cache;
    private defaultTtl;
    /**
     * Create a new DatabaseCache instance (private constructor for singleton)
     */
    private constructor();
    /**
     * Get the singleton instance
     * @returns The DatabaseCache instance
     */
    static getInstance(): DatabaseCache;
    /**
     * Set cache entry with custom TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds (optional, uses default if not specified)
     */
    set<T>(key: string, data: T, ttl?: number): void;
    /**
     * Get cached entry if available and not expired
     * @param key Cache key
     * @returns Cached data or undefined if not found or expired
     */
    get<T>(key: string): T | undefined;
    /**
     * Check if a key exists in the cache and is not expired
     * @param key Cache key
     * @returns True if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete a key from the cache
     * @param key Cache key
     * @returns True if key was found and deleted
     */
    delete(key: string): boolean;
    /**
     * Clear the entire cache
     */
    clear(): void;
    /**
     * Remove expired entries from the cache
     */
    private cleanupExpiredEntries;
    /**
     * Clear cache entries matching a prefix
     * @param prefix Key prefix to match
     */
    clearPrefix(prefix: string): void;
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
export declare class OptimizedDatabaseOperations {
    private db;
    private sqlite;
    private cache;
    private taskIdMap;
    /**
     * Create a new OptimizedDatabaseOperations instance
     * @param db Drizzle database instance
     * @param sqlite SQLite database instance
     */
    constructor(db: BetterSQLite3Database<Record<string, never>>, sqlite: Database.Database);
    /**
     * Get a task by ID with caching
     * @param id Task ID
     * @returns Task operation result with task data or error
     */
    getTask(id: string): Promise<TaskOperationResult<Task>>;
    /**
     * Get multiple tasks by IDs in a single query (with caching)
     * @param ids Array of task IDs
     * @returns TaskOperationResult with array of tasks
     */
    getTasks(ids: string[]): Promise<TaskOperationResult<Task[]>>;
    /**
     * Update a task with optimized database access
     * @param options Task update options
     * @returns Operation result with updated task or error
     */
    updateTask(options: TaskUpdateOptions): Promise<TaskOperationResult<Task>>;
    /**
     * Batch process multiple operations for better performance
     * @param operations Array of batch operations to process
     * @returns Results of all operations
     */
    batchProcess<T, R>(operations: BatchOperation<T>[]): Promise<TaskOperationResult<R[]>>;
    /**
     * Get all tasks with optimized query and caching
     * @returns Operation result with array of all tasks
     */
    getAllTasks(): Promise<TaskOperationResult<Task[]>>;
    /**
     * Search for tasks with optimized query execution
     * @param filters Search filters
     * @returns Operation result with matching tasks
     */
    searchTasks(filters: SearchFilters): Promise<TaskOperationResult<Task[]>>;
    /**
     * Clear all caches to ensure fresh data
     */
    clearCaches(): void;
}
