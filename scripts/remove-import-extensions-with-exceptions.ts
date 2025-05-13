#!/usr/bin/env tsx
/**
 * Extension Removal Script for TypeScript Imports (with Exceptions)
 * 
 * This script removes file extensions from all import and export statements
 * to standardize the codebase import pattern, but respects a list of exceptions.
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const verifyOnly = args.includes('--verify');
const force = args.includes('--force');

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
  filesWithExtensionImports: string[];
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
${colors.cyan}${colors.bold}Import Extension Remover (with Exceptions)${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no changes will be made)' : verifyOnly ? 'Verification only' : 'Live run (changes will be applied)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
`);

// Files explicitly allowed to have extensions
const allowedExceptionFiles = [
  // Fix scripts that need extensions for demonstration/examples
  'fix-js-imports.ts',
  'fix-js-to-ts-imports.ts',
  'fix-ts-to-js-imports.ts',
  'remove-import-extensions.ts',
  'remove-import-extensions-with-exceptions.ts',
  'validate-extensionless-imports-with-exceptions.ts',
  // Declaration files that need extensions for module augmentation
  'src/types/core-types.d.ts',
  'types/core-types.d.ts',
  // Files for special examples or tests
  'examples/add-task-examples.ts',
  // Any others that need them
  'core/nlp-helpers.ts',
  'core/nlp-service-mock.ts',
  'core/nlp-service.ts',
  'core/capability-map/visualizer.ts',
  'core/repository/factory.ts',
  'core/repository/base.ts',
  'src/core/nlp-helpers.ts',
  'src/core/nlp-service-mock.ts',
  'src/core/nlp-service.ts',
  'src/core/capability-map/visualizer.ts',
  'src/core/repository/factory.ts',
  'src/core/repository/base.ts',
  'cli/commands/setup/project-init.ts',
  'src/cli/commands/setup/project-init.ts'
];

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true
});

// Add all TypeScript files in the project excluding node_modules and dist
const sourceFiles = project.addSourceFilesAtPaths([
  './**/*.ts',
  '!**/node_modules/**',
  '!**/dist/**'
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
  filesWithExtensionImports: []
};

/**
 * Remove extension from a module specifier
 */
function removeExtension(moduleSpecifier: string): string {
  // Handle only .ts, .js, .mjs, .cjs extensions
  // Don't modify node: or external modules
  if (moduleSpecifier.match(/\.(ts|js|mjs|cjs)$/) && 
      !moduleSpecifier.startsWith('node:') &&
      !moduleSpecifier.includes('node_modules')) {
    return moduleSpecifier.replace(/\.(ts|js|mjs|cjs)$/, '');
  }
  return moduleSpecifier;
}

/**
 * Process a file to remove extensions from all imports
 */
function processFile(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(process.cwd(), filePath);
  
  // Skip files in the exception list
  if (allowedExceptionFiles.some(allowedFile => filePath.endsWith(allowedFile))) {
    if (verbose) {
      console.log(`${colors.blue}Skipping allowed exception file:${colors.reset} ${relativeFilePath}`);
    }
    return false;
  }
  
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
    
    if (moduleSpecifier) {
      const newModuleSpecifier = removeExtension(moduleSpecifier);
      
      if (newModuleSpecifier !== moduleSpecifier) {
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
  }

  // 2. Handle export declarations: export * from './path.ts' or export { X } from './path.ts'
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier) {
      const newModuleSpecifier = removeExtension(moduleSpecifier);
      
      if (newModuleSpecifier !== moduleSpecifier) {
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
  }

  // 3. Handle dynamic imports: import('./path') using string manipulation
  //    ts-morph doesn't have direct API for these, so we need to find them manually
  const fileText = sourceFile.getFullText();
  let newFileText = fileText;
  
  // Regex pattern for dynamic imports (handles various cases)
  const dynamicImportRegex = /import\s*\(\s*(['"])([^'"]+\.(ts|js|mjs|cjs))(['"])\s*\)/g;
  let match: RegExpExecArray | null;
  
  // Track all matches for replacement
  const dynamicImports: { importPath: string, newImportPath: string, fullMatch: string }[] = [];
  
  while ((match = dynamicImportRegex.exec(fileText)) !== null) {
    const quote = match[1]; // The quotation mark used (single or double)
    const importPath = match[2]; // The import path including extension
    const fullMatch = match[0]; // The entire import statement
    
    // Skip node: imports and external modules
    if (importPath.startsWith('node:') || importPath.includes('node_modules')) {
      continue;
    }
    
    const newImportPath = removeExtension(importPath);
    
    if (importPath !== newImportPath) {
      dynamicImports.push({ 
        importPath, 
        newImportPath, 
        fullMatch 
      });
      
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
 * Verify if any imports with extensions remain in the file
 */
function verifyNoExtensionImports(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(process.cwd(), filePath);
  
  // Skip files in the exception list
  if (allowedExceptionFiles.some(allowedFile => filePath.endsWith(allowedFile))) {
    return false;
  }
  
  let hasExtensionImports = false;

  // Check content with regex for any import with explicit file extensions
  const fileContent = sourceFile.getFullText();
  
  // Comprehensive regex to find any imports with extensions
  const extImportRegex = /(?:from\s+['"]|import\s*\(\s*['"@]|require\s*\(\s*['"]|export\s+(?:\*|{[^}]*})\s+from\s+['"])([^'"]+\.(ts|js|mjs|cjs))(?:['"])/g;
  
  let match: RegExpExecArray | null;
  const extImportMatches: string[] = [];
  
  while ((match = extImportRegex.exec(fileContent)) !== null) {
    // Skip node: imports and external modules
    if (match[1].startsWith('node:') || match[1].includes('node_modules')) {
      continue;
    }
    
    extImportMatches.push(match[1]);
    hasExtensionImports = true;
  }
  
  if (hasExtensionImports) {
    results.filesWithExtensionImports.push(relativeFilePath);
    
    if (verifyOnly || verbose) {
      console.log(`${colors.red}✗${colors.reset} Remaining extension imports in: ${colors.cyan}${relativeFilePath}${colors.reset}`);
      extImportMatches.forEach(importPath => {
        console.log(`  ${colors.yellow}→${colors.reset} ${importPath}`);
      });
    }
  }
  
  return hasExtensionImports;
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

// Verify that no extension imports remain
if (!dryRun || verifyOnly) {
  console.log(`\n${colors.blue}Verifying that no extension imports remain...${colors.reset}`);
  // Re-initialize project to pick up any changes we made
  const verifyProject = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true
  });
  
  const verifySourceFiles = verifyProject.addSourceFilesAtPaths([
    './**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ]);
  
  for (const sourceFile of verifySourceFiles) {
    verifyNoExtensionImports(sourceFile);
  }
}

// Print results
console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
console.log(`${colors.yellow}Scanned:${colors.reset} ${results.scannedFiles} files`);
console.log(`${colors.yellow}Modified:${colors.reset} ${results.modifiedFiles} files`);
console.log(`${colors.yellow}Removed extensions:${colors.reset}`);
console.log(`  Static imports: ${results.modifiedImports.staticImports}`);
console.log(`  Dynamic imports: ${results.modifiedImports.dynamicImports}`);
console.log(`  Exports: ${results.modifiedImports.exports}`);
console.log(`  ${colors.bold}Total:${colors.reset} ${results.modifiedImports.total}`);

if (results.filesWithExtensionImports.length > 0) {
  console.log(`\n${colors.red}${colors.bold}WARNING:${colors.reset} ${results.filesWithExtensionImports.length} files still have extension imports!`);
  console.log(`Run with ${colors.cyan}--verbose${colors.reset} to see details.`);
} else {
  console.log(`\n${colors.green}${colors.bold}✓ No remaining extension imports detected!${colors.reset}`);
}

if (dryRun) {
  console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were modified.`);
  console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
}

console.log(`\n${colors.green}${colors.bold}Done!${colors.reset}`);