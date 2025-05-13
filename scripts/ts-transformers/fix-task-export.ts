import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory path in ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../');
const typesFilePath = path.join(rootDir, 'src/core/types.ts');

async function fixTaskExport() {
  console.log('Fixing Task export in core/types.ts...');
  
  try {
    // Read the current content of the types file
    const content = await fs.readFile(typesFilePath, 'utf8');
    
    // Check if Task interface is already exported
    if (content.includes('export interface Task {')) {
      console.log('Task interface is already exported, no changes needed.');
      return;
    }
    
    // Replace the interface Task declaration with an exported interface
    const updatedContent = content.replace(
      /interface Task {/g, 
      'export interface Task {'
    );
    
    // Write the updated content back to the file
    await fs.writeFile(typesFilePath, updatedContent, 'utf8');
    
    console.log('Successfully added export to Task interface in core/types.ts');
  } catch (error) {
    console.error('Error fixing Task export:', error);
  }
}

// Run the function
fixTaskExport();