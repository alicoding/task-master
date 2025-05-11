import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(dbPath: string = path.join(__dirname, 'taskmaster.db'), inMemory: boolean = false) {
  const sqlite = inMemory 
    ? new Database(':memory:') 
    : new Database(dbPath);
  
  const db = drizzle(sqlite, { schema });
  
  // For in-memory DB or initial setup, create tables directly
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
  
  const createDependenciesTable = `
    CREATE TABLE IF NOT EXISTS dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_task_id TEXT NOT NULL REFERENCES tasks(id),
      to_task_id TEXT NOT NULL REFERENCES tasks(id),
      type TEXT NOT NULL
    )
  `;
  
  sqlite.exec(createTasksTable);
  sqlite.exec(createDependenciesTable);
  
  console.log(`Database initialized at: ${dbPath}`);
  
  return { db, sqlite };
}

// For direct invocation during setup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Initializing database...');
  createDb();
  console.log('Database initialized successfully!');
}