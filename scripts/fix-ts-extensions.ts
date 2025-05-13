#!/usr/bin/env node

/**
 * Script to remove .ts extensions from import paths for proper compilation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');

// Regular expression to match import statements with .ts extension
const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^\s,;]+|[\w\d$_]+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^\s,;]+|[\w\d$_]+))*\s+from\s+)?['"]([^'"]+\.ts)['"]/g;

/**
 * Update import paths in a file to remove .ts extensions
 */
async function updateImports(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    let updatedContent = content;
    
    // Find all import statements with .ts extensions
    const matches = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, importPath] = match;
      matches.push({ fullMatch, importPath });
    }
    
    // Reset regex
    importRegex.lastIndex = 0;
    
    // Process matches in reverse order to avoid messing up indices
    for (const { fullMatch, importPath } of matches) {
      // Remove .ts extension from the import path
      const newImportPath = importPath.replace(/\.ts$/, '');
      
      // Replace the import path in the full import statement
      const newImport = fullMatch.replace(importPath, newImportPath);
      updatedContent = updatedContent.replace(fullMatch, newImport);
      console.log(`  Updated: ${importPath} -> ${newImportPath}`);
    }
    
    // Write the updated content back to the file if changes were made
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
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      // Process TypeScript file
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
    console.log('Removing .ts extensions from import paths...');
    
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