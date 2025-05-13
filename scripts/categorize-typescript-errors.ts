#!/usr/bin/env tsx
/**
 * TypeScript Error Categorization Tool
 * 
 * This script runs the TypeScript compiler in noEmit mode to collect errors,
 * then categorizes them by type, severity, and file location.
 */

import { ChalkColor } from '@/cli/utils/chalk-utils';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for prettier output
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

// Error categories
const errorCategories = {
  'moduleNotFound': { 
    patterns: [/Cannot find module|Module .* has no exported member/], 
    severity: 'critical',
    description: 'Module or export not found'
  },
  'typeAnnotation': { 
    patterns: [/Parameter .* implicitly has an .* type/], 
    severity: 'medium',
    description: 'Missing type annotations'
  },
  'typeCompatibility': { 
    patterns: [/Type .* is not assignable to type/], 
    severity: 'high',
    description: 'Type compatibility issues'
  },
  'nullUndefined': { 
    patterns: [/Object is possibly 'undefined'|Object is possibly 'null'|.* is possibly 'undefined'|.* is possibly 'null'/], 
    severity: 'medium',
    description: 'Null/undefined checks needed'
  },
  'missingProperties': { 
    patterns: [/Property .* does not exist on type/], 
    severity: 'high',
    description: 'Missing property on type'
  },
  'functionSignature': { 
    patterns: [/Expected \d+ arguments, but got \d+/], 
    severity: 'high',
    description: 'Function signature mismatch'
  },
  'syntaxError': { 
    patterns: [/Duplicate identifier|',' expected/], 
    severity: 'critical',
    description: 'Syntax errors'
  },
  'interfaceImplementation': { 
    patterns: [/Class .* incorrectly implements interface/], 
    severity: 'high',
    description: 'Interface implementation issues'
  },
  'importErrors': { 
    patterns: [/File .* is not a module|Cannot find name/], 
    severity: 'critical',
    description: 'Import errors'
  },
  'schemaErrors': { 
    patterns: [/no exported member named 'Task'|no exported member named 'Dependency'/], 
    severity: 'critical',
    description: 'Schema-related errors'
  },
  'otherErrors': { 
    patterns: [/.*/], 
    severity: 'medium',
    description: 'Other errors'
  }
};

// File path categorization
const fileCategoryPatterns = {
  'core': /\/core\//,
  'cli': /\/cli\//,
  'db': /\/db\//,
  'scripts': /\/scripts\//,
  'test': /\/test\//,
};

interface ErrorInfo {
  message: string;
  filePath: string;
  line: number;
  column: number;
  code: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  fileCategory: string;
}

// Statistics 
const stats = {
  totalErrors: 0,
  errorsByCategory: {} as Record<string, number>,
  errorsByFile: {} as Record<string, number>,
  errorsByFileCategory: {} as Record<string, number>,
  errorsBySeverity: {} as Record<string, number>,
  filesWithErrors: new Set<string>(),
};

/**
 * Run TypeScript compiler and capture error output
 */
function runTypeScript(): string {
  console.log(`${colors.blue}Running TypeScript compiler in check mode...${colors.reset}`);
  
  const tsc = spawnSync('npx', ['tsc', '--noEmit'], { 
    encoding: 'utf-8',
    shell: true
  });
  
  return tsc.stderr || tsc.stdout;
}

/**
 * Parse TypeScript error output into structured error info
 */
function parseErrorOutput(output: string): ErrorInfo[] {
  console.log(`${colors.blue}Parsing TypeScript errors...${colors.reset}`);
  
  const errorLines = output.split('\n');
  const errors: ErrorInfo[] = [];
  
  const errorRegex = /^(.*)\((\d+),(\d+)\):\s+(error\s+TS(\d+)):\s+(.*)$/;
  
  for (const line of errorLines) {
    const match = line.match(errorRegex);
    if (!match) continue;
    
    const [, filePath, lineStr, columnStr, codeWithPrefix, codeOnly, message] = match;
    
    // Determine error category
    let category = 'otherErrors';
    let severity = 'medium' as 'critical' | 'high' | 'medium' | 'low';
    
    for (const [cat, info] of Object.entries(errorCategories)) {
      for (const pattern of info.patterns) {
        if (pattern.test(message)) {
          category = cat;
          severity = info.severity as 'critical' | 'high' | 'medium' | 'low';
          break;
        }
      }
      if (category !== 'otherErrors') break;
    }
    
    // Determine file category
    let fileCategory = 'other';
    for (const [cat, pattern] of Object.entries(fileCategoryPatterns)) {
      if (pattern.test(filePath)) {
        fileCategory = cat;
        break;
      }
    }
    
    errors.push({
      message,
      filePath,
      line: parseInt(lineStr, 10),
      column: parseInt(columnStr, 10),
      code: codeWithPrefix,
      category,
      severity,
      fileCategory,
    });
  }
  
  return errors;
}

/**
 * Calculate error statistics
 */
function calculateStatistics(errors: ErrorInfo[]): void {
  console.log(`${colors.blue}Calculating error statistics...${colors.reset}`);
  
  stats.totalErrors = errors.length;
  
  // Initialize counters
  for (const category of Object.keys(errorCategories)) {
    stats.errorsByCategory[category] = 0;
  }
  
  for (const category of Object.keys(fileCategoryPatterns)) {
    stats.errorsByFileCategory[category] = 0;
  }
  stats.errorsByFileCategory.other = 0;
  
  stats.errorsBySeverity.critical = 0;
  stats.errorsBySeverity.high = 0;
  stats.errorsBySeverity.medium = 0;
  stats.errorsBySeverity.low = 0;
  
  // Count errors
  for (const error of errors) {
    // By category
    stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
    
    // By file
    stats.errorsByFile[error.filePath] = (stats.errorsByFile[error.filePath] || 0) + 1;
    stats.filesWithErrors.add(error.filePath);
    
    // By file category
    stats.errorsByFileCategory[error.fileCategory] = (stats.errorsByFileCategory[error.fileCategory] || 0) + 1;
    
    // By severity
    stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
  }
}

/**
 * Generate error report
 */
function generateErrorReport(errors: ErrorInfo[]): string {
  console.log(`${colors.blue}Generating error report...${colors.reset}`);
  
  let report = `# TypeScript Error Analysis\n\n`;
  
  // Summary
  report += `## Summary\n\n`;
  report += `- Total Errors: ${stats.totalErrors}\n`;
  report += `- Files with Errors: ${stats.filesWithErrors.size}\n\n`;
  
  // Errors by severity
  report += `## Errors by Severity\n\n`;
  report += `| Severity | Count | % of Total |\n`;
  report += `|----------|-------|------------|\n`;
  for (const severity of ['critical', 'high', 'medium', 'low']) {
    const count = stats.errorsBySeverity[severity] || 0;
    const percent = ((count / stats.totalErrors) * 100).toFixed(2);
    report += `| ${severity} | ${count} | ${percent}% |\n`;
  }
  report += `\n`;
  
  // Errors by category
  report += `## Errors by Category\n\n`;
  report += `| Category | Description | Count | Severity | % of Total |\n`;
  report += `|----------|-------------|-------|----------|------------|\n`;
  
  const sortedCategories = Object.entries(stats.errorsByCategory)
    .sort(([, countA], [, countB]) => countB - countA);
  
  for (const [category, count] of sortedCategories) {
    if (count === 0) continue;
    const description = errorCategories[category]?.description || '';
    const severity = errorCategories[category]?.severity || '';
    const percent = ((count / stats.totalErrors) * 100).toFixed(2);
    report += `| ${category} | ${description} | ${count} | ${severity} | ${percent}% |\n`;
  }
  report += `\n`;
  
  // Errors by file category
  report += `## Errors by File Category\n\n`;
  report += `| Category | Count | % of Total |\n`;
  report += `|----------|-------|------------|\n`;
  
  const sortedFileCategories = Object.entries(stats.errorsByFileCategory)
    .sort(([, countA], [, countB]) => countB - countA);
  
  for (const [category, count] of sortedFileCategories) {
    if (count === 0) continue;
    const percent = ((count / stats.totalErrors) * 100).toFixed(2);
    report += `| ${category} | ${count} | ${percent}% |\n`;
  }
  report += `\n`;
  
  // Top files with errors
  report += `## Top 20 Files with Most Errors\n\n`;
  report += `| File | Error Count |\n`;
  report += `|------|-------------|\n`;
  
  const sortedFiles = Object.entries(stats.errorsByFile)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 20);
  
  for (const [file, count] of sortedFiles) {
    const relativePath = path.relative(process.cwd(), file);
    report += `| ${relativePath} | ${count} |\n`;
  }
  report += `\n`;
  
  // Critical errors samples
  report += `## Sample Critical Errors\n\n`;
  
  const criticalErrors = errors.filter(e => e.severity === 'critical').slice(0, 10);
  for (const error of criticalErrors) {
    const relativePath = path.relative(process.cwd(), error.filePath);
    report += `### ${error.category} in ${relativePath}:${error.line}\n\n`;
    report += `\`\`\`\n${error.message}\n\`\`\`\n\n`;
  }
  
  // Most common error patterns
  const errorMessages = errors.map(e => e.message);
  const messageCounts: Record<string, number> = {};
  
  for (const message of errorMessages) {
    messageCounts[message] = (messageCounts[message] || 0) + 1;
  }
  
  report += `## Most Common Error Messages\n\n`;
  report += `| Error Message | Count |\n`;
  report += `|--------------|-------|\n`;
  
  const sortedMessages = Object.entries(messageCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 20);
  
  for (const [message, count] of sortedMessages) {
    const shortMessage = message.length > 100 ? `${message.substring(0, 100)}...` : message;
    report += `| ${shortMessage} | ${count} |\n`;
  }
  
  return report;
}

/**
 * Generate fix recommendations
 */
function generateFixRecommendations(errors: ErrorInfo[]): string {
  console.log(`${colors.blue}Generating fix recommendations...${colors.reset}`);
  
  let recommendations = `# TypeScript Error Fix Recommendations\n\n`;
  
  // Schema errors fixes
  const schemaErrors = errors.filter(e => e.category === 'schemaErrors');
  if (schemaErrors.length > 0) {
    recommendations += `## Schema Errors (${schemaErrors.length} errors)\n\n`;
    recommendations += `These errors occur because of incorrect imports from the database schema.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Update \`src/core/types.ts\` to import from schema correctly:\n\n`;
    recommendations += "```typescript\n";
    recommendations += "import { tasks, dependencies } from '@/db/schema';\n\n";
    recommendations += "// Use type inference for table types\n";
    recommendations += "export type Task = typeof tasks.$inferSelect;\n";
    recommendations += "export type NewTask = typeof tasks.$inferInsert;\n";
    recommendations += "export type Dependency = typeof dependencies.$inferSelect;\n";
    recommendations += "export type NewDependency = typeof dependencies.$inferInsert;\n";
    recommendations += "```\n\n";
  }
  
  // Null/undefined errors
  const nullErrors = errors.filter(e => e.category === 'nullUndefined');
  if (nullErrors.length > 0) {
    recommendations += `## Null/Undefined Errors (${nullErrors.length} errors)\n\n`;
    recommendations += `These errors occur when accessing properties on potentially null/undefined objects.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Use optional chaining: \`task?.tags\` instead of \`task.tags\`\n`;
    recommendations += `2. Use nullish coalescing: \`task.tags ?? []\` to provide default values\n`;
    recommendations += `3. Add null checks: \`if (task.tags) { ... }\`\n\n`;
  }
  
  // Type compatibility errors
  const typeErrors = errors.filter(e => e.category === 'typeCompatibility');
  if (typeErrors.length > 0) {
    recommendations += `## Type Compatibility Errors (${typeErrors.length} errors)\n\n`;
    recommendations += `These errors occur when assigning incompatible types.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Use type assertions when you're confident: \`color as ChalkColor\`\n`;
    recommendations += `2. Create proper type interfaces\n`;
    recommendations += `3. Use generics to make functions and classes more type-safe\n\n`;
  }
  
  // Missing properties errors
  const propertyErrors = errors.filter(e => e.category === 'missingProperties');
  if (propertyErrors.length > 0) {
    recommendations += `## Missing Properties Errors (${propertyErrors.length} errors)\n\n`;
    recommendations += `These errors occur when accessing properties that don't exist on an object.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Update interfaces to include missing properties\n`;
    recommendations += `2. Fix property names (check for typos)\n`;
    recommendations += `3. Use type guards: \`if ('propertyName' in obj) { ... }\`\n\n`;
  }
  
  // Function signature errors
  const functionErrors = errors.filter(e => e.category === 'functionSignature');
  if (functionErrors.length > 0) {
    recommendations += `## Function Signature Errors (${functionErrors.length} errors)\n\n`;
    recommendations += `These errors occur when calling functions with incorrect number of arguments.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Check function documentation to verify required arguments\n`;
    recommendations += `2. Provide default values for optional parameters\n`;
    recommendations += `3. Use function overloads for complex parameter combinations\n\n`;
  }
  
  // Interface implementation errors
  const interfaceErrors = errors.filter(e => e.category === 'interfaceImplementation');
  if (interfaceErrors.length > 0) {
    recommendations += `## Interface Implementation Errors (${interfaceErrors.length} errors)\n\n`;
    recommendations += `These errors occur when classes don't properly implement all interface methods/properties.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Implement all required methods and properties from interfaces\n`;
    recommendations += `2. Fix method signatures to match interface definitions\n`;
    recommendations += `3. Consider using abstract classes instead of interfaces for complex implementations\n\n`;
  }
  
  // Module import errors
  const importErrors = errors.filter(e => e.category === 'moduleNotFound');
  if (importErrors.length > 0) {
    recommendations += `## Module Import Errors (${importErrors.length} errors)\n\n`;
    recommendations += `These errors occur when imported modules or members cannot be found.\n\n`;
    recommendations += `### Solution:\n\n`;
    recommendations += `1. Fix import paths to use correct path aliases (@/ syntax)\n`;
    recommendations += `2. Ensure exported members are properly declared\n`;
    recommendations += `3. Use default exports consistently\n\n`;
  }
  
  // Priority fixes
  recommendations += `## Priority Fixes\n\n`;
  recommendations += `Based on the analysis, fix issues in this order:\n\n`;
  recommendations += `1. Schema-related errors (core/types.ts)\n`;
  recommendations += `2. Module import errors\n`;
  recommendations += `3. Interface implementation errors\n`;
  recommendations += `4. Type compatibility errors\n`;
  recommendations += `5. Missing properties errors\n`;
  recommendations += `6. Null/undefined errors\n`;
  recommendations += `7. Function signature errors\n`;
  recommendations += `8. Missing type annotations\n\n`;
  
  return recommendations;
}

/**
 * Write data to file
 */
function writeToFile(filePath: string, data: string): void {
  fs.writeFileSync(filePath, data, 'utf-8');
  console.log(`${colors.green}Wrote report to ${filePath}${colors.reset}`);
}

/**
 * Main function to run the analysis
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}TypeScript Error Categorization Tool${colors.reset}\n`);
  
  // Run TypeScript and get errors
  const output = runTypeScript();
  
  // Parse error output
  const errors = parseErrorOutput(output);
  
  // Calculate statistics
  calculateStatistics(errors);
  
  // Generate error report
  const report = generateErrorReport(errors);
  writeToFile('typescript-error-report.md', report);
  
  // Generate fix recommendations
  const recommendations = generateFixRecommendations(errors);
  writeToFile('typescript-error-fixes.md', recommendations);
  
  // Create sorted error list by severity and category
  const errorsBySeverity = {
    critical: [] as ErrorInfo[],
    high: [] as ErrorInfo[],
    medium: [] as ErrorInfo[],
    low: [] as ErrorInfo[],
  };
  
  for (const error of errors) {
    errorsBySeverity[error.severity].push(error);
  }
  
  // Sort errors within each severity by category
  for (const severity of Object.keys(errorsBySeverity) as Array<keyof typeof errorsBySeverity>) {
    errorsBySeverity[severity].sort((a, b) => a.category.localeCompare(b.category));
  }
  
  // Create detailed error list
  let errorList = `# TypeScript Errors by Severity and Category\n\n`;
  
  for (const severity of Object.keys(errorsBySeverity) as Array<keyof typeof errorsBySeverity>) {
    if (errorsBySeverity[severity].length === 0) continue;
    
    errorList += `## ${severity.toUpperCase()} Severity Errors (${errorsBySeverity[severity].length})\n\n`;
    
    // Group by category
    const errorsByCategory: Record<string, ErrorInfo[]> = {};
    for (const error of errorsBySeverity[severity]) {
      if (!errorsByCategory[error.category]) {
        errorsByCategory[error.category] = [];
      }
      errorsByCategory[error.category].push(error);
    }
    
    for (const [category, categoryErrors] of Object.entries(errorsByCategory)) {
      errorList += `### ${category} (${categoryErrors.length})\n\n`;
      errorList += `| File | Line | Error |\n`;
      errorList += `|------|------|-------|\n`;
      
      for (const error of categoryErrors) {
        const relativePath = path.relative(process.cwd(), error.filePath);
        errorList += `| ${relativePath} | ${error.line} | ${error.message} |\n`;
      }
      
      errorList += `\n`;
    }
  }
  
  writeToFile('typescript-error-list.md', errorList);
  
  console.log(`${colors.green}${colors.bright}Analysis complete!${colors.reset}`);
  console.log(`${colors.blue}Total Errors: ${colors.reset}${stats.totalErrors}`);
  console.log(`${colors.blue}Files with Errors: ${colors.reset}${stats.filesWithErrors.size}`);
  console.log(`${colors.blue}Critical Errors: ${colors.reset}${stats.errorsBySeverity.critical}`);
  console.log(`${colors.blue}High Severity: ${colors.reset}${stats.errorsBySeverity.high}`);
  console.log(`${colors.blue}Medium Severity: ${colors.reset}${stats.errorsBySeverity.medium}`);
  console.log(`${colors.blue}Low Severity: ${colors.reset}${stats.errorsBySeverity.low}`);
  
  console.log(`\n${colors.green}Three reports were created:${colors.reset}`);
  console.log(`1. typescript-error-report.md - Overall statistics and analysis`);
  console.log(`2. typescript-error-fixes.md - Recommendations for fixing errors`);
  console.log(`3. typescript-error-list.md - Detailed list of all errors`);
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});