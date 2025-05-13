/**
 * Script to fix parent_id vs parentId issues:
 * - Standardize on `parentId` property name as defined in schema
 */

import * as ts from 'typescript';
import * as path from 'path';
import { findFilesWithPattern, applyTransformation } from './utils';

const REPO_DIR = path.resolve(__dirname, '../../core/repository');

// Find files with parent_id references
async function findFilesWithParentIdIssues() {
  const files = await findFilesWithPattern(
    REPO_DIR,
    '**/*.ts',
    /parent_id/
  );
  console.log(`Found ${files.length} files with potential parent_id issues`);
  return files;
}

// Fix function for parent_id property accesses
function fixParentIdAccesses(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Fix property accesses like task.parent_id
      if (ts.isPropertyAccessExpression(node) && 
          ts.isIdentifier(node.name) && 
          node.name.text === 'parent_id') {
        
        // Create a new property access with 'parentId' instead
        return ts.factory.createPropertyAccessExpression(
          ts.visitNode(node.expression, visit),
          ts.factory.createIdentifier('parentId')
        );
      }
      
      // Fix identifier references in object literals and destructuring
      if (ts.isShorthandPropertyAssignment(node) &&
          node.name.text === 'parent_id') {
        
        // Replace shorthand property with full property assignment
        return ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier('parentId'),
          ts.factory.createIdentifier('parent_id')
        );
      }
      
      // Fix property accesses in object literals
      if (ts.isPropertyAssignment(node) && 
          ts.isIdentifier(node.name) && 
          node.name.text === 'parent_id') {
        
        // Create a new property assignment with 'parentId' instead
        return ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier('parentId'),
          ts.visitNode(node.initializer, visit)
        );
      }
      
      // Fix accesses to schema fields like tasks.parent_id
      if (ts.isPropertyAccessExpression(node) && 
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.name) &&
          node.expression.name.text === 'tasks' &&
          ts.isIdentifier(node.name) &&
          node.name.text === 'parent_id') {
        
        // Create a new property access with 'parentId' instead
        return ts.factory.createPropertyAccessExpression(
          node.expression,
          ts.factory.createIdentifier('parentId')
        );
      }
      
      return ts.visitEachChild(node, visit, context);
    };
    
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

// Main function to process files
async function main() {
  try {
    const files = await findFilesWithParentIdIssues();
    let fixedCount = 0;
    
    for (const file of files) {
      const wasFixed = await applyTransformation(file, fixParentIdAccesses);
      if (wasFixed) {
        console.log(`Fixed parent_id issues in ${file}`);
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} files with parent_id vs parentId issues`);
  } catch (error) {
    console.error('Error fixing parent_id issues:', error);
  }
}

main();