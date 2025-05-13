#!/usr/bin/env node

/**
 * Fix the syntax errors in the merger-enhanced.ts files
 * 
 * This script directly edits the problematic lines to fix TypeScript syntax errors
 */

import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'cli/commands/deduplicate/lib/merger-enhanced.ts',
  'src/cli/commands/deduplicate/lib/merger-enhanced.ts'
];

// Main function
async function main() {
  console.log('Fixing syntax errors in merger files...');
  
  for (const filePath of FILES_TO_FIX) {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    try {
      console.log(`Processing ${filePath}...`);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix the quote issue - replace single quotes around 'all' with double quotes
      const problemLine = /colorize\(['"].*?['"]all['"].*['"],\s*['"]cyan['"]\s+as\s+ChalkColor\)/g;
      const fixedContent = content.replace(
        problemLine,
        'colorize(\'  Tasks to merge (comma-separated, "all", or "q" to cancel): \', \'cyan\' as ChalkColor)'
      );
      
      if (content !== fixedContent) {
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`  ✅ Fixed syntax in ${filePath}`);
      } else {
        console.log(`  No issues found in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  }
}

main();