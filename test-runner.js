// test-runner.js - Custom test runner for TypeScript files with .ts imports
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The test file path is passed as an argument
const testFile = process.argv[2];

if (!testFile) {
  console.error('Error: Test file path not provided');
  process.exit(1);
}

// Construct the command to run with tsx
const tsxPath = path.join(__dirname, 'node_modules', '.bin', 'tsx');
const args = [testFile];

// Spawn the tsx process to run the test
const tsxProcess = spawn(tsxPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-specifier-resolution=node'
  }
});

// Handle process exit
tsxProcess.on('exit', (code) => {
  process.exit(code);
});