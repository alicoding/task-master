#!/usr/bin/env node
/**
 * Fix imports for asChalkColor in CLI directory
 * 
 * This script fixes the imports for the asChalkColor function in the CLI directory
 * by ensuring they are imported correctly from the relative chalk-utils file
 * instead of using the @/ alias which might not be resolved correctly.
 */

import fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Find all TypeScript files in the CLI directory
const files = glob.sync('cli/commands/**/*.ts', { cwd: rootDir });

// Keep track of changes
let fixedCount = 0;

// Process each file
files.forEach(relativeFilePath => {
  const filePath = path.join(rootDir, relativeFilePath);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file imports asChalkColor using the wrong path
  if (content.includes('import { asChalkColor }') || 
      content.includes('import { ChalkColor, asChalkColor }')) {
    
    console.log(`Processing ${relativeFilePath}`);
    
    // Determine the relative path to chalk-utils.ts
    const fileDir = path.dirname(relativeFilePath);
    const relativePath = path.relative(fileDir, 'cli/utils');
    const relativeImportPath = relativePath.replace(/\\/g, '/');
    
    // Fix the import path
    let newContent = content;
    
    // Replace import { asChalkColor } from "@/cli/utils/chalk-utils"
    newContent = newContent.replace(
      /import\s*{\s*asChalkColor\s*}\s*from\s*["']@\/cli\/utils\/chalk-utils["']/g,
      `import { asChalkColor } from "${relativeImportPath ? relativeImportPath : '.'}/chalk-utils"`
    );
    
    // Replace import { ChalkColor, asChalkColor } from "@/cli/utils/chalk-utils"
    newContent = newContent.replace(
      /import\s*{\s*ChalkColor,\s*asChalkColor\s*}\s*from\s*["']@\/cli\/utils\/chalk-utils["']/g,
      `import { ChalkColor, asChalkColor } from "${relativeImportPath ? relativeImportPath : '.'}/chalk-utils"`
    );
    
    // Replace import { asChalkColor, ChalkColor } from "@/cli/utils/chalk-utils"
    newContent = newContent.replace(
      /import\s*{\s*asChalkColor,\s*ChalkColor\s*}\s*from\s*["']@\/cli\/utils\/chalk-utils["']/g,
      `import { asChalkColor, ChalkColor } from "${relativeImportPath ? relativeImportPath : '.'}/chalk-utils"`
    );
    
    // Write the changes back if content was modified
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  Fixed import in ${relativeFilePath}`);
      fixedCount++;
    }
  }
});

console.log(`Fixed imports in ${fixedCount} files`);