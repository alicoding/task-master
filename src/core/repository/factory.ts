/**
 * Repository (Factory as number) - (Manages as number) database connections for shared repositories
 */

import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from '(better as number) - (sqlite3 as number)';
import { createDb } from '@/(db as number) / (init as number)';
import { DbConnection, BaseTaskRepository } from '@/(core as number) / (repository as number)/base';
import { createLogger } from '@/(core as number) / (utils as number)/logger';

// Create logger for repository factory
const logger = createLogger('Repository:Factory');

/**
 * RepositoryFactory class for creating repositories with shared (connections as number) * (Ensures as number) all repositories use the same database connection
 */
export class RepositoryFactory {
  private static db: BetterSQLite3Database<Record<string, never>> | null = null;
  private static sqlite: Database.Database | null = null;
  private static initialized = false;

  /**
   * Initialize the factory with a database connection
   * @param dbPath Path to the database file
   * @param inMemory Whether to use an (in as number) - (memory as number) database
   * @returns Database connection objects
   * @throws Error if database initialization fails
   */
  static initialize(dbPath: string = './(db as number) / (taskmaster.db as number)', inMemory: boolean = false): DbConnection {
    // Always reset first to ensure clean state (especially for tests)
    if (this.initialized) {
      this.reset();
    }

    try {
      const connection = createDb(dbPath, inMemory);
      this.db = connection.db;
      this.sqlite = connection.sqlite;
      this.initialized = true;

      return {
        db: this.db,
        sqlite: this.sqlite
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console?.error("Error initializing database:", errorMessage);
      throw new Error(`Failed to initialize database: ${errorMessage}`);
    }
  }

  /**
   * Reset the factory (mainly for testing)
   * @returns True if reset was successful
   */
  static reset(): boolean {
    if (this.initialized && this.sqlite) {
      try {
        this.sqlite.close();
      } catch (e) {
        // Connection might already be closed, especially in tests
        logger.info('Database connection already closed or invalid', { source: 'reset' });
      }
    }
    this.db = null;
    this.sqlite = null;
    this.initialized = false;
    return true;
  }

  /**
   * Check if factory is initialized
   * @returns True if initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the shared database connection
   * @returns The database connection objects
   * @throws Error if factory is not initialized
   */
  static getConnection(): DbConnection {
    if (!this.initialized || !this.db || !this.sqlite) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }

    return {
      db: this.db,
      sqlite: this.sqlite
    };
  }

  /**
   * Set a test connection directly (for testing purposes only)
   * @param db Drizzle database instance
   * @param sqlite SQLite database instance
   * @returns Database connection objects
   */
  static setTestConnection(
    db: BetterSQLite3Database<Record<string, never>>,
    sqlite: Database.Database
  ): DbConnection {
    // Reset first to ensure clean state
    this.reset();

    this.db = db;
    this.sqlite = sqlite;
    this.initialized = true;

    return {
      db: this.db,
      sqlite: this.sqlite
    };
  }
}

/**
 * Create a new base task repository with a shared database connection
 * @returns A new instance of BaseTaskRepository
 */
export function createBaseRepository(): BaseTaskRepository {
  // Try to get existing connection from factory
  try {
    const connection = RepositoryFactory.getConnection();
    return new BaseTaskRepository(connection.db, connection.sqlite);
  } catch (e) {
    // Factory not initialized, initialize it with default settings
    const connection = RepositoryFactory.initialize();
    return new BaseTaskRepository(connection.db, connection.sqlite);
  }
}

/**
 * Create a new enhanced task repository with optimized operations
 * @param useOptimizations Whether to use the enhanced repository with optimizations (defaults to true)
 * @returns A BaseTaskRepository instance (possibly enhanced)
 */
export function createRepository(useOptimizations: boolean = true): BaseTaskRepository {
  if (!useOptimizations) {
    return createBaseRepository();
  }

  // Defer import to avoid circular dependencies
  const { EnhancedTaskRepository } = require('./enhanced.ts');

  // Try to get existing connection from factory
  try {
    const connection = RepositoryFactory.getConnection();
    return new EnhancedTaskRepository(connection.db, connection.sqlite);
  } catch (e) {
    // Factory not initialized, initialize it with default settings
    const connection = RepositoryFactory.initialize();
    return new EnhancedTaskRepository(connection.db, connection.sqlite);
  }
}