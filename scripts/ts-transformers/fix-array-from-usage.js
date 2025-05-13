#!/usr/bin/env node

/**
 * Script to fix Array.from() usage in repository files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to repository files with Array.from usage
const rootDir = path.resolve(__dirname, '../../');
const repoFiles = [
  path.join(rootDir, 'src/core/repository/optimized-operations.ts'),
  path.join(rootDir, 'src/core/repository/search.ts')
];

function fixArrayFromUsage(filePath) {
  console.log(`Fixing Array.from usage in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find invalid Array.from() usage and replace with valid spread syntax
    const updatedContent = content
      // Fix Array.from() calls without arguments
      .replace(/Array\.from\(\)/g, '[]')
      // Fix Array.from().from 
      .replace(/Array\.from\(\)\.from/g, 'Array.from')
      // Fix other common Array.from usage
      .replace(/Array\.from\(([^)]+)\)(?!\.map)/g, '[...$1]');
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully fixed Array.from usage in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing Array.from usage in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of repoFiles) {
  fixArrayFromUsage(file);
}

console.log('Array.from usage fix completed');