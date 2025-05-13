/**
 * TypeScript Transformer: Safe Metadata Access
 * 
 * This transformer script uses ts-morph to find unsafe access to metadata properties
 * and replaces them with calls to the safeAccess helper function.
 * 
 * Pattern:
 *   BEFORE: task.metadata?.dod || {}
 *   AFTER:  safeAccess(task, 'metadata.dod', {})
 */

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

// Helper function to find full property access path
function findPropertyPath(node: Node): { objectExpression: string, fullPath: string } | null {
  if (node.getKind() !== SyntaxKind.PropertyAccessExpression) return null;

  const propertyAccessNode = node as any; // Need to cast since TypeGuards is not available
  const expression = propertyAccessNode.getExpression();
  const name = propertyAccessNode.getName();

  // Base case: direct object property
  if (expression.getKind() !== SyntaxKind.PropertyAccessExpression) {
    return {
      objectExpression: expression.getText(),
      fullPath: name
    };
  }

  // Recursive case: nested property
  const parent = findPropertyPath(expression);
  if (!parent) return null;

  return {
    objectExpression: parent.objectExpression,
    fullPath: `${parent.fullPath}.${name}`
  };
}

// Helper function to get default value from optional chaining or logical OR
function getDefaultValue(node: Node): string | null {
  // Check parent for optional chaining
  const parent = node.getParent();
  if (!parent) return null;

  // Check for logical OR expression (x || defaultValue)
  if (parent.getKind() === SyntaxKind.BinaryExpression) {
    const binaryExpr = parent as any;
    if (binaryExpr.getOperatorToken().getText() === '||') {
      const right = binaryExpr.getRight();
      return right.getText();
    }
  }

  // If no default value is found, return empty object
  return '{}';
}

// Process each source file
for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;
  
  // Find all metadata property accesses
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .filter(node => {
      // Only get properties that include 'metadata'
      const text = node.getText();
      return text.includes('.metadata.') || 
             text.includes('.metadata?.') || 
             text.endsWith('.metadata');
    });
  
  // Get unique metadata access patterns to avoid duplicate replacements
  const uniqueAccessPatterns = new Map<string, { node: Node, objectExpr: string, path: string, defaultValue: string }>();
  
  // Process each property access
  for (const access of propertyAccesses) {
    // Skip if we're accessing a property of something that itself contains 'metadata' but isn't the metadata property
    if (access.getName() !== 'metadata' && !access.getName().startsWith('metadata.')) {
      // Check if this is a deep metadata property access
      const pathInfo = findPropertyPath(access);
      if (!pathInfo || !pathInfo.fullPath.startsWith('metadata.')) continue;
      
      // Get parent object and full property path
      const objectExpression = pathInfo.objectExpression;
      const fullPath = pathInfo.fullPath;
      
      // Get default value (from || operator or use empty object)
      const defaultValue = getDefaultValue(access) || '{}';
      
      // Create unique key for this access pattern
      const accessPattern = `${objectExpression}.${fullPath}`;
      
      // Store unique patterns
      if (!uniqueAccessPatterns.has(accessPattern)) {
        uniqueAccessPatterns.set(accessPattern, {
          node: access,
          objectExpr: objectExpression,
          path: fullPath,
          defaultValue
        });
      }
    } else if (access.getName() === 'metadata') {
      // Direct metadata property access
      const parent = access.getParent();
      if (!parent) continue;
      
      // Skip if this is part of a safeAccess call already
      if (parent.getKind() === SyntaxKind.CallExpression &&
          (parent as any).getExpression().getText() === 'safeAccess') {
        continue;
      }
      
      // Get the object expression
      const objectExpression = access.getExpression().getText();
      
      // Get default value (from || operator or use empty object)
      const defaultValue = getDefaultValue(access) || '{}';
      
      // Create unique key for this access pattern
      const accessPattern = `${objectExpression}.metadata`;
      
      // Store unique patterns
      if (!uniqueAccessPatterns.has(accessPattern)) {
        uniqueAccessPatterns.set(accessPattern, {
          node: access,
          objectExpr: objectExpression,
          path: 'metadata',
          defaultValue
        });
      }
    }
  }
  
  // Now process unique patterns for replacement
  if (uniqueAccessPatterns.size > 0) {
    console.log(`Found ${uniqueAccessPatterns.size} metadata access patterns in ${sourceFile.getFilePath()}`);
    
    for (const [pattern, info] of uniqueAccessPatterns.entries()) {
      // Get the parent expression that contains the entire access + default value
      let nodeToReplace = info.node;
      const parent = nodeToReplace.getParent();
      
      // If parent is a binary expression with || operator, replace the whole expression
      if (parent && parent.getKind() === SyntaxKind.BinaryExpression) {
        const binaryExpr = parent as any;
        if (binaryExpr.getOperatorToken().getText() === '||') {
          nodeToReplace = parent;
        }
      }
      
      // Create replacement with safeAccess
      const replacement = `safeAccess(${info.objectExpr}, '${info.path}', ${info.defaultValue})`;
      
      // Replace the expression
      nodeToReplace.replaceWithText(replacement);
      totalReplacements++;
      fileChanged = true;
    }
    
    // Add import for safeAccess if changes were made
    if (fileChanged) {
      // Check if import already exists
      const importDeclarations = sourceFile.getImportDeclarations();
      const typeSafetyImport = importDeclarations.find(imp => 
        imp.getModuleSpecifierValue() === '@/core/utils/type-safety' || 
        imp.getModuleSpecifierValue().endsWith('/core/utils/type-safety')
      );
      
      if (typeSafetyImport) {
        // Import exists, check if safeAccess is already imported
        const namedImports = typeSafetyImport.getNamedImports();
        const hasSafeAccess = namedImports.some(imp => imp.getName() === 'safeAccess');
        
        if (!hasSafeAccess) {
          // Add safeAccess to existing import
          typeSafetyImport.addNamedImport('safeAccess');
        }
      } else {
        // Add new import declaration
        sourceFile.addImportDeclaration({
          moduleSpecifier: '@/core/utils/type-safety',
          namedImports: ['safeAccess']
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