#!/usr/bin/env tsx
/**
 * TypeScript Import Validator
 * 
 * This script validates that all imports in TypeScript files use .ts extensions
 * and not .js extensions. It can be used as a pre-commit hook or in CI/CD.
 * 
 * Run with:
 *   npx tsx scripts/validate-ts-imports.ts
 * 
 * If any .js imports are detected, it will exit with code 1.
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
  'fix-js-imports.ts',
  'fix-js-to-ts-imports.ts',
  'fix-ts-to-js-imports.ts'
];

async function main() {
  console.log(`
${colors.cyan}${colors.bold}TypeScript Import Validator${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
Checking for .js extensions in TypeScript imports...
`);

  // Find all TypeScript files
  const tsFiles = await glob('**/*.ts', { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] 
  });

  // Regex to find .js imports
  const jsImportRegex = /(?:from\s+['"]|import\s*\(\s*['"@]|require\s*\(\s*['"]|export\s+(?:\*|{[^}]*})\s+from\s+['"])([^'"]+\.js)(?:['"])/g;
  
  let invalidFilesCount = 0;
  const invalidFiles = [];

  // Check each file
  for (const file of tsFiles) {
    // Skip excluded files
    if (EXCLUDE_FILES.some(exclude => file.endsWith(exclude))) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(jsImportRegex)];
    
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
    console.log(`${colors.green}${colors.bold}✓ No .js imports detected!${colors.reset}`);
    console.log(`${colors.gray}Scanned ${tsFiles.length} files.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}✗ Found ${invalidFilesCount} files with .js imports:${colors.reset}\n`);
    
    for (const { file, imports } of invalidFiles) {
      console.log(`${colors.cyan}${file}:${colors.reset}`);
      for (const importPath of imports) {
        console.log(`  ${colors.yellow}→${colors.reset} ${importPath}`);
      }
      console.log('');
    }
    
    console.log(`${colors.magenta}${colors.bold}How to fix:${colors.reset}`);
    console.log(`Run the import fixer script: ${colors.cyan}npx tsx fix-js-imports.ts${colors.reset}`);
    
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});