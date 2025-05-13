import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory path in ESM format
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../../');
const targetFiles = [
  path.join(rootDir, 'cli/commands/search/search-handler.ts'),
  path.join(rootDir, 'cli/commands/search/search-handler-clean.ts')
];

async function fixTaskImport(filePath) {
  console.log(`Fixing Task import in ${path.basename(filePath)}...`);
  
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if import already fixed
    if (content.includes('import { Task, ')) {
      console.log(`Task import already fixed in ${path.basename(filePath)}.`);
      return;
    }
    
    // Find the import statement for '../../../core/types'
    const importRegex = /import\s*{([^}]*)}\s*from\s*'(\.\.\/\.\.\/\.\.\/core\/types)'/;
    const match = content.match(importRegex);
    
    if (!match) {
      console.log(`Could not find types import in ${path.basename(filePath)}.`);
      return;
    }
    
    // Get the current imports
    const currentImports = match[1].split(',').map(imp => imp.trim());
    
    // Check if Task is already in the imports
    if (currentImports.includes('Task')) {
      console.log(`Task already imported in ${path.basename(filePath)}.`);
      return;
    }
    
    // Add Task to the imports
    currentImports.unshift('Task');
    
    // Build the new import statement
    const newImports = currentImports.join(', ');
    const newImportStatement = `import { ${newImports} } from '${match[2]}'`;
    
    // Replace the old import statement with the new one
    const updatedContent = content.replace(importRegex, newImportStatement);
    
    // Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully fixed Task import in ${path.basename(filePath)}.`);
  } catch (error) {
    console.error(`Error fixing Task import in ${path.basename(filePath)}:`, error);
  }
}

async function fixTaskImports() {
  console.log('Fixing Task imports in search handler files...');
  
  for (const file of targetFiles) {
    await fixTaskImport(file);
  }
  
  console.log('Task import fixes complete.');
}

// Run the function
fixTaskImports();