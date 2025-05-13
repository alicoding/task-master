#!/usr/bin/env node

/**
 * Script to fix duplicate schema identifiers in repository files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to repository files with schema imports
const rootDir = path.resolve(__dirname, '../../');
const repoFiles = [
  path.join(rootDir, 'src/core/repository/optimized-operations.ts'),
  path.join(rootDir, 'src/core/repository/search.ts')
];

function fixSchemaImports(filePath) {
  console.log(`Fixing schema imports in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix duplicate schema imports
    const updatedContent = content
      // Replace multiple imports of tasks with a single import
      .replace(
        /import\s*{[^}]*tasks[^}]*}\s*from\s*['"]@\/db\/schema['"]\s*;?\s*import\s*{[^}]*tasks[^}]*}\s*from\s*['"]@\/db\/schema['"]/g,
        "import { tasks } from '@/db/schema'"
      )
      // Fix double imports on the same line
      .replace(
        /import\s*{([^}]*tasks[^}]*)}\s*from\s*['"]@\/db\/schema['"]/g,
        (match, importList) => {
          // Remove duplicate tasks
          const uniqueImports = [...new Set(importList.split(',')
            .map(item => item.trim())
            .filter(item => item !== ''))]
            .join(', ');
          
          return `import { ${uniqueImports} } from '@/db/schema'`;
        }
      );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully fixed schema imports in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing schema imports in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of repoFiles) {
  fixSchemaImports(file);
}

console.log('Schema import fixes completed');