/**
 * Script to fix repository parameter count errors:
 * - "Expected 0 arguments, but got 2" errors in index.ts and index-clean.ts
 */

import * as ts from 'typescript';
import * as path from 'path';
import { findFilesWithPattern, applyTransformation } from './utils';

const REPO_DIR = path.resolve(__dirname, '../../core/repository');

// Find specific files with parameter count issues
async function findFilesWithParameterIssues() {
  const files = [
    path.join(REPO_DIR, 'index.ts'),
    path.join(REPO_DIR, 'index-clean.ts')
  ];
  
  // Filter to only existing files
  const existingFiles = files.filter(file => {
    try {
      require('fs').accessSync(file);
      return true;
    } catch {
      return false;
    }
  });
  
  console.log(`Found ${existingFiles.length} repository files to check for parameter count issues`);
  return existingFiles;
}

// Fix function for parameter count issues
function fixParameterCountIssues(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Look for call expressions with too many arguments
      if (ts.isCallExpression(node) && 
          node.arguments.length === 2 &&
          ts.isPropertyAccessExpression(node.expression)) {
        
        // Check if this is the specific function call that has the error
        // This is line 183/203 in index.ts/index-clean.ts: 
        // RepositoryFactory.initialize()
        if (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === 'RepositoryFactory' &&
            ts.isIdentifier(node.expression.name) &&
            node.expression.name.text === 'initialize') {
          
          // Check the first argument to see if it's dbPath or similar
          const firstArg = node.arguments[0];
          if (ts.isIdentifier(firstArg) && 
              (firstArg.text === 'dbPath' || firstArg.text.includes('db'))) {
            
            // This is likely the offending call - fix by creating a new call with no arguments
            return ts.factory.createCallExpression(
              node.expression,
              undefined,
              []
            );
          }
        }
      }
      
      return ts.visitEachChild(node, visit, context);
    };
    
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

// Main function to process files
async function main() {
  try {
    const files = await findFilesWithParameterIssues();
    let fixedCount = 0;
    
    for (const file of files) {
      const wasFixed = await applyTransformation(file, fixParameterCountIssues);
      if (wasFixed) {
        console.log(`Fixed parameter count issues in ${file}`);
        fixedCount++;
      } else {
        console.log(`No issues found or could not fix ${file}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with parameter count issues`);
  } catch (error) {
    console.error('Error fixing parameter count issues:', error);
  }
}

main();