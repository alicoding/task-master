#!/usr/bin/env tsx
/**
 * Script to fix ChalkColor type errors in the codebase
 * 
 * This script automatically fixes errors like:
 * "Argument of type 'string' is not assignable to parameter of type 'ChalkColor'"
 * 
 * It adds type assertions to string literals used as colors in chalk and colorize functions.
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { SyntaxKind, StringLiteral } from 'ts-morph';
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
  'color',
  '.red',
  '.green',
  '.blue',
  '.yellow',
  '.cyan',
  '.magenta',
  '.white',
  '.gray',
  '.bold',
  '.dim'
];

/**
 * Fix chalk color type issues in a project
 */
async function fixChalkColorTypes(options: ReturnType<typeof parseArgs>) {
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
    
    if (!hasColorFunctions) {
      logger.verbose(`Skipping ${filePath} (no color functions)`, options.verbose);
      continue;
    }
    
    logger.verbose(`Processing ${filePath}`, options.verbose);
    
    // Find all call expressions in the file
    const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    
    // Process each call expression
    for (const callExpr of callExpressions) {
      const expression = callExpr.getExpression().getText();
      
      // Check if this is a color function call
      const isColorFunction = COLOR_FUNCTION_PATTERNS.some(pattern => 
        expression.includes(pattern)
      );
      
      if (!isColorFunction) {
        continue;
      }
      
      // Get the arguments of the call
      const args = callExpr.getArguments();
      
      // Color is often the second argument to colorize()
      if (args.length >= 2) {
        // Check if the color argument is a string literal
        const colorArg = args[1];
        
        if (colorArg.getKind() === SyntaxKind.StringLiteral) {
          const stringLiteral = colorArg.asKind(SyntaxKind.StringLiteral);
          
          if (stringLiteral) {
            const originalText = stringLiteral.getText();
            const colorValue = stringLiteral.getLiteralValue();
            
            // Fix only if it's not already a type assertion
            if (!originalText.includes(' as ') && !originalText.includes('<ChalkColor>')) {
              logger.verbose(`  Found string color argument: ${originalText}`, options.verbose);
              
              // Add type assertion: 'red' -> ('red' as ChalkColor)
              stringLiteral.replaceWithText(`(${originalText} as ChalkColor)`);
              
              fileFixCount++;
              fixedCount++;
            }
          }
        }
      }
    }
    
    // Process any explicitly colored text: chalk.red('text')
    const propertyAccessExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
    
    for (const propAccess of propertyAccessExpressions) {
      const name = propAccess.getName();
      const expression = propAccess.getExpression().getText();
      
      // Check if this is accessing a color property on chalk
      if (expression === 'chalk' && COMMON_COLORS.includes(name)) {
        // Find string literal argument
        const parent = propAccess.getParent();
        
        if (parent && parent.getKind() === SyntaxKind.CallExpression) {
          const callExpr = parent.asKind(SyntaxKind.CallExpression);
          const args = callExpr?.getArguments();
          
          if (args && args.length >= 1) {
            const colorArgs = args.filter(arg => 
              arg.getKind() === SyntaxKind.StringLiteral
            );
            
            for (const arg of colorArgs) {
              const stringLiteral = arg.asKind(SyntaxKind.StringLiteral);
              
              if (stringLiteral) {
                const originalText = stringLiteral.getText();
                
                // Fix only if it's not already a type assertion
                if (!originalText.includes(' as ') && !originalText.includes('<ChalkColor>')) {
                  logger.verbose(`  Found chalk.${name} argument: ${originalText}`, options.verbose);
                  
                  // Add type assertion if needed
                  stringLiteral.replaceWithText(`(${originalText} as string)`);
                  
                  fileFixCount++;
                  fixedCount++;
                }
              }
            }
          }
        }
      }
    }
    
    // Save changes if we made any fixes
    if (fileFixCount > 0) {
      logger.info(`Fixed ${fileFixCount} color type issues in ${filePath}`);
      saveChanges(sourceFile, options.dryRun);
    }
  }
  
  logger.info(`Scanned ${scannedFiles} files, fixed ${fixedCount} ChalkColor type issues`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixChalkColorTypes.ts',
  'Automatically fixes ChalkColor type errors by adding proper type assertions to string literals used as colors.',
  fixChalkColorTypes,
  options
);