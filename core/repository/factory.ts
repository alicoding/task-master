/**
 * Repository Factory
 * Manages database connections for shared repositories
 */

import { createDb } from '../../db/init.js';

/**
 * RepositoryFactory class for creating repositories with shared connections
 * Ensures all repositories use the same database connection
 */
export class RepositoryFactory {
  private static db;
  private static sqlite;
  private static initialized = false;
  
  /**
   * Initialize the factory with a database connection
   * @param dbPath Path to the database file
   * @param inMemory Whether to use an in-memory database
   * @returns Database connection objects
   */
  static initialize(dbPath: string = './db/taskmaster.db', inMemory: boolean = false) {
    // Always reset first to ensure clean state (especially for tests)
    if (this.initialized) {
      this.reset();
    }

    try {
      const connection = createDb(dbPath, inMemory);
      this.db = connection.db;
      this.sqlite = connection.sqlite;
      this.initialized = true;
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }

    return { db: this.db, sqlite: this.sqlite };
  }
  
  /**
   * Reset the factory (mainly for testing)
   */
  static reset() {
    if (this.initialized && this.sqlite) {
      try {
        this.sqlite.close();
      } catch (e) {
        // Connection might already be closed, especially in tests
        console.log('Info: Database connection already closed or invalid');
      }
    }
    this.db = null;
    this.sqlite = null;
    this.initialized = false;
  }

  /**
   * Check if factory is initialized
   */
  static isInitialized() {
    return this.initialized;
  }
  
  /**
   * Get the shared database connection
   * @returns The database connection objects
   */
  static getConnection() {
    if (!this.initialized) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return { db: this.db, sqlite: this.sqlite };
  }
}