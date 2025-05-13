#!/usr/bin/env tsx
/**
 * A script to remove redundant .d.ts files while preserving necessary ones.
 * Based on the analysis from analyze-declaration-files.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// ANSI colors for prettier output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const dryRun = args.includes('--dry-run') || args.includes('-d');
const force = args.includes('--force') || args.includes('-f');
const backup = args.includes('--backup') || args.includes('-b');

// Statistics
const stats = {
  scannedFiles: 0,
  essentialFiles: 0,
  removedFiles: 0,
  errorFiles: 0,
  skippedFiles: 0,
};

// List of essential declaration files that should never be removed
const essentialFiles = [
  'src/core/nlp/fuse.d.ts',
  'src/types/chalk-utils.d.ts',
  'src/types/core-types.d.ts',
  'src/types/drizzle-orm.d.ts',
  'types/chalk-utils.d.ts',
  'types/core-types.d.ts',
  'types/drizzle-orm.d.ts',
];

// Files in scripts directory that might not have corresponding .ts files
const scriptFiles = [
  'scripts/convert-to-alias-imports.d.ts',
  'scripts/fix-database.d.ts',
  'scripts/fix-js-imports.d.ts',
  'scripts/fix-remaining-ts-imports.d.ts',
  'scripts/fix-tags.d.ts',
  'scripts/generate-docs.d.ts',
  'scripts/remove-import-extensions-with-exceptions.d.ts',
  'scripts/remove-import-extensions.d.ts',
  'scripts/run-migration.d.ts',
  'scripts/standalone-task-processor.d.ts',
  'scripts/upgrade-database.d.ts',
  'scripts/validate-extensionless-imports-with-exceptions.d.ts',
  'scripts/validate-extensionless-imports.d.ts',
  'scripts/validate-ts-imports.d.ts',
];

// Paths to exclude
const excludePaths = [
  'node_modules',
  'dist',
  '.git',
];

/**
 * Check if a file is essential and should be kept
 */
function isEssentialFile(filePath: string): boolean {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return essentialFiles.some(ef => relativePath.endsWith(ef));
}

/**
 * Check if a file is in the scripts directory
 */
function isScriptFile(filePath: string): boolean {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  return scriptFiles.some(sf => relativePath.endsWith(sf));
}

/**
 * Check if a corresponding TypeScript file exists for a declaration file
 */
function hasCorrespondingTsFile(dtsPath: string): boolean {
  const tsPath = dtsPath.replace(/\.d\.ts$/, '.ts');
  return fs.existsSync(tsPath);
}

/**
 * Process a single declaration file
 */
function processDtsFile(filePath: string): void {
  stats.scannedFiles++;
  
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  
  // Check if it's an essential file
  if (isEssentialFile(filePath)) {
    if (verbose) {
      console.log(`${colors.green}Essential${colors.reset} - Keeping ${relativePath}`);
    }
    stats.essentialFiles++;
    return;
  }
  
  // Check if it's a script file (special case)
  if (isScriptFile(filePath) && !force) {
    if (verbose) {
      console.log(`${colors.yellow}Script file${colors.reset} - Skipping ${relativePath}`);
    }
    stats.skippedFiles++;
    return;
  }
  
  // Check if a corresponding .ts file exists
  if (hasCorrespondingTsFile(filePath)) {
    try {
      // Create backup if requested
      if (backup && !dryRun) {
        const backupDir = path.join(process.cwd(), 'backups', 'dts-files');
        const backupPath = path.join(
          backupDir, 
          relativePath
        );
        
        // Create backup directory
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        
        // Copy file to backup
        fs.copyFileSync(filePath, backupPath);
        
        if (verbose) {
          console.log(`${colors.blue}Backup${colors.reset} - Created backup at ${path.relative(process.cwd(), backupPath)}`);
        }
      }
      
      // Remove file if not in dry run mode
      if (!dryRun) {
        fs.unlinkSync(filePath);
        stats.removedFiles++;
        console.log(`${colors.red}Removed${colors.reset} - ${relativePath}`);
      } else {
        console.log(`${colors.yellow}Would remove${colors.reset} - ${relativePath}`);
        stats.removedFiles++;
      }
    } catch (error) {
      console.error(`${colors.red}Error removing ${relativePath}:${colors.reset}`, error);
      stats.errorFiles++;
    }
  } else {
    // Skip files without corresponding .ts files
    if (verbose) {
      console.log(`${colors.yellow}No TS file${colors.reset} - Skipping ${relativePath}`);
    }
    stats.skippedFiles++;
  }
}

/**
 * Main function to find and process all declaration files
 */
async function removeRedundantDtsFiles() {
  console.log(`${colors.blue}Removing redundant .d.ts files...${colors.reset}`);
  
  if (dryRun) {
    console.log(`${colors.yellow}DRY RUN: No files will be actually removed${colors.reset}`);
  }
  
  if (force) {
    console.log(`${colors.yellow}FORCE: Will process script files as well${colors.reset}`);
  }
  
  if (backup) {
    console.log(`${colors.green}BACKUP: Will create backups of removed files${colors.reset}`);
    
    if (!dryRun) {
      // Create backup directory
      const backupDir = path.join(process.cwd(), 'backups', 'dts-files');
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`${colors.blue}Backup directory created at ${path.relative(process.cwd(), backupDir)}${colors.reset}`);
    }
  }
  
  // Get all .d.ts files
  const files = await glob('**/*.d.ts', { 
    ignore: excludePaths.map(p => `**/${p}/**`)
  });
  
  console.log(`${colors.blue}Found ${files.length} declaration files${colors.reset}`);
  
  // Process each file
  for (const file of files) {
    const filePath = path.resolve(file);
    processDtsFile(filePath);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.green}Processing Complete${colors.reset}`);
  console.log('='.repeat(80));
  console.log(`Total declaration files scanned: ${stats.scannedFiles}`);
  console.log(`Essential files kept: ${colors.green}${stats.essentialFiles}${colors.reset}`);
  console.log(`Files removed: ${colors.red}${stats.removedFiles}${colors.reset}`);
  console.log(`Files skipped: ${colors.yellow}${stats.skippedFiles}${colors.reset}`);
  console.log(`Errors: ${colors.red}${stats.errorFiles}${colors.reset}`);
  console.log('='.repeat(80));
  
  if (dryRun) {
    console.log(`\n${colors.yellow}DRY RUN: No files were actually removed${colors.reset}`);
    console.log(`Use without --dry-run to perform the removal`);
  }
}

// Execute the removal
removeRedundantDtsFiles().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});