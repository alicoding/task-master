/**
 * Script to run the database migration
 * Adds description and body fields to tasks table
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Main function to run the database migration
 */
function runMigration(): void {
  console.log('Running migration for Task Master...');

  // 1. Check if the migration file exists
  const migrationPath = path.resolve('./db/migrations/0001_task_description_body.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  // 2. Run the migration
  try {
    console.log('Applying migration...');
    execSync('npm run db:migrate', { stdio: 'inherit' });
    console.log('Migration successful!');
    
    // 3. Output summary
    console.log('\nEnhanced Task Master with:');
    console.log('- Added task description field');
    console.log('- Added task body content field');
    console.log('- Improved CLI output formatting');
    console.log('- Added interactive mode for task creation and updates');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Execute the migration
runMigration();