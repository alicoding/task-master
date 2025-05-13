#!/usr/bin/env tsx
/**
 * Script to fix string literal type errors in the codebase
 * 
 * This script automatically adds type assertions to string literals used as enum-like parameters:
 * - TaskStatus
 * - TaskReadiness
 * - Other custom string literal types
 */

import { SyntaxKind, PropertyAssignment, BinaryExpression, Node } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Define known type mappings (property name -> type name)
const TYPE_MAPPINGS: Record<string, string> = {
  status: 'TaskStatus',
  readiness: 'TaskReadiness',
  type: 'DependencyType'
};

// Target files with string literal type issues
const TARGET_FILES = [
  'src/cli/commands/search/search-handler.ts',
  'src/cli/commands/search/search-handler-clean.ts',
  'src/core/api/handlers/task-add.ts',
  'src/core/api/handlers/task-update.ts'
];

/**
 * Fix string property assignments in objects
 */
function fixPropertyAssignments(sourceFile: any, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Find all property assignments
  const propertyAssignments = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment);
  
  for (const propAssign of propertyAssignments) {
    const propName = propAssign.getName();
    const initializer = propAssign.getInitializer();
    
    // Check if this property is one of our target types
    if (TYPE_MAPPINGS[propName] && initializer) {
      // Only handle string literals
      if (initializer.getKind() === SyntaxKind.StringLiteral) {
        const typeName = TYPE_MAPPINGS[propName];
        const stringLiteral = initializer.asKindOrThrow(SyntaxKind.StringLiteral);
        const originalText = stringLiteral.getText();
        
        // Skip if already type asserted
        if (originalText.includes(' as ')) {
          continue;
        }
        
        // Add type assertion: 'todo' -> ('todo' as TaskStatus)
        stringLiteral.replaceWithText(`(${originalText} as ${typeName})`);
        
        logger.verbose(`  Fixed ${propName}: ${originalText} → (${originalText} as ${typeName})`, options.verbose);
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix binary expressions (assignments) with string literal types
 */
function fixBinaryExpressions(sourceFile: any, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Find all binary expressions (assignments)
  const binaryExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression);
  
  for (const binaryExpr of binaryExpressions) {
    // Only process assignment expressions
    if (binaryExpr.getOperatorToken().getKind() !== SyntaxKind.EqualsToken) {
      continue;
    }
    
    const left = binaryExpr.getLeft();
    const right = binaryExpr.getRight();
    
    // Only process property access expressions on the left
    if (left.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = left.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      const propName = propAccess.getName();
      
      // Check if this property is one of our target types
      if (TYPE_MAPPINGS[propName] && right) {
        // Only handle string literals
        if (right.getKind() === SyntaxKind.StringLiteral) {
          const typeName = TYPE_MAPPINGS[propName];
          const stringLiteral = right.asKindOrThrow(SyntaxKind.StringLiteral);
          const originalText = stringLiteral.getText();
          
          // Skip if already type asserted
          if (originalText.includes(' as ')) {
            continue;
          }
          
          // Add type assertion: 'todo' -> ('todo' as TaskStatus)
          stringLiteral.replaceWithText(`(${originalText} as ${typeName})`);
          
          logger.verbose(`  Fixed ${propName}: ${originalText} → (${originalText} as ${typeName})`, options.verbose);
          fixCount++;
        }
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix metadata JSON parsing
 */
function fixMetadataParsing(sourceFile: any, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Find all metadata parsing attempts
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const callExpr of callExpressions) {
    const expression = callExpr.getExpression();
    if (expression.getText() === 'JSON.parse') {
      // Find parent variable declaration or assignment
      let parent = callExpr.getParent();
      while (parent && 
            parent.getKind() !== SyntaxKind.VariableDeclaration && 
            parent.getKind() !== SyntaxKind.BinaryExpression) {
        parent = parent.getParent();
      }
      
      if (parent) {
        // Get variable name or property name
        let varName = '';
        if (parent.getKind() === SyntaxKind.VariableDeclaration) {
          varName = parent.asKindOrThrow(SyntaxKind.VariableDeclaration).getName();
        } else if (parent.getKind() === SyntaxKind.BinaryExpression) {
          const binaryExpr = parent.asKindOrThrow(SyntaxKind.BinaryExpression);
          const left = binaryExpr.getLeft();
          if (left.getKind() === SyntaxKind.PropertyAccessExpression) {
            varName = left.asKindOrThrow(SyntaxKind.PropertyAccessExpression).getName();
          }
        }
        
        // If it's metadata, add a type assertion
        if (varName === 'metadata') {
          const originalText = callExpr.getText();
          if (!originalText.includes(' as ')) {
            callExpr.replaceWithText(`(${originalText} as Partial<TaskMetadata>)`);
            
            logger.verbose(`  Fixed metadata parsing: ${originalText} → (${originalText} as Partial<TaskMetadata>)`, options.verbose);
            fixCount++;
          }
        }
      }
    }
  }
  
  return fixCount;
}

/**
 * Main function to fix string literal type errors
 */
async function fixStringLiteralTypes(options: ReturnType<typeof parseArgs>) {
  const { project, sourceFiles } = initProject(
    options.files.length ? options.files : TARGET_FILES
  );
  
  let fixedCount = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(rootDir, filePath);
    
    logger.info(`Processing ${relativePath}`);
    
    // Fix different patterns of string literal issues
    const propFixCount = fixPropertyAssignments(sourceFile, options);
    const binFixCount = fixBinaryExpressions(sourceFile, options);
    const metaFixCount = fixMetadataParsing(sourceFile, options);
    
    const totalFixCount = propFixCount + binFixCount + metaFixCount;
    
    // Save changes if fixes were made
    if (totalFixCount > 0) {
      logger.info(`Fixed ${totalFixCount} string literal type issues in ${relativePath}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += totalFixCount;
    }
  }
  
  logger.info(`Fixed ${fixedCount} string literal type issues in total`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixStringLiteralTypes.ts',
  'Automatically fixes string literal type errors by adding proper type assertions.',
  fixStringLiteralTypes,
  options
);