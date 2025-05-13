#!/usr/bin/env node

/**
 * TypeScript Transformer: ChalkColor Type Assertions
 *
 * This transformer script uses ts-morph to find type assertions to ChalkColor
 * and replaces them with calls to the asChalkColor helper function.
 *
 * Pattern:
 *   BEFORE: colorize(text, 'red' as ChalkColor)
 *   AFTER:  colorize(text, asChalkColor('red'))
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { Project, SyntaxKind, TypeGuards } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility, get the current file path

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a new project
const project = new Project({
  tsConfigFilePath: path.join(__dirname, '../../tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

// Add source files from the CLI commands directory
project.addSourceFilesAtPaths([
  "cli/**/*.ts",
  "core/graph/**/*.ts", // Also check graph formatters which likely use chalk
]);

console.log(`Analyzing ${project.getSourceFiles().length} source files...`);

// Track changes
let totalReplacements = 0;
let filesChanged = 0;

// Process each source file
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;
  
  // Find all type assertions (expressions with 'as' keyword)
  const typeAssertions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
  
  // Filter to only those asserting to ChalkColor
  const chalkColorAssertions = typeAssertions.filter(node => {
    const typeNode = node.getTypeNode();
    if (!typeNode) return false;
    return typeNode.getText() === 'ChalkColor';
  });
  
  if (chalkColorAssertions.length > 0) {
    console.log(`Found ${chalkColorAssertions.length} ChalkColor assertions in ${sourceFile.getFilePath()}`);
    
    // Replace each assertion with asChalkColor function call
    for (const assertion of chalkColorAssertions) {
      const expression = assertion.getExpression();
      
      // Skip if already using asChalkColor
      if (expression.getKindName() === 'CallExpression' && 
          expression.getText().startsWith('asChalkColor(')) {
        continue;
      }
      
      // Get the expression text (the string being asserted)
      const expressionText = expression.getText();
      
      // Create the replacement: asChalkColor(expressionText)
      assertion.replaceWithText(`asChalkColor(${expressionText})`);
      
      totalReplacements++;
      fileChanged = true;
    }
    
    // Add the import if changes were made
    if (fileChanged) {
      // Check if import already exists
      const importDeclarations = sourceFile.getImportDeclarations();
      const chalkUtilsImport = importDeclarations.find(imp => 
        imp.getModuleSpecifierValue() === '@/cli/utils/chalk-utils' || 
        imp.getModuleSpecifierValue() === '../utils/chalk-utils' ||
        imp.getModuleSpecifierValue() === '../../utils/chalk-utils'
      );
      
      if (chalkUtilsImport) {
        // Import exists, check if asChalkColor is already imported
        const namedImports = chalkUtilsImport.getNamedImports();
        const hasAsChalkColor = namedImports.some(imp => imp.getName() === 'asChalkColor');
        
        if (!hasAsChalkColor) {
          // Add asChalkColor to existing import
          chalkUtilsImport.addNamedImport('asChalkColor');
        }
      } else {
        // Add new import declaration
        // Calculate relative path for proper module resolution
        const filePath = sourceFile.getFilePath();
        const fileDir = path.dirname(filePath);
        const cliDir = path.resolve(__dirname, '../../cli');
        
        // Determine the appropriate module specifier
        let moduleSpecifier = '@/cli/utils/chalk-utils'; // Default to path alias
        
        // If the file is in the CLI directory tree, use relative path
        if (filePath.startsWith(cliDir)) {
          const relativePath = path.relative(fileDir, path.join(cliDir, 'utils'));
          const normalizedPath = relativePath.replace(/\\/g, '/');
          moduleSpecifier = normalizedPath.startsWith('.') ? normalizedPath : `./${normalizedPath}`;
          moduleSpecifier = `${moduleSpecifier}/chalk-utils`;
        }
        
        sourceFile.addImportDeclaration({
          moduleSpecifier,
          namedImports: ['asChalkColor']
        });
      }
      
      // Save the file
      sourceFile.save();
      filesChanged++;
    }
  }
}

console.log('\nTransformation complete!');
console.log(`Made ${totalReplacements} replacements across ${filesChanged} files.`);