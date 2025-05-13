/**
 * Shared utilities for TypeScript fixer scripts
 */
import * as ts from 'typescript';
import * as fsPromises from 'fs/promises';
import { glob } from 'glob';
import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// ANSI color codes for terminal output
export const colors = {
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

/**
 * Logger utility with colored output
 */
export const logger = {
  info: (message: string) => console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  warning: (message: string) => console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`),
  error: (message: string) => console.log(`${colors.red}❌ ${message}${colors.reset}`),
  title: (message: string) => console.log(`\n${colors.blue}${colors.bright}${message}${colors.reset}\n`),
  dim: (message: string) => console.log(`${colors.dim}${message}${colors.reset}`),
  verbose: (message: string, isVerbose: boolean) => {
    if (isVerbose) {
      console.log(`${colors.dim}${message}${colors.reset}`);
    }
  }
};

/**
 * Initializes a TypeScript project for analysis and modification
 */
export function initProject(includePaths: string[] = ['src/**/*.ts']) {
  const project = new Project({
    tsConfigFilePath: resolve(rootDir, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  // Add source files to the project
  const fullPaths = includePaths.map(path => resolve(rootDir, path));
  const sourceFiles = project.addSourceFilesAtPaths(fullPaths);
  
  logger.info(`Loaded ${sourceFiles.length} TypeScript files for analysis`);
  
  return { project, sourceFiles };
}

/**
 * Parse command line arguments
 */
export function parseArgs(args: string[]) {
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    help: args.includes('--help'),
    files: [] as string[],
  };

  // Extract file paths from arguments
  for (const arg of args) {
    if (!arg.startsWith('--') && arg.endsWith('.ts')) {
      options.files.push(arg);
    }
  }

  return options;
}

/**
 * Count TypeScript errors in the project
 */
export async function countTsErrors(): Promise<number> {
  // Use tsc to get error count
  const { exec } = await import('child_process');

  return new Promise((resolve, reject) => {
    exec('npx tsc --noEmit | grep -c "error TS"', (error, stdout, stderr) => {
      if (error && error.code !== 1) {
        // Error code 1 is expected when grep finds no matches
        reject(error);
        return;
      }

      const count = parseInt(stdout.trim(), 10) || 0;
      resolve(count);
    });
  });
}

/**
 * Find call expressions to a specific function in a source file
 */
export function findCallExpressions(sourceFile: SourceFile, functionNamePatterns: string[]): Node[] {
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  return callExpressions.filter(callExpr => {
    const expression = callExpr.getExpression().getText();
    return functionNamePatterns.some(pattern => expression.includes(pattern));
  });
}

/**
 * Find string literals in a source file
 */
export function findStringLiterals(sourceFile: SourceFile): Node[] {
  return sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
}

/**
 * Save changes to a file with dry-run support
 */
export function saveChanges(sourceFile: SourceFile, dryRun: boolean): boolean {
  if (dryRun) {
    logger.warning(`[DRY RUN] Would save changes to: ${sourceFile.getFilePath()}`);
    return false;
  } else {
    sourceFile.saveSync();
    return true;
  }
}

/**
 * Print script usage information
 */
export function printUsage(scriptName: string, description: string, options: string[] = []) {
  logger.title(`${scriptName} - TypeScript Fixer`);
  console.log(`${description}\n`);
  
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log(`  npx tsx ${scriptName} [options] [files]\n`);
  
  console.log(`${colors.bright}Options:${colors.reset}`);
  console.log(`  --dry-run     Show changes without applying them`);
  console.log(`  --verbose     Show detailed diagnostic information`);
  console.log(`  --help        Show this help message\n`);
  
  if (options.length > 0) {
    for (const option of options) {
      console.log(`  ${option}`);
    }
    console.log('');
  }
  
  console.log(`${colors.bright}Examples:${colors.reset}`);
  console.log(`  npx tsx ${scriptName} --dry-run`);
  console.log(`  npx tsx ${scriptName} src/cli/commands/add/add-command.ts`);
  console.log(`  npx tsx ${scriptName} --verbose\n`);
}

/**
 * Run a fixer script and report results
 */
export async function runFixer(
  scriptName: string,
  description: string,
  fixerFn: (options: ReturnType<typeof parseArgs>) => Promise<number>,
  options: ReturnType<typeof parseArgs>
) {
  if (options.help) {
    printUsage(scriptName, description);
    process.exit(0);
  }

  logger.title(`Running ${scriptName}`);
  logger.info(`Mode: ${options.dryRun ? 'Dry Run (no changes will be applied)' : 'Live Run (changes will be applied)'}`);

  try {
    // Count errors before
    logger.info('Counting TypeScript errors before fixes...');
    const beforeCount = await countTsErrors();
    logger.info(`Initial error count: ${beforeCount}`);

    // Run the fixer
    const startTime = Date.now();
    const fixedCount = await fixerFn(options);
    const endTime = Date.now();

    // Report results
    logger.success(`Fixed ${fixedCount} issues in ${(endTime - startTime) / 1000}s`);

    // Count errors after, if not in dry run mode
    if (!options.dryRun) {
      logger.info('Counting TypeScript errors after fixes...');
      const afterCount = await countTsErrors();
      logger.info(`Final error count: ${afterCount}`);
      logger.success(`Reduced errors by: ${beforeCount - afterCount}`);
    }

    return fixedCount;
  } catch (error) {
    logger.error(`Error running ${scriptName}: ${error}`);
    return 0;
  }
}

/**
 * Find files matching a pattern and containing specific content
 */
export async function findFilesWithPattern(
  basePath: string,
  pattern: string,
  contentRegex?: RegExp
): Promise<string[]> {
  try {
    // Find files matching the pattern
    const files = await glob(pattern, { cwd: basePath, absolute: true });

    // If no content regex, return all matching files
    if (!contentRegex) {
      return files;
    }

    // Filter files by content
    const matchingFiles: string[] = [];

    for (const file of files) {
      try {
        const content = await fsPromises.readFile(file, 'utf-8');
        if (contentRegex.test(content)) {
          matchingFiles.push(file);
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }

    return matchingFiles;
  } catch (error) {
    console.error('Error finding files:', error);
    return [];
  }
}

/**
 * Apply a TypeScript transformation to a file
 */
export async function applyTransformation(
  filePath: string,
  transformerFactory: (sourceFile: ts.SourceFile) => ts.TransformerFactory<ts.SourceFile>
): Promise<boolean> {
  try {
    // Read the file
    const content = await fsPromises.readFile(filePath, 'utf-8');

    // Parse the file
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    // Apply the transformation
    const result = ts.transform(
      sourceFile,
      [transformerFactory(sourceFile)]
    );

    // Get the transformed source file
    const transformedSourceFile = result.transformed[0];

    // Convert back to string
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed
    });

    const transformedContent = printer.printNode(
      ts.EmitHint.Unspecified,
      transformedSourceFile,
      sourceFile
    );

    // If the content didn't change, return false
    if (content === transformedContent) {
      return false;
    }

    // Write the transformed file
    await fsPromises.writeFile(filePath, transformedContent);

    return true;
  } catch (error) {
    console.error(`Error applying transformation to ${filePath}:`, error);
    return false;
  }
}