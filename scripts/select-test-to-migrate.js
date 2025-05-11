#!/usr/bin/env node
/**
 * Interactive Test Migration Tool
 * 
 * This script provides an interactive way to select which test file to migrate.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { spawn } from 'child_process';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Find all test files in a directory
 * @param {string} dir Directory to search
 * @param {RegExp} pattern File pattern to match
 * @returns {Promise<string[]>} List of file paths
 */
async function findFiles(dir, pattern) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return findFiles(fullPath, pattern);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      return [fullPath];
    }
    
    return [];
  }));
  
  return files.flat();
}

/**
 * Check if a file is already a Vitest file
 * @param {string} content File content
 * @returns {boolean} True if it's a Vitest file
 */
function isVitestFile(content) {
  return content.includes('import { describe, it, expect') || 
         content.includes('from \'vitest\'');
}

/**
 * Display a menu of test files
 * @param {string[]} testFiles Array of test files
 * @returns {Promise<string>} Selected file
 */
async function displayMenu(testFiles) {
  console.log('Select a test file to migrate:');
  console.log('');
  
  // Group files by directory
  const groupedFiles = {};
  for (const file of testFiles) {
    const relativePath = path.relative(rootDir, file);
    const directory = path.dirname(relativePath);
    
    if (!groupedFiles[directory]) {
      groupedFiles[directory] = [];
    }
    
    groupedFiles[directory].push(relativePath);
  }
  
  // Display grouped files
  const allFiles = [];
  let index = 1;
  
  for (const directory in groupedFiles) {
    console.log(`\n--- ${directory} ---`);
    
    for (const file of groupedFiles[directory]) {
      console.log(`${index}. ${file}`);
      allFiles.push(file);
      index++;
    }
  }
  
  console.log('\n0. Exit');
  
  // Prompt for selection
  return new Promise((resolve) => {
    rl.question('\nEnter file number to migrate: ', (answer) => {
      const selection = parseInt(answer.trim(), 10);
      
      if (selection === 0) {
        resolve(null);
      } else if (selection > 0 && selection <= allFiles.length) {
        resolve(allFiles[selection - 1]);
      } else {
        console.log('Invalid selection. Please try again.');
        resolve(displayMenu(testFiles));
      }
    });
  });
}

/**
 * Migrate a test file
 * @param {string} filePath File to migrate
 * @returns {Promise<boolean>} Whether migration succeeded
 */
async function migrateFile(filePath) {
  return new Promise((resolve) => {
    console.log(`\nMigrating ${filePath}...`);
    
    const migrate = spawn('npm', ['run', 'test:migrate:file', filePath], {
      stdio: 'inherit'
    });
    
    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('\nMigration successful!');
        resolve(true);
      } else {
        console.log('\nMigration failed.');
        resolve(false);
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Interactive Test Migration Tool');
    console.log('==============================\n');
    
    // Find all test files
    const allTestFiles = await findFiles(path.join(rootDir, 'test'), /\.test\.ts$/);
    const uvuTestFiles = [];
    
    // Filter out files that are already in Vitest format
    for (const filePath of allTestFiles) {
      // Skip files with .vitest. in the name
      if (filePath.includes('.vitest.')) {
        continue;
      }
      
      // Check file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!isVitestFile(content)) {
        uvuTestFiles.push(filePath);
      }
    }
    
    if (uvuTestFiles.length === 0) {
      console.log('All test files have already been migrated!');
      rl.close();
      return;
    }
    
    console.log(`Found ${uvuTestFiles.length} test files to migrate.\n`);
    
    // Display menu and get selection
    const selectedFile = await displayMenu(uvuTestFiles);
    
    if (selectedFile) {
      // Migrate selected file
      const success = await migrateFile(selectedFile);
      
      // Ask if user wants to migrate another file
      rl.question('\nDo you want to migrate another file? (y/n) ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          rl.close();
          main();
        } else {
          rl.close();
        }
      });
    } else {
      console.log('Exiting...');
      rl.close();
    }
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});