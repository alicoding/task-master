/**
 * Repository Factory
 * Manages database connections for shared repositories
 */
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { DbConnection, BaseTaskRepository } from './base';
/**
 * RepositoryFactory class for creating repositories with shared connections
 * Ensures all repositories use the same database connection
 */
export declare class RepositoryFactory {
    private static db;
    private static sqlite;
    private static initialized;
    /**
     * Initialize the factory with a database connection
     * @param dbPath Path to the database file
     * @param inMemory Whether to use an in-memory database
     * @returns Database connection objects
     * @throws Error if database initialization fails
     */
    static initialize(dbPath?: string, inMemory?: boolean): DbConnection;
    /**
     * Reset the factory (mainly for testing)
     * @returns True if reset was successful
     */
    static reset(): boolean;
    /**
     * Check if factory is initialized
     * @returns True if initialized
     */
    static isInitialized(): boolean;
    /**
     * Get the shared database connection
     * @returns The database connection objects
     * @throws Error if factory is not initialized
     */
    static getConnection(): DbConnection;
    /**
     * Set a test connection directly (for testing purposes only)
     * @param db Drizzle database instance
     * @param sqlite SQLite database instance
     * @returns Database connection objects
     */
    static setTestConnection(db: BetterSQLite3Database<Record<string, never>>, sqlite: Database.Database): DbConnection;
}
/**
 * Create a new base task repository with a shared database connection
 * @returns A new instance of BaseTaskRepository
 */
export declare function createBaseRepository(): BaseTaskRepository;
/**
 * Create a new enhanced task repository with optimized operations
 * @param useOptimizations Whether to use the enhanced repository with optimizations (defaults to true)
 * @returns A BaseTaskRepository instance (possibly enhanced)
 */
export declare function createRepository(useOptimizations?: boolean): BaseTaskRepository;
