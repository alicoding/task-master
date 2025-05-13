#!/usr/bin/env node

/**
 * Simple script to fix nullable property access in metadata-command.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to metadata command file
const rootDir = path.resolve(__dirname, '../../');
const metadataCommandPath = path.join(rootDir, 'cli/commands/metadata/metadata-command.ts');

function fixNullableAccess() {
  console.log('Fixing nullable property access in metadata-command.ts...');
  
  try {
    if (!fs.existsSync(metadataCommandPath)) {
      console.log(`File not found: ${metadataCommandPath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(metadataCommandPath, 'utf8');
    
    // Add null checks for result.result property access
    const updatedContent = content
      .replace(
        /result\.result\./g,
        'result?.result?.'
      );
    
    // Write the updated content back to the file
    fs.writeFileSync(metadataCommandPath, updatedContent, 'utf8');
    
    console.log('Successfully fixed nullable property access in metadata-command.ts');
  } catch (error) {
    console.error('Error fixing nullable property access:', error);
  }
}

// Run the fix
fixNullableAccess();