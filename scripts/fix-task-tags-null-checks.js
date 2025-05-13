#!/usr/bin/env node
/**
 * Fix Task.tags null checks
 * 
 * This script adds optional chaining to all instances of task.tags.join()
 * to prevent null reference errors.
 */

import fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Find all TypeScript files in the project
const files = glob.sync('**/*.ts', { 
  cwd: rootDir,
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

// Keep track of changes
let filesModified = 0;
let occurrencesFixed = 0;

console.log(`Scanning ${files.length} files for task.tags null references...`);

// Regular expressions for finding task.tags references without optional chaining
const tagsJoinRegex = /(\w+)\.tags\.join/g;  // Matches task.tags.join or any other property access
const taskTagsRegex = /task\.tags\.join/g;  // Specifically matches task.tags.join
const taskATagsRegex = /taskA\.tags\.join/g; // Specifically matches taskA.tags.join
const taskBTagsRegex = /taskB\.tags\.join/g; // Specifically matches taskB.tags.join
const parentTaskTagsRegex = /parentTask\.tags\.join/g; // Specifically matches parentTask.tags.join

// Process each file
for (const relativeFilePath of files) {
  const filePath = path.join(rootDir, relativeFilePath);
  
  try {
    // Read file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for any .tags.join pattern
    if (content.includes('.tags.join')) {
      let modified = false;
      let newContent = content;
      
      // Replace task.tags.join with task.tags?.join
      const taskTagsReplaced = newContent.match(taskTagsRegex)?.length || 0;
      if (taskTagsReplaced > 0) {
        newContent = newContent.replace(taskTagsRegex, 'task.tags?.join');
        modified = true;
        occurrencesFixed += taskTagsReplaced;
      }
      
      // Replace taskA.tags.join with taskA.tags?.join
      const taskATagsReplaced = newContent.match(taskATagsRegex)?.length || 0;
      if (taskATagsReplaced > 0) {
        newContent = newContent.replace(taskATagsRegex, 'taskA.tags?.join');
        modified = true;
        occurrencesFixed += taskATagsReplaced;
      }
      
      // Replace taskB.tags.join with taskB.tags?.join
      const taskBTagsReplaced = newContent.match(taskBTagsRegex)?.length || 0;
      if (taskBTagsReplaced > 0) {
        newContent = newContent.replace(taskBTagsRegex, 'taskB.tags?.join');
        modified = true;
        occurrencesFixed += taskBTagsReplaced;
      }
      
      // Replace parentTask.tags.join with parentTask.tags?.join
      const parentTaskTagsReplaced = newContent.match(parentTaskTagsRegex)?.length || 0;
      if (parentTaskTagsReplaced > 0) {
        newContent = newContent.replace(parentTaskTagsRegex, 'parentTask.tags?.join');
        modified = true;
        occurrencesFixed += parentTaskTagsReplaced;
      }
      
      // Write the changes back if modified
      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        filesModified++;
        console.log(`Fixed tags null references in ${relativeFilePath}`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${relativeFilePath}:`, error);
  }
}

console.log(`\nSummary:`);
console.log(`- Modified ${filesModified} files`);
console.log(`- Fixed ${occurrencesFixed} occurrences of tags null references`);