#!/usr/bin/env tsx
/**
 * Script to fix remaining .ts extensions in import statements
 * This script finds import statements with .ts extensions and replaces them with .js
 * It specifically targets the common TypeScript error: "An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled."
 */

import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const singleFile = args.find(arg => !arg.startsWith('--'));

console.log(`
🛠️  TS Import Extension Fixer
---------------------
Mode: ${dryRun ? 'Dry run (no changes will be written)' : 'Live run (changes will be applied)'}
Verbosity: ${verbose ? 'Verbose' : 'Normal'}
Target: ${singleFile ? `Single file: ${singleFile}` : 'All TypeScript files in src/'}
`);

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(rootDir, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

// Add source files to the project
let sourceFiles = [];

if (singleFile) {
  // Process a single file
  const filePath = path.resolve(process.cwd(), singleFile);
  if (fs.existsSync(filePath) && filePath.endsWith('.ts')) {
    sourceFiles.push(project.addSourceFileAtPath(filePath));
  } else {
    console.error(`Error: File not found or not a TypeScript file: ${filePath}`);
    process.exit(1);
  }
} else {
  // Find all TypeScript files in the src directory
  const tsFiles = project.addSourceFilesAtPaths([
    path.join(rootDir, 'src/**/*.ts'),
    '!**/node_modules/**',
    '!**/dist/**',
  ]);
  sourceFiles = tsFiles;
}

console.log(`Analyzing ${sourceFiles.length} TypeScript file(s)...`);

// Statistics for reporting
let totalFiles = 0;
let totalImportsFixed = 0;
const modifiedFiles = [];

// Process each source file
sourceFiles.forEach(sourceFile => {
  let fileImportsFixed = 0;
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(rootDir, filePath);
  
  // Skip node_modules and dist directories
  if (filePath.includes('node_modules') || filePath.includes('dist')) {
    return;
  }

  totalFiles++;
  
  // Fix .ts extensions in regular import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  importDeclarations.forEach(importDeclaration => {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    // Only process relative imports ending with .ts
    if (moduleSpecifier && 
        (moduleSpecifier.startsWith('./') || 
         moduleSpecifier.startsWith('../') || 
         moduleSpecifier.startsWith('/')) && 
         moduleSpecifier.endsWith('.ts')) {
      
      // Replace .ts with .js
      const newModuleSpecifier = moduleSpecifier.replace(/\.ts$/, '.js');
      
      if (verbose) {
        console.log(`In ${relativeFilePath}:`);
        console.log(`  ${moduleSpecifier} -> ${newModuleSpecifier}`);
      }
      
      // Update the import declaration
      if (!dryRun) {
        importDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
      
      fileImportsFixed++;
      totalImportsFixed++;
    }
  });
  
  // Find and fix dynamic imports
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  stringLiterals.forEach(literal => {
    // Check if this string literal is part of an import expression
    const parent = literal.getParent();
    if (parent && 
        (parent.getKind() === SyntaxKind.ImportDeclaration || 
         parent.getKind() === SyntaxKind.CallExpression && parent.getText().startsWith('import('))) {
      
      const value = literal.getLiteralValue();
      if (value && 
          (value.startsWith('./') || 
           value.startsWith('../') || 
           value.startsWith('/')) && 
           value.endsWith('.ts')) {
        
        // Replace .ts with .js in dynamic imports
        const newValue = value.replace(/\.ts$/, '.js');
        
        if (verbose) {
          console.log(`In ${relativeFilePath}:`);
          console.log(`  Dynamic import: ${value} -> ${newValue}`);
        }
        
        // Update the string literal
        if (!dryRun) {
          literal.setLiteralValue(newValue);
        }
        
        fileImportsFixed++;
        totalImportsFixed++;
      }
    }
  });
  
  // Fix export declarations with .ts extensions
  const exportDeclarations = sourceFile.getExportDeclarations();
  exportDeclarations.forEach(exportDeclaration => {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && 
        (moduleSpecifier.startsWith('./') || 
         moduleSpecifier.startsWith('../') || 
         moduleSpecifier.startsWith('/')) && 
         moduleSpecifier.endsWith('.ts')) {
      
      // Replace .ts with .js
      const newModuleSpecifier = moduleSpecifier.replace(/\.ts$/, '.js');
      
      if (verbose) {
        console.log(`In ${relativeFilePath}:`);
        console.log(`  Export: ${moduleSpecifier} -> ${newModuleSpecifier}`);
      }
      
      // Update the export declaration
      if (!dryRun) {
        exportDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
      
      fileImportsFixed++;
      totalImportsFixed++;
    }
  });

  // Save the changes if any imports were fixed
  if (fileImportsFixed > 0) {
    modifiedFiles.push({
      path: relativeFilePath,
      count: fileImportsFixed
    });
    
    if (!dryRun) {
      sourceFile.saveSync();
    }
  }
});

// Report results
console.log('\n📊 Results:');
console.log(`Scanned: ${totalFiles} files`);
console.log(`Modified: ${modifiedFiles.length} files`);
console.log(`Fixed imports: ${totalImportsFixed} total\n`);

if (modifiedFiles.length > 0) {
  console.log('📝 Modified files:');
  modifiedFiles.forEach(file => {
    console.log(`- ${file.path} (${file.count} import${file.count > 1 ? 's' : ''} fixed)`);
  });
} else {
  console.log('✅ No imports needed fixing!');
}

if (dryRun && totalImportsFixed > 0) {
  console.log('\n⚠️  This was a dry run. No files were modified.');
  console.log('Run without --dry-run to apply the changes.');
}

console.log('\n🏁 Done!');