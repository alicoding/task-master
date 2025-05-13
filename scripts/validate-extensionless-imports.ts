#!/usr/bin/env tsx
/**
 * Import Extension Validator
 * 
 * This script validates that all imports in TypeScript files do NOT use 
 * file extensions. It can be used as a pre-commit hook or in CI/CD.
 * 
 * Run with:
 *   npx tsx scripts/validate-extensionless-imports.ts
 * 
 * If any imports with extensions are detected, it will exit with code 1.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

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

// Files to exclude from validation
const EXCLUDE_FILES = [
  'node-loaders.mjs',
  'fix-js-imports.ts',
  'fix-js-to-ts-imports.ts',
  'fix-ts-to-js-imports.ts',
  'remove-import-extensions.ts'
];

// Path patterns to exclude
const EXCLUDE_PATHS = [
  'node_modules',
  'dist'
];

/**
 * Main validation function
 */
async function main() {
  console.log(`
${colors.cyan}${colors.bold}Extensionless Import Validator${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
Checking for file extensions in import statements...
`);

  // Find all TypeScript files
  const tsFiles = await glob('**/*.ts', { 
    ignore: EXCLUDE_PATHS.map(p => `**/${p}/**`) 
  });

  // Regex to find imports with extensions
  // This captures from/import/export statements with .ts, .js, .mjs, or .cjs extensions
  const extensionImportRegex = /(?:from\s+['"]|import\s*\(\s*['"@]|require\s*\(\s*['"]|export\s+(?:\*|{[^}]*})\s+from\s+['"])([^'"]+\.(ts|js|mjs|cjs))(?:['"])/g;
  
  let invalidFilesCount = 0;
  const invalidFiles = [];

  // Check each file
  for (const file of tsFiles) {
    // Skip excluded files
    if (EXCLUDE_FILES.some(exclude => file.endsWith(exclude))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(extensionImportRegex)]
      .filter(match => {
        // Filter out node: imports and node_modules
        const importPath = match[1];
        return !importPath.startsWith('node:') && !importPath.includes('node_modules');
      });
    
    if (matches.length > 0) {
      invalidFilesCount++;
      invalidFiles.push({
        file,
        imports: matches.map(match => match[1])
      });
    }
  }

  // Report results
  if (invalidFilesCount === 0) {
    console.log(`${colors.green}${colors.bold}✓ No imports with extensions detected!${colors.reset}`);
    console.log(`${colors.gray}Scanned ${tsFiles.length} files.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Found ${invalidFilesCount} files with extension imports:${colors.reset}\n`);
    
    for (const { file, imports } of invalidFiles) {
      console.log(`${colors.cyan}${file}:${colors.reset}`);
      for (const importPath of imports) {
        console.log(`  ${colors.yellow}→${colors.reset} ${importPath}`);
      }
      console.log('');
    }
    
    console.log(`${colors.magenta}${colors.bold}How to fix:${colors.reset}`);
    console.log(`Run the extension remover script: ${colors.cyan}npx tsx scripts/remove-import-extensions.ts${colors.reset}`);
    
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});