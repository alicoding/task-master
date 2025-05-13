/**
 * Combined TypeScript Transformers
 * 
 * This script combines the functionality of our transformers to fix:
 * 1. ChalkColor type assertions
 * 2. Metadata property access
 * 3. Null tags handling
 * 
 * Using the updated ts-morph API without TypeGuards
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { Project, SyntaxKind, Node } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For ESM compatibility
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
  "src/**/*.ts",
]);

console.log(`Analyzing ${project.getSourceFiles().length} source files...`);

// Track changes
let chalkColorFixes = 0;
let metadataAccessFixes = 0;
let tagsNullabilityFixes = 0;
let filesChanged = 0;

// Helper: Check if a node is a property access expression
function isPropertyAccessExpression(node: Node): boolean {
  return node.getKind() === SyntaxKind.PropertyAccessExpression;
}

// Helper: Check if a node is a call expression
function isCallExpression(node: Node): boolean {
  return node.getKind() === SyntaxKind.CallExpression;
}

// Helper: Check if a node is a binary expression
function isBinaryExpression(node: Node): boolean {
  return node.getKind() === SyntaxKind.BinaryExpression;
}

// Helper: Get property name from property access expression
function getPropertyName(node: Node): string {
  if (isPropertyAccessExpression(node)) {
    return (node as any).getName();
  }
  return '';
}

// Helper: Check if a node is a specific binary operator
function isBinaryOperator(node: Node, operator: string): boolean {
  if (isBinaryExpression(node)) {
    const operatorToken = (node as any).getOperatorToken();
    return operatorToken.getText() === operator;
  }
  return false;
}

// Helper: Get binary expression parts
function getBinaryExpressionParts(node: Node): { left: Node, right: Node } | null {
  if (isBinaryExpression(node)) {
    return {
      left: (node as any).getLeft(),
      right: (node as any).getRight()
    };
  }
  return null;
}

// Helper: Check if node is an as expression
function isAsExpression(node: Node): boolean {
  return node.getKind() === SyntaxKind.AsExpression;
}

// Helper: Check if as expression is casting to ChalkColor
function isChalkColorAssertion(node: Node): boolean {
  if (isAsExpression(node)) {
    const typeNode = (node as any).getTypeNode();
    return typeNode && typeNode.getText() === 'ChalkColor';
  }
  return false;
}

// Process each source file
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;
  const filePath = sourceFile.getFilePath();
  
  // 1. Fix ChalkColor type assertions
  const typeAssertions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression)
    .filter(node => isChalkColorAssertion(node));
  
  if (typeAssertions.length > 0) {
    console.log(`Found ${typeAssertions.length} ChalkColor assertions in ${filePath}`);
    
    // Replace each assertion with asChalkColor function call
    for (const assertion of typeAssertions) {
      const expression = (assertion as any).getExpression();
      
      // Skip if already using asChalkColor
      if (isCallExpression(expression) && 
          expression.getText().startsWith('asChalkColor(')) {
        continue;
      }
      
      // Get the expression text and create the replacement
      const expressionText = expression.getText();
      assertion.replaceWithText(`asChalkColor(${expressionText})`);
      
      chalkColorFixes++;
      fileChanged = true;
    }
    
    // Add import if changes were made
    if (fileChanged) {
      // Add import for asChalkColor
      addImport(sourceFile, '@/cli/utils/chalk-utils', ['asChalkColor']);
    }
  }
  
  // 2. Fix metadata property access
  const metadataAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .filter(node => {
      const text = node.getText();
      return text.includes('.metadata.') || 
             text.includes('.metadata?.') || 
             text.endsWith('.metadata');
    });
  
  if (metadataAccesses.length > 0) {
    let metadataChanged = false;
    
    for (const access of metadataAccesses) {
      const name = getPropertyName(access);
      
      // Handle direct metadata property or nested properties
      if (name === 'metadata' || name.startsWith('metadata.')) {
        // Check if this is already in a safeAccess call
        const parent = access.getParent();
        if (!parent) continue;
        
        if (isCallExpression(parent) && 
            (parent as any).getExpression().getText() === 'safeAccess') {
          continue;
        }
        
        // Get the object and full property path
        let objectExpr = '';
        let propertyPath = '';
        
        if (name === 'metadata') {
          // Direct metadata access
          objectExpr = (access as any).getExpression().getText();
          propertyPath = 'metadata';
        } else {
          // Nested properties - need to reconstruct the path
          // This is a simplification and might not handle all cases
          const parts = access.getText().split('.');
          const metadataIndex = parts.findIndex(p => p === 'metadata' || p.startsWith('metadata?'));
          
          if (metadataIndex >= 0) {
            objectExpr = parts.slice(0, metadataIndex).join('.');
            propertyPath = parts.slice(metadataIndex).join('.')
                               .replace('?.', '.')  // Remove optional chaining
                               .replace('?', '');   // Remove optional chaining
          } else {
            continue;
          }
        }
        
        // Get default value (from || operator or use empty object)
        let defaultValue = '{}';
        let nodeToReplace = access;
        
        if (parent && isBinaryOperator(parent, '||')) {
          const parts = getBinaryExpressionParts(parent);
          if (parts) {
            defaultValue = parts.right.getText();
            nodeToReplace = parent;
          }
        }
        
        // Create replacement with safeAccess
        const replacement = `safeAccess(${objectExpr}, '${propertyPath}', ${defaultValue})`;
        
        // Replace the expression
        nodeToReplace.replaceWithText(replacement);
        metadataAccessFixes++;
        metadataChanged = true;
      }
    }
    
    if (metadataChanged) {
      // Add import for safeAccess
      addImport(sourceFile, '@/core/utils/type-safety', ['safeAccess']);
      fileChanged = true;
    }
  }
  
  // 3. Fix tags nullability issues
  const tagsAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .filter(node => getPropertyName(node) === 'tags');
  
  if (tagsAccesses.length > 0) {
    let tagsChanged = false;
    
    for (const tagsAccess of tagsAccesses) {
      // Skip if already in a formatTags call
      const ancestors = tagsAccess.getAncestors();
      const isInFormatTags = ancestors.some(ancestor => 
        isCallExpression(ancestor) && 
        (ancestor as any).getExpression().getText() === 'formatTags'
      );
      
      if (isInFormatTags) continue;
      
      let nodeToReplace = tagsAccess;
      let useFormatTags = false;
      let emptyText = "'none'";
      let formatter = null;
      
      // Check for optional chaining
      const parent = tagsAccess.getParent();
      if (!parent) continue;
      
      if (isPropertyAccessExpression(parent) && parent.getText().includes('tags?.')) {
        nodeToReplace = parent;
        useFormatTags = true;
        
        // Check for join() pattern
        const parentParent = parent.getParent();
        if (parentParent && isCallExpression(parentParent) && 
            parentParent.getText().includes('.join(')) {
          nodeToReplace = parentParent;
          
          // Check for || with default text
          const binaryParent = parentParent.getParent();
          if (binaryParent && isBinaryOperator(binaryParent, '||')) {
            const parts = getBinaryExpressionParts(binaryParent);
            if (parts) {
              nodeToReplace = binaryParent;
              emptyText = parts.right.getText();
            }
          }
        }
      }
      // Check for map() with color formatting
      else if (isPropertyAccessExpression(parent) && 
               getPropertyName(parent) === 'map') {
        const parentParent = parent.getParent();
        if (parentParent && isCallExpression(parentParent) && 
            parentParent.getText().includes('colorize')) {
          useFormatTags = true;
          
          // Try to extract the colorize call details
          const arrowFn = parentParent.getFirstDescendantByKind(SyntaxKind.ArrowFunction);
          if (arrowFn) {
            const colorizeCall = arrowFn.getFirstDescendantByKind(SyntaxKind.CallExpression);
            if (colorizeCall && colorizeCall.getText().includes('colorize')) {
              const args = (colorizeCall as any).getArguments();
              if (args.length >= 2) {
                formatter = `(tag) => colorize(tag, ${args[1].getText()})`;
              }
            }
          }
          
          nodeToReplace = parentParent;
          
          // Look for join() after map()
          let joinNode = parentParent;
          const joinParent = joinNode.getParent();
          if (joinParent && isPropertyAccessExpression(joinParent) && 
              getPropertyName(joinParent) === 'join') {
            const joinCall = joinParent.getParent();
            if (joinCall) {
              nodeToReplace = joinCall;
              
              // Check for || with default
              const orParent = joinCall.getParent();
              if (orParent && isBinaryOperator(orParent, '||')) {
                const parts = getBinaryExpressionParts(orParent);
                if (parts) {
                  nodeToReplace = orParent;
                  emptyText = parts.right.getText();
                }
              }
            }
          }
        }
      }
      // Check for task.tags directly with || default
      else if (isBinaryOperator(parent, '||') || isBinaryOperator(parent, '??')) {
        const parts = getBinaryExpressionParts(parent);
        if (parts) {
          nodeToReplace = parent;
          useFormatTags = true;
          emptyText = parts.right.getText();
        }
      }
      // Check for task.tags && task.tags?.join pattern
      else if (isBinaryOperator(parent, '&&')) {
        const parts = getBinaryExpressionParts(parent);
        if (parts && parts.right.getText().includes('.join')) {
          nodeToReplace = parent;
          useFormatTags = true;
          
          // Check for default with ||
          const grandParent = parent.getParent();
          if (grandParent && isBinaryOperator(grandParent, '||')) {
            const grandParts = getBinaryExpressionParts(grandParent);
            if (grandParts) {
              nodeToReplace = grandParent;
              emptyText = grandParts.right.getText();
            }
          }
        }
      }
      
      // If we've identified a pattern to fix, do the replacement
      if (useFormatTags) {
        // Get the object that has the tags property
        const originalObject = (tagsAccess as any).getExpression().getText();
        
        // Create the formatTags replacement
        let replacement;
        if (formatter) {
          replacement = `formatTags(${originalObject}.tags, ${formatter}, ${emptyText})`;
        } else {
          replacement = `formatTags(${originalObject}.tags, null, ${emptyText})`;
        }
        
        nodeToReplace.replaceWithText(replacement);
        tagsNullabilityFixes++;
        tagsChanged = true;
      }
    }
    
    if (tagsChanged) {
      // Add import for formatTags
      addImport(sourceFile, '@/core/utils/type-safety', ['formatTags']);
      fileChanged = true;
    }
  }
  
  if (fileChanged) {
    // Save the file with all changes
    sourceFile.save();
    filesChanged++;
  }
}

// Helper function to add import if needed
function addImport(sourceFile: any, moduleSpecifier: string, namedImports: string[]): void {
  // Check if import already exists
  const importDeclarations = sourceFile.getImportDeclarations();
  const existingImport = importDeclarations.find((imp: any) => 
    imp.getModuleSpecifierValue() === moduleSpecifier || 
    imp.getModuleSpecifierValue().endsWith(moduleSpecifier.replace('@/', ''))
  );
  
  if (existingImport) {
    // Import exists, check if the named imports are already included
    const existingNamedImports = existingImport.getNamedImports();
    
    for (const namedImport of namedImports) {
      const hasImport = existingNamedImports.some((imp: any) => imp.getName() === namedImport);
      
      if (!hasImport) {
        // Add missing named import
        existingImport.addNamedImport(namedImport);
      }
    }
  } else {
    // Calculate proper module specifier (handle path aliases)
    let finalModuleSpecifier = moduleSpecifier;
    
    // If using path alias (@/) but the file is in the same directory structure,
    // consider using a relative import for better compatibility
    if (moduleSpecifier.startsWith('@/')) {
      const filePath = sourceFile.getFilePath();
      const basePath = path.resolve(__dirname, '../../');
      const moduleRelativePath = moduleSpecifier.replace('@/', '');
      const modulePath = path.join(basePath, moduleRelativePath);
      const fileDir = path.dirname(filePath);
      
      // If file is in same directory tree, use relative path
      if (filePath.startsWith(basePath)) {
        const relativePath = path.relative(fileDir, modulePath);
        if (relativePath && !relativePath.startsWith('..')) {
          finalModuleSpecifier = `./${relativePath.replace(/\\/g, '/')}`;
        } else {
          finalModuleSpecifier = relativePath.replace(/\\/g, '/');
        }
      }
    }
    
    // Add new import declaration
    sourceFile.addImportDeclaration({
      moduleSpecifier: finalModuleSpecifier,
      namedImports: namedImports
    });
  }
}

console.log('\nTransformation complete!');
console.log(`ChalkColor fixes: ${chalkColorFixes}`);
console.log(`Metadata access fixes: ${metadataAccessFixes}`);
console.log(`Tags nullability fixes: ${tagsNullabilityFixes}`);
console.log(`Total files changed: ${filesChanged}`);