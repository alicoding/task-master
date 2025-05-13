#!/usr/bin/env tsx
/**
 * Fix for parent_id vs parentId column name mismatch
 * 
 * This script fixes references to 'parentId' in SQL queries when the actual column name
 * in the database is 'parent_id'.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as glob from 'glob';

// Files to check
const filesToFix = [
  'core/repository/creation.ts',
  'core/repository/hierarchy.ts',
  'core/repository/base.ts',
  'cli/commands/add/add-command.ts'
];

// Get root directory
const rootDir = process.cwd();

// Process all files
filesToFix.forEach(relPath => {
  // First check if the file exists in the src directory
  let filePath = join(rootDir, 'src', relPath);
  let fileExists = false;
  
  try {
    readFileSync(filePath, 'utf8');
    fileExists = true;
  } catch (err) {
    // File doesn't exist in src, try in root
    filePath = join(rootDir, relPath);
    try {
      readFileSync(filePath, 'utf8');
      fileExists = true;
    } catch (err) {
      console.error(`Could not find file ${relPath} in either src/ or root directory`);
    }
  }
  
  if (fileExists) {
    try {
      // Read file content
      const content = readFileSync(filePath, 'utf8');
      
      // Replace SQL queries with parentId to use parent_id instead
      const fixedContent = content
        // Fix SQL prepare statements
        .replace(/parentId\s+(IS|=|<>|!=)/g, 'parent_id $1')
        .replace(/SELECT.*\bparentId\b/g, (match) => match.replace('parentId', 'parent_id'))
        .replace(/FROM\s+tasks\s+WHERE\s+parentId/g, 'FROM tasks WHERE parent_id')
        .replace(/ORDER\s+BY\s+parentId/g, 'ORDER BY parent_id');
      
      // Write changes back to the file
      if (content !== fixedContent) {
        writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`Fixed SQL references in ${filePath}`);
      } else {
        console.log(`No changes needed in ${filePath}`);
      }
    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err);
    }
  }
});

console.log('Parent ID column name fixes completed');