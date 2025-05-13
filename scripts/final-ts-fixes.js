#!/usr/bin/env node

/**
 * Final TypeScript fixes for remaining issues
 */

import fs from 'fs';
import path from 'path';

function main() {
  console.log('Applying final TypeScript fixes...');
  
  // 1. Fix formatter-enhanced.ts to properly define colorize in formatTags
  const formatterPath = path.resolve(process.cwd(), 'cli/commands/deduplicate/lib/formatter-enhanced.ts');
  if (fs.existsSync(formatterPath)) {
    console.log('Fixing formatter-enhanced.ts...');
    
    let content = fs.readFileSync(formatterPath, 'utf8');
    
    // Update colorize reference in formatTags
    content = content.replace(
      'function formatTags(tags: string[] | null, color: string): string {\n' +
      '  if (!tags || tags.length === 0) {\n' +
      '    return colorize(\'none\', asChalkColor(\'gray\'));\n' +
      '  }\n' +
      '  return tags.map(tag => colorize(tag, asChalkColor(\'cyan\'))).join(\', \');\n' +
      '}',
      
      'function formatTags(tags: string[] | null, color: string, colorize: ColorizeFunction): string {\n' +
      '  if (!tags || tags.length === 0) {\n' +
      '    return colorize(\'none\', asChalkColor(\'gray\'));\n' +
      '  }\n' +
      '  return tags.map(tag => colorize(tag, asChalkColor(\'cyan\'))).join(\', \');\n' +
      '}'
    );
    
    // Update all usages of formatTags to pass colorize
    content = content.replace(
      /formatTags\(([^,]+), ([^)]+)\)/g,
      'formatTags($1, $2, colorize)'
    );
    
    fs.writeFileSync(formatterPath, content, 'utf8');
    console.log('✅ Fixed formatter-enhanced.ts');
  }
  
  // 2. Fix the hierarchy repository to remove findAll and tasks references
  const hierarchyPath = path.resolve(process.cwd(), 'src/core/repository/hierarchy.ts');
  if (fs.existsSync(hierarchyPath)) {
    console.log('Fixing hierarchy.ts...');
    
    let content = fs.readFileSync(hierarchyPath, 'utf8');
    
    // Remove tasks import
    content = content.replace(
      /import \{ tasks, Task \} from '@\/core\/types';/,
      "import { Task } from '@/core/types';"
    );
    
    // Fix Array.from
    content = content.replace(
      /const childrenIds = Array\.from\(\);/g,
      'const childrenIds: string[] = [];'
    );
    
    content = content.replace(
      /const directChildrenIds = Array\.from\(\);/g,
      'const directChildrenIds: string[] = [];'
    );
    
    content = content.replace(
      /const descendants = Array\.from\(\);/g,
      'const descendants: string[] = [];'
    );
    
    // Replace references to tasks global variable with findAll method
    content = content.replace(
      /tasks\./g,
      'this._allTasks.'
    );
    
    content = content.replace(
      /this\.findAll\(\)\./g,
      'this._allTasks.'
    );
    
    // Add _allTasks property
    content = content.replace(
      /export class TaskHierarchyRepository extends BaseTaskRepository {/,
      'export class TaskHierarchyRepository extends BaseTaskRepository {\n  private _allTasks: Task[] = [];\n'
    );
    
    // Override findAll to populate _allTasks
    if (!content.includes('_allTasks')) {
      const findAllMethod = `
  /**
   * Find all tasks and cache them for hierarchy operations
   */
  override findAll(options?: any): Task[] {
    this._allTasks = super.findAll(options) || [];
    return this._allTasks;
  }
`;
      
      // Insert after the class declaration
      const insertPos = content.indexOf('export class TaskHierarchyRepository extends BaseTaskRepository {') + 
                         'export class TaskHierarchyRepository extends BaseTaskRepository {'.length;
      
      content = content.slice(0, insertPos) + findAllMethod + content.slice(insertPos);
    }
    
    // Add missing type annotations
    content = content.replace(
      /findSiblings\(sibling\)/,
      'findSiblings(sibling: Task)'
    );
    
    content = content.replace(
      /sortedByCreationDate\(a, b\)/,
      'sortedByCreationDate(a: Task, b: Task)'
    );
    
    content = content.replace(
      /isLeafNode\(task\)/,
      'isLeafNode(task: Task)'
    );
    
    content = content.replace(
      /sortedByTitle\(a, b\)/,
      'sortedByTitle(a: Task, b: Task)'
    );
    
    fs.writeFileSync(hierarchyPath, content, 'utf8');
    console.log('✅ Fixed hierarchy.ts');
  }
  
  // 3. Fix factory.ts imports again if needed
  const factoryPath = path.resolve(process.cwd(), 'src/core/repository/factory.ts');
  if (fs.existsSync(factoryPath)) {
    console.log('Fixing factory.ts import issues...');
    
    let factoryContent = fs.readFileSync(factoryPath, 'utf8');
    
    // Fix import paths with arithmetic expressions that weren't caught before
    factoryContent = factoryContent.replace(
      /import \{ Database \} from '\(better as number\) - \(sqlite3 as number\)';/,
      "import { Database } from 'better-sqlite3';"
    );
    
    factoryContent = factoryContent.replace(
      /import \{ initializeDb \} from '@\/\(db as number\) \/ \(init as number\)';/,
      "import { initializeDb } from '@/db/init';"
    );
    
    factoryContent = factoryContent.replace(
      /import \{ BaseTaskRepository \} from '@\/\(core as number\) \/ \(repository as number\)\/base';/,
      "import { BaseTaskRepository } from '@/core/repository/base';"
    );
    
    factoryContent = factoryContent.replace(
      /import \{ logger \} from '@\/\(core as number\) \/ \(utils as number\)\/logger';/,
      "import { logger } from '@/core/utils/logger';"
    );
    
    fs.writeFileSync(factoryPath, factoryContent, 'utf8');
    console.log('✅ Fixed factory.ts import paths');
  }
  
  console.log('Completed final TypeScript fixes.');
}

main();