/**
 * Script to fix ChalkColor issues:
 * 1. Replace asChalkColor('color') with just 'color'
 * 2. Remove duplicate ChalkColor imports
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { Project } from 'ts-morph';
import { findFilesWithPattern, applyTransformation } from './utils';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_COMMANDS_DIR = path.resolve(__dirname, '../../cli/commands');

// Find files that import asChalkColor and/or have duplicate ChalkColor imports
async function findFilesWithChalkColorIssues() {
  const files = await findFilesWithPattern(
    CLI_COMMANDS_DIR,
    '**/*.ts',
    /(import.*ChalkColor.*from.*chalk-utils|asChalkColor\()/
  );
  console.log(`Found ${files.length} files with potential ChalkColor issues`);
  return files;
}

// Fix function for asChalkColor calls
function fixAsChalkColorCalls(sourceFile: ts.SourceFile): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      // Check for asChalkColor function calls
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'asChalkColor') {
        
        // We expect the first argument to be a string literal
        if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
          // Just return the string literal directly
          return node.arguments[0];
        }
      }
      
      return ts.visitEachChild(node, visit, context);
    };
    
    return (sf) => ts.visitNode(sf, visit) as ts.SourceFile;
  };
}

// Fix function for duplicate ChalkColor imports
function fixDuplicateChalkImports() {
  const project = new Project();
  
  return async (filePath: string) => {
    const sourceFile = project.addSourceFileAtPath(filePath);
    let modified = false;
    
    // Get all imports
    const imports = sourceFile.getImportDeclarations();
    const chalkImports = imports.filter(imp => 
      imp.getModuleSpecifierValue().includes('chalk-utils') ||
      imp.getModuleSpecifierValue().includes('utils')
    );
    
    // Keep track of imported names to check for duplicates
    const importedNames = new Set<string>();
    const duplicateImports = new Set<ts.ImportDeclaration>();
    
    // Find duplicate imports
    for (const imp of chalkImports) {
      const namedImports = imp.getNamedImports();
      
      for (const named of namedImports) {
        const name = named.getName();
        
        if (importedNames.has(name)) {
          // This is a duplicate import
          duplicateImports.add(imp.compilerNode as ts.ImportDeclaration);
          modified = true;
        } else {
          importedNames.add(name);
        }
      }
    }
    
    // Remove duplicate imports
    for (const imp of duplicateImports) {
      const impDecl = sourceFile.getImportDeclaration(
        (decl) => decl.compilerNode === imp
      );
      
      if (impDecl) {
        impDecl.remove();
      }
    }
    
    if (modified) {
      await sourceFile.save();
      return true;
    }
    
    return false;
  };
}

// Main function to process files
async function main() {
  try {
    const files = await findFilesWithChalkColorIssues();
    let fixedFiles = 0;
    
    // Fix asChalkColor calls
    for (const file of files) {
      const wasFixed = await applyTransformation(file, fixAsChalkColorCalls);
      if (wasFixed) {
        console.log(`Fixed asChalkColor calls in ${file}`);
        fixedFiles++;
      }
    }
    
    // Fix duplicate imports
    const fixImportsFn = fixDuplicateChalkImports();
    for (const file of files) {
      const wasFixed = await fixImportsFn(file);
      if (wasFixed) {
        console.log(`Fixed duplicate ChalkColor imports in ${file}`);
        fixedFiles++;
      }
    }
    
    console.log(`Fixed ${fixedFiles} files with ChalkColor issues`);
  } catch (error) {
    console.error('Error fixing ChalkColor issues:', error);
  }
}

main();