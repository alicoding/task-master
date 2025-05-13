#!/usr/bin/env node

/**
 * Simple script to fix the Task import in search handler files
 * Uses direct file manipulation instead of AST parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to search handler files
const rootDir = path.resolve(__dirname, '../../');
const searchHandlerFiles = [
  path.join(rootDir, 'cli/commands/search/search-handler.ts'),
  path.join(rootDir, 'cli/commands/search/search-handler-clean.ts')
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
    
    // Regex to match the import statement from '../../../core/types'
    const importRegex = /import\s*{([^}]*)}\s*from\s*'(\.\.\/\.\.\/\.\.\/core\/types)'/;
    
    // Check if the right import pattern exists
    if (!importRegex.test(content)) {
      console.log(`Import pattern not found in ${path.basename(filePath)}`);
      return;
    }
    
    // Replace the import statement to include Task if it's not already included
    const updatedContent = content.replace(importRegex, (match, imports) => {
      // Check if Task is already in the imports
      if (imports.includes('Task')) {
        return match;
      }
      
      // Add Task to the imports
      const newImports = imports.split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      newImports.unshift('Task');
      
      return `import { ${newImports.join(', ')} } from '@/core/types'`;
    });
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully updated import in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing import in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of searchHandlerFiles) {
  fixTaskImport(file);
}

console.log('Task import fix completed');