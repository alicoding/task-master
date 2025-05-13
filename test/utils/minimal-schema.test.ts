/**
 * Minimal test to verify database schema creation works correctly
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import Database from 'better-sqlite3';
import { join } from 'path';
import os from 'os';

describe('Database Schema Creation', () => {
  let testDbPath: string;
  
  // Create a unique test database path
  const createDbPath = () => join(os.tmpdir(), `test-tm-${Date.now()}.db`);
  
  afterEach(() => {
    if (testDbPath && fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });
  
  it('should create database schema with required tables', () => {
    // Create a test database
    testDbPath = createDbPath();
    const sqlite = new Database(testDbPath);
    
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
    
    // Verify tables were created
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `).all().map(t => t.name);
    
    // Verify schema
    expect(tables).toContain('tasks');
    expect(tables).toContain('dependencies');
    expect(tables).toContain('terminal_sessions');
    expect(tables).toContain('session_tasks');
    
    // Test data creation
    const taskId = 'test-task-' + Date.now();
    const now = Date.now();
    
    // Insert a task
    sqlite.prepare(`
      INSERT INTO tasks (
        id, title, status, created_at, updated_at, readiness, tags, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      'Test Task',
      'todo',
      now,
      now,
      'ready',
      '[]',
      '{}'
    );
    
    // Insert a terminal session
    const sessionId = 'test-session-' + Date.now();
    
    sqlite.prepare(`
      INSERT INTO terminal_sessions (
        id, tty, pid, user, shell, start_time, last_active, status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      '/dev/ttys000',
      12345,
      'test-user',
      '/bin/zsh',
      now,
      now,
      'active',
      '{}'
    );
    
    // Create a session-task association
    sqlite.prepare(`
      INSERT INTO session_tasks (
        session_id, task_id, access_time, access_count
      ) VALUES (?, ?, ?, ?)
    `).run(
      sessionId,
      taskId,
      now,
      1
    );
    
    // Verify data was inserted
    const task = sqlite.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId);
    expect(task).toBeDefined();
    expect(task.title).toBe('Test Task');
    
    const session = sqlite.prepare(`SELECT * FROM terminal_sessions WHERE id = ?`).get(sessionId);
    expect(session).toBeDefined();
    expect(session.tty).toBe('/dev/ttys000');
    
    const sessionTask = sqlite.prepare(`
      SELECT * FROM session_tasks WHERE session_id = ? AND task_id = ?
    `).get(sessionId, taskId);
    expect(sessionTask).toBeDefined();
    
    // Close the database connection
    sqlite.close();
  });
});