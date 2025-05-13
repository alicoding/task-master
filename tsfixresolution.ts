#!/usr/bin/env node
/**
 * TS Import Resolution Fix Tool
 *
 * This script enables TypeScript tests to run with import resolution
 * without requiring .js extensions in import statements.
 */

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Handle test command with no specific test file
let testArgs = process.argv.slice(2);

// If only "test" is specified without specific files, run all test files
if (testArgs.length === 1 && testArgs[0] === 'test') {
  // Find all test files in the test directory
  const testFilesArgs = [];

  // Recurse through test directory to find all test files
  function findTestFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && file !== 'node_modules') {
        findTestFiles(filePath);
      } else if (file.endsWith('.test.ts')) {
        testFilesArgs.push(filePath);
      }
    }
  }

  findTestFiles('./test');

  if (testFilesArgs.length === 0) {
    console.error('No test files found. Please check your test directory.');
    process.exit(1);
  }

  console.log(`Running ${testFilesArgs.length} test files...`);
  testArgs = testFilesArgs;
}

// Construct the command to run tests
const tsxBin = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const result = spawnSync(tsxBin,
  ['--tsconfig', 'tsconfig.json', ...testArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    }
  }
);

// Exit with the same code as the child process
process.exit(result.status);