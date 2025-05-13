#!/usr/bin/env node

/**
 * Simple script to fix the useFuzzy parameter in search handler files
 * Uses direct file manipulation instead of AST parsing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to search handler files
const rootDir = path.resolve(__dirname, '../../');
const searchHandlerFiles = [
  path.join(rootDir, 'cli/commands/search/search-handler.ts'),
  path.join(rootDir, 'cli/commands/search/search-handler-clean.ts')
];

function fixUseFuzzyParameter(filePath) {
  console.log(`Fixing useFuzzy parameter in ${path.basename(filePath)}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the function declaration for displaySearchExplanation
    const functionRegex = /function\s+displaySearchExplanation\s*\(\s*([^)]*)\s*\)/;
    const parameterRegex = /useFuzzy:\s*boolean/;
    
    // Check if the function exists
    const functionMatch = content.match(functionRegex);
    if (!functionMatch) {
      console.log(`Function not found in ${path.basename(filePath)}`);
      return;
    }
    
    // Get the function parameters
    const parameters = functionMatch[1];
    
    // Check if the parameter already has the optional type
    if (parameters.includes('useFuzzy: boolean | undefined')) {
      console.log(`Parameter already fixed in ${path.basename(filePath)}`);
      return;
    }
    
    // Update the parameter type
    const updatedContent = content.replace(
      parameterRegex,
      'useFuzzy: boolean | undefined'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`Successfully updated parameter in ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Error fixing parameter in ${path.basename(filePath)}:`, error);
  }
}

// Process each file
for (const file of searchHandlerFiles) {
  fixUseFuzzyParameter(file);
}

console.log('useFuzzy parameter fix completed');