/**
 * Utility to check database schema
 */

import { createDb } from './init';

async function checkSchema() {
  console.log('Checking database schema...');

  // Create a connection to the database
  const { db, sqlite } = createDb('./db/taskmaster.db');

  try {
    // List all tables in the database
    const tablesResult = sqlite.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
      ORDER BY name;
    `).all();

    console.log('Tables in database:');
    for (const table of tablesResult as { name: string }[]) {
      console.log(`- ${table.name}`);

      // Get table schema
      const schemaResult = sqlite.prepare(`PRAGMA table_info("${table.name}");`).all();
      for (const column of schemaResult as { name: string, type: string }[]) {
        console.log(`  - ${column.name} (${column.type})`);
      }
    }

    // Check if core tables exist
    console.log('\nChecking for core tables:');
    const checkTables = ['tasks', 'dependencies'];

    for (const tableName of checkTables) {
      const tableExists = sqlite.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name=?;
      `).get(tableName);

      if (tableExists) {
        console.log(`✅ Table ${tableName} exists`);
      } else {
        console.log(`❌ Table ${tableName} does NOT exist`);
      }
    }
  } catch (error: unknown) {
    console?.error('Error checking schema:', error);
  } finally {
    sqlite.close();
  }
}

// Run the check
checkSchema().catch(console?.error);