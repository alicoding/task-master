/**
 * Terminal Session Test Utilities
 * 
 * This file provides comprehensive test utilities for terminal session testing:
 * - Database initialization with terminal session tables
 * - Mock implementations of terminal environment detection
 * - Factory functions for creating test sessions, tasks, and file associations
 * - Utility functions for cleanup and verification
 * 
 * These utilities work with the project's DrizzleORM and BetterSQLite3 setup.
 */

import { randomUUID } from 'crypto';
import { join } from 'path';
import fs from 'fs';
import os from 'os';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Import schema definitions
import { 
  tasks as tasksSchema,
  NewTask
} from '../../db/schema.ts';
import {
  terminalSessions,
  sessionTasks,
  fileSessionMapping,
  timeWindows,
  retroactiveAssignments,
  files,
  NewTerminalSession,
  NewFile,
  NewSessionTask,
  NewTimeWindow,
  NewFileSessionMap,
  NewRetroactiveAssignment
} from '../../db/schema-extensions.ts';
import { createDb } from '../../db/init.ts';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { 
  TerminalFingerprint, 
  TerminalSessionState, 
  SessionActivityType,
  TerminalDetectionResult
} from '../../core/terminal/terminal-session-types.ts';

/**
 * Create a temporary database path for testing
 * @returns A temporary file path for a test database
 */
export function createTestDbPath(): string {
  return join(os.tmpdir(), `test-terminal-session-${Date.now()}-${Math.floor(Math.random() * 10000)}.db`);
}

/**
 * Initializes a test database with all required terminal session tables
 * @param inMemory Whether to use an in-memory database (default: true)
 * @param dbPath Optional path to use for a file-based database
 * @returns An object with the Drizzle DB instance and SQLite connection
 */
export function initializeTerminalTestDB(inMemory: boolean = true, dbPath?: string): {
  db: BetterSQLite3Database;
  sqlite: Database;
  path: string;
} {
  // Use in-memory database or a temporary file path
  const path = inMemory ? ':memory:' : (dbPath || createTestDbPath());

  // Create a SQLite connection directly, instead of using createDb
  const sqlite = new Database(path);

  // Create the tasks table first (required for foreign key references)
  const createTasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      body TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      readiness TEXT NOT NULL DEFAULT 'draft',
      tags TEXT DEFAULT '[]',
      parent_id TEXT REFERENCES tasks(id),
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createTasksTable);

  // Create dependencies table
  const createDependenciesTable = `
    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task_id TEXT NOT NULL REFERENCES tasks(id),
      to_task_id TEXT NOT NULL REFERENCES tasks(id),
      type TEXT NOT NULL
    )
  `;
  sqlite.exec(createDependenciesTable);

  // Create files table
  const createFilesTable = `
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      hash TEXT NOT NULL,
      last_modified INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      file_type TEXT,
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createFilesTable);

  // Create terminal_sessions table
  const createTerminalSessionsTable = `
    CREATE TABLE IF NOT EXISTS terminal_sessions (
      id TEXT PRIMARY KEY,
      tty TEXT,
      pid INTEGER,
      ppid INTEGER,
      window_columns INTEGER,
      window_rows INTEGER,
      user TEXT,
      shell TEXT,
      start_time INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      current_task_id TEXT REFERENCES tasks(id),
      connection_count INTEGER DEFAULT 1,
      last_disconnect INTEGER,
      recovery_count INTEGER DEFAULT 0,
      last_recovery INTEGER,
      recovery_source TEXT,
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createTerminalSessionsTable);

  // Create session_tasks table
  const createSessionTasksTable = `
    CREATE TABLE IF NOT EXISTS session_tasks (
      session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
      task_id TEXT NOT NULL REFERENCES tasks(id),
      access_time INTEGER NOT NULL,
      PRIMARY KEY (session_id, task_id)
    )
  `;
  sqlite.exec(createSessionTasksTable);

  // Create file_session_mapping table
  const createFileSessionMappingTable = `
    CREATE TABLE IF NOT EXISTS file_session_mapping (
      file_id INTEGER NOT NULL REFERENCES files(id),
      session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
      first_seen INTEGER NOT NULL,
      last_modified INTEGER NOT NULL,
      PRIMARY KEY (file_id, session_id)
    )
  `;
  sqlite.exec(createFileSessionMappingTable);

  // Create time_windows table
  const createTimeWindowsTable = `
    CREATE TABLE IF NOT EXISTS time_windows (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      name TEXT,
      type TEXT,
      status TEXT DEFAULT 'active',
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createTimeWindowsTable);

  // Create retroactive_assignments table
  const createRetroactiveAssignmentsTable = `
    CREATE TABLE IF NOT EXISTS retroactive_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL REFERENCES terminal_sessions(id),
      task_id TEXT NOT NULL REFERENCES tasks(id),
      assigned_at INTEGER NOT NULL,
      effective_time INTEGER NOT NULL,
      assigned_by TEXT,
      reason TEXT,
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createRetroactiveAssignmentsTable);

  // Create the task_files table for completeness
  const createTaskFilesTable = `
    CREATE TABLE IF NOT EXISTS task_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      file_id INTEGER NOT NULL REFERENCES files(id),
      relationship_type TEXT DEFAULT 'related' NOT NULL,
      confidence INTEGER DEFAULT 100,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createTaskFilesTable);

  // Create the file_changes table for completeness
  const createFileChangesTable = `
    CREATE TABLE IF NOT EXISTS file_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL REFERENCES files(id),
      task_id TEXT REFERENCES tasks(id),
      change_type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      previous_hash TEXT,
      current_hash TEXT,
      metadata TEXT DEFAULT '{}'
    )
  `;
  sqlite.exec(createFileChangesTable);

  // Create the Drizzle ORM wrapper for the database
  const db = drizzle(sqlite, { schema: {
    tasks: tasksSchema,
    terminalSessions,
    sessionTasks,
    fileSessionMapping,
    timeWindows,
    retroactiveAssignments,
    files
  }});

  return {
    db,
    sqlite,
    path
  };
}

/**
 * Clean up a test database if it's file-based
 * @param dbPath Path to the database file to clean up
 */
export function cleanupTestDB(dbPath: string): void {
  if (dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (error) {
      console.error(`Error cleaning up test database at ${dbPath}:`, error);
    }
  }
}

/**
 * Creates a mock terminal fingerprint for testing
 * @param overrides Optional properties to override defaults
 * @returns A TerminalFingerprint object
 */
export function createMockTerminalFingerprint(overrides: Partial<TerminalFingerprint> = {}): TerminalFingerprint {
  return {
    tty: `/dev/ttys00${Math.floor(Math.random() * 10)}`,
    pid: Math.floor(Math.random() * 10000) + 1000,
    ppid: Math.floor(Math.random() * 1000) + 100,
    user: 'test-user',
    shell: '/bin/zsh',
    termEnv: 'xterm-256color',
    ...overrides
  };
}

/**
 * Creates a mock terminal detection result for testing
 * @param isTerminal Whether detection should indicate a terminal environment
 * @param overrides Optional properties to override defaults
 * @returns A TerminalDetectionResult object
 */
export function createMockTerminalDetection(
  isTerminal: boolean = true,
  overrides: Partial<TerminalDetectionResult> = {}
): TerminalDetectionResult {
  if (!isTerminal) {
    return { isTerminal: false };
  }
  
  return {
    isTerminal: true,
    tty: `/dev/ttys00${Math.floor(Math.random() * 10)}`,
    pid: Math.floor(Math.random() * 10000) + 1000,
    user: 'test-user',
    shell: '/bin/zsh',
    columns: 80,
    rows: 24,
    ...overrides
  };
}

/**
 * Creates a mock terminal session state for testing
 * @param overrides Optional properties to override defaults
 * @returns A TerminalSessionState object
 */
export function createMockSessionState(overrides: Partial<TerminalSessionState> = {}): TerminalSessionState {
  const id = overrides.id || uuidv4();
  const fingerprint = overrides.fingerprint || createMockTerminalFingerprint();
  
  return {
    id,
    fingerprint,
    startTime: new Date(),
    lastActive: new Date(),
    status: 'active',
    windowSize: { columns: 80, rows: 24 },
    recentTaskIds: [],
    connectionCount: 1,
    environmentVariables: {
      'TM_SESSION_ID': id,
      'TM_INTEGRATION': 'enabled'
    },
    ...overrides
  };
}

/**
 * Creates a new terminal session record in the database
 * @param db Database connection
 * @param sessionData Optional session data overrides
 * @returns The created session ID
 */
export async function createTerminalSession(
  db: BetterSQLite3Database,
  sessionData: Partial<NewTerminalSession> = {}
): Promise<string> {
  const id = sessionData.id || uuidv4();
  const now = new Date();
  
  await db.insert(terminalSessions).values({
    id,
    tty: sessionData.tty || `/dev/ttys00${Math.floor(Math.random() * 10)}`,
    pid: sessionData.pid || Math.floor(Math.random() * 10000) + 1000,
    ppid: sessionData.ppid || Math.floor(Math.random() * 1000) + 100,
    windowColumns: sessionData.windowColumns || 80,
    windowRows: sessionData.windowRows || 24,
    user: sessionData.user || 'test-user',
    shell: sessionData.shell || '/bin/zsh',
    startTime: sessionData.startTime || now,
    lastActive: sessionData.lastActive || now,
    status: sessionData.status || 'active',
    currentTaskId: sessionData.currentTaskId,
    connectionCount: sessionData.connectionCount || 1,
    metadata: sessionData.metadata || '{}',
  });
  
  return id;
}

/**
 * Creates a test task in the database
 * @param db Database connection
 * @param taskData Optional task data overrides
 * @returns The created task ID
 */
export async function createTestTask(
  db: BetterSQLite3Database,
  taskData: Partial<NewTask> = {}
): Promise<string> {
  const id = taskData.id || `task-${randomUUID().substring(0, 8)}`;
  const now = new Date();
  
  await db.insert(tasksSchema).values({
    id,
    title: taskData.title || `Test Task ${id}`,
    description: taskData.description || 'A test task',
    body: taskData.body || 'Test task body content',
    status: taskData.status || 'todo',
    createdAt: taskData.createdAt || now,
    updatedAt: taskData.updatedAt || now,
    readiness: taskData.readiness || 'ready',
    tags: taskData.tags || ['test'],
    parentId: taskData.parentId,
    metadata: taskData.metadata || '{}',
  });
  
  return id;
}

/**
 * Creates a test file record in the database
 * @param db Database connection
 * @param fileData Optional file data overrides
 * @returns The created file ID
 */
export async function createTestFile(
  db: BetterSQLite3Database,
  fileData: Partial<NewFile> = {}
): Promise<number> {
  const path = fileData.path || `/test/path/file-${Math.floor(Math.random() * 1000)}.ts`;
  const now = new Date();
  
  const result = await db.insert(files).values({
    path: fileData.path || path,
    hash: fileData.hash || `hash-${randomUUID().substring(0, 8)}`,
    lastModified: fileData.lastModified || now,
    createdAt: fileData.createdAt || now,
    fileType: fileData.fileType || 'ts',
    metadata: fileData.metadata || '{}',
  }).returning({ id: files.id });
  
  return result[0].id;
}

/**
 * Associates a task with a terminal session
 * @param db Database connection
 * @param sessionId Terminal session ID
 * @param taskId Task ID
 * @param accessTime Optional timestamp for access time
 */
export async function associateTaskWithSession(
  db: BetterSQLite3Database,
  sessionId: string,
  taskId: string,
  accessTime: Date = new Date()
): Promise<void> {
  await db.insert(sessionTasks).values({
    sessionId,
    taskId,
    accessTime
  });
}

/**
 * Associates a file with a terminal session
 * @param db Database connection
 * @param sessionId Terminal session ID
 * @param fileId File ID
 * @param firstSeen Optional timestamp for first seen time
 * @param lastModified Optional timestamp for last modified time
 */
export async function associateFileWithSession(
  db: BetterSQLite3Database,
  sessionId: string,
  fileId: number,
  firstSeen: Date = new Date(),
  lastModified: Date = new Date()
): Promise<void> {
  await db.insert(fileSessionMapping).values({
    sessionId,
    fileId,
    firstSeen,
    lastModified
  });
}

/**
 * Creates a time window for a session
 * @param db Database connection
 * @param sessionId Terminal session ID
 * @param windowData Optional window data overrides
 * @returns The created time window ID
 */
export async function createTimeWindow(
  db: BetterSQLite3Database,
  sessionId: string,
  windowData: Partial<NewTimeWindow> = {}
): Promise<string> {
  const id = windowData.id || `window-${randomUUID().substring(0, 8)}`;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  
  await db.insert(timeWindows).values({
    id,
    sessionId,
    startTime: windowData.startTime || oneHourAgo,
    endTime: windowData.endTime || now,
    name: windowData.name || `Test Window ${id}`,
    type: windowData.type || 'work',
    status: windowData.status || 'active',
    metadata: windowData.metadata || '{}',
  });
  
  return id;
}

/**
 * Creates a retroactive task assignment
 * @param db Database connection
 * @param sessionId Terminal session ID
 * @param taskId Task ID
 * @param assignmentData Optional assignment data overrides
 * @returns The created assignment ID
 */
export async function createRetroactiveAssignment(
  db: BetterSQLite3Database,
  sessionId: string,
  taskId: string,
  assignmentData: Partial<NewRetroactiveAssignment> = {}
): Promise<number> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000);
  
  const result = await db.insert(retroactiveAssignments).values({
    sessionId,
    taskId,
    assignedAt: assignmentData.assignedAt || now,
    effectiveTime: assignmentData.effectiveTime || oneHourAgo,
    assignedBy: assignmentData.assignedBy || 'test-user',
    reason: assignmentData.reason || 'For testing purposes',
    metadata: assignmentData.metadata || '{}',
  }).returning({ id: retroactiveAssignments.id });
  
  return result[0].id;
}

/**
 * Sets up a complete terminal session testing environment with related entities
 * @param db Database connection
 * @param taskCount Number of tasks to create
 * @param fileCount Number of files to create
 * @returns Object with created session, tasks, files, and window info
 */
export async function setupTerminalSessionTestEnvironment(
  db: BetterSQLite3Database,
  taskCount: number = 3,
  fileCount: number = 2
): Promise<{
  sessionId: string;
  taskIds: string[];
  fileIds: number[];
  windowId: string;
}> {
  // Create a terminal session
  const sessionId = await createTerminalSession(db);
  
  // Create test tasks
  const taskIds = [];
  for (let i = 0; i < taskCount; i++) {
    const taskId = await createTestTask(db, {
      title: `Terminal Test Task ${i+1}`,
      tags: ['terminal-test']
    });
    taskIds.push(taskId);
    
    // Associate tasks with session
    await associateTaskWithSession(db, sessionId, taskId);
  }
  
  // Create test files
  const fileIds = [];
  for (let i = 0; i < fileCount; i++) {
    const fileId = await createTestFile(db, {
      path: `/test/terminal/file-${i+1}.ts`,
      fileType: 'ts'
    });
    fileIds.push(fileId);
    
    // Associate files with session
    await associateFileWithSession(db, sessionId, fileId);
  }
  
  // Create a time window
  const windowId = await createTimeWindow(db, sessionId);
  
  // Set current task for session
  if (taskIds.length > 0) {
    await db.update(terminalSessions)
      .set({ currentTaskId: taskIds[0] })
      .where(eq(terminalSessions.id, sessionId));
  }
  
  return {
    sessionId,
    taskIds,
    fileIds,
    windowId
  };
}

/**
 * Creates mock terminal environment variables for testing
 * @param sessionId Session ID to include in environment
 * @returns Object with environment variables
 */
export function createMockTerminalEnvironment(sessionId: string): Record<string, string> {
  return {
    'TERM': 'xterm-256color',
    'SHELL': '/bin/zsh',
    'USER': 'test-user',
    'PWD': '/Users/test-user/projects/test',
    'TERM_SESSION_ID': randomUUID(),
    'TM_SESSION_ID': sessionId,
    'TM_INTEGRATION': 'enabled',
    'TMUX': '',
    'SSH_CONNECTION': ''
  };
}

/**
 * Verifies if a terminal session exists in the database
 * @param db Database connection
 * @param sessionId Session ID to check
 * @returns Boolean indicating whether the session exists
 */
export async function sessionExists(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<boolean> {
  const session = await db.query.terminalSessions.findFirst({
    where: eq(terminalSessions.id, sessionId)
  });
  
  return !!session;
}

/**
 * Gets task count for a session
 * @param db Database connection
 * @param sessionId Session ID to check
 * @returns Number of tasks associated with the session
 */
export async function getSessionTaskCount(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<number> {
  const result = await db.select({ count: sessionTasks.taskId })
    .from(sessionTasks)
    .where(eq(sessionTasks.sessionId, sessionId))
    .all();
  
  return result.length;
}

/**
 * Gets file count for a session
 * @param db Database connection
 * @param sessionId Session ID to check
 * @returns Number of files associated with the session
 */
export async function getSessionFileCount(
  db: BetterSQLite3Database,
  sessionId: string
): Promise<number> {
  const result = await db.select({ count: fileSessionMapping.fileId })
    .from(fileSessionMapping)
    .where(eq(fileSessionMapping.sessionId, sessionId))
    .all();
  
  return result.length;
}

/**
 * Creates a complete terminal test setup with database and cleanup
 * @param options Options for the test setup
 * @returns Object with database, session info, and cleanup function
 */
export async function createTerminalTestSetup(options: {
  inMemory?: boolean;
  taskCount?: number;
  fileCount?: number;
  sessionStatus?: 'active' | 'inactive' | 'disconnected';
} = {}): Promise<{
  db: BetterSQLite3Database;
  sqlite: Database;
  dbPath: string;
  sessionId: string;
  taskIds: string[];
  fileIds: number[];
  cleanup: () => void;
}> {
  const { 
    inMemory = true, 
    taskCount = 3, 
    fileCount = 2,
    sessionStatus = 'active'
  } = options;
  
  // Initialize test database
  const { db, sqlite, path: dbPath } = initializeTerminalTestDB(inMemory);
  
  // Create session environment
  const { sessionId, taskIds, fileIds } = await setupTerminalSessionTestEnvironment(
    db, 
    taskCount,
    fileCount
  );
  
  // Update session status if needed
  if (sessionStatus !== 'active') {
    await db.update(terminalSessions)
      .set({ status: sessionStatus })
      .where(eq(terminalSessions.id, sessionId));
  }
  
  // Create cleanup function
  const cleanup = () => {
    if (dbPath !== ':memory:') {
      cleanupTestDB(dbPath);
    }
  };
  
  return {
    db,
    sqlite,
    dbPath,
    sessionId,
    taskIds,
    fileIds,
    cleanup
  };
}

/**
 * Mocks the Terminal Detection module for testing
 * @param options Configuration options
 * @returns Mock implementation with controlled behavior
 */
export function mockTerminalDetection(options: {
  isTerminal?: boolean;
  tty?: string;
  pid?: number;
  user?: string;
  shell?: string;
  columns?: number;
  rows?: number;
} = {}): {
  detectTerminal: () => TerminalDetectionResult;
  getTerminalFingerprint: () => TerminalFingerprint | null;
} {
  const { 
    isTerminal = true,
    tty = `/dev/ttys00${Math.floor(Math.random() * 10)}`,
    pid = Math.floor(Math.random() * 10000) + 1000,
    user = 'test-user',
    shell = '/bin/zsh',
    columns = 80,
    rows = 24
  } = options;
  
  const detectionResult = createMockTerminalDetection(isTerminal, {
    tty, pid, user, shell, columns, rows
  });
  
  return {
    detectTerminal: () => detectionResult,
    getTerminalFingerprint: () => isTerminal ? createMockTerminalFingerprint({
      tty, pid, ppid: pid - 100, user, shell
    }) : null
  };
}