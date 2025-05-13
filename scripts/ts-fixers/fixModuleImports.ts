#!/usr/bin/env tsx
/**
 * Script to fix module import paths in the codebase
 * 
 * This script fixes incorrect import paths by replacing imports like:
 * - @/cli/core/repo → @/core/repo
 * - '../../../../../core/repo' → '@/core/repo'
 */

import { SyntaxKind, ImportDeclaration, SourceFile } from 'ts-morph';
import { parseArgs, initProject, runFixer, logger, saveChanges } from './utils';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Path mappings (incorrect → correct)
const PATH_MAPPINGS: Record<string, string> = {
  '@/cli/core/': '@/core/',
  '../../../../../core/': '@/core/'
};

// Target directories with module import issues
const TARGET_DIRS = [
  'src/cli/commands/triage/lib/interactive-enhanced/**/*.ts'
];

/**
 * Fix import paths in a source file
 */
function fixImportPaths(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  let fixCount = 0;
  
  // Find all import declarations in the file
  const importDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
  
  // Process each import declaration
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // Apply path mappings
    for (const [incorrectPath, correctPath] of Object.entries(PATH_MAPPINGS)) {
      if (moduleSpecifier.startsWith(incorrectPath)) {
        // Create the corrected import path
        const newPath = moduleSpecifier.replace(incorrectPath, correctPath);
        
        // Save the original for logging
        const originalPath = moduleSpecifier;
        
        // Update the import path
        importDecl.setModuleSpecifier(newPath);
        
        // Log the change
        logger.verbose(`  Fixed import: ${originalPath} → ${newPath}`, options.verbose);
        fixCount++;
      }
    }
  }
  
  return fixCount;
}

/**
 * Fix missing third-party module declarations
 */
function addMissingModuleDeclarations(sourceFile: SourceFile, options: ReturnType<typeof parseArgs>): number {
  const filePath = sourceFile.getFilePath();
  let fixCount = 0;
  
  // Only add Fuse.js declaration in the specific file that needs it
  if (filePath.includes('fuzzy-matcher.ts') && 
      sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === 'fuse')) {
    
    // Check if the file already has a declare module for fuse
    const existingDeclaration = sourceFile.getStatements().some(
      stmt => stmt.getKind() === SyntaxKind.ModuleDeclaration && 
              stmt.getText().includes('declare module \'fuse\'')
    );
    
    if (!existingDeclaration) {
      // Add a module declaration for Fuse.js at the end of the file
      sourceFile.addStatements(`
// Type declaration for fuse.js
declare module 'fuse' {
  export default class Fuse<T> {
    constructor(list: T[], options?: FuseOptions);
    search(pattern: string): Array<{ item: T, score: number }>;
  }
  
  interface FuseOptions {
    keys?: string[];
    includeScore?: boolean;
    threshold?: number;
    location?: number;
    distance?: number;
    minMatchCharLength?: number;
    shouldSort?: boolean;
    tokenize?: boolean;
    matchAllTokens?: boolean;
    findAllMatches?: boolean;
    id?: string;
  }
}
      `);
      
      fixCount++;
      logger.verbose(`  Added missing 'fuse' module declaration`, options.verbose);
    }
  }
  
  return fixCount;
}

/**
 * Main function to fix module import errors
 */
async function fixModuleImports(options: ReturnType<typeof parseArgs>) {
  const { project, sourceFiles } = initProject(
    options.files.length ? options.files : TARGET_DIRS
  );
  
  let fixedCount = 0;
  
  // Process each source file
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    const relativePath = path.relative(rootDir, filePath);
    
    logger.verbose(`Processing ${relativePath}`, options.verbose);
    
    // Fix import paths
    const importFixCount = fixImportPaths(sourceFile, options);
    
    // Fix missing module declarations
    const declFixCount = addMissingModuleDeclarations(sourceFile, options);
    
    const totalFixCount = importFixCount + declFixCount;
    
    // Save changes if fixes were made
    if (totalFixCount > 0) {
      logger.info(`Fixed ${totalFixCount} module import issues in ${relativePath}`);
      saveChanges(sourceFile, options.dryRun);
      fixedCount += totalFixCount;
    }
  }
  
  logger.info(`Fixed ${fixedCount} module import issues in total`);
  return fixedCount;
}

// Run the script
const options = parseArgs(process.argv.slice(2));
runFixer(
  'fixModuleImports.ts',
  'Automatically fixes module import path errors by correcting import paths.',
  fixModuleImports,
  options
);