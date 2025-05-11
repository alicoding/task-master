#!/usr/bin/env node

/**
 * Database upgrade script for Task Master
 * Adds description and body columns to tasks table
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Type definitions for console colors
interface Colors {
  reset: string;
  bold: string;
  dim: string;
  green: string;
  yellow: string;
  blue: string;
  red: string;
}

// Colors for console output
const colors: Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

/**
 * Run a command and return a promise
 * @param command Command to run
 * @param args Command arguments
 * @param cwd Working directory
 * @returns Promise that resolves when command completes successfully
 */
function runCommand(command: string, args: string[], cwd: string = rootDir): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log(`${colors.dim}> ${command} ${args.join(' ')}${colors.reset}`);
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

/**
 * Main function to upgrade the database
 */
async function upgrade(): Promise<void> {
  console.log(`\n${colors.bold}${colors.blue}Task Master Database Upgrade${colors.reset}`);
  console.log(`${colors.dim}Adding description and body columns${colors.reset}\n`);
  
  try {
    // Check if migration file exists
    const migrationPath = path.join(rootDir, 'db', 'migrations', '0001_add_description_body.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`${colors.red}Error: Migration file not found at ${migrationPath}${colors.reset}`);
      process.exit(1);
    }
    
    // Backup database first
    console.log(`${colors.yellow}Backing up database...${colors.reset}`);
    const dbPath = path.join(rootDir, 'db', 'taskmaster.db');
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`${colors.green}Database backed up to ${backupPath}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No existing database found, will create a new one${colors.reset}`);
    }
    
    // Run the migration script
    console.log(`\n${colors.yellow}Running database migration...${colors.reset}`);
    await runCommand('npm', ['run', 'db:migrate']);
    
    console.log(`\n${colors.green}${colors.bold}✓ Database upgrade successful!${colors.reset}`);
    console.log(`\n${colors.bold}Your tasks now support:${colors.reset}`);
    console.log(`- ${colors.blue}Description${colors.reset}: Add short summaries to your tasks`);
    console.log(`- ${colors.blue}Body${colors.reset}: Include detailed information and instructions\n`);
    
    console.log(`To use these new fields, run commands like:`);
    console.log(`${colors.dim}tm add --title "Task name" --description "Short summary" --body "Detailed instructions..."${colors.reset}`);
    console.log(`${colors.dim}tm update --id 1 --description "Updated description" --body "New details"${colors.reset}\n`);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n${colors.red}${colors.bold}Error during database upgrade:${colors.reset}`);
      console.error(`${colors.red}${error.message}${colors.reset}\n`);
    }
    
    console.log(`${colors.yellow}If the upgrade failed, you can restore from the backup:${colors.reset}`);
    console.log(`1. Stop any running instances of Task Master`);
    console.log(`2. Replace db/taskmaster.db with the backup file\n`);
    
    process.exit(1);
  }
}

// Run the upgrade function
upgrade().catch((error: Error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});