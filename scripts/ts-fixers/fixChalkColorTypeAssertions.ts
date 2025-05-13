#!/usr/bin/env tsx
/**
 * Script to fix ChalkColor type assertion errors in the codebase
 * 
 * This script automatically adds type assertions to string literals used as ChalkColor parameters:
 * - Converts: colorize(text, 'red' as ChalkColor) to colorize(text, 'red' as ChalkColor)
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { SyntaxKind, Node, StringLiteral, SourceFile } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';

// Color names that are commonly used
const COMMON_COLORS = [
  'black', 'red', 'green', 'yellow', 'blue', 
  'magenta', 'cyan', 'white', 'gray', 'grey',
  'blackBright', 'redBright', 'greenBright', 'yellowBright', 
  'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'
];

// Names of functions/methods that use color parameters
const COLOR_FUNCTION_PATTERNS = [
  'colorize',
  'chalk',
  'color'
];

/**
 * Process a call expression to fix color arguments
 */
function processCallExpression(node: Node, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Make sure it's a call expression
  if (node.getKind() !== SyntaxKind.CallExpression) {
    return 0;
  }
  
  const callExpr = node.asKindOrThrow(SyntaxKind.CallExpression);
  const expression = callExpr.getExpression().getText();
  
  // Only process calls to color functions
  if (!COLOR_FUNCTION_PATTERNS.some(pattern => expression.includes(pattern))) {
    return 0;
  }
  
  const args = callExpr.getArguments();
  
  // Process all arguments (color is usually the second argument, but could be in other positions too)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Only process string literals
    if (arg.getKind() !== SyntaxKind.StringLiteral) {
      continue;
    }
    
    const stringLiteral = arg.asKindOrThrow(SyntaxKind.StringLiteral);
    const colorValue = stringLiteral.getLiteralValue();
    const originalText = stringLiteral.getText();
    
    // Only fix if it's a common color and not already type-asserted
    if (COMMON_COLORS.includes(colorValue) && 
        !originalText.includes(' as ChalkColor') && 
        !originalText.includes('<ChalkColor>')) {
      
      logger.verbose(`  Found string color argument: ${originalText}`, options.verbose);
      
      // Add type assertion: 'red' -> ('red' as ChalkColor)
      stringLiteral.replaceWithText(`(${originalText} as ChalkColor)`);
      fixCount++;
    }
  }
  
  return fixCount;
}

/**
 * Process property access for chalk.color() calls
 */
function processColorPropertyAccess(node: Node, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  if (node.getKind() !== SyntaxKind.PropertyAccessExpression) {
    return 0;
  }
  
  const propAccess = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
  const name = propAccess.getName();
  const expression = propAccess.getExpression().getText();
  
  // Check for chalk.red(), etc.
  if (expression === 'chalk' && COMMON_COLORS.includes(name)) {
    const parent = propAccess.getParent();
    
    if (parent && parent.getKind() === SyntaxKind.CallExpression) {
      const callExpr = parent.asKindOrThrow(SyntaxKind.CallExpression);
      const args = callExpr.getArguments();
      
      for (const arg of args) {
        if (arg.getKind() === SyntaxKind.StringLiteral) {
          const stringLiteral = arg.asKindOrThrow(SyntaxKind.StringLiteral);
          const originalText = stringLiteral.getText();
          
          // Fix only if not already type-asserted
          if (!originalText.includes(' as ') && !originalText.includes('<')) {
            logger.verbose(`  Found chalk.${name} argument: ${originalText}`, options.verbose);
            
            // Add type assertion
            stringLiteral.replaceWithText(`(${originalText} as string)`);
            fixCount++;
          }
        }
      }
    }
  }
  
  return fixCount;
}

/**
 * Process any string literals used in accessibility property assignments
 */
function processPrivateMethodCalls(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  // Find all property access expressions first
  const propAccessExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  let fixCount = 0;
  
  // Find calls like this.colorize() with private methods
  for (const propAccess of propAccessExpressions) {
    const name = propAccess.getName();
    const expression = propAccess.getExpression().getText();
    
    // Check for this.colorize() or other private colorize methods
    if (name === 'colorize' && expression.includes('this')) {
      const parent = propAccess.getParent();
      
      if (parent && parent.getKind() === SyntaxKind.CallExpression) {
        // Find the class declaration containing this method call
        let currentNode: Node | undefined = parent;
        let classDeclaration = null;
        
        while (currentNode && !classDeclaration) {
          if (currentNode.getKind() === SyntaxKind.ClassDeclaration) {
            classDeclaration = currentNode;
            break;
          }
          currentNode = currentNode.getParent();
        }
        
        if (classDeclaration) {
          // Find the colorize method in the class
          const methods = classDeclaration.getDescendantsOfKind(SyntaxKind.MethodDeclaration);
          const colorizeMethod = methods.find(m => m.getName() === 'colorize');
          
          if (colorizeMethod) {
            // If method is found and is private, we need to make it accessible
            const modifiers = colorizeMethod.getModifiers();
            if (modifiers.some(m => m.getText() === 'private')) {
              logger.verbose(`  Found private colorize method in class`, options.verbose);
              
              // Change private to protected
              for (const modifier of modifiers) {
                if (modifier.getText() === 'private') {
                  modifier.replaceWithText('protected');
                  fixCount++;
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return fixCount;
}

/**
 * Main function to fix ChalkColor type issues
 */
async function fixChalkColorTypeAssertions(options: ReturnType<typeof parseArgs>) {
  const { project, sourceFiles } = initProject(
    options.files.length ? options.files : ['src/**/*.ts']
  );
  
  let fixedCount = 0;
  let scannedFiles = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    scannedFiles++;
    const filePath = sourceFile.getFilePath();
    let fileFixCount = 0;
    
    // Skip files that don't use color functions (optimization)
    const fileContent = sourceFile.getFullText();
    const hasColorFunctions = COLOR_FUNCTION_PATTERNS.some(pattern => 
      fileContent.includes(pattern)
    );
    
    if (!hasColorFunctions && !fileContent.includes('colorize')) {
      logger.verbose(`Skipping ${filePath} (no color functions)`, options.verbose);
      continue;
    }
    
    logger.verbose(`Processing ${filePath}`, options.verbose);
    
    // Find all call expressions in the file
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
      fileFixCount += processCallExpression(callExpr, options);
    }
    
    // Find chalk.color() style calls
    const propAccessExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    for (const propAccess of propAccessExpressions) {
      fileFixCount += processColorPropertyAccess(propAccess, options);
    }
    
    // Fix private method accessibility issues
    fileFixCount += processPrivateMethodCalls(sourceFile, options);
    
    // Save changes if we made any fixes
    if (fileFixCount > 0) {
      logger.info(`Fixed ${fileFixCount} ChalkColor type issues in ${filePath}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += fileFixCount;
    }
  }
  
  logger.info(`Scanned ${scannedFiles} files, fixed ${fixedCount} ChalkColor type issues`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixChalkColorTypeAssertions.ts',
  'Automatically adds type assertions to string literals used as ChalkColor parameters',
  fixChalkColorTypeAssertions,
  options
);