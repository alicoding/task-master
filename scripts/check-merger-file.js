#!/usr/bin/env node

/**
 * Fix quote issues in merger-enhanced.ts files
 * 
 * This script rewrites problematic lines that cause TypeScript syntax errors
 */

import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'cli/commands/deduplicate/lib/merger-enhanced.ts',
  'src/cli/commands/deduplicate/lib/merger-enhanced.ts'
];

// Main function
async function main() {
  console.log('Checking and fixing merger files...');
  
  for (const filePath of FILES_TO_FIX) {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    try {
      console.log(`Processing ${filePath}...`);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Find lines that might have quote issues
      const lines = content.split('\n');
      const colorizeLines = lines.filter(line => 
        line.includes('colorize') && 
        line.includes('all') && 
        line.includes('comma-separated')
      );
      
      console.log(`Found potentially problematic lines in ${filePath}:`);
      console.log(colorizeLines);
      
      // Create a completely new line
      const lineNumber = lines.findIndex(line => 
        line.includes('colorize') && 
        line.includes('all') && 
        line.includes('comma-separated')
      );
      
      if (lineNumber !== -1) {
        console.log(`Replacing line ${lineNumber + 1} with fixed version...`);
        
        // Replace the problematic line with a completely new one
        lines[lineNumber] = '      colorize(\'  Tasks to merge (comma-separated, "all", or "q" to cancel): \', \'cyan\' as ChalkColor),';
        
        // Save the fixed file
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        console.log(`  ✅ Fixed file ${filePath}`);
      } else {
        console.log(`  No problematic lines found in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
}

main();