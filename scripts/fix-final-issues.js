#!/usr/bin/env node

/**
 * Fix final TypeScript issues
 */

import fs from 'fs';
import path from 'path';

// Files to add missing imports/functions
const FILES_TO_FIX = {
  // Add ChalkStyle and createColorize
  'cli/commands/add/add-command.ts': {
    imports: [
      "import { ChalkColor, asChalkColor, ChalkStyle } from '@/cli/utils/chalk-utils';",
      "import { createColorize } from '@/cli/utils/chalk-utils';"
    ],
    matcher: "import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';"
  },
  
  'cli/commands/add/interactive-form.ts': {
    imports: [
      "import { ChalkColor, asChalkColor, ChalkStyle } from '@/cli/utils/chalk-utils';",
      "import { createColorize } from '@/cli/utils/chalk-utils';"
    ],
    matcher: "import { ChalkColor, asChalkColor } from '@/cli/utils/chalk-utils';"
  },
  
  // Add formatTags to formatter-enhanced.ts
  'cli/commands/deduplicate/lib/formatter-enhanced.ts': {
    functions: [
      `/**
 * Helper to format tags for display
 */
function formatTags(tags: string[] | null, color: string): string {
  if (!tags || tags.length === 0) {
    return colorize('none', asChalkColor('gray'));
  }
  return tags.map(tag => colorize(tag, asChalkColor('cyan'))).join(', ');
}`
    ],
    matcher: "export const" // Insert before first export
  }
};

function main() {
  console.log('Fixing final TypeScript issues...');
  
  for (const [file, fix] of Object.entries(FILES_TO_FIX)) {
    const fullPath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }
    
    console.log(`Processing ${file}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Add imports if specified
    if (fix.imports && fix.imports.length > 0) {
      if (content.includes(fix.matcher)) {
        content = content.replace(fix.matcher, fix.imports.join('\n'));
        console.log(`  Added imports to ${file}`);
        modified = true;
      } else {
        console.log(`  Could not find import match in ${file}`);
      }
    }
    
    // Add functions if specified
    if (fix.functions && fix.functions.length > 0) {
      if (content.includes(fix.matcher)) {
        const insertPos = content.indexOf(fix.matcher);
        const newContent = content.slice(0, insertPos) + 
                          fix.functions.join('\n\n') + '\n\n' + 
                          content.slice(insertPos);
        content = newContent;
        console.log(`  Added functions to ${file}`);
        modified = true;
      } else {
        console.log(`  Could not find function match in ${file}`);
      }
    }
    
    // Save changes if modified
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    }
  }
  
  // Special fix for factory.ts arithmetic operations
  const factoryPath = path.resolve(process.cwd(), 'src/core/repository/factory.ts');
  if (fs.existsSync(factoryPath)) {
    console.log('Fixing arithmetic operations in factory.ts...');
    
    let content = fs.readFileSync(factoryPath, 'utf8');
    
    // Fix the arithmetic import paths
    content = content.replace(
      "import { BetterSQLite3Database } from '(drizzle as number) - (orm as number)/(better as number) - (sqlite3 as number)';",
      "import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';"
    );
    
    content = content.replace(
      "import { Database } from '(better as number) - (sqlite3 as number)';",
      "import { Database } from 'better-sqlite3';"
    );
    
    content = content.replace(
      "import { initializeDb } from '@/(db as number) / (init as number)';",
      "import { initializeDb } from '@/db/init';"
    );
    
    content = content.replace(
      "import { BaseTaskRepository } from '@/(core as number) / (repository as number)/base';",
      "import { BaseTaskRepository } from '@/core/repository/base';"
    );
    
    content = content.replace(
      "import { logger } from '@/(core as number) / (utils as number)/logger';",
      "import { logger } from '@/core/utils/logger';"
    );
    
    fs.writeFileSync(factoryPath, content, 'utf8');
    console.log('✅ Fixed factory.ts import paths');
  }
  
  // Special fix for hierarchy.ts parent_id issues
  const hierarchyPath = path.resolve(process.cwd(), 'src/core/repository/hierarchy.ts');
  if (fs.existsSync(hierarchyPath)) {
    console.log('Fixing hierarchy.ts parent_id references...');
    
    let content = fs.readFileSync(hierarchyPath, 'utf8');
    
    // Fix the tasks import
    content = content.replace(
      "import { tasks, Task } from '@/core/types';",
      "import { Task } from '@/core/types';"
    );
    
    // Fix parent_id references
    content = content.replace(/parent_id/g, 'parentId');
    
    // Fix Array.from usage
    content = content.replace(
      "const childrenIds = Array.from();",
      "const childrenIds: string[] = [];"
    );
    
    content = content.replace(
      "const directChildrenIds = Array.from();",
      "const directChildrenIds: string[] = [];"
    );
    
    content = content.replace(
      "const descendants = Array.from();",
      "const descendants: string[] = [];"
    );
    
    // Add type annotations to parameters
    content = content.replace(
      "findSiblings(sibling) {",
      "findSiblings(sibling: Task) {"
    );
    
    content = content.replace(
      "sortedByCreationDate(a, b) {",
      "sortedByCreationDate(a: Task, b: Task) {"
    );
    
    content = content.replace(
      "isLeafNode(task) {",
      "isLeafNode(task: Task) {"
    );
    
    content = content.replace(
      "sortedByTitle(a, b) {",
      "sortedByTitle(a: Task, b: Task) {"
    );
    
    fs.writeFileSync(hierarchyPath, content, 'utf8');
    console.log('✅ Fixed hierarchy.ts issues');
  }
  
  console.log('Completed fixing final TypeScript issues.');
}

main();