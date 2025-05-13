#!/usr/bin/env node

/**
 * Script to ensure the Task type is properly exported from core/types.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to types file
const rootDir = path.resolve(__dirname, '../../');
const coreTypesPath = path.join(rootDir, 'src/core/types.ts');

function fixCoreTypesExport() {
  console.log('Fixing Task export in src/core/types.ts...');
  
  try {
    if (!fs.existsSync(coreTypesPath)) {
      console.log(`File not found: ${coreTypesPath}`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(coreTypesPath, 'utf8');
    
    // Check if we're already declaring Task interface beyond the type alias
    const hasTaskInterface = content.includes('interface Task ') || 
                            content.includes('interface Task{');
    
    // If we don't have a Task interface yet, add one that extends the type alias
    if (!hasTaskInterface) {
      // Find the Task type alias declaration line
      const taskTypeRegex = /export\s+type\s+Task\s*=\s*typeof\s+tasks\.\$inferSelect;/;
      
      if (!taskTypeRegex.test(content)) {
        console.log('Could not find Task type alias in core/types.ts');
        return;
      }
      
      // Add an explicitly exported interface after the type alias
      const updatedContent = content.replace(
        taskTypeRegex,
        `export type Task = typeof tasks.$inferSelect;\n\n/**\n * Task interface that matches the database schema\n * Re-exported to ensure TypeScript recognizes it as an exported interface\n */\nexport interface Task extends typeof tasks.$inferSelect {}`
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(coreTypesPath, updatedContent, 'utf8');
      
      console.log('Successfully added explicit Task interface export in core/types.ts');
    } else {
      console.log('Task interface already exists in core/types.ts');
    }
  } catch (error) {
    console.error('Error fixing Task export:', error);
  }
}

// Run the fix
fixCoreTypesExport();