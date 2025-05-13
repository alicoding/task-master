#!/usr/bin/env node
/**
 * Migrate Tests to Vitest
 * 
 * This script helps migrate tests from uvu to Vitest by:
 * 1. Finding all test files
 * 2. Creating vitest versions
 * 3. Running tests with Vitest
 * 
 * It allows gradual migration of tests while maintaining existing tests.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Command line arguments
const args = process.argv.slice(2);
const migrateFilePath = args[0]; // Specific file to migrate
const skipRun = args.includes('--skip-run');

/**
 * Find all test files in a directory
 * @param {string} dir Directory to search
 * @param {RegExp} pattern File pattern to match
 * @returns {Promise<string[]>} List of file paths
 */
async function findFiles(dir, pattern) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      return findFiles(fullPath, pattern);
    } else if (entry.isFile() && pattern.test(entry.name)) {
      return [fullPath];
    }
    
    return [];
  }));
  
  return files.flat();
}

/**
 * Convert a uvu test file to use the Vitest adapter
 * @param {string} filePath Path to the test file
 * @returns {Promise<string>} Path to the converted file
 */
async function convertTestFile(filePath) {
  console.log(`Converting ${filePath}...`);
  
  // Read the file content
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Create the output path
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, '.test.ts');
  const outputPath = path.join(dir, `${basename}.vitest.test.ts`);
  
  // Replace imports
  let newContent = content.replace(
    /import\s+{\s*test\s*}(\s+from\s+['"]uvu['"])/g,
    `import { test, assert } from '../vitest-adapter.ts'`
  );
  
  // Replace assert imports
  newContent = newContent.replace(
    /import\s+\*\s+as\s+assert(\s+from\s+['"]uvu\/assert['"])/g,
    `// assert is imported from vitest-adapter`
  );
  
  // Add comment at the top
  newContent = `/**
 * ${path.basename(outputPath)} - Converted from uvu to Vitest
 * 
 * This file uses the Vitest adapter to run the original test with minimal changes.
 */

${newContent}`;
  
  // Write the output file
  await fs.writeFile(outputPath, newContent, 'utf-8');
  console.log(`Converted test saved to ${outputPath}`);
  
  return outputPath;
}

/**
 * Run the converted test with Vitest
 * @param {string} filePath Path to the test file
 * @returns {Promise<boolean>} Whether the test passed
 */
async function runTest(filePath) {
  console.log(`Running test ${filePath}...`);
  
  return new Promise((resolve) => {
    const vitest = spawn('npx', ['vitest', 'run', filePath, '--config', './vitest-simple.config.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-specifier-resolution=node'
      }
    });
    
    vitest.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('Migrating tests to Vitest...');
    
    // Find test files
    let testFiles;
    if (migrateFilePath) {
      // Migrate a specific file
      testFiles = [path.resolve(process.cwd(), migrateFilePath)];
    } else {
      // Find all test files
      testFiles = await findFiles(path.join(rootDir, 'test'), /\.test\.ts$/);
    }
    
    console.log(`Found ${testFiles.length} test files`);
    
    // Convert and run each test
    for (const filePath of testFiles) {
      // Skip files that are already Vitest tests
      if (filePath.includes('.vitest.test.ts')) {
        console.log(`Skipping already converted test: ${filePath}`);
        continue;
      }
      
      const convertedPath = await convertTestFile(filePath);
      
      if (!skipRun) {
        const success = await runTest(convertedPath);
        console.log(`Test ${success ? 'passed' : 'failed'}: ${convertedPath}`);
      }
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error migrating tests:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);