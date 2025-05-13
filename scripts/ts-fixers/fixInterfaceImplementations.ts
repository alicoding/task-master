#!/usr/bin/env tsx
/**
 * Script to fix interface implementation errors in the codebase
 * 
 * This script adds missing properties and methods to classes that 
 * incorrectly implement interfaces, particularly repository classes.
 */

import { SyntaxKind, ClassDeclaration, InterfaceDeclaration, Project } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Key repository files with implementation issues
const TARGET_FILES = [
  'src/core/repository/index.ts',
  'src/core/repository/index-clean.ts'
];

// Common return type for repository methods
const TASK_OPERATION_RESULT_TYPE = 'Promise<TaskOperationResult<any[]>>';

/**
 * Fix the TaskRepository implementation in a file
 */
function fixTaskRepositoryImplementation(classDecl: ClassDeclaration): number {
  let fixCount = 0;
  
  // Check if the class is the TaskRepository
  if (classDecl.getName() !== 'TaskRepository') {
    return 0;
  }
  
  logger.info(`Found TaskRepository class`);
  
  // First, add missing _db and _sqlite properties if they don't exist
  if (!classDecl.getProperty('_db')) {
    classDecl.addProperty({
      name: '_db',
      type: 'any',
      scope: 'protected',
      initializer: 'this.baseRepo["_db"]'
    });
    fixCount++;
    logger.info(`Added missing _db property`);
  }
  
  if (!classDecl.getProperty('_sqlite')) {
    classDecl.addProperty({
      name: '_sqlite',
      type: 'any',
      scope: 'protected',
      initializer: 'this.baseRepo["_sqlite"]'
    });
    fixCount++;
    logger.info(`Added missing _sqlite property`);
  }
  
  // Add legacy method implementations if they don't exist
  const legacyMethods = [
    { name: 'getTaskLegacy', type: 'any', implementation: '{ return this.baseRepo.getTask(id); }', params: [{ name: 'id', type: 'string' }] },
    { name: 'getAllTasksLegacy', type: 'any', implementation: '{ return this.baseRepo.getAllTasks(); }', params: [] }
  ];
  
  for (const method of legacyMethods) {
    if (!classDecl.getMethod(method.name)) {
      classDecl.addMethod({
        name: method.name,
        parameters: method.params,
        returnType: method.type,
        statements: method.implementation
      });
      fixCount++;
      logger.info(`Added missing ${method.name} method`);
    }
  }
  
  // Fix TaskHierarchyRepository methods
  const hierarchyMethod = classDecl.getMethod('getChildTasks');
  if (hierarchyMethod) {
    hierarchyMethod.setReturnType(TASK_OPERATION_RESULT_TYPE);
    
    // Replace the method implementation
    hierarchyMethod.setBodyText(`
      const result = await this.hierarchyRepo.getChildTasks(taskId);
      return {
        success: true,
        data: result
      };
    `);
    fixCount++;
    logger.info(`Fixed getChildTasks return type`);
  }
  
  // Fix TaskSearchRepository methods
  const searchMethod = classDecl.getMethod('naturalLanguageSearch');
  if (searchMethod) {
    searchMethod.setReturnType(TASK_OPERATION_RESULT_TYPE);
    
    // Replace the method implementation
    searchMethod.setBodyText(`
      const result = await this.searchRepo.naturalLanguageSearch(query, useFuzzy);
      return {
        success: true,
        data: result
      };
    `);
    fixCount++;
    logger.info(`Fixed naturalLanguageSearch return type`);
  }
  
  return fixCount;
}

/**
 * Process a source file to fix interface implementation issues
 */
function processFile(sourceFile: any, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  logger.info(`Processing ${sourceFile.getFilePath()}`);
  
  // Find all class declarations in the file
  const classDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.ClassDeclaration);
  
  // Process each class declaration
  for (const classDecl of classDeclarations) {
    fixCount += fixTaskRepositoryImplementation(classDecl);
  }
  
  return fixCount;
}

/**
 * Main function to fix interface implementation errors
 */
async function fixInterfaceImplementations(options: ReturnType<typeof parseArgs>) {
  const { project, sourceFiles } = initProject(
    options.files.length ? options.files : TARGET_FILES
  );
  
  let fixedCount = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    const fileFixCount = processFile(sourceFile, options);
    
    // Save changes if fixes were made
    if (fileFixCount > 0) {
      logger.info(`Fixed ${fileFixCount} interface implementation issues in ${sourceFile.getFilePath()}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += fileFixCount;
    }
  }
  
  logger.info(`Fixed ${fixedCount} interface implementation issues in total`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixInterfaceImplementations.ts',
  'Automatically fixes interface implementation errors by adding missing methods and properties.',
  fixInterfaceImplementations,
  options
);