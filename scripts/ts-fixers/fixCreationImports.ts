/**
 * Script to fix import issues in creation.ts:
 * - "has no exported member named 'tasks'. Did you mean 'Task'?"
 * - "has no exported member 'dependencies'"
 * - "has no exported member 'NewTask'"
 */

import * as ts from 'typescript';
import * as path from 'path';
import { findFilesWithPattern, applyTransformation } from './utils';

const REPO_DIR = path.resolve(__dirname, '../../core/repository');

// Find creation.ts file
async function findCreationFile() {
  const targetFile = path.join(REPO_DIR, 'creation.ts');
  
  // Verify the file exists
  try {
    require('fs').accessSync(targetFile);
    return [targetFile];
  } catch {
    console.error(`File not found: ${targetFile}`);
    return [];
  }
}

// Fix function for import issues in creation.ts
function fixCreationImportIssues(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Find and fix import declarations
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        
        // Check if this is the import from "@/core/types"
        if (ts.isStringLiteral(moduleSpecifier) && 
            moduleSpecifier.text === '@/core/types') {
          
          // Update the named imports to fix the issues
          if (node.importClause && node.importClause.namedBindings && 
              ts.isNamedImports(node.importClause.namedBindings)) {
            
            const newNamedBindings: ts.ImportSpecifier[] = [];
            
            // Process each named import
            for (const element of node.importClause.namedBindings.elements) {
              const name = element.name.text;
              
              // Fix the incorrect imports
              if (name === 'tasks') {
                // Replace 'tasks' with 'Task'
                newNamedBindings.push(
                  ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('Task')
                  )
                );
              } else if (name === 'dependencies' || name === 'NewTask') {
                // Remove these imports - they should be from the schema
                continue;
              } else {
                // Keep other imports as is
                newNamedBindings.push(element);
              }
            }
            
            // Create a new import declaration with the fixed named imports
            return ts.factory.createImportDeclaration(
              node.modifiers,
              ts.factory.createImportClause(
                false,
                node.importClause.name,
                ts.factory.createNamedImports(newNamedBindings)
              ),
              moduleSpecifier
            );
          }
        }
        
        // Add the import from schema if needed
        if (ts.isStringLiteral(moduleSpecifier) && 
            moduleSpecifier.text.includes('schema')) {
          
          // Check if we need to add more imports from schema
          if (node.importClause && node.importClause.namedBindings && 
              ts.isNamedImports(node.importClause.namedBindings)) {
            
            const existingNames = node.importClause.namedBindings.elements.map(
              e => e.name.text
            );
            
            // If it doesn't include NewTask or dependencies, add them
            if (!existingNames.includes('NewTask') || !existingNames.includes('dependencies')) {
              const newElements = [...node.importClause.namedBindings.elements];
              
              if (!existingNames.includes('NewTask')) {
                newElements.push(
                  ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('NewTask')
                  )
                );
              }
              
              if (!existingNames.includes('dependencies')) {
                newElements.push(
                  ts.factory.createImportSpecifier(
                    false,
                    undefined,
                    ts.factory.createIdentifier('dependencies')
                  )
                );
              }
              
              // Create a new import declaration with the added imports
              return ts.factory.createImportDeclaration(
                node.modifiers,
                ts.factory.createImportClause(
                  false,
                  node.importClause.name,
                  ts.factory.createNamedImports(newElements)
                ),
                moduleSpecifier
              );
            }
          }
        }
      }
      
      // Fix property accesses to max_child_num
      if (ts.isPropertyAccessExpression(node) && 
          ts.isIdentifier(node.name) && 
          node.name.text === 'max_child_num') {
        
        // Replace with a string literal property access
        return ts.factory.createElementAccessExpression(
          ts.visitNode(node.expression, visit),
          ts.factory.createStringLiteral('max_child_num')
        );
      }
      
      return ts.visitEachChild(node, visit, context);
    };
    
    // First pass to check if we need to add a new import for schema
    const rootVisit: ts.Visitor = (node) => {
      if (ts.isSourceFile(node)) {
        // Check if we have the necessary imports already
        let hasSchemaImport = false;
        let needsNewSchemaImport = true;
        
        for (const statement of node.statements) {
          if (ts.isImportDeclaration(statement) && 
              ts.isStringLiteral(statement.moduleSpecifier) && 
              statement.moduleSpecifier.text.includes('schema')) {
            
            hasSchemaImport = true;
            
            // Check if it already imports 'dependencies' and 'NewTask'
            if (statement.importClause && statement.importClause.namedBindings && 
                ts.isNamedImports(statement.importClause.namedBindings)) {
              
              const elements = statement.importClause.namedBindings.elements;
              const hasNewTask = elements.some(e => e.name.text === 'NewTask');
              const hasDependencies = elements.some(e => e.name.text === 'dependencies');
              
              if (hasNewTask && hasDependencies) {
                needsNewSchemaImport = false;
              }
            }
          }
        }
        
        // If we don't have the necessary imports, add them
        if (hasSchemaImport && needsNewSchemaImport) {
          const newStatements = [...node.statements];
          
          // Add a new import for the missing schema items
          const newImport = ts.factory.createImportDeclaration(
            undefined,
            ts.factory.createImportClause(
              false,
              undefined,
              ts.factory.createNamedImports([
                ts.factory.createImportSpecifier(
                  false,
                  undefined,
                  ts.factory.createIdentifier('NewTask')
                ),
                ts.factory.createImportSpecifier(
                  false,
                  undefined,
                  ts.factory.createIdentifier('dependencies')
                )
              ])
            ),
            ts.factory.createStringLiteral('../../db/schema')
          );
          
          // Insert after the last import
          let insertIndex = 0;
          for (let i = 0; i < node.statements.length; i++) {
            if (ts.isImportDeclaration(node.statements[i])) {
              insertIndex = i + 1;
            }
          }
          
          newStatements.splice(insertIndex, 0, newImport);
          
          // Create a new source file with the updated statements
          return ts.factory.updateSourceFile(
            node,
            newStatements,
            node.isDeclarationFile,
            node.referencedFiles,
            node.typeReferenceDirectives,
            node.hasNoDefaultLib,
            node.libReferenceDirectives
          );
        }
      }
      
      return ts.visitEachChild(node, rootVisit, context);
    };
    
    // First apply the source file level changes, then child node changes
    return (sf) => {
      const updatedSourceFile = ts.visitNode(sf, rootVisit) as ts.SourceFile;
      return ts.visitNode(updatedSourceFile, visit) as ts.SourceFile;
    };
  };
}

// Main function to process files
async function main() {
  try {
    const files = await findCreationFile();
    let fixedCount = 0;
    
    for (const file of files) {
      const wasFixed = await applyTransformation(file, fixCreationImportIssues);
      if (wasFixed) {
        console.log(`Fixed import issues in ${file}`);
        fixedCount++;
      } else {
        console.log(`No issues found or could not fix ${file}`);
      }
    }
    
    console.log(`Fixed ${fixedCount} files with import issues`);
  } catch (error) {
    console.error('Error fixing import issues:', error);
  }
}

main();