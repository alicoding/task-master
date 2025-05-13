#!/usr/bin/env tsx
/**
 * Find occurrences of ".js" in source files
 * 
 * This script finds all instances of ".js" in the specified files
 * and provides context to help understand how they're used.
 */

import * as fs from 'fs';
import * as path from 'path';

// Files to check
const filesToCheck = [
  'scripts/enhanced-js-to-ts-converter.ts',
  'scripts/js-to-ts-converter.ts'
];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

console.log(`${colors.cyan}${colors.bold}Finding .js occurrences in files${colors.reset}`);
console.log(`${colors.gray}------------------------------------------${colors.reset}`);

for (const file of filesToCheck) {
  try {
    console.log(`\n${colors.blue}Scanning file:${colors.reset} ${file}`);
    
    // Read file content
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Find occurrences of .js
    const pattern = /\.js/g;
    let match;
    const occurrences = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(line)) !== null) {
        occurrences.push({
          lineNumber: i + 1,
          columnNumber: match.index + 1,
          lineContent: line,
          contextBefore: lines.slice(Math.max(0, i - 2), i).join('\n'),
          contextAfter: lines.slice(i + 1, Math.min(lines.length, i + 3)).join('\n')
        });
      }
    }
    
    // Report occurrences
    if (occurrences.length === 0) {
      console.log(`${colors.green}No occurrences found.${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Found ${occurrences.length} occurrences:${colors.reset}`);
      
      for (const occurrence of occurrences) {
        console.log(`\n${colors.magenta}Line ${occurrence.lineNumber}, Column ${occurrence.columnNumber}:${colors.reset}`);
        console.log(`${colors.gray}Context before:${colors.reset}`);
        console.log(occurrence.contextBefore);
        console.log(`${colors.red}${occurrence.lineContent}${colors.reset}`);
        console.log(`${colors.gray}Context after:${colors.reset}`);
        console.log(occurrence.contextAfter);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error scanning file ${file}:${colors.reset}`, error);
  }
}

console.log(`\n${colors.green}${colors.bold}Scan complete!${colors.reset}`);