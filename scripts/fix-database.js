#!/usr/bin/env node

/**
 * Database fix script for Task Master
 * Directly adds description and body columns to tasks table using SQLite
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

async function fixDatabase() {
  console.log(`\n${colors.bold}${colors.blue}Task Master Database Fix${colors.reset}`);
  console.log(`${colors.dim}Directly adding description and body columns to tasks table${colors.reset}\n`);
  
  try {
    // Determine database path
    const dbPath = path.join(rootDir, 'db', 'taskmaster.db');
    
    if (!fs.existsSync(dbPath)) {
      console.error(`${colors.red}Error: Database file not found at ${dbPath}${colors.reset}`);
      process.exit(1);
    }
    
    // Backup database first
    console.log(`${colors.yellow}Backing up database...${colors.reset}`);
    const backupPath = `${dbPath}.backup-direct-${Date.now()}`;
    fs.copyFileSync(dbPath, backupPath);
    console.log(`${colors.green}Database backed up to ${backupPath}${colors.reset}`);
    
    // Connect to the database directly
    console.log(`${colors.yellow}Connecting to database...${colors.reset}`);
    const db = new Database(dbPath);
    
    // Check if columns already exist
    let hasDescription = false;
    let hasBody = false;
    
    try {
      const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
      hasDescription = tableInfo.some(col => col.name === 'description');
      hasBody = tableInfo.some(col => col.name === 'body');
      
      console.log(`${colors.yellow}Current schema check:${colors.reset}`);
      console.log(`- Description column: ${hasDescription ? `${colors.green}exists${colors.reset}` : `${colors.red}missing${colors.reset}`}`);
      console.log(`- Body column: ${hasBody ? `${colors.green}exists${colors.reset}` : `${colors.red}missing${colors.reset}`}`);
    } catch (err) {
      console.error(`${colors.red}Error checking schema: ${err.message}${colors.reset}`);
    }
    
    // Add missing columns
    if (!hasDescription || !hasBody) {
      console.log(`\n${colors.yellow}Adding missing columns...${colors.reset}`);
      
      try {
        if (!hasDescription) {
          console.log(`- Adding description column...`);
          db.prepare("ALTER TABLE tasks ADD COLUMN description TEXT").run();
          console.log(`  ${colors.green}Success!${colors.reset}`);
        }
        
        if (!hasBody) {
          console.log(`- Adding body column...`);
          db.prepare("ALTER TABLE tasks ADD COLUMN body TEXT").run();
          console.log(`  ${colors.green}Success!${colors.reset}`);
        }
        
        // Verify columns were added
        const updatedTableInfo = db.prepare("PRAGMA table_info(tasks)").all();
        const descriptionAdded = updatedTableInfo.some(col => col.name === 'description');
        const bodyAdded = updatedTableInfo.some(col => col.name === 'body');
        
        if (!descriptionAdded || !bodyAdded) {
          throw new Error("Failed to verify column addition");
        }
        
        console.log(`\n${colors.green}${colors.bold}✓ Database columns added successfully!${colors.reset}`);
      } catch (err) {
        console.error(`${colors.red}Error adding columns: ${err.message}${colors.reset}`);
        throw err;
      }
    } else {
      console.log(`\n${colors.green}All required columns already exist. No changes needed.${colors.reset}`);
    }
    
    // Close the database connection
    db.close();
    
    console.log(`\n${colors.bold}Your tasks now support:${colors.reset}`);
    console.log(`- ${colors.blue}Description${colors.reset}: Add short summaries to your tasks`);
    console.log(`- ${colors.blue}Body${colors.reset}: Include detailed information and instructions\n`);
    
    console.log(`To use these new fields, run commands like:`);
    console.log(`${colors.dim}tm add --title "Task name" --description "Short summary" --body "Detailed instructions..."${colors.reset}`);
    console.log(`${colors.dim}tm update --id 1 --description "Updated description" --body "New details"${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}Error during database fix:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    
    console.log(`${colors.yellow}If the process failed, you can restore from the backup:${colors.reset}`);
    console.log(`1. Stop any running instances of Task Master`);
    console.log(`2. Replace db/taskmaster.db with the backup file\n`);
    
    process.exit(1);
  }
}

fixDatabase().catch(console.error);