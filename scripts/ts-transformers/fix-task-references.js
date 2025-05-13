#!/usr/bin/env node

/**
 * Script to fix Task references in repository files by importing Task type from @/core/types
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to repository files with Task references
const rootDir = path.resolve(__dirname, '../../');
const repoFiles = [
  path.join(rootDir, 'src/core/repository/optimized-operations.ts'),
  path.join(rootDir, 'src/core/repository/search.ts')
];

function fixTaskReferences(filePath) {
  console.log(`Fixing Task references in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if Task is already imported
    const hasTaskImport = content.includes("import { Task }") || 
                          content.includes("import { Task,") ||
                          content.includes("import {Task,") ||
                          content.includes(", Task,") ||
                          content.includes(", Task }");
    
    let updatedContent = content;
    
    // Add Task import if it doesn't exist
    if (!hasTaskImport) {
      // Look for existing imports from @/core/types
      const typeImportRegex = /import\s*{([^}]*)}\s*from\s*['"]@\/core\/types['"]/;
      const typeImportMatch = content.match(typeImportRegex);
      
      if (typeImportMatch) {
        // Add Task to existing import
        updatedContent = content.replace(
          typeImportRegex,
          (match, imports) => {
            const newImports = imports.split(',')
              .map(item => item.trim())
              .filter(item => item !== '');
            
            if (!newImports.includes('Task')) {
              newImports.push('Task');
            }
            
            return `import { ${newImports.join(', ')} } from '@/core/types'`;
          }
        );
      } else {
        // Add new import statement
        updatedContent = `import { Task } from '@/core/types';\n${content}`;
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully fixed Task references in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing Task references in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of repoFiles) {
  fixTaskReferences(file);
}

console.log('Task references fix completed');