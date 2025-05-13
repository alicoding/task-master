#!/usr/bin/env node

/**
 * Script to update import paths in the src directory to use the new structure
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');

// Regular expression to match import statements
const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^\s,;]+|[\w\d$_]+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^\s,;]+|[\w\d$_]+))*\s+from\s+)?['"]([^'"]+)['"]/g;

/**
 * Update import paths in a file
 */
async function updateImports(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    let updatedContent = content;
    
    // Find and replace imports
    let matches = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, importPath] = match;
      matches.push({ fullMatch, importPath });
    }
    
    // Reset regex
    importRegex.lastIndex = 0;
    
    // Process matches in reverse order to avoid messing up indices
    for (const { fullMatch, importPath } of matches) {
      // Only update core/, db/, or cli/ imports from another directory
      if (importPath.startsWith('../core/') || 
          importPath.startsWith('../db/') || 
          importPath.startsWith('../cli/')) {
        
        // Calculate the new import path
        const newImportPath = importPath.replace(/^\.\.\//, '../');
        
        if (newImportPath !== importPath) {
          // Replace the import path in the full import statement
          const newImport = fullMatch.replace(importPath, newImportPath);
          updatedContent = updatedContent.replace(fullMatch, newImport);
          console.log(`  Updated: ${importPath} -> ${newImportPath}`);
        }
      }
    }
    
    // Write the updated content back to the file
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`  Updated file: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Recursively process all TypeScript files in a directory
 */
async function processDirectory(dir) {
  let updatedFiles = 0;
  
  // Get all entries in the directory
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  // Process each entry
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Process subdirectory
      updatedFiles += await processDirectory(entryPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      // Process TypeScript/JavaScript file
      const updated = await updateImports(entryPath);
      if (updated) {
        updatedFiles++;
      }
    }
  }
  
  return updatedFiles;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Updating import paths in src directory...');
    
    // Process all files in src directory
    const updatedFiles = await processDirectory(SRC_DIR);
    
    console.log(`\nDone! Updated ${updatedFiles} files.`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();