/**
 * Simple TypeScript Transformer for ChalkColor imports
 * 
 * This transformer adds the asChalkColor import to files that use it
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Files to process
const FILES_TO_PROCESS = [
  path.join(__dirname, '../../cli/commands/search/search-handler.ts')
];

// Import statement to add
const IMPORT_STATEMENT = `import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";`;
const REPLACEMENT_IMPORT = `import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";`;

async function fixChalkImports() {
  console.log('Starting ChalkColor imports fix...');
  
  let filesChanged = 0;
  
  for (const filePath of FILES_TO_PROCESS) {
    try {
      console.log(`Processing ${filePath}`);
      
      // Read the file
      let content = await fs.readFile(filePath, 'utf-8');
      let originalContent = content;
      
      // Check for existing import pattern and asChalkColor uses
      if (content.includes('import { ChalkColor }') &&
          content.includes('asChalkColor(') &&
          !content.includes('asChalkColor from')) {
        // Replace the import with the updated one
        content = content.replace(/import\s*{\s*ChalkColor\s*}\s*from\s*["'][@/\w./]+["'];/, REPLACEMENT_IMPORT);
        console.log('  - Found pattern to replace');
      }
      
      // Write the file if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`  - Fixed ChalkColor import`);
        filesChanged++;
      } else {
        console.log(`  - No changes needed`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('\nTransformation complete!');
  console.log(`Total files changed: ${filesChanged}`);
}

fixChalkImports().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});