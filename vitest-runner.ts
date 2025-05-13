#!/usr/bin/env node
/**
 * Custom Vitest Runner
 * 
 * This script runs Vitest tests with the correct Node.js options
 * to handle TypeScript import resolution with .ts extensions.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Set NODE_OPTIONS environment variable
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get Vitest arguments
const args = process.argv.slice(2);

// Create command args
const commandArgs: any[] = ['vitest', ...args];

// Run Vitest with proper options
const vitestProcess = spawn('npx', commandArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-specifier-resolution=node'
  }
});

// Handle process exit
vitestProcess.on('exit', (code) => {
  process.exit(code);
});