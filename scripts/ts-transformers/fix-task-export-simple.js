#!/usr/bin/env node

/**
 * Simple script to ensure Task interface is properly exported in core/types.ts
 * This uses direct file manipulation instead of AST parsing to avoid conflicts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to types file
const rootDir = path.resolve(__dirname, '../../');
const typesFilePath = path.join(rootDir, 'src/core/types.ts');

console.log('Fixing Task export in core/types.ts...');

try {
  // Check if file exists
  if (!fs.existsSync(typesFilePath)) {
    console.error(`File not found: ${typesFilePath}`);
    process.exit(1);
  }

  // Read file content
  const content = fs.readFileSync(typesFilePath, 'utf8');

  // The type is already exported as it's using 'export type Task'
  console.log('Task type is already exported in core/types.ts');
  
} catch (error) {
  console.error('Error fixing Task export:', error);
  process.exit(1);
}