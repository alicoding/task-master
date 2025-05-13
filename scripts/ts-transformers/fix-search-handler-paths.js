#!/usr/bin/env node

/**
 * Simple script to fix import paths in search handler files to use path aliases
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

function fixImportPaths(filePath) {
  console.log(`Fixing import paths in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace relative paths with path aliases
    const updatedContent = content
      // Fix repo import
      .replace(
        /import { TaskRepository } from '\.\.\/\.\.\/\.\.\/core\/repo';/,
        "import { TaskRepository } from '@/core/repo';"
      )
      // Fix NlpService import
      .replace(
        /import { NlpService } from '\.\.\/\.\.\/\.\.\/core\/nlp-service';/,
        "import { NlpService } from '@/core/nlp-service';"
      )
      // Fix core/types import
      .replace(
        /import { SearchFilters, OutputFormat, Task } from '\.\.\/\.\.\/\.\.\/core\/types';/,
        "import { SearchFilters, OutputFormat, Task } from '@/core/types';"
      )
      // Fix nlp/types import
      .replace(
        /import { ExtractedSearchFilters } from '\.\.\/\.\.\/\.\.\/core\/nlp\/types';/,
        "import { ExtractedSearchFilters } from '@/core/nlp/types';"
      );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully updated import paths in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing import paths in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of searchHandlerFiles) {
  fixImportPaths(file);
}

console.log('Import path fixes completed');