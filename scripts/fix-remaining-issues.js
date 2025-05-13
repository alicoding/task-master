#!/usr/bin/env node

/**
 * Fix remaining TypeScript issues in the codebase
 */

import fs from 'fs';
import path from 'path';

// Files that need the formatTags function
const FILES_WITH_FORMAT_TAGS = [
  'cli/commands/deduplicate/lib/merger-enhanced.ts',
  'src/cli/commands/deduplicate/lib/merger-enhanced.ts'
];

// Files with duplicate asChalkColor imports
const FILES_WITH_DUPLICATE_IMPORTS = [
  'cli/commands/add/add-command.ts',
  'cli/commands/add/interactive-form.ts'
];

function main() {
  console.log('Fixing remaining TypeScript issues...');
  
  // Fix formatTags function
  for (const file of FILES_WITH_FORMAT_TAGS) {
    console.log(`Processing ${file} for formatTags...`);
    
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if formatTags is already defined
    if (!content.includes('function formatTags')) {
      // Add formatTags function
      const formatTagsFunction = `
/**
 * Helper to format tags for display
 */
function formatTags(tags: string[] | null, color: string): string {
  if (!tags || tags.length === 0) {
    return colorize('none', asChalkColor('gray'));
  }
  return tags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ');
}
`;
      
      // Insert formatTags function before the last function in the file
      const lastFunctionPos = content.lastIndexOf('function');
      if (lastFunctionPos !== -1) {
        const insertPos = content.lastIndexOf('}', lastFunctionPos) + 1;
        content = content.slice(0, insertPos) + "\n" + formatTagsFunction + content.slice(insertPos);
        
        // Save the modified file
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Added formatTags function to: ${file}`);
      } else {
        console.log(`❌ Could not find suitable position to add formatTags function in: ${file}`);
      }
    } else {
      console.log(`formatTags function already exists in: ${file}`);
    }
  }
  
  // Fix duplicate imports
  for (const file of FILES_WITH_DUPLICATE_IMPORTS) {
    console.log(`Processing ${file} for duplicate imports...`);
    
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace duplicate imports
    const lines = content.split('\n');
    let importLines = [];
    let updatedLines = [];
    let hasChalkImport = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('import') && 
          (line.includes('ChalkColor') || line.includes('asChalkColor'))) {
        // Collect the import line but don't add it yet
        importLines.push(line);
        
        if (line.includes('chalk-utils')) {
          hasChalkImport = true;
        }
      } else {
        updatedLines.push(line);
      }
    }
    
    // If we have a proper chalk-utils import, add it at the beginning
    if (hasChalkImport) {
      const consolidatedImport = "import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';";
      updatedLines = [
        ...lines.slice(0, importLines[0].startsWith('import') ? 0 : importLines.indexOf(l => l.startsWith('import'))),
        consolidatedImport,
        ...updatedLines
      ];
      
      // Save the modified file
      fs.writeFileSync(fullPath, updatedLines.join('\n'), 'utf8');
      console.log(`✅ Fixed duplicate imports in: ${file}`);
    } else {
      console.log(`❌ Could not find chalk-utils import in: ${file}`);
    }
  }
  
  console.log('Completed fixing remaining TypeScript issues.');
}

main();