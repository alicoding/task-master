/**
 * Robust Database Test Utilities for Task Master
 * 
 * This module provides improved database utilities for testing with:
 * - Safe migration handling to prevent "table already exists" errors
 * - Transaction support for test isolation
 * - Proper database cleanup and resource management
 * - Consistent error handling
 */

import { join } from 'path';
import fs from 'fs';
import os from 'os';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';
// Import only core schema without file tracking and terminal extensions
import { createLogger } from '../../core/utils/logger';

// Create logger for database operations
const logger = createLogger('DatabaseTestUtils');

/**
 * Create a unique test database path
 */
export function createTestDbPath(): string {
  return join(os.tmpdir(), `test-tm-${Date.now()}-${Math.floor(Math.random() * 10000)}.db`);
}

/**
 * Database test fixture with improved isolation and transaction support
 */
export interface TestDatabaseFixture {
  db: BetterSQLite3Database;
  sqlite: Database.Database;
  path: string;
  cleanup: () => void;
  inTransaction: boolean;
  beginTransaction: () => void;
  commitTransaction: () => void;
  rollbackTransaction: () => void;
  createTask: (options: any) => string;
  createSession: (options: any) => string;
  createFile: (options: any) => number;
  createTimeWindow: (sessionId: string, options: any) => string;
  withTransaction: <T>(fn: () => Promise<T> | T) => Promise<T>;
}

/**
 * Initialize test database with safe migrations and return a fixture
 * 
 * @param inMemory Whether to use in-memory database
 * @param applyMigrations Whether to apply migrations
 * @returns Test database fixture
 */
export function initializeTestDatabase(
  inMemory: boolean = true,
  applyMigrations: boolean = true
): TestDatabaseFixture {
  // Create database path or use in-memory
  const dbPath = inMemory ? ':memory:' : createTestDbPath();
  
  try {
    // Initialize SQLite database
    const sqlite = new Database(dbPath, { verbose: process.env.DEBUG_SQL === 'true' ? console.log : undefined });
    
    // First create the Drizzle ORM wrapper - only use core schema
    const db = drizzle(sqlite, {
      schema: {
        tasks: schema.tasks,
        dependencies: schema.dependencies
      }
    });
    
    // Apply migrations if requested, with improved error handling
    if (applyMigrations) {
      try {
        applySafeMigrations(sqlite);
      } catch (err) {
        logger.error(`Error applying migrations during initialization: ${err.message}`);
        // Fall back to minimal schema creation on failure
        try {
          createMinimalSchema(sqlite, ['tasks', 'dependencies', 'files', 'terminal_sessions', 'time_windows', 'definition_of_done']);
          logger.debug('Created minimal schema as fallback after migration failure');
        } catch (schemaErr) {
          logger.error(`Error creating minimal schema: ${schemaErr.message}`);
        }
      }
    }
    
    // Transaction state
    let inTransaction = false;
    
    // Create fixture object with helper methods
    const fixture: TestDatabaseFixture = {
      db,
      sqlite,
      path: dbPath,
      inTransaction,
      
      // Clean up resources
      cleanup: () => {
        try {
          // Roll back any active transaction
          if (inTransaction) {
            sqlite.exec('ROLLBACK');
            inTransaction = false;
          }
          
          // Close the database connection
          sqlite.close();
          
          // Remove database file if not in-memory
          if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            logger.debug(`Test database cleaned up: ${dbPath}`);
          }
        } catch (err) {
          logger.error(`Error cleaning up database: ${err}`);
        }
      },
      
      // Transaction management methods
      beginTransaction: () => {
        if (!inTransaction) {
          sqlite.exec('BEGIN TRANSACTION');
          inTransaction = true;
        }
      },
      
      commitTransaction: () => {
        if (inTransaction) {
          sqlite.exec('COMMIT');
          inTransaction = false;
        }
      },
      
      rollbackTransaction: () => {
        if (inTransaction) {
          sqlite.exec('ROLLBACK');
          inTransaction = false;
        }
      },
      
      // Execute function within transaction with automatic rollback
      withTransaction: async <T>(fn: () => Promise<T> | T): Promise<T> => {
        fixture.beginTransaction();
        try {
          const result = await fn();
          fixture.commitTransaction();
          return result;
        } catch (error) {
          fixture.rollbackTransaction();
          throw error;
        }
      },
      
      // Utility to create a task for testing
      createTask: (options: any = {}): string => {
        const id = options.id || `test-task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const now = Date.now();
        
        sqlite.prepare(`
          INSERT INTO tasks (
            id, title, description, status, created_at, updated_at, parent_id, 
            readiness, tags, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          options.title || `Test Task ${id}`,
          options.description || '',
          options.status || 'todo',
          now,
          now,
          options.parentId || null,
          options.readiness || 'ready',
          JSON.stringify(options.tags || []),
          JSON.stringify(options.metadata || {})
        );
        
        logger.debug(`Created test task: ${id}`);
        return id;
      },
      
      // Utility to create a session for testing
      createSession: (options: any = {}): string => {
        const id = options.id || `test-session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const now = Date.now();
        
        sqlite.prepare(`
          INSERT INTO terminal_sessions (
            id, tty, pid, ppid, user, shell, start_time, last_active,
            status, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          options.tty || '/dev/test-tty',
          options.pid || 12345,
          options.ppid || 12340,
          options.user || 'test-user',
          options.shell || '/bin/bash',
          now,
          now,
          options.status || 'active',
          JSON.stringify(options.metadata || {})
        );
        
        logger.debug(`Created test session: ${id}`);
        return id;
      },
      
      // Utility to create a file for testing
      createFile: (options: any = {}): number => {
        const now = Date.now();
        const filePath = options.path || `/test/path/file-${Date.now()}.ts`;
        
        const result = sqlite.prepare(`
          INSERT INTO files (
            path, hash, last_modified, created_at, file_type, metadata
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          filePath,
          options.hash || `hash-${Date.now()}`,
          now,
          now,
          options.fileType || 'ts',
          JSON.stringify(options.metadata || {})
        );
        
        const fileId = result.lastInsertRowid as number;
        logger.debug(`Created test file: ${fileId} (${filePath})`);
        return fileId;
      },
      
      // Utility to create a time window for testing
      createTimeWindow: (sessionId: string, options: any = {}): string => {
        const id = options.id || `test-window-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const now = Date.now();
        const startTime = options.startTime || (now - 3600000); // 1 hour ago
        const endTime = options.endTime || now;
        
        sqlite.prepare(`
          INSERT INTO time_windows (
            id, session_id, start_time, end_time, name, type, status, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          sessionId,
          startTime,
          endTime,
          options.name || `Test Window`,
          options.type || 'work',
          options.status || 'active',
          JSON.stringify(options.metadata || {})
        );
        
        logger.debug(`Created test time window: ${id}`);
        return id;
      }
    };
    
    logger.debug(`Test database initialized at: ${dbPath}`);
    return fixture;
  } catch (error) {
    logger.error(`Error initializing test database: ${error}`);
    throw error;
  }
}

/**
 * Apply migrations in a safe way that prevents "table already exists" errors
 * 
 * @param sqlite SQLite database connection
 */
function applySafeMigrations(sqlite: Database.Database): void {
  try {
    // Begin transaction for atomic migration
    sqlite.exec('BEGIN TRANSACTION');
    
    // Check for existing schema to avoid duplicate table creation
    const tasksTable = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='tasks'
    `).get();
    
    if (tasksTable) {
      logger.debug('Core schema already exists, skipping basic table creation');
    } else {
      logger.debug('Applying core tables schema');
      
      // Create tasks table
      try {
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            parent_id TEXT REFERENCES tasks(id),
            readiness TEXT DEFAULT 'draft',
            tags TEXT DEFAULT '[]',
            metadata TEXT DEFAULT '{}'
          )
        `);
      } catch (err) {
        logger.debug(`Skipping tasks table creation: ${err.message}`);
      }

      // Create dependencies table
      try {
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS dependencies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_task_id TEXT NOT NULL REFERENCES tasks(id),
            to_task_id TEXT NOT NULL REFERENCES tasks(id),
            type TEXT NOT NULL DEFAULT 'blocks'
          )
        `);
      } catch (err) {
        logger.debug(`Skipping dependencies table creation: ${err.message}`);
      }
    }
    
    // Apply migrations one by one, checking if they're needed
    applyMigrationIfNeeded(sqlite, 'description_body', `
      ALTER TABLE tasks ADD COLUMN body TEXT;
    `);
    
    // File tracking tables
    if (!tableExists(sqlite, 'files')) {
      logger.debug('Applying file tracking tables schema');
      
      // Create files table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          hash TEXT NOT NULL,
          last_modified INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          file_type TEXT,
          metadata TEXT DEFAULT '{}'
        )
      `);
      
      // Create file_task_mapping table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS file_task_mapping (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER NOT NULL,
          task_id TEXT NOT NULL,
          first_seen INTEGER NOT NULL,
          last_modified INTEGER NOT NULL,
          FOREIGN KEY (file_id) REFERENCES files(id),
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          UNIQUE(file_id, task_id)
        )
      `);
      
      // Create task_files table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS task_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL,
          file_id INTEGER NOT NULL,
          relationship_type TEXT DEFAULT 'related',
          confidence INTEGER DEFAULT 100,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          metadata TEXT DEFAULT '{}',
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          FOREIGN KEY (file_id) REFERENCES files(id),
          UNIQUE(task_id, file_id, relationship_type)
        )
      `);
      
      // Create file_changes table
      sqlite.exec(`
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
        )
      `);
    }
    
    // Definition of done tables
    if (!tableExists(sqlite, 'definition_of_done')) {
      logger.debug('Applying definition of done schema');
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS definition_of_done (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id TEXT NOT NULL,
          dod_item TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
      `);
    }
    
    // Terminal sessions tables
    if (!tableExists(sqlite, 'terminal_sessions')) {
      logger.debug('Applying terminal sessions schema');
      
      // Create terminal_sessions table
      sqlite.exec(`
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
        )
      `);
      
      // Create session_tasks table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS session_tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          task_id TEXT NOT NULL,
          access_time INTEGER NOT NULL,
          access_count INTEGER DEFAULT 1,
          FOREIGN KEY (session_id) REFERENCES terminal_sessions(id),
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          UNIQUE(session_id, task_id)
        )
      `);
      
      // Create time_windows table
      sqlite.exec(`
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
        )
      `);
      
      // Create file_session_mapping table
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS file_session_mapping (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_id INTEGER NOT NULL,
          session_id TEXT NOT NULL,
          first_seen INTEGER NOT NULL,
          last_modified INTEGER NOT NULL,
          FOREIGN KEY (file_id) REFERENCES files(id),
          FOREIGN KEY (session_id) REFERENCES terminal_sessions(id),
          UNIQUE(file_id, session_id)
        )
      `);
    }
    
    // Session recovery tables
    if (!tableExists(sqlite, 'retroactive_assignments')) {
      logger.debug('Applying session recovery schema');
      
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS retroactive_assignments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          task_id TEXT NOT NULL,
          window_id TEXT NOT NULL,
          assigned_at INTEGER NOT NULL,
          FOREIGN KEY (session_id) REFERENCES terminal_sessions(id),
          FOREIGN KEY (task_id) REFERENCES tasks(id),
          FOREIGN KEY (window_id) REFERENCES time_windows(id),
          UNIQUE(session_id, task_id, window_id)
        )
      `);
    }
    
    // Commit all migrations
    sqlite.exec('COMMIT');
    logger.debug('Database schema created successfully');
  } catch (error) {
    // Roll back on error
    sqlite.exec('ROLLBACK');
    logger.error('Error creating schema:', error);
    throw error;
  }
}

/**
 * Check if a table exists in the database
 * 
 * @param sqlite SQLite database connection
 * @param tableName Name of the table to check
 * @returns Whether the table exists
 */
function tableExists(sqlite: Database.Database, tableName: string): boolean {
  const result = sqlite.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `).get(tableName);
  
  return !!result;
}

/**
 * Apply a migration if the specified table or column doesn't exist yet
 * 
 * @param sqlite SQLite database connection
 * @param identifier Unique identifier for the migration
 * @param sql SQL to execute for the migration
 */
function applyMigrationIfNeeded(
  sqlite: Database.Database,
  identifier: string,
  sql: string
): void {
  // First check if migration has already been applied
  // You could use a migrations table for this, but for simplicity
  // we're checking for the presence of specific tables or columns
  
  try {
    if (identifier === 'description_body') {
      // Check if 'body' column exists in tasks table
      const hasBodyColumn = sqlite.prepare(`
        SELECT name FROM pragma_table_info('tasks') 
        WHERE name='body'
      `).get();
      
      if (!hasBodyColumn) {
        logger.debug(`Applying migration: ${identifier}`);
        sqlite.exec(sql);
      } else {
        logger.debug(`Migration already applied: ${identifier}`);
      }
    } else {
      // Generic table existence check
      const exists = tableExists(sqlite, identifier);
      
      if (!exists) {
        logger.debug(`Applying migration: ${identifier}`);
        sqlite.exec(sql);
      } else {
        logger.debug(`Migration already applied: ${identifier}`);
      }
    }
  } catch (error) {
    logger.error(`Error applying migration ${identifier}:`, error);
    throw error;
  }
}

/**
 * Execute a function with transaction handling
 * 
 * @param sqlite SQLite database connection
 * @param fn Function to execute
 * @returns Result of the function
 */
export async function withTransaction<T>(
  sqlite: Database.Database,
  fn: () => Promise<T> | T
): Promise<T> {
  sqlite.exec('BEGIN TRANSACTION');
  try {
    const result = await fn();
    sqlite.exec('ROLLBACK'); // Always rollback for test isolation
    return result;
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Create a mock fingerprint for terminal sessions
 * 
 * @param overrides Properties to override in the fingerprint
 * @returns Mock terminal fingerprint
 */
export function createMockFingerprint(overrides: any = {}): any {
  return {
    tty: overrides.tty || '/dev/ttys000',
    pid: overrides.pid || 12345,
    ppid: overrides.ppid || 12340,
    user: overrides.user || 'test-user',
    shell: overrides.shell || '/bin/zsh',
    termEnv: overrides.termEnv || 'xterm-256color',
    sshConnection: overrides.sshConnection || null,
    ...overrides
  };
}