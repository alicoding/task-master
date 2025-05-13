/**
 * Database Test Utilities for Task Master
 *
 * These utilities help with database initialization and setup for tests.
 * This version uses more robust implementations imported from detailed
 * utility modules for better test reliability.
 */

import path from 'path';
import fs from 'fs';
import { createLogger } from '../../core/utils/logger';
import {
  initializeTestDatabase,
  createTestDbPath,
  withTransaction
} from './robust-database-test-utils';
import {
  applySafeMigrations,
  createMinimalSchema,
  withDatabaseTransaction,
  tableExists,
  columnExists,
  dumpSchema
} from './test-migration-utils';

// Create logger
const logger = createLogger('DatabaseTestUtils');

// Re-export key utilities
export {
  createTestDbPath,
  withTransaction,
  tableExists,
  columnExists,
  dumpSchema
};

/**
 * Initialize a test database with all required schemas
 *
 * @param inMemory Whether to use in-memory database
 * @returns Database objects
 */
export async function initTestDb(inMemory: boolean = false) {
  logger.debug(`Initializing test database (in-memory: ${inMemory})`);

  try {
    // Use the robust implementation with error handling
    const fixture = initializeTestDatabase(inMemory, true);

    return {
      db: fixture.db,
      sqlite: fixture.sqlite,
      dbPath: inMemory ? undefined : fixture.path,

      // Add helper to clean up
      cleanup: () => {
        try {
          fixture.cleanup();
        } catch (error) {
          logger.error(`Error during database cleanup: ${error.message}`);
        }
      }
    };
  } catch (error) {
    logger.error(`Critical error initializing test database: ${error.message}`);

    // Create a fallback in-memory database as a last resort
    logger.debug('Creating fallback in-memory database');
    const fallbackFixture = initializeTestDatabase(true, false);

    return {
      db: fallbackFixture.db,
      sqlite: fallbackFixture.sqlite,
      dbPath: undefined,
      cleanup: () => {
        try {
          fallbackFixture.cleanup();
        } catch (error) {
          logger.error(`Error during fallback database cleanup: ${error.message}`);
        }
      }
    };
  }
}

/**
 * Apply all database migrations to ensure schema is complete
 * using the safer implementation
 *
 * @param sqlite SQLite database
 */
export async function applyAllMigrations(sqlite) {
  logger.debug('Applying all migrations safely');

  // Use the safer migration utility with proper path detection
  try {
    const migrationsPath = path.join(process.cwd(), 'db', 'migrations');
    if (!fs.existsSync(migrationsPath)) {
      logger.warn(`Migrations directory not found: ${migrationsPath}`);
      // Create minimal schema instead of using migration files
      createMinimalSchema(sqlite, ['tasks', 'dependencies', 'files', 'terminal_sessions', 'time_windows', 'definition_of_done']);
      return;
    }
    applySafeMigrations(sqlite, migrationsPath);
  } catch (error) {
    logger.error('Error applying migrations:', error);
    // Fall back to minimal schema on error
    createMinimalSchema(sqlite, ['tasks', 'dependencies', 'files', 'terminal_sessions', 'time_windows', 'definition_of_done']);
  }
}

/**
 * Clean up the database after tests
 *
 * @param dbPath Path to the test database
 */
export function cleanupTestDb(dbPath) {
  if (!dbPath || dbPath === ':memory:') {
    return;
  }

  try {
    // Use the cleanup method from the fixture
    logger.debug(`Cleaning up test database: ${dbPath}`);

    // The fixture.cleanup method handles this now, so this is just for backward compatibility
  } catch (error) {
    logger.error('Error cleaning up test database:', error);
  }
}

/**
 * Create a test task
 *
 * @param db Database
 * @param taskId Task ID
 * @param title Task title
 * @param parentId Optional parent task ID
 */
export async function createTestTask(db, taskId, title, parentId) {
  try {
    const stmt = db.connection.prepare(`
      INSERT INTO tasks (
        id, title, description, status, created_at, updated_at, parent_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().getTime();

    stmt.run(
      taskId,
      title,
      '',
      'todo',
      now,
      now,
      parentId || null
    );

    logger.debug(`Creating task with ID: ${taskId}, Parent ID: ${parentId || 'none'}, Title: ${title}`);
  } catch (error) {
    logger.error(`Error creating test task:`, error);
    throw error;
  }
}

/**
 * Create a test terminal session
 *
 * @param db Database
 * @param sessionId Session ID
 * @param options Session options
 */
export async function createTestTerminalSession(db, sessionId, options = {}) {
  try {
    const stmt = db.connection.prepare(`
      INSERT INTO terminal_sessions (
        id, tty, pid, ppid, user, shell, status,
        connection_count, start_time, last_active, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().getTime();

    stmt.run(
      sessionId,
      options.tty || '/dev/test-tty',
      options.pid || 12345,
      options.ppid || 12340,
      options.user || 'test-user',
      options.shell || 'bash',
      options.status || 'active',
      options.connectionCount || 1,
      now,
      now,
      JSON.stringify(options.metadata || {})
    );

    logger.debug(`Created test session: ${sessionId}`);
  } catch (error) {
    logger.error(`Error creating test session:`, error);
    throw error;
  }
}