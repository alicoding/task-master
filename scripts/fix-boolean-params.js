/**
 * Fix boolean parameter type compatibility issues
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

async function fixBooleanParams() {
  for (const filePath of FILES) {
    try {
      console.log(`Processing ${filePath}`);
      
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Find the displaySearchExplanation function definition
      const functionRegex = /function displaySearchExplanation\(\s*extractedInfo:\s*ExtractedSearchFilters,\s*query:\s*string,\s*useFuzzy:\s*boolean,\s*useColor\?:\s*boolean\)/;
      
      // Update the parameter to accept undefined
      const newContent = content.replace(
        functionRegex,
        'function displaySearchExplanation(extractedInfo: ExtractedSearchFilters, query: string, useFuzzy: boolean | undefined, useColor?: boolean)'
      );
      
      // Write the file
      await fs.writeFile(filePath, newContent, 'utf-8');
      
      console.log(`Fixed boolean parameter type in ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('All files processed successfully');
}

fixBooleanParams();