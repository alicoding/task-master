#!/usr/bin/env tsx
/**
 * Script to fix ChalkColor type issues throughout the codebase
 * 
 * This script:
 * 1. Adds ChalkColor import statements where missing
 * 2. Adds type assertions to string literals passed as colors
 * 3. Makes private colorize methods protected where needed
 */

import { Project, SourceFile, SyntaxKind, StringLiteral, Node } from 'ts-morph';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Output colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logger
const logger = {
  info: (message: string) => console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  warning: (message: string) => console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`),
  error: (message: string) => console.log(`${colors.red}❌ ${message}${colors.reset}`),
  title: (message: string) => console.log(`\n${colors.blue}${colors.bright}${message}${colors.reset}\n`),
};

// Known chalk colors
const CHALK_COLORS = [
  'black', 'red', 'green', 'yellow', 'blue', 
  'magenta', 'cyan', 'white', 'gray', 'grey',
  'blackBright', 'redBright', 'greenBright', 'yellowBright', 
  'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'
];

// Function names that use colors
const COLOR_FUNCTION_PATTERNS = [
  'colorize',
  'chalk.',
  'color(',
  '.log(',
  'console.log('
];

/**
 * Check if a string starts and ends with quotes
 */
function isStringLiteral(str: string): boolean {
  return (str.startsWith("'") && str.endsWith("'")) || 
         (str.startsWith('"') && str.endsWith('"'));
}

/**
 * Check if a string is a chalk color without checking quotes
 */
function isChalkColorValue(text: string): boolean {
  // Remove quotes if present
  const value = text.replace(/^['"]/, '').replace(/['"]$/, '');
  return CHALK_COLORS.includes(value);
}

/**
 * Process a single source file to fix chalk-related issues
 */
function processFile(sourceFile: SourceFile, dryRun: boolean): number {
  let fixCount = 0;
  const filePath = sourceFile.getFilePath();
  const relativePath = path.relative(ROOT_DIR, filePath);
  const content = sourceFile.getFullText();
  
  // Skip if irrelevant files
  const hasColorIssues = content.includes('ChalkColor') ||
                         content.includes('colorize') ||
                         COLOR_FUNCTION_PATTERNS.some(pattern => content.includes(pattern));
  
  if (!hasColorIssues) {
    return 0;
  }
  
  logger.info(`Processing ${relativePath}`);
  
  // 1. Add ChalkColor import if missing but referenced
  if (content.includes('ChalkColor') && !sourceFile.getImportDeclaration(d => 
      d.getModuleSpecifierValue().includes('chalk-utils'))) {
    
    // Add import from chalk-utils
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@/cli/utils/chalk-utils',
      namedImports: [{ name: 'ChalkColor' }]
    });
    
    logger.info(`  Added ChalkColor import`);
    fixCount++;
  }
  
  // 2. Fix private colorize methods
  const classes = sourceFile.getClasses();
  for (const classDecl of classes) {
    const colorizeMethod = classDecl.getProperty('colorize') || classDecl.getMethod('colorize');
    
    if (colorizeMethod && colorizeMethod.hasModifier(SyntaxKind.PrivateKeyword)) {
      // Change private to protected
      colorizeMethod.getFirstDescendantByKind(SyntaxKind.PrivateKeyword)?.replaceWithText('protected');
      
      logger.info(`  Changed private colorize to protected in ${classDecl.getName()}`);
      fixCount++;
    }
  }
  
  // 3. Add ChalkColor type assertions to string literals in methods
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  
  for (const literal of stringLiterals) {
    const text = literal.getText();
    const value = literal.getLiteralValue();
    
    // Skip literals that already have type assertions
    if (literal.getParent()?.getKind() === SyntaxKind.AsExpression) {
      continue;
    }
    
    // Check if this is a color string
    if (CHALK_COLORS.includes(value)) {
      // Check if it's in a function call
      let isInColorFn = false;
      let parent: Node | undefined = literal;
      
      // Traverse up to find a call expression
      while (parent && !isInColorFn) {
        parent = parent.getParent();
        
        if (parent?.getKind() === SyntaxKind.CallExpression) {
          const callExpr = parent.getText();
          isInColorFn = COLOR_FUNCTION_PATTERNS.some(pattern => callExpr.includes(pattern));
        }
      }
      
      if (isInColorFn) {
        // Add type assertion if it's a color in a colorize-like function
        literal.replaceWithText(`(${text} as ChalkColor)`);
        logger.info(`  Added ChalkColor assertion to ${text}`);
        fixCount++;
      }
    }
  }
  
  // 4. Save changes if any fixes were made
  if (fixCount > 0 && !dryRun) {
    sourceFile.saveSync();
  }
  
  return fixCount;
}

/**
 * Process all target files in the project
 */
function processProject(targetGlobs: string[], dryRun: boolean = false): number {
  logger.title('Fixing ChalkColor Type Issues');
  
  // Initialize project
  const project = new Project({
    tsConfigFilePath: path.join(ROOT_DIR, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });
  
  // Add source files to the project
  const fullPaths = targetGlobs.map(pattern => path.join(ROOT_DIR, pattern));
  const sourceFiles = project.addSourceFilesAtPaths(fullPaths);
  
  logger.info(`Found ${sourceFiles.length} files matching patterns: ${targetGlobs.join(', ')}`);
  
  // Process each file
  let totalFixes = 0;
  let fixedFiles = 0;
  
  for (const sourceFile of sourceFiles) {
    const fixes = processFile(sourceFile, dryRun);
    if (fixes > 0) {
      totalFixes += fixes;
      fixedFiles++;
    }
  }
  
  logger.success(`Fixed ${totalFixes} issues in ${fixedFiles} files`);
  return totalFixes;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  // Set target files based on our error analysis - targeting all relevant files
  const targetGlobs = [
    'cli/commands/**/*.ts',      // All command files
    'core/graph/formatters/**/*.ts', // Graph formatters that use colors
    'core/repository/**/*.ts',   // Repository files
    'core/ai/**/*.ts',           // AI providers
    'core/api/**/*.ts',          // API services
    'core/dod/**/*.ts',          // Definition of Done
    'core/nlp/**/*.ts'           // NLP services
  ];
  
  // Run the fixer
  try {
    if (dryRun) {
      logger.info('Running in dry-run mode (no changes will be saved)');
    }
    processProject(targetGlobs, dryRun);
  } catch (error) {
    logger.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();