#!/usr/bin/env node
/**
 * TypeScript-only build script
 * Builds only TypeScript files, ignoring any JavaScript files
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Track build timing
const startTime = Date.now();

// Show header
log('', colors.reset);
log('╔═════════════════════════════════════════════╗', colors.blue);
log('║          TYPESCRIPT-ONLY BUILD              ║', colors.blue + colors.bright);
log('╚═════════════════════════════════════════════╝', colors.blue);
log('', colors.reset);

// Parse command line arguments
const args = process.argv.slice(2);
const forceFlag = args.includes('--force');
const skipLibCheck = args.includes('--skip-lib-check');
const project = args.find(arg => arg.startsWith('--project='))?.split('=')[1] || 'tsconfig.build.json';

// Construct build command
const tscArgs = [
  'tsc',
  '--project', project,
];

if (skipLibCheck) {
  tscArgs.push('--skipLibCheck');
}

if (forceFlag) {
  tscArgs.push('--skipDefaultLibCheck', '--noEmitOnError', 'true');
}

// Run the build
log(`🔨 Building TypeScript files using ${project}...`, colors.cyan);
log(`Options: ${tscArgs.slice(2).join(' ')}`, colors.dim);

const buildResult = spawnSync('npx', tscArgs, { stdio: 'inherit' });

// Handle result
if (buildResult.status === 0) {
  log('✅ TYPESCRIPT-ONLY BUILD SUCCESSFUL!', colors.green + colors.bright);
  log(`⏱️  Completed in ${(Date.now() - startTime) / 1000}s`, colors.dim);
  process.exit(0);
} else {
  if (forceFlag) {
    log('⚠️  Force build attempted with errors - check output files', colors.yellow);
    log(`⏱️  Completed with warnings in ${(Date.now() - startTime) / 1000}s`, colors.dim);
    process.exit(0);
  } else {
    log('❌ BUILD FAILED!', colors.red + colors.bright);
    log(`⏱️  Failed after ${(Date.now() - startTime) / 1000}s`, colors.dim);
    log('\nSuggestions:', colors.yellow);
    log('1. Run with --force to build despite errors', colors.reset);
    log('2. Run with --skip-lib-check to ignore errors in libraries', colors.reset);
    log('3. Fix TypeScript errors shown above', colors.reset);
    process.exit(1);
  }
}