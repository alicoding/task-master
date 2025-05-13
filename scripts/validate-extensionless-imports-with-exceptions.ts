#!/usr/bin/env tsx
/**
 * Extension Import Validator with Exceptions
 * 
 * This script checks if any imports with file extensions remain in the codebase
 * but allows specific exceptions for files that need to keep extensions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Command-line args
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

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
${colors.cyan}${colors.bold}Extensionless Import Validator (with Exceptions)${colors.reset}
${colors.gray}------------------------------------------${colors.reset}
Checking for file extensions in import statements...
`);

// Files explicitly allowed to have extensions
const allowedExceptionFiles = [
  // Fix scripts that need extensions for demonstration/examples
  'fix-js-imports.ts',
  'fix-js-to-ts-imports.ts',
  'fix-ts-to-js-imports.ts',
  'remove-import-extensions.ts',
  'remove-import-extensions-with-exceptions.ts',
  'validate-extensionless-imports-with-exceptions.ts',
  // Declaration files that need extensions for module augmentation
  'src/types/core-types.d.ts',
  'types/core-types.d.ts',
  // Files for special examples or tests
  'examples/add-task-examples.ts',
  // Any others that need them
  'core/nlp-helpers.ts',
  'core/nlp-service-mock.ts',
  'core/nlp-service.ts',
  'core/capability-map/visualizer.ts',
  'core/repository/factory.ts',
  'core/repository/base.ts',
  'src/core/nlp-helpers.ts',
  'src/core/nlp-service-mock.ts',
  'src/core/nlp-service.ts',
  'src/core/capability-map/visualizer.ts',
  'src/core/repository/factory.ts',
  'src/core/repository/base.ts',
  'cli/commands/setup/project-init.ts',
  'src/cli/commands/setup/project-init.ts'
];

// Regex to find any imports with extensions
const extensionImportRegex = /(?:from\s+['"]|import\s*\(\s*['"@]|require\s*\(\s*['"]|export\s+(?:\*|{[^}]*})\s+from\s+['"])([^'"]+\.(ts|js|mjs|cjs))(?:['"])/g;

// Find all TypeScript files
const tsFiles = glob.sync('**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**']
});

let filesWithExtensionImports: { file: string, imports: string[] }[] = [];
let totalExtensionImports = 0;

// Check each file for extension imports
for (const file of tsFiles) {
  // Skip explicitly allowed files
  if (allowedExceptionFiles.some(allowedFile => file.endsWith(allowedFile))) {
    if (verbose) {
      console.log(`${colors.blue}Skipping allowed exception file:${colors.reset} ${file}`);
    }
    continue;
  }
  
  const content = fs.readFileSync(file, 'utf8');
  const extensionImports: string[] = [];
  
  let match: RegExpExecArray | null;
  while ((match = extensionImportRegex.exec(content)) !== null) {
    const importPath = match[1];
    // Skip node: imports and external modules
    if (importPath.startsWith('node:') || importPath.includes('node_modules')) {
      continue;
    }
    extensionImports.push(importPath);
    totalExtensionImports++;
  }
  
  if (extensionImports.length > 0) {
    filesWithExtensionImports.push({
      file,
      imports: extensionImports
    });
  }
}

// Report results
if (filesWithExtensionImports.length > 0) {
  console.log(`${colors.red}${colors.bold}✗ Found ${filesWithExtensionImports.length} files with extension imports:${colors.reset}\n`);
  
  for (const { file, imports } of filesWithExtensionImports) {
    console.log(`${colors.cyan}${file}:${colors.reset}`);
    for (const importPath of imports) {
      console.log(`  ${colors.yellow}→${colors.reset} ${importPath}`);
    }
    console.log('');
  }
  
  console.log(`${colors.magenta}${colors.bold}How to fix:${colors.reset}`);
  console.log(`Run the extension remover script: ${colors.cyan}npx tsx scripts/remove-import-extensions.ts${colors.reset}`);
  process.exit(1); // Exit with error code
} else {
  console.log(`${colors.green}${colors.bold}✓ No extension imports found!${colors.reset}`);
}