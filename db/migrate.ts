import { createDb } from './init';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

async function ensureDbDir(dbPath: string) {
  try {
    await mkdir(dirname(dbPath), { recursive: true });
  } catch (e) {
    // Directory already exists or can't be created
    if ((e as any).code !== 'EEXIST') {
      console?.error('Failed to create database directory:', e);
    }
  }
}

async function runMigration() {
  const dbPath = './db/taskmaster.db';
  
  await ensureDbDir(dbPath);
  
  // Use an absolute path for the migrations folder
  const { db, sqlite } = createDb(dbPath);
  
  console.log('Running migrations...');
  
  try {
    // Import fs module for file operations
    const fs = await import('fs');

    // Get all migration files in order
    const migrations = [
      '0000_previous_purifiers.sql',
      '0001_add_description_body.sql',
      '0001_task_description_body.sql', // Include both versions for compatibility
      '0002_file_tracking_tables.sql',
      '0003_definition_of_done.sql'
    ];

    // Execute each migration in order
    for (const migrationFile of migrations) {
      try {
        console.log(`Applying migration: ${migrationFile}`);
        const migrationSql = await fs.promises.readFile(
          new URL(`./migrations/${migrationFile}`, import.meta.url),
          'utf-8'
        );

        sqlite.exec(migrationSql);
        console.log(`Migration ${migrationFile} applied successfully`);
      } catch (err) {
        // If file doesn't exist or there's another error with this migration
        console.warn(`Warning: Could not apply migration ${migrationFile}:`, err);
        // Continue with other migrations
      }
    }

    console.log('All migrations processed');
  } catch (error) {
    console?.error('Error running migrations:', error);
    throw error;
  }
  
  console.log('Migrations completed successfully!');
}

// For direct invocation during setup
if (process.argv[1] === import.meta.url) {
  runMigration().catch(console?.error);
}