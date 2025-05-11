#!/usr/bin/env tsx
/**
 * TS to JS Import Extension Converter for ESM
 * 
 * This script converts .ts extensions in imports back to .js extensions for ESM compatibility
 * Since we're using "type": "module" in package.json with ESM, imports need to use .js extensions
 * even though the source files are .ts
 * 
 * It handles:
 * - Static imports: import { X } from './path.ts' -> import { X } from './path.js'
 * - Dynamic imports: await import('./path.ts') -> await import('./path.ts')
 * - Re-exports: export * from './path.ts' -> export * from './path.js'
 * - Named exports: export { X } from './path.ts' -> export { X } from './path.js'
 */

import { Project, Node, SyntaxKind, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const verifyOnly = args.includes('--verify');

// Initialize counter for reporting
interface ImportStats {
  staticImports: number;
  dynamicImports: number;
  exports: number;
  total: number;
}

interface Results {
  scannedFiles: number;
  modifiedFiles: number;
  modifiedImports: ImportStats;
  filesWithRemainingTsImports: string[];
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

console.log(`
${colors.cyan}${colors.bold}ESM Import Extension Fixer${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no changes will be made)' : verifyOnly ? 'Verification only' : 'Live run (changes will be applied)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
`);

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true
});

// Add all TypeScript files in the project excluding node_modules and dist
const sourceFiles = project.addSourceFilesAtPaths([
  './**/*.ts',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/fix-ts-to-js-imports.ts' // Skip this file itself
]);

console.log(`${colors.blue}Scanning ${sourceFiles.length} TypeScript files...${colors.reset}\n`);

const results: Results = {
  scannedFiles: sourceFiles.length,
  modifiedFiles: 0,
  modifiedImports: {
    staticImports: 0,
    dynamicImports: 0,
    exports: 0,
    total: 0
  },
  filesWithRemainingTsImports: []
};

/**
 * Process a file to fix all types of imports
 */
function processFile(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(process.cwd(), filePath);
  let fileModified = false;
  let fileStats: ImportStats = {
    staticImports: 0,
    dynamicImports: 0,
    exports: 0,
    total: 0
  };

  // 1. Handle static imports: import { X } from './path.ts'
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.ts')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.ts$/, '.js');
      
      if (verbose) {
        console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
        console.log(`  ${colors.red}Static Import:${colors.reset} "${moduleSpecifier}" → "${newModuleSpecifier}"`);
      }
      
      if (!dryRun && !verifyOnly) {
        importDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
      
      fileModified = true;
      fileStats.staticImports++;
      fileStats.total++;
    }
  }

  // 2. Handle export declarations: export * from './path.ts' or export { X } from './path.ts'
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.ts')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.ts$/, '.js');
      
      if (verbose) {
        console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
        console.log(`  ${colors.magenta}Export:${colors.reset} "${moduleSpecifier}" → "${newModuleSpecifier}"`);
      }
      
      if (!dryRun && !verifyOnly) {
        exportDeclaration.setModuleSpecifier(newModuleSpecifier);
      }
      
      fileModified = true;
      fileStats.exports++;
      fileStats.total++;
    }
  }

  // 3. Handle dynamic imports: import('./path.ts') using string manipulation
  //    ts-morph doesn't have direct API for these, so we need to find them manually
  const fileText = sourceFile.getFullText();
  let newFileText = fileText;
  
  // Regex pattern for dynamic imports (handles various cases)
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+\.ts)['"]\s*\)/g;
  let match: RegExpExecArray | null;
  
  // Track all matches for replacement
  const dynamicImports: { importPath: string, newImportPath: string, fullMatch: string }[] = [];
  
  while ((match = dynamicImportRegex.exec(fileText)) !== null) {
    const fullMatch = match[0];
    const importPath = match[1];
    const newImportPath = importPath.replace(/\.ts$/, '.js');
    
    if (importPath !== newImportPath) {
      dynamicImports.push({ importPath, newImportPath, fullMatch });
      
      if (verbose) {
        console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
        console.log(`  ${colors.yellow}Dynamic Import:${colors.reset} "${importPath}" → "${newImportPath}"`);
      }
      
      fileModified = true;
      fileStats.dynamicImports++;
      fileStats.total++;
    }
  }
  
  // Apply the replacements for dynamic imports
  if (!dryRun && !verifyOnly && dynamicImports.length > 0) {
    for (const { importPath, newImportPath, fullMatch } of dynamicImports) {
      // Replace only the path part, keeping the surrounding structure
      const newFullMatch = fullMatch.replace(importPath, newImportPath);
      newFileText = newFileText.replace(fullMatch, newFullMatch);
    }
    
    // Save the changes directly to the file since ts-morph doesn't handle string replacements
    fs.writeFileSync(filePath, newFileText, 'utf8');
  }

  // Update statistics
  if (fileModified) {
    results.modifiedFiles++;
    results.modifiedImports.staticImports += fileStats.staticImports;
    results.modifiedImports.dynamicImports += fileStats.dynamicImports;
    results.modifiedImports.exports += fileStats.exports;
    results.modifiedImports.total += fileStats.total;
    
    if (!verbose) {
      console.log(`${colors.green}✓${colors.reset} Modified: ${colors.cyan}${relativeFilePath}${colors.reset} (${fileStats.total} imports)`);
    }
  }

  return fileModified;
}

/**
 * Verify if any .ts imports remain in the file
 */
function verifyNoTsImports(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(process.cwd(), filePath);
  let hasTsImports = false;

  // Check content with regex
  const fileContent = sourceFile.getFullText();
  
  // Skip this file itself to avoid detecting examples
  if (filePath.endsWith('fix-ts-to-js-imports.ts') || filePath.endsWith('fix-js-imports.ts')) {
    return false;
  }

  // Comprehensive regex to find any possible .ts imports or requires
  const tsImportRegex = /(?:from\s+['"]|import\s*\(\s*['"@]|require\s*\(\s*['"]|export\s+(?:\*|{[^}]*})\s+from\s+['"])([^'"]+\.ts)(?:['"])/g;
  
  let match: RegExpExecArray | null;
  const tsImportMatches: string[] = [];
  
  while ((match = tsImportRegex.exec(fileContent)) !== null) {
    tsImportMatches.push(match[1]);
    hasTsImports = true;
  }
  
  if (hasTsImports) {
    results.filesWithRemainingTsImports.push(relativeFilePath);
    
    if (verifyOnly || verbose) {
      console.log(`${colors.red}✗${colors.reset} Remaining TS imports in: ${colors.cyan}${relativeFilePath}${colors.reset}`);
      tsImportMatches.forEach(importPath => {
        console.log(`  ${colors.yellow}→${colors.reset} ${importPath}`);
      });
    }
  }
  
  return hasTsImports;
}

// Process all files
for (const sourceFile of sourceFiles) {
  // Process and fix imports
  processFile(sourceFile);
}

// Save the changes, if any
if (!dryRun && !verifyOnly) {
  console.log(`\n${colors.blue}Saving changes...${colors.reset}`);
  project.saveSync();
}

// Verify that no .ts imports remain
if (!dryRun || verifyOnly) {
  console.log(`\n${colors.blue}Verifying that no .ts imports remain...${colors.reset}`);
  // Re-initialize project to pick up any changes we made
  const verifyProject = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  });
  
  const verifySourceFiles = verifyProject.addSourceFilesAtPaths([
    './**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/fix-ts-to-js-imports.ts',
    '!**/fix-js-imports.ts'
  ]);
  
  for (const sourceFile of verifySourceFiles) {
    verifyNoTsImports(sourceFile);
  }
}

// Print results
console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
console.log(`${colors.yellow}Scanned:${colors.reset} ${results.scannedFiles} files`);
console.log(`${colors.yellow}Modified:${colors.reset} ${results.modifiedFiles} files`);
console.log(`${colors.yellow}Fixed imports:${colors.reset}`);
console.log(`  Static imports: ${results.modifiedImports.staticImports}`);
console.log(`  Dynamic imports: ${results.modifiedImports.dynamicImports}`);
console.log(`  Exports: ${results.modifiedImports.exports}`);
console.log(`  ${colors.bold}Total:${colors.reset} ${results.modifiedImports.total}`);

if (results.filesWithRemainingTsImports.length > 0) {
  console.log(`\n${colors.red}${colors.bold}WARNING:${colors.reset} ${results.filesWithRemainingTsImports.length} files still have .ts imports!`);
  console.log(`Run with ${colors.cyan}--verbose${colors.reset} to see details.`);
} else {
  console.log(`\n${colors.green}${colors.bold}✓ No remaining .ts imports detected!${colors.reset}`);
}

if (dryRun) {
  console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were modified.`);
  console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
}

console.log(`\n${colors.green}${colors.bold}Done!${colors.reset}`);