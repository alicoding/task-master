#!/usr/bin/env tsx
/**
 * Script to run all TypeScript fixers in sequence
 * 
 * This script executes all the TypeScript fixing scripts in the optimal order
 * to maximize error reduction, with proper tracking of progress.
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { colors, logger, countTsErrors } from './utils';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const help = args.includes('--help');

// List of fixer scripts in the optimal execution order
const FIXERS = [
  'fixMissingExports.ts',     // First fix missing exports
  'fixChalkTypes.ts',         // Then fix chalk color issues with improved targeting
  'fixTimeWindowTypes.ts',    // Then fix time window types
  'fixDrizzleTypes.ts',       // Fix database issues
  'fixStringLiteralTypes.ts', // Fix other string literals like TaskStatus and ReadinessStatus
  'fixChalkColorToHelper.ts'  // Replace ChalkColor type assertions with asChalkColor helper
];

/**
 * Print usage information
 */
function printUsage() {
  logger.title('TypeScript Fixer Runner');
  console.log('Executes all TypeScript fixer scripts in sequence to fix common errors.\n');
  
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log('  npx tsx run-all.ts [options]\n');
  
  console.log(`${colors.bright}Options:${colors.reset}`);
  console.log('  --dry-run     Show changes without applying them');
  console.log('  --verbose     Show detailed diagnostic information');
  console.log('  --help        Show this help message\n');
  
  console.log(`${colors.bright}Examples:${colors.reset}`);
  console.log('  npx tsx run-all.ts');
  console.log('  npx tsx run-all.ts --dry-run');
  console.log('  npx tsx run-all.ts --verbose\n');
}

/**
 * Execute a fixer script with the given arguments
 */
async function executeFixer(script: string, args: string[] = []): Promise<void> {
  const scriptPath = resolve(__dirname, script);
  
  logger.title(`Running ${script}`);
  
  const result = spawnSync(
    'npx', 
    ['tsx', scriptPath, ...args], 
    { 
      stdio: 'inherit',
      cwd: rootDir
    }
  );
  
  if (result.status !== 0) {
    throw new Error(`Fixer script ${script} failed with exit code ${result.status}`);
  }
}

/**
 * Run all fixer scripts
 */
async function runAllFixers() {
  if (help) {
    printUsage();
    process.exit(0);
  }

  // Build the argument list for all scripts
  const scriptArgs = [];
  if (dryRun) scriptArgs.push('--dry-run');
  if (verbose) scriptArgs.push('--verbose');
  
  logger.title('TypeScript Fixer Runner');
  logger.info(`Mode: ${dryRun ? 'Dry Run (no changes will be applied)' : 'Live Run (changes will be applied)'}`);
  
  try {
    // Count initial errors
    logger.info('Counting TypeScript errors before fixes...');
    const beforeCount = await countTsErrors();
    logger.info(`Initial error count: ${beforeCount}`);
    
    const startTime = Date.now();
    
    // Run each fixer in sequence
    for (const script of FIXERS) {
      await executeFixer(script, scriptArgs);
    }
    
    const endTime = Date.now();
    
    // Count errors after all fixes
    if (!dryRun) {
      logger.info('Counting TypeScript errors after all fixes...');
      const afterCount = await countTsErrors();
      logger.info(`Final error count: ${afterCount}`);
      
      const reductionPercent = Math.round((1 - afterCount / beforeCount) * 100);
      logger.success(`Reduced errors by: ${beforeCount - afterCount} (${reductionPercent}%)`);
    }
    
    logger.success(`All fixer scripts completed in ${(endTime - startTime) / 1000}s`);
    
  } catch (error) {
    logger.error(`Error running fixer scripts: ${error}`);
    process.exit(1);
  }
}

// Run the script
runAllFixers();