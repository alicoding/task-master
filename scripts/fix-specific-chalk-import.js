/**
 * Direct fix for search-handler.ts ChalkColor import
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE_PATH = path.join(__dirname, '../cli/commands/search/search-handler.ts');
const OLD_IMPORT = `import { ChalkColor } from "@/cli/utils/chalk-utils";`;
const NEW_IMPORT = `import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";`;

async function fixSearchHandlerImport() {
  try {
    console.log(`Processing ${FILE_PATH}`);
    
    // Read the file
    const content = await fs.readFile(FILE_PATH, 'utf-8');
    
    // Replace the import
    const newContent = content.replace(OLD_IMPORT, NEW_IMPORT);
    
    // Write the file
    await fs.writeFile(FILE_PATH, newContent, 'utf-8');
    
    console.log('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    process.exit(1);
  }
}

fixSearchHandlerImport();