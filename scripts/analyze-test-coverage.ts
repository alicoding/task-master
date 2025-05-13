#!/usr/bin/env node
/**
 * Analyze Test Coverage
 * 
 * This script analyzes the current test coverage in the project and generates
 * a migration plan for converting uvu tests to Vitest.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Stats to collect
const stats: Record<string, any> = {
  totalFiles: 0,
  uvuTestFiles: 0,
  vitestTestFiles: 0,
  otherTestFiles: 0,
  totalTestsInUvu: 0,
  totalTestsInVitest: 0
};

// Test file categories
const categories: Record<string, any> = {
  core: {
    uvu: [],
    vitest: []
  },
  commands: {
    uvu: [],
    vitest: []
  },
  other: {
    uvu: [],
    vitest: []
  }
};

/**
 * Find all test files in a directory
 * @param {string} dir Directory to search
 * @returns {Promise<string[]>} List of file paths
 */
async function findTestFiles(dir: any): any {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return findTestFiles(fullPath);
    } else if (entry.isFile() && (
      fullPath.endsWith('.test.ts') || 
      fullPath.endsWith('.vitest.ts') || 
      fullPath.endsWith('.spec.ts')
    )) {
      return [fullPath];
    }
    
    return [];
  }));
  
  return files.flat();
}

/**
 * Check if a file is a Vitest test file
 * @param {string} content File content
 * @returns {boolean} True if it's a Vitest test file
 */
function isVitestFile(content: any): any {
  return content.includes('import { describe, it, expect') || 
         content.includes('from \'vitest\'');
}

/**
 * Check if a file is a uvu test file
 * @param {string} content File content
 * @returns {boolean} True if it's a uvu test file
 */
function isUvuFile(content: any): any {
  return content.includes('import { test } from \'uvu\'') || 
         content.includes('test.run()');
}

/**
 * Count the number of tests in a file
 * @param {string} content File content
 * @param {boolean} isVitest Whether the file is a Vitest file
 * @returns {number} Number of tests
 */
function countTests(content: any, isVitest: any): any {
  if (isVitest) {
    const itMatches = content.match(/it\s*\(\s*['"][^'"]+['"]/g);
    return itMatches ? itMatches.length : 0;
  } else {
    const testMatches = content.match(/test\s*\(\s*['"][^'"]+['"]/g);
    return testMatches ? testMatches.length : 0;
  }
}

/**
 * Categorize a test file
 * @param {string} filePath File path
 * @returns {string} Category (core, commands, other)
 */
function categorizeFile(filePath: any): any {
  if (filePath.includes('/core/')) {
    return 'core';
  } else if (filePath.includes('/commands/')) {
    return 'commands';
  } else {
    return 'other';
  }
}

/**
 * Generate a migration plan
 * @param {object} stats Statistics
 * @param {object} categories Test file categories
 * @returns {string} Migration plan
 */
function generateMigrationPlan(stats: any, categories: any): any {
  let plan = `# Test Migration Plan\n\n`;
  
  // Summary
  plan += `## Summary\n\n`;
  plan += `- Total test files: ${stats.totalFiles}\n`;
  plan += `- uvu test files: ${stats.uvuTestFiles}\n`;
  plan += `- Vitest test files: ${stats.vitestTestFiles}\n`;
  plan += `- Other test files: ${stats.otherTestFiles}\n`;
  plan += `- Total tests in uvu: ${stats.totalTestsInUvu}\n`;
  plan += `- Total tests in Vitest: ${stats.totalTestsInVitest}\n\n`;
  
  // Migration progress
  const migrationPercent = Math.round((stats.vitestTestFiles / stats.totalFiles) * 100);
  plan += `## Migration Progress\n\n`;
  plan += `- Migration progress: ${migrationPercent}%\n\n`;
  
  // Migration plan by category
  plan += `## Migration Plan\n\n`;
  
  // Core tests
  plan += `### Core\n\n`;
  plan += `*Core tests* are those in the \`/test/core/\` directory and test the core functionality of the application.\n\n`;
  plan += `#### Files to Convert\n\n`;
  if (categories.core.uvu.length > 0) {
    plan += `\`\`\`\n`;
    categories.core.uvu.forEach(file => {
      plan += `${file.path} (${file.tests} tests)\n`;
    });
    plan += `\`\`\`\n\n`;
  } else {
    plan += `All core files have been converted.\n\n`;
  }
  
  // Command tests
  plan += `### Commands\n\n`;
  plan += `*Command tests* are those in the \`/test/commands/\` directory and test the CLI commands.\n\n`;
  plan += `#### Files to Convert\n\n`;
  if (categories.commands.uvu.length > 0) {
    plan += `\`\`\`\n`;
    categories.commands.uvu.forEach(file => {
      plan += `${file.path} (${file.tests} tests)\n`;
    });
    plan += `\`\`\`\n\n`;
  } else {
    plan += `All command files have been converted.\n\n`;
  }
  
  // Other tests
  plan += `### Other\n\n`;
  plan += `*Other tests* are those in other directories or that don't fall into the previous categories.\n\n`;
  plan += `#### Files to Convert\n\n`;
  if (categories.other.uvu.length > 0) {
    plan += `\`\`\`\n`;
    categories.other.uvu.forEach(file => {
      plan += `${file.path} (${file.tests} tests)\n`;
    });
    plan += `\`\`\`\n\n`;
  } else {
    plan += `All other files have been converted.\n\n`;
  }
  
  // Recommendations
  plan += `## Recommendations\n\n`;
  
  if (stats.uvuTestFiles > 0) {
    plan += `1. Run the migration script for each category:\n\n`;
    plan += `\`\`\`bash\n`;
    plan += `# Migrate core tests\n`;
    if (categories.core.uvu.length > 0) {
      categories.core.uvu.slice(0, 3).forEach(file => {
        plan += `npm run test:migrate:file ${file.path}\n`;
      });
      if (categories.core.uvu.length > 3) {
        plan += `# ... and ${categories.core.uvu.length - 3} more\n`;
      }
    }
    
    plan += `\n# Migrate command tests\n`;
    if (categories.commands.uvu.length > 0) {
      categories.commands.uvu.slice(0, 3).forEach(file => {
        plan += `npm run test:migrate:file ${file.path}\n`;
      });
      if (categories.commands.uvu.length > 3) {
        plan += `# ... and ${categories.commands.uvu.length - 3} more\n`;
      }
    }
    
    plan += `\n# Migrate other tests\n`;
    if (categories.other.uvu.length > 0) {
      categories.other.uvu.slice(0, 3).forEach(file => {
        plan += `npm run test:migrate:file ${file.path}\n`;
      });
      if (categories.other.uvu.length > 3) {
        plan += `# ... and ${categories.other.uvu.length - 3} more\n`;
      }
    }
    plan += `\`\`\`\n\n`;
    
    plan += `2. Or use the automated migration for all files:\n\n`;
    plan += `\`\`\`bash\n`;
    plan += `npm run test:migrate:all\n`;
    plan += `\`\`\`\n\n`;
    
    plan += `3. Verify the migrated tests by running:\n\n`;
    plan += `\`\`\`bash\n`;
    plan += `npm test\n`;
    plan += `\`\`\`\n`;
  } else {
    plan += `All test files have been migrated. You can run the full test suite with:\n\n`;
    plan += `\`\`\`bash\n`;
    plan += `npm test\n`;
    plan += `\`\`\`\n`;
  }
  
  return plan;
}

/**
 * Main function
 */
async function main(): void {
  try {
    console.log('Analyzing test coverage...');
    
    // Find all test files
    const testFiles = await findTestFiles(path.join(rootDir, 'test'));
    stats.totalFiles = testFiles.length;
    
    // Analyze each file
    for (const filePath of testFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(rootDir, filePath);
      const category = categorizeFile(filePath);
      
      if (isVitestFile(content)) {
        stats.vitestTestFiles++;
        const tests = countTests(content, true);
        stats.totalTestsInVitest += tests;
        categories[category].vitest.push({ path: relativePath, tests });
      } else if (isUvuFile(content)) {
        stats.uvuTestFiles++;
        const tests = countTests(content, false);
        stats.totalTestsInUvu += tests;
        categories[category].uvu.push({ path: relativePath, tests });
      } else {
        stats.otherTestFiles++;
      }
    }
    
    // Generate a migration plan
    const plan = generateMigrationPlan(stats, categories);
    const planPath = path.join(rootDir, 'TEST_MIGRATION_PLAN.md');
    
    // Save the plan
    await fs.writeFile(planPath, plan, 'utf-8');
    
    console.log(`Migration plan saved to: ${planPath}`);
    console.log(`\nSummary:`);
    console.log(`- Total test files: ${stats.totalFiles}`);
    console.log(`- uvu test files: ${stats.uvuTestFiles}`);
    console.log(`- Vitest test files: ${stats.vitestTestFiles}`);
    console.log(`- Migration progress: ${Math.round((stats.vitestTestFiles / stats.totalFiles) * 100)}%`);
  } catch (error) {
    console.error('Error analyzing test coverage:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);