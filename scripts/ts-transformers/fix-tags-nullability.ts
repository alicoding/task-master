/**
 * TypeScript Transformer: Safe Tags Array Access
 * 
 * This transformer script uses ts-morph to find unsafe access to task.tags
 * and replaces them with calls to the formatTags helper function.
 * 
 * Pattern:
 *   BEFORE: task.tags?.join(', ') || 'none'
 *   AFTER:  formatTags(task.tags, null, 'none')
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { Project, SyntaxKind, Node } from 'ts-morph';
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

// Add source files
project.addSourceFilesAtPaths([
  "cli/**/*.ts",
  "core/**/*.ts",
]);

console.log(`Analyzing ${project.getSourceFiles().length} source files...`);

// Track changes
let totalReplacements = 0;
let filesChanged = 0;

// Process each source file
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;
  
  // Find all property accesses for 'tags'
  const tagsAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .filter(node => node.getName() === 'tags');
  
  // For each tags access, find method calls or null coalescing patterns
  for (const tagsAccess of tagsAccesses) {
    // Skip if this is already inside a formatTags call
    const ancestors = tagsAccess.getAncestors();
    const isInFormatTags = ancestors.some(ancestor => 
      TypeGuards.isCallExpression(ancestor) && 
      ancestor.getExpression().getText() === 'formatTags'
    );
    
    if (isInFormatTags) continue;
    
    let nodeToReplace = tagsAccess;
    let useFormatTags = false;
    let emptyText = "'none'";
    let formatter = null;
    
    // Check for optional chaining
    const parent = tagsAccess.getParent();
    if (parent && TypeGuards.isPropertyAccessExpression(parent) && parent.getText().includes('tags?.')) {
      nodeToReplace = parent;
      useFormatTags = true;
      
      // Check for common join() pattern: task.tags?.join(', ') || 'none'
      if (TypeGuards.isCallExpression(parent.getParent())) {
        const callExpr = parent.getParent() as Node;
        
        if (callExpr.getText().includes('.join(')) {
          nodeToReplace = callExpr;
          
          // Check for null coalescing with default text
          const binaryParent = callExpr.getParent();
          if (binaryParent && TypeGuards.isBinaryExpression(binaryParent) && 
              binaryParent.getOperatorToken().getText() === '||') {
            nodeToReplace = binaryParent;
            emptyText = binaryParent.getRight().getText();
          }
        }
      }
    }
    // Check for map() with color formatting
    else if (parent && TypeGuards.isPropertyAccessExpression(parent) && 
             parent.getName() === 'map' && 
             TypeGuards.isCallExpression(parent.getParent())) {
      const mapCall = parent.getParent() as Node;
      
      // Look for: task.tags.map(tag => colorize(tag, 'color' as ChalkColor)).join(', ') 
      if (mapCall.getText().includes('colorize') && mapCall.getText().includes('.join(')) {
        useFormatTags = true;
        
        // Extract the color from colorize call
        const arrowFunction = mapCall.getFirstDescendantByKind(SyntaxKind.ArrowFunction);
        if (arrowFunction) {
          const colorizeCall = arrowFunction.getFirstDescendantByKind(SyntaxKind.CallExpression);
          if (colorizeCall && colorizeCall.getText().includes('colorize')) {
            const args = colorizeCall.getArguments();
            if (args.length >= 2) {
              formatter = `(tag) => colorize(tag, ${args[1].getText()})`;
            }
          }
        }
        
        // If there's a join() call after map(), include it in replacement
        let currentNode = mapCall;
        while (currentNode.getParent() && 
               TypeGuards.isPropertyAccessExpression(currentNode.getParent().getParent()) &&
               currentNode.getParent().getParent().getName() === 'join') {
          currentNode = currentNode.getParent().getParent().getParent() as Node;
          
          // If there's a null coalescing, get the default value
          if (TypeGuards.isBinaryExpression(currentNode) && 
              currentNode.getOperatorToken().getText() === '||') {
            emptyText = currentNode.getRight().getText();
            nodeToReplace = currentNode;
            break;
          }
        }
        
        if (TypeGuards.isCallExpression(currentNode) && currentNode.getText().includes('.join(')) {
          nodeToReplace = currentNode;
        }
      }
    }
    // Check direct task.tags access with null check
    else if (TypeGuards.isBinaryExpression(parent) && 
             (parent.getOperatorToken().getText() === '||' || 
              parent.getOperatorToken().getText() === '??')) {
      nodeToReplace = parent;
      useFormatTags = true;
      emptyText = parent.getRight().getText();
    }
    // Look for task.tags && task.tags?.join pattern
    else if (TypeGuards.isBinaryExpression(parent) && parent.getOperatorToken().getText() === '&&') {
      const rightSide = parent.getRight();
      if (rightSide.getText().includes('.join')) {
        nodeToReplace = parent;
        useFormatTags = true;
        
        // Check if there's a default value
        const grandParent = parent.getParent();
        if (grandParent && TypeGuards.isBinaryExpression(grandParent) && 
            grandParent.getOperatorToken().getText() === '||') {
          nodeToReplace = grandParent;
          emptyText = grandParent.getRight().getText();
        }
      }
    }
    
    // If we've identified a pattern to replace, do the replacement
    if (useFormatTags) {
      // Get the original object that has tags property
      const originalObject = tagsAccess.getExpression().getText();
      
      // Create the formatTags replacement
      let replacement;
      if (formatter) {
        replacement = `formatTags(${originalObject}.tags, ${formatter}, ${emptyText})`;
      } else {
        replacement = `formatTags(${originalObject}.tags, null, ${emptyText})`;
      }
      
      nodeToReplace.replaceWithText(replacement);
      totalReplacements++;
      fileChanged = true;
    }
  }
  
  // Add import if changes were made
  if (fileChanged) {
    // Check if import already exists
    const importDeclarations = sourceFile.getImportDeclarations();
    const typeSafetyImport = importDeclarations.find(imp => 
      imp.getModuleSpecifierValue() === '@/core/utils/type-safety' || 
      imp.getModuleSpecifierValue().endsWith('/core/utils/type-safety')
    );
    
    if (typeSafetyImport) {
      // Import exists, check if formatTags is already imported
      const namedImports = typeSafetyImport.getNamedImports();
      const hasFormatTags = namedImports.some(imp => imp.getName() === 'formatTags');
      
      if (!hasFormatTags) {
        // Add formatTags to existing import
        typeSafetyImport.addNamedImport('formatTags');
      }
    } else {
      // Add new import declaration
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@/core/utils/type-safety',
        namedImports: ['formatTags']
      });
    }
    
    // Save the file
    sourceFile.save();
    filesChanged++;
  }
}

console.log('\nTransformation complete!');
console.log(`Made ${totalReplacements} replacements across ${filesChanged} files.`);