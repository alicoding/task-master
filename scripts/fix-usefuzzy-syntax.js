/**
 * Fix the useFuzzy syntax error in search handler files
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

async function fixUseFuzzySyntax() {
  for (const filePath of FILES) {
    try {
      console.log(`Processing ${filePath}`);
      
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Fix the useFuzzy syntax error
      const newContent = content.replace(
        /const useFuzzy = options\.fuzzy !== undefined \? const useFuzzy = options\.fuzzy !== false : true;/g,
        'const useFuzzy = options.fuzzy !== undefined ? options.fuzzy !== false : true;'
      );
      
      // Write the file
      await fs.writeFile(filePath, newContent, 'utf-8');
      
      console.log(`Fixed useFuzzy syntax in ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('All files processed successfully');
}

fixUseFuzzySyntax();