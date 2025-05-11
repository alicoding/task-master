#!/usr/bin/env tsx
/**
 * Script to convert .js extensions to .ts in import statements
 * Uses ts-morph for TypeScript-aware code manipulation
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
🛠️  JS Import Fixer
---------------------
Mode: ${dryRun ? 'Dry run (no changes will be written)' : 'Live run (changes will be applied)'}
Verbosity: ${verbose ? 'Verbose' : 'Normal'}
Target: ${singleFile ? `Single file: ${singleFile}` : 'All TypeScript files'}
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
  // Find all TypeScript files in the project
  const tsFiles = project.addSourceFilesAtPaths([
    path.join(rootDir, '**/*.ts'),
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
  
  // Get all import declarations in the file
  const importDeclarations = sourceFile.getImportDeclarations();
  
  importDeclarations.forEach(importDeclaration => {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    // Only process relative imports ending with .js
    if (moduleSpecifier && 
        (moduleSpecifier.startsWith('./') || 
         moduleSpecifier.startsWith('../') || 
         moduleSpecifier.startsWith('/')) && 
         moduleSpecifier.endsWith('.js')) {
      
      // Replace .js with .ts
      const newModuleSpecifier = moduleSpecifier.replace(/\.js$/, '.ts');
      
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