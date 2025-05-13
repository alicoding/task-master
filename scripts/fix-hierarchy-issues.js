#!/usr/bin/env node

/**
 * Fix specific issues in the hierarchy repository
 */

import fs from 'fs';
import path from 'path';

function main() {
  console.log('Fixing hierarchy.ts issues...');
  
  const hierarchyPath = path.resolve(process.cwd(), 'src/core/repository/hierarchy.ts');
  if (!fs.existsSync(hierarchyPath)) {
    console.log(`File not found: ${hierarchyPath}`);
    return;
  }
  
  let content = fs.readFileSync(hierarchyPath, 'utf8');
  
  // Add Task type import if needed
  if (!content.includes('import { Task } from')) {
    content = content.replace('import { tasks, Task } from', 'import { Task } from');
  }
  
  // Replace tasks reference with more explicit Task array initialization
  content = content.replace(
    'const childrenIds = Array.from();',
    'const childrenIds: string[] = [];'
  );
  
  content = content.replace(
    'const directChildrenIds = Array.from();',
    'const directChildrenIds: string[] = [];'
  );
  
  content = content.replace(
    'const descendants = Array.from();',
    'const descendants: string[] = [];'
  );
  
  // Replace references to tasks global variable
  content = content.replace(
    /tasks\./g,
    'this.findAll().'
  );
  
  // Add type annotations
  content = content.replace(
    'findSiblings(sibling)',
    'findSiblings(sibling: Task)'
  );
  
  content = content.replace(
    'sortedByCreationDate(a, b)',
    'sortedByCreationDate(a: Task, b: Task)'
  );
  
  content = content.replace(
    'isLeafNode(task)',
    'isLeafNode(task: Task)'
  );
  
  content = content.replace(
    'sortedByTitle(a, b)',
    'sortedByTitle(a: Task, b: Task)'
  );
  
  fs.writeFileSync(hierarchyPath, content, 'utf8');
  console.log('✅ Fixed hierarchy.ts issues');
  
  // Fix formatter-enhanced.ts formatTags function
  const formatterPath = path.resolve(process.cwd(), 'cli/commands/deduplicate/lib/formatter-enhanced.ts');
  if (fs.existsSync(formatterPath)) {
    console.log('Fixing formatter-enhanced.ts formatTags issues...');
    
    let formatterContent = fs.readFileSync(formatterPath, 'utf8');
    
    // Add formatTags function if missing
    if (!formatterContent.includes('function formatTags')) {
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
      
      // Insert before the first export declaration
      const exportPos = formatterContent.indexOf('export');
      if (exportPos !== -1) {
        formatterContent = formatterContent.slice(0, exportPos) + formatTagsFunction + '\n' + formatterContent.slice(exportPos);
        fs.writeFileSync(formatterPath, formatterContent, 'utf8');
        console.log('✅ Added formatTags function to formatter-enhanced.ts');
      }
    }
  }
  
  // Fix factory.ts imports
  const factoryPath = path.resolve(process.cwd(), 'src/core/repository/factory.ts');
  if (fs.existsSync(factoryPath)) {
    console.log('Fixing factory.ts import issues...');
    
    let factoryContent = fs.readFileSync(factoryPath, 'utf8');
    
    // Fix import paths with arithmetic expressions
    factoryContent = factoryContent.replace(
      "import { BetterSQLite3Database } from '(drizzle as number) - (orm as number)/(better as number) - (sqlite3 as number)';",
      "import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';"
    );
    
    factoryContent = factoryContent.replace(
      "import { Database } from '(better as number) - (sqlite3 as number)';",
      "import { Database } from 'better-sqlite3';"
    );
    
    factoryContent = factoryContent.replace(
      "import { initializeDb } from '@/(db as number) / (init as number)';",
      "import { initializeDb } from '@/db/init';"
    );
    
    factoryContent = factoryContent.replace(
      "import { BaseTaskRepository } from '@/(core as number) / (repository as number)/base';",
      "import { BaseTaskRepository } from '@/core/repository/base';"
    );
    
    factoryContent = factoryContent.replace(
      "import { logger } from '@/(core as number) / (utils as number)/logger';",
      "import { logger } from '@/core/utils/logger';"
    );
    
    fs.writeFileSync(factoryPath, factoryContent, 'utf8');
    console.log('✅ Fixed factory.ts import paths');
  }
  
  console.log('Completed fixing remaining TypeScript issues.');
}

main();