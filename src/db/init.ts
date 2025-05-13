import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '@/db/schema';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the BetterSQLite3Database type from our augmented declaration
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export function createDb(dbPath: string = path.join(__dirname, 'taskmaster.db'), inMemory: boolean = false) {
  try {
    // Create the SQLite database with safer error handling
    const sqlite = inMemory
      ? new Database(':memory:', { verbose: process.env.DEBUG_SQL === 'true' ? console.log : undefined })
      : new Database(dbPath, { verbose: process.env.DEBUG_SQL === 'true' ? console.log : undefined });

    // Create the Drizzle ORM instance with proper typing
    const db: BetterSQLite3Database<Record<string, unknown>> = drizzle(sqlite, { schema }) as BetterSQLite3Database<typeof schema>;

    // For in-memory DB or initial setup, create tables directly with error handling
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

    // Execute each statement with individual error handling
    try {
      sqlite.exec(createTasksTable);
    } catch (error: unknown) {
      // Ignore "table already exists" errors
      if (!(error as Error).message.includes('already exists')) {
        console?.error(`Error creating tasks table: ${(error as Error).message}`);
      }
    }

    try {
      sqlite.exec(createDependenciesTable);
    } catch (error: unknown) {
      // Ignore "table already exists" errors
      if (!(error as Error).message.includes('already exists')) {
        console?.error(`Error creating dependencies table: ${(error as Error).message}`);
      }
    }

    console.log(`Database initialized at: ${dbPath}`);

    return { db, sqlite };
  } catch (error: unknown) {
    // Handle critical errors during database initialization
    console?.error(`Critical error initializing database: ${(error as Error).message}`);

    // Try to create an in-memory database as fallback if file-based DB failed
    if (!inMemory) {
      console.log('Falling back to in-memory database');
      return createDb(':memory:', true);
    }

    // If we're already trying to create an in-memory DB and it failed, rethrow
    throw error;
  }
}

// For direct invocation during setup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Initializing database...');
  createDb();
  console.log('Database initialized successfully!');
}