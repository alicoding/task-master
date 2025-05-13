#!/usr/bin/env tsx
/**
 * JS Files Removal Tool
 * 
 * This script removes JavaScript files that have TypeScript equivalents.
 * It also removes corresponding .js.map files to clean up the codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Command-line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const force = args.includes('--force');

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
${colors.cyan}${colors.bold}JavaScript Files Removal Tool${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} ${dryRun ? 'Dry run (no files will be deleted)' : 'Live run (files will be deleted)'}
${colors.yellow}Verbosity:${colors.reset} ${verbose ? 'Verbose' : 'Standard'}
${colors.yellow}Force:${colors.reset} ${force ? 'Yes (remove all .js files)' : 'No (only remove files with .ts equivalents)'}
`);

// Stats tracking
interface RemovalStats {
  scannedFiles: number;
  jsFilesRemoved: number;
  jsMapFilesRemoved: number;
  skippedFiles: number;
}

const stats: RemovalStats = {
  scannedFiles: 0,
  jsFilesRemoved: 0, 
  jsMapFilesRemoved: 0,
  skippedFiles: 0
};

/**
 * Check if a file should be processed
 */
function shouldProcessFile(filePath: string): boolean {
  // Skip files in node_modules and dist
  if (filePath.includes('node_modules') || filePath.includes('dist')) {
    return false;
  }
  
  // Only process .js files
  return filePath.endsWith('.js');
}

/**
 * Check if a corresponding TypeScript file exists
 */
function hasTsEquivalent(jsFilePath: string): boolean {
  const tsFilePath = jsFilePath.replace(/\.js$/, '.ts');
  return fs.existsSync(tsFilePath);
}

/**
 * Get all JavaScript files in the project
 */
function getAllJavaScriptFiles(): string[] {
  try {
    // Use find command to locate all .js files, excluding node_modules and dist
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
 * Get all JavaScript source map files in the project
 */
function getAllJavaScriptMapFiles(): string[] {
  try {
    // Use find command to locate all .js.map files, excluding node_modules and dist
    const command = 'find . -type f -name "*.js.map" | grep -v "node_modules" | grep -v "dist"';
    const output = execSync(command, { encoding: 'utf-8' });
    const files = output.split('\n').filter(Boolean);
    
    if (verbose) {
      console.log(`${colors.blue}Found ${files.length} JavaScript map files${colors.reset}`);
    }
    
    return files;
  } catch (error) {
    console.error(`${colors.red}Error finding JavaScript map files:${colors.reset}`, error);
    return [];
  }
}

/**
 * Process a JavaScript file
 */
function processJsFile(jsFilePath: string): void {
  stats.scannedFiles++;
  
  // Skip files that shouldn't be processed
  if (!shouldProcessFile(jsFilePath)) {
    if (verbose) {
      console.log(`${colors.yellow}Skipping${colors.reset} - ${jsFilePath}`);
    }
    stats.skippedFiles++;
    return;
  }
  
  // Check if a TypeScript equivalent exists or if force mode is enabled
  if (force || hasTsEquivalent(jsFilePath)) {
    if (!dryRun) {
      try {
        fs.unlinkSync(jsFilePath);
        stats.jsFilesRemoved++;
        
        // Also remove the corresponding .js.map file if it exists
        const mapFilePath = `${jsFilePath}.map`;
        if (fs.existsSync(mapFilePath)) {
          fs.unlinkSync(mapFilePath);
          stats.jsMapFilesRemoved++;
        }
        
        console.log(`${colors.green}✓ Removed:${colors.reset} ${jsFilePath}`);
      } catch (error) {
        console.error(`${colors.red}Error removing file ${jsFilePath}:${colors.reset}`, error);
      }
    } else {
      console.log(`${colors.green}Would remove:${colors.reset} ${jsFilePath}`);
      stats.jsFilesRemoved++;
      
      // Check if a corresponding .js.map file exists
      const mapFilePath = `${jsFilePath}.map`;
      if (fs.existsSync(mapFilePath)) {
        console.log(`${colors.green}Would remove:${colors.reset} ${mapFilePath}`);
        stats.jsMapFilesRemoved++;
      }
    }
  } else {
    if (verbose) {
      console.log(`${colors.yellow}Skipping${colors.reset} - No TypeScript equivalent: ${jsFilePath}`);
    }
    stats.skippedFiles++;
  }
}

/**
 * Main function
 */
async function main() {
  // Get all JavaScript files
  const jsFiles = getAllJavaScriptFiles();
  
  // If using the --js-map-only flag, only process .js.map files
  if (args.includes('--js-map-only')) {
    console.log(`${colors.blue}Processing only JavaScript map files...${colors.reset}\n`);
    
    const mapFiles = getAllJavaScriptMapFiles();
    for (const mapFile of mapFiles) {
      if (!dryRun) {
        try {
          fs.unlinkSync(mapFile);
          stats.jsMapFilesRemoved++;
          console.log(`${colors.green}✓ Removed:${colors.reset} ${mapFile}`);
        } catch (error) {
          console.error(`${colors.red}Error removing file ${mapFile}:${colors.reset}`, error);
        }
      } else {
        console.log(`${colors.green}Would remove:${colors.reset} ${mapFile}`);
        stats.jsMapFilesRemoved++;
      }
    }
  } else {
    // Process JavaScript files
    console.log(`${colors.blue}Processing ${jsFiles.length} JavaScript files...${colors.reset}\n`);
    for (const jsFile of jsFiles) {
      processJsFile(jsFile);
    }
  }
  
  // Print results
  console.log(`\n${colors.cyan}${colors.bold}Results:${colors.reset}`);
  if (!args.includes('--js-map-only')) {
    console.log(`${colors.yellow}Scanned:${colors.reset} ${stats.scannedFiles} JavaScript files`);
    console.log(`${colors.yellow}Removed:${colors.reset} ${stats.jsFilesRemoved} JavaScript files`);
    console.log(`${colors.yellow}Removed:${colors.reset} ${stats.jsMapFilesRemoved} JavaScript map files`);
    console.log(`${colors.yellow}Skipped:${colors.reset} ${stats.skippedFiles} files`);
  } else {
    console.log(`${colors.yellow}Removed:${colors.reset} ${stats.jsMapFilesRemoved} JavaScript map files`);
  }
  
  if (dryRun) {
    console.log(`\n${colors.yellow}${colors.bold}NOTE:${colors.reset} This was a dry run. No files were deleted.`);
    console.log(`Run without ${colors.cyan}--dry-run${colors.reset} to apply the changes.`);
  } else {
    console.log(`\n${colors.green}${colors.bold}✓ File removal complete!${colors.reset}`);
  }
}

main().catch(error => {
  console.error(`${colors.red}${colors.bold}Error:${colors.reset}`, error);
  process.exit(1);
});