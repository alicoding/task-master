#!/usr/bin/env node

/**
 * Fix TypeScript syntax errors in merger-enhanced.ts
 * 
 * This script fixes the specific syntax errors in the merger-enhanced.ts files
 * that are causing the remaining TypeScript errors.
 */

import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'cli/commands/deduplicate/lib/merger-enhanced.ts',
  'src/cli/commands/deduplicate/lib/merger-enhanced.ts'
];

function main() {
  console.log('Fixing syntax errors in the codebase...');
  
  try {
    for (const file of FILES_TO_FIX) {
      const fullPath = path.resolve(process.cwd(), file);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        continue;
      }
      
      console.log(`Processing ${file}...`);
      
      // Read the file
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Find any lines with problematic quotes - looking specifically for the line
      // with single quoted 'all' that's causing syntax errors
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('comma-separated') && lines[i].includes('all')) {
          const originalLine = lines[i];
          
          // Replace the problematic line with a properly quoted version
          lines[i] = "      colorize('  Tasks to merge (comma-separated, \"all\", or \"q\" to cancel): ', 'cyan' as ChalkColor),";
          
          console.log(`Line ${i+1}: Fixed problematic quotes`);
          console.log(`  Before: ${originalLine}`);
          console.log(`  After:  ${lines[i]}`);
        }
      }
      
      // Write the fixed content back to the file
      fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
      console.log(`✅ Fixed file: ${file}`);
    }
    
    console.log('Syntax errors fixed successfully');
  } catch (error) {
    console.error('Error fixing syntax errors:', error);
  }
}

main();