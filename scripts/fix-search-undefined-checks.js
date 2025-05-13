/**
 * Fix undefined checks in search handler files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILES = [
  path.join(__dirname, '../cli/commands/search/search-handler.ts'),
  path.join(__dirname, '../cli/commands/search/search-handler-clean.ts')
];

async function fixUndefinedChecks() {
  for (const filePath of FILES) {
    try {
      console.log(`Processing ${filePath}`);
      
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Fix the extractedTerms undefined checks
      const newContent = content.replace(
        /if \(extractedInfo\.extractedTerms\.length > 0\) {/g,
        'if (extractedInfo.extractedTerms && extractedInfo.extractedTerms.length > 0) {'
      );
      
      // Fix boolean undefined check
      const finalContent = newContent.replace(
        /(const useFuzzy = options\.fuzzy) !== false;/g,
        '$1 !== undefined ? $1 !== false : true;'
      );
      
      // Write the file
      await fs.writeFile(filePath, finalContent, 'utf-8');
      
      console.log(`Fixed undefined checks in ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('All files processed successfully');
}

fixUndefinedChecks();