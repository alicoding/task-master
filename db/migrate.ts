import { createDb } from './init.js';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

async function ensureDbDir(dbPath: string) {
  try {
    await mkdir(dirname(dbPath), { recursive: true });
  } catch (e) {
    // Directory already exists or can't be created
    if ((e as any).code !== 'EEXIST') {
      console.error('Failed to create database directory:', e);
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
    // Create a raw statement to import the migration SQL directly
    const migrationSql = await import('fs').then(fs => 
      fs.promises.readFile(new URL('./migrations/0000_previous_purifiers.sql', import.meta.url), 'utf-8')
    );
    
    console.log('Executing SQL migration script...');
    sqlite.exec(migrationSql);
    console.log('SQL migration executed successfully');
  } catch (error) {
    console.error('Error running migration directly:', error);
    throw error;
  }
  
  console.log('Migrations completed successfully!');
}

// For direct invocation during setup
if (process.argv[1] === import.meta.url) {
  runMigration().catch(console.error);
}