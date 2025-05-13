#!/usr/bin/env tsx
/**
 * JavaScript to TypeScript Converter
 *
 * This script converts JavaScript files to TypeScript:
 * 1. Identifies .js files without corresponding .ts files
 * 2. Creates equivalent .ts files with proper syntax
 * 3. Maintains all existing functionality
 * 4. Handles ESM import/export syntax
 *
 * Usage:
 *   tsx scripts/js-to-ts-converter.ts [options]
 *
 * Options:
 *   --dry-run   Preview changes without modifying files
 *   --verbose   Show detailed output
 *   --clean     Remove .js and .js.map files after conversion
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const cleanAfter = args.includes('--clean');

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
${colors.cyan}${colors.bold}JavaScript to TypeScript Converter${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no changes will be made)' : 'Live run (files will be created/modified)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
${colors.yellow}Clean:${colors.reset} ${cleanAfter ? 'Yes (will remove .js files after conversion)' : 'No'}
`);

interface ConversionStats {
  scannedFiles: number;
  convertedFiles: number;
  skippedFiles: number;
  removeFiles: number;
}

const results: ConversionStats = {
  scannedFiles: 0,
  convertedFiles: 0,
  skippedFiles: 0,
  removeFiles: 0
};

/**
 * Check if a file is in a node_modules or dist directory
 */
function isExcludedDirectory(filePath: string): boolean {
  return filePath.includes('node_modules') || 
         filePath.includes('dist') || 
         filePath.includes('test-') ||
         filePath.includes('examples');
}

/**
 * Get list of all JavaScript files in the project
 */
function getAllJavaScriptFiles(): string[] {
  try {
    // Use find command to locate all .js files, excluding node_modules
    const command = 'find . -type f -name "*.js" | grep -v "node_modules" | grep -v "dist"';
    const output = execSync(command, { encoding: 'utf-8' });
    const files = output.split('\n').filter(Boolean);
    
    if (verbose) {
      console.log(`${colors.blue}Found ${files.length} JavaScript files${colors.reset}`);
    }
    
    return files;
  } catch (error) {
    console.error(`${colors.red}Error finding JavaScript files:${colors.reset}`, error);
    return [];
  }
}

/**
 * Check if a corresponding TypeScript file exists
 */
function hasTsEquivalent(jsFilePath: string): boolean {
  const tsFilePath = jsFilePath.replace(/\.js$/, '.ts');
  return fs.existsSync(tsFilePath);
}

/**
 * Convert a JavaScript file to TypeScript
 */
function convertJsToTs(jsFilePath: string): boolean {
  try {
    // Skip if file doesn't exist
    if (!fs.existsSync(jsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - File doesn't exist: ${jsFilePath}`);
      }
      return false;
    }

    // Skip if in excluded directory
    if (isExcludedDirectory(jsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - Excluded directory: ${jsFilePath}`);
      }
      results.skippedFiles++;
      return false;
    }
    
    // Skip if .d.ts file exists but no .ts file
    if (jsFilePath.endsWith('.d.js') && fs.existsSync(jsFilePath.replace(/\.d\.js$/, '.d.ts'))) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - Declaration file already exists: ${jsFilePath}`);
      }
      results.skippedFiles++;
      return false;
    }

    // Define target TS file path
    const tsFilePath = jsFilePath.replace(/\.js$/, '.ts');
    
    // Skip if TypeScript equivalent already exists
    if (hasTsEquivalent(jsFilePath)) {
      if (verbose) {
        console.log(`${colors.yellow}Skipping${colors.reset} - TypeScript equivalent exists: ${jsFilePath}`);
      }
      results.skippedFiles++;
      return false;
    }

    // Read the JavaScript file content
    const jsContent = fs.readFileSync(jsFilePath, 'utf-8');
    
    // Initialize ts-morph project for parsing
    const project = new Project({
      useInMemoryFileSystem: true,
      skipAddingFilesFromTsConfig: true
    });
    
    // Add the JS file as source file
    const sourceFile = project.createSourceFile(jsFilePath, jsContent);
    
    // Process imports - convert .js extensions to .ts in imports
    convertJsImportsToTs(sourceFile);
    
    // Get the processed content
    let tsContent = sourceFile.getFullText();
    
    // Create the TypeScript file (but not in dry run mode)
    if (!dryRun) {
      fs.writeFileSync(tsFilePath, tsContent, 'utf-8');
      console.log(`${colors.green}✓ Converted:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
      
      // Clean up JS file if clean flag is set
      if (cleanAfter) {
        // Check if map file exists
        const mapFile = `${jsFilePath}.map`;
        if (fs.existsSync(mapFile)) {
          fs.unlinkSync(mapFile);
          results.removeFiles++;
        }
        
        // Remove JS file
        fs.unlinkSync(jsFilePath);
        results.removeFiles++;
        
        if (verbose) {
          console.log(`${colors.gray}  Removed: ${jsFilePath} and source map if exists${colors.reset}`);
        }
      }
    } else {
      if (verbose) {
        console.log(`${colors.green}Would convert:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
        console.log(`${colors.gray}Preview of content:${colors.reset}`);
        console.log(tsContent.substring(0, 500) + (tsContent.length > 500 ? '...' : ''));
      } else {
        console.log(`${colors.green}Would convert:${colors.reset} ${jsFilePath} → ${tsFilePath}`);
      }
    }
    
    results.convertedFiles++;
    return true;
  } catch (error) {
    console.error(`${colors.red}Error converting${colors.reset} ${jsFilePath}:`, error);
    return false;
  }
}

/**
 * Convert .js extensions to .ts in imports
 */
function convertJsImportsToTs(sourceFile: SourceFile): void {
  // Handle static imports: import { X } from './path.js'
  const importDeclarations = sourceFile.getImportDeclarations();
  for (const importDeclaration of importDeclarations) {
    const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.js')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.js$/, '.ts');
      importDeclaration.setModuleSpecifier(newModuleSpecifier);
    }
  }

  // Handle export declarations: export * from './path.js'
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDeclaration of exportDeclarations) {
    const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
    
    if (moduleSpecifier && moduleSpecifier.endsWith('.js')) {
      const newModuleSpecifier = moduleSpecifier.replace(/\.js$/, '.ts');
      exportDeclaration.setModuleSpecifier(newModuleSpecifier);
    }
  }
}

// Main execution
async function main() {
  // Get all JavaScript files in the project
  const jsFiles = getAllJavaScriptFiles();
  results.scannedFiles = jsFiles.length;
  
  console.log(`${colors.blue}Processing ${jsFiles.length} JavaScript files...${colors.reset}\n`);
  
  // Convert each JavaScript file
  for (const jsFile of jsFiles) {
    convertJsToTs(jsFile);
  }
  
  // Print results
  console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
  console.log(`${colors.yellow}Scanned:${colors.reset} ${results.scannedFiles} files`);
  console.log(`${colors.yellow}Converted:${colors.reset} ${results.convertedFiles} files`);
  console.log(`${colors.yellow}Skipped:${colors.reset} ${results.skippedFiles} files`);
  
  if (cleanAfter && !dryRun) {
    console.log(`${colors.yellow}Removed:${colors.reset} ${results.removeFiles} files (.js and .js.map)`);
  }
  
  if (dryRun) {
    console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were modified.`);
    console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
  } else {
    console.log(`\n${colors.green}${colors.bold}✓ Conversion complete!${colors.reset}`);
    
    // Next steps guidance
    console.log(`\n${colors.blue}${colors.bold}Next steps:${colors.reset}`);
    console.log(`1. Run TypeScript compiler to verify compilation:`);
    console.log(`   ${colors.cyan}npm run typecheck${colors.reset}`);
    console.log(`2. Update imports across the codebase with the fix-js-imports script:`);
    console.log(`   ${colors.cyan}npm run fix:imports${colors.reset}`);
    console.log(`3. Run tests to ensure functionality remains intact:`);
    console.log(`   ${colors.cyan}npm run test${colors.reset}`);
  }
}

main().catch(error => {
  console.error(`${colors.red}${colors.bold}Error:${colors.reset}`, error);
  process.exit(1);
});