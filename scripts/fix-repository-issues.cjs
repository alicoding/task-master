#!/usr/bin/env node

/**
 * Fix repository issues
 */

const fs = require('fs');
const path = require('path');

// Fix factory.ts import issues with arithmetic expressions
function fixFactoryImports() {
  const filePath = path.join(__dirname, '../core/repository/factory.ts');
  console.log(`Fixing factory.ts imports...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix import paths with arithmetic expressions
  content = content.replace(
    /import\s*{[^}]+}\s*from\s*['"]\(better as number\) - \(sqlite3 as number\)['"]/,
    'import { BetterSQLite3Database } from \'better-sqlite3\''
  );
  
  content = content.replace(
    /import\s*{[^}]+}\s*from\s*['"]\(drizzle as number\) - \(orm as number\)\/\(better as number\) - \(sqlite3 as number\)['"]/,
    'import { BetterSQLite3Database } from \'drizzle-orm/better-sqlite3\''
  );
  
  content = content.replace(
    /import\s*{[^}]+}\s*from\s*['"]\@\/\(db as number\) \/ \(init as number\)['"]/,
    'import { initializeDatabase } from \'@/db/init\''
  );
  
  content = content.replace(
    /import\s*{[^}]+}\s*from\s*['"]\@\/\(core as number\) \/ \(repository as number\)\/base['"]/,
    'import { TaskRepository } from \'@/core/repository/base\''
  );
  
  content = content.replace(
    /import\s*{[^}]+}\s*from\s*['"]\@\/\(core as number\) \/ \(utils as number\)\/logger['"]/,
    'import { logger } from \'@/core/utils/logger\''
  );
  
  console.log('✅ Fixed factory.ts import paths');
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix hierarchy.ts issues with Array.from and tasks references
function fixHierarchyIssues() {
  const filePath = path.join(__dirname, '../core/repository/hierarchy.ts');
  console.log(`Fixing hierarchy.ts issues...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add _allTasks property to the class if not already present
  if (!content.includes('_allTasks:')) {
    const classStart = content.match(/export\s+class\s+TaskHierarchyRepository\s+extends\s+TaskRepository\s*{/);
    if (classStart) {
      content = content.replace(
        classStart[0],
        classStart[0] + '\n  private _allTasks: Task[] = [];\n'
      );
      console.log('✅ Added _allTasks property');
    } else {
      console.log('❌ Could not find class declaration');
    }
  }
  
  // Fix Array.from(tasks) usage with proper type annotations
  content = content.replace(
    /Array\.from\(tasks\)/g,
    'this._allTasks.slice()'
  );
  console.log('✅ Fixed Array.from(tasks) usage');
  
  // Fix missing parameter types
  content = content.replace(
    /isSiblingOf\(sibling\)/g,
    'isSiblingOf(sibling: Task)'
  );
  
  content = content.replace(
    /compareByTitle\(a, b\)/g,
    'compareByTitle(a: Task, b: Task)'
  );
  
  content = content.replace(
    /isDescendantOf\(task\)/g,
    'isDescendantOf(task: Task)'
  );
  
  console.log('✅ Added parameter type annotations');
  
  // Fix get all method to initialize _allTasks
  content = content.replace(
    /getAll\(\)\s*{\s*return Array\.from\(tasks\);/g,
    'getAll() {\n    this._allTasks = super.getAll();\n    return this._allTasks;'
  );
  
  content = content.replace(
    /getAllWithChildren\(\)\s*{\s*return Array\.from\(tasks\);/g,
    'getAllWithChildren() {\n    this._allTasks = super.getAll();\n    return this._allTasks;'
  );
  
  content = content.replace(
    /findSiblings\([\s\S]*?{\s*return Array\.from\(tasks\);/g,
    'findSiblings(taskId: string) {\n    this._allTasks = super.getAll();'
  );
  
  console.log('✅ Fixed methods to use _allTasks correctly');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix base.ts repository issues with parameter counts
function fixBaseRepositoryIssues() {
  const filePath = path.join(__dirname, '../core/repository/base.ts');
  console.log(`Fixing base.ts issues...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the parameter count issues by adding proper parameters
  content = content.replace(
    /createIndex\(this\._db\)/g,
    'createIndex(this._db, "tasks", "id")'
  );
  
  content = content.replace(
    /createIndex\(this\._db,\s*"tasks"\)/g,
    'createIndex(this._db, "tasks", "id")'
  );
  
  // Fix undefined return type issues
  content = content.replace(
    /(\s+return\s+)result;/g,
    '$1result || [];'
  );
  
  // Add type annotations for parameters
  content = content.replace(
    /markAsDone\(task\)/g,
    'markAsDone(task: Task)'
  );
  
  console.log('✅ Fixed parameter count and return type issues');
  fs.writeFileSync(filePath, content, 'utf8');
}

// Fix creation.ts issues
function fixCreationRepositoryIssues() {
  const filePath = path.join(__dirname, '../core/repository/creation.ts');
  console.log(`Fixing creation.ts issues...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix missing NewTask import
  const importStart = content.match(/import\s*{[^}]+}\s*from\s*'@\/db\/schema';/);
  if (importStart) {
    const importStatement = importStart[0];
    if (!importStatement.includes('NewTask')) {
      content = content.replace(
        importStatement,
        importStatement.replace('}', ', NewTask }')
      );
      console.log('✅ Added NewTask import');
    }
  }
  
  // Fix max_child_num property access
  content = content.replace(
    /metadata\["max_child_num"\]/g,
    'metadata["max_child_num"] || 0'
  );
  
  // Fix createIndex parameter count issues
  content = content.replace(
    /createIndex\(this\._db\)/g,
    'createIndex(this._db, "tasks", "id")'
  );
  
  console.log('✅ Fixed max_child_num and createIndex issues');
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main execution
console.log('===== Fixing Repository Issues =====');
fixFactoryImports();
fixHierarchyIssues();
fixBaseRepositoryIssues();
fixCreationRepositoryIssues();
console.log('===== Completed Repository Issues Fixes =====');