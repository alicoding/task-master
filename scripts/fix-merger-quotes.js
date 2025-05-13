#!/usr/bin/env node

/**
 * Fix the single quote errors in merger-enhanced.ts files
 * 
 * This script specifically targets the line with incorrect quotation marks that
 * cause TypeScript errors in the deduplication functionality.
 */

import fs from 'fs';
import path from 'path';

const FILES_TO_FIX = [
  'cli/commands/deduplicate/lib/merger-enhanced.ts',
  'src/cli/commands/deduplicate/lib/merger-enhanced.ts'
];

// Main function
async function main() {
  console.log('Fixing quote issues in merger files...');
  
  for (const file of FILES_TO_FIX) {
    const fullPath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    try {
      console.log(`Processing ${file}...`);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix the specific problematic line
      const badLine = /colorize\([^)]*'all'[^)]*\)/;
      
      if (badLine.test(content)) {
        const fixedContent = content.replace(
          /colorize\(\s*['"]Tasks to merge \(comma-separated, 'all'[^)]*\)/g,
          'colorize(\'  Tasks to merge (comma-separated, "all", or "q" to cancel): \', \'cyan\' as ChalkColor)'
        );
        
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`  ✅ Fixed quotes in ${file}`);
      } else {
        console.log(`  No quote issues found in ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log('Done fixing quote issues.');
}

main();