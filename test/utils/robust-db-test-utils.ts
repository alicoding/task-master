/**
 * Robust Database Test Utilities for Task Master
 * 
 * A comprehensive set of utilities for database testing that works with any component
 * and ensures reliable setup, isolation, and teardown of tests.
 */

import { join } from 'path';
import fs from 'fs';
import os from 'os';
import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

/**
 * Create a unique test database path
 */
export function createTestDbPath(): string {
  return join(os.tmpdir(), `test-tm-${Date.now()}.db`);
}

/**
 * Complete database connection information with both SQLite and Drizzle ORM
 */
export interface TestDatabase {
  sqlite: Database.Database;
  db: BetterSQLite3Database;
  path: string;
}

/**
 * Create and initialize an in-memory or file-based test database
 * 
 * @param inMemory Whether to use an in-memory database
 * @param dbPath Optional custom path (only used if inMemory is false)
 * @returns TestDatabase object with sqlite and drizzle instances
 */
export function initializeTestDb(inMemory: boolean = false, dbPath?: string): TestDatabase {
  const actualPath = inMemory ? ':memory:' : (dbPath || createTestDbPath());
  const sqlite = new Database(actualPath);
  
  // Create complete schema with all tables
  createCompleteSchema(sqlite);
  
  // Create drizzle ORM instance for components that expect it
  const db = drizzle(sqlite);
  
  console.log(`Test database initialized at: ${actualPath}`);
  return { sqlite, db, path: actualPath };
}

/**
 * Create all database tables needed for tests
 * 
 * @param sqlite SQLite database instance
 */
function createCompleteSchema(sqlite: Database.Database): void {
  try {
    // Check if schema already exists to avoid duplicate tables
    const hasSchema = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='tasks'
    `).get();
    
    if (hasSchema) {
      console.log('Schema already exists, skipping creation');
      return;
    }
    
    // Create tasks table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        parent_id TEXT,
        readiness TEXT,
        priority TEXT,
        tags TEXT,
        metadata TEXT,
        description_body TEXT,
        FOREIGN KEY (parent_id) REFERENCES tasks(id)
      )
    `);
    
    // Create dependencies table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS dependencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        depends_on_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (depends_on_id) REFERENCES tasks(id),
        UNIQUE(task_id, depends_on_id)
      )
    `);
    
    // Create files table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        hash TEXT NOT NULL,
        last_modified INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        file_type TEXT,
        metadata TEXT
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
    
    // Create definition_of_done table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS definition_of_done (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        dod_item TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      )
    `);
    
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
        metadata TEXT,
        status TEXT NOT NULL,
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
        status TEXT,
        metadata TEXT,
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
    
    // Create retroactive_assignments table
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
    
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

/**
 * Clean up test database file
 * 
 * @param dbPath Path to database file
 */
export function cleanupTestDb(dbPath: string): void {
  if (dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
      console.log(`Test database cleaned up: ${dbPath}`);
    } catch (error) {
      console.error(`Error cleaning up database ${dbPath}:`, error);
    }
  }
}

/**
 * Create a test task
 * 
 * @param sqlite SQLite database
 * @param id Task ID (optional, will generate one if not provided)
 * @param title Task title
 * @param status Task status
 * @returns Task ID
 */
export function createTestTask(
  sqlite: Database.Database,
  id?: string,
  title?: string,
  status: string = 'todo'
): string {
  const taskId = id || `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const now = Date.now();
  
  sqlite.prepare(`
    INSERT INTO tasks (
      id, title, description, status, created_at, updated_at, readiness, tags, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId,
    title || `Test Task ${taskId}`,
    '',
    status,
    now,
    now,
    'ready',
    '[]',
    '{}'
  );
  
  return taskId;
}

/**
 * Create a terminal session for testing
 * 
 * @param sqlite SQLite database
 * @param id Session ID (optional, will generate one if not provided)
 * @param tty TTY path
 * @param user User name
 * @returns Session ID
 */
export function createTestSession(
  sqlite: Database.Database,
  id?: string,
  tty: string = '/dev/ttys000',
  user: string = 'test-user'
): string {
  const sessionId = id || `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const now = Date.now();
  
  sqlite.prepare(`
    INSERT INTO terminal_sessions (
      id, tty, pid, ppid, user, shell, start_time, last_active, status, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    tty,
    12345,
    12340,
    user,
    '/bin/zsh',
    now,
    now,
    'active',
    '{}'
  );
  
  return sessionId;
}

/**
 * Create a test file
 * 
 * @param sqlite SQLite database
 * @param path File path
 * @param fileType File type
 * @returns File ID
 */
export function createTestFile(
  sqlite: Database.Database,
  path: string = `/test/file-${Date.now()}.ts`,
  fileType: string = 'ts'
): number {
  const now = Date.now();
  
  const result = sqlite.prepare(`
    INSERT INTO files (
      path, hash, last_modified, created_at, file_type, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    path,
    `hash-${Date.now()}`,
    now,
    now,
    fileType,
    '{}'
  );
  
  return result.lastInsertRowid as number;
}

/**
 * Create a time window
 * 
 * @param sqlite SQLite database
 * @param sessionId Session ID
 * @param id Window ID (optional)
 * @param options Window options
 * @returns Window ID
 */
export function createTimeWindow(
  sqlite: Database.Database,
  sessionId: string,
  id?: string,
  options: {
    name?: string;
    type?: string;
    status?: string;
    startTime?: number;
    endTime?: number;
    taskId?: string;
  } = {}
): string {
  const windowId = id || `window-${Date.now()}`;
  const now = Date.now();
  const startTime = options.startTime || (now - 3600000); // Default 1 hour ago
  const endTime = options.endTime || now;
  
  sqlite.prepare(`
    INSERT INTO time_windows (
      id, session_id, start_time, end_time, name, type, status, metadata, task_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    windowId,
    sessionId,
    startTime,
    endTime,
    options.name || `Window ${windowId}`,
    options.type || 'work',
    options.status || 'active',
    '{}',
    options.taskId || null
  );
  
  return windowId;
}

/**
 * Create a mock terminal fingerprint object for tests
 * 
 * @param options Optional property overrides
 * @returns Terminal fingerprint object
 */
export function createMockFingerprint(options: any = {}): any {
  return {
    tty: options.tty || '/dev/ttys000',
    pid: options.pid || 12345,
    ppid: options.ppid || 12340,
    user: options.user || 'test-user',
    shell: options.shell || '/bin/zsh',
    termEnv: options.termEnv || 'xterm-256color',
    sshConnection: options.sshConnection || null,
    ...options
  };
}

/**
 * Execute function within transaction and rollback after test
 * 
 * @param sqlite SQLite database
 * @param fn Function to execute
 */
export async function withTransaction<T>(
  sqlite: Database.Database,
  fn: () => Promise<T> | T
): Promise<T> {
  sqlite.exec('BEGIN TRANSACTION');
  try {
    const result = await fn();
    sqlite.exec('ROLLBACK'); // Always rollback for isolation
    return result;
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Class to help with making tests run safely in parallel and in isolation
 */
export class TestDatabaseFixture {
  public sqlite: Database.Database;
  public db: BetterSQLite3Database;
  public path: string;
  private testId: string;
  
  constructor(inMemory: boolean = true) {
    this.testId = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const { sqlite, db, path } = initializeTestDb(inMemory);
    this.sqlite = sqlite;
    this.db = db;
    this.path = path;
  }
  
  /**
   * Create a task with test-specific ID
   */
  createTask(options: any = {}): string {
    const id = options.id || `${this.testId}-task-${Date.now()}`;
    return createTestTask(
      this.sqlite,
      id,
      options.title || `Test Task ${id}`,
      options.status || 'todo'
    );
  }
  
  /**
   * Create a session with test-specific ID
   */
  createSession(options: any = {}): string {
    const id = options.id || `${this.testId}-session-${Date.now()}`;
    return createTestSession(
      this.sqlite,
      id,
      options.tty || '/dev/ttys000',
      options.user || 'test-user'
    );
  }
  
  /**
   * Create a file
   */
  createFile(options: any = {}): number {
    return createTestFile(
      this.sqlite,
      options.path || `/test/${this.testId}-file-${Date.now()}.ts`,
      options.fileType || 'ts'
    );
  }
  
  /**
   * Create a time window
   */
  createWindow(sessionId: string, options: any = {}): string {
    const id = options.id || `${this.testId}-window-${Date.now()}`;
    return createTimeWindow(this.sqlite, sessionId, id, options);
  }
  
  /**
   * Close database and clean up
   */
  cleanup(): void {
    try {
      this.sqlite.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
    cleanupTestDb(this.path);
  }
  
  /**
   * Run function in transaction
   */
  async withTransaction<T>(fn: () => Promise<T> | T): Promise<T> {
    return withTransaction(this.sqlite, fn);
  }
}