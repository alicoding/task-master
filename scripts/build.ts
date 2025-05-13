#!/usr/bin/env node
/**
 * Progressive TypeScript build script
 * Attempts multiple build strategies, from strictest to most lenient
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
log('║            PROGRESSIVE TS BUILD             ║', colors.blue + colors.bright);
log('╚═════════════════════════════════════════════╝', colors.blue);
log('', colors.reset);

// Try strict build first
log('🧪 Attempting strict TypeScript-only build (highest quality)...', colors.cyan);
const strictBuild = spawnSync('npx', ['tsc'], { stdio: 'inherit' });

if (strictBuild.status === 0) {
  log('✅ STRICT BUILD SUCCESSFUL!', colors.green + colors.bright);
  log(`⏱️  Completed in ${(Date.now() - startTime) / 1000}s`, colors.dim);
  process.exit(0);
}

log('❌ Strict build failed, trying TypeScript-only standard build...', colors.yellow);

// Try TypeScript-only standard build
const standardBuild = spawnSync(
  'npx',
  ['tsc', '--project', 'tsconfig.build.json'],
  { stdio: 'inherit' }
);

if (standardBuild.status === 0) {
  log('✅ TYPESCRIPT-ONLY STANDARD BUILD SUCCESSFUL!', colors.green);
  log(`⏱️  Completed in ${(Date.now() - startTime) / 1000}s`, colors.dim);
  process.exit(0);
}

log('❌ Standard build failed, trying TypeScript-only force build...', colors.magenta);

// Try TypeScript-only force build
const forceBuild = spawnSync(
  'npx',
  [
    'tsc',
    '--project', 'tsconfig.build.json',
    '--skipLibCheck',
    '--skipDefaultLibCheck',
    '--noEmitOnError', 'true',
  ],
  { stdio: 'inherit' }
);

if (forceBuild.status === 0) {
  log('✅ FORCE BUILD SUCCESSFUL! (But type issues remain)', colors.yellow);
  log(`⏱️  Completed in ${(Date.now() - startTime) / 1000}s`, colors.dim);
  
  // Output warning about type errors
  log('\n⚠️  WARNING: Build completed with type errors. These should be fixed.', colors.yellow);
  log('   Run "npm run typecheck" to see remaining errors.\n', colors.yellow);
  
  process.exit(0);
}

// All build attempts failed
log('💥 ALL BUILD ATTEMPTS FAILED!', colors.red + colors.bright);
log(`⏱️  Failed after ${(Date.now() - startTime) / 1000}s`, colors.dim);
log('\nSuggestions:', colors.yellow);
log('1. Fix the most critical TypeScript errors', colors.reset);
log('2. Run "npm run typecheck" to see all errors', colors.reset);
log('3. Try manual build with specific flags: npx tsc --noEmit to analyze errors', colors.reset);

process.exit(1);