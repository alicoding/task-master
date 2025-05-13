#!/usr/bin/env node

/**
 * Quick transpile-only build script for rapid development
 * Builds the project without type checking
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
${colors.cyan}${colors.bold}TypeScript Transpile-Only Build${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
${colors.yellow}Mode:${colors.reset} Quick build (no type checking)
`);

// Start time tracking
const startTime = Date.now();

try {
  // Run tsc with transpileOnly flag
  console.log(`${colors.blue}Transpiling TypeScript files...${colors.reset}`);
  
  execSync('tsc --project tsconfig.build.json --skipLibCheck --skipDefaultLibCheck --noEmit false --transpileOnly', {
    stdio: 'inherit'
  });
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.log(`\n${colors.green}${colors.bold}Build completed successfully in ${duration}s!${colors.reset}`);
} catch (error) {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  console.error(`\n${colors.red}${colors.bold}Build failed after ${duration}s!${colors.reset}`);
  process.exit(1);
}