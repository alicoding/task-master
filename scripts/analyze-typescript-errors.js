#!/usr/bin/env node

/**
 * TypeScript Error Analyzer
 * 
 * This script categorizes and counts all TypeScript errors to create a systematic plan
 * for fixing them by pattern rather than individual instances.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Run TypeScript compiler to get errors
function getTypeScriptErrors() {
  try {
    // Redirect stderr to stdout to capture all TypeScript error output
    const output = execSync('npx tsc --noEmit 2>&1', {
      encoding: 'utf8',
      stdio: 'pipe',
      shell: true
    });
    return output;
  } catch (error) {
    // TypeScript returns exit code 2 when there are errors
    // But we still want to capture the error output
    if (error.stdout) {
      return error.stdout;
    }
    console.error('Error running TypeScript compiler:', error.message);
    return '';
  }
}

// Parse errors into structured format
function parseErrors(errorOutput) {
  const errorLines = errorOutput.split('\n').filter(line => line.trim());
  const errors = [];

  for (const line of errorLines) {
    // Extract file path, line, column, error code, and message
    const match = line.match(/([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
    if (match) {
      const [, filePath, lineNum, colNum, errorCode, message] = match;
      errors.push({
        filePath: filePath.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(colNum, 10),
        code: errorCode,
        message: message.trim()
      });
    }
  }

  return errors;
}

// Categorize errors by pattern
function categorizeErrors(errors) {
  const categories = {
    // Type Assertion Issues
    typeAssertions: {
      count: 0,
      pattern: /(is not assignable to parameter of type|is not assignable to type)/i,
      description: "Type assertion issues (wrong or missing type assertions)",
      examples: [],
      files: new Set()
    },
    
    // Import Issues
    importErrors: {
      count: 0,
      pattern: /(has no exported member|Cannot find module|Cannot find name)/i,
      description: "Import errors (missing or wrong imports)",
      examples: [],
      files: new Set()
    },
    
    // Parameter Count Mismatches
    parameterCount: {
      count: 0,
      pattern: /Expected \d+-\d+ arguments, but got \d+/i,
      description: "Parameter count mismatches (wrong number of arguments)",
      examples: [],
      files: new Set()
    },
    
    // Property Access Issues
    propertyAccess: {
      count: 0,
      pattern: /(Property .* does not exist|cannot be used to index)/i,
      description: "Property access issues (accessing non-existent properties)",
      examples: [],
      files: new Set()
    },
    
    // Arithmetic Operation Issues
    arithmeticOperations: {
      count: 0,
      pattern: /(left-hand side|right-hand side) of an arithmetic operation must be/i,
      description: "Arithmetic operation issues (using non-numeric types in arithmetic)",
      examples: [],
      files: new Set()
    },
    
    // Syntax Errors
    syntaxErrors: {
      count: 0,
      pattern: /(expected|Identifier expected|',' expected|';' expected)/i,
      description: "Syntax errors (missing syntax elements)",
      examples: [],
      files: new Set()
    },

    // Any Type Issues
    anyTypeIssues: {
      count: 0,
      pattern: /implicitly has an 'any' type/i,
      description: "Implicit 'any' type issues",
      examples: [],
      files: new Set()
    },
    
    // Other Issues
    otherIssues: {
      count: 0,
      description: "Other uncategorized issues",
      examples: [],
      files: new Set()
    }
  };
  
  // Categorize each error
  for (const error of errors) {
    let categorized = false;
    
    for (const [category, info] of Object.entries(categories)) {
      if (category === 'otherIssues') continue; // Skip the catch-all category for now
      
      if (info.pattern && info.pattern.test(error.message)) {
        info.count++;
        info.files.add(error.filePath);
        
        // Store up to 5 examples for each category
        if (info.examples.length < 5) {
          info.examples.push({
            file: error.filePath,
            message: error.message,
            code: error.code
          });
        }
        
        categorized = true;
        break;
      }
    }
    
    // If not categorized, add to other issues
    if (!categorized) {
      categories.otherIssues.count++;
      categories.otherIssues.files.add(error.filePath);
      
      if (categories.otherIssues.examples.length < 5) {
        categories.otherIssues.examples.push({
          file: error.filePath,
          message: error.message,
          code: error.code
        });
      }
    }
  }
  
  return categories;
}

// Find most affected files
function findMostAffectedFiles(errors) {
  const fileErrorCounts = {};
  
  for (const error of errors) {
    fileErrorCounts[error.filePath] = (fileErrorCounts[error.filePath] || 0) + 1;
  }
  
  // Sort files by error count (descending)
  const sortedFiles = Object.entries(fileErrorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20); // Top 20 files
  
  return sortedFiles;
}

// Generate a Markdown report
function generateReport(errors, categories, mostAffectedFiles) {
  let report = `# TypeScript Error Analysis Report\n\n`;
  report += `## Summary\n\n`;
  report += `Total TypeScript Errors: ${errors.length}\n\n`;
  
  report += `## Error Categories\n\n`;
  
  // Add table of categories with counts and percentages
  report += `| Category | Count | % of Total | Description |\n`;
  report += `|----------|-------|------------|-------------|\n`;
  
  for (const [category, info] of Object.entries(categories)) {
    const percentage = ((info.count / errors.length) * 100).toFixed(1);
    report += `| ${category} | ${info.count} | ${percentage}% | ${info.description} |\n`;
  }
  
  report += `\n## Category Examples\n\n`;
  
  // Add examples for each category
  for (const [category, info] of Object.entries(categories)) {
    if (info.count === 0) continue;
    
    report += `### ${category} (${info.count} errors)\n\n`;
    report += `${info.description}\n\n`;
    report += `**Files Affected**: ${info.files.size} files\n\n`;
    report += `**Examples**:\n\n`;
    
    for (const example of info.examples) {
      report += `- **${example.code}** in \`${example.file}\`: ${example.message}\n`;
    }
    
    report += `\n`;
  }
  
  report += `## Most Affected Files\n\n`;
  report += `| File | Error Count |\n`;
  report += `|------|------------|\n`;
  
  for (const [file, count] of mostAffectedFiles) {
    report += `| ${file} | ${count} |\n`;
  }
  
  report += `\n## Recommended Fix Strategy\n\n`;
  
  // Add systematic fix strategy based on analysis
  report += `1. **Create Type Utils**: Create helper functions/types to handle common type issues\n`;
  report += `2. **Fix Import Structure**: Create a script to systematically fix import statements\n`;
  report += `3. **Add Type Assertions**: Create a script to add type assertions where needed\n`;
  report += `4. **Fix Parameter Mismatches**: Standardize function calls across the codebase\n`;
  report += `5. **Fix Property Access**: Update property access patterns (such as snake_case vs camelCase)\n`;
  report += `6. **Address Syntax Errors**: Fix any remaining syntax errors\n`;
  report += `7. **Add Type Annotations**: Add explicit type annotations for 'any' types\n`;
  
  return report;
}

// Main function
function main() {
  console.log('Analyzing TypeScript errors...');
  
  const errorOutput = getTypeScriptErrors();
  if (!errorOutput) {
    console.log('No TypeScript errors found! 🎉');
    return;
  }
  
  const errors = parseErrors(errorOutput);
  console.log(`Found ${errors.length} TypeScript errors`);
  
  const categories = categorizeErrors(errors);
  console.log('Categorized errors:');
  
  for (const [category, info] of Object.entries(categories)) {
    console.log(`  ${category}: ${info.count} errors (${info.files.size} files)`);
  }
  
  const mostAffectedFiles = findMostAffectedFiles(errors);
  console.log('Most affected files:');
  
  for (const [file, count] of mostAffectedFiles.slice(0, 5)) {
    console.log(`  ${file}: ${count} errors`);
  }
  
  const report = generateReport(errors, categories, mostAffectedFiles);
  
  fs.writeFileSync('TYPESCRIPT_ERROR_ANALYSIS.md', report);
  console.log('Generated report: TYPESCRIPT_ERROR_ANALYSIS.md');
}

main();