#!/usr/bin/env tsx
/**
 * Script to categorize TypeScript errors in the codebase
 * 
 * This script analyzes all TypeScript errors and groups them by:
 * - Error code
 * - Error message pattern
 * - File location
 * 
 * It produces a structured report that can be used to develop targeted fixing strategies.
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// ANSI color codes for terminal output
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

// Logger utility with colored output
const logger = {
  info: (message: string) => console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`),
  success: (message: string) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  warning: (message: string) => console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`),
  error: (message: string) => console.log(`${colors.red}❌ ${message}${colors.reset}`),
  title: (message: string) => console.log(`\n${colors.blue}${colors.bright}${message}${colors.reset}\n`),
};

// Error categories to help with analysis
interface ErrorCategory {
  code: string;
  description: string;
  pattern: RegExp;
  count: number;
  files: Map<string, number>; // file path -> error count
  examples: string[];
  fixStrategy: string;
}

// Define common error categories
const errorCategories: ErrorCategory[] = [
  {
    code: 'TS2307',
    description: 'Cannot find module or its corresponding type declarations',
    pattern: /Cannot find module/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Fix import paths using @/ path aliases, ensure proper module resolution'
  },
  {
    code: 'TS2322',
    description: 'Type assignment error',
    pattern: /Type '.*' is not assignable to type/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Add type assertions, fix interface implementations'
  },
  {
    code: 'TS2339',
    description: 'Property does not exist on type',
    pattern: /Property '.*' does not exist on type/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Add missing properties to interfaces, use type assertions'
  },
  {
    code: 'TS2345',
    description: 'Argument type error',
    pattern: /Argument of type '.*' is not assignable to parameter of type/,
    count: 0, 
    files: new Map(),
    examples: [],
    fixStrategy: 'Add type assertions to function arguments'
  },
  {
    code: 'TS2304',
    description: 'Cannot find name',
    pattern: /Cannot find name/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Import missing types or declare variables'
  },
  {
    code: 'TS2416',
    description: 'Property not assignable to same property in base type',
    pattern: /Property '.*' in type '.*' is not assignable to the same property in base type/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Fix return types in derived classes to match base class'
  },
  {
    code: 'TS2420',
    description: 'Class incorrectly implements interface',
    pattern: /Class '.*' incorrectly implements interface/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Add missing methods and properties to class'
  },
  {
    code: 'TS2305',
    description: 'Module has no exported member',
    pattern: /Module '.*' has no exported member/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Add missing exports or fix import names'
  },
  {
    code: 'TS2554',
    description: 'Expected X arguments, but got Y',
    pattern: /Expected \d+ arguments, but got \d+/,
    count: 0,
    files: new Map(),
    examples: [],
    fixStrategy: 'Fix function call argument count'
  }
];

// Other category for errors not matching predefined categories
const otherCategory: ErrorCategory = {
  code: 'OTHER',
  description: 'Other TypeScript errors',
  pattern: /.*/,
  count: 0,
  files: new Map(),
  examples: [],
  fixStrategy: 'Review individually'
};

/**
 * Parse error lines from tsc output
 */
function parseErrorLine(line: string): { file: string; code: string; message: string } | null {
  // Match patterns like: file.ts(123,45): error TS2307: Cannot find module...
  const match = line.match(/([^(]+)\((\d+),(\d+)\): error (TS\d+): (.*)/);
  if (!match) return null;
  
  return {
    file: match[1].trim(),
    code: match[4],
    message: match[5]
  };
}

/**
 * Categorize a single error
 */
function categorizeError(error: { file: string; code: string; message: string }): void {
  let matched = false;
  
  for (const category of errorCategories) {
    if (error.code === category.code || category.pattern.test(error.message)) {
      category.count++;
      
      // Track files
      const count = category.files.get(error.file) || 0;
      category.files.set(error.file, count + 1);
      
      // Add example if we don't have many yet
      if (category.examples.length < 5) {
        category.examples.push(`${error.file}: ${error.message}`);
      }
      
      matched = true;
      break;
    }
  }
  
  // If no category matched, put in "other"
  if (!matched) {
    otherCategory.count++;
    const count = otherCategory.files.get(error.file) || 0;
    otherCategory.files.set(error.file, count + 1);
    
    if (otherCategory.examples.length < 5) {
      otherCategory.examples.push(`${error.file}: ${error.message}`);
    }
  }
}

/**
 * Get directories with most errors
 */
function getErrorHotspots(categories: ErrorCategory[]): Map<string, number> {
  const dirCounts = new Map<string, number>();
  
  for (const category of categories) {
    for (const [file, count] of category.files.entries()) {
      // Get directory from file path
      const dirPath = path.dirname(file);
      const currentCount = dirCounts.get(dirPath) || 0;
      dirCounts.set(dirPath, currentCount + count);
    }
  }
  
  // Sort by count
  return new Map([...dirCounts.entries()].sort((a, b) => b[1] - a[1]));
}

/**
 * Generate error report
 */
function generateReport(categories: ErrorCategory[], totalErrors: number): string {
  const allCategories = [...categories, otherCategory].filter(c => c.count > 0);
  allCategories.sort((a, b) => b.count - a.count);
  
  const hotspots = getErrorHotspots(allCategories);
  
  let report = `# TypeScript Error Analysis Report\n\n`;
  report += `Total Errors: ${totalErrors}\n\n`;
  
  report += `## Error Categories\n\n`;
  for (const category of allCategories) {
    const percentage = ((category.count / totalErrors) * 100).toFixed(1);
    report += `### ${category.code}: ${category.description}\n`;
    report += `- Count: ${category.count} (${percentage}%)\n`;
    report += `- Fix Strategy: ${category.fixStrategy}\n`;
    report += `- Examples:\n`;
    
    for (const example of category.examples) {
      report += `  - \`${example}\`\n`;
    }
    
    report += `\n`;
  }
  
  report += `## Error Hotspots\n\n`;
  let i = 0;
  for (const [dir, count] of hotspots.entries()) {
    if (i++ >= 10) break; // Show top 10 directories
    const percentage = ((count / totalErrors) * 100).toFixed(1);
    report += `- \`${dir}\`: ${count} errors (${percentage}%)\n`;
  }
  
  report += `\n## Fix Priority\n\n`;
  report += `1. Foundation types in core/types.ts and db/schema.ts\n`;
  report += `2. Repository interface implementations\n`;
  report += `3. Module resolution issues\n`;
  report += `4. String literal type assertions\n`;
  report += `5. Other property and method errors\n`;
  
  return report;
}

/**
 * Main function to categorize TypeScript errors
 */
async function categorizeTypeScriptErrors(): Promise<void> {
  logger.title('TypeScript Error Categorization');
  
  return new Promise((resolve, reject) => {
    logger.info('Running TypeScript compiler to collect errors...');
    
    exec('npx tsc --noEmit --pretty false', { cwd: rootDir }, (error, stdout, stderr) => {
      if (stderr) {
        logger.error(`Compilation stderr: ${stderr}`);
      }
      
      const errorLines = stdout.split('\n').filter(line => line.includes('error TS'));
      const totalErrors = errorLines.length;
      
      logger.info(`Found ${totalErrors} TypeScript errors`);
      
      // Parse and categorize each error
      for (const line of errorLines) {
        const error = parseErrorLine(line);
        if (error) {
          categorizeError(error);
        }
      }
      
      // Generate and save report
      const report = generateReport([...errorCategories], totalErrors);
      const reportPath = path.join(rootDir, 'typescript-errors.md');
      
      fs.writeFileSync(reportPath, report, 'utf8');
      logger.success(`Error categorization report saved to ${reportPath}`);
      
      resolve();
    });
  });
}

// Run the script
categorizeTypeScriptErrors().catch(error => {
  logger.error(`Error running script: ${error}`);
  process.exit(1);
});