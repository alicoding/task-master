#!/usr/bin/env tsx
/**
 * Script to convert relative imports to use the @/ alias
 * This replaces all relative imports (starting with ./ or ../) with absolute imports using the @ pattern
 * to eliminate TypeScript "Relative import paths need explicit file extensions" errors
 */

import { Project, SyntaxKind, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const targetPath = args.find(arg => !arg.startsWith('--'));
const skipTests = args.includes('--skip-tests');

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
${colors.cyan}${colors.bold}Relative to @ Import Converter${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no changes will be made)' : 'Live run (changes will be applied)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
${colors.yellow}Target:${colors.reset} ${targetPath || 'All files'}
${colors.yellow}Skip Tests:${colors.reset} ${skipTests ? 'Yes' : 'No'}
`);

// Initialize counter for reporting
interface ImportStats {
  convertedImports: number;
  convertedExports: number;
  convertedDynamicImports: number;
  skippedImports: number;
  total: number;
}

interface Results {
  scannedFiles: number;
  modifiedFiles: number;
  stats: ImportStats;
  failures: string[];
}

const results: Results = {
  scannedFiles: 0,
  modifiedFiles: 0,
  stats: {
    convertedImports: 0,
    convertedExports: 0,
    convertedDynamicImports: 0,
    skippedImports: 0,
    total: 0
  },
  failures: []
};

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json')
});

// Configure file patterns
let filePatterns = [
  'cli/**/*.ts',
  'core/**/*.ts'
];

// Add test files if not skipped
if (!skipTests) {
  filePatterns.push('test/**/*.ts');
}

// If a specific target path is provided, use that instead
if (targetPath) {
  filePatterns = [targetPath];
}

// Add all TypeScript files in the project
const sourceFiles = project.addSourceFilesAtPaths(filePatterns);

results.scannedFiles = sourceFiles.length;

console.log(`${colors.blue}Scanning ${sourceFiles.length} TypeScript files...${colors.reset}\n`);

/**
 * Checks if a path is within the src directory
 */
function isInSrcDirectory(filePath: string): boolean {
  const srcDir = path.resolve(process.cwd(), 'src');
  const normalizedPath = path.normalize(filePath);
  return normalizedPath.startsWith(srcDir);
}

/**
 * Converts a relative import path to an absolute path using the @ alias
 */
function convertToAliasPath(filePath: string, relativePath: string): string | null {
  try {
    // Get absolute path of the current file
    const currentDir = path.dirname(filePath);

    // Compute the absolute target path by resolving the relative path from the current directory
    let targetPath = path.resolve(currentDir, relativePath);

    // Get the path relative to the src directory and project root
    const srcDir = path.resolve(process.cwd(), 'src');
    const projectRoot = process.cwd();

    // We need to handle both src/* imports and imports to CLI files outside src
    const isInsideSrc = targetPath.startsWith(srcDir);
    const isTargetingSrc = targetPath.includes('/src/') || targetPath.includes('\\src\\');

    // For files outside src that import from src, we need to adjust the path
    if (!isInsideSrc && isTargetingSrc) {
      // Extract the part of the path after 'src/'
      const srcIndex = targetPath.indexOf('/src/');
      if (srcIndex !== -1) {
        const pathAfterSrc = targetPath.substring(srcIndex + 5); // +5 to skip '/src/'
        return `@/${pathAfterSrc}`;
      }

      // Handle Windows paths
      const winSrcIndex = targetPath.indexOf('\\src\\');
      if (winSrcIndex !== -1) {
        const pathAfterSrc = targetPath.substring(winSrcIndex + 5); // +5 to skip '\src\'
        return `@/${pathAfterSrc.replace(/\\/g, '/')}`;
      }
    }

    // Only convert paths that are within or target the src directory
    if (!isInsideSrc && !isTargetingSrc) {
      return null;
    }

    // Handle directory imports (auto-resolve to index.ts)
    const isDirectory = fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory();
    if (isDirectory) {
      const indexPath = path.join(targetPath, 'index.ts');
      if (fs.existsSync(indexPath)) {
        targetPath = path.join(targetPath, 'index');
      }
    }
    // Handle .ts extension omission
    else if (!targetPath.endsWith('.ts') && fs.existsSync(`${targetPath}.ts`)) {
      targetPath = targetPath;
    }

    // If the target path is inside src, calculate relative to src
    if (isInsideSrc) {
      // Compute path from the src directory
      let pathFromSrc = path.relative(srcDir, targetPath);

      // Convert Windows backslashes to forward slashes if needed
      pathFromSrc = pathFromSrc.replace(/\\/g, '/');

      // Return with @ prefix
      return `@/${pathFromSrc}`;
    }

    return null;
  } catch (error) {
    results.failures.push(`Failed to convert path: ${filePath} -> ${relativePath}, Error: ${error}`);
    return null;
  }
}

/**
 * Process a file to convert relative imports to @ alias imports
 */
function processFile(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath();
  const relativeFilePath = path.relative(process.cwd(), filePath);
  
  let fileModified = false;
  let fileStats: ImportStats = {
    convertedImports: 0,
    convertedExports: 0,
    convertedDynamicImports: 0,
    skippedImports: 0,
    total: 0
  };
  
  // Process import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    // Check if this is a relative import
    if (moduleSpecifier && (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../'))) {
      // Convert to @ alias path
      const aliasPath = convertToAliasPath(filePath, moduleSpecifier);
      
      if (aliasPath) {
        if (verbose) {
          console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
          console.log(`  ${colors.green}Import:${colors.reset} "${moduleSpecifier}" → "${aliasPath}"`);
        }
        
        if (!dryRun) {
          importDeclaration.setModuleSpecifier(aliasPath);
        }
        
        fileModified = true;
        fileStats.convertedImports++;
        fileStats.total++;
      } else {
        fileStats.skippedImports++;
        
        if (verbose) {
          console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
          console.log(`  ${colors.yellow}Skipped Import:${colors.reset} "${moduleSpecifier}" (not in src directory)`);
        }
      }
    }
  }
  
  // Process export declarations
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    // Check if this is a relative export
    if (moduleSpecifier && (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../'))) {
      // Convert to @ alias path
      const aliasPath = convertToAliasPath(filePath, moduleSpecifier);
      
      if (aliasPath) {
        if (verbose) {
          console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
          console.log(`  ${colors.magenta}Export:${colors.reset} "${moduleSpecifier}" → "${aliasPath}"`);
        }
        
        if (!dryRun) {
          exportDeclaration.setModuleSpecifier(aliasPath);
        }
        
        fileModified = true;
        fileStats.convertedExports++;
        fileStats.total++;
      } else {
        fileStats.skippedImports++;
        
        if (verbose) {
          console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
          console.log(`  ${colors.yellow}Skipped Export:${colors.reset} "${moduleSpecifier}" (not in src directory)`);
        }
      }
    }
  }
  
  // Also handle dynamic imports
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  for (const stringLiteral of stringLiterals) {
    // Check if the string literal is part of a dynamic import
    const parent = stringLiteral.getParent();
    if (parent && parent.getKind() === SyntaxKind.CallExpression) {
      const callExpression = parent;
      const expression = callExpression.getExpression();
      
      // Check if it's an import() call
      if (expression.getKind() === SyntaxKind.ImportKeyword) {
        const importPath = stringLiteral.getLiteralValue();
        
        // Check if this is a relative import
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          // Convert to @ alias path
          const aliasPath = convertToAliasPath(filePath, importPath);
          
          if (aliasPath) {
            if (verbose) {
              console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
              console.log(`  ${colors.yellow}Dynamic Import:${colors.reset} "${importPath}" → "${aliasPath}"`);
            }
            
            if (!dryRun) {
              stringLiteral.replaceWithText(`"${aliasPath}"`);
            }
            
            fileModified = true;
            fileStats.convertedDynamicImports++;
            fileStats.total++;
          } else {
            fileStats.skippedImports++;
            
            if (verbose) {
              console.log(`${colors.gray}${relativeFilePath}:${colors.reset}`);
              console.log(`  ${colors.yellow}Skipped Dynamic Import:${colors.reset} "${importPath}" (not in src directory)`);
            }
          }
        }
      }
    }
  }
  
  // Update statistics
  if (fileModified) {
    results.modifiedFiles++;
    results.stats.convertedImports += fileStats.convertedImports;
    results.stats.convertedExports += fileStats.convertedExports;
    results.stats.convertedDynamicImports += fileStats.convertedDynamicImports;
    results.stats.skippedImports += fileStats.skippedImports;
    results.stats.total += fileStats.total;
    
    if (!verbose) {
      console.log(`${colors.green}✓${colors.reset} Modified: ${colors.cyan}${relativeFilePath}${colors.reset} (${fileStats.total} imports/exports)`);
    }
  }
  
  return fileModified;
}

// Process all files
for (const sourceFile of sourceFiles) {
  processFile(sourceFile);
}

// Save the changes, if not a dry run
if (!dryRun) {
  console.log(`\n${colors.blue}Saving changes...${colors.reset}`);
  project.saveSync();
}

// Print results
console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
console.log(`${colors.yellow}Scanned:${colors.reset} ${results.scannedFiles} files`);
console.log(`${colors.yellow}Modified:${colors.reset} ${results.modifiedFiles} files`);
console.log(`${colors.yellow}Converted paths:${colors.reset}`);
console.log(`  Imports: ${results.stats.convertedImports}`);
console.log(`  Exports: ${results.stats.convertedExports}`);
console.log(`  Dynamic Imports: ${results.stats.convertedDynamicImports}`);
console.log(`  Skipped: ${results.stats.skippedImports}`);
console.log(`  ${colors.bold}Total:${colors.reset} ${results.stats.total}`);

if (results.failures.length > 0) {
  console.log(`\n${colors.red}${colors.bold}Failures:${colors.reset}`);
  results.failures.forEach(failure => console.log(`  ${colors.red}✗${colors.reset} ${failure}`));
}

if (dryRun) {
  console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were modified.`);
  console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
}

console.log(`\n${colors.green}${colors.bold}Done!${colors.reset}`);