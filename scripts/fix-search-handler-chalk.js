/**
 * Direct fix for search-handler.ts ChalkColor and asChalkColor imports and usage
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE_PATH = path.join(__dirname, '../cli/commands/search/search-handler.ts');

// First, update the import
async function fixSearchHandlerChalk() {
  try {
    console.log(`Processing ${FILE_PATH}`);
    
    // Read the file
    let content = await fs.readFile(FILE_PATH, 'utf-8');
    
    // Modify import for ChalkColor
    content = content.replace(
      `import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils";`,
      `import { ChalkColor } from "../../utils/chalk-utils";`
    );
    
    // Update asChalkColor usages
    content = content.replace(/asChalkColor\(['"](.*?)['"](?:\)?)/g, (match, color) => {
      return `'${color}' as ChalkColor`;
    });
    
    // Write the file
    await fs.writeFile(FILE_PATH, content, 'utf-8');
    
    console.log('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    process.exit(1);
  }
}

fixSearchHandlerChalk();