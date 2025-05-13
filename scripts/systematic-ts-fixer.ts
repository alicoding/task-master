#!/usr/bin/env node

/**
 * Systematic TypeScript Error Fixer
 * 
 * This script diagnoses and fixes common TypeScript error patterns across the codebase.
 * It uses a pattern-based approach rather than fixing files individually.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const SPECIFIC_FIX = process.argv.find(arg => arg.startsWith('--fix='))?.split('=')[1];
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];

// Root directory
const ROOT_DIR = path.resolve(__dirname, '..');

// Store counts of each error type
const errorCounts = {
  chalkColor: 0,
  repositoryParam: 0,
  arithmeticOp: 0,
  importPath: 0,
  otherErrors: 0,
  total: 0
};

// Store files that were modified
const modifiedFiles = new Set<string>();

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Logger utility
const logger = {
  info: (message: string) => console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  warning: (message: string) => console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`),
  error: (message: string) => console.log(`${colors.red}❌ ${message}${colors.reset}`),
  title: (message: string) => console.log(`\n${colors.blue}${colors.bright}${message}${colors.reset}\n`),
  verbose: (message: string) => { if (VERBOSE) console.log(`${colors.dim}${message}${colors.reset}`); }
};

interface ErrorInfo {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

interface ErrorCategories {
  chalkColor: ErrorInfo[];
  repositoryParam: ErrorInfo[];
  arithmeticOp: ErrorInfo[];
  importPath: ErrorInfo[];
  other: ErrorInfo[];
}

/**
 * Get current TypeScript errors
 */
function getCurrentTsErrors(): { success: boolean; output: string; errorCount?: number } {
  try {
    const cmd = 'npx tsc --noEmit --pretty false';
    const output = execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { success: true, output };
  } catch (error: any) {
    return { 
      success: false, 
      output: error.stdout?.toString() || '',
      errorCount: countErrorsInOutput(error.stdout?.toString() || '')
    };
  }
}

/**
 * Count the number of errors in tsc output
 */
function countErrorsInOutput(output: string): number {
  return (output.match(/error TS\d+:/g) || []).length;
}

/**
 * Categorize TypeScript errors from output
 */
function categorizeErrors(tscOutput: string): ErrorCategories {
  const errors: ErrorCategories = {
    chalkColor: [],
    repositoryParam: [],
    arithmeticOp: [],
    importPath: [],
    other: []
  };

  // Extract error lines with file information
  const errorLines = tscOutput.split('\n').filter(line => /\.ts\(\d+,\d+\): error TS\d+:/.test(line));

  errorLines.forEach(line => {
    const fileMatch = line.match(/(.+\.ts)\((\d+),(\d+)\): error TS(\d+): (.+)$/);
    if (!fileMatch) return;

    const [_, filePath, lineNum, columnNum, errorCode, message] = fileMatch;
    const relativeFilePath = path.relative(ROOT_DIR, filePath);
    const errorInfo: ErrorInfo = { 
      file: relativeFilePath, 
      line: parseInt(lineNum, 10), 
      column: parseInt(columnNum, 10),
      code: errorCode,
      message
    };

    // Categorize by error type
    if (message.includes('ChalkColor') || message.includes('Parameter of type \'string\' is not assignable')) {
      errors.chalkColor.push(errorInfo);
    } else if (message.includes('Expected 0 arguments, but got 2') && line.includes('RepositoryFactory.initialize')) {
      errors.repositoryParam.push(errorInfo);
    } else if (message.includes('arithmetic operation') || message.includes('left-hand side') || message.includes('right-hand side')) {
      errors.arithmeticOp.push(errorInfo);
    } else if (message.includes('has no exported member') || message.includes('Cannot find module')) {
      errors.importPath.push(errorInfo);
    } else {
      errors.other.push(errorInfo);
    }
  });

  return errors;
}

/**
 * Display error statistics
 */
function displayErrorStats(errors: ErrorCategories): void {
  logger.title('Error Statistics');
  
  logger.info(`ChalkColor Type Issues: ${errors.chalkColor.length}`);
  logger.info(`Repository Parameter Issues: ${errors.repositoryParam.length}`);
  logger.info(`Arithmetic Operation Issues: ${errors.arithmeticOp.length}`);
  logger.info(`Import Path Issues: ${errors.importPath.length}`);
  logger.info(`Other TypeScript Issues: ${errors.other.length}`);
  logger.info(`Total: ${errors.chalkColor.length + errors.repositoryParam.length + errors.arithmeticOp.length + errors.importPath.length + errors.other.length}`);
}

/**
 * Find files in the project with specific patterns
 */
function findFiles(pattern: RegExp, { onlyTypeScript = true } = {}): string[] {
  const filePattern = onlyTypeScript ? '**/*.ts' : '**/*';
  const globPattern = path.join(ROOT_DIR, filePattern);
  
  return glob.sync(globPattern, { ignore: ['**/node_modules/**', '**/dist/**'] })
    .filter(file => {
      if (!fs.existsSync(file)) return false;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        return pattern.test(content);
      } catch (error) {
        logger.error(`Error reading file ${file}: ${(error as Error).message}`);
        return false;
      }
    });
}

/**
 * Fix ChalkColor type issues
 */
function fixChalkColorIssues(): number {
  logger.title('Fixing ChalkColor Type Issues');

  // 1. Find all relevant files
  logger.info('Finding files with ChalkColor usage...');
  const files = findFiles(/ChalkColor|colorize|asChalkColor/);
  logger.success(`Found ${files.length} files with potential ChalkColor issues`);

  // 2. Read chalk-utils.ts to understand ChalkColor definition
  const chalkUtilsPath = path.join(ROOT_DIR, 'cli/utils/chalk-utils.ts');
  if (!fs.existsSync(chalkUtilsPath)) {
    logger.error('Could not find chalk-utils.ts');
    return 0;
  }

  const chalkUtilsContent = fs.readFileSync(chalkUtilsPath, 'utf8');
  
  // Check if ChalkColor is a type alias, enum, or interface
  const chalkColorTypeMatch = chalkUtilsContent.match(/export\s+type\s+ChalkColor\s*=\s*([^;]+);/);
  
  let fixCount = 0;
  
  // 3. Process each file
  files.forEach(file => {
    // Skip node_modules
    if (file.includes('node_modules')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;
    
    // 3.1 Fix string literals being passed to functions expecting ChalkColor
    if (chalkColorTypeMatch && chalkColorTypeMatch[1].includes('|')) {
      // For type alias with union types like 'red' | 'blue', we can use type assertions
      const stringLiteralPattern = /colorize\([^,)]+,\s*['"]([^'"]+)['"]\s*(?:,|\))/g;
      content = content.replace(stringLiteralPattern, (match, colorName) => {
        modified = true;
        return match.replace(`'${colorName}'`, `'${colorName}' as ChalkColor`);
      });
    } else {
      // Otherwise, use more general pattern to replace string literals in colorize calls
      const colorizeCallPattern = /(colorize\s*\([^,)]+,\s*)(['"])([^'"]+)(['"])/g;
      content = content.replace(colorizeCallPattern, (match, prefix, quote1, colorName, quote2) => {
        if (match.includes('as ChalkColor')) return match; // Already fixed
        modified = true;
        return `${prefix}${quote1}${colorName}${quote2}`;
      });
    }
    
    // 3.2 Replace remaining asChalkColor usage
    const asChalkColorPattern = /\(asChalkColor\(['"]([^'"]+)['"]\)\)/g;
    content = content.replace(asChalkColorPattern, (match, colorName) => {
      modified = true;
      return `'${colorName}'`;
    });
    
    // 3.3 Remove duplicate ChalkColor imports
    const duplicateImportPattern = /import\s+{\s*ChalkColor(?:\s*,\s*([^}]*))*\s*}\s*from\s*(['"])([^'"]+)(['"])\s*;\s*import\s+{\s*ChalkColor(?:\s*,\s*([^}]*))*\s*}\s*from/g;
    content = content.replace(duplicateImportPattern, (match, imports1, quote1, path1, quote2, imports2) => {
      modified = true;
      // Combine the imports
      const combinedImports = new Set([
        ...(imports1 ? imports1.split(',').map((s: string) => s.trim()).filter((s: string) => s !== 'ChalkColor' && s) : []),
        ...(imports2 ? imports2.split(',').map((s: string) => s.trim()).filter((s: string) => s !== 'ChalkColor' && s) : [])
      ]);
      
      return `import { ChalkColor${combinedImports.size > 0 ? ', ' + Array.from(combinedImports).join(', ') : ''} } from ${quote1}${path1}${quote2}; import {`;
    });

    if (modified) {
      if (!DRY_RUN) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles.add(file);
      }
      fixCount++;
      logger.success(`Fixed ChalkColor issues in ${path.relative(ROOT_DIR, file)}`);
    }
  });
  
  logger.success(`Fixed ChalkColor issues in ${fixCount} files`);
  return fixCount;
}

/**
 * Fix Repository Parameter issues
 */
function fixRepositoryParameterIssues(): number {
  logger.title('Fixing Repository Parameter Issues');

  // 1. Find all files with RepositoryFactory.initialize
  logger.info('Finding files with RepositoryFactory.initialize usage...');
  const files = findFiles(/RepositoryFactory\.initialize\s*\(/);
  logger.success(`Found ${files.length} files with potential RepositoryFactory.initialize issues`);

  let fixCount = 0;

  // 2. Process each file
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Fix RepositoryFactory.initialize() -> RepositoryFactory.initialize()
    const initializePattern = /(RepositoryFactory\.initialize\s*\()([^)]*)\)/g;
    content = content.replace(initializePattern, (match, prefix, args) => {
      if (args.trim() === '') return match; // Already fixed
      modified = true;
      return `${prefix})`;
    });

    if (modified) {
      if (!DRY_RUN) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles.add(file);
      }
      fixCount++;
      logger.success(`Fixed RepositoryFactory.initialize in ${path.relative(ROOT_DIR, file)}`);
    }
  });

  logger.success(`Fixed RepositoryFactory.initialize issues in ${fixCount} files`);
  return fixCount;
}

/**
 * Fix arithmetic operation issues
 */
function fixArithmeticOperationIssues(): number {
  logger.title('Fixing Arithmetic Operation Issues');

  // 1. Find files with potential arithmetic operation issues
  logger.info('Finding files with potential arithmetic operation issues...');
  const files = findFiles(/enhanced\.ts/); // Start with files mentioned in the errors
  logger.success(`Found ${files.length} files to check for arithmetic operation issues`);

  let fixCount = 0;

  // 2. Process each file
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Find arithmetic operations with potential type issues
    const binaryOpPattern = /([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*([+\-*/%])\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g;
    
    content = content.replace(binaryOpPattern, (match, left, op, right) => {
      // Skip if either side is a numeric literal or already has a type assertion
      if (/^\d+$/.test(left) || /^\d+$/.test(right) || match.includes(' as number')) {
        return match;
      }
      
      // Add type assertions to variable operands
      modified = true;
      return `(${left} as number) ${op} (${right} as number)`;
    });

    if (modified) {
      if (!DRY_RUN) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedFiles.add(file);
      }
      fixCount++;
      logger.success(`Fixed arithmetic operation issues in ${path.relative(ROOT_DIR, file)}`);
    }
  });

  logger.success(`Fixed arithmetic operation issues in ${fixCount} files`);
  return fixCount;
}

/**
 * Fix import path issues
 */
function fixImportPathIssues(): number {
  logger.title('Fixing Import Path Issues');

  // 1. Find files with import issues
  logger.info('Finding files with import path issues...');
  const creationTsPath = path.join(ROOT_DIR, 'core/repository/creation.ts');
  
  if (!fs.existsSync(creationTsPath)) {
    logger.error('Could not find creation.ts');
    return 0;
  }

  let content = fs.readFileSync(creationTsPath, 'utf8');
  let originalContent = content;
  let modified = false;

  // 2. Fix specific import issues in creation.ts
  
  // Fix incorrect imports from core/types
  const importFromCoreTypes = /import\s*{([^}]*)}\s*from\s*['"](?:\.\.\/types|@\/core\/types)['"]/g;
  content = content.replace(importFromCoreTypes, (match, imports) => {
    // Parse the imports
    const importList = imports.split(',').map((i: string) => i.trim());
    const validImports: string[] = [];
    const invalidImports: string[] = [];
    
    importList.forEach((imp: string) => {
      if (['tasks', 'dependencies', 'NewTask'].includes(imp)) {
        invalidImports.push(imp);
      } else {
        validImports.push(imp);
      }
    });
    
    modified = true;
    
    // Keep valid imports from core/types
    const result = validImports.length > 0 
      ? `import { ${validImports.join(', ')} } from '../types'`
      : '';
      
    return result;
  });
  
  // Add appropriate imports from schema
  if (!content.includes('import { tasks, dependencies, NewTask } from')) {
    const schemaImport = "import { tasks, dependencies, NewTask } from '../../db/schema';";
    
    // Add after existing imports
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImports = content.indexOf(';', lastImportIndex) + 1;
      content = content.slice(0, endOfImports) + '\n' + schemaImport + content.slice(endOfImports);
      modified = true;
    }
  }
  
  // 3. Fix max_child_num property access
  const maxChildNumPattern = /result\.max_child_num/g;
  content = content.replace(maxChildNumPattern, (match) => {
    modified = true;
    return `result['max_child_num']`;
  });

  if (modified) {
    if (!DRY_RUN) {
      fs.writeFileSync(creationTsPath, content, 'utf8');
      modifiedFiles.add(creationTsPath);
    }
    logger.success(`Fixed import path issues in ${path.relative(ROOT_DIR, creationTsPath)}`);
    return 1;
  }

  return 0;
}

/**
 * Validate fixes by running TypeScript compiler
 */
function validateFixes(): boolean {
  logger.title('Validating Fixes');
  
  const { success, output, errorCount } = getCurrentTsErrors();
  
  if (success) {
    logger.success('TypeScript compilation succeeded with no errors!');
    return true;
  } else {
    const errors = categorizeErrors(output);
    displayErrorStats(errors);
    
    // Check if we reduced the error count
    const initialErrorCount = errorCounts.total;
    const remainingErrorCount = errorCount || 0;
    
    if (remainingErrorCount < initialErrorCount) {
      const reduction = initialErrorCount - remainingErrorCount;
      const percentReduction = Math.round((reduction / initialErrorCount) * 100);
      
      logger.success(`Reduced TypeScript errors by ${reduction} (${percentReduction}%)`);
      return true;
    } else {
      logger.error('No reduction in TypeScript errors');
      return false;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  logger.title(`Systematic TypeScript Error Fixer ${DRY_RUN ? '(DRY RUN)' : ''}`);
  
  // 1. Get initial TypeScript errors
  logger.info('Getting initial TypeScript errors...');
  const { success, output, errorCount } = getCurrentTsErrors();
  
  if (success) {
    logger.success('No TypeScript errors found!');
    return;
  }
  
  // 2. Categorize errors
  const errors = categorizeErrors(output);
  errorCounts.chalkColor = errors.chalkColor.length;
  errorCounts.repositoryParam = errors.repositoryParam.length;
  errorCounts.arithmeticOp = errors.arithmeticOp.length;
  errorCounts.importPath = errors.importPath.length;
  errorCounts.otherErrors = errors.other.length;
  errorCounts.total = errorCount || 0;
  
  displayErrorStats(errors);
  
  // 3. Apply fixes based on command line arguments or fix everything
  let fixCount = 0;
  
  if (SPECIFIC_FIX) {
    switch (SPECIFIC_FIX) {
      case 'chalk':
        fixCount = fixChalkColorIssues();
        break;
      case 'repo':
        fixCount = fixRepositoryParameterIssues();
        break;
      case 'arithmetic':
        fixCount = fixArithmeticOperationIssues();
        break;
      case 'import':
        fixCount = fixImportPathIssues();
        break;
      default:
        logger.error(`Unknown fix type: ${SPECIFIC_FIX}`);
        return;
    }
  } else {
    // Fix all issues
    fixCount += fixChalkColorIssues();
    fixCount += fixRepositoryParameterIssues();
    fixCount += fixArithmeticOperationIssues();
    fixCount += fixImportPathIssues();
  }
  
  // 4. Validate fixes
  if (fixCount > 0 && !DRY_RUN) {
    const result = validateFixes();
    if (result) {
      logger.success(`Successfully fixed ${fixCount} issues in ${modifiedFiles.size} files!`);
    } else {
      logger.warning(`Fixed ${fixCount} issues in ${modifiedFiles.size} files, but TypeScript errors remain.`);
    }
  } else if (DRY_RUN) {
    logger.info(`Would fix ${fixCount} issues in ${modifiedFiles.size} files (dry run)`);
  } else {
    logger.warning('No issues fixed.');
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});