/**
 * Test Migration Utilities for Task Master
 * 
 * These utilities help with safely running migrations during tests,
 * preventing the "table already exists" errors and ensuring proper cleanup.
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { createLogger } from '../../core/utils/logger';

// Create logger
const logger = createLogger('TestMigrationUtils');

/**
 * Migration option interface
 */
interface MigrationOptions {
  /** Migration name/identifier */
  name: string;
  /** SQL content */
  sql: string;
  /** Check function to determine if migration needs to be applied */
  checkFn: (db: Database.Database) => boolean;
}

/**
 * Apply all migrations to a database in a safe manner
 * 
 * @param db SQLite database
 * @param migrationsPath Path to migration files
 */
export function applySafeMigrations(
  db: Database.Database,
  migrationsPath: string = path.join(process.cwd(), 'db', 'migrations')
): void {
  try {
    // Begin transaction
    db.exec('BEGIN TRANSACTION');
    
    // Define standard migrations with their checks
    const standardMigrations: MigrationOptions[] = [
      {
        name: 'Core Tables',
        sql: fs.readFileSync(path.join(migrationsPath, '0000_previous_purifiers.sql'), 'utf-8'),
        checkFn: (db) => tableExists(db, 'tasks')
      },
      {
        name: 'Description Body',
        sql: fs.readFileSync(path.join(migrationsPath, '0001_task_description_body.sql'), 'utf-8'),
        checkFn: (db) => columnExists(db, 'tasks', 'body')
      },
      {
        name: 'File Tracking',
        sql: fs.readFileSync(path.join(migrationsPath, '0002_file_tracking_tables.sql'), 'utf-8'),
        checkFn: (db) => tableExists(db, 'files')
      },
      {
        name: 'Definition of Done',
        sql: fs.readFileSync(path.join(migrationsPath, '0003_definition_of_done.sql'), 'utf-8'),
        checkFn: (db) => tableExists(db, 'definition_of_done')
      },
      {
        name: 'Terminal Sessions',
        sql: fs.readFileSync(path.join(migrationsPath, '0004_terminal_sessions.sql'), 'utf-8'),
        checkFn: (db) => tableExists(db, 'terminal_sessions')
      },
      {
        name: 'Session Recovery',
        sql: fs.readFileSync(path.join(migrationsPath, '0005_session_recovery.sql'), 'utf-8'),
        checkFn: (db) => tableExists(db, 'retroactive_assignments')
      }
    ];
    
    // Apply migrations safely
    for (const migration of standardMigrations) {
      applyMigrationIfNeeded(db, migration);
    }
    
    // Commit transaction
    db.exec('COMMIT');
    logger.debug('Migrations applied successfully');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    logger.error('Error applying migrations:', error);
    throw error;
  }
}

/**
 * Apply a migration only if needed
 * 
 * @param db SQLite database
 * @param migration Migration to apply
 */
function applyMigrationIfNeeded(db: Database.Database, migration: MigrationOptions): void {
  try {
    // Check if migration is needed
    const alreadyApplied = migration.checkFn(db);
    
    if (alreadyApplied) {
      logger.debug(`Migration '${migration.name}' already applied, skipping`);
      return;
    }
    
    // Apply migration
    logger.debug(`Applying migration: ${migration.name}`);
    
    // Split SQL by semicolon to handle multiple statements
    const statements = migration.sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        // Modify CREATE TABLE statements to use IF NOT EXISTS
        if (statement.trim().toUpperCase().startsWith('CREATE TABLE') &&
            !statement.trim().toUpperCase().includes('IF NOT EXISTS')) {
          // Insert IF NOT EXISTS after CREATE TABLE
          statement = statement.replace(
            /CREATE\s+TABLE\s+(`?\w+`?)/i,
            'CREATE TABLE IF NOT EXISTS $1'
          );
        }

        db.exec(statement);
      } catch (err) {
        // Some errors are expected, especially when tables already exist
        if (err.message.includes('already exists') ||
            err.message.includes('no such column') ||
            err.message.includes('duplicate column name')) {
          logger.debug(`Skipping statement due to expected error: ${err.message}`);
        } else {
          throw err;
        }
      }
    }
  } catch (error) {
    logger.error(`Error applying migration '${migration.name}':`, error);
    throw error;
  }
}

/**
 * Check if a table exists in the database
 * 
 * @param db SQLite database
 * @param tableName Table name to check
 * @returns Whether the table exists
 */
export function tableExists(db: Database.Database, tableName: string): boolean {
  const result = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `).get(tableName);
  
  return !!result;
}

/**
 * Check if a column exists in a table
 * 
 * @param db SQLite database
 * @param tableName Table name to check
 * @param columnName Column name to check
 * @returns Whether the column exists
 */
export function columnExists(db: Database.Database, tableName: string, columnName: string): boolean {
  try {
    const result = db.prepare(`
      SELECT name FROM pragma_table_info(?)
      WHERE name=?
    `).get(tableName, columnName);
    
    return !!result;
  } catch (error) {
    // If the table doesn't exist, the column doesn't exist either
    if (error.message.includes('no such table')) {
      return false;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Create a minimal schema with just the essential tables for a specific test
 * 
 * @param db SQLite database
 * @param tables Tables to create
 */
export function createMinimalSchema(
  db: Database.Database,
  tables: ('tasks' | 'dependencies' | 'files' | 'terminal_sessions' | 'time_windows' | 'definition_of_done')[]
): void {
  try {
    // Begin transaction
    db.exec('BEGIN TRANSACTION');
    
    // Create tasks table if needed
    if (tables.includes('tasks') && !tableExists(db, 'tasks')) {
      db.exec(`
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          body TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          parent_id TEXT REFERENCES tasks(id),
          readiness TEXT DEFAULT 'draft',
          tags TEXT DEFAULT '[]',
          metadata TEXT DEFAULT '{}'
        )
      `);
    }
    
    // Create dependencies table if needed
    if (tables.includes('dependencies') && !tableExists(db, 'dependencies')) {
      db.exec(`
        CREATE TABLE dependencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_task_id TEXT NOT NULL REFERENCES tasks(id),
          to_task_id TEXT NOT NULL REFERENCES tasks(id),
          type TEXT NOT NULL DEFAULT 'blocks'
        )
      `);
    }
    
    // Create files-related tables if needed
    if (tables.includes('files') && !tableExists(db, 'files')) {
      db.exec(`
        CREATE TABLE files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          hash TEXT NOT NULL,
          last_modified INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          file_type TEXT,
          metadata TEXT DEFAULT '{}'
        )
      `);
      
      db.exec(`
        CREATE TABLE file_task_mapping (
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
    }
    
    // Create terminal session tables if needed
    if (tables.includes('terminal_sessions') && !tableExists(db, 'terminal_sessions')) {
      db.exec(`
        CREATE TABLE terminal_sessions (
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
      
      db.exec(`
        CREATE TABLE session_tasks (
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
    }
    
    // Create time windows table if needed
    if (tables.includes('time_windows') && !tableExists(db, 'time_windows')) {
      db.exec(`
        CREATE TABLE time_windows (
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
    }
    
    // Create definition of done table if needed
    if (tables.includes('definition_of_done') && !tableExists(db, 'definition_of_done')) {
      db.exec(`
        CREATE TABLE definition_of_done (
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
    
    // Commit transaction
    db.exec('COMMIT');
    logger.debug('Minimal schema created successfully');
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    logger.error('Error creating minimal schema:', error);
    throw error;
  }
}

/**
 * Execute database operation safely inside transaction with automatic rollback
 * 
 * @param db SQLite database
 * @param operation Function to execute
 * @returns Result of the operation
 */
export async function withDatabaseTransaction<T>(
  db: Database.Database,
  operation: () => Promise<T>
): Promise<T> {
  db.exec('BEGIN TRANSACTION');
  
  try {
    const result = await operation();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Utility to dump the schema of a database for debugging
 * 
 * @param db SQLite database
 * @returns Schema information
 */
export function dumpSchema(db: Database.Database): string {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all();
  
  let output = 'Database Schema:\n';
  
  for (const table of tables) {
    output += `\nTable: ${table.name}\n`;
    
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    for (const column of columns) {
      output += `  - ${column.name} (${column.type})${column.pk ? ' PRIMARY KEY' : ''}\n`;
    }
  }
  
  return output;
}