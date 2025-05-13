#!/usr/bin/env tsx
/**
 * Script to fix TimeWindow type errors in the codebase
 * 
 * This script automatically fixes errors like:
 * "Type 'string' is not assignable to type 'TimeWindowType'"
 * 
 * It adds type assertions and fixes type mismatches in TimeWindow-related code.
 */

import { SyntaxKind, Node, ObjectLiteralExpression } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Known TimeWindow type values
const TIME_WINDOW_TYPES = ['task', 'file', 'idle', 'break', 'meeting'];
const TIME_WINDOW_STATUSES = ['active', 'completed', 'cancelled'];

// Target files with TimeWindow type issues
const TARGET_FILES = [
  'src/core/terminal/terminal-session-time-window-integration.ts',
  'src/core/terminal/terminal-session-time-window-integration-fixed.ts',
  'src/core/terminal/terminal-session-time-windows.ts',
  'src/core/terminal/time-window-manager.ts',
  'src/core/terminal/time-window-manager-fixed.ts'
];

/**
 * Fix TimeWindow type issues in an object literal expression
 */
function fixObjectLiteralTypes(obj: ObjectLiteralExpression, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Look for properties named 'type' or 'status'
  const properties = obj.getProperties();
  
  for (const prop of properties) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) {
      continue;
    }
    
    const propAssignment = prop.asKind(SyntaxKind.PropertyAssignment);
    if (!propAssignment) continue;
    
    const propName = propAssignment.getName();
    const initializer = propAssignment.getInitializer();
    
    // Process 'type' properties with string values
    if (propName === 'type' && initializer?.getKind() === SyntaxKind.StringLiteral) {
      const stringLiteral = initializer.asKind(SyntaxKind.StringLiteral);
      if (!stringLiteral) continue;
      
      const typeValue = stringLiteral.getLiteralValue();
      const originalText = stringLiteral.getText();
      
      // Only fix if the value matches a known TimeWindowType
      if (TIME_WINDOW_TYPES.includes(typeValue) && !originalText.includes(' as ')) {
        logger.verbose(`  Found type property with string value: ${originalText}`, options.verbose);
        
        // Add type assertion: 'task' -> ('task' as TimeWindowType)
        stringLiteral.replaceWithText(`(${originalText} as TimeWindowType)`);
        fixCount++;
      }
    }
    
    // Process 'status' properties with string values
    if (propName === 'status' && initializer?.getKind() === SyntaxKind.StringLiteral) {
      const stringLiteral = initializer.asKind(SyntaxKind.StringLiteral);
      if (!stringLiteral) continue;
      
      const statusValue = stringLiteral.getLiteralValue();
      const originalText = stringLiteral.getText();
      
      // Only fix if the value matches a known TimeWindowStatus
      if (TIME_WINDOW_STATUSES.includes(statusValue) && !originalText.includes(' as ')) {
        logger.verbose(`  Found status property with string value: ${originalText}`, options.verbose);
        
        // Add type assertion: 'active' -> ('active' as TimeWindowStatus)
        stringLiteral.replaceWithText(`(${originalText} as TimeWindowStatus)`);
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix TimeWindowCriteria type issues in a file
 */
function fixTimeWindowCriteriaTypes(sourceFile: Node, options: ReturnType<typeof parseArgs>): number {
  // Find all object literal expressions (most likely places for TimeWindowCriteria objects)
  const objLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
  
  let fixCount = 0;
  
  for (const obj of objLiterals) {
    // Criteria objects usually have sessionId and some of: type, status, containsTime, etc.
    const hasSessionId = obj.getProperty('sessionId');
    const hasType = obj.getProperty('type');
    const hasStatus = obj.getProperty('status');
    const hasContainsTime = obj.getProperty('containsTime');
    
    // If this looks like a TimeWindowCriteria object
    if (hasSessionId && (hasType || hasStatus || hasContainsTime)) {
      const objFixCount = fixObjectLiteralTypes(obj, options);
      fixCount += objFixCount;
      
      if (objFixCount > 0) {
        logger.verbose(`  Fixed ${objFixCount} type issues in TimeWindowCriteria object`, options.verbose);
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix generic database type issues in a file
 */
function fixDatabaseGenericTypes(sourceFile: Node, options: ReturnType<typeof parseArgs>): number {
  // Find variable declarations for database instances without generic types
  const varDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  let fixCount = 0;
  
  for (const varDecl of varDeclarations) {
    // Skip declarations with existing type parameters
    const type = varDecl.getType();
    const typeText = type.getText();
    
    // Look for BetterSQLite3Database without type parameters
    if (typeText.includes('BetterSQLite3Database<') && 
        !typeText.includes('BetterSQLite3Database<Record<string, unknown>>')) {
      
      // This one already has a type parameter
      continue;
    }
    
    const name = varDecl.getName();
    const initializer = varDecl.getInitializer();
    
    // Look for database-related variables
    if (name.includes('db') || name.includes('database') || name.includes('connection')) {
      if (initializer && initializer.getText().includes('drizzle(')) {
        logger.verbose(`  Found database declaration without generic: ${name}`, options.verbose);
        
        // Add type annotation if not present
        if (!varDecl.getTypeNode()) {
          varDecl.setType('BetterSQLite3Database<Record<string, unknown>>');
          fixCount++;
        }
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix TimeWindow type issues in a project
 */
async function fixTimeWindowTypes(options: ReturnType<typeof parseArgs>) {
  // Get target files from arguments or use predefined list
  const targetPaths = options.files.length
    ? options.files
    : TARGET_FILES.map(p => path.resolve(rootDir, p));
  
  const { project, sourceFiles } = initProject(targetPaths);
  
  let fixedCount = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(rootDir, filePath);
    
    logger.info(`Processing ${relativePath}`);
    
    // Fix TimeWindowCriteria type issues
    const criteriaFixCount = fixTimeWindowCriteriaTypes(sourceFile, options);
    logger.verbose(`  Fixed ${criteriaFixCount} TimeWindowCriteria type issues`, options.verbose);
    
    // Fix database generic type issues
    const dbFixCount = fixDatabaseGenericTypes(sourceFile, options);
    logger.verbose(`  Fixed ${dbFixCount} database generic type issues`, options.verbose);
    
    const fileFixCount = criteriaFixCount + dbFixCount;
    
    // Save changes if we made any fixes
    if (fileFixCount > 0) {
      logger.info(`Fixed ${fileFixCount} type issues in ${relativePath}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += fileFixCount;
    }
  }
  
  logger.info(`Fixed ${fixedCount} TimeWindow and database type issues in ${sourceFiles.length} files`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixTimeWindowTypes.ts',
  'Automatically fixes TimeWindow type errors by adding proper type assertions and fixing generic types.',
  fixTimeWindowTypes,
  options
);