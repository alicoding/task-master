/**
 * Apply the file tracking migration manually
 */

import { createDb } from './init';
import fs from 'fs/promises';
import path from 'path';

async function applyMigration() {
  console.log('Applying file tracking migration...');
  
  // Create a connection to the database
  const { db, sqlite } = createDb('./db/taskmaster.db');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0002_file_tracking_tables.sql');
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log(`Read migration file: ${migrationPath}`);
    
    // Split SQL by statement breakpoints
    const statements = migrationSql.split('--> statement-breakpoint');
    console.log(`Found ${statements.length} SQL statements`);
    
    // Begin transaction
    sqlite.exec('BEGIN TRANSACTION;');
    
    // Execute each statement
    for (const [index, statement] of statements.entries()) {
      if (!statement.trim()) continue;
      
      try {
        console.log(`Executing statement ${index + 1}...`);
        sqlite.exec(statement);
        console.log(`✅ Statement ${index + 1} executed successfully`);
      } catch (error) {
        console?.error(`❌ Error executing statement ${index + 1}:`, error);
        throw error;
      }
    }
    
    // Commit transaction
    sqlite.exec('COMMIT;');
    console.log('Migration successfully applied!');
    
    // Verify tables were created
    const checkTables = ['files', 'task_files', 'file_changes'];
    
    for (const tableName of checkTables) {
      const tableExists = sqlite.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?;
      `).get(tableName);
      
      if (tableExists) {
        console.log(`✅ Table ${tableName} created successfully`);
      } else {
        console.log(`❌ Table ${tableName} creation failed`);
      }
    }
  } catch (error) {
    // Rollback on error
    try {
      sqlite.exec('ROLLBACK;');
    } catch (rollbackError) {
      console?.error('Error during rollback:', rollbackError);
    }
    
    console?.error('Error applying migration:', error);
  } finally {
    sqlite.close();
  }
}

// Run the migration
applyMigration().catch(console?.error);