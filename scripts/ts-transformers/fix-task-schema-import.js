#!/usr/bin/env node

/**
 * Simple script to fix Task import issues in repository files
 * This script updates imports from @/db/schema to use tasks table correctly
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to repository files
const rootDir = path.resolve(__dirname, '../../');
const repoFiles = [
  path.join(rootDir, 'src/core/repository/optimized-operations.ts'),
  path.join(rootDir, 'src/core/repository/search.ts')
];

function fixTaskImport(filePath) {
  console.log(`Fixing Task import in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix import statements that try to import Task directly from schema
    const updatedContent = content
      .replace(
        /import\s*{[^}]*Task[^}]*}\s*from\s*['"]@\/db\/schema['"]/g,
        (match) => {
          // Replace Task with tasks
          return match.replace('Task', 'tasks');
        }
      );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully updated Task import in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing Task import in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of repoFiles) {
  fixTaskImport(file);
}

console.log('Task import fixes completed');