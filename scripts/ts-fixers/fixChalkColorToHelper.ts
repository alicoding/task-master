#!/usr/bin/env tsx
/**
 * Script to replace ChalkColor type assertions with asChalkColor helper function
 * 
 * This script automatically converts all instances of string literal to ChalkColor
 * type assertions to use the asChalkColor helper function:
 * - Converts: ('red' as ChalkColor) to asChalkColor('red')
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { SyntaxKind, Node, SourceFile, AsExpression } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';

/**
 * Process type assertions in the file
 */
function processTypeAssertions(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  // Get all type assertions
  const asExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
  let fixCount = 0;
  
  // Map for tracking imports that need to be added
  let needsImport = false;
  
  // Process each type assertion
  for (const asExpr of asExpressions) {
    // Get the type being asserted to
    const typeNode = asExpr.getTypeNode();
    
    // Only process ChalkColor type assertions
    if (typeNode && typeNode.getText() === 'ChalkColor') {
      // Get the expression being asserted
      const expression = asExpr.getExpression();
      
      // Only process string literals
      if (expression.getKind() === SyntaxKind.StringLiteral) {
        const stringLiteral = expression.asKindOrThrow(SyntaxKind.StringLiteral);
        const colorName = stringLiteral.getLiteralValue();
        const originalText = asExpr.getText();
        
        logger.verbose(`Found ChalkColor type assertion: ${originalText}`, options.verbose);
        
        // Replace with asChalkColor helper call
        asExpr.replaceWithText(`asChalkColor('${colorName}')`);
        needsImport = true;
        fixCount++;
      }
    }
  }
  
  // Add import if needed
  if (needsImport && fixCount > 0) {
    ensureHelperImport(sourceFile);
  }
  
  return fixCount;
}

/**
 * Ensure the asChalkColor helper is imported
 */
function ensureHelperImport(sourceFile: SourceFile): void {
  const imports = sourceFile.getImportDeclarations();
  
  // Check if asChalkColor is already imported
  let hasAsChalkColorImport = false;
  let chalkColorImport = null;
  
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    
    if (moduleSpecifier === '@/cli/utils/chalk-utils') {
      const namedImports = imp.getNamedImports();
      
      // Check if asChalkColor is already in the imports
      for (const named of namedImports) {
        if (named.getName() === 'asChalkColor') {
          hasAsChalkColorImport = true;
          break;
        }
      }
      
      // If ChalkColor is imported but not asChalkColor, add it
      if (!hasAsChalkColorImport) {
        chalkColorImport = imp;
        break;
      }
    }
  }
  
  // If we have a ChalkColor import, add asChalkColor to it
  if (chalkColorImport && !hasAsChalkColorImport) {
    const namedImports = chalkColorImport.getNamedImports();
    const names = namedImports.map(n => n.getName());
    
    if (!names.includes('asChalkColor')) {
      // Add asChalkColor to existing import
      chalkColorImport.addNamedImport('asChalkColor');
    }
  } 
  // If no existing import, add a new import
  else if (!hasAsChalkColorImport) {
    // Add a new import at the top
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@/cli/utils/chalk-utils',
      namedImports: ['asChalkColor']
    });
  }
}

/**
 * Main function to fix ChalkColor type assertions
 */
async function fixChalkColorToHelper(options: ReturnType<typeof parseArgs>) {
  const { project, sourceFiles } = initProject(
    options.files.length ? options.files : ['src/**/*.ts', 'cli/**/*.ts']
  );
  
  let fixedCount = 0;
  let filesFixed = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const fileContent = sourceFile.getFullText();
    
    // Skip files that don't have any ChalkColor type assertions
    if (!fileContent.includes(' as ChalkColor')) {
      logger.verbose(`Skipping ${filePath} (no ChalkColor type assertions)`, options.verbose);
      continue;
    }
    
    logger.verbose(`Processing ${filePath}`, options.verbose);
    
    // Process type assertions in the file
    const fileFixCount = processTypeAssertions(sourceFile, options);
    
    // Save changes if we made any fixes
    if (fileFixCount > 0) {
      logger.info(`Fixed ${fileFixCount} ChalkColor type assertions in ${filePath}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += fileFixCount;
      filesFixed++;
    }
  }
  
  logger.info(`Fixed ${fixedCount} ChalkColor type assertions in ${filesFixed} files`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixChalkColorToHelper.ts',
  'Converts string literal to ChalkColor type assertions to use the asChalkColor helper function',
  fixChalkColorToHelper,
  options
);