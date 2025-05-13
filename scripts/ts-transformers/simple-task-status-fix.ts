/**
 * Simple TypeScript Transformer for TaskStatus and TaskReadiness
 * 
 * This transformer directly edits the files without complex AST transformations
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Patterns to search for
const STATUS_PATTERNS = [
  'filters.status = options.status',
  `filters.status = value`
];

const READINESS_PATTERNS = [
  'filters.readiness = options.readiness',
  `filters.readiness = value`
];

// Replacement patterns
const STATUS_REPLACEMENTS = [
  'filters.status = asTaskStatus(options.status)',
  `filters.status = asTaskStatus(value)`
];

const READINESS_REPLACEMENTS = [
  'filters.readiness = asTaskReadiness(options.readiness)',
  `filters.readiness = asTaskReadiness(value)`
];

// Import statement to add
const IMPORT_STATEMENT = `import { asTaskStatus, asTaskReadiness } from '@/core/utils/type-safety';`;

// Files to process
const FILES_TO_PROCESS = [
  path.join(__dirname, '../../cli/commands/search/search-handler.ts'),
  path.join(__dirname, '../../cli/commands/search/search-handler-clean.ts')
];

async function fixTaskStatusTypes() {
  console.log('Starting simple TaskStatus and TaskReadiness fixes...');
  
  let totalStatusFixes = 0;
  let totalReadinessFixes = 0;
  let filesChanged = 0;
  
  for (const filePath of FILES_TO_PROCESS) {
    try {
      console.log(`Processing ${filePath}`);
      
      // Read the file
      let content = await fs.readFile(filePath, 'utf-8');
      let originalContent = content;
      
      // Add import statement if it doesn't exist
      if (!content.includes('asTaskStatus') && !content.includes('asTaskReadiness')) {
        // Find a good place to add the import
        const importIndex = content.lastIndexOf('import ');
        if (importIndex !== -1) {
          // Find the end of the import section
          const importSectionEnd = content.indexOf('\n\n', importIndex);
          if (importSectionEnd !== -1) {
            // Add the import at the end of the import section
            content = content.substring(0, importSectionEnd + 1) + 
                      IMPORT_STATEMENT + '\n' +
                      content.substring(importSectionEnd + 1);
          }
        }
      }
      
      // Apply status fixes
      let statusFixes = 0;
      for (let i = 0; i < STATUS_PATTERNS.length; i++) {
        const pattern = STATUS_PATTERNS[i];
        const replacement = STATUS_REPLACEMENTS[i];
        
        // Skip if the fix is already applied
        if (!content.includes(pattern) || content.includes(replacement)) {
          continue;
        }
        
        // Apply the fix
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        statusFixes++;
      }
      
      // Apply readiness fixes
      let readinessFixes = 0;
      for (let i = 0; i < READINESS_PATTERNS.length; i++) {
        const pattern = READINESS_PATTERNS[i];
        const replacement = READINESS_REPLACEMENTS[i];
        
        // Skip if the fix is already applied
        if (!content.includes(pattern) || content.includes(replacement)) {
          continue;
        }
        
        // Apply the fix
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
        readinessFixes++;
      }
      
      // Write the file if changes were made
      if (content !== originalContent) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`  - Fixed ${statusFixes} status assignments`);
        console.log(`  - Fixed ${readinessFixes} readiness assignments`);
        
        totalStatusFixes += statusFixes;
        totalReadinessFixes += readinessFixes;
        filesChanged++;
      } else {
        console.log(`  - No changes needed`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('\nTransformation complete!');
  console.log(`TaskStatus fixes: ${totalStatusFixes}`);
  console.log(`TaskReadiness fixes: ${totalReadinessFixes}`);
  console.log(`Total files changed: ${filesChanged}`);
}

fixTaskStatusTypes().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});