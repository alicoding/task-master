/**
 * Isolated Test Runner for Task Master
 * 
 * This module provides a test runner that ensures proper isolation
 * for all tests, including database and event emitter isolation.
 */

import { afterEach, beforeEach, describe, it } from 'vitest';
import { createLogger } from '../../core/utils/logger';
import { 
  createTestContext,
  TestContext
} from './test-isolation-utils';

// Create logger
const logger = createLogger('IsolatedTestRunner');

/**
 * Test function with context
 */
type TestFn<T = void> = (context: TestContext) => Promise<T> | T;

/**
 * Options for isolated describe
 */
interface IsolatedDescribeOptions {
  /** Whether to use in-memory database */
  inMemory?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
  /** Additional setup function */
  setup?: (context: TestContext) => Promise<void> | void;
  /** Additional teardown function */
  teardown?: (context: TestContext) => Promise<void> | void;
}

/**
 * Define a test suite with proper isolation
 * 
 * @param name Test suite name
 * @param fn Test suite function
 * @param options Isolation options
 */
export function isolatedDescribe(
  name: string,
  fn: (context: TestContext) => void,
  options: IsolatedDescribeOptions = {}
): void {
  describe(name, () => {
    let context: TestContext;
    
    // Set up isolation before each test
    beforeEach(() => {
      context = createTestContext({
        inMemory: options.inMemory ?? true,
        applyMigrations: options.applyMigrations ?? true
      });
      
      logger.debug(`Test context created for: ${name}`);
      
      // Run additional setup if provided
      if (options.setup) {
        return options.setup(context);
      }
    });
    
    // Run the test suite with the context
    fn(context);
    
    // Clean up after each test
    afterEach(async () => {
      // Run additional teardown if provided
      if (options.teardown) {
        await options.teardown(context);
      }
      
      context.cleanup();
      logger.debug(`Test context cleaned up for: ${name}`);
    });
  });
}

/**
 * Define an isolated test with transaction support
 * 
 * @param name Test name
 * @param fn Test function
 */
export function isolatedTest(name: string, fn: TestFn): void {
  it(name, async () => {
    // Create a context just for this test
    const context = createTestContext();
    
    try {
      // Run test in transaction
      return await context.withTransaction(() => fn(context));
    } finally {
      // Clean up resources
      context.cleanup();
    }
  });
}

/**
 * Define a test suite for database operations with proper isolation
 * 
 * @param name Test suite name
 * @param fn Test suite function
 * @param options Isolation options
 */
export function dbTest(
  name: string,
  fn: (context: TestContext) => void,
  options: IsolatedDescribeOptions = {}
): void {
  // Set default options for database tests
  const dbOptions: IsolatedDescribeOptions = {
    inMemory: true,
    applyMigrations: true,
    ...options
  };
  
  // Run with database isolation
  isolatedDescribe(name, fn, dbOptions);
}

/**
 * Create a test that needs to work with files
 * 
 * @param name Test name
 * @param fn Test function
 */
export function fileTest(name: string, fn: TestFn): void {
  it(name, async () => {
    // Create a context with file tracking
    const context = createTestContext({
      applyMigrations: true
    });
    
    // Create file tracking tables
    const fileTrackingSchema = `
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        hash TEXT NOT NULL,
        last_modified INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        file_type TEXT,
        metadata TEXT DEFAULT '{}'
      );
      
      CREATE TABLE IF NOT EXISTS file_task_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        task_id TEXT NOT NULL,
        first_seen INTEGER NOT NULL,
        last_modified INTEGER NOT NULL,
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        UNIQUE(file_id, task_id)
      );
      
      CREATE TABLE IF NOT EXISTS file_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id INTEGER NOT NULL,
        task_id TEXT,
        change_type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        previous_hash TEXT,
        current_hash TEXT,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (file_id) REFERENCES files(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );
    `;
    
    // Create schema if needed
    try {
      context.dbFixture.sqlite.exec(fileTrackingSchema);
    } catch (error) {
      logger.debug('File tracking tables already exist');
    }
    
    try {
      // Run test in transaction
      return await context.withTransaction(() => fn(context));
    } finally {
      // Clean up resources
      context.cleanup();
    }
  });
}

/**
 * Create a test that needs terminal session support
 * 
 * @param name Test name
 * @param fn Test function
 */
export function terminalTest(name: string, fn: TestFn): void {
  it(name, async () => {
    // Create a context with terminal session support
    const context = createTestContext({
      applyMigrations: true
    });
    
    // Create terminal session tables
    const terminalSessionSchema = `
      CREATE TABLE IF NOT EXISTS terminal_sessions (
        id TEXT PRIMARY KEY,
        tty TEXT,
        pid INTEGER,
        ppid INTEGER,
        window_columns INTEGER,
        window_rows INTEGER,
        user TEXT,
        shell TEXT,
        metadata TEXT DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        start_time INTEGER NOT NULL,
        last_active INTEGER NOT NULL,
        last_disconnect INTEGER,
        last_recovery INTEGER,
        recovery_source TEXT,
        current_task_id TEXT,
        connection_count INTEGER DEFAULT 1,
        recovery_count INTEGER DEFAULT 0,
        FOREIGN KEY (current_task_id) REFERENCES tasks(id)
      );
      
      CREATE TABLE IF NOT EXISTS session_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        access_time INTEGER NOT NULL,
        access_count INTEGER DEFAULT 1,
        FOREIGN KEY (session_id) REFERENCES terminal_sessions(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        UNIQUE(session_id, task_id)
      );
      
      CREATE TABLE IF NOT EXISTS time_windows (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        name TEXT,
        type TEXT,
        status TEXT DEFAULT 'active',
        metadata TEXT DEFAULT '{}',
        task_id TEXT,
        FOREIGN KEY (session_id) REFERENCES terminal_sessions(id),
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );
    `;
    
    // Create schema if needed
    try {
      context.dbFixture.sqlite.exec(terminalSessionSchema);
    } catch (error) {
      logger.debug('Terminal session tables already exist');
    }
    
    try {
      // Run test in transaction
      return await context.withTransaction(() => fn(context));
    } finally {
      // Clean up resources
      context.cleanup();
    }
  });
}